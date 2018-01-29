var middleware = require('../middleware');
var Constants = require(__base + 'Constants');
var keystone = require('keystone');
var _ = require('lodash');

var farmerList = keystone.list(Constants.FarmerListName);
var accountList = keystone.list(Constants.AccountListName);
var accountRecList = keystone.list(Constants.AccountRecordListName);
var periodList = keystone.list(Constants.PeriodListName);
var transactionList = keystone.list(Constants.TransactionListName);

var mime = require('mime-to-extensions');
var moment = require('moment');
var mongoose = keystone.get('mongoose');
var path = require('path');
var fs = require('fs');
var DBRecTask = require('../DBRecTask');

exports.create = function(req, res) {
  var form = req.body;
  var farmer;

  var newAccount_id = mongoose.Types.ObjectId();
  var newRec_id = mongoose.Types.ObjectId();
  var createDate = Date.now();
  var newAccountID;

  farmerList.model.findOne({ pid : form.farmerPID })
    .select("_id pid")
    .lean()
    .exec()
    .then(function(_farmer) {
      if(!_farmer) {
        return Promise.reject('未找到相對應的農民帳號');
      }

      farmer = _farmer;
      return accountList.model.count({ farmer: _farmer._id }).exec();
    })
    .then(function(count) {
      newAccountID = farmer.pid + "-" + (count + 1).toString();

      var newRec = new accountRecList.model({
        _id: newRec_id,
        account: newAccount_id,
        opType: 'create',
        operator: req.user._id,
        date: createDate,
        comment: form.comment? form.comment: ''
      });
      newRec._req_user = req.user;

      var newAccount = new accountList.model({
        _id: newAccount_id,
        accountID: newAccountID,
        farmer: farmer._id,
        accountUser: form.accountUser? form.accountUser : '',
        createdAt: createDate,
        active: true,
        freeze: false,
        lastRecord: newRec._id,
        balance: 0
      });
      newAccount._req_user = req.user;

      var dbRecTask = new DBRecTask('createAccount');
      
      return dbRecTask.addPending(newRec.save, accountRecList, null, newRec)
               .addPending(newAccount.save, accountList, null, newAccount)
               .exec();
    })
    .then(function(results) {
      return res.json({
        success: true,
        result: results[1].toObject() //account
      });
    })
    .catch(function(err) {
      res.ktSendRes(400, err);
    });
  
}

exports.close = function(req, res) {
  var form = req.body;

  var filters = {};
  if(form.hasOwnProperty("_id")) {
    filters._id = form._id;
  }
  else if(form.hasOwnProperty("accountID")) {
    filters.accountID = form.accountID;
  }
  else {
    return res.ktSendRes(400, '沒有存取存摺的關鍵資訊');
  }

  var closeDate = Date.now();
  var newRec_id = mongoose.Types.ObjectId();
  
  accountList.model.findOne(filters)
  .populate('farmer')
  .exec()
  .then(function(account) {
    if(!account)
      return Promise.reject('未找到存摺');

    if(account.freeze) 
      return Promise.reject('此存摺被凍結中,無法進行此操作');      

    if(!account.active) 
      return Promise.reject('此存摺已被結清');

    var oldAcc = account.toObject();

    var newRec = new accountRecList.model({
      _id: newRec_id,
      account: account._id,
      opType: 'close',
      date: closeDate,
      operator: req.user._id,
      comment: form.comment? form.comment: '',
    });
    newRec._req_user = req.user;

    account.active = false;
    account.closedAt = newRec.date;
    account.lastRecord = newRec_id;
    account._req_user = req.user;

    var dbRecTask = new DBRecTask('closeAccount');
      
    return dbRecTask.addPending(account.save, accountList, oldAcc, account) //update
             .addPending(newRec.save, accountRecList, null, newRec)
             .exec();

  })
  .then(function(results) {

    return res.json({
      success: true,
      result: results[0].toObject()
    });

  })
  .catch(function(err) {
    res.ktSendRes(400,err);
  });

}

var accRecFileStorageAdapter = keystone.get('accRecFileStorageAdapter');

