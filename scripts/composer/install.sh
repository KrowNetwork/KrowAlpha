#!/bin/bash

#exit on fail
set -e

#npm install -g composer-cli
#npm install -g composer-rest-server
#npm install -g generator-hyperledger-composer
#npm install -g yo

curdir="$(dirname "$(readlink -f "$0")")"

mkdir "$curdir"/fabric-tools
cd "$curdir"/fabric-tools

curl -O https://raw.githubusercontent.com/hyperledger/composer-tools/master/packages/fabric-dev-servers/fabric-dev-servers.zip
unzip -q fabric-dev-servers.zip

./downloadFabric.sh
