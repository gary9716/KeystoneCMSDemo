var keystone = require('keystone');
var Types = keystone.Field.Types;
var Constants = require(__base + 'Constants');

var mongoose = keystone.get('mongoose');
var Schema = mongoose.Schema;

//console.log(Constants.TransactionListName);
var Transaction = new keystone.List(Constants.TransactionListName, {
  label: '兌換紀錄',
  nodelete: true,
  nocreate: true,
  track: true,
  defaultSort: '-date'
});

var productRec = new Schema({
  pid: { type: String, label: '商品編號', trim: true },
  name: { type: String, label: '商品名', trim: true },
  pType: { type: Schema.Types.ObjectId, label: '商品類型', ref: Constants.ProductTypeListName },
  weight : { type: Number, label: '每包重(KG)', default: 0 },
  price: { type: Number, label: '最終價格(每包）' },
  qty : { type: Number, label: '包數' },
},{ _id: false }); //disable _id

Transaction.add({
  date: { type: Types.Datetime, format: 'YYYY-MM-DD kk:mm:ss', label: '交易時間', noedit: true },
  account: { type: Types.Relationship, ref: Constants.AccountListName, label: '存摺', noedit: true },
  amount: { type: Types.Money, label: '交易金額' ,noedit: true },
  shop: { type: Types.Relationship, ref: Constants.ShopListName, label: '兌領處' },
  trader: { type: Types.Relationship, ref: Constants.UserListName, label: '業務員' },
});

Transaction.schema.add({
  products: {
    type: [productRec]
  }
});

Transaction.defaultColumns = 'date, account, amount, shop, trader';
Transaction.register();