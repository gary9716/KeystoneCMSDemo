var keystone = require('keystone');
var Types = keystone.Field.Types;

var Account = new keystone.List('Account');
Account.add({
  name: { type: String, label:'存摺名' ,index: true, unique: true, require: true, noedit:true },
  farmer: { type: Types.Relationship, label:'擁有者', ref: 'Farmer', index: true, require: true, noedit:true },
  user: { type: String, label:'使用者', index: true },
  active: { type: Boolean, label:'未結清', index: true, default: true, initial: true },

  money: { type: Types.Money, label:'餘額', noedit: true, default: 0}

});

Account.defaultColumns = 'name, user, active, money';
Account.register();