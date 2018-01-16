var keystone = require('keystone');
var Types = keystone.Field.Types;
var Constants = require(__base + 'Constants');

//console.log(Constants.AccountListName);
var Account = new keystone.List(Constants.AccountListName,{
  label: '存摺'
});

Account.add({
  accountID: { type: String, label:'存摺編號' ,index: true, unique: true, required: true, noedit:true, initial: true, trim: true },
  farmer: { type: Types.Relationship, label:'擁有者', ref: Constants.FarmerListName, index: true, required: true, noedit:true, initial: true },
  accountUser: { type: String, label:'使用者', index: true, trim: true },
  active: { type: Boolean, label:'未結清', index: true, default: true, initial: true },
  createdAt: { type: Types.Datetime, format: 'YYYY-MM-DD kk:mm:ss', label: '開戶時間', noedit: true, required: true, initial: true },
  closedAt: { type: Types.Datetime, format: 'YYYY-MM-DD kk:mm:ss', label: '結清時間', noedit: true },
  lastRecord: { type: Types.Relationship, label: '最後的紀錄', ref: Constants.AccountRecordListName, initial: true },
  balance: { type: Types.Money, label:'餘額', noedit: true, default: 0 }
});
Account.defaultColumns = 'accountID, farmer, accountUser, active, balance, lastRecord, createdAt, closedAt';
Account.register();