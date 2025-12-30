import pool from '../config/database';

export interface Alert {
  id: string;
  line_id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  acknowledged: boolean;
  created_at: Date;
}

interface AlertRow {
  id: string;
  line_id: string;
  severity: string;
  message: string;
  acknowledged: boolean;
  created_at: Date;
}

/**
 * Récupère toutes les alertes non acquittées
 */
export const findUnacknowledged = async (): Promise<Alert[]> => {
  const result = await pool.query<AlertRow>(
    `SELECT id, line_id, severity, message, acknowledged, created_at
     FROM alerts
     WHERE acknowledged = false
     ORDER BY 
       CASE severity
         WHEN 'critical' THEN 1
         WHEN 'warning' THEN 2
         WHEN 'info' THEN 3
       END,
       created_at DESC`
  );

  return result.rows.map(row => ({
    id: row.id,
    line_id: row.line_id,
    severity: row.severity as 'critical' | 'warning' | 'info',
    message: row.message,
    acknowledged: row.acknowledged,
    created_at: row.created_at,
  }));
};

/**
 * Récupère toutes les alertes (acquittées et non acquittées)
 */
export const findAll = async (): Promise<Alert[]> => {
  const result = await pool.query<AlertRow>(
    `SELECT id, line_id, severity, message, acknowledged, created_at
     FROM alerts
     ORDER BY created_at DESC`
  );

  return result.rows.map(row => ({
    id: row.id,
    line_id: row.line_id,
    severity: row.severity as 'critical' | 'warning' | 'info',
    message: row.message,
    acknowledged: row.acknowledged,
    created_at: row.created_at,
  }));
};

/**
 * Récupère une alerte par son ID
 */
export const findById = async (id: string): Promise<Alert | null> => {
  const result = await pool.query<AlertRow>(
    `SELECT id, line_id, severity, message, acknowledged, created_at
     FROM alerts
     WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    line_id: row.line_id,
    severity: row.severity as 'critical' | 'warning' | 'info',
    message: row.message,
    acknowledged: row.acknowledged,
    created_at: row.created_at,
  };
};

/**
 * Marque une alerte comme acquittée
 */
export const acknowledge = async (id: string): Promise<Alert | null> => {
  const result = await pool.query<AlertRow>(
    `UPDATE alerts
     SET acknowledged = true
     WHERE id = $1
     RETURNING id, line_id, severity, message, acknowledged, created_at`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    line_id: row.line_id,
    severity: row.severity as 'critical' | 'warning' | 'info',
    message: row.message,
    acknowledged: row.acknowledged,
    created_at: row.created_at,
  };
};

/**
 * Crée une nouvelle alerte
 */
export const create = async (
  lineId: string,
  severity: 'critical' | 'warning' | 'info',
  message: string
): Promise<Alert> => {
  const result = await pool.query<AlertRow>(
    `INSERT INTO alerts (line_id, severity, message, acknowledged, created_at)
     VALUES ($1, $2, $3, false, CURRENT_TIMESTAMP)
     RETURNING id, line_id, severity, message, acknowledged, created_at`,
    [lineId, severity, message]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    line_id: row.line_id,
    severity: row.severity as 'critical' | 'warning' | 'info',
    message: row.message,
    acknowledged: row.acknowledged,
    created_at: row.created_at,
  };
};



