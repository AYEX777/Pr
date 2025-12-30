import express from 'express';
import {
  getSensorThresholdsController,
  getLineSensorThresholdsController,
  updateSensorThresholdsController,
  calibrateSensorController,
} from '../controllers/sensorsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// GET /api/sensors/line/:lineId - Récupère tous les seuils d'alerte pour une ligne
router.get('/line/:lineId', getLineSensorThresholdsController);

// GET /api/sensors/:id/thresholds - Récupère les seuils d'alerte d'un capteur
router.get('/:id/thresholds', getSensorThresholdsController);

// PUT /api/sensors/:id/thresholds - Met à jour les seuils d'alerte d'un capteur
router.put('/:id/thresholds', updateSensorThresholdsController);

// POST /api/sensors/:id/calibrate - Enregistre une calibration pour un capteur
router.post('/:id/calibrate', calibrateSensorController);

export default router;



