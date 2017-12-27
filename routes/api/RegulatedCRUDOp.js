var keystone = require('keystone'),
  async = require('async'),
  _ = require('lodash'),
  User = keystone.list(keystone.get('user model'));

/*
(POST Method)
data format {
  listName: the list name that is going to be operated with this api,
  queryFields(array): used in read, update, delete operations
  itemData(object): used in create, update
  numItems(int): number of items that will be affected. used in read, update, delete
}
*/

var doAsyncFlow = function(req, res, opName, opHandler) {
  var checkAuth = function(next) {
    if (!req.user) {
      res.json({
        success: false,
        message:'請登入後再存取該資源',
        redirect:keystone.get('signin url')
      });
    } else {
      next();
    }
  };

  var checkPermissions = function(next) {
    if(req.body.listName) {
      if(req.user.isAdmin) {
        return next(); //we dont need to check user with highest priviledge
      }

      var PermissionList = keystone.list('Permission');
      var query = PermissionList.model.findOne(
        {listName: req.body.listName}, 
        ['listName',opName], 
        {lean: true});
      query.exec(function(err, permission) {
        if(err) 
          return next({
            message:'查詢權限失敗'
          });

        if(permission) {
          //check permission
          var permittedRole = permission[opName];
          var userRoleSet = new Set(req.user['roles']);
          if(permittedRole && userRoleSet) {
            if(permittedRole.some(function(roleRef){
              return userRoleSet.has(roleRef);
            })) {
              //user is permitted to operate this list
              next();
            }
            else {
              next({
                message:'權限不足'
              });
            }
          }
          else {
            return next({
              message:'資料庫權限資料異常'
            });
          }
        }
        else {
          //permission hasn't been set yet so let it be?
          console.log('[RegulatedCRUD] warning: the permission of list ' + req.body.listName + ' hasnt been set yet, please beware');
          next();
        }

      });
    }
    else {
      next({
        message: '沒有指明欲操作的列表'
      });
    }
  };

  async.series([
    checkAuth,
    checkPermissions,
    opHandler
  ],function(err) {
    if (err) {
      console.log('[register]  - error:', err);
      console.log('------------------------------------------------------------');
      return res.json({
        success: false,
        message: err.message
      });
    }
  });
}

exports.create = function(req, res) {
  doAsyncFlow(req, res, 'create', function(next) {
    var targetList = keystone.list(req.body.listName);
    if(targetList) {
      if(req.body.itemData) 
        targetList.model.create(req.body.itemData, function(err, item) {
          if(err) 
            return next({
              message: '創建操作失敗'
            });
          res.json({
            success: true
          });
        });
      else
        return next({
          message: '沒有可用來創建的項目資料'
        });
    }
    else {
      return next({
        message: '沒有該列表'
      });
    }
  });
};

exports.read = function(req, res) {

};

exports.update = function(req, res) {

};

exports.delete = function(req, res) {

};