var getUnfreezeFilename = function(file, cb) {
  var account = this.account;
  var filename = ('unfreeze_' + account.accountID + '_' + moment().format('YYYY-MM-DD HH-mm-ss') + '.' + mime.extension(file.mimetype));
  cb(null, filename);
}

exports.setFreeze = function(req, res) {
  var form = JSON.parse(req.body.opData);
  
  var filters = {};

  if(form.hasOwnProperty("_id")) {
    filters._id = form._id;
  }
  else if(form.hasOwnProperty("accountID")) {
    filters.accountID = form.accountID;
  }
  else {
    return res.ktSendRes(400,'沒有存取存摺的關鍵資訊');
  }

  var newRec_id = mongoose.Types.ObjectId();
  accountList.model.findOne(filters)
  .populate('farmer')
  .exec()
  .then(function(account) {
    if(!account)
      return Promise.reject('未找到存摺');

    if(!account.active) 
      return Promise.reject('此存摺已被結清');

    var oldAcc = account.toObject();
    var nowDate = Date.now();

    var newRec = new accountRecList.model({
      _id: newRec_id,
      account: account._id,
      opType: account.freeze? 'unfreeze' : 'freeze',
      date: nowDate,
      operator: req.user._id,
      comment: form.comment? form.comment: '',
    });
    newRec._req_user = req.user;

    account.freeze = !account.freeze;
    account.lastRecord = newRec_id;
    account._req_user = req.user;
    
    var recPromiseFunc = function() {

      var relatedFile = req.files.relatedFile;
      if(relatedFile) {
        return new Promise(function(resolve, reject) {
          fs.access(relatedFile.path, fs.constants.F_OK, (err) => {
            if(err) reject(err);

            console.log('here4');

            var boundGetFilename = getUnfreezeFilename.bind({
              account: account,
            });

            accRecFileStorageAdapter.getFilename = boundGetFilename;
            accRecFileStorageAdapter.retryFilename = boundGetFilename;

            newRec._.relatedFile.upload(relatedFile, (err2) => {
                if (err2) return reject(err2.toString());

                console.log('here3.5');
                resolve(newRec.save());
            });

          });
          
        });
      }
      else {
        return newRec.save();
      }

    };
    
    var dbRecTask = new DBRecTask('freezeAccount');
      
    return dbRecTask.addPending(account.save, accountList, oldAcc, account) //update
                    .addPending(recPromiseFunc, accountRecList, null, newRec)
                    .exec();
    
  })
  .then(function(results) {
    return res.json({
      success: true,
      result: results[0].toObject(),
    });
  })
  .catch(function(err) {
    res.ktSendRes(400,err);
  });


}

exports.changeAccUser = function(req, res) {
  var form = req.body;

  var filters = {};
  if(form.hasOwnProperty("_id")) {
    filters._id = form._id;
  }
  else if(form.hasOwnProperty("accountID")) {
    filters.accountID = form.accountID;
  }
  else {
    return res.ktSendRes(400,'沒有存取存摺的關鍵資訊');
  }

  if(!form.hasOwnProperty("newUser")) {
    return res.ktSendRes(400,'沒有欲過戶的對象資訊');
  }

  var newRec_id = mongoose.Types.ObjectId();

  accountList.model.findOne(filters)
  .populate('farmer')
  .exec()
  .then(function(account) {
    if(!account)
      return Promise.reject('未找到存摺');

    if(!account.active) 
      return Promise.reject('此存摺已被結清');

    if(account.freeze) 
      return Promise.reject('此存摺被凍結中');
    
    var oldAcc = account.toObject();
    
    var newRec = new accountRecList.model({
      _id: newRec_id,
      account: account._id,
      opType: 'accUserChange',
      date: Date.now(),
      operator: req.user._id,
      comment: form.comment? form.comment: '',
    });
    newRec._req_user = req.user;
        
    account.accountUser = form.newUser;
    account.lastRecord = newRec_id;
    account._req_user = req.user;

    var dbRecTask = new DBRecTask('changeAccUser');
    return dbRecTask.addPending(account.save, accountList, oldAcc, account) //update
             .addPending(newRec.save, accountRecList, null, newRec)
             .exec();

  })
  .then(function(results) {
    return res.json({
      success: true,
      result: results[0].toObject()
    });
  })
  .catch(function(err) {
    res.ktSendRes(400, err);
  });

}

