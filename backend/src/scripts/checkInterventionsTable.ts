/**
 * Script pour vérifier la structure de la table interventions
 */

import pool from '../config/database';
import * as dotenv from 'dotenv';

dotenv.config();

const checkTable = async () => {
  try {
    console.log('🔍 Vérification de la table interventions...\n');

    // Vérifier si la table existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'interventions'
      )
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ La table interventions n\'existe pas !');
      console.log('💡 Exécutez: npm run create-tables (ou ts-node src/scripts/createAlertsAndInterventionsTables.ts)');
      return;
    }

    console.log('✅ La table interventions existe\n');

    // Afficher la structure de la table
    const columns = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'interventions'
      ORDER BY ordinal_position
    `);

    console.log('📋 Structure de la table:');
    console.log('─'.repeat(80));
    columns.rows.forEach((col: any) => {
      console.log(`  ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(20)} | Nullable: ${col.is_nullable} | Default: ${col.column_default || 'NULL'}`);
    });
    console.log('─'.repeat(80));

    // Vérifier les contraintes
    const constraints = await pool.query(`
      SELECT 
        constraint_name,
        constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'interventions'
    `);

    console.log('\n🔒 Contraintes:');
    constraints.rows.forEach((constraint: any) => {
      console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type}`);
    });

    // Compter les interventions existantes
    const count = await pool.query('SELECT COUNT(*) as count FROM interventions');
    console.log(`\n📊 Nombre d'interventions: ${count.rows[0].count}`);

    // Tester une insertion (sans commit)
    console.log('\n🧪 Test d\'insertion (rollback)...');
    try {
      await pool.query('BEGIN');
      const testResult = await pool.query(`
        INSERT INTO interventions (line_id, description, technician_name, status, date)
        VALUES (NULL, 'Test', 'Test Technician', 'planned', CURRENT_TIMESTAMP)
        RETURNING id
      `);
      await pool.query('ROLLBACK');
      console.log('✅ Test d\'insertion réussi (rollback effectué)');
    } catch (testError: any) {
      await pool.query('ROLLBACK');
      console.error('❌ Erreur lors du test d\'insertion:', testError.message);
      console.error('   Code:', testError.code);
    }

  } catch (error: any) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  } finally {
    await pool.end();
  }
};

checkTable();


