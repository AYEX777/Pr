import pool from '../config/database';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Seed des alertes et interventions de test
 */
const seedAlertsAndInterventions = async () => {
  console.log('🌱 Début du seed des alertes et interventions...');

  try {
    // Vérifier que les lignes existent
    const linesResult = await pool.query('SELECT id FROM production_lines ORDER BY name');
    
    if (linesResult.rows.length === 0) {
      console.log('⚠️  Aucune ligne trouvée. Exécutez d\'abord seedLinesAndSensors.ts');
      return;
    }

    const lineIds = linesResult.rows.map(row => row.id);
    console.log(`📊 ${lineIds.length} lignes trouvées: ${lineIds.join(', ')}`);

    // Vérifier que les tables existent
    const alertsTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'alerts'
      )
    `);
    
    if (!alertsTableCheck.rows[0].exists) {
      console.log('⚠️  La table alerts n\'existe pas. Exécutez d\'abord createAlertsAndInterventionsTables.ts');
      return;
    }

    // Supprimer les données existantes (pour repartir de zéro)
    await pool.query('DELETE FROM alerts');
    await pool.query('DELETE FROM interventions');
    console.log('🗑️  Anciennes données supprimées');

    // Insérer 3 alertes non traitées
    const alerts = [
      {
        line_id: lineIds[0] || 'line-A', // Ligne A
        severity: 'critical',
        message: 'Température critique détectée - Ligne A',
        acknowledged: false,
      },
      {
        line_id: lineIds[1] || 'line-B', // Ligne B
        severity: 'critical',
        message: 'Pression élevée - Ligne B',
        acknowledged: false,
      },
      {
        line_id: lineIds[2] || 'line-C', // Ligne C
        severity: 'warning',
        message: 'Vibration anormale détectée - Ligne C',
        acknowledged: false,
      },
    ];

    for (const alert of alerts) {
      await pool.query(
        `INSERT INTO alerts (line_id, severity, message, acknowledged, created_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [alert.line_id, alert.severity, alert.message, alert.acknowledged]
      );
    }
    console.log(`✅ ${alerts.length} alertes insérées`);

    // Insérer 2 exemples d'interventions terminées
    const interventions = [
      {
        line_id: lineIds[0] || 'line-A',
        description: 'Maintenance préventive - Vérification et nettoyage des capteurs de pression et température',
        technician_name: 'Younes Jeddou',
        status: 'completed',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours
      },
      {
        line_id: lineIds[1] || 'line-B',
        description: 'Remplacement du filtre principal suite à détection de bouchage',
        technician_name: 'Mohammed Tahiri',
        status: 'completed',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Il y a 1 jour
      },
    ];

    for (const intervention of interventions) {
      await pool.query(
        `INSERT INTO interventions (line_id, description, technician_name, status, date, created_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [
          intervention.line_id,
          intervention.description,
          intervention.technician_name,
          intervention.status,
          intervention.date,
        ]
      );
    }
    console.log(`✅ ${interventions.length} interventions insérées`);

    console.log('\n✅ Seed terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('✅ Connexion fermée');
  }
};

seedAlertsAndInterventions();



