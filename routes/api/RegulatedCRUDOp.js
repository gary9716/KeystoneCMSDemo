var keystone = require('keystone'),
  async = require('async'),
  _ = require('lodash'),
  Constants = require(__base + 'Constants');
var middleware = require('../middleware');

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

var CRUDAsyncFlow = function(req, res, opName, opHandler) {
  console.log("body:-----");
  console.log(req.body);
  console.log("----------");

  this.listName = req.body.listName;
  this.user = req.user;
  this.opName = opName;

  async.series([
    middleware.checkAuth.bind(this),
    middleware.checkPermissions.bind(this),
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
        dataCollection[req.body.listName] = [ itemData ];
      }
      else {
        return next({
          message: '資料型態錯誤'
        });
      }

      keystone.createItems(dataCollection, function(err, stats) {
          //stats && console.log(stats.message);
          if(err) {
            next({
              message: err.toString()
            });
          }
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

    var query;

    if(form.page && form.perPage) {
      
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

      query = targetList.paginate(paginateOpt);

    }
    else {
      
      if(form.filters) 
        query = targetList.model.find(form.filters);
      else 
        query = targetList.model.find();

    }
    
    if(form.sortField)
      query = query.sort('-'+form.sortField);

    if(form.selectFields)
      query = query.select(form.selectFields.join(' '));

    if(form.populateFields)
      query = query.populate(form.populateFields.join(' '));


    query.exec()
      .then(function(result) {
        res.json({
          success: true,
          result: result
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
  listArray:(object or array of objects)
    single obj format: {
      listName:
      opName: (string or array of string, options: create, read, update, delete)
    }

}
*/
