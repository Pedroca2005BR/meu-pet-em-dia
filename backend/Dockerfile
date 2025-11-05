# Build and run Express backend
FROM node:20-slim

WORKDIR /usr/src/app

# Install build tools in case native deps (e.g., better-sqlite3) need to compile
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Copy package manifests first for better caching
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/

WORKDIR /usr/src/app/backend
RUN npm ci

# Copy source
COPY backend/ /usr/src/app/backend/

# Build TypeScript
RUN npm run build

# Runtime env
ENV NODE_ENV=production \
    PORT=3001

EXPOSE 3001

# Ensure data and uploads directories exist
RUN mkdir -p /usr/src/app/backend/data /usr/src/app/uploads

# Start server
CMD ["node", "dist/index.js"]


