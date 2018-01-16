var middleware = require('../middleware');
var Constants = require(__base + 'Constants');
var keystone = require('keystone');
var _ = require('lodash');
var mongoose = keystone.get('mongoose');
var Fawn = require('fawn');
var viaSaveOpt = {viaSave: true};
var viaMongoose = {useMongoose: true};

var accountList = keystone.list(Constants.AccountListName);
var accountRecList = keystone.list(Constants.AccountRecordListName);
var productList = keystone.list(Constants.ProductListName);
var transactionList = keystone.list(Constants.TransactionListName);

var parsePrice = function(data, key) {
  if(data.hasOwnProperty(key)) {
    var price = 0;
    if(data[key] instanceof String)
      price = parseInt(data[key]);
    else 
      price = data[key];

    if(isNaN(price))
      return {
        msg: '價格非數字'
      };
    else if(price < 0) 
      return {
        msg: '價格小於0'
      };
    else
      return {
        val: price
      };

  }
  else {
    return null;
  }
}

var parseDiscount = function(data, key) {
  if(data.hasOwnProperty(key)) {
    var discount = 1;
    if(data[key] instanceof String)
      discount = parseFloat(data[key]);
    else 
      discount = data[key];

    if(isNaN(discount)) {
      return {
        msg: '折扣非數字'
      };
    }
    else if(discount <= 0 || discount > 1) {
      return {
        msg: '折扣須介於0與1'
      }; 
    }
    else {
      return {
        val: discount
      };
    }

  }
  else {
    return null;
  }
}

var parseWeight = function(data, key) {
  if(data.hasOwnProperty(key)) {
    var weight = 0;
    if(data[key] instanceof String)
      weight = parseFloat(data[key]);
    else 
      weight = data[key];

    if(isNaN(weight)) {
      return {
        msg: '單位重非數字'
      };
    }
    else if(weight >= 0) {
      return {
        msg: '單位重須大於0'
      }; 
    }
    else {
      return {
        val: weight
      };
    }

  }
  else {
    return null;
  }
}

exports.create = function(req, res) {
  var form = req.body;

  if(!form.hasOwnProperty("pid") || 
    !form.hasOwnProperty("name") ||
    !form.hasOwnProperty("pType")) {

    return res.json({
      success: false,
      message: '商品資訊不足'
    });

  }
  
  data = {
    pid: form.pid,
    name: form.name,
    pType: form.pType
  };

  var numberInfo = parsePrice(form, "marketPrice");
  if(numberInfo) {
    if(numberInfo.val) {
      data.marketPrice = numberInfo.val;
    }
    else {
      return res.json({
        success: false,
        message: numberInfo.msg        
      });
    }
  }

  numberInfo = parsePrice(form, "exchangePrice");
  if(numberInfo) {
    if(numberInfo.val) {
      data.exchangePrice = numberInfo.val;
    }
    else {
      return res.json({
        success: false,
        message: numberInfo.msg        
      });
    }
  }

  numberInfo = parseDiscount(form, "discount");
  if(numberInfo) {
    if(numberInfo.val) {
      data.discount = numberInfo.val;
    }
    else {
      return res.json({
        success: false,
        message: numberInfo.msg
      });
    }
  }

  numberInfo = parseWeight(form, "weight");
  if(numberInfo) {
    if(numberInfo.val) {
      data.weight = numberInfo.val;
    }
    else {
      return res.json({
        success: false,
        message: numberInfo.msg
      });
    }
  }

  if(form.hasOwnProperty("canSale")) {
    data.canSale = form.canSale;
  }

  if(form.hasOwnProperty("startSaleDate")) {
    data.startSaleDate = form.startSaleDate;
  }

  var newProduct = new productList.model(data);
  newProduct._req_user = req.user;
  newProduct.save()
  .then(function(savProduct) {
    return res.json({
      success: true,
      result: savProduct.toObject()
    });
  })
  .catch(function(err) {
    return res.json({
      success: false,
      message: err.toString()
    });
  });

}

exports.update = function(req, res) {
  
  var form = req.body;
  var filters = {};

  if(form.hasOwnProperty('product_id')) {
    filters._id = form.product_id;
  }
  else if(form.hasOwnProperty('pid')) {
    filters.pid = form.pid;
  }
  else {
    return res.json({
      success: false,
      message: '商品資訊不足'
    });
  }

  productList.model.findOne(filters)
  .exec()
  .then(function(product) {
    if(!product)
      return Promise.reject('無此商品');

    if(form.hasOwnProperty("pid")) {
      product.pid = form.pid;
    }

    if(form.hasOwnProperty("name")) {
      product.name = form.name;
    }

    if(form.hasOwnProperty("pType")) {
      product.pType = form.pType;
    }

    var numberInfo = parsePrice(form, "marketPrice");
    if(numberInfo) {
      if(numberInfo.val) {
        product.marketPrice = numberInfo.val;
      }
      else {
        return Promise.reject(numberInfo.msg);
      }
    }

    numberInfo = parsePrice(form, "exchangePrice");
    if(numberInfo) {
      if(numberInfo.val) {
        product.exchangePrice = numberInfo.val;
      }
      else {
        return Promise.reject(numberInfo.msg);
      }
    }

    numberInfo = parseDiscount(form, "discount");
    if(numberInfo) {
      if(numberInfo.val) {
        product.discount = numberInfo.val;
      }
      else {
        return Promise.reject(numberInfo.msg);
      }
    }

    numberInfo = parseWeight(form, "weight");
    if(numberInfo) {
      if(numberInfo.val) {
        product.weight = numberInfo.val;
      }
      else {
        return Promise.reject(numberInfo.msg);
      }
    }

    if(form.hasOwnProperty("canSale")) {
      product.canSale = form.canSale;
    }

    if(form.hasOwnProperty("startSaleDate")) {
      product.startSaleDate = form.startSaleDate;
    }

    return product.save();

  })
  .then(function(savProduct) {

    return res.json({
      success: true,
      result: savProduct.toObject()
    });

  })
  .catch(function(err) {

    return res.json({
      success: false,
      message: err.toString()
    });

  });

}

