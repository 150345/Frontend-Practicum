# Juniper Restaurant

A seasonal neighbourhood kitchen in East London. This repository holds a
React + Vite frontend and an Express + PostgreSQL API that serves the menu,
handles accounts and keeps saved tables in the database.

## What is in here

```
├── index.html            Vite entry point
├── src/                  React frontend
│   ├── api/client.js     Thin fetch wrapper around the API
│   ├── context/          Menu and auth providers
│   └── components/       Header, hero, menu, auth panel, table panel
├── server/               Express API
│   ├── db/migrations/    Forward-only SQL migrations
│   ├── scripts/          migrate, seed and smoke-test scripts
│   └── src/
│       ├── routes/       /api/auth, /api/menu, /api/selections
│       ├── middleware/   Session → user loading
│       └── services/     Password hashing and user helpers
└── .github/workflows/    CI and deployment
```

## Running it locally

You need Node 20+ and a PostgreSQL database. Docker is the quickest way to
get a database:

```bash
docker run -d --name juniper-pg \
  -e POSTGRES_PASSWORD=juniper_dev_pw \
  -e POSTGRES_USER=juniper \
  -e POSTGRES_DB=juniper \
  -p 5432:5432 postgres:16-alpine
```

Install the dependencies and set up the environment:

```bash
npm install
npm --prefix server install
cp server/.env.example server/.env
```

Fill in `server/.env` — at the very least `DATABASE_URL` and `SESSION_SECRET`:

```bash
DATABASE_URL=postgresql://juniper:juniper_dev_pw@localhost:5432/juniper
DATABASE_SSL=false
SESSION_SECRET=your-long-random-string
CLIENT_ORIGIN=http://localhost:5173
```

Create the schema and load the menu:

```bash
npm run migrate
npm run seed
```

Start both processes:

```bash
npm run api     # the API on http://localhost:4000
npm run dev     # the frontend on http://localhost:5173
```

The Vite dev server proxies `/api` to the API, so the session cookie stays
same-origin and sign-in works without any CORS setup.

## Tests

The API ships with a smoke test that exercises the menu, signup, login,
sessions and saved tables:

```bash
npm run api:start &
npm run smoke
```

CI runs the same script against a real PostgreSQL on every push.

## The API

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | no | Liveness check |
| `GET` | `/api/menu` | no | The whole menu, grouped by category |
| `GET` | `/api/menu/:slug` | no | A single dish |
| `POST` | `/api/auth/signup` | no | Create an account and start a session |
| `POST` | `/api/auth/login` | no | Sign in |
| `POST` | `/api/auth/logout` | no | End the session |
| `GET` | `/api/auth/me` | no | The signed-in user, or `null` |
| `GET` | `/api/selections` | yes | The tables the visitor saved |
| `POST` | `/api/selections` | yes | Save the current table |
| `DELETE` | `/api/selections/:id` | yes | Remove a saved table |

Sessions are stored in PostgreSQL (`user_sessions`) and the cookie is
`httpOnly`, `SameSite` aware and `Secure` in production. Passwords are hashed
with bcrypt.

## Deploying

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full guide — database, API,
frontend, environment variables and continuous deployment.
