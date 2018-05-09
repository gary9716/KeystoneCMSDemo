
var isWin = process.platform === "win32";
const Mongod = require('mongod');
const RedisServer = require('redis-server');
var MONGO_CONFIG_PATH = process.env.MONGO_CONFIG_PATH? process.env.MONGO_CONFIG_PATH : null;
if(process.platform === "win32") {
	MONGO_CONFIG_PATH = '.\\mongod-win.conf';
}
else if(process.platform === "darwin"){
	MONGO_CONFIG_PATH = './mongod.conf';
}
else {
	MONGO_CONFIG_PATH = './mongod-linux.conf';
}

const mongoServer = new Mongod({
	conf: MONGO_CONFIG_PATH
});
const redisServer = new RedisServer(6379); //default port
 
function startMongod(err) {
	
	if (err) {
		if(err.toString().indexOf("Address already in use") === -1) {
			console.log(err);
			return;
		}
		else {
			//pass
		}
	}

	mongoServer.open((err) => {
        if(err) {
            if(err.toString().indexOf("error number 100") === -1) {
                console.log(err);
                return;
            }
            else {
                //pass
            }
        }
    });
	
}

redisServer.open().then(startMongod).catch(startMongod);
