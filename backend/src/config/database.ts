import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Test de connexion au démarrage (non bloquant)
pool.connect()
  .then((client) => {
    console.log('✅ Connecté à la base de données PRISK');
    client.release();
  })
  .catch((err) => {
    console.error('⚠️  Erreur de connexion à la base de données:', err.message);
    console.error('   Le serveur démarrera quand même, mais certaines fonctionnalités ne fonctionneront pas.');
  });

export default pool;

