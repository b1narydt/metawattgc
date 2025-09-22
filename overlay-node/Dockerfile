# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# Install OS deps (optional)
RUN apk add --no-cache python3 make g++

# Install deps first for better layer caching (include dev deps for build stage)
COPY package*.json ./
# Prefer deterministic install if lockfile exists
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Build
RUN npm run build

# Runtime image (slim)
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install only production deps
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --production; fi

# Copy built artifacts
COPY --from=base /app/dist ./dist

# Copy package.json for runtime metadata
COPY --from=base /app/package.json ./package.json

# Expose port
EXPOSE 4000

# Start the overlay node
CMD ["node", "dist/index.js"]
