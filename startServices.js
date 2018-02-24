var isWin = process.platform === "win32";
const Mongod = require('mongod');
const RedisServer = require('redis-server');
const mongoServer = new Mongod({
	conf: isWin? '.\\mongod-win.conf' : './mongod.conf'
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

