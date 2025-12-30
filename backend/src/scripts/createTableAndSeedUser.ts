import pool from '../config/database';
import bcrypt from 'bcryptjs';

const createTableIfNotExists = async () => {
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
  console.log('✅ Table users créée/vérifiée avec succès');
};

const seedUser = async () => {
  try {
    console.log('Démarrage de la création de l\'utilisateur de test...');

    // Création de la table si elle n'existe pas
    await createTableIfNotExists();

    // Hashage du mot de passe
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Mot de passe hashé avec succès');

    // Données de l'utilisateur
    const email = 'admin@prisk.local';
    const fullName = 'Admin User';
    const role = 'admin';

    // Insertion de l'utilisateur avec gestion des conflits
    const query = `
      INSERT INTO users (email, password, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, full_name, role;
    `;

    const result = await pool.query(query, [email, hashedPassword, fullName, role]);

    if (result.rows.length > 0) {
      console.log('✅ Utilisateur créé avec succès:');
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Nom: ${result.rows[0].full_name}`);
      console.log(`   Rôle: ${result.rows[0].role}`);
    } else {
      console.log('ℹ️  L\'utilisateur existe déjà dans la base de données.');
      
      // Vérification que l'utilisateur existe bien
      const checkQuery = 'SELECT id, email, full_name, role FROM users WHERE email = $1';
      const checkResult = await pool.query(checkQuery, [email]);
      
      if (checkResult.rows.length > 0) {
        console.log('✅ Utilisateur trouvé dans la base:');
        console.log(`   ID: ${checkResult.rows[0].id}`);
        console.log(`   Email: ${checkResult.rows[0].email}`);
        console.log(`   Nom: ${checkResult.rows[0].full_name}`);
        console.log(`   Rôle: ${checkResult.rows[0].role}`);
      }
    }

    console.log('\n✅ Script terminé avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
    process.exit(1);
  } finally {
    // Fermeture de la connexion
    await pool.end();
    console.log('Connexion à la base de données fermée.');
  }
};

// Exécution du script
seedUser();


