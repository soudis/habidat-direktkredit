# habiDAT Direktkredite

This app allows to manage direct loans from private persons to a project. In particular a habiTAT (Austrian housing syndicate) project. 

## Usage

Either clone repository or build Dockerfile. Create 

* site.json
* config.json
* projects.json

in config folder. Run app.js or run docker container. 

## Usage with docker-compose (recommended)

1. create docker-compose.yml from docker-compose.yml.sample
2. change environment variables in docker-compose.yml, especially:
  * db:
    * MYSQL_ROOT_PASSWORD
    * MYSQL_PASSWORD
  * web:
    * HABIDAT_DK_PROJECT_ID
    * HABIDAT_DK_PROJECT_NAME
    * HABIDAT_LOGO
    * HABIDAT_ADMIN_EMAIL
    * HABIDAT_DK_ADMIN_USERNAME
    * HABIDAT_DK_ADMIN_PASSWORD
    * HABIDAT_DK_DB_PASSWORD
3. create containers with `docker-compose up -d`
4. copy logo image to container with `docker cp /path/to/my-logo.gif "$(docker-compose ps -q web)":/habidat/public/images`
5. access with http://localhost:8020

It's recommended to use a revery proxy such as apache or nginx on your web server.


## Developing

You can user dev_entrypoint.sh for development with docker. You also need to mount the source code directory from the host system to the /app directory of the container.
