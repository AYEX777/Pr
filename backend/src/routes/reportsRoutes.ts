import express from 'express';
import {
  getReportsSummary,
  getProductionReport,
  getAlertsDistribution,
  getInterventionsTypes,
  getAvailabilityReport,
} from '../controllers/reportsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// GET /api/reports/summary - Génère un rapport de statistiques
router.get('/summary', getReportsSummary);

// GET /api/reports/production - Récupère les données de performance de production
router.get('/production', getProductionReport);

// GET /api/reports/alerts/distribution - Récupère la répartition des alertes
router.get('/alerts/distribution', getAlertsDistribution);

// GET /api/reports/interventions/types - Récupère la répartition des interventions
router.get('/interventions/types', getInterventionsTypes);

// GET /api/reports/availability - Récupère l'évolution de la disponibilité
router.get('/availability', getAvailabilityReport);

export default router;

