import pool from '../config/database';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Script de migration pour ajouter toutes les colonnes et tables nécessaires
 */
const runMigrations = async () => {
  console.log('🚀 Démarrage des migrations...\n');

  try {
    // 1. Ajouter les colonnes de seuils d'alerte aux capteurs
    console.log('📊 Ajout des colonnes de seuils d\'alerte...');
    await pool.query(`
      ALTER TABLE sensors
      ADD COLUMN IF NOT EXISTS min_warning DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS max_warning DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS min_critical DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS max_critical DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS normal_min DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS normal_max DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS threshold_enabled BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS last_calibration TIMESTAMP,
      ADD COLUMN IF NOT EXISTS next_calibration TIMESTAMP,
      ADD COLUMN IF NOT EXISTS accuracy DECIMAL(5, 2) DEFAULT 95.0
    `);
    console.log('✅ Colonnes de seuils ajoutées');

    // 2. Initialiser les valeurs par défaut
    console.log('📝 Initialisation des valeurs par défaut...');
    await pool.query(`
      UPDATE sensors
      SET
        min_warning = CASE
          WHEN type = 'pressure' THEN threshold * 0.625
          WHEN type = 'temperature' THEN threshold * 0.588
          WHEN type = 'vibration' THEN threshold * 0.533
          WHEN type = 'level' THEN threshold * 0.667
          ELSE threshold * 0.6
        END,
        max_warning = CASE
          WHEN type = 'pressure' THEN threshold * 0.938
          WHEN type = 'temperature' THEN threshold * 0.941
          WHEN type = 'vibration' THEN threshold * 0.867
          WHEN type = 'level' THEN threshold * 0.944
          ELSE threshold * 0.9
        END,
        min_critical = CASE
          WHEN type = 'pressure' THEN threshold * 0.375
          WHEN type = 'temperature' THEN threshold * 0.471
          WHEN type = 'vibration' THEN threshold * 0.267
          WHEN type = 'level' THEN threshold * 0.556
          ELSE threshold * 0.4
        END,
        max_critical = CASE
          WHEN type = 'pressure' THEN threshold * 1.125
          WHEN type = 'temperature' THEN threshold * 1.059
          WHEN type = 'vibration' THEN threshold * 1.067
          WHEN type = 'level' THEN threshold * 1.056
          ELSE threshold * 1.1
        END,
        normal_min = CASE
          WHEN type = 'pressure' THEN threshold * 0.688
          WHEN type = 'temperature' THEN threshold * 0.647
          WHEN type = 'vibration' THEN threshold * 0.6
          WHEN type = 'level' THEN threshold * 0.722
          ELSE threshold * 0.65
        END,
        normal_max = CASE
          WHEN type = 'pressure' THEN threshold * 0.875
          WHEN type = 'temperature' THEN threshold * 0.882
          WHEN type = 'vibration' THEN threshold * 0.8
          WHEN type = 'level' THEN threshold * 0.889
          ELSE threshold * 0.85
        END,
        threshold_enabled = true
      WHERE min_warning IS NULL
    `);
    console.log('✅ Valeurs par défaut initialisées');

    // 3. Créer la table user_activity_log
    console.log('📋 Création de la table user_activity_log...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_activity_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50),
        entity_id VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table user_activity_log créée');

    // 4. Créer les index
    console.log('🔍 Création des index...');
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
    console.log('✅ Index créés');

    console.log('\n✅ Toutes les migrations ont été appliquées avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors des migrations:', error);
    throw error;
  }
};

const run = async () => {
  await runMigrations();
  await pool.end();
  console.log('✅ Script terminé');
};

run();


