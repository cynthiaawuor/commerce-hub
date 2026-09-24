# Each service builds and deploys on its own: the spec requires that a fix here never
# forces a redeploy of another module.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# The emitted Prisma contract is read at runtime
COPY --from=build /app/src/prisma/contract.json ./dist/prisma/contract.json
CMD ["node", "dist/server.js"]
