import express from 'express';
import { getHistory, createHistoryEvent, updateHistoryEvent, deleteHistoryEvent } from '../controllers/historyController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// GET /api/history - Récupère l'historique général
router.get('/', getHistory);

// POST /api/history/events - Crée un nouvel événement d'historique
router.post('/events', createHistoryEvent);

// PUT /api/history/events/:id - Met à jour un événement d'historique
router.put('/events/:id', updateHistoryEvent);

// DELETE /api/history/events/:id - Supprime un événement d'historique (user_activity_log)
router.delete('/events/:id', deleteHistoryEvent);

export default router;



