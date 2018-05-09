#!/bin/sh
PARENT_DIR=$(dirname $(readlink -f $0))/../
cd $PARENT_DIR
cp mongod-linux.conf /etc/mongod.conf
