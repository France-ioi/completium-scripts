#!/bin/sh
docker run --name tezos -t -d -v /home/admin/tezos-docker/data:/home/gitpod/data tezos-docker
