#!/bin/sh
PARENT_DIR=$(dirname $(readlink -f $0))/../
cd $PARENT_DIR

sudo cp mongod-linux.conf /etc/mongod.conf
sudo cp ./linux-setup/init-mongod.sh /etc/init.d/mongod
sudo chmod +x /etc/init.d/mongod

sudo cp ./linux-setup/init-redis-server.sh /etc/init.d/redis-server
sudo chmod +x /etc/init.d/redis-server

sudo cp ./linux-setup/init-keystone.sh /etc/init.d/keystone
sudo chmod +x /etc/init.d/keystone

sudo cp ./linux-setup/keystone.service /etc/systemd/system/keystone.service
sudo chmod 664 /etc/systemd/system/keystone.service
