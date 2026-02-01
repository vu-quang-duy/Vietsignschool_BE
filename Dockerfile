FROM node:20.12.2-alpine AS base

# ==========================================
# Builder stage - Install all dependencies
# ==========================================
FROM base AS builder
WORKDIR /usr/src/app
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# ==========================================
# Production stage
# ==========================================
FROM base AS production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /usr/src/app

# Install mysql-client for DB connection check
RUN apk add --no-cache mysql-client python3 make g++

COPY package.json package-lock.json* ./

# Remove husky prepare script to avoid errors
RUN apk add --no-cache jq && \
    jq 'del(.scripts.prepare)' package.json > package.tmp.json && \
    mv package.tmp.json package.json

# Install production dependencies only
RUN npm install --omit=dev --unsafe-perm

# Copy source code
COPY --from=builder /usr/src/app/src ./src

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "src/index.js"]
