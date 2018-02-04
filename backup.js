require('dotenv').config();

const path = require('path');
const fs = require('fs');

if(!process.env.DB_BACKUP_DIR)
    console.log('please specify db back directory');

var filename;
if(process.argv.length > 2) 
    filename = process.argv[2];
    
fs.existsSync(process.env.DB_BACKUP_DIR) || fs.mkdirSync(process.env.DB_BACKUP_DIR);

if(filename) {
    filename = path.resolve(filename);
    if(!fs.existsSync(filename)) {
        console.log('file doesnt exist');
        return;
    }
}

const MongoClient = require('mongodb').MongoClient;
const mongodbUri = require('mongodb-uri');
const util = require('util');
require('util.promisify').shim();
const exec = util.promisify(require('child_process').exec);
const moment = require('moment');


var uriObject = mongodbUri.parse(process.env.MONGO_URI);

function unlockDB() {
    var client;
    return MongoClient.connect(process.env.MONGO_URI)
    .then(function(_client){
        client = _client;
        
        //console.log("Connected successfully to server");
        //console.log(info);
        
        var db = client.db('admin');

        return db.command({
            fsyncUnlock: 1
        });
    })
    .then(function(info) {
        console.log('unlock succeed');
        //console.log(info);
        client.close();
    })
    .catch(function(err) {
        console.log(err);
    });  
}

function lockDB() {
    var client;
    // Use connect method to connect to the server
    return MongoClient.connect(process.env.MONGO_URI)
    .then(function(_client) {
        client = _client;

        //console.log("Connected successfully to server");

        var db = client.db('admin');

        return db.command({
            fsync: 1,
            lock: 1,
        });
    })
    .then(function(info) {
        console.log('lock succeed');
        //console.log(info);
        client.close();
    })
    .catch(function(err) {
        console.log(err);
    });
}

function mongoDump() {
    var dbName = this.dbName;
    var archiveFileName = path.resolve(process.env.DB_BACKUP_DIR, moment().format('YYYY-MM-DD_HH-mm-ss_') + dbName + '_backup.gz');
    var cmd = util.format('mongodump --gzip --db %s --archive=%s', dbName, archiveFileName);
    return exec(cmd)
    .catch(function(err) {
        console.log('failed to mongodump, reason:');
        console.log(err);
    });
}

function mongoRestore() {
    var dbName = this.dbName;
    var archiveFileName = path.resolve(process.env.DB_BACKUP_DIR, this.filename);
    var cmd = util.format('mongorestore --drop --gzip --db %s --archive=%s', dbName, archiveFileName);
    return exec(cmd)
    .catch(function(err) {
        console.log('failed to mongorestore, reason:');
        console.log(err);
    });
}

//TODO: add upload to google cloud store logic


if(filename) {

    mongoRestore.bind({ dbName: uriObject.database, filename: filename })()
    .then(function() {
        console.log('restore succeed');
    })
    .catch(function(err) {
        console.log(err);
    });

}
else {

    lockDB()
    .then(mongoDump.bind({ dbName: uriObject.database }))
    .then(function() {
        console.log('dump succeed');
        return unlockDB();
    })
    .catch(function(err) {
        console.log(err);
        
        return unlockDB();
    });

}





