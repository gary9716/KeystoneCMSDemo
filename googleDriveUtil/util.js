module.exports = (function(){

var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var ResumableUpload = require('./resumableUpload');
var config = require('./config');
var path = require('path');
var SCOPES = config.scopes;

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(config.tokenPath, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}


/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

function authWithSecretFile() {
  // Load client secrets from a local file.
  return new Promise(function(resolve, reject) {
    fs.readFile(config.clientSecret, function processClientSecrets(err, content) {
      if (err) {
        reject('Error loading client secret file: ' + err + ', one should provide client secret file');
        return;
      }
      // Authorize a client with the loaded credentials, then call the
      // Drive API.
      authorize(JSON.parse(content), function(auth) {
        resolve(auth);
      });
    });
  });
}


function genQueryStr(meta) {
  var comps = [];
  for(let prop in meta) {
    if(typeof meta[prop] === 'boolean') {
      comps.push(prop+"="+meta[prop]+"");
    }
    else
      comps.push(prop+"='"+meta[prop]+"'");
  }

  return comps.join(' and ');
}

function createOrUseExistFolder(drive, name) {
  var fileMetadata = {
    'name': name,
    'mimeType': 'application/vnd.google-apps.folder',
    'trashed' : false
  };

  var qStr = genQueryStr(fileMetadata);

  return new Promise(function(resolve, reject) {
    drive.files.list({
      q: qStr
    }, 
    function(err, response) {
      if (err) {
        //console.log('The API returned an error: ' + err);
        reject(err);
        return;
      }
      var files = response.files;
      if (files.length == 0) {
        //create new folder
        delete fileMetadata.trashed;

        drive.files.create({
          resource: fileMetadata,
          fields: 'id'
        }, function (err, file) {
          if (err) {
            reject(err);
          } else {
            resolve(file);
            //console.log('Folder Id: ', file.id);
          }
        });

      } else {
        //use existed folder
        
        /*
        console.log('Files:');
        for (var i = 0; i < files.length; i++) {
          var file = files[i];
          console.log('%s (%s)', file.name, file.id);
        }
        */

        //just use first one
        resolve(files[0]);

      }
    });

  });

}

function uploadLargeFile(remoteFolderName, localFilePath, progressCallback,retryTimes) {
  if(!remoteFolderName) {
    console.log('please specify folder name');
    return;
  }

  var authObj;

  if(!retryTimes) {
    retryTimes = 3;
  }

  return authWithSecretFile()
  .then(function(auth) {
    var drive = google.drive({ version: 'v3', auth: auth }); 
    authObj = auth;
    return createOrUseExistFolder(drive, remoteFolderName);
  })
  .then(function(folder) {

    console.log('start to upload %s', path.basename(localFilePath));

    var resumableUpload = new ResumableUpload(); //create new ResumableUpload
    resumableUpload.tokens = authObj.credentials; //Google OAuth2 tokens
    resumableUpload.filepath = localFilePath;
    resumableUpload.metadata = {
      name: path.basename(localFilePath),
      parents: [folder.id]
    };
    resumableUpload.query = '&supportsTeamDrives=true';
    resumableUpload.retry = retryTimes; // Maximum retries when upload failed.
    resumableUpload.upload();
    
    if(progressCallback) {
      resumableUpload.on('progress', function (progress) {
        progress = Math.round(progress * 10000) / 100;
        progressCallback(progress);
      });
    }
    
    return new Promise(function(resolve, reject) {
      resumableUpload.on('success', function (success) {
        resolve(success)
      });
      resumableUpload.on('error', function (error) {
        if(resumableUpload.retry == 0) {
          reject(error);
        }
        else 
          console.log(error);
      });
    });

  })


}


/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles() {

  authWithSecretFile()
  .then(function(auth) {
    var service = google.drive({ version: 'v3', auth: auth });
    service.files.list({
      pageSize: 10,
      fields: "nextPageToken, files(id, name)"
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      var files = response.files;
      if (files.length == 0) {
        console.log('No files found.');
      } else {
        console.log('Files:');
        for (var i = 0; i < files.length; i++) {
          var file = files[i];
          console.log('%s (%s)', file.name, file.id);
        }
      }
    });
  });

}

  return {
    uploadLargeFile: uploadLargeFile,
    listFiles: listFiles
  };


})();
