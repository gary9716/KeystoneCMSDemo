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
  date: { type: Types.Datetime, label: '交易時間', required: true },
  account: { type: Types.Relationship, ref: Constants.AccountListName, label: '存摺', required: true },
  amount: { type: Types.Money, label: '交易金額', required: true },
  shop: { type: Types.Relationship, ref: Constants.ShopListName, label: '兌領處', required: true },
  trader: { type: Types.Relationship, ref: Constants.UserListName, label: '業務員', required: true },
  products: { type: Types.TextArray, label: '商品明細', required: true },
});

Transaction.register();