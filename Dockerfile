# Multi-stage build for Next.js production deployment
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments for environment variables
ARG NEXT_PUBLIC_AZURE_CLIENT_ID
ARG NEXT_PUBLIC_AZURE_TENANT_ID
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_APP_IDENTIFIER
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_REDIRECT_URI
ARG TEAMTAILOR_API_KEY
ARG OPENAI_API_KEY
ARG GEMINI_API_KEY
ARG NEXT_PUBLIC_TESTDOME_API_KEY
ARG NEXT_PUBLIC_TESTDOME_ACCOUNT
ARG NEXT_PUBLIC_SUPER_ADMIN_EMAILS
ARG NEXT_PUBLIC_SUPER_ADMIN_OIDS
ARG NEXT_PUBLIC_APP_ID
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_DEFAULT_USER_ROLE
ARG NEXT_PUBLIC_DEFAULT_ROLE
ARG NEXT_PUBLIC_AUTO_PROVISION_USERS
ARG NEXT_PUBLIC_REQUIRE_EXPLICIT_ACCESS
ARG NEXT_PUBLIC_ENABLE_USER_REGISTRATION
ARG NEXT_PUBLIC_ENABLE_AUDIT_LOGGING
ARG NEXT_PUBLIC_PERMISSION_CACHE_TTL
ARG NEXT_PUBLIC_MAX_ROLES_PER_USER

# Set environment variables for build from build args
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_AZURE_CLIENT_ID=$NEXT_PUBLIC_AZURE_CLIENT_ID
ENV NEXT_PUBLIC_AZURE_TENANT_ID=$NEXT_PUBLIC_AZURE_TENANT_ID
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_APP_IDENTIFIER=$NEXT_PUBLIC_APP_IDENTIFIER
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_REDIRECT_URI=$NEXT_PUBLIC_REDIRECT_URI
ENV TEAMTAILOR_API_KEY=$TEAMTAILOR_API_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY
ENV NEXT_PUBLIC_TESTDOME_API_KEY=$NEXT_PUBLIC_TESTDOME_API_KEY
ENV NEXT_PUBLIC_TESTDOME_ACCOUNT=$NEXT_PUBLIC_TESTDOME_ACCOUNT
ENV NEXT_PUBLIC_SUPER_ADMIN_EMAILS=$NEXT_PUBLIC_SUPER_ADMIN_EMAILS
ENV NEXT_PUBLIC_SUPER_ADMIN_OIDS=$NEXT_PUBLIC_SUPER_ADMIN_OIDS
ENV NEXT_PUBLIC_APP_ID=$NEXT_PUBLIC_APP_ID
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_DEFAULT_USER_ROLE=$NEXT_PUBLIC_DEFAULT_USER_ROLE
ENV NEXT_PUBLIC_DEFAULT_ROLE=$NEXT_PUBLIC_DEFAULT_ROLE
ENV NEXT_PUBLIC_AUTO_PROVISION_USERS=$NEXT_PUBLIC_AUTO_PROVISION_USERS
ENV NEXT_PUBLIC_REQUIRE_EXPLICIT_ACCESS=$NEXT_PUBLIC_REQUIRE_EXPLICIT_ACCESS
ENV NEXT_PUBLIC_ENABLE_USER_REGISTRATION=$NEXT_PUBLIC_ENABLE_USER_REGISTRATION
ENV NEXT_PUBLIC_ENABLE_AUDIT_LOGGING=$NEXT_PUBLIC_ENABLE_AUDIT_LOGGING
ENV NEXT_PUBLIC_PERMISSION_CACHE_TTL=$NEXT_PUBLIC_PERMISSION_CACHE_TTL
ENV NEXT_PUBLIC_MAX_ROLES_PER_USER=$NEXT_PUBLIC_MAX_ROLES_PER_USER

# Build the application
RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy package.json for runtime dependencies info
COPY --from=builder /app/package.json ./package.json

# Set correct permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]