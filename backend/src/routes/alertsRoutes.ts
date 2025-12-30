import express from 'express';
import { getAlerts, getAllAlerts, acknowledgeAlert, getAlertById } from '../controllers/alertsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// GET /api/alerts/all - Récupère toutes les alertes (acquittées et non acquittées) - DOIT être avant /:id
router.get('/all', getAllAlerts);

// GET /api/alerts - Récupère toutes les alertes non acquittées
router.get('/', getAlerts);

// PATCH /api/alerts/:id/acknowledge - Marque une alerte comme acquittée - DOIT être avant /:id
router.patch('/:id/acknowledge', acknowledgeAlert);

// GET /api/alerts/:id - Récupère une alerte par son ID
router.get('/:id', getAlertById);

export default router;

