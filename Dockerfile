FROM node:lts

RUN \
  apt-get update \
  && apt-get -y install gettext-base unoconv build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

RUN npm install pm2 -g

RUN mkdir -p /habidat/node_modules && chown -R node:node /habidat

WORKDIR /habidat

COPY package*.json ./

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER node

RUN npm install 

RUN mkdir -p /habidat/public/images
COPY --chown=node:node . .

ENTRYPOINT ["docker-entrypoint.sh"]

CMD pm2-docker start app.js 
