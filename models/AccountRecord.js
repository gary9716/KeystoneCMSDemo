var keystone = require('keystone');
var Types = keystone.Field.Types;
var Constants = require('../Constants');

//console.log(Constants.AccountRecordListName);
var AccountRecord = new keystone.List(Constants.AccountRecordListName, {
  noedit: true,
  nodelete: true,
  nocreate: true
});

AccountRecord.add({
  account: { type: Types.Relationship, ref: Constants.AccountListName, index: true, required: true },
  date: { type: Types.Datetime, label: '記錄時間', required: true },
  opType: { type: Types.Select, options: [ 
    { value: 'create', label: '開戶' },
    { value: 'deposit', label: '存款' },
    { value: 'withdraw', label: '提款' },
    { value: 'transaction', label: '兌領' },
    { value: 'close', label: '結清' },
  ], index: true, required: true },
  amount: { type: Types.Money, label: '金額', default: 0 },
  operator: { type: Types.Relationship, ref: Constants.UserListName, label: '操作者', required: true },

  transaction: { type: Types.Relationship, ref: Constants.TransactionListName, dependsOn: { opType: 'transaction' } }
});

AccountRecord.register();