var middleware = require('../middleware');
var Constants = require(__base + 'Constants');
var keystone = require('keystone');
var _ = require('lodash');

var farmerList = keystone.list(Constants.FarmerListName);
var accountList = keystone.list(Constants.AccountListName);
var accountRecList = keystone.list(Constants.AccountRecordListName);
var periodList = keystone.list(Constants.PeriodListName);
var transactionList = keystone.list(Constants.TransactionListName);
var sysList = keystone.list(Constants.SystemListName);

const mime = require('mime-to-extensions');
const moment = require('moment');
const mongoose = keystone.get('mongoose');
const path = require('path');
const fs = require('fs');
const os = require('os');
const iconv = require('iconv-lite');

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
  .populate('farmer lastRecord')
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
  .populate('farmer lastRecord')
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
      /*
      var relatedFile = req.files.relatedFile;
      if(relatedFile) {
        return new Promise(function(resolve, reject) {
          fs.access(relatedFile.path, fs.constants.F_OK, (err) => {
            if(err) reject(err);

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
      */

      return newRec.save();
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
  .populate('farmer lastRecord')
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

    return accountRecList.model.find({ 
      account: account._id,
    }).select('_id').lean().sort('-date').limit(2).exec();

  })
  .then(function(latestRecord) {
    if(latestRecord instanceof Array && latestRecord.length > 0) {
      var index = _.findIndex(latestRecord, function(rec) {
        return rec._id.toString() !== finalRec._id.toString();
      });

      if(index !== -1)
        savAccount.lastRecord = latestRecord[index];
      else
        savAccount.lastRecord = null;
    }
    else {
      savAccount.lastRecord = null;
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
    else if(accRec.opType === 'annuallyWithdraw') {
      savAccount.balance += accRec.amount;
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

exports.annuallyWithdraw = function(req, res, next) {
  var form = req.body;

  var date;
  if(form.date) {
    date = new Date(form.date);
  }
  else {
    date = new Date();
  }
  
  var dateMoment = moment(date);
  var comment = dateMoment.rocYear() + '年度結清';
  
  var data = {
    code: undefined,
    finNum: undefined,
    date: date,
    pids: [],
    names: [],
    amounts: [],
    accountIDs : [],
    ioAccounts : []
  };

  sysList.model.findOne().lean().select('finNum').exec()
  .then(function(sysData) {
    if(!sysData)
      return Promise.reject('無系統資料');
    if(!sysData.finNum)
      return Promise.reject('尚未設定金融代碼,請至後台系統表格設定');

    data.finNum = sysData.finNum;

    if(!form.code) {
      return Promise.reject('無摘要代碼');
    }

    data.code = form.code;
    return accountList.model.find({
      active: true,
      balance: { $gt: 0 }
    })
    .populate('farmer')
    .exec();
  })
  .then(function(accounts) {
    if(!accounts || accounts.length === 0) {
      return Promise.reject('無可年度結清之存摺');
    }

    var dbRecTask = new DBRecTask('annuallyWithdraw');

    var rejectThis = false;
    var reason = '';

    accounts.forEach(function(account) {
      if(!account.farmer.ioAccount || account.farmer.ioAccount.length === 0) {
        rejectThis = true;
        reason = '農民預設對口帳戶為空';
      }
        
      var oldAcc = account.toObject();
      var newRec_id = mongoose.Types.ObjectId();
      var newRec = new accountRecList.model({
        _id: newRec_id,
        account: account._id,
        opType: 'annuallyWithdraw',
        amount: account.balance,
        date: date,
        operator: req.user._id,
        ioAccount: account.farmer.ioAccount,
        comment: comment,
      });

      data.pids.push(account.farmer.pid);
      data.names.push(account.farmer.name);
      
      account.balance = 0;
      account.lastRecord = newRec_id;

      dbRecTask.addPending(account.save, accountList, oldAcc, account)
                .addPending(newRec.save, accountRecList, null, newRec);
    });

    if(rejectThis) {
      return Promise.reject(reason);
    }

    return dbRecTask.exec();
  })
  .then(function(results) {
    results.forEach(function(result, index) {
      if(index % 2 === 1) {
        //acc rec
        data.amounts.push(result.amount);
        data.ioAccounts.push(result.ioAccount);
      }
      else {
        //account
        data.accountIDs.push(result.accountID);
      }
    });

    form.data = data;

    next();
  })
  .catch(function(err) {
    res.ktSendRes(400, err);
  });

}

exports.deleteAnnuallyWithdraw = function(req, res) {

  var form = req.body;
  var accRecsMap = {};
  var finalAccs;
  var account_ids;
  var numAccs;
  var oldAccs = [];
  Promise.resolve()
  .then(function() {

    if(!form.date) {
      form.date = moment(); //today
    }
    else {
      form.date = moment(form.date);
    }

    //console.log('year:' + form.date.year());

    return accountRecList.model.find({ 
      $expr: {
        $and: [
          { $eq: [{ $year: '$date' }, form.date.year()] }, //this year
          { $eq: [ '$opType' , 'annuallyWithdraw' ] },  //annuallyWithdraw op
        ]
      }
    }).exec();
  })
  .then(function(accRecs) {
    if(!accRecs || accRecs.length === 0) {
      return Promise.reject('沒找到年度結清紀錄');
    }

    account_ids = accRecs.map(function(accRec) {
      accRecsMap[accRec.account] = accRec;
      return accRec.account;
    });

    numAccs = account_ids.length;

    return accountList.model.find({
      _id: { $in: account_ids }
    }).exec();
  })
  
  .then(function(accounts) {
    if(!accounts || accounts.length === 0 || numAccs !== accounts.length)
      return Promise.reject('存摺資料有誤');

    finalAccs = accounts;

    var pChain = Promise.resolve();
    accounts.forEach(function(account) {
      oldAccs.push(account.toObject());
      
      account.balance += accRecsMap[account._id].amount;
      var delRec = accRecsMap[account._id];
      pChain = pChain.then(function() {
          return accountRecList.model.find({ 
            account: account._id
          }).select('_id').sort('-date').limit(2).lean().exec();
        }).then(function(accRecs){
          var index = _.findIndex(accRecs, function(accRec) {
            return (accRec._id.toString() !== delRec._id.toString());
          });

          if(index !== -1) {
            account.lastRecord = accRecs[index]._id;
          }
          else{
            account.lastRecord = null;
          }
        });
    });

    return pChain;
  })
  .then(function(){

    var dbRecTask = new DBRecTask('deleteAnnuallyWithdraw');
    finalAccs.forEach(function(acc, index) {
      var delRec = accRecsMap[acc._id];
      dbRecTask.addPending(acc.save, accountList, oldAccs[index], acc)
               .addPending(delRec.remove, accountRecList, delRec, null);
    });
    
    return dbRecTask.exec();
  })
  .then(function(results) {
    return res.json({
      success: true,
    });
  })
  .catch(function(err) {
    res.ktSendRes(400, err);
  });

}

exports.getAnnuallyWithdrawData = function(req, res, next) {
  var form = req.body;

  form.data = {
    code: undefined,
    finNum: undefined,
    date: undefined,
    pids: [],
    names: [],
    amounts: [],
    accountIDs : [],
    ioAccounts : []
  };

  var accounts = [];
  var numFarmers;
  sysList.model.findOne().lean().select('finNum').exec()
  .then(function(sysData) {
    if(!sysData)
      return Promise.reject('無系統資料');
    if(!sysData.finNum)
      return Promise.reject('尚未設定金融代碼,請至後台系統表格設定');

    form.data.finNum = sysData.finNum;

    if(!form.code) {
      return Promise.reject('無摘要代碼');
    }

    form.data.code = form.code;

    if(!form.date) {
      form.date = moment(); //today
    }
    else {
      form.date = moment(form.date);
    }

    //console.log('year:' + form.date.year());

    return accountRecList.model.find({ 
      $expr: {
        $and: [
          { $eq: [{ $year: '$date' }, form.date.year()] }, //this year
          { $eq: [ '$opType' , 'annuallyWithdraw' ] },  //annuallyWithdraw op
        ]
      }
    }).select('amount account date ioAccount').populate('account').lean().exec();
  })
  .then(function(accRecs) {
    if(!accRecs || accRecs.length === 0) {
      return Promise.reject('沒找到年度結清紀錄');
    }

    form.data.date = new Date(accRecs[0].date);

    var farmers = [];
    accRecs.forEach(function(accRec) {
      farmers.push(accRec.account.farmer.toString());
      accounts.push(accRec.account);

      form.data.amounts.push(accRec.amount);
      form.data.accountIDs.push(accRec.account.accountID);
      form.data.ioAccounts.push(accRec.ioAccount);
    });

    farmers = Array.from(new Set(farmers));
    numFarmers = farmers.length;

    return farmerList.model.find({ _id: { $in: farmers } }).select('_id pid name').lean().exec();
  })
  .then(function(farmers) {
    if(!farmers || farmers.length === 0)
      return Promise.reject('沒找到農夫的資料');

    if(farmers.length !== numFarmers) {
      return Promise.reject('農夫資料筆數缺漏');
    }

    var pidMap = {};
    var nameMap = {};
    farmers.forEach(function(farmer) {
      var farmerID = farmer._id.toString();
      pidMap[farmerID] = farmer.pid;
      nameMap[farmerID] = farmer.name;
    });

    accounts.forEach(function(account) {
      var farmerID = account.farmer.toString();
      form.data.pids.push(pidMap[farmerID]);
      form.data.names.push(nameMap[farmerID]);
    });
    
    next();
  })
  .catch(function(err) {
    res.ktSendRes(400, err);
  });
  
}

String.prototype.padStart = function(num, padStr) {
  return _.padStart(this.toString(),num,padStr);
};

String.prototype.padEnd = function(num, padStr) {
  return _.padEnd(this.toString(),num,padStr);
};

var digitCHMap = {
  '0': '零',
  '1': '一',
  '2': '二',
  '3': '三',
  '4': '四',
  '5': '五',
  '6': '六',
  '7': '七',
  '8': '八',
  '9': '九',
}

var rocYearToCH = function(rocYearStr) {
  var result = '';
  for (var i = 0; i < rocYearStr.length; i++) {
    result += digitCHMap[rocYearStr.charAt(i)];
  }
}

exports.downloadAWMediaFile = function(req, res) {
  var data = req.body.data;

  if(!data)
    return res.ktSendRes(400, '沒有相關資料無法產生結算用媒體檔'); 

  data.code = data.code.toString();
  if(data.code.length !== 3) 
    return res.ktSendRes(400, '摘要代碼必須為3位數字'); 

  try {

    var newLineChar = os.EOL;

    var lineLength = 150;
    var blockOnePart = data.finNum.substring(0, 3) + 'XX001600' + (' '.repeat(5)); //finNum(3) + other fixed str
    var linesOfData = [];
    
    var dateMoment = moment(data.date);
    var rocYearStr = dateMoment.rocYear().toString().padStart(3, '0');
    var withdrawMsg =  '米單結清款' + rocYearStr.padEnd(4, ' '); //this should be 14 bytes
    //var withdrawMsg = '107'.padEnd(14,' ');
    var numCHChars = 5;
    var dateFormat = rocYearStr + dateMoment.format('MMDD');
    var blockTwoPrefix = data.finNum.substring(0, 5) + dateFormat; //finNum(5) + dateStr
    var twoZeros = '0'.repeat(2);
    var tenSpaces = ' '.repeat(10);

    var sendFileFixPart = '0'.repeat(12) + '99';
    
    //first line
    var line = ('1' + blockOnePart + blockTwoPrefix + '100').padEnd(lineLength, ' ') + newLineChar;
    linesOfData.push(line);
    
    var debitAmount = 0; //借
    var count = 0;
    data.pids.forEach(function(pid, index) {
      var amount = Math.floor(data.amounts[index]);
      var accountIDInfo = data.accountIDs[index];
      debitAmount += amount;
      line = ('2' + blockOnePart + blockTwoPrefix + 
            '2' + data.code + data.ioAccounts[index].substring(0, 14).padEnd(14, ' ') + 
            (amount.toString() + twoZeros).padStart(14, '0') + 
            sendFileFixPart //通知＋狀況代碼
            + withdrawMsg //交易註記(1)
            + tenSpaces //交易註記(2)
            + ' ' //(身分證檢核號,不進行檢核)
            + pid
            + accountIDInfo).padEnd(lineLength - numCHChars, ' ') + newLineChar;
      linesOfData.push(line);
      count++;
    });

    var creditAmount = 0; //貸
    
    //last line
    line = ('3' + blockOnePart + blockTwoPrefix + count.toString().padStart(10, '0') +
            (creditAmount.toString() + twoZeros).padStart(16, '0') +
            (debitAmount.toString() + twoZeros).padStart(16, '0')).padEnd(lineLength, ' ') + newLineChar;
    linesOfData.push(line);
    
    var finalData = linesOfData.join('');
    const buf = Buffer.from(iconv.encode(finalData,'big5'));

    var checkCode = (parseInt(dateFormat) + count + creditAmount + debitAmount).toString();
    checkCode = checkCode.substring(checkCode.length - 5, checkCode.length).padStart(5,'0');
    
    res.charset = 'big5';
    res.json({
      success: true,
      filename: (dateFormat + '-' + checkCode + '.txt'),
      content: buf.toJSON(),
      checkCode: checkCode
    });

  }
  catch(err) {
    res.ktSendRes(400, err.toString());
  }  

}