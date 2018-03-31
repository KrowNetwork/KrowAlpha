#!/bin/bash

#exit on fail
set -e

repodir="/home/ubuntu/krow/KrowAlpha"
composerdir="$repodir/krow"
dockerdir="$repodir/composer"
installdir="/home/ubuntu/composer"

cd "$dockerdir"
sudo docker-compose start

cd "$installdir"/fabric-tools
./createPeerAdminCard.sh

cd "$composerdir"
composer archive create -t dir -n .
composer runtime install --card PeerAdmin@hlfv1 --businessNetworkName krow
composer network start --card PeerAdmin@hlfv1 --networkAdmin admin --networkAdminEnrollSecret adminpw --archiveFile krow@0.0.1.bna --file networkadmin.card
composer card import --file networkadmin.card

echo "Done."
