import pool from '../config/database';

export interface SensorReading {
  id: string; // UUID
  sensor_id: string;
  value: number;
  created_at: Date;
}

export interface HistoryDataPoint {
  time: string; // Format HH:MM
  timestamp: string; // ISO string
  pressure: number | null;
  temperature: number | null;
  vibration: number | null;
  level: number | null;
}

/**
 * Récupère l'historique des 4 capteurs d'une ligne sur les 24 dernières heures
 * Formaté pour les graphiques Recharts
 */
export const getLineHistory = async (lineId: string): Promise<HistoryDataPoint[]> => {
  // Récupérer les IDs des 4 capteurs de la ligne
  const sensorsResult = await pool.query(
    `SELECT id, type FROM sensors WHERE line_id = $1 AND type IN ('pressure', 'temperature', 'vibration', 'level')`,
    [lineId]
  );

  if (sensorsResult.rows.length === 0) {
    return [];
  }

  // Créer un map des capteurs par type
  const sensorMap = new Map<string, string>();
  sensorsResult.rows.forEach((row: { id: string; type: string }) => {
    sensorMap.set(row.type, row.id);
  });

  const pressureSensorId = sensorMap.get('pressure');
  const temperatureSensorId = sensorMap.get('temperature');
  const vibrationSensorId = sensorMap.get('vibration');
  const levelSensorId = sensorMap.get('level');

  // Récupérer les données historiques pour les 24 dernières heures
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Récupérer toutes les lectures pour les 4 capteurs
  const readingsQuery = `
    SELECT sensor_id, value, created_at
    FROM sensor_readings
    WHERE sensor_id = ANY($1::varchar[])
      AND created_at >= $2
    ORDER BY created_at ASC
  `;

  const sensorIds = [pressureSensorId, temperatureSensorId, vibrationSensorId, levelSensorId].filter(
    (id): id is string => id !== undefined
  );

  if (sensorIds.length === 0) {
    return [];
  }

  const readingsResult = await pool.query<{
    sensor_id: string;
    value: number;
    created_at: Date;
  }>(readingsQuery, [sensorIds, twentyFourHoursAgo]);

  // Organiser les données par timestamp
  const dataByTimestamp = new Map<string, {
    time: string;
    timestamp: string;
    pressure: number | null;
    temperature: number | null;
    vibration: number | null;
    level: number | null;
  }>();

  readingsResult.rows.forEach((reading) => {
    const timestamp = new Date(reading.created_at);
    const timeKey = timestamp.toISOString();
    const timeLabel = `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}`;

    if (!dataByTimestamp.has(timeKey)) {
      dataByTimestamp.set(timeKey, {
        time: timeLabel,
        timestamp: timeKey,
        pressure: null,
        temperature: null,
        vibration: null,
        level: null,
      });
    }

    const dataPoint = dataByTimestamp.get(timeKey)!;

    // Assigner la valeur au bon capteur
    if (reading.sensor_id === pressureSensorId) {
      dataPoint.pressure = parseFloat(reading.value.toString());
    } else if (reading.sensor_id === temperatureSensorId) {
      dataPoint.temperature = parseFloat(reading.value.toString());
    } else if (reading.sensor_id === vibrationSensorId) {
      dataPoint.vibration = parseFloat(reading.value.toString());
    } else if (reading.sensor_id === levelSensorId) {
      dataPoint.level = parseFloat(reading.value.toString());
    }
  });

  // Convertir en tableau et trier par timestamp
  const historyData = Array.from(dataByTimestamp.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return historyData;
};

/**
 * Récupère l'historique d'un capteur spécifique sur une période donnée
 */
export const getSensorHistory = async (
  sensorId: string,
  hours: number = 24,
  limit: number = 100
): Promise<Array<{ timestamp: Date; value: number }>> => {
  const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);

  const result = await pool.query<{
    value: number;
    created_at: Date;
  }>(
    `SELECT value, created_at
     FROM sensor_readings
     WHERE sensor_id = $1 AND created_at >= $2
     ORDER BY created_at ASC
     LIMIT $3`,
    [sensorId, hoursAgo, limit]
  );

  return result.rows.map((row) => ({
    timestamp: row.created_at,
    value: parseFloat(row.value.toString()),
  }));
};

