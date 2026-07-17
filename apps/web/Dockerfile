# Multi-stage production build for React Frontend
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root configurations and workspace declarations
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/web/package.json ./apps/web/

# Install build dependencies
RUN npm ci --workspace=packages/shared-types --workspace=apps/web

# Copy source files
COPY packages/shared-types ./packages/shared-types
COPY apps/web ./apps/web

# Build shared-types, then build the Vite static application
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=apps/web

# Serve static files with Nginx
FROM nginx:alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
