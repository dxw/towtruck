FROM node:24.18.0-slim@sha256:b31e7a42fdf8b8aa5f5ed477c72d694301273f1069c5a2f71d53c6482e99a2fc

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
  && echo "REDIRECT_URL_BASE=$REDIRECT_URL_BASE" >> .env

RUN npm install

EXPOSE 3000
CMD [ "sh", "-c", "npm run seed && exec npm run start" ]
