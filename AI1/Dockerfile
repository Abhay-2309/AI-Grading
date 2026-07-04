# ── deps: install once, shared by both build and dev stages ──────────
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── dev: hot-reload target used by docker-compose ─────────────────────
FROM deps AS dev
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ── build: compile TypeScript ──────────────────────────────────────────
FROM deps AS build
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# ── runtime: slim production image ────────────────────────────────────
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

# Sharp ships prebuilt binaries for this platform — no native toolchain
# needed in the runtime image, keeping the build fast and the image small.
EXPOSE 3000
USER node
CMD ["node", "dist/server.js"]
