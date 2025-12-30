import { Request, Response } from 'express';
import { findUnacknowledged, findAll, acknowledge, findById } from '../models/alertsModel';

/**
 * GET /api/alerts
 * Récupère toutes les alertes non acquittées
 */
export const getAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const alerts = await findUnacknowledged();
    
    res.status(200).json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des alertes',
    });
  }
};

/**
 * GET /api/alerts/all
 * Récupère toutes les alertes (acquittées et non acquittées)
 */
export const getAllAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const alerts = await findAll();
    
    res.status(200).json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de toutes les alertes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des alertes',
    });
  }
};

/**
 * PATCH /api/alerts/:id/acknowledge
 * Marque une alerte comme acquittée
 */
export const acknowledgeAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'ID d\'alerte requis',
      });
      return;
    }

    const alert = await acknowledge(id);

    if (!alert) {
      res.status(404).json({
        success: false,
        error: 'Alerte non trouvée',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: alert,
      message: 'Alerte acquittée avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de l\'acquittement de l\'alerte:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'acquittement de l\'alerte',
    });
  }
};

/**
 * GET /api/alerts/:id
 * Récupère une alerte par son ID
 */
export const getAlertById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'ID d\'alerte requis',
      });
      return;
    }

    const alert = await findById(id);

    if (!alert) {
      res.status(404).json({
        success: false,
        error: 'Alerte non trouvée',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'alerte:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de l\'alerte',
    });
  }
};



