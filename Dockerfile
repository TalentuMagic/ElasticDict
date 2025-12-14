FROM node:latest

WORKDIR /app

COPY app/package*.json ./

RUN npm ci --omit=dev || npm install --omit=dev

COPY app/ ./

RUN chown -R node:node /app
USER node

EXPOSE 5000

CMD ["node", "app.js"]