var keystone = require('keystone');
var Types = keystone.Field.Types;
var Constants = require('../Constants');

//console.log(Constants.ProductTypeListName);
var ProductType = new keystone.List(Constants.ProductTypeListName, {
  label: '商品類型'
});
ProductType.add({
  name: { type: String, label: '類別名', index: true, required: true, initial: true }
});
ProductType.register();

//console.log(Constants.ProductListName);
var Product = new keystone.List(Constants.ProductListName, {
  label: '商品'
});

Product.add({
  pid: { type: String, label: '商品編號', required: true, index: true, initial: true },
  name: { type: String, label: '商品名', required: true, index: true, initial: true },
  pType: { type: Types.Relationship, label: '商品類型', ref: Constants.ProductTypeListName, required: true, index: true, initial: true },
  marketPrice: { type: Types.Money, label: '牌價', required: true, initial: true },
  exchangePrice: { type: Types.Money, label: '兌換價', default: this.marketPrice, initial: true },
  discount: { type: Number, label: '折扣(%)', default: 100, initial: true },
  inventory: { type: Number, label: '庫存(KG)', default: 0, initial: true },
  canSale: { type: Boolean, label: '上架中', default: false, initial: true },
  putOnShelfDate: { type: Types.Datetime, label: '上架時間', default: Date.now, initial: true }
});
Product.register();