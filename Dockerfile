# ============================================
# Stage 1: Dependencies & Build
# ============================================
FROM node:22-alpine AS builder

# Install build tools for native modules (sharp, socket.io bindings)
RUN apk add --no-cache \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files first (Docker cache optimization)
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript to JavaScript  
RUN npm run build

# ============================================
# Stage 2: Production Runtime
# ============================================
FROM node:22-alpine

# Install runtime dependencies and dumb-init for signal handling
RUN apk add --no-cache \
    python3 \
    dumb-init \
    ffmpeg \
    bash

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy Swagger API documentation (required by src/index.ts line 37)
COPY --from=builder /app/API_DOCUMENT.yaml ./

# ⚠️ SECURITY WARNING: Copying .env.production with secrets into image
# This image should ONLY be pushed to private registries
# Never share this image publicly as it contains sensitive credentials
COPY --from=builder /app/.env.production ./.env

# Create necessary directories
RUN mkdir -p uploads

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose application port (from src/index.ts line 26: PORT = 8386)
EXPOSE 8386

# Health check using the /health endpoint (added at src/index.ts line 53)
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8386/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Use dumb-init to handle signals properly (for graceful shutdown)
ENTRYPOINT ["dumb-init", "--"] 

# Start application in production mode
CMD ["node", "dist/index.js", "--production"]
