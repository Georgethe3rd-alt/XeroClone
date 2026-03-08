FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY server.js ./
COPY public ./public

ENV PORT=80
ENV ANTHROPIC_API_KEY=""
ENV TELEGRAM_TOKEN=""
ENV TELEGRAM_CHAT_ID=""
ENV DASH_PASSWORD="Wayne2026#"

EXPOSE 80

CMD ["node", "server.js"]
