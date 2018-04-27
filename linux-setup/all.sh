#!/bin/sh
chmod u+x *.sh

sudo su
./mongodb-install.sh
./redis-server-install.sh
./nvm-install.sh
if [ command -v nvm ]; then
	./nodejs-install-via-nvm.sh
	./start-as-services.sh
else
	echo "nvm not existed"
fi
