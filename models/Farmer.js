var keystone = require('keystone');
var Constants = require('../Constants');
var Types = keystone.Field.Types;

var Farmer = new keystone.List(Constants.FarmerListName);
Farmer.add({
  name: { type:String, index: true, required: true, initial: true },
  residentID: { type:String, index: true, unique: true, required: true, initial: true },
  birth: { type:Types.Date, initial: true },
  teleNum1: { type:String, index: true, initial: true },
  teleNum2: { type:String, index: true, initial: true },
  village: { type:Types.Relationship, ref:Constants.VillageListName, index: true, initial: true },
  addrPrefix: { type:Types.Relationship, ref:Constants.AddrPrefixListName, index: true, initial: true },
  addrRest: { type:String, initial: true },
});

//Mirrored from Account to Farmer
Farmer.relationship({ ref: Constants.AccountListName, refPath: 'farmer', path: 'farmerWithAccounts' });
Farmer.defaultColumns = 'name, residentID, teleNum1, teleNum2, addr';
Farmer.register();