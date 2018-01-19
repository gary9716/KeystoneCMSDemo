var keystone = require('keystone');
var Types = keystone.Field.Types;
var Constants = require(__base + 'Constants');

var mongoose = keystone.get('mongoose');
var Schema = mongoose.Schema;

//console.log(Constants.TransactionListName);
var Transaction = new keystone.List(Constants.TransactionListName, {
  label: '兌換紀錄',
  //noedit: true,
  //nodelete: true,
  //nocreate: true,
});

var productRec = new Schema({
  pid: { type: String, label: '商品編號', trim: true },
  name: { type: String, label: '商品名', trim: true },
  pType: { type: Schema.Types.ObjectId, label: '商品類型', ref: Constants.ProductTypeListName },
  weight : { type: Number, label: '每包重(KG)', default: 0 },
  price: { type: Number, label: '最終價格(每包）' },
  qty : { type: Number, label: '包數' },
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
    type: [productRec]
  },
  accRecBk: {
    type: {
      opType: { type: String },
      comment: { type: String },
    }
  },
  postAccBk: {
    type: {
      _id: { type: Schema.Types.ObjectId, label:'存摺', ref: Constants.AccountListName, required: true },
      accountID: { type: String, label:'存摺編號' ,index: true, required: true, trim: true },
      farmer: { type: Schema.Types.ObjectId, label:'擁有者', ref: Constants.FarmerListName, required: true },
      accountUser: { type: String, label:'使用者', trim: true },
      active: { type: Boolean, label:'未結清', default: true, initial: true },
      freeze: { type: Boolean, label:'凍結中', default: false, initial: true },
      createdAt: { type: Types.Datetime, label: '開戶時間', required: true },
      closedAt: { type: Types.Datetime, label: '結清時間' },
      balance: { type: Types.Money, label:'餘額', default: 0 }
    } 
  },
});

Transaction.defaultColumns = 'date, account, amount, shop, trader';
Transaction.register();