# Build stage
FROM node:18-alpine AS builder

RUN npm install -g pnpm

WORKDIR /usr/src/app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install ALL dependencies (including devDependencies for building)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:18-alpine AS production

RUN npm install -g pnpm

WORKDIR /usr/src/app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder stage
COPY --from=builder /usr/src/app/build ./build

# Expose port
EXPOSE 8080

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S expressJs -u 1001
USER expressJs

# Start the application
CMD ["pnpm", "start"]