exports.deposit = function(req, res) {
  var form = req.body;

  var filters = {};
  if(form.hasOwnProperty("_id")) {
    filters._id = form._id;
  }
  else if(form.hasOwnProperty("accountID")) {
    filters.accountID = form.accountID;
  }
  else {
    return res.ktSendRes(400, '沒有存取存摺的關鍵資訊');
  }

  if(!form.hasOwnProperty("amount")) {
    return res.ktSendRes(400, '沒有金額資訊');
  }

  var nowDate = Date.now();
  var period_id = null;
  var account = null;
  var newRec_id = mongoose.Types.ObjectId();
  var amount = 0;
  var newBalance = 0;
  var oldAcc;

  accountList.model.findOne(filters)
  .populate('farmer lastRecord')
  .exec()
  .then(function(_account) {
    if(!_account)
      return Promise.reject('未找到存摺');

    if(!_account.active) 
      return Promise.reject('此存摺已被結清');

    if(_account.freeze) 
      return Promise.reject('此存摺被凍結中,無法進行此操作');

    account = _account;
    oldAcc = account.toObject();

    return;
  })
  .then(function() {
    if(form.hasOwnProperty('period')) {
      return periodList.model.findOne({
        name: form.period
      })
      .lean()
      .exec();
    }
    else 
      return 'pass';
  })
  .then(function(result) {
    if(result !== 'pass') {
      
      if(result) { //period found
        return result; //pass to next then
      }
      else { //period not found
        //create new period
        var newPeriod = new periodList.model({
          name: form.period
        });

        return newPeriod.save();  
      }
      
    }
    else {
      return result;
    }

  })
  .then(function(result) {
    if(result !== 'pass') {
      //it should be period id
      period_id = result._id;
    }

    return;
  })
  .then(function() {

    //parse amount
    if(_.isString(form.amount))
      amount = parseInt(form.amount);
    else
      amount = Math.floor(form.amount); //make sure it's integer

    amount = Math.abs(amount); //make sure it's positive

    if(isNaN(amount)) {
      return Promise.reject('欲入款金額資訊錯誤');
    }
    else if(amount === 0) {
      return Promise.reject('欲入款金額不得為0');
    }

    newBalance = account.balance + amount;

    var newRec = new accountRecList.model({
      _id: newRec_id,
      account: account._id,
      opType: 'deposit',
      amount: amount,
      date: nowDate,
      operator: req.user._id,
      comment: form.comment? form.comment: '',
      ioAccount: form.ioAccount? form.ioAccount: '',
    });
    if(period_id)
      newRec.period = period_id;
    newRec._req_user = req.user;

    account.balance = newBalance;
    account.lastRecord = newRec_id;
    account._req_user = req.user;

    var dbRecTask = new DBRecTask('deposit');
    return dbRecTask.addPending(account.save, accountList, oldAcc, account) //update
             .addPending(newRec.save, accountRecList, null, newRec)
             .exec();

  })
  .then(function(results) {
    return res.json({
      success: true,
      result: results[0].toObject(),
    });
  })
  .catch(function(err) {
    res.ktSendRes(400, err);
  });

}

