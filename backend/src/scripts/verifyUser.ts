import pool from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

const verifyUser = async () => {
  try {
    const client = await pool.connect();
    console.log('Connexion à la base de données établie\n');

    const email = 'admin@prisk.local';
    const query = 'SELECT id, email, name, full_name, role, password_hash, password, is_active, created_at FROM users WHERE email = $1';
    const result = await client.query(query, [email]);

    if (result.rows.length === 0) {
      console.log('❌ Aucun utilisateur trouvé avec l\'email:', email);
      client.release();
      process.exit(1);
    }

    const user = result.rows[0];
    console.log('✅ Utilisateur trouvé dans la base de données:');
    console.log('─'.repeat(80));
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Nom (name):', user.name || 'NULL');
    console.log('   Nom complet (full_name):', user.full_name || 'NULL');
    console.log('   Rôle:', user.role);
    console.log('   Actif:', user.is_active);
    console.log('   Créé le:', user.created_at);
    console.log('   Password hash présent:', user.password_hash ? '✅ OUI' : '❌ NON');
    console.log('   Password (ancien):', user.password ? '✅ OUI' : '❌ NON');
    console.log('─'.repeat(80));

    if (!user.password_hash && user.password) {
      console.log('\n⚠️  Attention: Le mot de passe n\'est pas hashé (utilise l\'ancienne colonne password)');
    } else if (user.password_hash) {
      console.log('\n✅ Le mot de passe est bien hashé avec bcrypt');
    } else {
      console.log('\n❌ Aucun mot de passe trouvé !');
    }

    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

verifyUser();
