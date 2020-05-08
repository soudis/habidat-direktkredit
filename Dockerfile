FROM node:lts

RUN \
  apt-get update \
  && apt-get -y install gettext-base unoconv \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

ADD . /habidat

RUN mkdir -p /habidat/public/images 

WORKDIR /habidat
RUN npm install && npm install pm2 -g

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
RUN ln -s usr/local/bin/docker-entrypoint.sh / # backwards compat
ENTRYPOINT ["docker-entrypoint.sh"]

CMD pm2-docker start app.js 
