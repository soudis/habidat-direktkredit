# habiDAT Direktkredite

This app allows to manage direct loans from private persons to a project. In particular a habiTAT (Austrian housing syndicate) project. 

## Usage

Either clone repository or build Dockerfile. Create 

* site.json
* config.json
* projects.json

in config folder. Run app.js or run docker container. 

## Developing

You can user dev_entrypoint.sh for development with docker. You also need to mount the app directory from the host system to the /app directory of the container (using -v option).
