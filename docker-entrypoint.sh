#!/bin/bash
set -e

if [ ! -f config/config.json ]
then
	echo "Generating config.json..."
	envsubst < config/config.json.sample > config/config.json
fi

if [ ! -f config/projects.json ]
then
	echo "Generating projects.json..."
	envsubst < config/projects.json.sample > config/projects.json
fi

if [ ! -f config/site.json ]
then
	echo "Generating site.json..."
	envsubst < config/site.json.sample > config/site.json
fi


exec "$@"