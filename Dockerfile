# Stage 1: Dependencies
FROM node:20-alpine AS deps

# Install pnpm
RUN corepack enable && \
    corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod && \
    pnpm store prune

# Stage 2: Builder
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && \
    corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies (including dev dependencies for building)
RUN pnpm install --frozen-lockfile && \
    pnpm store prune

# Copy source code
COPY . .

# Run codegen and typecheck (if needed for ponder)
RUN pnpm run codegen || true

# Stage 3: Runtime
FROM node:20-alpine AS runtime

# Enable corepack and install pnpm
RUN corepack enable && \
    corepack prepare pnpm@latest --activate && \
    pnpm config set store-dir /pnpm/store

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies from deps stage
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/ponder*.config.ts ./
COPY --from=builder --chown=nodejs:nodejs /app/ponder.schema.ts ./ponder.schema.ts
COPY --from=builder --chown=nodejs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nodejs:nodejs /app/abis ./abis
COPY --from=builder --chown=nodejs:nodejs /app/src ./src

# Ensure nodejs user owns the entire /app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 42069

# Start the application
CMD ["npm", "start"]
