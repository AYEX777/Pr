import pool from '../config/database';

export interface SensorThresholds {
  id: string;
  line_id: string;
  type: string;
  name: string;
  threshold: number;
  min_warning?: number;
  max_warning?: number;
  min_critical?: number;
  max_critical?: number;
  normal_min?: number;
  normal_max?: number;
  threshold_enabled?: boolean;
  last_calibration?: Date;
  next_calibration?: Date;
  accuracy?: number;
}

export interface SensorThresholdsUpdate {
  min_warning?: number;
  max_warning?: number;
  min_critical?: number;
  max_critical?: number;
  normal_min?: number;
  normal_max?: number;
  threshold_enabled?: boolean;
}

/**
 * Récupère les seuils d'alerte d'un capteur par son ID
 */
export const getSensorThresholds = async (sensorId: string): Promise<SensorThresholds | null> => {
  const result = await pool.query<SensorThresholds>(
    `SELECT id, line_id, type, name, threshold, 
            min_warning, max_warning, min_critical, max_critical,
            normal_min, normal_max, threshold_enabled,
            last_calibration, next_calibration, accuracy
     FROM sensors
     WHERE id = $1`,
    [sensorId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
};

/**
 * Récupère tous les seuils d'alerte pour une ligne
 */
export const getLineSensorThresholds = async (lineId: string): Promise<SensorThresholds[]> => {
  const result = await pool.query<SensorThresholds>(
    `SELECT id, line_id, type, name, threshold,
            min_warning, max_warning, min_critical, max_critical,
            normal_min, normal_max, threshold_enabled,
            last_calibration, next_calibration, accuracy
     FROM sensors
     WHERE line_id = $1
     ORDER BY type`,
    [lineId]
  );

  return result.rows;
};

/**
 * Met à jour les seuils d'alerte d'un capteur
 */
export const updateSensorThresholds = async (
  sensorId: string,
  thresholds: SensorThresholdsUpdate
): Promise<SensorThresholds | null> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (thresholds.min_warning !== undefined) {
    updates.push(`min_warning = $${paramIndex}`);
    values.push(thresholds.min_warning);
    paramIndex++;
  }

  if (thresholds.max_warning !== undefined) {
    updates.push(`max_warning = $${paramIndex}`);
    values.push(thresholds.max_warning);
    paramIndex++;
  }

  if (thresholds.min_critical !== undefined) {
    updates.push(`min_critical = $${paramIndex}`);
    values.push(thresholds.min_critical);
    paramIndex++;
  }

  if (thresholds.max_critical !== undefined) {
    updates.push(`max_critical = $${paramIndex}`);
    values.push(thresholds.max_critical);
    paramIndex++;
  }

  if (thresholds.normal_min !== undefined) {
    updates.push(`normal_min = $${paramIndex}`);
    values.push(thresholds.normal_min);
    paramIndex++;
  }

  if (thresholds.normal_max !== undefined) {
    updates.push(`normal_max = $${paramIndex}`);
    values.push(thresholds.normal_max);
    paramIndex++;
  }

  if (thresholds.threshold_enabled !== undefined) {
    updates.push(`threshold_enabled = $${paramIndex}`);
    values.push(thresholds.threshold_enabled);
    paramIndex++;
  }

  if (updates.length === 0) {
    return getSensorThresholds(sensorId);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(sensorId);

  const result = await pool.query<SensorThresholds>(
    `UPDATE sensors SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, line_id, type, name, threshold,
               min_warning, max_warning, min_critical, max_critical,
               normal_min, normal_max, threshold_enabled,
               last_calibration, next_calibration, accuracy`,
    values
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
};

/**
 * Enregistre une calibration pour un capteur
 */
export const recordCalibration = async (
  sensorId: string,
  accuracy: number,
  nextCalibrationDate: Date
): Promise<SensorThresholds | null> => {
  const result = await pool.query<SensorThresholds>(
    `UPDATE sensors
     SET last_calibration = CURRENT_TIMESTAMP,
         next_calibration = $1,
         accuracy = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING id, line_id, type, name, threshold,
               min_warning, max_warning, min_critical, max_critical,
               normal_min, normal_max, threshold_enabled,
               last_calibration, next_calibration, accuracy`,
    [nextCalibrationDate, accuracy, sensorId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
};



