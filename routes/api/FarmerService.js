//create farmer item
var middleware = require('../middleware');
var Constants = require(__base + 'Constants');
var keystone = require('keystone');
var _ = require('lodash');

var farmerList = keystone.list(Constants.FarmerListName);
/*
  name: { type:String, index: true, required: true, initial: true },
  pid: { type:String, index: true, unique: true, required: true, initial: true },
  birth: { type:Types.Date, initial: true },
  teleNum1: { type:String, index: true, initial: true },
  teleNum2: { type:String, index: true, initial: true },
  village: { type:Types.Relationship, ref:Constants.VillageListName, required: true, index: true, initial: true },
  addr: { type:String, initial: true },
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

//update farmer item
//read farmer item
//create account item
//read account item
//update