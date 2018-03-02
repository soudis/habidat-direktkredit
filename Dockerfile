FROM node:boron

ARG HABIDAT_DK_PROJECT_ID
ARG HABIDAT_DK_PROJECT_NAME
ARG HABIDAT_ADMIN_EMAIL
ARG HABIDAT_DK_DB_USER
ARG HABIDAT_DK_DB_PASSWORD
ARG HABIDAT_DK_DB_DATABASE
ARG HABIDAT_DK_DB_HOST

RUN git clone https://github.com/soudis/habidat.git
WORKDIR /habidat
RUN npm install
RUN npm install pm2 -g

RUN \
  apt-get update \
  && apt-get -y install gettext-base \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

RUN envsubst < /habidat/config/projects.json.sample > /habidat/config/projects.json
RUN envsubst < /habidat/config/config.json.sample > /habidat/config/config.json
RUN envsubst < /habidat/config/site.json.sample > /habidat/config/site.json

CMD pm2-docker start app.js 
