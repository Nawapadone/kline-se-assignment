# syntax=docker/dockerfile:1

# ---- build ------------------------------------------------------------------
# Vite inlines VITE_* variables at build time, so the data source, the demo PIN
# and the UI language are build arguments, not runtime environment. A different
# setting means a different image.
FROM oven/bun:1.3.14-alpine@sha256:5acc90a93e91ff07bf72aa90a7c9f0fa189765aec90b47bdbf2152d2196383c0 AS build

WORKDIR /app

# Dependencies first, so a source-only change reuses this layer.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ARG VITE_USE_MOCK=true
ARG VITE_API_BASE_URL=""
ARG VITE_DEMO_PIN=123456
ARG VITE_LOCALE=en
ENV VITE_USE_MOCK=$VITE_USE_MOCK \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_DEMO_PIN=$VITE_DEMO_PIN \
    VITE_LOCALE=$VITE_LOCALE

# `build` is `tsc -b && vite build`, so a type error fails the image.
RUN bun run build

# ---- serve ------------------------------------------------------------------
# The output is static files. nginx serves them in ~20MB with no runtime of its
# own; nothing from the build stage — bun, node_modules, the sources — ships.
# The unprivileged image runs as uid 101 and listens on 8080.
FROM nginxinc/nginx-unprivileged:1.30-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03 AS serve

ARG VITE_API_BASE_URL=""

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

# The CSP allows XHR to the API origin the bundle was built for, so
# VITE_API_BASE_URL must be an origin (scheme://host[:port]); sed does not
# escape `&` or `|`.
USER root
RUN sed -i "s|__API_ORIGIN__|${VITE_API_BASE_URL}|" /etc/nginx/snippets/security-headers.conf
USER 101

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
