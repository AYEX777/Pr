import pool from '../config/database';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Crée la table user_activity_log pour tracker les actions des utilisateurs
 */
const createUserActivityLogTable = async () => {
  console.log('🌱 Création de la table user_activity_log...');

  try {
    // Créer la table user_activity_log
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_activity_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50),
        entity_id VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Créer les index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_activity_log_action ON user_activity_log(action)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_activity_log_entity ON user_activity_log(entity_type, entity_id)
    `);

    console.log('✅ Table user_activity_log créée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table:', error);
    throw error;
  }
};

const run = async () => {
  await createUserActivityLogTable();
  await pool.end();
  console.log('✅ Script terminé avec succès');
};

run();



