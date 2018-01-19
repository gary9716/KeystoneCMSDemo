module.exports = (function() {

/*
scopes info:(from https://developers.google.com/drive/v3/web/about-auth)
https://www.googleapis.com/auth/drive Full, permissive scope to access all of a user's files, excluding the Application Data folder. Request this scope only when it is strictly necessary.
https://www.googleapis.com/auth/drive.readonly  Allows read-only access to file metadata and file content
https://www.googleapis.com/auth/drive.appfolder Allows access to the Application Data folder
https://www.googleapis.com/auth/drive.file  Per-file access to files created or opened by the app. File authorization is granted on a per-user basis and is revoked when the user deauthorizes the app.
https://www.googleapis.com/auth/drive.install Special scope used to let users approve installation of an app.
https://www.googleapis.com/auth/drive.metadata  Allows read-write access to file metadata (excluding downloadUrl and contentHints.thumbnail), but does not allow any access to read, download, write or upload file content. Does not support file creation, trashing or deletion. Also does not allow changing folders or sharing in order to prevent access escalation.
https://www.googleapis.com/auth/drive.metadata.readonly Allows read-only access to file metadata (excluding downloadUrl and contentHints.thumbnail), but does not allow any access to read or download file content
https://www.googleapis.com/auth/drive.photos.readonly Allows read-only access to all photos. The spaces parameter must be set to photos.
https://www.googleapis.com/auth/drive.scripts Allows access to Apps Script files
*/

// If modifying these scopes, delete your previously saved credentials
// at ./.credentials/keystone.json

  var TOKEN_DIR = './.credentials/';
  var TOKEN_PATH = TOKEN_DIR + 'keystone.json';

  return {
    clientSecret: 'client_secret.json',
    scopes: ['https://www.googleapis.com/auth/drive.file'],
    tokenPath: TOKEN_PATH
  };

})();