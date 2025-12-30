import pool from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

const checkTableStructure = async () => {
  try {
    const client = await pool.connect();
    console.log('Connexion à la base de données établie\n');

    // Récupérer la structure de la table users
    const query = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `;

    const result = await client.query(query);
    
    console.log('Structure de la table users:');
    console.log('─'.repeat(80));
    result.rows.forEach((row: any) => {
      console.log(`  ${row.column_name.padEnd(20)} | ${row.data_type.padEnd(20)} | nullable: ${row.is_nullable} | default: ${row.column_default || 'NULL'}`);
    });
    console.log('─'.repeat(80));

    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

checkTableStructure();



