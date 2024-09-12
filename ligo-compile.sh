#!/bin/bash
echo /usr/local/bin/ligo compile contract --syntax $1 -o "$3" "$2" > /tmp/ligotmp
if ! /usr/local/bin/ligo compile contract --syntax $1 -o "$3" "$2"
then
    exit 1
fi
/usr/bin/nodejs /tezos/ligo-metadata.js "$2" "$4"
