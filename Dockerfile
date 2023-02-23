FROM node:lts

RUN \
  apt-get update \
  && apt-get -y install gettext-base unoconv build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

RUN npm install pm2 -g
RUN npm install sass -g

RUN mkdir -p /habidat/node_modules && chown -R node:node /habidat

WORKDIR /habidat

COPY package*.json ./

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER node

RUN npm install 

RUN mkdir -p /habidat/public/images && mkdir -p /habidat/upload && mkdir -p /habidat/log && touch /habidat/log/access.log
COPY --chown=node:node . .

RUN sass scss:public/css

ENTRYPOINT ["docker-entrypoint.sh"]

CMD pm2-docker start app.js 
