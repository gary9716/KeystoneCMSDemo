#!/bin/sh
PARENT_DIR=$(dirname $(readlink -f $0))/../
node $PARENT_DIR/backup.js
