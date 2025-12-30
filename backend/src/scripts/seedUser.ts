import pool from '../config/database';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const seedUser = async () => {
  try {
    // Connexion à la base de données
    const client = await pool.connect();
    console.log('Connexion à la base de données établie');

    // Hashage du mot de passe
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Mot de passe hashé avec succès');

    // Données de l'utilisateur
    const email = 'admin@prisk.local';
    const name = 'Admin User';
    const role = 'admin';

    // Insertion de l'utilisateur avec gestion des conflits
    const query = `
      INSERT INTO users (email, password_hash, name, role, full_name)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, name, full_name, role;
    `;

    const result = await client.query(query, [email, hashedPassword, name, role, name]);

    if (result.rows.length > 0) {
      console.log('✅ Utilisateur créé avec succès:');
      console.log('   ID:', result.rows[0].id);
      console.log('   Email:', result.rows[0].email);
      console.log('   Nom:', result.rows[0].name || result.rows[0].full_name);
      console.log('   Rôle:', result.rows[0].role);
    } else {
      console.log('ℹ️  L\'utilisateur existe déjà dans la base de données');
      
      // Vérification que l'utilisateur existe bien
      const checkQuery = 'SELECT id, email, name, full_name, role FROM users WHERE email = $1';
      const checkResult = await client.query(checkQuery, [email]);
      
      if (checkResult.rows.length > 0) {
        console.log('✅ Utilisateur trouvé dans la base:');
        console.log('   ID:', checkResult.rows[0].id);
        console.log('   Email:', checkResult.rows[0].email);
        console.log('   Nom:', checkResult.rows[0].name || checkResult.rows[0].full_name);
        console.log('   Rôle:', checkResult.rows[0].role);
      }
    }

    client.release();
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
    process.exit(1);
  }
};

// Exécution du script
seedUser();
