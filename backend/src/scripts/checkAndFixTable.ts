import pool from '../config/database';

const checkAndFixTable = async () => {
  try {
    // Vérifier si la table existe et sa structure
    const checkTableQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `;

    const columnsResult = await pool.query(checkTableQuery);
    
    if (columnsResult.rows.length === 0) {
      console.log('La table users n\'existe pas. Création...');
      await createTable();
    } else {
      console.log('Structure actuelle de la table users:');
      columnsResult.rows.forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });

      // Vérifier si la colonne password existe
      const hasPassword = columnsResult.rows.some((col: any) => col.column_name === 'password');
      
      if (!hasPassword) {
        console.log('\n⚠️  La colonne "password" n\'existe pas. Ajout de la colonne...');
        await pool.query('ALTER TABLE users ADD COLUMN password VARCHAR(255)');
        console.log('✅ Colonne password ajoutée');
      }

      // Vérifier si la colonne full_name existe
      const hasFullName = columnsResult.rows.some((col: any) => col.column_name === 'full_name');
      
      if (!hasFullName) {
        console.log('⚠️  La colonne "full_name" n\'existe pas. Ajout de la colonne...');
        await pool.query('ALTER TABLE users ADD COLUMN full_name VARCHAR(255)');
        console.log('✅ Colonne full_name ajoutée');
      }

      // Vérifier si la colonne role existe
      const hasRole = columnsResult.rows.some((col: any) => col.column_name === 'role');
      
      if (!hasRole) {
        console.log('⚠️  La colonne "role" n\'existe pas. Ajout de la colonne...');
        await pool.query('ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT \'operator\'');
        console.log('✅ Colonne role ajoutée');
      }
    }

    console.log('\n✅ Structure de la table vérifiée et corrigée si nécessaire');
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
};

const createTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'operator',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `;

  await pool.query(createTableQuery);
};

const run = async () => {
  await checkAndFixTable();
  await pool.end();
};

run();


