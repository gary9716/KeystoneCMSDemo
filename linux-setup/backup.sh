#!/bin/sh
PARENT_DIR=$(dirname $(readlink -f $0))/../
cd $PARENT_DIR
node backup.js
