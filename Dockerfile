FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

COPY . .
RUN npm run icons
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8787
ENV CREDENTIALS_DIR=/data/credentials

COPY --from=build /app /app
RUN mkdir -p /data/credentials

EXPOSE 8787
CMD ["npm", "run", "start"]
