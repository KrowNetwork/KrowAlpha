git pull

cd krow/

composer archive create -t dir -n .

composer network update -c admin@krow -a krow@0.0.1.bna

composer-rest-server -c admin@krow -n never -w true
