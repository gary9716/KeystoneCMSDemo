var _ = require('lodash');
exports = module.exports = function(req, res, next) {
  _.assign(res.locals, this); //this would be bound in each route
  next();
}