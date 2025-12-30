import { Request, Response } from 'express';
import {
  getSensorThresholds,
  getLineSensorThresholds,
  updateSensorThresholds,
  recordCalibration,
} from '../models/sensorsModel';

/**
 * GET /api/sensors/:id/thresholds
 * Récupère les seuils d'alerte d'un capteur
 */
export const getSensorThresholdsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'ID capteur requis',
      });
      return;
    }

    const thresholds = await getSensorThresholds(id);

    if (!thresholds) {
      res.status(404).json({
        success: false,
        error: 'Capteur non trouvé',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: thresholds,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des seuils:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des seuils',
    });
  }
};

/**
 * GET /api/sensors/line/:lineId
 * Récupère tous les seuils d'alerte pour une ligne
 */
export const getLineSensorThresholdsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lineId } = req.params;

    if (!lineId) {
      res.status(400).json({
        success: false,
        error: 'ID ligne requis',
      });
      return;
    }

    const thresholds = await getLineSensorThresholds(lineId);

    res.status(200).json({
      success: true,
      data: thresholds,
      count: thresholds.length,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des seuils de ligne:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des seuils',
    });
  }
};

/**
 * PUT /api/sensors/:id/thresholds
 * Met à jour les seuils d'alerte d'un capteur
 */
export const updateSensorThresholdsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      min_warning,
      max_warning,
      min_critical,
      max_critical,
      normal_min,
      normal_max,
      threshold_enabled,
    } = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'ID capteur requis',
      });
      return;
    }

    const thresholds = await updateSensorThresholds(id, {
      min_warning,
      max_warning,
      min_critical,
      max_critical,
      normal_min,
      normal_max,
      threshold_enabled,
    });

    if (!thresholds) {
      res.status(404).json({
        success: false,
        error: 'Capteur non trouvé',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: thresholds,
      message: 'Seuils mis à jour avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des seuils:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour des seuils',
    });
  }
};

/**
 * POST /api/sensors/:id/calibrate
 * Enregistre une calibration pour un capteur
 */
export const calibrateSensorController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { accuracy, next_calibration } = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'ID capteur requis',
      });
      return;
    }

    if (!accuracy || accuracy < 0 || accuracy > 100) {
      res.status(400).json({
        success: false,
        error: 'Précision valide requise (0-100)',
      });
      return;
    }

    const nextCalibrationDate = next_calibration ? new Date(next_calibration) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 jours par défaut

    const sensor = await recordCalibration(id, accuracy, nextCalibrationDate);

    if (!sensor) {
      res.status(404).json({
        success: false,
        error: 'Capteur non trouvé',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: sensor,
      message: 'Calibration enregistrée avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la calibration:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'enregistrement de la calibration',
    });
  }
};



