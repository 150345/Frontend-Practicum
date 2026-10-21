import fs from 'node:fs/promises'
import path from 'node:path'
import { pool } from '../src/db.js'
import { config } from '../src/config.js'

/**
 * Minimal forward-only migration runner.
 *
 * Every file in `server/db/migrations` is applied once, in filename order, and
 * recorded in the `schema_migrations` table so that re-running the script is
 * safe (this is what the deployment start command does).
 */
async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         SERIAL PRIMARY KEY,
      name      TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  const files = (await fs.readdir(config.paths.migrations))
    .filter((file) => file.endsWith('.sql'))
    .sort()

  const { rows } = await pool.query('SELECT name FROM schema_migrations')
  const applied = new Set(rows.map((row) => row.name))

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[migrate] skip ${file} (already applied)`)
      continue
    }

    const sql = await fs.readFile(path.join(config.paths.migrations, file), 'utf8')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
      await client.query('COMMIT')
      console.log(`[migrate] applied ${file}`)
    } catch (error) {
      await client.query('ROLLBACK')
      console.error(`[migrate] failed ${file}:`, error.message)
      throw error
    } finally {
      client.release()
    }
  }

  console.log('[migrate] up to date')
}

runMigrations()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error('[migrate] error', error)
    await pool.end()
    process.exit(1)
  })
