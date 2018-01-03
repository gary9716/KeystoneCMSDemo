var keystone = require('keystone'),
  async = require('async'),
  _ = require('lodash'),
  Constants = require(__base + 'Constants');

/*
method: POST
format: {
  listName: the list name that is going to be operated with this api,
  itemData: used in 
    create(can be object or array of objects), 
    update(object only, filter with filters and update to itemData),
  filters(object) : 
    used in read(optional), 
            update(required), 
            delete(required)

  selectFields(array): used in read
  populateFields(array): used in read
  
  pagination:(used in read)
    page: page to start at
    perPage: number of results per page
    maxPages: optional, causes the page calculation to omit pages from the beginning/middle/end
    (useful if you have lots of pages, and do not want them to wrap over several lines).
}
*/

var checkAuth = function(next) {
  if (!this.user) {
    next({
      message:'請登入後再存取該資源'
    });
  } 
  else {
    next();
  }
};

var checkPermissions = function (next) {
  var user = this.user;
  var listName = this.listName;
  var opName = this.opName;

  if(user.isAdmin) {
    return next(); //we dont need to check user with highest priviledge
  }

  if(listName) {
    console.log('test list:',listName);
    keystone.list(Constants.RegulatedListName).model
    .findOne({ name: listName })
    .select('_id')
    .lean()
    .exec()
    .then(function(rl) {
      if(rl)
        return rl._id;
      else {
        return Promise.reject({
          message:'查無此列表'
        });
      }
    })
    .then(function(listID) {
      var PermissionList = keystone.list(Constants.PermissionListName);
      if(opName instanceof Array) {
        var opNameStr = opName.join(' ');
        return PermissionList.model
          .findOne({ 'listName' : listID })
          .select(opNameStr)
          .lean()
          .exec();
      }
      else
        return PermissionList.model
          .findOne({ 'listName' : listID })
          .select(opName)
          .lean()
          .exec();
    })
    .then(function(permission){
      if(permission) {
        var userRoles = user.roles;
        if(!userRoles || userRoles.length == 0) {
          return Promise.reject({
            message:'權限不足'
          });
        }

        function strMapper(item){
          return item.toString();
        }

        var userRoleSet = new Set(userRoles.map(strMapper));
        
        //console.log(userRoles);
        //console.log(permission);

        function userHasPermissionWithOpName(singleOpName) {
          var permittedRole = permission[singleOpName];
          if(permittedRole && permittedRole.length) {
            permittedRole = permittedRole.map(strMapper);
            //check permission
            if(permittedRole.some(function(role){
              return userRoleSet.has(role);
            })) {
              //user is permitted to operate this list
              console.log(singleOpName, ":passed");
              return true;
            }
            else {
              console.log(singleOpName, ":failed");
              return false;
            }
          }
          else {
            console.log(singleOpName, ":failed 2");
            return false;
          }
        }

        if(opName instanceof Array) {
          if(opName.every(userHasPermissionWithOpName)) 
          { 
            //all ops was granted
            next();
          }
          else {
            return Promise.reject({
              message:'權限不足'
            });
          }
        }
        else { //single opName(for CRUD request)
          if(userHasPermissionWithOpName(opName)) {
            next();
          }
          else {
            return Promise.reject({
              message:'權限不足'
            });
          }
        }
        
      }
      else {
        return Promise.reject({
          message: '權限未被設定'
        });
      }
    })
    .catch(function(err) {
      if(err)
        return err.message ? next(err) : next({
          message:'查詢權限失敗'
        });
      else
        return next({
          message:'不明原因操作失敗'
        });
    });

  }
  else {
    next({
      message: '沒有指明欲操作的列表'
    });
  }


};


var CRUDAsyncFlow = function(req, res, opName, opHandler) {
  console.log("body:-----");
  console.log(req.body);
  console.log("----------");

  this.listName = req.body.listName;
  this.user = req.user;
  this.opName = opName;

  async.series([
    checkAuth.bind(this),
    checkPermissions.bind(this),
    opHandler
  ],function(err) {
    if (err) {
      //console.log('[register]  - error:', err);
      //console.log('------------------------------------------------------------');
      return res.json({
        success: false,
        message: err.message
      });
    }
  });

}

exports.create = function(req, res) {
  CRUDAsyncFlow(req, res, 'create', function(next) {
    var targetList = keystone.list(req.body.listName);
    if(!targetList)
      return next({
        message: '欲操作的列表不存在'
      });

    if(req.body.itemData) {
      var dataCollection = {};
      var itemData = req.body.itemData;
      if(itemData instanceof Array) {
        dataCollection[req.body.listName] = itemData;
      }
      else if(itemData instanceof Object) {
        var itemDataArray = [];
        itemDataArray.push(itemData);
        dataCollection[req.body.listName] = itemDataArray;
      }
      else {
        return next({
          message: '資料型態錯誤'
        });
      }

      keystone.createItems(dataCollection, function(err, stats) {
          //stats && console.log(stats.message);
          if(err) next(err);
          else {
            res.json({
              success: true
            });
          }
      });

    }
    else {
      return next({
        message: '沒有可用來創建的項目資料'
      });
    }
    
  });
};

