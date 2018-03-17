#!/bin/bash

#exit on fail
set -e

repodir="/home/ubuntu/krow/KrowAlpha"
dockerdir="$repodir/composer"
composerdir="$repodir/krow"
installdir="/home/ubuntu/composer/"

repository=${REPOSITORY-"KrowNetwork/KrowAlpha.git"}
token="ff7210fe63d1593df37e7fe01653ad46dc706377"

cd "$installdir"/fabric-tools
sudo ./startFabric.sh

mkdir -p "$repodir"
cd "$repodir"/..
git clone https://"$token"@github.com/"$repository"

cd "$dockerdir"
sudo docker-compose start

cd "$installdir"/fabric-tools
./createPeerAdminCard.sh

cd "$composerdir"
composer archive create -t dir -n .
composer runtime install --card PeerAdmin@hlfv1 --businessNetworkName krow
composer network start --card PeerAdmin@hlfv1 --networkAdmin admin --networkAdminEnrollSecret adminpw --archiveFile krow@0.0.1.bna --file networkadmin.card
composer card import --file networkadmin.card

#teardown fabric
cd "$installdir"/fabric-tools
sudo ./teardownFabric.sh

echo "Done."
