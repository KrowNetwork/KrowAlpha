git pull
echo $1
git checkout $1

cd krow/

composer archive create -t dir -n .

composer network update -c admin@krow -a krow@0.0.1.bna

composer-rest-server -c admin@krow -n never -w true -a true
