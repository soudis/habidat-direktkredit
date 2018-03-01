FROM node:boron

RUN git clone https://github.com/soudis/habidat.git
WORKDIR /habidat
RUN npm install
RUN npm install pm2 -g

VOLUME /habidat/config
VOLUME /habidat/public/files
VOLUME /habidat/public/images
VOLUME /habidat/templates

RUN envsubst < config/projects.json.sample > config/projects.json

CMD pm2-docker start app.js 
