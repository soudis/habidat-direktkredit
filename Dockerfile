FROM node:boron

RUN git clone https://github.com/soudis/habidat.git
WORKDIR /habidat
RUN npm install
RUN npm install pm2 -g

VOLUME config
VOLUME public/files
VOLUME templates

CMD pm2-docker start app.js 