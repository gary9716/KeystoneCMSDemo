var keystone = require('keystone');
var Types = keystone.Field.Types;
var Constants = require(__base + 'Constants');

//console.log(Constants.AccountRecordListName);
var AccountRecord = new keystone.List(Constants.AccountRecordListName, {
  label: '存摺紀錄',
  map: { name: 'opType' },
  noedit: true,
  nodelete: true,
  nocreate: true,
});

AccountRecord.add({
  account: { type: Types.Relationship, label: '帳戶', ref: Constants.AccountListName, index: true },
  opType: { type: Types.Select, label: '操作類別', options: [ 
    { value: 'create', label: '開戶' },
    { value: 'deposit', label: '存款' },
    { value: 'withdraw', label: '提款' },
    { value: 'transaction', label: '兌領' },
    { value: 'close', label: '結清' },
  ], index: true, required: true, trim: true },
  amount: { type: Types.Money, label: '金額', default: 0 },
  date: { type: Types.Datetime, format: 'YYYY-MM-DD kk:mm:ss', label: '記錄時間', default: Date.now },
  operator: { type: Types.Relationship, ref: Constants.UserListName, label: '操作者' },

  transaction: { type: Types.Relationship, ref: Constants.TransactionListName, dependsOn: { opType: 'transaction' } }
});
AccountRecord.defaultColumns = 'account, opType, date, operator, amount';
AccountRecord.register();