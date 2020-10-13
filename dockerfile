FROM node:lts-alpine

# for "healthchecks before deploy"
RUN apk --no-cache add curl

WORKDIR /app

COPY package*.json ./

COPY yarn.lock .

RUN npm install

COPY public public

COPY babel.config.js .
COPY vue.config.js .

COPY src src

CMD npm run build