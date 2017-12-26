exports = module.exports = function (req, res) {
  var keystone = require('keystone'),
  User = keystone.list(keystone.get('user model'));
  //var async = require('async');
  //var _ = require('lodash');
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
      console.log('[api.signin]  - Successfully signed in.');
      console.log('------------------------------------------------------------');
      return res.json({
        success: true,
        message: '登錄成功',
        user: user,
        redirect: getRedirectPath(res)
      });
    }
    
    var onFail = function(err) {
      console.log('[api.signin]  - Failed signing in.', err);
      console.log('------------------------------------------------------------');
      
      return res.json({
        success: false,
        message: (err && err.message ? err.message : false) || '不好意思, 登錄失敗, 請重新再試一次'
      });
    }

    console.log('[api.signin]  - Signing in user...');
    console.log('------------------------------------------------------------');
    
    keystone.session.signin(String(user._id), req, res, onSuccess, onFail);
  });


};