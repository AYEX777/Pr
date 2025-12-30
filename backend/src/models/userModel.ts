import pool from '../config/database';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  password: string; // Alias pour password_hash
  password_hash?: string;
  name?: string;
  full_name?: string;
  role: string;
  created_at?: Date;
  updated_at?: Date;
}

export const findByEmail = async (email: string): Promise<User | null> => {
  const result = await pool.query(
    'SELECT id, email, password_hash, password, name, full_name, role, created_at, updated_at FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const user = result.rows[0];
  // Mapper password_hash vers password pour compatibilité
  return {
    ...user,
    password: user.password_hash || user.password || '',
    full_name: user.full_name || user.name || ''
  } as User;
};

export const findById = async (id: string): Promise<User | null> => {
  const result = await pool.query(
    'SELECT id, email, password_hash, name, full_name, role, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const user = result.rows[0];
  return {
    ...user,
    full_name: user.full_name || user.name || ''
  } as User;
};

export const findAll = async (): Promise<User[]> => {
  const result = await pool.query(
    'SELECT id, email, name, full_name, role, created_at, updated_at FROM users ORDER BY created_at DESC'
  );
  
  return result.rows.map(user => ({
    ...user,
    full_name: user.full_name || user.name || ''
  })) as User[];
};

export const create = async (
  email: string,
  password: string,
  full_name: string,
  role: string = 'operator'
): Promise<User> => {
  // Vérifier si l'email existe déjà
  const existingUser = await findByEmail(email);
  if (existingUser) {
    throw new Error('Email already exists');
  }

  // Hasher le mot de passe
  const password_hash = await bcrypt.hash(password, 10);

  // La table users possède les colonnes password, password_hash, name et full_name
  // Certaines migrations anciennes marquent name et password_hash comme NOT NULL.
  // On renseigne donc :
  // - password     : hash (pour compatibilité éventuelle)
  // - password_hash: hash (colonne principale utilisée au login)
  // - name         : même valeur que full_name
  const result = await pool.query(
    `INSERT INTO users (email, password, password_hash, name, full_name, role, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id, email, full_name, role, created_at, updated_at`,
    [email.toLowerCase(), password_hash, password_hash, full_name, full_name, role]
  );

  return result.rows[0] as User;
};

export const updateRole = async (id: string, role: string): Promise<User | null> => {
  const result = await pool.query(
    `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, email, full_name, role, created_at, updated_at`,
    [role, id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as User;
};

export const deleteById = async (id: string): Promise<boolean> => {
  const result = await pool.query(
    'DELETE FROM users WHERE id = $1',
    [id]
  );

  return result.rowCount !== null && result.rowCount > 0;
};

export const updateProfile = async (
  id: string,
  data: { full_name?: string; email?: string }
): Promise<User | null> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.full_name !== undefined) {
    updates.push(`full_name = $${paramIndex}`);
    values.push(data.full_name);
    paramIndex++;
  }

  if (data.email !== undefined) {
    // Vérifier si l'email existe déjà pour un autre utilisateur
    const existingUser = await findByEmail(data.email);
    if (existingUser && existingUser.id !== id) {
      throw new Error('Email already exists');
    }
    updates.push(`email = $${paramIndex}`);
    values.push(data.email.toLowerCase());
    paramIndex++;
  }

  if (updates.length === 0) {
    return findById(id);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await pool.query(
    `UPDATE users SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, email, full_name, role, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as User;
};
