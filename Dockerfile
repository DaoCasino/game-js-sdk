FROM node:alpine

ARG NPM_TOKEN

ENV NPM_TOKEN=$NPM_TOKEN

WORKDIR /tmp/js

COPY . .

RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc

RUN npm install

RUN npm run build

RUN npm publish