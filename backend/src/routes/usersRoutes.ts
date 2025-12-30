import express from 'express';
import {
  getUsers,
  getCurrentUser,
  getCurrentUserStats,
  createUser,
  updateUserRole,
  deleteUser,
  updateCurrentUserProfile,
} from '../controllers/usersController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// GET /api/users/me - Récupère l'utilisateur connecté
router.get('/me', getCurrentUser);

// GET /api/users/me/stats - Récupère les statistiques de l'utilisateur connecté
router.get('/me/stats', getCurrentUserStats);

// PATCH /api/users/me - Met à jour le profil de l'utilisateur connecté
router.patch('/me', updateCurrentUserProfile);

// GET /api/users - Liste tous les utilisateurs (Admin uniquement)
router.get('/', getUsers);

// POST /api/users - Crée un nouvel utilisateur (Admin uniquement)
router.post('/', createUser);

// PATCH /api/users/:id/role - Met à jour le rôle d'un utilisateur (Admin uniquement)
router.patch('/:id/role', updateUserRole);

// DELETE /api/users/:id - Supprime un utilisateur (Admin uniquement)
router.delete('/:id', deleteUser);

export default router;

