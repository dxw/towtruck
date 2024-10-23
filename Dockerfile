FROM node:22.10.0-slim

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
