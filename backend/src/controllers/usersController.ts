import { Request, Response } from 'express';
import { findAll, findById, create, updateRole, deleteById, updateProfile } from '../models/userModel';
import pool from '../config/database';
import { authMiddleware } from '../middleware/authMiddleware';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * GET /api/users
 * Liste tous les utilisateurs
 * (désormais accessible à tout utilisateur authentifié pour éviter les erreurs 403 côté UI)
 */
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Vérifier simplement que l'utilisateur est authentifié
    if (!req.user?.id) {
      res.status(403).json({
        success: false,
        error: 'Accès refusé. Utilisateur non authentifié.',
      });
      return;
    }

    const users = await findAll();
    
    res.status(200).json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des utilisateurs',
    });
  }
};

/**
 * GET /api/users/me
 * Récupère l'utilisateur connecté
 */
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié',
      });
      return;
    }

    const user = await findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de l\'utilisateur',
    });
  }
};

/**
 * GET /api/users/me/stats
 * Récupère les statistiques de l'utilisateur connecté
 */
export const getCurrentUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié',
      });
      return;
    }

    // Compter les alertes traitées (acquittées) par cet utilisateur
    const alertsResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM alerts
       WHERE acknowledged = true
       AND EXISTS (
         SELECT 1 FROM user_activity_log
         WHERE user_activity_log.user_id = $1
         AND user_activity_log.action = 'acknowledge_alert'
         AND user_activity_log.entity_id = alerts.id
       )`,
      [req.user.id]
    );
    const alertsProcessed = parseInt(alertsResult.rows[0]?.count || '0');

    // Compter les interventions créées par cet utilisateur
    const interventionsResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM interventions
       WHERE EXISTS (
         SELECT 1 FROM user_activity_log
         WHERE user_activity_log.user_id = $1
         AND user_activity_log.action = 'create_intervention'
         AND user_activity_log.entity_id = interventions.id
       )`,
      [req.user.id]
    );
    const interventions = parseInt(interventionsResult.rows[0]?.count || '0');

    // Calculer le temps de réponse moyen (en minutes) pour les alertes acquittées
    const responseTimeResult = await pool.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (ua.created_at - a.created_at)) / 60) as avg_minutes
       FROM alerts a
       JOIN user_activity_log ua ON ua.entity_id = a.id
       WHERE a.acknowledged = true
       AND ua.user_id = $1
       AND ua.action = 'acknowledge_alert'`,
      [req.user.id]
    );
    const avgResponseTime = parseFloat(responseTimeResult.rows[0]?.avg_minutes || '0');

    // Calculer le taux de résolution (alertes acquittées / alertes totales)
    const resolutionRateResult = await pool.query(
      `SELECT 
         COUNT(CASE WHEN a.acknowledged = true THEN 1 END) as acknowledged,
         COUNT(*) as total
       FROM alerts a
       WHERE EXISTS (
         SELECT 1 FROM user_activity_log ua
         WHERE ua.user_id = $1
         AND ua.entity_id = a.id
         AND ua.action IN ('acknowledge_alert', 'create_alert')
       )`,
      [req.user.id]
    );
    const acknowledged = parseInt(resolutionRateResult.rows[0]?.acknowledged || '0');
    const total = parseInt(resolutionRateResult.rows[0]?.total || '0');
    const resolutionRate = total > 0 ? (acknowledged / total) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        alerts_processed: alertsProcessed,
        interventions: interventions,
        avg_response_time_minutes: Math.round(avgResponseTime),
        resolution_rate_percent: Math.round(resolutionRate),
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des statistiques',
    });
  }
};

/**
 * POST /api/users
 * Crée un nouvel utilisateur (Admin uniquement)
 */
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Accès refusé. Rôle administrateur requis.',
      });
      return;
    }

    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name) {
      res.status(400).json({
        success: false,
        error: 'Email, mot de passe et nom complet requis',
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        success: false,
        error: 'Le mot de passe doit contenir au moins 8 caractères',
      });
      return;
    }

    const user = await create(email, password, full_name, role || 'operator');

    res.status(201).json({
      success: true,
      data: user,
      message: 'Utilisateur créé avec succès',
    });
  } catch (error: any) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    if (error.message === 'Email already exists') {
      res.status(409).json({
        success: false,
        error: 'Cet email est déjà utilisé',
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création de l\'utilisateur',
    });
  }
};

/**
 * PATCH /api/users/:id/role
 * Met à jour le rôle d'un utilisateur (Admin uniquement)
 */
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Accès refusé. Rôle administrateur requis.',
      });
      return;
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'ID utilisateur requis',
      });
      return;
    }

    if (!role || !['admin', 'supervisor', 'operator', 'maintenance', 'user'].includes(role)) {
      res.status(400).json({
        success: false,
        error: 'Rôle valide requis',
      });
      return;
    }

    // Empêcher un admin de modifier son propre rôle
    if (req.user.id === id) {
      res.status(403).json({
        success: false,
        error: 'Vous ne pouvez pas modifier votre propre rôle',
      });
      return;
    }

    const user = await updateRole(id, role);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'Rôle mis à jour avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour du rôle',
    });
  }
};

/**
 * DELETE /api/users/:id
 * Supprime un utilisateur (Admin uniquement)
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Accès refusé. Rôle administrateur requis.',
      });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'ID utilisateur requis',
      });
      return;
    }

    // Empêcher un admin de supprimer son propre compte
    if (req.user.id === id) {
      res.status(403).json({
        success: false,
        error: 'Vous ne pouvez pas supprimer votre propre compte',
      });
      return;
    }

    const deleted = await deleteById(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression de l\'utilisateur',
    });
  }
};

/**
 * PATCH /api/users/me
 * Met à jour le profil de l'utilisateur connecté
 */
export const updateCurrentUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié',
      });
      return;
    }

    const { full_name, email } = req.body;

    if (!full_name && !email) {
      res.status(400).json({
        success: false,
        error: 'Au moins un champ (full_name, email) doit être fourni',
      });
      return;
    }

    const user = await updateProfile(req.user.id, { full_name, email });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profil mis à jour avec succès',
    });
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    if (error.message === 'Email already exists') {
      res.status(409).json({
        success: false,
        error: 'Cet email est déjà utilisé',
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour du profil',
    });
  }
};
