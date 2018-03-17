## 1. Copy the installation and startup scripts
~~~
scp -r scripts/composer USER@KROWNETWORK:$installdir/composer
~~~
If you don't have permissions to copy the scripts, so you should copy it onto the server, then use su to login and copy it from there

## 2. Run install scripts
~~~bash
$installdir/prereqs-ubuntu.sh
$installdir/install.sh
~~~

## 3. Set up /etc/rc.local and cron using config excerpts
~~~
scripts/rc.local
~~~
and
~~~
scripts/cronjob
~~~
