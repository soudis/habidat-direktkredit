#!/bin/bash

cd /habidat  
npm install  
./node_modules/nodemon/bin/nodemon.js --legacy-watch app.js
