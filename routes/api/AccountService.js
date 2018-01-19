var middleware = require('../middleware');
var Constants = require(__base + 'Constants');
var keystone = require('keystone');
var _ = require('lodash');

var farmerList = keystone.list(Constants.FarmerListName);
var accountList = keystone.list(Constants.AccountListName);
var accountRecList = keystone.list(Constants.AccountRecordListName);
var periodList = keystone.list(Constants.PeriodListName);

var mongoose = keystone.get('mongoose');

exports.create = function(req, res) {
  var form = req.body;
  var farmer;

  var newAccount_id = mongoose.Types.ObjectId();
  var newRec_id = mongoose.Types.ObjectId();
  var createDate = Date.now();
      
  farmerList.model.findOne({ pid : form.farmerPID })
    .select("_id pid")
    .lean()
    .exec()
    .then(function(_farmer) {
      if(!_farmer) {
        return Promise.reject('未找到相對應的農夫帳號');
      }

      farmer = _farmer;
      return accountList.model.count({ farmer: _farmer._id }).exec();
    })
    .then(function(count) {
      var newAccountID = farmer.pid + "-" + (count + 1).toString();

      var accBk = {
        accountID: newAccountID,
        farmer: farmer._id,
        accountUser: form.accountUser ? form.accountUser : '',
        createdAt: createDate,
        balance: 0,
        active: true,
        freeze: false
      };

      var newRec = new accountRecList.model({
        _id: newRec_id,
        account: newAccount_id,
        opType: 'create',
        operator: req.user._id,
        date: createDate,
        comment: form.comment? form.comment: '',
        accBk: accBk
      });

      newRec._req_user = req.user;
      
      return newRec.save();
    })
    .then(function(savRec) {
      var newAccount = new accountList.model({
        _id: newAccount_id,
        accountID: savRec.accBk.accountID,
        farmer: savRec.accBk.farmer,
        accountUser: savRec.accBk.accountUser,
        createdAt: createDate,
        active: savRec.accBk.active,
        lastRecord: savRec._id,
        balance: savRec.accBk.balance
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
      res.json({
        success: false,
        message: err.toString()
      });
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
    return res.json({
      success: false,
      message: '沒有存取存摺的關鍵資訊'
    });
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

    var accBk = {
      accountID: account.accountID,
      farmer: account.farmer._id,
      accountUser: account.accountUser,
      active: false,
      freeze: account.freeze,
      createdAt: account.createdAt,
      closedAt: closeDate,
      balance: account.balance,
    };

    var newRec = new accountRecList.model({
      _id: newRec_id,
      account: account._id,
      opType: 'close',
      date: closeDate,
      operator: req.user._id,
      comment: form.comment? form.comment: '',
      accBk: accBk
    });

    newRec._req_user = req.user;

    return newRec.save();
  })
  .then(function(savRec) {

    savAccount.active = false;
    savAccount.closedAt = closeDate;
    savAccount.lastRecord = newRec_id;
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
    res.json({
      success: false,
      message: err.toString()
    });
  });

}

exports.setFreeze = function(req, res) {
  var form = req.body;

  var filters = {};

  if(form.hasOwnProperty("_id")) {
    filters._id = form._id;
  }
  else if(form.hasOwnProperty("accountID")) {
    filters.accountID = form.accountID;
  }
  else {
    return res.json({
      success: false,
      message: '沒有存取存摺的關鍵資訊'
    });
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

    var accBk = {
      accountID: account.accountID,
      farmer: account.farmer._id,
      accountUser: account.accountUser,
      active: account.active,
      freeze: !account.freeze,
      createdAt: account.createdAt,
      balance: account.balance,
    };

    savAccount = account;

    var newRec = new accountRecList.model({
      _id: newRec_id,
      account: account._id,
      opType: account.freeze? 'unfreeze' : 'freeze',
      date: Date.now(),
      operator: req.user._id,
      comment: form.comment? form.comment: '',
      accBk: accBk
    });

    newRec._req_user = req.user;
    return newRec;
    
  })
  .then(function(savRec) {
    
    savAccount.freeze = savRec.accBk.freeze;
    savAccount.lastRecord = newRec_id;
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
    res.json({
      success: false,
      message: err.toString()
    });
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
    return res.json({
      success: false,
      message: '沒有存取存摺的關鍵資訊'
    });
  }

  if(!form.hasOwnProperty("amount")) {
    return res.json({
      success: false,
      message: '沒有金額資訊'
    });
  }

  var nowDate = Date.now();
  var period_id = null;
  var account = null;
  var newRec_id = mongoose.Types.ObjectId();
  var amount = 0;

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

    var newBalance = account.balance + amount;

    var accBk = {
      accountID: account.accountID,
      farmer: account.farmer._id,
      accountUser: account.accountUser,
      active: account.active,
      freeze: account.freeze,
      createdAt: account.createdAt,
      balance: newBalance,
    };

    var newRec = new accountRecList.model({
      _id: newRec_id,
      account: account._id,
      opType: 'deposit',
      amount: amount,
      date: nowDate,
      operator: req.user._id,
      comment: form.comment? form.comment: '',
      ioAccount: form.ioAccount? form.ioAccount: '',
      accBk: accBk
    });

    if(period_id)
      newRec.period = period_id;

    newRec._req_user = req.user;

    return newRec.save();

  })
  .then(function(savRec) {

    account.balance = savRec.accBk.balance;
    account.lastRecord = newRec_id;
    account._req_user = req.user;

    return account.save();
  })
  .then(function(_savAccount) {

    return res.json({
      success: true,
      result: _savAccount.toObject()
    });

  })
  .catch(function(err) {
    return res.json({
      success: false,
      message: err.toString()
    });
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
    return res.json({
      success: false,
      message: '沒有存取存摺的關鍵資訊'
    });
  }

  if(!form.hasOwnProperty("amount")) {
    return res.json({
      success: false,
      message: '沒有金額資訊'
    });
  }

  var amount = 0;
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
    
    var newBalance = account.balance - amount;

    var accBk = {
      accountID: account.accountID,
      farmer: account.farmer._id,
      accountUser: account.accountUser,
      active: account.active,
      freeze: account.freeze,
      createdAt: account.createdAt,
      balance: newBalance,
    };

    var newRec = new accountRecList.model({
      _id: newRec_id,
      account: account._id,
      opType: 'withdraw',
      amount: amount,
      date: Date.now(),
      operator: req.user._id,
      comment: form.comment? form.comment: '',
      ioAccount: form.ioAccount? form.ioAccount: '',
      accBk: accBk
    });

    newRec._req_user = req.user;

    savAccount = account;

    return newRec.save();

  })
  .then(function(savRec) {
    
    savAccount.balance = savRec.accBk.balance;
    savAccount.lastRecord = newRec_id;
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
    res.json({
      success: false,
      message: err.toString()
    });
  });

}