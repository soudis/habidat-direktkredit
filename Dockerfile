FROM node:boron

RUN git clone https://github.com/soudis/habidat.git
WORKDIR /habidat
RUN npm install
RUN npm install pm2 -g

VOLUME /habidat/config
VOLUME /habidat/public/files
VOLUME /habidat/public/images
VOLUME /habidat/templates

RUN \
  apt-get update \
  && apt-get -y install gettext-base \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*
  
RUN cat /habidat/config/projects.json.sample

RUN envsubst < /habidat/config/projects.json.sample > /habidat/config/projects.json
RUN envsubst < /habidat/config/config.json.sample > /habidat/config/config.json
RUN envsubst < /habidat/config/site.json.sample > /habidat/config/site.json

CMD pm2-docker start app.js 
