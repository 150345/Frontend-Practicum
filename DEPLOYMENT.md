# Deployment

The app is split into two deployable pieces plus one database:

| Piece | What it is | Recommended host |
| --- | --- | --- |
| `server/` | Express 5 API + PostgreSQL sessions | Railway, Render, Fly.io |
| `dist/` | Built Vite frontend | Vercel, Netlify, Cloudflare Pages |
| PostgreSQL | Menu, users, sessions, saved tables | Neon, Supabase, Railway Postgres |

The API can also serve the built frontend itself (see
[Single-service deployment](#single-service-deployment)) — useful when the
session cookie needs to stay same-origin.

---

## 1. The database

Any PostgreSQL 14+ instance works. On Neon or Supabase copy the pooled
connection string and make sure it ends with `?sslmode=require`.

```bash
# Neon / Supabase
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

Then create the schema and load the menu:

```bash
cd server
npm install
DATABASE_URL="postgresql://..." SESSION_SECRET="..." npm run migrate
DATABASE_URL="postgresql://..." SESSION_SECRET="..." npm run seed
```

Both scripts are idempotent — `migrate` skips migrations it has already
applied and `seed` upserts the menu by slug, so it is safe to run them on
every deploy.

## 2. The API

### Railway (Dockerfile)

`server/Dockerfile` builds the API **and** the frontend into a single image.
`railway.json` at the repo root points Railway at it.

1. `railway login` and `railway init`
2. `railway add --database postgres`
3. Set the variables below
4. `railway up`

### Render / Fly.io (Node build)

```bash
npm install
npm run build          # builds the frontend into dist/
cd server && npm install && npm start
```

### Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `SESSION_SECRET` | yes | Long random string — signs the session cookie |
| `DATABASE_SSL` | no | `false` for a local database, `true` for hosted ones |
| `CLIENT_ORIGIN` | no | Comma separated list of allowed browser origins |
| `SESSION_SAME_SITE` | no | `lax` when same-site, `none` when cross-site |
| `SESSION_SECURE` | no | `true` to force the `Secure` cookie flag |
| `PORT` | no | Defaults to `4000` |

Generate a session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## 3. The frontend

```bash
npm install
npm run build     # outputs to dist/
```

Deploy the `dist/` folder to Vercel, Netlify or Cloudflare Pages. Set
`VITE_API_URL` to the public URL of the API.

### Cross-site cookies

If the frontend and the API live on different domains, the browser treats the
session cookie as third-party. To keep sign-in working:

- `SESSION_SAME_SITE=none` on the API
- `SESSION_SECURE=true` on the API
- `CLIENT_ORIGIN=https://your-frontend-domain` on the API

Modern browsers still require a `SameSite=None` cookie to be `Secure`, which
means the API must be served over HTTPS.

---

## Single-service deployment

`server/src/app.js` serves `dist/` from the same origin as the API when a
build is present. This is the simplest option, because the session cookie is
always first-party:

```bash
npm install && npm run build
cd server && npm install
cd server && node scripts/migrate.js && node scripts/seed.js && node src/index.js
```

The Docker image in `server/Dockerfile` does exactly this.

---

## Continuous deployment

`.github/workflows/ci.yml` runs the migrations, seeds the database and runs the
API smoke tests against a PostgreSQL service on every push.

`.github/workflows/deploy.yml` deploys to Railway on every push to `main`. It
needs three repository secrets and one variable:

- `RAILWAY_API_TOKEN` — a Railway account token
- `RAILWAY_PROJECT_ID` — the project to deploy to
- `RAILWAY_SERVICE_ID` — the service within that project
- `vars.API_URL` — the public URL, used for the post-deploy health check

Add them under **Settings → Secrets and variables → Actions**.
