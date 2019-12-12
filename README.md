# habiDAT Direktkredite

This app is a direct loan management software for self organized housing projects like the ones of habiTAT (Austria) or Mietshäusersyndikat (Germany). It's no accounting software!

## Features

- Manage contacts, contracts and transaction with input validation to minimize human errors
- Different forms of loans (cancellation period, duration, end date)
- Multiagent (manage different projects / loan takers with 1 installation)
- Automatic interest calculation with different interest calculation methods
- Export of yearly summary for accounting
- Generate fully customizable documents for lenders (supports office document templates)
- Loan statistics including payback management and German legal limits (Bagatellgrenze)
- Procrastination support

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

## Document templates

You can generate custom documents within the app. Go to "Administration / Vorlagen" to upload new templates. The fields you can use are listed on the upload page and you can find examples here in the respository under "template samples".

## Developing

You can user dev_entrypoint.sh for development with docker. You also need to mount the source code directory from the host system to the /app directory of the container.
