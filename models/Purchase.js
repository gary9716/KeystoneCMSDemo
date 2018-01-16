var keystone = require('keystone');
var Types = keystone.Field.Types;
var Constants = require(__base + 'Constants');

var Purchase = new keystone.List(Constants.PurchaseListName, {
  label: '期別',
});

Purchase.add({
  name: { type: String, label: '期別名', initial: true, trim: true },
  startDate: { type: Types.Date, format: 'YYYY-MM-DD', label: '期別開始', initial: true, index: true },
  endDate: { type: Types.Date, format: 'YYYY-MM-DD', label: '期別結束', initial: true, index: true },
  priceDate: { type: Types.Date, format: 'YYYY-MM-DD', label: '定價日期', initial: true, required: true, index: true },
  price: { type: Types.Money, label: '收購價（每百台斤）', initial: true, required: true },
});
Purchase.defaultColumns = 'name, startDate, endDate, priceDate, price';
Purchase.register();