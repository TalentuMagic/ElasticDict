FROM node:latest

WORKDIR /app

COPY app/ ./

RUN chown -R node:node /app
USER node

EXPOSE 5000

CMD sh -c "\
    if [ ! -f package.json ]; then \
        npm init -y; \
    fi && \
    npm install --omit=dev axios express swagger-ui-express swagger-jsdoc && \
    node app.js \
"