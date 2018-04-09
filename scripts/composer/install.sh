#!/bin/bash

#exit on fail
set -e
export FABRIC_VERSION=hlfv11
installdir="/home/ubuntu/composer"

read -p "Have you installed the pre-reqs (y/n)?" CONT
if [ "$CONT" != "y" ]; then
  echo "Please install the pre-reqs";
  exit 125;
fi

#"$installdir"/prereqs-ubuntu.sh

npm install -g composer-cli
npm install -g composer-rest-server
npm install -g generator-hyperledger-composer
npm install -g yo

#required, but not in hyperledger composer documentation
npm install -g grpc

#required, but not in hyperledger composer documentation
cd ~/.nvm/versions/node/v8.11.1/lib/node_modules/composer-rest-server/
npm rebuild --unsafe-prem

sudo apt-get install -y unzip

#download fabric-tools
mkdir "$installdir"/fabric-tools
cd "$installdir"/fabric-tools
curl -O  https://github.com/hyperledger/composer-tools/blob/master/packages/fabric-dev-servers/fabric-dev-servers.zip
unzip -q fabric-dev-servers.zip
sudo ./downloadFabric.sh

"$installdir"/setup-git.sh
"$installdir"/setup-admincard.sh

echo "Done."
