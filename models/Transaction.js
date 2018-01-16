var keystone = require('keystone');
var Types = keystone.Field.Types;
var Constants = require('../Constants');

var mongoose = keystone.get('mongoose');
var Schema = mongoose.Schema;

//console.log(Constants.TransactionListName);
var Transaction = new keystone.List(Constants.TransactionListName, {
  noedit: true,
  nodelete: true,
  nocreate: true
});

Transaction.add({
  date: { type: Types.Datetime, format: 'YYYY-MM-DD kk:mm:ss', label: '交易時間' },
  account: { type: Types.Relationship, ref: Constants.AccountListName, label: '存摺' },
  amount: { type: Types.Money, label: '交易金額' },
  shop: { type: Types.Relationship, ref: Constants.ShopListName, label: '兌領處' },
  trader: { type: Types.Relationship, ref: Constants.UserListName, label: '業務員' },
});

Transaction.schema.add({
  products: {
    type: [{
      pid: { type: String, label: '商品編號', required: true, unique: true, trim: true },
      name: { type: String, label: '商品名', required: true, trim: true },
      pType: { type: Schema.Types.ObjectId, label: '商品類型', ref: Constants.ProductTypeListName, required: true },
      weight : { type: Number, label: '每包重(KG)', default: 0, required: true },
      price: { type: Number, label: '最終價格(每包）', required: true },
      qty : { type: Number, label: '包數', required: true },
    }]
  }
});

Transaction.defaultColumns = 'date, account, amount, shop, trader, products';
Transaction.register();