exports.read = function(req, res) {
  CRUDAsyncFlow(req, res, 'read', function(next) {
    var form = req.body;

    var targetList = keystone.list(form.listName);
    if(!targetList)
      return next({
        message: '欲操作的列表不存在'
      });

    if(!form.page || !form.perPage) {
      return next({
        message: '分頁功能至少需要page和perPage這兩個參數'
      });
    }

    var paginateOpt = {
      page: form.page,
      perPage: form.perPage,
    };

    if(form.filters) {
      paginateOpt.filters = form.filters;
    }

    if(form.maxPages) {
      paginateOpt.maxPages = form.maxPages;
    }

    var query = targetList.paginate(paginateOpt);

    if(form.sortField)
      query = query.sort('-'+form.sortField);

    if(form.selectFields)
      query = query.select(form.selectFields.join(' '))

    if(form.populateFields)
      query = query.populate(form.populateFields.join(' '))

    query.exec()
      .then(function(result) {
        res.json({
          success: true,
          data: result
        });
        next();
      })
      .catch(function(err) {
        if(err)
          return err.message ? next(err) : next({
            message:'資料讀取失敗'
          });
        else
          return next({
            message:'不明原因讀取失敗'
          });
      });

  });
};

exports.update = function(req, res) {
  CRUDAsyncFlow(req, res, 'update', function(next) {
    var form = req.body;

    var targetList = keystone.list(form.listName);
    if(!targetList)
      return next({
        message: '欲操作的列表不存在'
      });

    if(!form.filters)
      return next({
        message: '更新用的過濾條件未設定'
      });

    if(!form.itemData)
      return next({
        message: '沒有更新用的資料'
      });

    var newItemData = form.itemData;

    targetList.model.find(form.filters).exec()
      .then(function(results) {
        if(results && results.length) {
          var errs = [];
          results.forEach(function(item) {
            targetList.updateItem(
              item, 
              newItemData, 
              {
                user: req.user
              },
              function(err) {
                if(err) 
                  errs.push(err.detail? err.detail: err.error);
              });
          });

          if(errs.length) {
            var errMsg = errs.join(';');
            return Promise.reject({
              message: errMsg
            });
          }
          else {
            res.json({
              success: true
            });
            next();
          }
        }
        else {
          return Promise.reject({
            message:'未找到可更新項目'
          });
        }
      })
      .catch(function(err) {
        if(err)
          return err.message ? next(err) : next({
            message:'資料更新失敗'
          });
        else
          return next({
            message:'不明原因更新失敗'
          });
      })

  });
};

exports.delete = function(req, res) {
  CRUDAsyncFlow(req, res, 'delete', function(next) {
      var form = req.body;

      var targetList = keystone.list(form.listName);
      if(!targetList)
        return next({
          message: '欲操作的列表不存在'
        });

      if(!form.filters)
        return next({
          message: '刪除用的過濾條件未設定'
        });

      targetList.model.remove(form.filters)
        .then(function(itemsBeRemoved) {
          res.json({
            success: true
          });
          next();
        })
        .catch(function(err) {
          if(err)
            return err.message ? next(err) : next({
              message:'資料刪除失敗'
            });
          else
            return next({
              message:'不明原因刪除失敗'
            });
        });
  });
};

/*
method: POST
format: {
  testData:(object or array of objects)
    single obj format: {
      listName:
      opName: (string or array of string, options: create, read, update, delete)
    }

}
*/

function createParams(listName, user, opName) {
  this.listName = listName;
  this.user = user;
  this.opName = opName;
}

exports.permissionCheck = function(req, res) {
  //console.log("body:-----");
  //console.log(req.body);
  console.log("user:------");
  console.log(req.user);
  console.log("-----------");
  
  var testData = req.body.testData;
  if(!testData) {
    return res.json({
      success: false,
      message: 'testData is needed'
    });
  }
  else {
    var funcArray = [ checkAuth.bind(req) ];
    if(testData instanceof Array) {
      testData.forEach(function(item) {
        var params = {
          listName: item.listName,
          user: req.user,
          opName: item.opName
        };
        funcArray.push(checkPermissions.bind(params));
      });
    }
    else {
      var params = {
        listName: item.listName,
        user: req.user,
        opName: item.opName
      };
      funcArray.push(checkPermissions.bind(params));
    }

    funcArray.push(function(next) {
      res.json({
        success: true
      });
      next();
    });

    async.series(funcArray, function(err) {
      if (err) {
        //console.log('[register]  - error:', err);
        //console.log('------------------------------------------------------------');
        return res.json({
          success: false,
          message: err.message
        });
      }
    });
  }

  
}