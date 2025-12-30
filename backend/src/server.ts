import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import './config/database'; // Import pour activer la connexion DB au démarrage
import authRoutes from './routes/authRoutes';
import linesRoutes from './routes/linesRoutes';
import alertsRoutes from './routes/alertsRoutes';
import interventionsRoutes from './routes/interventionsRoutes';
import reportsRoutes from './routes/reportsRoutes';
import usersRoutes from './routes/usersRoutes';
import sensorsRoutes from './routes/sensorsRoutes';
import historyRoutes from './routes/historyRoutes';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware CORS - Configuration permissive pour le développement mobile
app.use(cors({
  origin: '*', // Permettre toutes les origines
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

// Middleware pour logger les requêtes (debug)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.send('Serveur PRISK opérationnel');
});

app.use('/api/auth', authRoutes);
app.use('/api/lines', linesRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/interventions', interventionsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/sensors', sensorsRoutes);
app.use('/api/history', historyRoutes);

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur PRISK démarré sur le port ${PORT}`);
  console.log(`🌐 API disponible sur http://localhost:${PORT}`);
  console.log(`📱 API accessible depuis le réseau local sur http://10.25.31.15:${PORT}`);
    console.log(`🔐 Route de login: http://localhost:${PORT}/api/auth/login`);
    console.log(`📊 Route des lignes: http://localhost:${PORT}/api/lines`);
    console.log(`🚨 Route des alertes: http://localhost:${PORT}/api/alerts`);
    console.log(`🔧 Route des interventions: http://localhost:${PORT}/api/interventions`);
    console.log(`📊 Route des rapports: http://localhost:${PORT}/api/reports/summary`);
    console.log(`👥 Route des utilisateurs: http://localhost:${PORT}/api/users`);
});
