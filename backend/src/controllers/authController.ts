import { Request, Response } from 'express';
import { findByEmail, User } from '../models/userModel';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  id: string;
  email: string;
  full_name: string;
  role: string;
  token: string;
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validation des champs
    if (!email || !password) {
      res.status(400).json({ error: 'Email et mot de passe requis' });
      return;
    }

    // Recherche de l'utilisateur
    const user: User | null = await findByEmail(email);
    
    if (!user) {
      res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      return;
    }

    // Vérification du mot de passe
    let passwordMatch = false;
    
    // Utiliser password_hash si disponible, sinon password
    const passwordToCheck = user.password_hash || user.password;
    
    // Si le mot de passe est hashé (commence par $2a$ ou $2b$), utiliser bcrypt
    if (passwordToCheck && (passwordToCheck.startsWith('$2a$') || passwordToCheck.startsWith('$2b$'))) {
      passwordMatch = await bcrypt.compare(password, passwordToCheck);
    } else if (passwordToCheck) {
      // Sinon, comparaison simple pour les tests (à remplacer en production)
      passwordMatch = passwordToCheck === password;
    }

    if (!passwordMatch) {
      res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      return;
    }

    // Génération du token JWT
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // Réponse avec les données attendues par le frontend
    const response: LoginResponse = {
      id: user.id,
      email: user.email,
      full_name: user.full_name || user.name || '',
      role: user.role,
      token: token
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
  }
};

