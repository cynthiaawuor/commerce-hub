# Each service builds and deploys on its own: a fix here never forces a redeploy of
# another module. Built from the repository root, so the image can include its API spec:
#
#   docker build -f service-inventory/Dockerfile -t commerce/inventory .
#   docker build -f service-inventory/Dockerfile --target migrate -t commerce/inventory-migrate .

FROM node:22-alpine AS build
WORKDIR /app
COPY service-inventory/package.json service-inventory/package-lock.json ./
RUN npm ci
COPY service-inventory/ ./
# One file with every import resolved. tsc's output cannot run on Node as it is, because
# the source imports have no .js extensions. Packages stay external and are installed below.
RUN npx esbuild src/server.ts --bundle --platform=node --format=esm --target=node22 \
      --packages=external --outfile=dist/server.js

# Applies the database migrations, then exits. Run it before each new version starts.
FROM build AS migrate
CMD ["npx", "prisma", "db", "migrate", "--yes", "--no-interactive"]

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3002 \
    OPENAPI_SPEC=/app/contracts/inventory.yaml
COPY service-inventory/package.json service-inventory/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY contracts/openapi/inventory.yaml ./contracts/
USER node
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:$PORT/inventory-api/health > /dev/null || exit 1
CMD ["node", "dist/server.js"]
