FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install fish shell (for user preference)
RUN apt-get update && apt-get install -y fish && rm -rf /var/lib/apt/lists/*

# Set up non-root user
USER node

# Set working directory
WORKDIR /workspace

# Copy package files for dependency installation
COPY --chown=node:node package*.json pnpm-lock.yaml* ./

# Install dependencies (will be run again in postCreateCommand but this caches layers)
RUN pnpm install --frozen-lockfile

# Expose ports
EXPOSE 3000 3001
