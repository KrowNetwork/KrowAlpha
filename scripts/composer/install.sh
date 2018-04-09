#!/bin/bash

#exit on fail
set -e
export FABRIC_VERSION=hlfv11
installdir="/home/ubuntu/composer/"

curl -O https://hyperledger.github.io/composer/latest/prereqs-ubuntu.sh
chmod u+x prereqs-ubuntu.sh
./prereqs-ubuntu.sh

#"$installdir"/prereqs-ubuntu.sh

npm install -g composer-cli
npm install -g composer-rest-server
npm install -g generator-hyperledger-composer
npm install -g yo

#required, but not in hyperledger composer documentation
npm install -g grpc

#required, but not in hyperledger composer documentation
cd ~/.nvm/versions/node/v8.10.0/lib/node_modules/composer-rest-server/
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