exports.withdraw = function(req, res) {
  var form = req.body;

  var filters = {};
  if(form.hasOwnProperty("_id")) {
    filters._id = form._id;
  }
  else if(form.hasOwnProperty("accountID")) {
    filters.accountID = form.accountID;
  }
  else {
    return res.ktSendRes(400, '沒有存取存摺的關鍵資訊');
  }

  if(!form.hasOwnProperty("amount")) {
    return res.ktSendRes(400, '沒有金額資訊');
  }

  var amount = 0;
  var newRec_id = mongoose.Types.ObjectId();
  var oldAcc;
  var newBalance = 0;

  accountList.model.findOne(filters)
  .populate('farmer lastRecord')
  .exec()
  .then(function(account) {
    if(!account)
      return Promise.reject('未找到存摺');

    if(!account.active) 
      return Promise.reject('此存摺已被結清');
    
    if(account.freeze) 
      return Promise.reject('此存摺被凍結中,無法進行此操作');

    oldAcc = account.toObject();

    //parse amount
    if(_.isString(form.amount))
      amount = parseInt(form.amount);
    else
      amount = Math.floor(form.amount); //make sure it's integer

    amount = Math.abs(amount);

    if(isNaN(amount)) {
      return Promise.reject('欲提領金額資訊錯誤');
    }
    else if(amount === 0) {
      return Promise.reject('欲提領金額不得為0');
    }
    else if((account.balance - amount) < 0) {
      return Promise.reject('餘額不足');
    }
    
    newBalance = account.balance - amount;

    var newRec = new accountRecList.model({
      _id: newRec_id,
      account: account._id,
      opType: 'withdraw',
      amount: amount,
      date: Date.now(),
      operator: req.user._id,
      comment: form.comment? form.comment: '',
      ioAccount: form.ioAccount? form.ioAccount: '',
    });
    newRec._req_user = req.user;

    account.balance = newBalance;
    account.lastRecord = newRec_id;
    account._req_user = req.user;

    var dbRecTask = new DBRecTask('withdraw');
    return dbRecTask.addPending(account.save, accountList, oldAcc, account) //update
             .addPending(newRec.save, accountRecList, null, newRec)
             .exec();
  })
  .then(function(results) {
    return res.json({
      success: true,
      result: results[0].toObject()
    });
  })
  .catch(function(err) {
    res.ktSendRes(400, err);
  });

}

exports.lookupAccIDViaTrans = function(req, res, next) {
  var form = req.body;
  accountRecList.model.findOne({ transaction: form._id })
    .lean().select('_id').exec().then(function(accRec) {
      if(accRec) {
        form._id = accRec._id;
        next();
      }
      else {
        return Promise.reject('沒有該存摺紀錄');
      }
    })
    .catch(function(err) {
      res.ktSendRes(400, err);
    });

}

exports.updateRec = function(req, res) {
  var form = req.body;
  var diff = 0;
  var period_id;
  var finalRec;
  var finalTrans;
  var oldAcc;
  var oldTrans;
  var oldRec;

  Promise.resolve()
  .then(function() {
    if(form.hasOwnProperty('period')) {
      return periodList.model.findOne({
        name: form.period
      })
      .lean()
      .exec();
    }
    else 
      return 'pass';
  })
  .then(function(result) {
    if(result !== 'pass') {
      
      if(result) { //period found
        return result; //pass to next then
      }
      else { //period not found
        //create new period
        var newPeriod = new periodList.model({
          name: form.period
        });

        return newPeriod.save();  
      }
      
    }
    else {
      return result;
    }

  })
  .then(function(result) {
    if(result !== 'pass') {
      //it should be period id
      period_id = result._id;
    }

    return accountRecList.model.findOne({
      _id: form._id
    }).exec();
  })
  .then(function(accRec) {
    if(!accRec)
      return Promise.reject('沒有該存摺紀錄');

    finalRec = accRec;
    oldRec = accRec.toObject();

    if(accRec.transaction) {
      return transactionList.model.findOne({
        _id: accRec.transaction
      }).exec();
    }
    else {
      return 'pass';
    }

  })
  .then(function(transaction) {
    if(transaction !== 'pass') {
      if(!transaction) 
        return Promise.reject('沒有相對應的兌領紀錄');
      
      finalTrans = transaction;
      oldTrans = transaction.toObject();
    }
    
    return accountList.model.findOne({
      _id: finalRec.account
    }).populate('farmer').exec();
  
  })
  .then(function(account) {
    if(!account)
      return Promise.reject('未找到存摺');
    
    oldAcc = account.toObject();

    var accRec = finalRec;

    if(form.products) { //update transaction
      
      var newTotal = 0;
      form.products.forEach(function(product) {
        newTotal += (product.qty * product.price);
      });
      newTotal = Math.abs(newTotal);

      if(isNaN(newTotal))
        return Promise.reject('商品總價非數字');

      diff = accRec.amount - newTotal;
      accRec.amount = newTotal;

    }
    else {

      if(form.amount) {
        var amount = Math.abs(form.amount);

        if(isNaN(amount))
          return Promise.reject('金額非數字');
        
        if(accRec.opType === 'withdraw') {
          diff = accRec.amount - amount;
          accRec.amount = amount;
        } 
        else if(accRec.opType === 'deposit') {
          diff = amount - accRec.amount;
          accRec.amount = amount;
        }
      }
  
      if(form.comment)
        accRec.comment = form.comment;
      
      if(form.ioAccount) 
        accRec.ioAccount = form.ioAccount;
  
      if(period_id)
        accRec.period = period_id;

    }
    accRec._req_user = req.user;
    
    if(diff !== 0) {
      account.balance += diff;
      account._req_user = req.user;
    }
    
    var dbRecTask = new DBRecTask('updateRec');
    dbRecTask = dbRecTask.addPending(account.save, accountList, oldAcc, account) //update
                         .addPending(accRec.save, accountRecList, oldRec, accRec); //update
    
    if(finalTrans) {
      finalTrans.amount = accRec.amount;
      finalTrans.products = form.products;
      finalTrans._req_user = req.user;
      return dbRecTask.addPending(finalTrans.save, transactionList, oldTrans, finalTrans).exec();
    }
    else {
      return dbRecTask.exec();
    }
    
  })
  .then(function(results) {
    var result;
    if(results.length == 3) {
      result = {
        account: results[0].toObject(),
        accRec: results[1].toObject(),
        transaction: results[2].toObject()
      };
    }
    else {
      result = {
        account: results[0].toObject(),
        accRec: results[1].toObject(),
      }
    }

    res.json({
      success: true,
      result: result 
    });

  })
  .catch(function(err) {
    res.ktSendRes(400, err);
  });

}

