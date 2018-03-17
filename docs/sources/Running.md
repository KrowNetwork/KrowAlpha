##Starting the server
The REST server should start automatically from `/etc/rc.local`
If it is not running:
~~~
$installdir/composer/start "$branch" "$port"
~~~

##Auto-Update
The server will automatically update the REST server every half hour, as per the cron job
~~~
$installdir/composer/git-update
~~~
**This should NOT be used in production**
