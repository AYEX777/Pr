import pool from '../config/database';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Sensor {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'ok' | 'warning' | 'error';
  threshold: number;
  lastUpdate: Date;
}

export interface ProductionLine {
  id: string;
  name: string;
  zone?: string;
  riskLevel: RiskLevel;
  maxRiskScore: number;
  lastUpdate: Date;
  // 4 capteurs directement intégrés
  pressure: Sensor;
  temperature: Sensor;
  vibration: Sensor;
  level: Sensor; // Extension dans le frontend
}

interface ProductionLineRow {
  id: string;
  name: string;
  zone: string | null;
  risk_level: string;
  max_risk_score: number;
  last_update: Date;
}

interface SensorRow {
  id: string;
  line_id: string;
  type: string;
  name: string;
  value: number;
  unit: string;
  status: string;
  threshold: number;
  last_update: Date;
}

/**
 * Récupère toutes les lignes de production avec leurs capteurs
 */
export const findAll = async (): Promise<ProductionLine[]> => {
  // Récupérer toutes les lignes
  const linesResult = await pool.query<ProductionLineRow>(
    'SELECT id, name, zone, risk_level, max_risk_score, last_update FROM production_lines ORDER BY name'
  );

  if (linesResult.rows.length === 0) {
    return [];
  }

  // Récupérer tous les capteurs pour toutes les lignes
  const lineIds = linesResult.rows.map(row => row.id);
  const sensorsResult = await pool.query<SensorRow>(
    'SELECT id, line_id, type, name, value, unit, status, threshold, last_update FROM sensors WHERE line_id = ANY($1::varchar[]) ORDER BY line_id, type',
    [lineIds]
  );

  // Organiser les capteurs par ligne
  const sensorsByLine = new Map<string, SensorRow[]>();
  sensorsResult.rows.forEach(sensor => {
    if (!sensorsByLine.has(sensor.line_id)) {
      sensorsByLine.set(sensor.line_id, []);
    }
    sensorsByLine.get(sensor.line_id)!.push(sensor);
  });

  // Construire les objets ProductionLine
  const productionLines: ProductionLine[] = linesResult.rows.map(line => {
    const sensors = sensorsByLine.get(line.id) || [];
    
    // Créer un map des capteurs par type
    const sensorMap = new Map<string, SensorRow>();
    sensors.forEach(sensor => {
      sensorMap.set(sensor.type, sensor);
    });

    // Fonction helper pour créer un objet Sensor
    // Note: Les IDs dans mockData.ts utilisent des suffixes différents pour certains capteurs
    const createSensor = (type: string, expectedIdSuffix?: string): Sensor => {
      const sensorRow = sensorMap.get(type);
      if (!sensorRow) {
        throw new Error(`Capteur ${type} manquant pour la ligne ${line.id}`);
      }
      // Si un suffixe d'ID est spécifié, utiliser celui-ci pour correspondre à mockData.ts
      const sensorId = expectedIdSuffix ? `${line.id}-${expectedIdSuffix}` : sensorRow.id;
      return {
        id: sensorId,
        name: sensorRow.name,
        value: parseFloat(sensorRow.value.toString()),
        unit: sensorRow.unit,
        status: sensorRow.status as 'ok' | 'warning' | 'error',
        threshold: parseFloat(sensorRow.threshold.toString()),
        lastUpdate: sensorRow.last_update,
      };
    };

    return {
      id: line.id,
      name: line.name,
      zone: line.zone || undefined,
      riskLevel: line.risk_level as RiskLevel,
      maxRiskScore: parseFloat(line.max_risk_score.toString()),
      lastUpdate: line.last_update,
      pressure: createSensor('pressure', 'pressure'),
      temperature: createSensor('temperature', 'temp'), // ID: line-A-temp
      vibration: createSensor('vibration', 'vib'), // ID: line-A-vib
      level: createSensor('level', 'level'), // Extension
    };
  });

  return productionLines;
};

/**
 * Récupère une ligne de production par son ID avec ses capteurs
 */
export const findById = async (id: string): Promise<ProductionLine | null> => {
  // Récupérer la ligne
  const lineResult = await pool.query<ProductionLineRow>(
    'SELECT id, name, zone, risk_level, max_risk_score, last_update FROM production_lines WHERE id = $1',
    [id]
  );

  if (lineResult.rows.length === 0) {
    return null;
  }

  const line = lineResult.rows[0];

  // Récupérer les capteurs de cette ligne
  const sensorsResult = await pool.query<SensorRow>(
    'SELECT id, line_id, type, name, value, unit, status, threshold, last_update FROM sensors WHERE line_id = $1 ORDER BY type',
    [id]
  );

  // Créer un map des capteurs par type
  const sensorMap = new Map<string, SensorRow>();
  sensorsResult.rows.forEach(sensor => {
    sensorMap.set(sensor.type, sensor);
  });

  // Fonction helper pour créer un objet Sensor
  // Note: Les IDs dans mockData.ts utilisent des suffixes différents pour certains capteurs
  const createSensor = (type: string, expectedIdSuffix?: string): Sensor => {
    const sensorRow = sensorMap.get(type);
    if (!sensorRow) {
      throw new Error(`Capteur ${type} manquant pour la ligne ${id}`);
    }
    // Si un suffixe d'ID est spécifié, utiliser celui-ci pour correspondre à mockData.ts
    const sensorId = expectedIdSuffix ? `${id}-${expectedIdSuffix}` : sensorRow.id;
    return {
      id: sensorId,
      name: sensorRow.name,
      value: parseFloat(sensorRow.value.toString()),
      unit: sensorRow.unit,
      status: sensorRow.status as 'ok' | 'warning' | 'error',
      threshold: parseFloat(sensorRow.threshold.toString()),
      lastUpdate: sensorRow.last_update,
    };
  };

  return {
    id: line.id,
    name: line.name,
    zone: line.zone || undefined,
    riskLevel: line.risk_level as RiskLevel,
    maxRiskScore: parseFloat(line.max_risk_score.toString()),
    lastUpdate: line.last_update,
    pressure: createSensor('pressure', 'pressure'),
    temperature: createSensor('temperature', 'temp'), // ID: line-A-temp
    vibration: createSensor('vibration', 'vib'), // ID: line-A-vib
    level: createSensor('level', 'level'), // Extension
  };
};

/**
 * Met à jour le score de risque et le niveau de risque d'une ligne en base de données
 */
export const updateRiskScore = async (
  lineId: string,
  riskScore: number,
  riskLevel: RiskLevel
): Promise<void> => {
  await pool.query(
    `UPDATE production_lines 
     SET max_risk_score = $1, 
         risk_level = $2, 
         last_update = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3`,
    [riskScore, riskLevel, lineId]
  );
};

