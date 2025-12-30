-- Script SQL pour créer la table users
-- Exécutez ce script dans votre base de données PostgreSQL

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'operator',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index sur l'email pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Exemple d'insertion d'un utilisateur de test (mot de passe: "password123")
-- Le mot de passe doit être hashé avec bcrypt en production
-- Pour tester, vous pouvez utiliser un mot de passe en clair temporairement
-- INSERT INTO users (email, password, full_name, role) 
-- VALUES ('admin@prisk.local', 'password123', 'Admin User', 'admin');



