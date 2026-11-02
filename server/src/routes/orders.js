import { Router } from 'express'
import { query, withTransaction } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { config } from '../config.js'
import Stripe from 'stripe'

const router = Router()
const stripe = config.stripe.secretKey ? new Stripe(config.stripe.secretKey) : null

function toCents(amount) {
  return Math.round(Number(amount) * 100)
}

router.post('/checkout', requireAuth, async (req, res, next) => {
  try {
    const requested = Array.isArray(req.body?.items) ? req.body.items : []
    const entries = requested
      .map((entry) => ({
        databaseId: Number(entry.databaseId ?? entry.id),
        quantity: Math.max(1, Math.min(99, Number(entry.quantity) || 1)),
      }))
      .filter((entry) => Number.isInteger(entry.databaseId) && entry.quantity > 0)

    if (entries.length === 0) {
      return res.status(400).json({ error: 'Add at least one dish to your order.' })
    }

    const { rows: dbItems } = await query(
      'SELECT id, name, price, is_available FROM menu_items WHERE id = ANY($1::int[])',
      [entries.map((entry) => entry.databaseId)],
    )
    const byId = new Map(dbItems.map((row) => [row.id, row]))

    const lineItems = []
    let total = 0
    for (const entry of entries) {
      const row = byId.get(entry.databaseId)
      if (!row || !row.is_available) {
        return res.status(400).json({ error: 'One of those dishes is not available.' })
      }
      const unitPrice = Number(row.price)
      total += unitPrice * entry.quantity
      lineItems.push({ row, quantity: entry.quantity, unitPrice })
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Payments are not configured on this server.' })
    }

    const orderId = await withTransaction(async (client) => {
      const { rows } = await client.query(
        "INSERT INTO orders (user_id, status, total_amount, currency) VALUES ($1, 'pending', $2, $3) RETURNING id",
        [req.user.id, total.toFixed(2), config.stripe.currency],
      )
      const id = rows[0].id
      for (const lineItem of lineItems) {
        await client.query(
          'INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price) VALUES ($1, $2, $3, $4, $5)',
          [id, lineItem.row.id, lineItem.row.name, lineItem.quantity, lineItem.unitPrice.toFixed(2)],
        )
      }
      return id
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: config.stripe.currency,
      line_items: lineItems.map((lineItem) => ({
        price_data: {
          currency: config.stripe.currency,
          product_data: { name: lineItem.row.name },
          unit_amount: toCents(lineItem.unitPrice),
        },
        quantity: lineItem.quantity,
      })),
      metadata: { orderId: String(orderId), userId: String(req.user.id) },
      client_reference_id: String(orderId),
      success_url: config.appUrl + '/success?order_id=' + orderId,
      cancel_url: config.appUrl + '/?cancelled=1',
    })

    await query('UPDATE orders SET stripe_session_id = $1, updated_at = NOW() WHERE id = $2', [session.id, orderId])

    res.status(201).json({ orderId, url: session.url })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'That order does not exist.' })
    }
    const { rows: orderRows } = await query(
      'SELECT id, user_id, status, total_amount, currency, created_at, paid_at FROM orders WHERE id = $1',
      [id],
    )
    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'That order does not exist.' })
    }
    const order = orderRows[0]
    if (order.user_id !== req.user.id) {
      return res.status(404).json({ error: 'That order does not exist.' })
    }
    const { rows: itemRows } = await query(
      'SELECT id, name, quantity, unit_price FROM order_items WHERE order_id = $1 ORDER BY id',
      [id],
    )
    res.json({
      order: {
        id: order.id,
        status: order.status,
        totalAmount: Number(order.total_amount),
        currency: order.currency,
        createdAt: order.created_at,
        paidAt: order.paid_at,
        items: itemRows.map((row) => ({
          id: row.id,
          name: row.name,
          quantity: row.quantity,
          unitPrice: Number(row.unit_price),
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
