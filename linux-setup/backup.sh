#!/bin/sh
PARENT_DIR=$(dirname $(readlink -f $0))/../
cd $PARENT_DIR
/home/riceserver001/.nvm/versions/node/v8.11.1/bin/node backup.js
