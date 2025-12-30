import pool from '../config/database';

export interface Intervention {
  id: string;
  line_id: string | null;
  description: string;
  technician_name: string;
  status: 'planned' | 'in_progress' | 'completed';
  date: Date;
  created_at: Date;
}

interface InterventionRow {
  id: string;
  line_id: string | null;
  description: string;
  technician_name: string;
  status: string;
  date: Date;
  created_at: Date;
}

/**
 * Récupère toutes les interventions
 */
export const findAll = async (): Promise<Intervention[]> => {
  const result = await pool.query<InterventionRow>(
    `SELECT id, line_id, description, technician_name, status, date, created_at
     FROM interventions
     ORDER BY date DESC, created_at DESC`
  );

  return result.rows.map(row => ({
    id: row.id,
    line_id: row.line_id,
    description: row.description,
    technician_name: row.technician_name,
    status: row.status as 'planned' | 'in_progress' | 'completed',
    date: row.date,
    created_at: row.created_at,
  }));
};

/**
 * Récupère une intervention par son ID
 */
export const findById = async (id: string): Promise<Intervention | null> => {
  const result = await pool.query<InterventionRow>(
    `SELECT id, line_id, description, technician_name, status, date, created_at
     FROM interventions
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
    description: row.description,
    technician_name: row.technician_name,
    status: row.status as 'planned' | 'in_progress' | 'completed',
    date: row.date,
    created_at: row.created_at,
  };
};

/**
 * Crée une nouvelle intervention
 */
export const create = async (
  lineId: string | null,
  description: string,
  technicianName: string,
  status: 'planned' | 'in_progress' | 'completed',
  date?: Date
): Promise<Intervention> => {
  const interventionDate = date || new Date();
  
  const result = await pool.query<InterventionRow>(
    `INSERT INTO interventions (line_id, description, technician_name, status, date, created_at)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
     RETURNING id, line_id, description, technician_name, status, date, created_at`,
    [lineId, description, technicianName, status, interventionDate]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    line_id: row.line_id,
    description: row.description,
    technician_name: row.technician_name,
    status: row.status as 'planned' | 'in_progress' | 'completed',
    date: row.date,
    created_at: row.created_at,
  };
};

/**
 * Met à jour le statut d'une intervention
 */
export const updateStatus = async (
  id: string,
  status: 'planned' | 'in_progress' | 'completed'
): Promise<Intervention | null> => {
  const result = await pool.query<InterventionRow>(
    `UPDATE interventions
     SET status = $1
     WHERE id = $2
     RETURNING id, line_id, description, technician_name, status, date, created_at`,
    [status, id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    line_id: row.line_id,
    description: row.description,
    technician_name: row.technician_name,
    status: row.status as 'planned' | 'in_progress' | 'completed',
    date: row.date,
    created_at: row.created_at,
  };
};

/**
 * Met à jour les champs principaux d'une intervention
 */
export const updateIntervention = async (
  id: string,
  fields: {
    line_id?: string | null;
    description?: string;
    technician_name?: string;
    status?: 'planned' | 'in_progress' | 'completed';
    date?: Date;
  }
): Promise<Intervention | null> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (fields.line_id !== undefined) {
    updates.push(`line_id = $${paramIndex}`);
    values.push(fields.line_id);
    paramIndex++;
  }

  if (fields.description !== undefined) {
    updates.push(`description = $${paramIndex}`);
    values.push(fields.description);
    paramIndex++;
  }

  if (fields.technician_name !== undefined) {
    updates.push(`technician_name = $${paramIndex}`);
    values.push(fields.technician_name);
    paramIndex++;
  }

  if (fields.status !== undefined) {
    updates.push(`status = $${paramIndex}`);
    values.push(fields.status);
    paramIndex++;
  }

  if (fields.date !== undefined) {
    updates.push(`date = $${paramIndex}`);
    values.push(fields.date);
    paramIndex++;
  }

  if (updates.length === 0) {
    return findById(id);
  }

  values.push(id);

  const result = await pool.query<InterventionRow>(
    `UPDATE interventions
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, line_id, description, technician_name, status, date, created_at`,
    values
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    line_id: row.line_id,
    description: row.description,
    technician_name: row.technician_name,
    status: row.status as 'planned' | 'in_progress' | 'completed',
    date: row.date,
    created_at: row.created_at,
  };
};

/**
 * Supprime une intervention par son ID
 */
export const deleteById = async (id: string): Promise<boolean> => {
  const result = await pool.query(
    `DELETE FROM interventions WHERE id = $1`,
    [id]
  );

  return result.rowCount !== null && result.rowCount > 0;
};

