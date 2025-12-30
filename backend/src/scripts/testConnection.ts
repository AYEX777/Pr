import pool from '../config/database';
import * as dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  try {
    console.log('🔌 Test de connexion à la base de données...');
    
    // Test de connexion
    const client = await pool.connect();
    console.log('✅ Connexion à la base de données réussie !');
    
    // Test de requête simple
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`✅ Requête test réussie. Heure serveur: ${result.rows[0].current_time}`);
    
    // Vérifier la table users
    const usersTable = await client.query(`
      SELECT COUNT(*) as count FROM users
    `);
    console.log(`✅ Table users accessible. Nombre d'utilisateurs: ${usersTable.rows[0].count}`);
    
    // Vérifier la table production_lines
    const linesTable = await client.query(`
      SELECT COUNT(*) as count FROM production_lines
    `);
    console.log(`✅ Table production_lines accessible. Nombre de lignes: ${linesTable.rows[0].count}`);
    
    // Vérifier la table sensors
    const sensorsTable = await client.query(`
      SELECT COUNT(*) as count FROM sensors
    `);
    console.log(`✅ Table sensors accessible. Nombre de capteurs: ${sensorsTable.rows[0].count}`);
    
    // Vérifier la table sensor_readings
    const readingsTable = await client.query(`
      SELECT COUNT(*) as count FROM sensor_readings
    `);
    console.log(`✅ Table sensor_readings accessible. Nombre de lectures: ${readingsTable.rows[0].count}`);
    
    client.release();
    console.log('\n✅ Tous les tests de connexion réussis !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test de connexion:', error);
  } finally {
    await pool.end();
  }
};

testConnection();



