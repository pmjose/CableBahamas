# syntax=docker/dockerfile:1
# Cable Bahamas web app for Snowpark Container Services (linux/amd64).

FROM --platform=linux/amd64 node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Optional CARTO basemap key, baked into the SPA bundle at build time.
ARG VITE_CARTO_BASEMAP_KEY=""
ENV VITE_CARTO_BASEMAP_KEY=${VITE_CARTO_BASEMAP_KEY}
RUN npm run build:spcs && npm run build:server

FROM --platform=linux/amd64 node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Runtime needs only the server's dependencies.
RUN npm init -y >/dev/null && npm pkg delete dependencies devDependencies scripts \
 && node -e "const p=require('./package-lock.json').packages['']; const d=p.dependencies; console.log(['express@'+d.express,'snowflake-sdk@'+d['snowflake-sdk']].join(' '))" > /tmp/deps \
 && rm package-lock.json && npm install --omit=dev --no-audit --no-fund $(cat /tmp/deps)

FROM --platform=linux/amd64 node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/server/dist ./server
COPY --from=build /app/dist ./dist
RUN printf '{"type":"module"}\n' > package.json
USER node
EXPOSE 8080
CMD ["node", "server/index.js"]
