exports = module.exports = function (req, res, next) {
  var keystone = require('keystone');
  var Constants = require(__base + 'Constants');
  var Shop = keystone.list(Constants.ShopListName); //分部
  var UserList = keystone.list(keystone.get('user model'));
  
  var locals = res.locals;
  locals.adminPath = '/' + keystone.get('admin path');
  locals.csrf = { header: {} };
  locals.csrf.header[keystone.security.csrf.CSRF_HEADER_KEY] = keystone.security.csrf.getToken(req, res);
  locals.viewPath = 'signinOrRegister';

  var status = req.query["status"];
  if(status == "signed_out") {
    req.flash('info', '你已成功登出');
  }

  next();
};
