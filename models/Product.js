var keystone = require('keystone');
var Types = keystone.Field.Types;
var Constants = require(__base + 'Constants');

//console.log(Constants.ProductTypeListName);
var ProductType = new keystone.List(Constants.ProductTypeListName, {
  label: '商品類型'
});
ProductType.add({
  name: { type: String, label: '類別名', index: true, required: true, initial: true, trim: true },
  code: { type: String, label: '代號', index: true, required: true, initial: true, trim: true }
});
ProductType.defaultColumns = 'name';
ProductType.register();

//console.log(Constants.ProductListName);
var Product = new keystone.List(Constants.ProductListName, {
  label: '商品',
  track: true
});

Product.add({
  pid: { type: String, label: '商品編號', required: true, index: true, initial: true, unique: true, trim: true },
  name: { type: String, label: '商品名', required: true, index: true, initial: true, trim: true },
  pType: { type: Types.Relationship, label: '商品類型', ref: Constants.ProductTypeListName, required: true, index: true, initial: true },
  marketPrice: { type: Types.Money, label: '牌價（每包）', required: true, initial: true },
  exchangePrice: { type: Types.Money, label: '兌換價（每包）', default: this.marketPrice, initial: true },
  //discount: { type: Number, label: '折扣(0~1)', default: 1, initial: true },
  weight : { type: Number, label: '每包重(KG)', default: 0, required: true, initial: true },
  canSale: { type: Boolean, label: '上架中', default: false, initial: true },
  startSaleDate: { type: Types.Datetime, format: 'YYYY-MM-DD kk:mm:ss', label: '上架時間', initial: true }
});
Product.defaultColumns = 'name, pid, pType, marketPrice, exchangePrice, weight, canSale, startSaleDate';
Product.register();