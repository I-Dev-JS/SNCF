#!/bin/bash

set -e

docker-compose pull
docker-compose down
docker-compose --env-file=.env up -d --build --remove-orphans
docker image prune -f
