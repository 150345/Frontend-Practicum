import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

/**
 * The server reads its configuration from the environment. In development we
 * load `server/.env` (and the repo-root `.env`) so that a single checkout can
 * run both the API and the Vite dev server without extra tooling.
 */
const isProduction = process.env.NODE_ENV === 'production'

function required(name, fallback) {
  const value = process.env[name] ?? fallback
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function toList(value) {
  if (!value) return []
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

const databaseUrl = required('DATABASE_URL')

const clientOrigins = toList(process.env.CLIENT_ORIGIN)

export const config = {
  isProduction,
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl,
  // Neon/Supabase style URLs need TLS; a local Docker Postgres does not.
  databaseSsl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  clientOrigins,
  session: {
    secret: required('SESSION_SECRET'),
    // `none` is required when the API and the site live on different domains
    // (the cookie then still travels over HTTPS because `secure` is on).
    sameSite: process.env.SESSION_SAME_SITE ?? (isProduction ? 'none' : 'lax'),
    secure: process.env.SESSION_SECURE ? process.env.SESSION_SECURE === 'true' : isProduction,
    maxAgeMs: 1000 * 60 * 60 * 24 * 7,
    tableName: 'user_sessions',
  },
  paths: {
    migrations: path.join(here, '..', 'db', 'migrations'),
    root: path.join(here, '..', '..'),
  },
}
