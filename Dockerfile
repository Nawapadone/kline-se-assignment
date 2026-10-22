# syntax=docker/dockerfile:1

# ---- build ------------------------------------------------------------------
# Vite inlines VITE_* variables at build time, so the data source and the demo
# PIN are build arguments, not runtime environment. A different setting means a
# different image.
FROM oven/bun:1.3.14-alpine AS build

WORKDIR /app

# Dependencies first, so a source-only change reuses this layer.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ARG VITE_USE_MOCK=true
ARG VITE_API_BASE_URL=""
ARG VITE_DEMO_PIN=123456
ENV VITE_USE_MOCK=$VITE_USE_MOCK \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_DEMO_PIN=$VITE_DEMO_PIN

# `build` is `tsc -b && vite build`, so a type error fails the image.
RUN bun run build

# ---- serve ------------------------------------------------------------------
# The output is static files. nginx serves them in ~20MB with no runtime of its
# own; nothing from the build stage — bun, node_modules, the sources — ships.
FROM nginx:1.27-alpine AS serve

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q -O /dev/null http://localhost/ || exit 1
