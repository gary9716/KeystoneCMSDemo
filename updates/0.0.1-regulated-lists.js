module.exports = function(done) {
  var keystone = require('keystone');
  var async = require('async');
  var fs = require('fs');
  var Constants = require(__base + 'Constants');
  
  var dataCollection = {};

  var regulatedList = keystone.list(Constants.RegulatedListName);
  var permissionList = keystone.list(Constants.PermissionListName);

  var clearChain = Promise.resolve();
  var clearPromisesFunc = [
    regulatedList.model.remove().exec,
    permissionList.model.remove().exec,
  ];

  clearPromisesFunc.forEach(function(func) {
    clearChain = clearChain.then(function() {
      return func();
    });
  })

  clearChain.then(function() {
    regulatedList.model.bulkWrite(([
      Constants.RoleListName,
      Constants.UserListName,
      Constants.ShopListName,
      Constants.PermissionListName,
      Constants.RegulatedListName,
      Constants.FarmerListName,
      Constants.TransactionListName,
      Constants.AccountRecordListName,
      Constants.AccountListName,
      Constants.ProductTypeListName,
      Constants.ProductListName,
      Constants.PeriodListName,
      Constants.SystemListName,
      Constants.DBRecordListName,
    ]).map(function(listName) {
      return {
        insertOne: {
          document: {
            name: listName
          }
        }
      };  
    }))
  })
  
  .then(function() {
    done();
  })
  .catch(function(err) {
    done(err);
  })

}