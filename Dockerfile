FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache tzdata

COPY package*.json ./

RUN npm ci --only=production

COPY dist ./dist
COPY .env.example ./

ENV TZ=Europe/London

CMD ["node", "dist/index.js", "schedule"]
