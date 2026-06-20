FROM oven/bun:1.2 AS api-build
WORKDIR /app
COPY apps/api/package.json apps/api/bun.lock* ./
RUN bun install --frozen-lockfile || bun install
COPY apps/api/ ./
RUN bun run build

FROM node:22-alpine AS web-build
WORKDIR /app
COPY apps/web/package.json apps/web/package-lock.json* ./
RUN npm install
COPY apps/web/ ./
ENV API_URL=http://localhost:3001
RUN npm run build

FROM oven/bun:1.2-slim
WORKDIR /app
COPY --from=api-build /app/dist ./api/dist
COPY --from=api-build /app/node_modules ./api/node_modules
COPY --from=api-build /app/package.json ./api/
COPY --from=web-build /app/.next ./web/.next
COPY --from=web-build /app/public ./web/public
COPY --from=web-build /app/package.json ./web/
EXPOSE 3001
ENV NODE_ENV=production
CMD ["bun", "run", "api/dist/index.js"]
