FROM node:20-alpine AS base
RUN apk add --no-cache python3 make g++
WORKDIR /app

FROM base AS frontend-deps
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install

FROM base AS backend-deps
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --frozen-lockfile 2>/dev/null || npm install

FROM frontend-deps AS frontend-build
COPY . .
RUN npm run build

FROM backend-deps AS backend-build
COPY server/tsconfig.json ./server/
COPY server/src ./server/src
RUN cd server && npm run build

FROM node:20-alpine AS production
RUN apk add --no-cache python3 make g++
WORKDIR /app

COPY --from=backend-deps /app/server/node_modules ./server/node_modules
COPY --from=backend-build /app/server/dist ./server/dist
COPY --from=backend-build /app/server/package.json ./server/
COPY --from=frontend-build /app/dist ./dist

RUN mkdir -p /app/server/data

ENV NODE_ENV=production
ENV DB_PATH=/app/server/data/netmanager.db
ENV HOST=0.0.0.0

EXPOSE 4000

WORKDIR /app/server
CMD ["node", "dist/index.js"]
