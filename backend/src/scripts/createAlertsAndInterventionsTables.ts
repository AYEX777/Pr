import pool from '../config/database';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Crée les tables alerts et interventions
 */
const createTables = async () => {
  console.log('🌱 Création des tables alerts et interventions...');

  try {
    // Vérifier que la table production_lines existe
    const checkLinesTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'production_lines'
      )
    `);
    
    if (!checkLinesTable.rows[0].exists) {
      console.log('⚠️  La table production_lines n\'existe pas. Exécutez d\'abord seedLinesAndSensors.ts');
      return;
    }

    // Supprimer les tables si elles existent (pour repartir de zéro)
    await pool.query('DROP TABLE IF EXISTS alerts CASCADE');
    await pool.query('DROP TABLE IF EXISTS interventions CASCADE');
    console.log('🗑️  Anciennes tables supprimées (si elles existaient)');

    // Créer la table alerts
    await pool.query(`
      CREATE TABLE alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        line_id VARCHAR(50) NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
        message TEXT NOT NULL,
        acknowledged BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Table alerts créée');

    // Créer les index pour alerts (après la création de la table)
    await pool.query(`CREATE INDEX idx_alerts_line_id ON alerts(line_id)`);
    await pool.query(`
      CREATE INDEX idx_alerts_acknowledged ON alerts(acknowledged)
    `);
    await pool.query(`
      CREATE INDEX idx_alerts_created_at ON alerts(created_at)
    `);
    await pool.query(`
      CREATE INDEX idx_alerts_severity ON alerts(severity)
    `);

    // Créer la table interventions
    await pool.query(`
      CREATE TABLE interventions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        line_id VARCHAR(50) REFERENCES production_lines(id) ON DELETE SET NULL,
        description TEXT NOT NULL,
        technician_name TEXT NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed')),
        date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Table interventions créée');

    // Créer les index pour interventions (après la création de la table)
    await pool.query(`CREATE INDEX idx_interventions_line_id ON interventions(line_id)`);
    await pool.query(`CREATE INDEX idx_interventions_status ON interventions(status)`);
    await pool.query(`CREATE INDEX idx_interventions_date ON interventions(date)`);
    
    console.log('✅ Index pour interventions créés');

  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error);
    throw error;
  }
};

const run = async () => {
  await createTables();
  await pool.end();
  console.log('✅ Script terminé avec succès');
};

run();

