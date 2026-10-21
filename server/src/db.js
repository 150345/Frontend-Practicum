import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl,
  max: Number(process.env.DATABASE_POOL_MAX ?? 10),
})

pool.on('error', (error) => {
  console.error('[db] idle client error', error)
})

export function query(text, params) {
  return pool.query(text, params)
}

/** Runs `fn` inside a transaction, rolling back on any thrown error. */
export async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
