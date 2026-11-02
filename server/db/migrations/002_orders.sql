-- Orders and order items for Stripe Checkout purchases.

CREATE TABLE IF NOT EXISTS orders (
  id                      SERIAL PRIMARY KEY,
  user_id                 INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status                  TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'expired')),
  total_amount            NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  currency                TEXT NOT NULL DEFAULT 'gbp',
  stripe_session_id       TEXT,
  stripe_payment_intent_id TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at                 TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS orders_user_idx ON orders (user_id);
CREATE INDEX IF NOT EXISTS orders_stripe_session_idx ON orders (stripe_session_id);

CREATE TABLE IF NOT EXISTS order_items (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  menu_item_id  INTEGER REFERENCES menu_items (id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);
