var keystone = require('keystone');
var Types = keystone.Field.Types;
var Constants = require(__base + 'Constants');

var mongoose = keystone.get('mongoose');
var Schema = mongoose.Schema;

var myStorage = new keystone.Storage({
  adapter: keystone.Storage.Adapters.FS,
  fs: {
    path: (__base + 'uploads/accRecRelated/'),
  },
  schema: {
    size: true,
    mimetype: true,
    path: false,
    originalname: true,
    url: false,
  }
});

keystone.set('accRecFileStorageAdapter', myStorage.adapter);

//console.log(Constants.AccountRecordListName);
var AccountRecord = new keystone.List(Constants.AccountRecordListName, {
  label: '存摺紀錄',
  map: { name: 'opType' },
  noedit: true,
  nodelete: true,
  nocreate: true,
  track: true,
  defaultSort: '-date'
});

AccountRecord.add({
  account: { type: Types.Relationship, label: '存摺', ref: Constants.AccountListName, index: true, initial: true },
  opType: { type: Types.Select, label: '操作類別', options: [ 
    { value: 'create', label: '開戶' },
    { value: 'deposit', label: '入款' },
    { value: 'withdraw', label: '提款' },
    { value: 'unfreeze', label: '解凍' },
    { value: 'freeze', label: '凍結' },
    { value: 'transact', label: '兌領' },
    { value: 'close', label: '結清' },
    { value: 'accUserChange', label:'過戶' }
  ], index: true, required: true, trim: true, initial: true },
  amount: { type: Types.Money, label: '金額', default: 0, initial: true },
  date: { type: Types.Datetime, format: 'YYYY-MM-DD kk:mm:ss', label: '記錄時間', default: Date.now, initial: true },
  operator: { type: Types.Relationship, ref: Constants.UserListName, label: '操作者', initial: true },
  comment: { type: Types.Textarea, label: '備註', trim: true, initial: true },

  //conditional fields
  ioAccount: { type: String, label: '對口帳戶', index: true, trim: true, dependsOn: { opType: ['deposit', 'withdraw'] } },
  period: { type: Types.Relationship, ref: Constants.PeriodListName, label: '期別', index: true, trim: true, dependsOn: { opType: 'deposit' } },
  transaction: { type: Types.Relationship, label: '兌領交易', ref: Constants.TransactionListName, dependsOn: { opType: 'transact' } },
  relatedFile: {
    label: '相關檔案',
    type: Types.File,
    storage: myStorage,
    initial: true
  },
});

AccountRecord.schema.add({
  //account status after applying this record
  postAccBk: {
    type: {
      accountID: { type: String, label:'存摺編號' ,index: true, required: true, trim: true },
      farmer: { type: Schema.Types.ObjectId, label:'擁有者', ref: Constants.FarmerListName, required: true },
      accountUser: { type: String, label:'使用者', trim: true },
      active: { type: Boolean, label:'未結清', default: true, initial: true },
      freeze: { type: Boolean, label:'凍結中', default: false, initial: true },
      createdAt: { type: Types.Datetime, label: '開戶時間', required: true },
      closedAt: { type: Types.Datetime, label: '結清時間' },
      balance: { type: Types.Money, label:'餘額', default: 0 }
    }
  }
});

AccountRecord.defaultColumns = 'opType, account, date, operator, amount'; //name property(opType) should be placed at first
AccountRecord.register();