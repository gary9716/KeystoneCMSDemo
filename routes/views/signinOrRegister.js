exports = module.exports = function (req, res) {
  var keystone = require('keystone');
  var Territory = new keystone.List('Territory'); //分部
  var view = new keystone.View(req, res);
  var UserList = keystone.list(keystone.get('user model'));
  var locals = res.locals;

  locals.adminPath = '/' + keystone.get('admin path');
  locals.csrf = { header: {} };
  locals.csrf.header[keystone.security.csrf.CSRF_HEADER_KEY] = keystone.security.csrf.getToken(req, res);

  var status = req.query["status"];
  if(status == "signed_out") {
    req.flash('info', '你已成功登出');
  }

  view.render('signinOrRegister');
};
