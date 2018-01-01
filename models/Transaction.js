var keystone = require('keystone');
var Types = keystone.Field.Types;
var Constants = require('../Constants');

//console.log(Constants.TransactionListName);
var Transaction = new keystone.List(Constants.TransactionListName, {
  noedit: true,
  nodelete: true,
  nocreate: true
});

Transaction.add({
  date: { type: Types.Datetime, label: '交易時間', require: true },
  account: { type: Types.Relationship, ref: Constants.AccountListName, label: '存摺', require: true },
  amount: { type: Types.Money, label: '交易金額', require: true },
  shop: { type: Types.Relationship, ref: Constants.ShopListName, label: '兌領處', require: true },
  trader: { type: Types.Relationship, ref: Constants.UserListName, label: '業務員', require: true },
  products: { type: Types.TextArray, label: '商品明細', require: true },
});

Transaction.register();