#!/bin/bash

cd /habidat  
npm install  
sass scss:public/css
./node_modules/nodemon/bin/nodemon.js --legacy-watch app.js
