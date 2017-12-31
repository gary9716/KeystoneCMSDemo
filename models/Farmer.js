var keystone = require('keystone');
var Types = keystone.Field.Types;

var Farmer = new keystone.List('Farmer');
Farmer.add({
  name: { type:String, index: true, require: true, initial: true },
  residentID: { type:String, index: true, unique: true, require: true, initial: true },
  teleNum1: { type:String, index: true, initial: true },
  teleNum2: { type:String, index: true, initial: true },
  addr: { type:Types.Relationship, ref: 'Address', initial: true, index: true }
});

//Mirrored from Account to Farmer
Farmer.relationship({ ref: 'Account', refPath: 'name', path: 'farmerWithAccounts' });
Farmer.register();