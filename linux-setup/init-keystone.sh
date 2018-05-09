#!/bin/bash
#
# initd-example      Node init.d 
#
# chkconfig: 345 80 20
# description: Node init.d example
# processname: node
# pidfile: /var/run/initd-example.pid
# logfile: /var/log/initd-example.log
#
# Source function library.
#. /lib/lsb/init-functions

# Load init.d functions
#. /etc/init.d/functions

set -e

(/etc/init.d/mongod restart && /etc/init.d/redis restart) || exit -1

export PATH="$PATH:/home/riceserver001/.nvm/versions/node/v8.11.1/bin"
NAME=keystone                  # Unique name for the application
INSTANCE_DIR="/home/riceserver001/KeystoneCMSDemo"  # Location of the application source
COMMAND="node"                      # Command to run
SOURCE_NAME="keystone.js"             # Name os the applcation entry point script

user=riceserver001
pidfile=/var/run/$NAME.pid
logfile=/var/log/$NAME.log
forever_dir=/var/run/forever        # Forever root directory.

node="/home/riceserver001/.nvm/versions/node/v8.11.1/bin/node"
forever="/home/riceserver001/.nvm/versions/node/v8.11.1/bin/forever"
awk=awk
sed=sed

start() {
    echo "Starting $NAME node instance: "

    if [ "$id" = "" ]; then
        # Create the log and pid files, making sure that the target use has access to them
        touch $logfile
        chown $user $logfile

        touch $pidfile
        chown $user $pidfile

        # Launch the application
        sudo -H -u $user $forever start -p $forever_dir --pidFile $pidfile --append -l $logfile --sourceDir $INSTANCE_DIR --workingDir $INSTANCE_DIR -c $COMMAND $SOURCE_NAME
        RETVAL=$?
    else
        echo "Instance already running"
        RETVAL=0
    fi
}

restart() {
    echo -n "Restarting $NAME node instance : "
    if [ "$id" != "" ]; then
        $forever restart -p $forever_dir $id
        RETVAL=$?
    else
        start
    fi
}

stop() {
    echo -n "Shutting down $NAME node instance : "
    if [ "$id" != "" ]; then
        $forever stop -p $forever_dir $id
    else
        echo "Instance is not running";
    fi
    RETVAL=$?
}

getForeverId() {
    local pid=$(pidofproc -p $pidfile)
    $forever list -p $forever_dir | $sed -e 's/\x1b\[[0-9; ]*m//g' | $awk "\$6 && \$6 == \"$pid\" { gsub(/[\[\]]/, \"\", \$2); print \$2; }";
}
id=$(getForeverId)

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    status)
        status -p ${pidfile}
        ;;
    restart)
        restart
        ;;
    *)
        echo "Usage:  {start|stop|status|restart}"
        exit 1
        ;;
esac
exit $RETVAL
