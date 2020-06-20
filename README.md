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


# project info
ENV HABIDAT_DK_PROJECT_ID project
ENV HABIDAT_DK_PROJECT_NAME Projectname
ENV HABIDAT_DK_LOGO logo.gif
ENV HABIDAT_DK_EMAIL support@example.com

# project defaults
ENV HABIDAT_DK_PROJECT_DEFAULTS_INTEREST_METHOD 365_compound
ENV HABIDAT_DK_PROJECT_DEFAULTS_TERMINATION_TYPE T
ENV HABIDAT_DK_PROJECT_DEFAULTS_TERMINATION_PERIOD 6
ENV HABIDAT_DK_PROJECT_DEFAULTS_TERMINATION_PERIOD_TYPE M

# database settings
ENV HABIDAT_DK_DB_URI mysql://user:pass@example.com:1234/dbname
ENV HABIDAT_DK_DB_USER project
ENV HABIDAT_DK_DB_PASSWORD secret
ENV HABIDAT_DK_DB_DATABASE project
ENV HABIDAT_DK_DB_HOST db

# admin authentication settings
ENV HABIDAT_DK_ADMIN_AUTH ldap

# ldap settings (optional)
ENV HABIDAT_DK_LDAP_HOST ldap
ENV HABIDAT_DK_LDAP_PORT 389
ENV HABIDAT_DK_LDAP_BINDDN cn=ldap-read,dc=example,dc=com
ENV HABIDAT_DK_LDAP_PASSWORD secret
ENV HABIDAT_DK_LDAP_BASE dc=example,dc=com
ENV HABIDAT_DK_LDAP_SEARCHFILTER (cn={{username}})

# web server settings
ENV HABIDAT_DK_PORT_HTTP 80
ENV HABIDAT_DK_HTTPS false
ENV HABIDAT_DK_PORT_HTTPS 443
ENV HABIDAT_DK_SSL_CERT config/certificate.pem
ENV HABIDAT_DK_SSL_KEY config/key.pem
ENV HABIDAT_DK_REVERSE_PROXY true

# for bootstrap admin account
ENV HABIDAT_DK_ADMIN_USER admin
ENV HABIDAT_DK_ADMIN_EMAIL admin@example.com
ENV HABIDAT_DK_ADMIN_PASSWORD secret