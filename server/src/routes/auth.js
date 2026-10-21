import { Router } from 'express'
import {
  createUser,
  findUserByEmail,
  normalizeEmail,
  publicUser,
  verifyPassword,
} from '../services/auth.js'

const router = Router()

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateSignup({ email, password, name }) {
  if (!email || !EMAIL_PATTERN.test(email)) {
    return 'Please enter a valid email address.'
  }
  if (!password || password.length < 8) {
    return 'Your password needs to be at least 8 characters.'
  }
  if (!name || name.trim().length < 2) {
    return 'Please tell us your name.'
  }
  return null
}

/** POST /api/auth/signup — create an account and start a session. */
router.post('/signup', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email)
    const password = req.body?.password
    const name = String(req.body?.name ?? '').trim()

    const error = validateSignup({ email, password, name })
    if (error) {
      return res.status(400).json({ error })
    }

    const existing = await findUserByEmail(email)
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists.' })
    }

    const user = await createUser({ email, password, name })

    // Regenerate the session id to avoid session fixation.
    req.session.regenerate((err) => {
      if (err) return next(err)
      req.session.userId = user.id
      req.session.save((saveErr) => {
        if (saveErr) return next(saveErr)
        res.status(201).json({ user: publicUser(user) })
      })
    })
  } catch (error) {
    next(error)
  }
})

/** POST /api/auth/login — verify credentials and start a session. */
router.post('/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email)
    const password = req.body?.password

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter your email and password.' })
    }

    const user = await findUserByEmail(email)
    // Always run a comparison so that a missing account and a wrong password
    // take the same amount of time.
    const hash = user?.password_hash ?? '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv'
    const valid = await verifyPassword(password, hash)

    if (!user || !valid) {
      return res.status(401).json({ error: 'That email and password do not match.' })
    }

    req.session.regenerate((err) => {
      if (err) return next(err)
      req.session.userId = user.id
      req.session.save((saveErr) => {
        if (saveErr) return next(saveErr)
        res.json({ user: publicUser(user) })
      })
    })
  } catch (error) {
    next(error)
  }
})

/** POST /api/auth/logout — destroy the current session. */
router.post('/logout', (req, res, next) => {
  if (!req.session) {
    return res.json({ ok: true })
  }
  req.session.destroy((err) => {
    if (err) return next(err)
    res.clearCookie('juniper.sid')
    res.json({ ok: true })
  })
})

/**
 * GET /api/auth/me — the signed-in user, or `null` when the visitor is not
 * signed in. This always answers with 200 so the client can use it to decide
 * what to render without treating "anonymous" as an error.
 */
router.get('/me', (req, res) => {
  res.json({ user: publicUser(req.user) })
})

export default router
