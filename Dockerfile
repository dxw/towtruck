FROM node:24.18.0-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d

WORKDIR /towtruck
VOLUME data

ARG APP_ID
ARG PRIVATE_KEY
ARG CLIENT_ID
ARG CLIENT_SECRET
ARG WEBHOOK_SECRET
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG SESSION_SECRET
ARG BASE_URL
ARG REDIRECT_URL_BASE
ARG NODE_ENV

COPY . .

RUN mkdir -p data

RUN touch .env \
  && echo "APP_ID=$APP_ID" >> .env \
  && echo "PRIVATE_KEY=$PRIVATE_KEY" >> .env \
  && echo "CLIENT_ID=$CLIENT_ID" >> .env \
  && echo "CLIENT_SECRET=$CLIENT_SECRET" >> .env \
  && echo "WEBHOOK_SECRET=$WEBHOOK_SECRET" >> .env \
  && echo "GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID" >> .env \
  && echo "GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET" >> .env \
  && echo "SESSION_SECRET=$SESSION_SECRET" >> .env \
  && echo "BASE_URL=$BASE_URL" >> .env \
  && echo "REDIRECT_URL_BASE=$REDIRECT_URL_BASE" >> .env \
  && echo "NODE_ENV=$NODE_ENV" >> .env \
  && echo "RUN_SEED_ON_START=true" >> .env

RUN npm install

EXPOSE 3000
CMD [ "sh", "-c", "exec npm run start" ]