exports.delete = function(req, res) {
  var form = req.body;
  var filters = {};
  if(form.hasOwnProperty('product_id')) {
    filters._id = form.product_id;
  }
  else if(form.hasOwnProperty('pid')) {
    filters.pid = form.pid;
  }
  else {
    return res.json({
      success: false,
      message: '商品資訊不足'
    });
  }
  
  productList.model.deleteOne(filters)
  .exec()
  .then(function(delProduct) {
    if(!delProduct)
      return Promise.reject('無此商品');
    else
      return res.json({
        success: true
      });
  })
  .catch(function(err) {
    return res.json({
      success: false,
      message: err.toString()
    });
  });

}

/*
  input:
  {
    account_id: _id, || accountID: accountID
    products: [{_id, price, qty}] 
  }

  return: 
  {
    account:
    transaction:
  }
  */

exports.transact = function(req, res) {
  
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

  //collect product info
  var productIDs = form.products.map(function(product) {
    return product._id;
  });

  var products;
  var nowDate = Date.now();

  productList.model.find({ _id : { $in: productIDs } }) //get products info from db
  .lean()
  .exec()
  .then(function(_products) {
    products = _products;

    if(products.length !== form.products.length) {
      return Promise.reject('查詢到的商品數量不合,請重新選購');
    }

    //check product state
    if(products.every(function(product) {
        return product.canSale && product.startSaleDate.getTime() < nowDate.getTime()
      })) {

      //check pass
      return accountList.model.findOne(filters)
            .select("_id freeze active balance")
            .exec();
    }
    else {
      return Promise.reject('有目前無法出售的商品');
    }

  })
  .then(function(account) {
    if(!account)
      return Promise.reject('存摺不存在');

    if(account.freeze) 
      return Promise.reject('此存摺被凍結中,無法進行此操作');

    if(!account.active)
      return Promise.reject('存摺已結清');

    var numProducts = products.length;

    var productDataList = []; //for saving in DB
    var total = 0;

    for (let i = 0; i < numProducts; i++) {
      let formProduct = form.products[i];
      let product = _.find(products, function(p) {
        return p._id === formProduct._id; 
      });

      if(!product)
        return Promise.reject('購物車商品資訊錯誤,請重新選購');

      var price = 0;
      if(formProduct.price === 'exchange') {
        price = product.exchangePrice;
      }
      else if(formProduct.price === 'discount') {
        price = Math.round(product.marketPrice * product.discount);
      }
      else if(formProduct.price === 'market') {
        price = product.marketPrice;
      }
      else { //self defined price
        if(formProduct.price instanceof String) {
          price = parseInt(formProduct.price);
        }
        else {
          price = Math.floor(formProduct.price);
        }
      }

      price = Math.abs(price); //每包價格

      if(isNaN(price)) {
        return Promise.reject('價格資訊錯誤');
      }

      let qty = Math.abs(Math.floor(formProduct.qty));

      if(qty === 0) {
        return Promise.reject('商品數量不得為0');
      }

      //總價 += 每包價格*幾包
      total += (price * qty);

      productDataList.push({
        pid: product.pid,
        name: product.name,
        pType: product.pType,
        weight: product.weight,
        price: price,
        qty: qty
      });
    }

    if(account.balance < total) {
      return Promise.reject('餘額不足');
    }

    var newBalance = account.balance - total;

    var newRec_id = mongoose.Types.ObjectId();
    var newTransact_id = mongoose.Types.ObjectId();

    var newRec = new accountRecList.model({
      _id: newRec_id,
      account: account._id,
      opType: 'transact',
      amount: total,
      date: nowDate,
      operator: req.user._id,
      comment: form.comment? form.comment: '',
      transaction: newTransact_id
    });

    var newTransaction = new transactionList.model({
      _id: newTransact_id,
      date: nowDate,
      account: account._id,
      amount: total,
      shop: req.user.shop,
      trader: req.user._id,
      products: productDataList
    });

    var task = Fawn.Task();
    return task.update(account, { balance: newBalance, lastRecord: newRec_id }).options(viaSave)
               .save(newTransaction)
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
    return res.json({
      success: false,
      message: err.toString()
    });
  });

}
