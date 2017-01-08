FROM node:boron

RUN mkdir -p /usr/src/app
RUN cd /usr/src/app

RUN git clone https://github.com/soudis/habidat.git
WORKDIR /usr/src/app/habidat
RUN npm install
RUN npm install pm2 -g

VOLUME config
VOLUME public/files
VOLUME templates

CMD pm2 start app.js -n habidat