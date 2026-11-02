import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

const MAX_POLLS = 8
const POLL_DELAY = 1500

export function SuccessPage() {
  const params = new URLSearchParams(window.location.search)
  const orderIdParam = params.get('order_id')
  const orderId = Number(orderIdParam)

  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const [pollCount, setPollCount] = useState(0)

  useEffect(() => {
    if (!Number.isInteger(orderId)) {
      setError('That order link is not valid.')
      return undefined
    }

    let cancelled = false
    let timer = null

    async function load() {
      try {
        const data = await api.getOrder(orderId)
        if (cancelled) return
        setOrder(data.order)
        if (data.order.status !== 'paid' && pollCount < MAX_POLLS) {
          timer = window.setTimeout(() => setPollCount((count) => count + 1), POLL_DELAY)
        }
      } catch (err) {
        if (cancelled) return
        setError(err.message)
      }
    }

    load()
    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [orderId, pollCount])

  if (error) {
    return (
      <section className="success-page">
        <h1>Something went wrong</h1>
        <p>{error}</p>
        <a href="/">Back to the menu</a>
      </section>
    )
  }

  if (!order) {
    return (
      <section className="success-page">
        <h1>Checking your order</h1>
        <p>One moment while we confirm your payment.</p>
      </section>
    )
  }

  const isPaid = order.status === 'paid'

  return (
    <section className="success-page">
      <h1>{isPaid ? 'Payment confirmed' : 'Payment pending'}</h1>
      <p>
        {isPaid
          ? 'Thank you. Your order has been received and is being prepared.'
          : 'We have not yet received confirmation from Stripe. This can take a few seconds.'}
      </p>
      <div className="success-page__summary">
        <p>
          <strong>Order #{order.id}</strong> {order.status}
        </p>
        <p>Total: {order.currency.toUpperCase()} {order.totalAmount.toFixed(2)}</p>
        <ul>
          {order.items.map((item) => (
            <li key={item.id}>
              {item.name} {item.quantity} {order.currency.toUpperCase()} {(item.unitPrice * item.quantity).toFixed(2)}
            </li>
          ))}
        </ul>
      </div>
      {!isPaid && pollCount < MAX_POLLS ? <p>Waiting for confirmation</p> : null}
      <a href="/">Back to the menu</a>
    </section>
  )
}