module.exports = function(done) {
  var keystone = require('keystone');
  var async = require('async');
  var fs = require('fs');
  var Constants = require(__base + 'Constants');
  var mongoose = keystone.get('mongoose');
  
  var regulatedList = keystone.list(Constants.RegulatedListName);
  var permissionList = keystone.list(Constants.PermissionListName);
  var roleList = keystone.list(Constants.RoleListName);

  var getClearPromiseWrapper = function(list) {
    return new Promise(function(resolve,reject) {
      list.model.remove({}, function(err) {
        if(err) reject(err);
        resolve();
      });
    });
  }

  var clearChain = Promise.resolve();
  var listToClear = [
    regulatedList,
    permissionList,
    roleList
  ];

  listToClear.forEach(function(list) {
    clearChain = clearChain.then(function() {
      return getClearPromiseWrapper(list);
    });
  });

  const createOp = 'create';
  const readOp = 'read';
  const updateOp = 'update';
  const deleteOp = 'delete';

  var rlIdMap = {};
  var roleIdMap = {};
  var roleNames = [];
  var roleInfos = {
    '兌領交易員': [
      {
        listName: Constants.FarmerListName,
        doableOp: [readOp, updateOp]
      },
      {
        listName: Constants.AccountListName,
        doableOp: [createOp, readOp, updateOp]
      },
      {
        listName: Constants.AccountRecordListName,
        doableOp: [createOp, readOp]
      },
      {
        listName: Constants.TransactionListName,
        doableOp: [createOp, readOp]
      },
      {
        listName: Constants.PeriodListName,
        doableOp: [createOp, readOp]
      },
      {
        listName: Constants.ProductTypeListName,
        doableOp: [readOp]
      },
      {
        listName: Constants.ProductListName,
        doableOp: [readOp]
      }
    ],

    '紀錄修正員': [
      {
        listName: Constants.FarmerListName,
        doableOp: [createOp, readOp]
      },
      {
        listName: Constants.AccountListName,
        doableOp: [readOp, updateOp]
      },
      {
        listName: Constants.AccountRecordListName,
        doableOp: [readOp,updateOp,deleteOp]
      },
      {
        listName: Constants.TransactionListName,
        doableOp: [readOp,updateOp,deleteOp]
      },
    ],

    '商品資訊管理員': [
      {
        listName: Constants.ProductTypeListName,
        doableOp: [createOp, readOp, updateOp, deleteOp]
      },
      {
        listName: Constants.ProductListName,
        doableOp: [createOp, readOp, updateOp, deleteOp]
      },
    ],

    '統計員': [
      {
        listName: Constants.FarmerListName,
        doableOp: [readOp]
      },
      {
        listName: Constants.AccountListName,
        doableOp: [readOp]
      },
      {
        listName: Constants.AccountRecordListName,
        doableOp: [readOp]
      },
      {
        listName: Constants.TransactionListName,
        doableOp: [readOp]
      },
      {
        listName: Constants.PeriodListName,
        doableOp: [readOp]
      },
      {
        listName: Constants.ProductListName,
        doableOp: [readOp]
      },
      {
        listName: Constants.ProductTypeListName,
        doableOp: [readOp]
      },
    ]

  };

  clearChain.then(function() {
    var innerChain = Promise.resolve();
    [
      Constants.RoleListName,
      Constants.UserListName,
      Constants.PermissionListName,
      Constants.RegulatedListName,
      Constants.DBRecordListName,

      Constants.FarmerListName,
      Constants.TransactionListName,
      Constants.AccountRecordListName,
      Constants.AccountListName,
      Constants.ProductTypeListName,
      Constants.ProductListName,
      Constants.PeriodListName,
    ].forEach(function(listName) {
      innerChain = innerChain.then(function() {
        rlIdMap[listName] = mongoose.Types.ObjectId();
        var rl = new regulatedList.model({
          _id: rlIdMap[listName],
          name: listName
        });
        return rl.save();
      });
    });

    return innerChain;
  })
  .then(function() {
    var innerChain = Promise.resolve(); 
    for(var roleName in roleInfos) {
      roleNames.push(roleName);
    }

    roleNames.forEach(function(roleName) {
      innerChain = innerChain.then(function() {
        roleIdMap[roleName] = mongoose.Types.ObjectId();
        var role = new roleList.model({
          _id: roleIdMap[roleName],
          name: roleName
        });

        return role.save();
      });
    });

    return innerChain;
  })
  .then(function() {

    var partialRL = [Constants.FarmerListName,
      Constants.TransactionListName,
      Constants.AccountRecordListName,
      Constants.AccountListName,
      Constants.ProductTypeListName,
      Constants.ProductListName,
      Constants.PeriodListName];

    var permissionInfos = {};
    partialRL.forEach(function(listName) {
        permissionInfos[listName] = {
          name: listName + '存取權限',
          listName: rlIdMap[listName],
          create: [],
          read: [],
          update: [],
          delete: []
        }
      });

    for(var roleName in roleInfos) {
      var roleInfo = roleInfos[roleName];
      var roleId = roleIdMap[roleName];
      roleInfo.forEach(function(permittedList) {
        var permissionInfo = permissionInfos[permittedList.listName];
        permittedList.doableOp.forEach(function(op) {
          permissionInfo[op].push(roleId);
        });
      });
    }

    var innerChain = Promise.resolve();
    
    partialRL.forEach(function(rlName) {
      var permissionInfo = permissionInfos[rlName];
      innerChain = innerChain.then(function() {
        var permission = new permissionList.model(permissionInfo);
        return permission.save();
      });
    });

    return innerChain;
  })
  .then(function() {
    done();
  })
  .catch(function(err) {
    done(err);
  })

}
