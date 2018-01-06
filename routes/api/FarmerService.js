//create farmer item
var middleware = require('../middleware');
var Constants = require(__base + 'Constants');
var keystone = require('keystone');
var _ = require('lodash');

var farmerList = keystone.list(Constants.FarmerListName);
var accountList = keystone.list(Constants.AccountListName);
/*
  name: { type:String, index: true, required: true, initial: true },
  pid: { type:String, index: true, unique: true, required: true, initial: true },
  birth: { type:Types.Date, initial: true },
  teleNum1: { type:String, index: true, initial: true },
  teleNum2: { type:String, index: true, initial: true },
  city : { type:Types.Relationship, ref:Constants.CityListName, required: true, index: true, initial: true },
  dist : { type:Types.Relationship, ref:Constants.AddrPrefixListName, required: true, index: true, initial: true },
  village: { type:Types.Relationship, ref:Constants.VillageListName, required: true, index: true, initial: true },
  addr : { type:String, initial: true },
*/

exports.register = function(req, res) {
  var form = req.body;

  for(var prop in form) {
    if(form[prop] instanceof String) {
      form[prop] = _.trim(form[prop]);
    }
  }

  if(form.pid) {
    form.pid = form.pid.toUpperCase();

    if(!middleware.checkPID(form.pid))
      return res.json({
        success: false,
        message: '身分證格式不合'
      });
  }

  if(form.teleNum1) {
    form.teleNum1 = middleware.getPureNumStr(form.teleNum1);
  }

  if(form.teleNum2) {
    form.teleNum2 = middleware.getPureNumStr(form.teleNum2);
  }

  farmerList.model
    .findOne({
      pid: form.pid
    })
    .lean()
    .exec()
    .then(function(result) {
      if(result) {
        return res.json({
          success: false,
          message: '已存在相同身分證字號的帳號'
        });
      }
      else {
        var newFarmer = new farmerList.model(form);
        newFarmer._req_user = req.user;
        newFarmer.save(function(err) {
          if(err) {
            res.json({
              success: false,
              message: err.toString()
            });
          }
          else {
            res.json({
              success: true
            });
          }
        });
      }
    })
    .catch(function(err) {
      res.json({
        success: false,
        message: err ? err.toString() : '註冊農民帳號失敗'
      });
    });


}

exports.update = function(req, res) {
  var form = req.body;

  for(var prop in form) {
    if(form[prop] instanceof String) {
      form[prop] = _.trim(form[prop]);
    }
  }

  if(form.pid) {
    form.pid = form.pid.toUpperCase();

    if(!middleware.checkPID(form.pid))
      return res.json({
        success: false,
        message: '身分證格式不合'
      });
  }

  if(form.teleNum1) {
    form.teleNum1 = middleware.getPureNumStr(form.teleNum1);
  }

  if(form.teleNum2) {
    form.teleNum2 = middleware.getPureNumStr(form.teleNum2);
  }

  farmerList.model
    .findOne({
      pid: form.pid
    })
    .exec()
    .then(function(result) {
      if(result) {
        keystone.updateItem(
          result, 
          form, 
          {
            user: req.user
          },
          function(err) {
            if(err) {
              res.json({
                success: false,
                message: err.toString()
              });
            }
            else {
              res.json({
                success: true
              });
            }
          }
        );
      }
      else {
        res.json({
          success: false,
          message: '未找到相對應的農民帳號'
        });
      }
    })
    .catch(function(err) {
      res.json({
        success: false,
        message: err ? err.toString() : '更新農民資訊失敗'
      });
    });

}

/*
      var farmerData = {
        name: vm.farmerName,
        pid: vm.pid,
        tele: vm.tele,
        city: vm.citySelect,
        dist: vm.distSelect,
        village: vm.villageSelect,
        addr: vm.farmerAddr
      };
*/

exports.search = function(req, res) {
  var form = req.body;

  for(var prop in form) {
    if(form[prop] instanceof String) {
      form[prop] = _.trim(form[prop]);
    }
  }

  console.log("search", form);

  var filters = {};
  if(form.pid && form.pid.length > 0) {
    form.pid = form.pid.toUpperCase();
    filters["pid"] = middleware.getRegExp(form.pid, 'substr');
  }

  if(form.name && form.name.length > 0) {
    filters["name"] = middleware.getRegExp(form.name, 'substr');
  }

  if(form.tele && form.tele.length > 0) {
    form.tele = middleware.getPureNumStr(form.tele);
    filters["$or"] = [
      { teleNum1: form.tele },
      { teleNum2: form.tele }
    ];
  }

  if(form.city && form.city.length > 0) {
    filters["city"] = form.city;
  }

  if(form.dist && form.dist.length > 0) {
    filters["dist"] = form.dist;
  }

  if(form.village && form.village.length > 0) {
    filters["village"] = form.village;
  }

  farmerList.model.find(filters)
    .select('name pid teleNum1 teleNum2 addr')
    .lean()
    .exec()
    .then(function(farmers) {
      res.json({
        success: true,
        result: farmers
      });
    })
    .catch(function(err) {
      res.json({
        success: false,
        message: err.toString()
      });
    });

}

exports.getAndPopulate = function(req, res) {
  var form = req.body;

  if(!form.farmerID) {
    return res.json({
      success: false,
      message: 'no farmer id'
    });
  }

  farmerList.model
    .findOne({ _id: form.farmerID})
    .select('name pid teleNum1 teleNum2 addr')
    .lean()
    .exec()
    .then(function(farmer) {
      if(farmer) {

/*

  aid: { type: String, label:'存摺編號' ,index: true, unique: true, required: true, noedit:true, initial: true },
  farmer: { type: Types.Relationship, label:'擁有者', ref: Constants.FarmerListName, index: true, required: true, noedit:true, initial: true },
  user: { type: String, label:'使用者', index: true },
  active: { type: Boolean, label:'未結清', index: true, default: true, initial: true },
  lastRecord: { type: Types.Relationship, label: '最近的操作記錄', ref: Constants.AccountRecordListName, noedit: true, required: true, initial: true }, //first record should be creating record
  createdAt: { type: Types.Datetime, label: '開戶時間', noedit: true, required: true, initial: true },
  closedAt: { type: Types.Datetime, label: '結清時間', noedit: true },
  balance: { type: Types.Money, label:'餘額', noedit: true, default: 0}

*/

        accountList.model.find({
          farmer: farmer._id
        })
        .select('aid user active lastRecord createdAt closedAt balance')
        .populate('lastRecord')
        .lean()
        .exec()
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
          return res.json({
            success: false,
            message: err.toString()
          });
        });

      }
      else {
        return res.json({
          success: false,
          message: '沒發現對應的農夫帳號'
        });
      }
    })
    .catch(function(err) {
      return res.json({
        success: false,
        message: err.toString()
      });
    });

}