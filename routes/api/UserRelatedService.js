var keystone = require('keystone'),
  async = require('async'),
  _ = require('lodash'),
  User = keystone.list(keystone.get('user model'));

var signInWithId = function(req, res, user, successMsg) {
    var getRedirectPath = function(res) {
          if(res.locals.redirect) {
            console.log(res.locals.redirect);
            return res.locals.redirect;
          }
          else {
            if(user.isAdmin) {
              return '/' + keystone.get('admin path');
            }
            else {
              return keystone.get('signin redirect');
            }
          }
    }

    var onSuccess = function(user) {
      console.log('[signInWithId]  - Successfully signed in.');
      console.log('------------------------------------------------------------');
      return res.json({
        success: true,
        message: successMsg,
        user: user,
        redirect: getRedirectPath(res)
      });
    }
    
    var onFail = function(err) {
      console.log('[signInWithId]  - Failed signing in.', err);
      console.log('------------------------------------------------------------');
      
      return res.json({
        success: false,
        message: (err && err.message ? err.message : false) || '不好意思, 登錄失敗, 請重新再試一次'
      });
    }

    console.log('[signInWithId]  - Signing in user...');
    console.log('------------------------------------------------------------');
    
    keystone.session.signin(String(user._id), req, res, onSuccess, onFail);
}

exports.signin = function (req, res) {
  /*
    var locals = {
      form: req.body,
      existingUser: false
    };
  */
  User.model.findOne({ userID: req.body['userID'] }).exec(function(err, user) {
    if (err || !user) {
      return res.json({
        success: false,
        message: (err && err.message ? err.message : false) || '不好意思, 登錄失敗, 請重新再試一次'
      });
    }
    signInWithId(req, res, user, '登錄成功');
    
  });

};

exports.register = function (req, res) {
  var locals = {
    form: req.body,
    newUser: false
  };

  async.series([
    
    // Perform basic form validation
    function(next) {
      
      if (!locals.form['userID'] || !locals.form['password']) {
        console.log('[register] - Failed registering.');
        console.log('------------------------------------------------------------');
        return next({
          message: '資料不齊全 ,請再確認一次'
        });
      }
      else 
        return next();
      
    },
    
    // Check for user by userID
    function(next) {
      var userID = locals.form['userID'];
      console.log('[register]  - Searching for existing users via userID: [' + userID + '] ...');
      console.log('------------------------------------------------------------');
      
      var query = User.model.findOne({ userID: userID }, null, { lean: true });
        query.exec(function(err, user) {
          if (err) {
            console.log('[register]  - Error finding existing user via userID.', err);
            console.log('------------------------------------------------------------');
            return next({ message: '不好意思,讀取資料庫途中出現一些問題,請再試一次' });
          }
          if (user) {
            console.log('[register]  - Found existing user via userID...');
            console.log('------------------------------------------------------------');
            return next({ message: '已存在同名之使用者ID, 請改以登入或是換一個ID註冊' });
          }
          return next();
        });
      
    },
    
    // Create user
    function(next) {
    
      console.log('[register]  - Creating new user...');
      console.log('------------------------------------------------------------');
      
      var userData = {
        userID: locals.form['userID'],
        password: locals.form['password']
      };

      if(locals.form['name.first'] && locals.form['name.last']) {
        userData.name = {
          first: locals.form['name.first'],
          last: locals.form['name.last']
        };
      }

      if(locals.form.email) {
        userData.email = locals.form.email;
      }
      
      locals.newUser = new User.model(userData);
      locals.newUser.save(function(err) {
        if (err) {
          console.log('[register]  - Error saving new user.', err);
          console.log('------------------------------------------------------------');
          return next({ message: '不好意思,寫入資料庫途中出現一些問題,請再試一次' });
        }
        console.log('[register]  - Saved new user.');
        console.log('------------------------------------------------------------');
        return next();
      });
    
    },
    
    // Sign in with Session
    function(next) {
      signInWithId(req, res, locals.newUser, '註冊成功');
    }
    
  ], function(err) {
    if (err) {
      console.log('[register]  - error:', err);
      console.log('------------------------------------------------------------');
      return res.json({
        success: false,
        message: (err && err.message ? err.message : false) || '不好意思,註冊途中出現一些問題,請再試一次'
      });
    }
});

}