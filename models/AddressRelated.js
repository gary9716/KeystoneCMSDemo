var keystone = require('keystone');
var Constants = require('../Constants');
var Types = keystone.Field.Types;

//console.log(Constants.VillageListName);
var Village = new keystone.List(Constants.VillageListName, {
  label: '里別' //for ex: 豐圳里
})
Village.add({
  name: { type: String, label: '里名', required: true, initial: true, index: true, trim: true },
  cityDist: { type: Types.Relationship, ref: Constants.AddrPrefixListName, label: '縣市鄉鎮', initial: true, index: true }
});
Village.relationship({ ref: Constants.FarmerListName, refPath: 'village', path: 'farmersInVillage' });
Village.defaultColumns = 'name';
Village.register();

var City = new keystone.List(Constants.CityListName);
City.add({
    name: { type: String, label: '縣市名', required: true, trim: true }
});
City.defaultColumns = 'name';
City.register();

//console.log(Constants.AddrPrefixListName);
var AddrPrefix = new keystone.List(Constants.AddrPrefixListName, {
  map: {
    name: 'dist'
  }
});
AddrPrefix.add({
    city: { type: Types.Relationship, ref: Constants.CityListName, label: '直轄縣市', initial: true, index: true },
    dist: { type: String, label: '鄉鎮市區', required: true, initial: true, index: true, trim: true },
    code: { type: String, label: '郵遞區號', required: true, initial: true, trim: true }
});
AddrPrefix.relationship({ ref: Constants.FarmerListName, refPath: 'addrPrefix', path: 'farmersInArea' });
AddrPrefix.defaultColumns = 'city, dist, code';
AddrPrefix.register();
