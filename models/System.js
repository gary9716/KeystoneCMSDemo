var keystone = require('keystone');
var Constants = require(__base + 'Constants');
var Types = keystone.Field.Types;

var System = new keystone.List(Constants.SystemListName, {
  label: '系統參數',
  map: {
    name: 'sysName'
  }
});
System.add({
  sysName: { type:String, label: '系統名', required: true, initial: true, trim: true },
  farmName: { type:String, label: '農會名', required: true, initial: true, trim: true },
  farmTel: { type:String, label: '農會電話', initial: true, trim: true },
  farmFax: { type:String, label: '農會傳真', initial: true, trim: true },
  farmAddr : { type:String, label: '農會地址', initial: true, trim: true },
  farmEmail: { type: Types.Email, label: '農會信箱', initial: true, trim: true },
  cityDist : { type:Types.Relationship, label: '縣市鄉鎮', ref:Constants.AddrPrefixListName, initial: true },
});

System.defaultColumns = 'sysName, farmName, farmTel, farmFax, farmEmail, farmAddr';
System.register();