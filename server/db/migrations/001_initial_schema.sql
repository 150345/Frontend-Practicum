-- Juniper Restaurant core schema.
-- Users, the PostgreSQL-backed session store, the menu and table selections.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Emails are stored lower-cased so that uniqueness is case-insensitive.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key ON users (LOWER(email));

-- Session store used by connect-pg-simple (express-session).
CREATE TABLE IF NOT EXISTS user_sessions (
  sid    VARCHAR NOT NULL COLLATE "default",
  sess   JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_sid_key ON user_sessions (sid);
CREATE INDEX IF NOT EXISTS user_sessions_expire_idx ON user_sessions (expire);

CREATE TABLE IF NOT EXISTS menu_categories (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  number      TEXT,
  title       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_items (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  category_id INTEGER NOT NULL REFERENCES menu_categories (id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  description TEXT NOT NULL,
  diet        TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS menu_items_category_idx ON menu_items (category_id);

-- A saved selection of portions, owned by a signed-in user.
CREATE TABLE IF NOT EXISTS table_selections (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT 'My table',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS table_selections_user_idx ON table_selections (user_id);

CREATE TABLE IF NOT EXISTS table_selection_items (
  selection_id INTEGER NOT NULL REFERENCES table_selections (id) ON DELETE CASCADE,
  menu_item_id INTEGER NOT NULL REFERENCES menu_items (id) ON DELETE CASCADE,
  quantity     INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  PRIMARY KEY (selection_id, menu_item_id)
);
