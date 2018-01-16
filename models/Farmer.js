var keystone = require('keystone');
var Constants = require('../Constants');
var Types = keystone.Field.Types;

var Farmer = new keystone.List(Constants.FarmerListName);
Farmer.add({
  name: { type:String, index: true, required: true, initial: true, trim: true },
  pid: { type:String, index: true, unique: true, required: true, initial: true, trim: true },
  birth: { type:Types.Date, format:'YYYY-MM-DD', initial: true },
  teleNum1: { type:String, index: true, initial: true, trim: true },
  teleNum2: { type:String, index: true, initial: true, trim: true },
  city : { type:Types.Relationship, ref:Constants.CityListName, required: true, index: true, initial: true },
  dist : { type:Types.Relationship, ref:Constants.AddrPrefixListName, required: true, index: true, initial: true },
  village: { type:Types.Relationship, ref:Constants.VillageListName, required: true, index: true, initial: true },
  addr : { type:String, initial: true, trim: true },
});

//Mirrored from Account to Farmer
Farmer.relationship({ ref: Constants.AccountListName, refPath: 'farmer', path: 'farmerWithAccounts' });
Farmer.defaultColumns = 'name, pid, village, addr, teleNum1, teleNum2';
Farmer.register();