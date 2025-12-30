import { Request, Response } from 'express';
import { findAll, findById, create, updateStatus, deleteById, updateIntervention as updateInterventionModel } from '../models/interventionsModel';

/**
 * GET /api/interventions
 * Liste toutes les interventions
 */
export const getInterventions = async (req: Request, res: Response): Promise<void> => {
  try {
    const interventions = await findAll();
    
    res.status(200).json({
      success: true,
      data: interventions,
      count: interventions.length,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des interventions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des interventions',
    });
  }
};

/**
 * GET /api/interventions/:id
 * Récupère une intervention par son ID
 */
export const getInterventionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'ID d\'intervention requis',
      });
      return;
    }

    const intervention = await findById(id);

    if (!intervention) {
      res.status(404).json({
        success: false,
        error: 'Intervention non trouvée',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: intervention,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'intervention:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de l\'intervention',
    });
  }
};

/**
 * POST /api/interventions
 * Enregistre un nouveau rapport de maintenance
 */
export const createIntervention = async (req: Request, res: Response): Promise<void> => {
  try {
    const { line_id, description, technician_name, status, date } = req.body;

    if (!description || !technician_name) {
      res.status(400).json({
        success: false,
        error: 'Description et nom du technicien requis',
      });
      return;
    }

    const interventionStatus = status || 'planned';
    const interventionDate = date ? new Date(date) : new Date();

    const intervention = await create(
      line_id || null,
      description,
      technician_name,
      interventionStatus as 'planned' | 'in_progress' | 'completed',
      interventionDate
    );

    res.status(201).json({
      success: true,
      data: intervention,
      message: 'Intervention créée avec succès',
    });
  } catch (error: any) {
    console.error('Erreur lors de la création de l\'intervention:', error);
    
    // Afficher l'erreur détaillée pour le débogage
    const errorMessage = error?.message || 'Erreur serveur lors de la création de l\'intervention';
    const errorCode = error?.code;
    
    console.error('Détails de l\'erreur:', {
      message: errorMessage,
      code: errorCode,
      stack: error?.stack,
    });
    
    // Si c'est une erreur de contrainte de base de données, retourner un message plus spécifique
    if (errorCode === '23503') { // Foreign key violation
      res.status(400).json({
        success: false,
        error: 'Ligne de production invalide ou inexistante',
      });
      return;
    }
    
    if (errorCode === '23502') { // Not null violation
      res.status(400).json({
        success: false,
        error: 'Champ requis manquant: ' + errorMessage,
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * PATCH /api/interventions/:id/status
 * Met à jour le statut d'une intervention
 */
export const updateInterventionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'ID d\'intervention requis',
      });
      return;
    }

    if (!status || !['planned', 'in_progress', 'completed'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Statut valide requis (planned, in_progress, completed)',
      });
      return;
    }

    const intervention = await updateStatus(id, status as 'planned' | 'in_progress' | 'completed');

    if (!intervention) {
      res.status(404).json({
        success: false,
        error: 'Intervention non trouvée',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: intervention,
      message: 'Statut de l\'intervention mis à jour avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour du statut',
    });
  }
};

/**
 * PUT /api/interventions/:id
 * Met à jour les champs principaux d'une intervention
 */
export const updateIntervention = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { line_id, description, technician_name, status, date } = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'ID d\'intervention requis',
      });
      return;
    }

    if (
      line_id === undefined &&
      description === undefined &&
      technician_name === undefined &&
      status === undefined &&
      date === undefined
    ) {
      res.status(400).json({
        success: false,
        error: 'Aucun champ à mettre à jour',
      });
      return;
    }

    if (status !== undefined && !['planned', 'in_progress', 'completed'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Statut valide requis (planned, in_progress, completed)',
      });
      return;
    }

    const updated = await updateInterventionModel(id, {
      line_id: line_id ?? undefined,
      description,
      technician_name,
      status,
      date: date ? new Date(date) : undefined,
    });

    if (!updated) {
      res.status(404).json({
        success: false,
        error: 'Intervention non trouvée',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Intervention mise à jour avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'intervention:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour de l\'intervention',
    });
  }
};

/**
 * DELETE /api/interventions/:id
 * Supprime une intervention
 */
export const deleteIntervention = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'ID d\'intervention requis',
      });
      return;
    }

    const deleted = await deleteById(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Intervention non trouvée',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Intervention supprimée avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'intervention:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression de l\'intervention',
    });
  }
};
