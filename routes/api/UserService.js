var keystone = require('keystone'),
  async = require('async'),
  _ = require('lodash'),
  User = keystone.list(keystone.get('user model'));

var signInWithId = function(req, res, user, successMsg) {
    var getRedirectPath = function(res) {
          if(res.locals.redirect) {
            //console.log(res.locals.redirect);
            return res.locals.redirect;
          }
          else {
            //console.log("use default redirect");
            /*
            if(user.isAdmin) {
              return '/' + keystone.get('admin path');
            }
            else {
              return keystone.get('signin redirect');
            }
            */
            return keystone.get('signin redirect');
          }
    }

    var onSuccess = function(user) {
      console.log('[signInWithId]  - Successfully signed in.');
      console.log('------------------------------------------------------------');
      delete user.password; //for security concern,dont pass password back
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
      
      return res.ktSendRes(400,(err && err.message ? err.message : false) || '不好意思, 登錄失敗, 請重新再試一次');
    }

    console.log('[signInWithId]  - Signing in user...');
    console.log('------------------------------------------------------------');
    
    //!!beware: sign in session without password check
    keystone.session.signin(String(user._id), req, res, onSuccess, onFail); 
}

exports.signin = function (req, res) {
  
  if (!keystone.security.csrf.validate(req)) {
    return res.ktSendRes(400,'過期憑證,請刷新登入頁面');
  }

  User.model.findOne({ userID: req.body['userID'] }).exec(function(err, user) {
    if (err || !user) {
      return res.ktSendRes(400,(err && err.message ? err.message : false) || '不好意思, 登錄失敗, 請重新再試一次');
    }
    else {
      user._.password.compare(req.body['password'], function (err, isMatch) {
        if (isMatch) {
          return signInWithId(req, res, user, '登錄成功');
        } 
        else if (err) {
          return res.ktSendRes(400,(err && err.message ? err.message : false) || '不好意思, 登錄失敗, 請重新再試一次');
        } 
        else {
          return res.ktSendRes(400,'密碼不合');
        }
      });
    }
    
    
  });

};

exports.register = function (req, res) {
  var newUser = false;
  var form = req.body;

  async.series([
    
    // Perform basic form validation
    function(next) {
      
      if (!form.hasOwnProperty('userID') || !form.hasOwnProperty('password')) {
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
      var userID = form['userID'];
      console.log('[register]  - Searching for existing users via userID: [' + userID + '] ...');
      console.log('------------------------------------------------------------');
      
      User.model.findOne({ userID: userID })
        .lean()
        .exec()
        .then(function(user) {
          if (user) {
            console.log('[register]  - Found existing user via userID...');
            console.log('------------------------------------------------------------');
            next({ message: '已存在同名之使用者ID, 請改以登入或是換一個ID註冊' });
          }
          else {
            next();
          }
        })
        .catch(function(err) {
          
          console.log('[register]  - Error finding existing user via userID.', err);
          console.log('------------------------------------------------------------');
          
          return next({ 
            message: err.toString()
          });

        });
      
    },
    
    // Create user
    function(next) {
    
      console.log('[register]  - Creating new user...');
      console.log('------------------------------------------------------------');
      
      var userData = {
        userID: form['userID'],
        password: form['password']
      };

      if(form.hasOwnProperty('name')) {
        userData.name = form.name;
      }

      if(form.hasOwnProperty('email')) {
        userData.email = form.email;
      }

      if(form.hasOwnProperty('shop')) {
        userData.shop = form.shop;
      }
      
      newUser = new User.model(userData);
      newUser.save()
      .then(function(savUser) {
        next();
      })
      .catch(function(err) {
        console.log('[register]  - Error saving new user.', err);
        console.log('------------------------------------------------------------');
        return next({ message: err.toString() });
      });
    
    },
    
    // Sign in with Session
    function(next) {
      signInWithId(req, res, newUser, '註冊成功');
    }
    
  ], function(err) {
    if (err) {
      console.log('[register]  - error:', err);
      console.log('------------------------------------------------------------');
      return res.ktSendRes(400, (err && err.message ? err.message : false) || '不好意思,註冊途中出現一些問題,請再試一次');
    }
  });

}
