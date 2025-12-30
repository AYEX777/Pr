import pool from '../config/database';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Génère des données historiques pour les 16 capteurs (4 lignes x 4 capteurs)
 * Sur les 24 dernières heures, avec un point toutes les 15 minutes
 * Utilise UUID pour l'ID comme spécifié
 */
const seedHistory = async () => {
  console.log('🌱 Début du seed de l\'historique des capteurs...');

  try {
    // Supprimer la table si elle existe (pour repartir de zéro)
    await pool.query('DROP TABLE IF EXISTS sensor_readings CASCADE');

    // Créer la table avec UUID
    await pool.query(`
      CREATE TABLE sensor_readings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sensor_id VARCHAR(100) NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
        value DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Créer les index pour la performance
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_id ON sensor_readings(sensor_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sensor_readings_created_at ON sensor_readings(created_at)');

    console.log('✅ Table sensor_readings créée/vérifiée avec UUID');

    // Récupérer tous les capteurs
    const sensorsResult = await pool.query(
      'SELECT id, value, threshold FROM sensors ORDER BY line_id, type'
    );

    if (sensorsResult.rows.length === 0) {
      console.log('⚠️  Aucun capteur trouvé. Exécutez d\'abord seedLinesAndSensors.ts');
      return;
    }

    console.log(`📊 ${sensorsResult.rows.length} capteurs trouvés`);

    // Paramètres pour la génération
    const now = new Date();
    const hoursBack = 24;
    const intervalMinutes = 15;
    const totalPoints = (hoursBack * 60) / intervalMinutes; // 96 points (24h * 4 points/heure)

    let totalInserted = 0;

    // Pour chaque capteur
    for (const sensor of sensorsResult.rows) {
      const sensorId = sensor.id;
      const baseValue = parseFloat(sensor.value);
      const threshold = parseFloat(sensor.threshold);

      // Générer les données historiques avec fluctuations réalistes
      const values: Array<{ sensor_id: string; value: number; created_at: Date }> = [];
      let currentValue = baseValue;

      for (let i = totalPoints - 1; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);

        // Variation réaliste : ±5% avec tendance légère
        const variance = baseValue * 0.05;
        const change = (Math.random() - 0.5) * variance;

        // Lissage pour un graphique plus continu
        currentValue = currentValue + change;
        
        // S'assurer que la valeur reste dans des limites raisonnables
        currentValue = Math.max(0, Math.min(currentValue, threshold * 1.2));

        values.push({
          sensor_id: sensorId,
          value: parseFloat(currentValue.toFixed(2)),
          created_at: timestamp,
        });
      }

      // Insérer par batch pour de meilleures performances
      const batchSize = 50;
      for (let i = 0; i < values.length; i += batchSize) {
        const batch = values.slice(i, i + batchSize);
        const placeholders = batch.map((_, idx) => {
          const baseIdx = idx * 3;
          return `($${baseIdx + 1}, $${baseIdx + 2}, $${baseIdx + 3})`;
        }).join(', ');

        const valuesArray = batch.flatMap(v => [v.sensor_id, v.value, v.created_at]);

        await pool.query(
          `INSERT INTO sensor_readings (sensor_id, value, created_at) VALUES ${placeholders}`,
          valuesArray
        );
      }

      totalInserted += values.length;
      console.log(`   ✅ ${values.length} points générés pour ${sensorId}`);
    }

    console.log(`\n✅ Seed terminé avec succès !`);
    console.log(`📊 Total : ${totalInserted} points d'historique insérés`);

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('✅ Connexion fermée');
  }
};

seedHistory();



