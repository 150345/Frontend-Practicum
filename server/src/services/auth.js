import bcrypt from 'bcryptjs'
import { query } from '../db.js'

const SALT_ROUNDS = 12

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash)
}

export async function findUserByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email])
  return rows[0] ?? null
}

export async function findUserById(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id])
  return rows[0] ?? null
}

export async function createUser({ email, password, name }) {
  const passwordHash = await hashPassword(password)
  const { rows } = await query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, created_at`,
    [email, passwordHash, name],
  )
  return rows[0]
}

/** The shape we are willing to expose to the client — never the password hash. */
export function publicUser(user) {
  if (!user) return null
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at,
  }
}
