if [ -z "$1" ]
then
  if [ -z "$2" ]
  then
    echo You need to specify a BRANCH to use and a PORT to use
    exit 1
  fi
  echo You need to specify a BRANCH to use
  exit 1
fi

git pull

git checkout $1

cd krow/

composer archive create -t dir -n .

composer network update -c admin@krow -a krow@0.0.1.bna

composer-rest-server -c admin@krow -n never -w true -p $2
