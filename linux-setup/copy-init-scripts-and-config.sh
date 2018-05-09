#!/bin/sh
PARENT_DIR=$(dirname $(readlink -f $0))/../
cd $PARENT_DIR
sudo cp mongod-linux.conf /etc/mongod.conf
sudo cp ./linux-setup/init-mongod.sh /etc/init.d/mongod
chmod +x /etc/init.d/mongod

sudo cp ./linux-setup/init-redis-server.sh /etc/init.d/redis
chmod +x /etc/init.d/redis
