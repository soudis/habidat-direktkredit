#!/bin/bash

cd /habidat  
npm install  
sass --watch scss:public/css &
./node_modules/nodemon/bin/nodemon.js --legacy-watch app.js
