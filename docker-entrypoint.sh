#!/bin/bash
set -e

if [ ! -f config/config.json ]
then
	echo "Generating config.json..."
	envsubst < config/config.sample.json > config/config.json
fi

if [ ! -f config/project.json ]
then
	echo "Generating project.json..."
	envsubst < config/project.sample.json > config/project.json
fi

exec "$@"