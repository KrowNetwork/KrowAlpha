##Starting the server
If you have never ran the rest server before, run the following commands from inside the KrowAlpha folder:<br />
~~~bash
cd fabric-tools
./createPeerAdminCard.sh
cd ..
cd krow
composer archive create -t dir -n .
composer runtime install --card PeerAdmin@hlfv1 --businessNetworkName krow
composer network start --card PeerAdmin@hlfv1 --networkAdmin admin --networkAdminEnrollSecret adminpw --archiveFile krow@0.0.1.bna --file networkadmin.card
composer card import --file networkadmin.card
~~~
To start the server, run the auto-update script
