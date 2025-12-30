import express from 'express';
import { getAllLines, getLineById, getComparativeHistory } from '../controllers/linesController';
import { getLineHistory } from '../controllers/linesController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// GET /api/lines - Récupère toutes les lignes avec leurs capteurs
router.get('/', getAllLines);

// GET /api/lines/history/comparative - Récupère l'historique comparatif des scores
router.get('/history/comparative', getComparativeHistory);

// GET /api/lines/:id/history - Récupère l'historique des 4 capteurs d'une ligne
router.get('/:id/history', getLineHistory);

// GET /api/lines/:id - Récupère une ligne spécifique avec ses capteurs
router.get('/:id', getLineById);

export default router;

