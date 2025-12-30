import pool from '../config/database';
import * as dotenv from 'dotenv';

dotenv.config();

// Valeurs initiales pour chaque ligne selon le niveau de risque
const lineConfigs = {
  'line-A': {
    name: 'Ligne A',
    zone: 'Zone Nord',
    riskLevel: 'critical',
    maxRiskScore: 0.89,
    sensors: {
      pressure: { value: 8.9, unit: 'bar', threshold: 8.0, status: 'warning' },
      temperature: { value: 92, unit: '°C', threshold: 85, status: 'error' },
      vibration: { value: 8.5, unit: 'mm/s', threshold: 7.5, status: 'warning' },
      level: { value: 94, unit: '%', threshold: 90, status: 'warning' },
    }
  },
  'line-B': {
    name: 'Ligne B',
    zone: 'Zone Sud',
    riskLevel: 'high',
    maxRiskScore: 0.75,
    sensors: {
      pressure: { value: 7.2, unit: 'bar', threshold: 8.0, status: 'ok' },
      temperature: { value: 78, unit: '°C', threshold: 85, status: 'ok' },
      vibration: { value: 6.8, unit: 'mm/s', threshold: 7.5, status: 'ok' },
      level: { value: 82, unit: '%', threshold: 90, status: 'ok' },
    }
  },
  'line-C': {
    name: 'Ligne C',
    zone: 'Zone Est',
    riskLevel: 'medium',
    maxRiskScore: 0.52,
    sensors: {
      pressure: { value: 5.5, unit: 'bar', threshold: 8.0, status: 'ok' },
      temperature: { value: 65, unit: '°C', threshold: 85, status: 'ok' },
      vibration: { value: 4.2, unit: 'mm/s', threshold: 7.5, status: 'ok' },
      level: { value: 68, unit: '%', threshold: 90, status: 'ok' },
    }
  },
  'line-D': {
    name: 'Ligne D',
    zone: 'Zone Ouest',
    riskLevel: 'low',
    maxRiskScore: 0.25,
    sensors: {
      pressure: { value: 3.2, unit: 'bar', threshold: 8.0, status: 'ok' },
      temperature: { value: 45, unit: '°C', threshold: 85, status: 'ok' },
      vibration: { value: 2.5, unit: 'mm/s', threshold: 7.5, status: 'ok' },
      level: { value: 55, unit: '%', threshold: 90, status: 'ok' },
    }
  }
};

const sensorNames: Record<string, string> = {
  pressure: 'Pression',
  temperature: 'Température',
  vibration: 'Vibration',
  level: 'Extension', // Niveau renommé en Extension pour correspondre au frontend
};

const seedLinesAndSensors = async () => {
  console.log('🌱 Début du seed des lignes et capteurs...');
  
  try {
    // Supprimer les tables si elles existent (pour repartir de zéro)
    await pool.query('DROP TABLE IF EXISTS sensors CASCADE');
    await pool.query('DROP TABLE IF EXISTS production_lines CASCADE');

    // Créer les tables
    await pool.query(`
      CREATE TABLE production_lines (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        zone VARCHAR(100),
        risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
        max_risk_score DECIMAL(5, 2) DEFAULT 0.00,
        last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE sensors (
        id VARCHAR(100) PRIMARY KEY,
        line_id VARCHAR(50) NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        unit VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'ok' CHECK (status IN ('ok', 'warning', 'error')),
        threshold DECIMAL(10, 2) NOT NULL,
        last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(line_id, type)
      )
    `);

    // Créer les index
    await pool.query('CREATE INDEX idx_sensors_line_id ON sensors(line_id)');
    await pool.query('CREATE INDEX idx_sensors_type ON sensors(type)');
    await pool.query('CREATE INDEX idx_sensors_status ON sensors(status)');
    console.log('✅ Tables créées/vérifiées');

    // Insérer ou mettre à jour les lignes
    for (const [lineId, config] of Object.entries(lineConfigs)) {
      const lineQuery = `
        INSERT INTO production_lines (id, name, zone, risk_level, max_risk_score, last_update)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          zone = EXCLUDED.zone,
          risk_level = EXCLUDED.risk_level,
          max_risk_score = EXCLUDED.max_risk_score,
          last_update = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, name, zone;
      `;

      const lineResult = await pool.query(lineQuery, [
        lineId,
        config.name,
        config.zone,
        config.riskLevel,
        config.maxRiskScore,
      ]);

      console.log(`✅ Ligne ${lineResult.rows[0].name} (${lineResult.rows[0].id}) créée/mise à jour`);

      // Insérer ou mettre à jour les capteurs pour cette ligne
      for (const [sensorType, sensorData] of Object.entries(config.sensors)) {
        // Mapper les types vers les IDs utilisés dans mockData.ts
        const sensorIdMap: Record<string, string> = {
          pressure: 'pressure',
          temperature: 'temp',
          vibration: 'vib',
          level: 'level',
        };
        const sensorIdSuffix = sensorIdMap[sensorType] || sensorType;
        const sensorId = `${lineId}-${sensorIdSuffix}`;
        const sensorName = sensorNames[sensorType] || sensorType;

        const sensorQuery = `
          INSERT INTO sensors (id, line_id, type, name, value, unit, status, threshold, last_update)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET
            value = EXCLUDED.value,
            status = EXCLUDED.status,
            threshold = EXCLUDED.threshold,
            last_update = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          RETURNING id, name, type;
        `;

        await pool.query(sensorQuery, [
          sensorId,
          lineId,
          sensorType,
          sensorName,
          sensorData.value,
          sensorData.unit,
          sensorData.status,
          sensorData.threshold,
        ]);
      }

      console.log(`   ✅ 4 capteurs créés/mis à jour pour ${config.name}`);
    }

    console.log('✅ Seed terminé avec succès !');
    console.log(`📊 Résumé : 4 lignes et 16 capteurs (4 par ligne)`);

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('✅ Connexion fermée');
  }
};

seedLinesAndSensors();

