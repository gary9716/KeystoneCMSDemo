#!/bin/sh

##----- install mongodb on ubuntu -----
## https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/

#Import the public key used by the package management system.
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5

#only for Ubuntu 16.04
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list

sudo apt-get update

#Install the latest stable version of MongoDB
sudo apt-get install -y mongodb-org
