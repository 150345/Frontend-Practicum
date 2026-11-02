import { Router } from 'express'
import { query } from '../db.js'
import { config } from '../config.js'
import Stripe from 'stripe'

const router = Router()
const stripe = config.stripe.secretKey ? new Stripe(config.stripe.secretKey) : null

router.post('/stripe', async (req, res) => {
  if (!stripe || !config.stripe.webhookSecret) {
    return res.status(503).send('Webhooks are not configured on this server.')
  }

  const signature = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, config.stripe.webhookSecret)
  } catch (error) {
    return res.status(400).send('Webhook signature verification failed.')
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const orderId = Number(session.metadata?.orderId)
      if (Number.isInteger(orderId)) {
        await query(
          `UPDATE orders
             SET status = 'paid',
                 stripe_payment_intent_id = COALESCE($1, stripe_payment_intent_id),
                 paid_at = COALESCE(paid_at, NOW()),
                 updated_at = NOW()
           WHERE id = $2 AND status <> 'paid'`,
          [session.payment_intent ?? null, orderId],
        )
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object
      const orderId = Number(session.metadata?.orderId)
      if (Number.isInteger(orderId)) {
        await query(
          `UPDATE orders SET status = 'expired', updated_at = NOW() WHERE id = $1 AND status = 'pending'`,
          [orderId],
        )
      }
    }

    res.json({ received: true })
  } catch (error) {
    res.status(500).json({ error: 'Webhook handling failed.' })
  }
})

export default router
