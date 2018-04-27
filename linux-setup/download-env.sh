#!/bin/sh
file_id=$1
rm -f .env
curl -L -o .env "https://drive.google.com/uc?export=download&id=$file_id"
