var keystone = require('keystone');
var Types = keystone.Field.Types;
var Constants = require('../Constants');

//console.log(Constants.AccountListName);
var Account = new keystone.List(Constants.AccountListName);

Account.add({
  aid: { type: String, label:'存摺編號' ,index: true, unique: true, required: true, noedit:true, initial: true },
  farmer: { type: Types.Relationship, label:'擁有者', ref: Constants.FarmerListName, index: true, required: true, noedit:true, initial: true },
  user: { type: String, label:'使用者', index: true },
  active: { type: Boolean, label:'未結清', index: true, default: true, initial: true },
  lastRecord: { type: Types.Relationship, label: '最近的操作記錄', ref: Constants.AccountRecordListName, noedit: true, required: true, initial: true }, //first record should be creating record
  createdAt: { type: Types.Datetime, label: '開戶時間', noedit: true, required: true, initial: true },
  closedAt: { type: Types.Datetime, label: '結清時間', noedit: true },
  balance: { type: Types.Money, label:'餘額', noedit: true, default: 0}

});
Account.defaultColumns = 'name, farmer, user, active, balance, lastOp';
Account.register();