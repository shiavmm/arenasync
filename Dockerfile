# ==============================================================================
# ArenaSync (BIT-57 Sports Platform) - Production Multi-Stage Dockerfile
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Builder Stage
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definition manifests
COPY package.json package-lock.json* bun.lock* ./

# Install dependencies needed for compiling React UI and bundling server
RUN npm install

# Copy application source code and configuration files
COPY tsconfig.json vite.config.ts index.html server.ts ./
COPY server ./server
COPY src ./src
COPY scripts ./scripts

# Build React client SPA and bundle Express production server into dist/
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Runtime Stage
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Production runtime environment variables
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Install minimal production dependencies only
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force

# Copy pre-built frontend SPA assets and bundled backend server from builder
COPY --from=builder /app/dist ./dist

# Security: Non-root execution using built-in node user
USER node

# Expose standard application port
EXPOSE 3000

# Container Healthcheck utilizing the built-in HTTP health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/actuator/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Start the ArenaSync production server
CMD ["node", "dist/server.cjs"]
