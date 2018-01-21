//create farmer item
var middleware = require('../middleware');
var Constants = require(__base + 'Constants');
var keystone = require('keystone');
var _ = require('lodash');

var farmerList = keystone.list(Constants.FarmerListName);
var accountList = keystone.list(Constants.AccountListName);

exports.upsert = function(req, res) {
  var form = req.body;
  var mode = this.mode;

  if(!form.hasOwnProperty("pid")) {
    return res.ktSendRes(400, '沒有身分證字號');
  }
  else {
    form.pid = form.pid.toUpperCase();

    if(!middleware.checkPID(form.pid))
      return res.ktSendRes(400, '身分證格式不合');
  }

  if(form.hasOwnProperty("teleNum1")) {
    form.teleNum1 = middleware.getPureNumStr(form.teleNum1);
  }

  if(form.hasOwnProperty("teleNum2")) {
    form.teleNum2 = middleware.getPureNumStr(form.teleNum2);
  }

  var data = {
    name: form.name ? form.name:'',
    pid: form.pid,
    birth: form.birth ? form.birth:'',
    teleNum1: form.teleNum1 ? form.teleNum1:'',
    teleNum2: form.teleNum2 ? form.teleNum2:'',
    city: form.city ? form.city:'',
    dist: form.dist ? form.dist:'',
    village: form.village ? form.village:'',
    addr: form.addr ? form.addr:'',
    addrRest: form.addrRest ? form.addrRest: ''
  };

  Promise.resolve()
  .then(function() {
    var getUpdateQuery = function() {
      return farmerList.model
        .findOne({
          _id: form._id
        })
        .select('_id')
        .exec()
        .then(function(farmer) {
          if(farmer) {
            _.assign(farmer, data);
            farmer._req_user = req.user;
            return farmer.save();
          }
          else {
            return Promise.reject('找不到該農夫,無法更新');
          }
        });
    }

    var getCreateQuery = function() {
      return farmerList.model
        .findOne({
          pid: form.pid
        })
        .lean()
        .select('_id')
        .exec()
        .then(function(farmer) {
          if(farmer) {
            return Promise.reject('已存在相同身分證字號的帳號');
          }
          else {
            var newFarmer = new farmerList.model(data);
            newFarmer._req_user = req.user;
            return newFarmer.save();
          }
        });
    }

    if(mode) {
      if(mode === 'create') {
        return getCreateQuery();
      }
      else { //update
        return getUpdateQuery();
      }
    }
    else {
      if(form.hasOwnProperty('_id')) { //update
        return getUpdateQuery();
      }
      else { //create
        return getCreateQuery();
      }
    }

  })
  .then(function(savFarmer) {
    if(form._populate) {
      if(form._populate instanceof Array)
        return savFarmer.populate(form._populate.join(' ')).execPopulate();
      else
        return savFarmer.populate(form._populate).execPopulate();
    }
    else 
      return savFarmer;
  })
  .then(function(savFarmer) {
    return res.json({
      success: true,
      result: savFarmer.toObject()
    });
  })
  .catch(function(err) {
    res.myErrInfo = err.toString();
    return res.ktSendRes(400, err.toString());
  });

}

exports.search = function(req, res) {
  var form = req.body;

  if(!_.values(form).some(x => x !== undefined))
    return res.ktSendRes(400, '條件未指定');
    
  var filters = {};
  if(form.hasOwnProperty("pid")) {
    form.pid = form.pid.toUpperCase();
    filters["pid"] = middleware.getRegExp(form.pid, 'substr');
  }

  if(form.hasOwnProperty("name")) {
    filters["name"] = middleware.getRegExp(form.name, 'substr');
  }

  if(form.hasOwnProperty("tele")) {
    form.tele = middleware.getPureNumStr(form.tele, 'substr');
    filters["$or"] = [
      { teleNum1: form.tele },
      { teleNum2: form.tele }
    ];
  }

  if(form.hasOwnProperty("city")) {
    filters["city"] = form.city;
  }

  if(form.hasOwnProperty("dist")) {
    filters["dist"] = form.dist;
  }

  if(form.hasOwnProperty("village")) {
    filters["village"] = form.village;
  }
  if(form.hasOwnProperty("_limit")) {
    farmerList.paginate({
        page: 1,
        perPage: form._limit,
        filters: filters
      })
      .select('name pid teleNum1 teleNum2 addr')
      .lean()
      .exec(function(err, data) {

        if(err) {
          return res.ktSendRes(400, err.toString());
        }
        else {
          return res.json({
            success: true,
            result: data.results,
            total: data.total
          });
        }

      });
      
  }
  else {
    farmerList.model.find(filters)
      .select('name pid teleNum1 teleNum2 addr')
      .lean()
      .limit(100)
      .exec(function(err, data) {

        if(err) {
          res.json({
            success: false,
            message: err.toString()
          });
        }
        else {
          res.json({
            success: true,
            result: data
          });
        }

      });
  }
  

}

exports.getAndPopulate = function(req, res) {
  var form = req.body;
  var farmer;
  
  var query = farmerList.model.findOne({ pid: form.farmerPID })
  
  if(form._populate) {
    if(form._populate instanceof Array)
      query = query.populate(form._populate.join(' '))
    else
      query = query.populate(form._populate)
  }
  
  query.lean()
    .exec()
    .then(function(_farmer) {
      if(!_farmer) {
        return Promise.reject('未找到相對應的農民帳號');
      }

      farmer = _farmer;
      
      return accountList.model
        .find({
          farmer: _farmer._id
        })
        .populate('lastRecord')
        .lean()
        .exec();
    })
    .then(function(accounts) {
      var result = {};
      result.farmer = farmer;
      result.accounts = null;

      if(accounts) {
        result.accounts = accounts;
      }
      else {
        console.log('no accounts found for ',farmer.name);
      }

      return res.json({
        success: true,
        result: result
      });
    })
    .catch(function(err) {
      return res.ktSendRes(400, err.toString());
    });

}