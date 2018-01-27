var middleware = require('../middleware');
var Constants = require(__base + 'Constants');
var keystone = require('keystone');
var _ = require('lodash');
var viaSaveOpt = {viaSave: true};
var viaMongoose = {useMongoose: true};

var accountList = keystone.list(Constants.AccountListName);
var accountRecList = keystone.list(Constants.AccountRecordListName);
var productList = keystone.list(Constants.ProductListName);
var productTypeList = keystone.list(Constants.ProductTypeListName);
var transactionList = keystone.list(Constants.TransactionListName);

var mongoose = keystone.get('mongoose');
var DBRecTask = require('../DBRecTask');

var parsePrice = function(data, key) {
  var price = 0;
  if(_.isString(data[key]))
    price = parseInt(data[key]);
  else if(_.isNumber(data[key]))
    price = Math.floor(data[key]);
  else
    return {
      msg: '非有效資料'
    };

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

var parseWeight = function(data, key) {
  var weight = 0;

  if(_.isString(data[key]))
    weight = parseFloat(data[key]);
  else if(_.isNumber(data[key]))
    weight = data[key];
  else
    return {
      msg: '非有效資料'
    };

  if(isNaN(weight)) {
    return {
      msg: '單位重非數字'
    };
  }
  else if(weight <= 0) {
    return {
      msg: '單位重須超過0'
    }; 
  }
  else {
    return {
      val: weight
    };
  }
}

exports.pTypeUpsert = function(req, res) {
  var form = req.body;

  Promise.resolve()
  .then(function() {

    var data = {
      name: form.name,
      code: form.code
    };

    if(form.hasOwnProperty('_id')) { //update 

      return productTypeList.model.findOne({ _id : form._id })
        .exec()
        .then(function(pType) {
          if(pType) {
            _.assign(pType, data);
            pType._req_user = req.user;
            return pType.save();
          }
          else {
            Promise.reject('商品類型不存在,無法更新');
          }
        });

    } 
    else {

      var newPType = new productTypeList.model(data);
      newPType._req_user = req.user;
      return newPType.save();

    }
  })
  .then(function(savPType) {
    return res.json({
      success: true,
      result: savPType.toObject()
    });
  })
  .catch(function(err) {
    return res.ktSendRes(400, err.toString());
  })
}

exports.get = function(req, res) {
  var form = req.body;

  Promise.resolve()
  .then(function() {
    if(form.mode === 'saleable') { //can be sold
      return productList.model.find({
        canSale: true,
        startSaleDate: {
          $lte: Date.now()
        }
      })
      .populate('pType')
      .lean()
      .exec();
    }
    else { //all
      return productList.model.find()
      .populate('pType')
      .lean()
      .exec();
    }
  })
  .then(function(products) {
    return res.json({
      success: true,
      result: products
    });

  })
  .catch(function(err) {
    return res.ktSendRes(400, err.toString());
  });


}

//update or insert
exports.upsert = function(req, res) {
  
  var form = req.body;
  var filters = {};

  var mode = this.mode;

  if(!form.hasOwnProperty('pid')) {
    return res.ktSendRes(400, '沒有商品編號');
  }
  else if(!form.hasOwnProperty('name')) {
    return res.ktSendRes(400, '沒有商品名稱');
  }
  else if(!form.hasOwnProperty('pType')) {
    return res.ktSendRes(400, '沒有商品類型');
  }
  else if(!form.hasOwnProperty('startSaleDate')) {
    return res.ktSendRes(400, '沒有上架日期');
  }

  var data = {
      pid: form.pid,
      name: form.name,
      pType: form.pType,
      canSale: form.canSale? form.canSale:false,
      startSaleDate: form.startSaleDate
  };

  var numberInfo = parsePrice(form, "marketPrice");

  if(numberInfo) {
    if(numberInfo.hasOwnProperty('val')) {
      data.marketPrice = numberInfo.val;
    }
    else {
      return res.ktSendRes(400, numberInfo.msg? numberInfo.msg : 'null');
    }
  }

  numberInfo = parsePrice(form, "exchangePrice");

  if(numberInfo) {
    if(numberInfo.hasOwnProperty('val')) {
      data.exchangePrice = numberInfo.val;
    }
    else {
      return res.ktSendRes(400, numberInfo.msg? numberInfo.msg : 'null');
    }
  }

  numberInfo = parseWeight(form, "weight");

  if(numberInfo) {
    if(numberInfo.hasOwnProperty('val')) {
      data.weight = numberInfo.val;
    }
    else {
      return res.ktSendRes(400, numberInfo.msg? numberInfo.msg : 'null');
    }
  }

  var savProduct;

  Promise.resolve()
  .then(function() {
    if(form.hasOwnProperty('_id')) { //update
      return productList.model.findOne({ _id: form._id })
        .exec()
        .then(function(product) {
          if(!product)
            return Promise.reject('無此商品,無法更新');

          _.assign(product, data);
          product._req_user = req.user;

          return product.save();
        });
    }
    else { //create
      var newProduct = new productList.model(data);
      newProduct._req_user = req.user;
      return newProduct.save();
    }
  })
  .then(function(_savProduct) {
    return _savProduct.populate('pType').execPopulate();
  })
  .then(function(popProduct) {
    return res.json({
      success: true,
      result: popProduct.toObject()
    });
  })
  .catch(function(err) {
    return res.ktSendRes(400, err.toString());
  });

}

exports.delete = function(req, res) {
  var form = req.body;
  var filters = {};
  
  productList.model.remove({ _id: form._id })
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
    return res.ktSendRes(400, err.toString());
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


var getTotalAndProductList = function(req, res) {
  return new Promise(function(resolve, reject) {
    var form = req.body;

    //collect product info
    var productIDs = form.products.map(function(product) {
      return product._id;
    });

    var nowDate = Date.now();
    var products;
    var total = 0;
    var productDataList = []; //for saving in DB
 
    productList.model.find({ _id : { $in: productIDs } }) //get products info from db
    .lean()
    .exec()
    .then(function(_products) {
      products = _products;

      products.forEach(function(p) {
        p._id = p._id.toString();
      });

      if(products.length !== form.products.length) {
        return Promise.reject('查詢到的商品數量不合,請重新選購');
      }

      //check product state
      if(products.every(function(product) {
          return product.canSale && Date.parse(product.startSaleDate) <= nowDate
        })) {
        //check pass
        return;
      }
      else {
        return Promise.reject('有目前無法出售的商品');
      }

    })
    .then(function() {
      
      var numProducts = products.length;

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
        else if(formProduct.price === 'market') {
          price = product.marketPrice;
        }
        else { //self defined price
          if(_.isString(formProduct.price)) {
            price = parseInt(formProduct.price);
          }
          else if(_.isNumber(formProduct.price)) {
            price = Math.floor(formProduct.price);
          }
          else {
            return Promise.reject('價格資訊無效');
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

      return resolve({
        total: total,
        productDataList: productDataList 
      });

    })
    .catch(function(err) {
      reject(err);
    });

  });
}

exports.transact = function(req, res) {
  
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

  var nowDate = Date.now();
  var newRec_id = mongoose.Types.ObjectId();
  var newTrans_id = mongoose.Types.ObjectId();
  var savAccount, savTransaction;
  var total = 0;
  var oldAcc;
  
  accountList.model.findOne(filters).populate('farmer').exec()
  .then(function(account) {
    if(!account)
      return Promise.reject('存摺不存在');

    if(!account.active)
      return Promise.reject('存摺已結清');

    if(account.freeze) 
      return Promise.reject('此存摺被凍結中,無法進行此操作');

    savAccount = account;
    oldAcc = account.toObject();

    return getTotalAndProductList(req, res);
  })
  .then(function(result){
    total = result.total;

    if(savAccount.balance < total) {
      return Promise.reject('餘額不足');
    }

    newBalance = savAccount.balance - total;

    var newTransaction = new transactionList.model({
      _id: newTrans_id,
      date: nowDate,
      account: savAccount._id,
      amount: total,
      trader: req.user._id,
      products: result.productDataList,
    });
    if(req.user.shop) {
      newTransaction.shop = req.user.shop;
    }
    newTransaction._req_user = req.user;

    var newRec = new accountRecList.model({
      _id: newRec_id,
      account: savAccount._id,
      opType: 'transact',
      amount: total,
      date: nowDate,
      operator: req.user._id,
      comment: form.comment? form.comment: '',
      transaction: newTrans_id
    });
    newRec._req_user = req.user;

    savAccount.balance = newBalance;
    savAccount.lastRecord = newRec_id;
    savAccount._req_user = req.user;

    var dbRecTask = new DBRecTask('transactProduct');
    return dbRecTask.addPending(savAccount.save, accountList, oldAcc, savAccount)
                  .addPending(newTransaction.save, transactionList, null, newTransaction)
                  .addPending(newRec.save, accountRecList, null, newRec)
                  .exec();

  })
  .then(function(results) {
    return res.json({
      success: true,
      result: {
        account: results[0].toObject(),
        transaction: results[1].toObject()
      }
    });
  })
  .catch(function(err) {
    return res.ktSendRes(400, err.toString());
  });

}