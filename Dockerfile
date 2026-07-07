FROM node:22.23.1-slim@sha256:813a7480f28fdadac1f7f5c824bcdad435b5bc1322a5968bbbdef8d058f9dff4

WORKDIR /towtruck
VOLUME data

ARG APP_ID
ARG PRIVATE_KEY
ARG CLIENT_ID
ARG CLIENT_SECRET
ARG WEBHOOK_SECRET

COPY . .

RUN mkdir -p data

RUN touch .env \
  && echo "APP_ID=$APP_ID" >> .env \
  && echo "PRIVATE_KEY=$PRIVATE_KEY" >> .env \
  && echo "CLIENT_ID=$CLIENT_ID" >> .env \
  && echo "CLIENT_SECRET=$CLIENT_SECRET" >> .env \
  && echo "WEBHOOK_SECRET=$WEBHOOK_SECRET" >> .env

RUN npm install

EXPOSE 3000
CMD [ "sh", "-c", "npm run seed && exec npm run start" ]
