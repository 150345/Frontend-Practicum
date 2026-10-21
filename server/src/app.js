import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'

import { config } from './config.js'
import { pool } from './db.js'
import { loadUser } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import menuRoutes from './routes/menu.js'
import selectionRoutes from './routes/selections.js'

/**
 * The built frontend lives in `dist/` next to the server folder. Serving it
 * from the same origin as the API keeps the session cookie first-party, which
 * is what lets the site work on a plain HTTPS deployment without any CORS
 * cookie gymnastics.
 */
const CLIENT_DIST = path.join(config.paths.root, 'dist')
const hasClientBuild = fs.existsSync(path.join(CLIENT_DIST, 'index.html'))

export function createApp() {
  const app = express()

  // The API is deployed behind a proxy (Railway/Render/Heroku), so we need the
  // real client IP and protocol for secure cookies to work correctly.
  app.set('trust proxy', 1)

  app.use(
    helmet({
      // The API only serves JSON, so a strict CSP is unnecessary here.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )

  app.use(
    cors((req, callback) => {
      const origin = req.headers.origin
      const host = req.headers.host

      // Requests without an Origin header (curl, same-origin navigations) are
      // always fine.
      if (!origin) {
        return callback(null, { origin: true, credentials: true })
      }

      // A request that arrives at this very host is same-origin, even though
      // the browser sends an Origin header for it. It must never be blocked —
      // otherwise the frontend's own assets would be rejected.
      let originHost = null
      try {
        originHost = new URL(origin).host
      } catch {
        originHost = null
      }

      if (originHost && originHost === host) {
        return callback(null, { origin: true, credentials: true })
      }

      if (config.clientOrigins.includes(origin)) {
        return callback(null, { origin: true, credentials: true })
      }

      const error = new Error(`Origin ${origin} is not allowed by CORS`)
      error.status = 403
      callback(error)
    }),
  )

  app.use(express.json({ limit: '100kb' }))

  const PgStore = connectPgSimple(session)
  app.use(
    session({
      store: new PgStore({
        pool,
        tableName: config.session.tableName,
        createTableIfMissing: false,
      }),
      name: 'juniper.sid',
      secret: config.session.secret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      proxy: true,
      cookie: {
        httpOnly: true,
        sameSite: config.session.sameSite,
        secure: config.session.secure,
        maxAge: config.session.maxAgeMs,
      },
    }),
  )

  app.use(loadUser)

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, env: config.env })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/menu', menuRoutes)
  app.use('/api/selections', selectionRoutes)

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  if (hasClientBuild) {
    app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h' }))

    // SPA fallback: anything that is not an API route serves index.html so
    // client-side routes survive a page refresh.
    app.get(/.*/, (_req, res) => {
      res.sendFile(path.join(CLIENT_DIST, 'index.html'))
    })
  } else {
    app.get('/', (_req, res) => {
      res.type('text/plain').send(
        'The Juniper API is running. Build the frontend with `npm run build` to serve it from here.',
      )
    })
  }

  // eslint-disable-next-line no-unused-vars
  app.use((error, _req, res, _next) => {
    const status = error.status ?? 500

    if (status >= 500) {
      console.error('[api] error', error)
    }

    res.status(status).json({
      error: status === 500 ? 'Something went wrong on our side.' : error.message,
    })
  })

  return app
}
