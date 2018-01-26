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
      
      return newRec.save();
    })
    .then(function(savRec) {
      var newAccount = new accountList.model({
        _id: newAccount_id,
        accountID: newAccountID,
        farmer: farmer._id,
        accountUser: form.accountUser? form.accountUser : '',
        createdAt: createDate,
        active: true,
        freeze: false,
        lastRecord: savRec,
        balance: 0
      });

      newAccount._req_user = req.user;

      return newAccount.save();
    })
    .then(function(savAccount) {
      return res.json({
        success: true,
        result: savAccount.toObject() //account
      });
    })
    .catch(function(err) {
      res.ktSendRes(400, err.toString());
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
  var savAccount;
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

    savAccount = account;

    var newRec = new accountRecList.model({
      _id: newRec_id,
      account: account._id,
      opType: 'close',
      date: closeDate,
      operator: req.user._id,
      comment: form.comment? form.comment: '',
    });

    newRec._req_user = req.user;

    return newRec.save();
  })
  .then(function(savRec) {

    savAccount.active = false;
    savAccount.closedAt = savRec.date;
    savAccount.lastRecord = savRec;
    savAccount._req_user = req.user;

    return savAccount.save();

  })
  .then(function(_savAccount) {

    return res.json({
      success: true,
      result: _savAccount.toObject()
    });

  })
  .catch(function(err) {
    res.ktSendRes(400,err.toString());
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
  var savAccount;
  accountList.model.findOne(filters)
  .populate('farmer')
  .exec()
  .then(function(account) {
    if(!account)
      return Promise.reject('未找到存摺');

    if(!account.active) 
      return Promise.reject('此存摺已被結清');

    var nowDate = Date.now();

    savAccount = account;

    var newRec = new accountRecList.model({
      _id: newRec_id,
      account: account._id,
      opType: account.freeze? 'unfreeze' : 'freeze',
      date: nowDate,
      operator: req.user._id,
      comment: form.comment? form.comment: '',
    });
    newRec._req_user = req.user;
    
    var relatedFile = req.files.relatedFile;
    if(relatedFile) {
      return new Promise(function(resolve, reject) {
        fs.access(relatedFile.path, fs.constants.F_OK, (err) => {
          if(err) reject(err.toString());

          var boundGetFilename = getUnfreezeFilename.bind({
            account: account,
          });

          accRecFileStorageAdapter.getFilename = boundGetFilename;
          accRecFileStorageAdapter.retryFilename = boundGetFilename;

          newRec._.relatedFile.upload(relatedFile, (err2) => {
              if (err2) return reject(err2.toString());

              resolve(newRec.save());
          });

        });
        
      });
    }
    else {
      return newRec.save();
    }
    
  })
  .then(function(savRec) {
    savAccount.freeze = !savAccount.freeze;
    savAccount.lastRecord = savRec;
    savAccount._req_user = req.user;

    return savAccount.save();
  })
  .then(function(_savAccount) {
    return res.json({
      success: true,
      result: _savAccount.toObject(),
    });
  })
  .catch(function(err) {
    res.ktSendRes(400,err.toString());
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
  var savAccount;

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
    
    savAccount = account;

    var newRec = new accountRecList.model({
      _id: newRec_id,
      account: account._id,
      opType: 'accUserChange',
      date: Date.now(),
      operator: req.user._id,
      comment: form.comment? form.comment: '',
    });

    newRec._req_user = req.user;
    return newRec.save();
    
  })
  .then(function(savRec) {
    
    savAccount.accountUser = form.newUser;
    savAccount.lastRecord = savRec;
    savAccount._req_user = req.user;

    return savAccount.save();
  })
  .then(function(_savAccount) {
    return res.json({
      success: true,
      result: _savAccount.toObject()
    });
  })
  .catch(function(err) {
    res.ktSendRes(400, err.toString());
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

  accountList.model.findOne(filters)
  .populate('farmer')
  .exec()
  .then(function(_account) {
    if(!_account)
      return Promise.reject('未找到存摺');

    if(!_account.active) 
      return Promise.reject('此存摺已被結清');

    if(_account.freeze) 
      return Promise.reject('此存摺被凍結中,無法進行此操作');

    account = _account;

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

    return newRec.save();

  })
  .then(function(savRec) {
    account.balance = newBalance;
    account.lastRecord = savRec;
    account._req_user = req.user;

    return account.save();
  })
  .then(function(_savAccount) {
    return res.json({
      success: true,
      result: _savAccount.toObject(),
    });
  })
  .catch(function(err) {
    res.ktSendRes(400, err.toString());
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
  var savAccount;
  var newBalance = 0;

  accountList.model.findOne(filters)
  .populate('farmer')
  .exec()
  .then(function(account) {
    if(!account)
      return Promise.reject('未找到存摺');

    if(!account.active) 
      return Promise.reject('此存摺已被結清');
    
    if(account.freeze) 
      return Promise.reject('此存摺被凍結中,無法進行此操作');

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

    savAccount = account;

    return newRec.save();

  })
  .then(function(savRec) {
    
    savAccount.balance = newBalance;
    savAccount.lastRecord = savRec;
    savAccount._req_user = req.user;

    return savAccount.save();

  })
  .then(function(_savAccount) {
    return res.json({
      success: true,
      result: _savAccount.toObject()
    });
  })
  .catch(function(err) {
    res.ktSendRes(400, err.toString());
  });

}

exports.updateRec = function(req, res) {
  var form = req.body;
  var diff = 0;
  var period_id;
  var finalRec;
  var finalTrans;
  var savAccount;

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
    }
    
    return accountList.model.findOne({
      _id: finalRec.account
    }).populate('farmer').exec();
  
  })
  .then(function(account) {
    if(!account)
      return Promise.reject('未找到存摺');
    
    savAccount = account;
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

    return accRec.save();
  })
  .then(function(savRec) {

    if(finalTrans) {
      finalTrans.amount = savRec.amount;
      finalTrans.products = form.products;
      return finalTrans.save();
    }
    else {
      return;
    }
    
  })
  .then(function(trans){
    if(trans) {
      finalTrans = trans;
    }

    if(diff !== 0) {
      savAccount.balance += diff;
      return savAccount.save();
    }
    else {
      return savAccount;
    }
  })
  .then(function(_savAccount) {
    var result = {
      accRec: finalRec.toObject(),
      account: _savAccount.toObject(),
    };

    if(finalTrans) {
      result.transaction = finalTrans.toObject();
    }

    res.json({
      success: true,
      result: result 
    });
  })
  .catch(function(err) {
    res.ktSendRes(400, err.toString());
  });

}

exports.deleteRec = function(req, res) {
  var form = req.body;
  var finalRec;
  var savAccount;
  accountRecList.model.findOne({
    _id: form._id
  })
  .exec()
  .then(function(accRec) {
    if(!accRec)
      return Promise.reject('沒有該存摺紀錄');

    finalRec = accRec;

    return accountList.model.findOne({
      _id: accRec.account
    }).populate('farmer').exec();

  })
  .then(function(account) {
    if(!account)
      return Promise.reject('未找到存摺');

    var accRec = finalRec;

    if(accRec.opType === 'withdraw') {
      account.balance += accRec.amount;
      return account.save(); 
    }
    else if(accRec.opType === 'deposit') {
      account.balance -= accRec.amount;
      return account.save();
    }
    else if(accRec.opType === 'transact') {
      account.balance += accRec.amount;
      return account.save();
    }
    else if(accRec.opType === 'close') {
      account.active = true;
      account.closedAt = undefined;
      return account.save();
    }
    else {
      return Promise.reject('該紀錄無法刪除');
    }
  })
  .then(function(_savAccount) { 
    savAccount = _savAccount;
    if(finalRec.opType === 'transact') {
      return transactionList.model.remove({ _id: finalRec.transaction }).exec();
    }
    else {
      return 'pass';
    }
  })
  .then(function(result) {
    return accountRecList.model.remove(finalRec).exec();
  })
  .then(function(delRec) {
    if(delRec._id === savAccount.lastRecord) {
      return accountRecList.model.find().sort('-date').limit(1).exec();
    }
    else {
      return 'pass';
    }
  })
  .then(function(latestRecord){
    if(latestRecord !== 'pass') {
      savAccount.lastRecord = latestRecord;
      return savAccount.save();
    }
    else {
      return savAccount;
    }
  })
  .then(function(_savAccount) {
    return res.json({
      success: true,
      result: _savAccount.toObject()
    });
  })
  .catch(function(err) {
    res.ktSendRes(400, err.toString());
  });

}