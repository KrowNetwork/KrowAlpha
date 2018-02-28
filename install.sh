curl -O https://hyperledger.github.io/composer/prereqs-ubuntu.sh

chmod u+x prereqs-ubuntu.sh

./prereqs-ubuntu.sh

npm install -g composer-cli

npm install -g composer-rest-server

npm install -g generator-hyperledger-composer

npm install -g yo

npm install -g composer-playground

mkdir fabric-tools && cd fabric-tools

curl -O https://raw.githubusercontent.com/hyperledger/composer-tools/master/packages/fabric-dev-servers/fabric-dev-servers.zip
unzip fabric-dev-servers.zip

cd fabric-tools
./downloadFabric.sh

cd fabric-tools
./startFabric.sh
./createPeerAdminCard.sh