FROM node:22-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json tsconfig*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /usr/src/app

ARG PORT
ENV NODE_ENV=production
ENV PORT=${PORT}

COPY --from=builder /usr/src/app/dist ./dist
COPY package*.json ./
RUN npm ci --omit=dev

EXPOSE ${PORT}

CMD ["sh", "-c", "node dist/main.js"]