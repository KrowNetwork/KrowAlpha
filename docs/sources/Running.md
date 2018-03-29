##Starting the server
The REST server should start automatically from `/etc/rc.local`
If it is not running:
~~~
$installdir/composer/start "$branch" "$port"
~~~

##Auto-Update
The server will automatically update the REST server, as per the cron job
~~~
$installdir/composer/git-update
~~~
**This should NOT be used in production**

##Viewing Server

####Detached Screen
If the REST server was started as a detached screen:
~~~
screen -r -S composer-rest-server
~~~
If this error occurs `Cannot open your terminal '/dev/pts/x' - please check.` use this **once** before running screen
~~~
script /dev/null
~~~
This workaround is quite hackish.

####Background Process
If the REST server was started as a background process:
~~~
fg composer-rest-server
~~~
