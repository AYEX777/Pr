import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware d'authentification
 * Vérifie la présence et la validité du token JWT
 */
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'Token d\'authentification manquant',
      });
      return;
    }

    // Format attendu: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: 'Format de token invalide. Utilisez: Bearer <token>',
      });
      return;
    }

    const token = parts[1];

    // Vérifier et décoder le token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        id: string;
        email: string;
        role: string;
      };

      // Ajouter les informations de l'utilisateur à la requête
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      // Passer au middleware suivant
      next();
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        error: 'Token invalide ou expiré',
      });
      return;
    }
  } catch (error) {
    console.error('Erreur dans le middleware d\'authentification:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la vérification de l\'authentification',
    });
  }
};



