exports = module.exports = (function() {
  var keystone = require('keystone');
  var async = require('async');
  var fs = require('fs');
  var Constants = require(__base + 'Constants');
  
  var dataCollection = {};

  dataCollection[Constants.RegulatedListName] = ([
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
    Constants.SystemListName
  ]).map(function(listName) {
    return {
      name: listName
    };
  });

  return {
    create: dataCollection

  };

})();