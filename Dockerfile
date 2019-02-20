FROM node:carbon

ENV HABIDAT_DK_PROJECT_ID project
ENV HABIDAT_DK_PROJECT_NAME Projectname
ENV HABIDAT_LOGO logo.gif
ENV HABIDAT_ADMIN_EMAIL admin@example.com
ENV HABIDAT_DK_ADMIN_PASSWORD secret
ENV HABIDAT_DK_DB_USER project
ENV HABIDAT_DK_DB_PASSWORD secret
ENV HABIDAT_DK_DB_DATABASE project
ENV HABIDAT_DK_DB_HOST db
ENV HABIDAT_DK_LDAP_HOST ldap
ENV HABIDAT_DK_LDAP_PORT 389
ENV HABIDAT_DK_LDAP_BINDDN cn=ldap-read,dc=example,dc=com
ENV HABIDAT_DK_LDAP_PASSWORD secret
ENV HABIDAT_DK_LDAP_BASE dc=example,dc=com
ENV HABIDAT_DK_LDAP_SEARCHFILTER (cn={{username}})

RUN \
  apt-get update \
  && apt-get -y install gettext-base unoconv \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

ADD . /habidat

RUN mkdir -p /habidat/public/images

WORKDIR /habidat
RUN npm install && npm install pm2 -g

# RUN envsubst < /habidat/config/projects.json.sample > /habidat/config/projects.json
# RUN envsubst < /habidat/config/config.json.sample > /habidat/config/config.json
# RUN envsubst < /habidat/config/site.json.sample > /habidat/config/site.json

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
RUN ln -s usr/local/bin/docker-entrypoint.sh / # backwards compat
ENTRYPOINT ["docker-entrypoint.sh"]

CMD pm2-docker start app.js 
