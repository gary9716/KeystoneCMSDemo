var middleware = require('../middleware');
var Constants = require(__base + 'Constants');
var keystone = require('keystone');
var _ = require('lodash');
var Fawn = require('fawn');
var mongoose = keystone.get('mongoose');

var farmerList = keystone.list(Constants.FarmerListName);
var accountList = keystone.list(Constants.AccountListName);
var accountRecList = keystone.list(Constants.AccountRecordListName);
var purchaseList = keystone.list(Constants.PurchaseListName);

var viaSaveOpt = {viaSave: true};
var viaMongoose = {useMongoose: true};

exports.create = function(req, res) {
  var form = req.body;
  var savAccount;
  var farmer;

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

      var createDate = Date.now();
      var newAccount_id = mongoose.Types.ObjectId();
      var newRec_id = mongoose.Types.ObjectId();

      var newAccount = new accountList.model({
        _id: newAccount_id,
        accountID: newAccountID,
        farmer: farmer._id,
        accountUser: form.accountUser,
        createdAt: createDate,
        active: true,
        lastRecord: newRec_id
      });

      var newRec = new accountRecList.model({
        _id: newRec_id,
        account: newAccount_id,
        opType: 'create',
        operator: req.user._id,
        date: createDate
      });

      newAccount._req_user = req.user;
      newRec._req_user = req.user;
      
      var task = Fawn.Task();
      return task.save(newAccount)
                 .save(newRec)
                 .run(viaMongoose);
    })
    .then(function(results) {
      return res.json({
        success: true,
        result: results[0].toObject() //account
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
  if(form.hasOwnProperty("accountID")) {
    filters.accountID = form.accountID;
  }
  else if(form.hasOwnProperty("account_id")) {
    filters._id = form.account_id;
  }
  else {
    return res.json({
      success: false,
      message: '沒有存取存摺的關鍵資訊'
    });
  }

  var savAccount;

  accountList.model.findOne(filters)
  .select("active")
  .exec()
  .then(function(account) {
    if(!account)
      return Promise.reject('未找到存摺');

    if(!account.active) 
      return Promise.reject('此存摺已被結清');

    var newRec_id = mongoose.Types.ObjectId();
    var closeDate = Date.now();
    
    var newRec = new accountRecList.model({
      _id: newRec_id,
      account: account._id,
      opType: 'close',
      date: closeDate,
      operator: req.user._id
    });

    newRec._req_user = req.user;
    account._req_user = req.user;

    var task = Fawn.Task();
    return task.update(account, { active: false, closedAt: closeDate, lastRecord: newRec_id }).options(viaSave)
               .save(newRec)
               .run(viaMongoose);

  })
  .then(function(results) {
    return res.json({
      success: true,
      result: results[0].toObject()
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

  if(!form.hasOwnProperty("weight")) {
    return res.json({
      success: false,
      message: '沒有欲銷售之重量'
    });
  }

  var filters = {};
  if(form.hasOwnProperty("accountID")) {
    filters.accountID = form.accountID;
  }
  else if(form.hasOwnProperty("account_id")) {
    filters._id = form.account_id;
  }
  else {
    return res.json({
      success: false,
      message: '沒有存取存摺的關鍵資訊'
    });
  }

  var nowDate = Date.now();
  var pricePer100TKG = -1;

  //get purchase price
  purchaseList.model.find({ priceDate : { $lte: nowDate } })
  .sort({ priceDate : -1 }) //descending(nearest -> farest past)
  .limit(1)
  .select('priceDate price')
  .lean()
  .exec()
  .then(function(info) {
    if(!info) {
      return Promise.reject('沒有過去的收購資訊');
    }

    pricePer100TKG = info.price;
    pricePer100TKG = Math.abs(pricePer100TKG);

    return accountList.model.findOne(filters)
          .select("active balance")
          .exec();
      
  })
  .then(function(account) {
    if(!account)
      return Promise.reject('未找到存摺');

    if(!account.active) 
      return Promise.reject('此存摺已被結清');

    //parse weight
    var weight = 0;
    if(form.weight instanceof String)
      weight = parseFloat(form.weight);
    else
      weight = form.weight;

    weight = Math.abs(weight);

    if(isNaN(weight)) {
      return Promise.reject('重量資訊錯誤');
    }

    //kg -> tkg
    if(form.hasOwnProperty('unit')) {

      if(form.unit === 'kg') {
        weight = weight * 10 / 6.0;
      }
      else { //tkg
        weight = weight * 1;
      }

    }
    else { //default: tkg
      weight = weight * 1;
    }

    //convert to money(amount)
    var amount = (weight / 100.0) * pricePer100TKG;

    var newBalance = account.balance + amount;
    var newRec_id = mongoose.Types.ObjectId();

    var newRec = new accountRecList.model({
      _id: newRec_id,
      account: account._id,
      opType: 'deposit',
      amount: amount,
      date: nowDate,
      operator: req.user._id
    });

    newRec._req_user = req.user;
    account._req_user = req.user;

    var task = Fawn.Task();
    return task.update(account, { balance: newBalance, lastRecord: newRec_id }).options(viaSave)
               .save(newRec)
               .run(viaMongoose);
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
  if(form.hasOwnProperty("accountID")) {
    filters.accountID = form.accountID;
  }
  else if(form.hasOwnProperty("account_id")) {
    filters._id = form.account_id;
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

  var savAccount;
  var amount = 0;

  accountList.model.findOne(filters)
  .select("active balance")
  .exec()
  .then(function(account) {
    if(!account)
      return Promise.reject('未找到存摺');

    if(!account.active) 
      return Promise.reject('此存摺已被結清');
    
    //parse amount
    if(form.amount instanceof String)
      amount = parseInt(form.amount);
    else
      amount = Math.floor(form.amount);

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
    var newRec_id = mongoose.Types.ObjectId();

    var newRec = new accountRecList.model({
      _id: newRec_id,
      account: account._id,
      opType: 'withdraw',
      amount: amount,
      date: Date.now(),
      operator: req.user._id
    });

    newRec._req_user = req.user;
    account._req_user = req.user;

    var task = Fawn.Task();
    return task.update(account, { balance: newBalance, lastRecord: newRec_id }).options(viaSave)
               .save(newRec)
               .run(viaMongoose);
    
  })
  .then(function(results) {
    return res.json({
      success: true,
      result: results[0].toObject()
    });
  })
  .catch(function(err) {
    res.json({
      success: false,
      message: err.toString()
    });
  });


}