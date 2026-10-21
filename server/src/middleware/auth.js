import { findUserById } from '../services/auth.js'

/**
 * Attaches `req.user` when a valid session is present. Never rejects — routes
 * that require a signed-in user use `requireAuth` instead.
 */
export async function loadUser(req, _res, next) {
  const userId = req.session?.userId
  if (!userId) {
    req.user = null
    return next()
  }

  try {
    const user = await findUserById(userId)
    // A deleted user must not keep a live session around.
    if (!user) {
      req.session.destroy(() => {})
      req.user = null
      return next()
    }
    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'You need to sign in to do that.' })
  }
  next()
}