exports.deleteRec = function(req, res) {
  var form = req.body;
  var finalRec;
  var finalTrans;
  var savAccount;
  var oldAcc;

  accountRecList.model.findOne({
    _id: form._id
  })
  .exec()
  .then(function(accRec) {
    if(!accRec)
      return Promise.reject('沒有該存摺紀錄');

    finalRec = accRec;
    
    if(accRec.transaction)
      return transactionList.model.findOne({ _id: accRec.transaction }).exec();
    else 
      return 'pass';

  })
  .then(function(transaction) {
    if(transaction !== 'pass') {
      if(!transaction)
        return Promise.reject('沒有相對應的兌領紀錄');

      finalTrans = transaction;
    }
    
    return accountList.model.findOne({
      _id: finalRec.account
    }).populate('farmer').exec();
  })
  .then(function(account) {
    if(!account)
      return Promise.reject('未找到存摺');

    savAccount = account;
    oldAcc = account.toObject();

    if(account.lastRecord === finalRec._id)
      return accountRecList.model.find().select('_id').lean().sort('-date').limit(2).exec();
    else 
      return account.lastRecord;

  })
  .then(function(latestRecord) {
    if(latestRecord instanceof Array && latestRecord.length > 1) {
      savAccount.lastRecord = latestRecord[1];
    }
    else {
      savAccount.lastRecord = latestRecord;
    }

    var accRec = finalRec;
    savAccount._req_user = req.user;

    if(accRec.opType === 'withdraw') {
      savAccount.balance += accRec.amount;
    }
    else if(accRec.opType === 'deposit') {
      savAccount.balance -= accRec.amount;
    }
    else if(accRec.opType === 'transact') {
      savAccount.balance += accRec.amount;
    }
    else if(accRec.opType === 'close') {
      savAccount.active = true;
      savAccount.closedAt = null;
    }
    else {
      return Promise.reject('該紀錄無法刪除');
    }

    var dbRecTask = new DBRecTask('deleteRec');

    dbRecTask.addPending(savAccount.save, accountList, oldAcc, savAccount) //update
             .addPending(accRec.remove, accountRecList, accRec, null); //remove
                             
    if(finalTrans) {
      dbRecTask.addPending(finalTrans.remove, transactionList, finalTrans, null); //remove
    }

    return dbRecTask.exec();
  })
  .then(function(results) {
    return res.json({
      success: true,
      result: results[0].toObject()
    });
  })
  .catch(function(err) {
    res.ktSendRes(400, err);
  });

}