#!/bin/sh
PARENT_DIR=$(dirname $(readlink -f $0))/../
cd $PARENT_DIR
sudo cp mongod-linux.conf /etc/mongod.conf
sudo cp ./linux-setup/init-mongod.conf /etc/init/mongod.conf
