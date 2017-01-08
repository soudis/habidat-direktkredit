FROM node:boron

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN git clone https://github.com/soudis/habidat.git
RUN npm install
RUN npm install pm2 -g

VOLUME config
VOLUME public/files

CMD pm2 start app.js -n habidat