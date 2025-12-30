import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * GET /api/history
 * Récupère l'historique général (alertes + interventions + événements)
 */
export const getHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, startDate, endDate, limit = 100 } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 jours par défaut
    const end = endDate ? new Date(endDate as string) : new Date();

    const historyEvents: any[] = [];

    // Récupérer les alertes
    if (!type || type === 'alert' || type === 'all') {
      const alertsQuery = `
        SELECT 
          id,
          line_id as entity_id,
          'alert' as type,
          severity as level,
          message as title,
          message as description,
          created_at as timestamp,
          acknowledged
        FROM alerts
        WHERE created_at >= $1 AND created_at <= $2
        ORDER BY created_at DESC
        LIMIT $3
      `;
      const alertsResult = await pool.query(alertsQuery, [start, end, limit]);
      alertsResult.rows.forEach(row => {
        historyEvents.push({
          id: row.id,
          type: 'alert',
          level: row.level,
          title: row.title,
          description: row.description,
          lineId: row.entity_id,
          timestamp: row.timestamp,
          acknowledged: row.acknowledged,
        });
      });
    }

    // Récupérer les interventions
    if (!type || type === 'intervention' || type === 'all') {
      const interventionsQuery = `
        SELECT 
          id,
          line_id as entity_id,
          'intervention' as type,
          'info' as level,
          description as title,
          description,
          technician_name as user,
          status,
          date as timestamp
        FROM interventions
        WHERE date >= $1 AND date <= $2
        ORDER BY date DESC
        LIMIT $3
      `;
      const interventionsResult = await pool.query(interventionsQuery, [start, end, limit]);
      interventionsResult.rows.forEach(row => {
        historyEvents.push({
          id: row.id,
          type: 'intervention',
          level: 'info',
          title: row.title,
          description: row.description,
          lineId: row.entity_id,
          user: row.user,
          status: row.status,
          timestamp: row.timestamp,
        });
      });
    }

    // Récupérer les événements d'activité utilisateur (user_activity_log)
    if (!type || type === 'info' || type === 'all') {
      const activityQuery = `
        SELECT 
          ua.id,
          ua.entity_id,
          'info' as type,
          'info' as level,
          ua.description as title,
          ua.description,
          u.full_name as user,
          ua.action,
          ua.created_at as timestamp
        FROM user_activity_log ua
        -- Casts explicites pour éviter les problèmes de types (uuid vs varchar)
        JOIN users u ON u.id::text = ua.user_id::text
        WHERE ua.created_at >= $1 AND ua.created_at <= $2
        ORDER BY ua.created_at DESC
        LIMIT $3
      `;
      const activityResult = await pool.query(activityQuery, [start, end, limit]);
      activityResult.rows.forEach(row => {
        historyEvents.push({
          id: row.id,
          type: 'info',
          level: 'info',
          title: row.title,
          description: row.description,
          user: row.user,
          action: row.action,
          timestamp: row.timestamp,
        });
      });
    }

    // Trier par timestamp décroissant
    historyEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limiter le nombre total
    const limitedEvents = historyEvents.slice(0, parseInt(limit as string));

    res.status(200).json({
      success: true,
      data: limitedEvents,
      count: limitedEvents.length,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de l\'historique',
    });
  }
};

/**
 * POST /api/history/events
 * Crée un nouvel événement d'historique (info)
 */
export const createHistoryEvent = async (req: Request & { user?: { id: string } }, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié',
      });
      return;
    }

    const { description, entity_type, entity_id, timestamp } = req.body as {
      description?: string;
      entity_type?: string;
      entity_id?: string;
      timestamp?: string;
    };

    if (!description) {
      res.status(400).json({
        success: false,
        error: 'Description requise',
      });
      return;
    }

    const createdAt = timestamp ? new Date(timestamp) : new Date();

    const result = await pool.query(
      `INSERT INTO user_activity_log (user_id, action, entity_type, entity_id, description, created_at)
       VALUES ($1, 'create_event', $2, $3, $4, $5)
       RETURNING id, user_id, action, entity_type, entity_id, description, created_at`,
      [req.user.id, entity_type || null, entity_id || null, description, createdAt]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].id,
        type: 'info',
        level: 'info',
        title: description,
        description: description,
        timestamp: result.rows[0].created_at,
      },
      message: 'Événement créé avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création de l\'événement',
    });
  }
};

/**
 * PUT /api/history/events/:id
 * Met à jour un événement d'historique (description et/ou date)
 * Seuls les événements créés par l'utilisateur courant sont modifiables.
 */
export const updateHistoryEvent = async (
  req: Request & { user?: { id: string } },
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié',
      });
      return;
    }

    const { id } = req.params;
    const { description, timestamp } = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'ID d\'événement requis',
      });
      return;
    }

    if (description === undefined && timestamp === undefined) {
      res.status(400).json({
        success: false,
        error: 'Au moins un champ (description, timestamp) doit être fourni',
      });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (timestamp !== undefined) {
      updates.push(`created_at = $${paramIndex}`);
      values.push(new Date(timestamp));
      paramIndex++;
    }

    values.push(id, req.user.id);

    const query = `
      UPDATE user_activity_log
      SET ${updates.join(', ')},
          updated_at = NOW()
      WHERE id = $${paramIndex}
        AND user_id = $${paramIndex + 1}
      RETURNING id, description, created_at
    `;

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        error: 'Événement non trouvé ou non autorisé',
      });
      return;
    }

    const row = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        id: row.id,
        type: 'info',
        level: 'info',
        title: row.description,
        description: row.description,
        timestamp: row.created_at,
      },
      message: 'Événement mis à jour avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour de l\'événement',
    });
  }
};

/**
 * DELETE /api/history/events/:id
 * Supprime un événement d'historique (entrée dans user_activity_log)
 * Seuls les événements créés par l'utilisateur courant sont supprimables.
 */
export const deleteHistoryEvent = async (
  req: Request & { user?: { id: string } },
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié',
      });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'ID d\'événement requis',
      });
      return;
    }

    const result = await pool.query(
      `DELETE FROM user_activity_log 
       WHERE id = $1 
       AND user_id = $2`,
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        error: 'Événement non trouvé ou non autorisé',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Événement supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression de l\'événement',
    });
  }
};
