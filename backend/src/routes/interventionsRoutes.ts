import express from 'express';
import {
  getInterventions,
  getInterventionById,
  createIntervention,
  updateInterventionStatus,
  updateIntervention,
  deleteIntervention,
} from '../controllers/interventionsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// GET /api/interventions - Liste toutes les interventions
router.get('/', getInterventions);

// POST /api/interventions - Enregistre un nouveau rapport de maintenance
router.post('/', createIntervention);

// PATCH /api/interventions/:id/status - Met à jour le statut d'une intervention - DOIT être avant /:id
router.patch('/:id/status', updateInterventionStatus);

// PUT /api/interventions/:id - Met à jour les champs principaux d'une intervention
router.put('/:id', updateIntervention);

// GET /api/interventions/:id - Récupère une intervention par son ID
router.get('/:id', getInterventionById);

// DELETE /api/interventions/:id - Supprime une intervention
router.delete('/:id', deleteIntervention);

export default router;

