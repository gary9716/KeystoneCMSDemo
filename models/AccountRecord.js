var keystone = require('keystone');
var Types = keystone.Field.Types;
var Constants = require(__base + 'Constants');

var mongoose = keystone.get('mongoose');
var Schema = mongoose.Schema;

var myStorage = new keystone.Storage({
  adapter: keystone.Storage.Adapters.FS,
  fs: {
    path: (process.env.FILE_UPLOAD_PATH + 'accRecFiles'),
  },
  schema: {
    size: true,
    mimetype: true,
    path: true,
    originalname: true,
    url: false,
  }
});

keystone.set('accRecFileStorageAdapter', myStorage.adapter);

//console.log(Constants.AccountRecordListName);
var AccountRecord = new keystone.List(Constants.AccountRecordListName, {
  label: '存摺紀錄',
  map: { name: 'opType' },
  nodelete: true,
  nocreate: true,
  track: true,
  defaultSort: '-date'
});

AccountRecord.add({
  account: { type: Types.Relationship, label: '存摺', ref: Constants.AccountListName, index: true, initial: true, noedit: true },
  opType: { type: Types.Select, label: '操作類別', options: [ 
    { value: 'create', label: '開戶' },
    { value: 'deposit', label: '入款' },
    { value: 'withdraw', label: '提款' },
    { value: 'annuallyWithdraw', label:'年度結算' },
    { value: 'unfreeze', label: '解凍' },
    { value: 'freeze', label: '凍結' },
    { value: 'transact', label: '兌領' },
    { value: 'close', label: '結清' },
    { value: 'accUserChange', label:'過戶' },
  ], index: true, required: true, trim: true, initial: true, noedit: true },
  amount: { type: Types.Money, label: '金額', default: 0, initial: true, noedit: true },
  date: { type: Types.Datetime, format: 'YYYY-MM-DD kk:mm:ss', label: '記錄時間', default: Date.now, initial: true, noedit: true },
  operator: { type: Types.Relationship, ref: Constants.UserListName, label: '操作者', initial: true },
  comment: { type: Types.Textarea, label: '備註', trim: true, initial: true },

  //conditional fields
  ioAccount: { type: String, label: '對口帳戶', index: true, trim: true, dependsOn: { opType: ['deposit', 'withdraw'] } },
  period: { type: Types.Relationship, ref: Constants.PeriodListName, label: '期別', index: true, trim: true, dependsOn: { opType: 'deposit' } },
  transaction: { type: Types.Relationship, label: '兌領交易', ref: Constants.TransactionListName, index: true, dependsOn: { opType: 'transact' }, noedit: true },
  relatedFile: {
    label: '相關檔案',
    type: Types.File,
    storage: myStorage,
    initial: true
  },
});

AccountRecord.defaultColumns = 'opType, account, date, operator, amount'; //name property(opType) should be placed at first
AccountRecord.register();