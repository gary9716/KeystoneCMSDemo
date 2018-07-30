var keystone = require('keystone');
var Constants = require(__base + 'Constants');
var Types = keystone.Field.Types;

var Farmer = new keystone.List(Constants.FarmerListName, {
  label: '農民',
  nodelete: process.env.USER_CAN_BE_DELETED? false : true,
});

Farmer.add({
  name: { type:String, label:'姓名', index: true, required: true, initial: true, trim: true },
  pid: { type:String, label:'身分證字號', index: true, unique: true, required: true, initial: true, trim: true },
  ioAccount: { type: String, label: '預設帳戶', index: true, trim: true },
  birth: { type:Types.Date, label:'生日', format:'YYYY-MM-DD', initial: true },
  teleNum1: { type:String, label:'住家電話', index: true, initial: true, trim: true },
  teleNum2: { type:String, label:'行動電話', index: true, initial: true, trim: true },
  city : { type:Types.Relationship, label:'直轄縣市', ref:Constants.CityListName, required: true, index: true, initial: true },
  dist : { type:Types.Relationship, label:'縣市鄉鎮', ref:Constants.AddrPrefixListName, required: true, index: true, initial: true },
  village: { type:Types.Relationship, label:'里別', ref:Constants.VillageListName, required: true, index: true, initial: true },
  addrRest: { type:String, label:'路名細節', initial: true, trim: true },
  addr : { type:String, initial: true, trim: true, label:'住址' }
});

//Mirrored from Account to Farmer
Farmer.relationship({ ref: Constants.AccountListName, refPath: 'farmer', path: 'farmerWithAccounts' });
Farmer.defaultColumns = 'name, pid, village, addr, teleNum1, teleNum2';
Farmer.register();
