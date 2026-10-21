import { createApp } from './app.js'
import { config } from './config.js'
import { pool } from './db.js'

const app = createApp()

const server = app.listen(config.port, () => {
  console.log(`[api] listening on http://localhost:${config.port} (${config.env})`)
})

async function shutdown(signal) {
  console.log(`[api] ${signal} received, shutting down`)
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
