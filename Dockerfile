# Multi-stage Dockerfile for Next.js Application

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Ensure public directory exists so runtime COPY does not fail in CI.
RUN mkdir -p /app/public

# Build the application
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create data directory for orders and Next.js image cache directory
RUN mkdir -p /app/data/orders && chown -R nextjs:nodejs /app/data
RUN mkdir -p /app/.next/cache && chown -R nextjs:nodejs /app/.next/cache

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000

# Start the application
# Use shell form to override HOSTNAME at process start — Azure Container Apps
# injects the replica ID into HOSTNAME at the OS level, which causes Next.js
# standalone server to fail DNS resolution. Setting it inline here ensures
# the server binds to 0.0.0.0 regardless of platform injection.
CMD HOSTNAME=0.0.0.0 node server.js
