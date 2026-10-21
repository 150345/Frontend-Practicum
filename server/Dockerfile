# Production image for the Juniper app (API + built frontend).
# Build from the repository root:  docker build -f server/Dockerfile .
FROM node:22-alpine

WORKDIR /app

# Install server dependencies first so the layer can be cached.
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --omit=dev

# Install the frontend dependencies and build the static site.
COPY package.json package-lock.json* ./
RUN npm ci
COPY index.html vite.config.js tailwind.config.js postcss.config.js ./
COPY src/ ./src/
RUN npm run build

# Copy the server source.
COPY server/ ./server/

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Run migrations and seed the menu, then start the API (which also serves the
# built frontend from the same origin).
CMD ["sh", "-c", "cd server && node scripts/migrate.js && node scripts/seed.js && node src/index.js"]
