import pool from '../config/database';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Ajoute les colonnes nécessaires pour les seuils d'alerte détaillés
 */
const addSensorThresholdColumns = async () => {
  console.log('🌱 Ajout des colonnes de seuils d\'alerte aux capteurs...');

  try {
    // Ajouter les colonnes pour les seuils d'alerte détaillés
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

    // Initialiser les valeurs par défaut basées sur le threshold existant
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

    console.log('✅ Colonnes de seuils d\'alerte ajoutées et initialisées');
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des colonnes:', error);
    throw error;
  }
};

const run = async () => {
  await addSensorThresholdColumns();
  await pool.end();
  console.log('✅ Script terminé avec succès');
};

run();



