#!/bin/sh
sudo apt-get update

#dependencies
sudo apt-get install build-essential libssl-dev

#install nvm(https://github.com/creationix/nvm)
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

