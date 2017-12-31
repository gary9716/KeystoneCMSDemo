var keystone = require('keystone');
var Types = keystone.Field.Types;

var Transaction = new keystone.List('Transaction');
Transaction.add({
  account: { type: Types.Relationship, ref: 'Account', index: true, require: true, noedit:true },
  amount: { type: Number, require: true, noedit:true },
  date: { type: Date, require: true, noedit:true, default: Date.now },
  
});