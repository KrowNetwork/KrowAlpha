#!/bin/bash

#exit on fail
set -e

repodir="/home/ubuntu/krow/KrowAlpha"
composerdir="$repodir/krow"
installdir="/home/ubuntu/composer/"

repository=${REPOSITORY-"KrowNetwork/KrowAlpha.git"}
token="ff7210fe63d1593df37e7fe01653ad46dc706377"

cd "$installdir"/fabric-tools
sudo ./startFabric.sh

mkdir -p "$repodir"
cd "$repodir"/..
git clone https://"$token"@github.com/"$repository"

