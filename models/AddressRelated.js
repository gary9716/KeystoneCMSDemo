var keystone = require('keystone');
var Constants = require(__base + 'Constants');
var Types = keystone.Field.Types;

//console.log(Constants.VillageListName);
var Village = new keystone.List(Constants.VillageListName, {
  label: '里別', //for ex: 豐圳里
  noedit: true,
  nodelete: true,
  nocreate: true,
})
Village.add({
  name: { type: String, label: '里名', required: true, initial: true, index: true, trim: true },
  cityDist: { type: Types.Relationship, ref: Constants.AddrPrefixListName, label: '縣市鄉鎮', initial: true, index: true }
});
Village.relationship({ ref: Constants.FarmerListName, refPath: 'village', path: 'farmersInVillage' });
Village.defaultColumns = 'name';
Village.register();

var City = new keystone.List(Constants.CityListName, {
  label: '縣市',
  noedit: true,
  nodelete: true,
  nocreate: true,
});
City.add({
    name: { type: String, label: '縣市名', required: true, trim: true }
});
City.defaultColumns = 'name';
City.register();

//console.log(Constants.AddrPrefixListName);
var AddrPrefix = new keystone.List(Constants.AddrPrefixListName, {
  map: {
    name: 'dist'
  },
  label: '縣市鄉鎮郵遞區號',
  noedit: true,
  nodelete: true,
  nocreate: true,
});
AddrPrefix.add({
    city: { type: Types.Relationship, ref: Constants.CityListName, label: '直轄縣市', initial: true, index: true },
    dist: { type: String, label: '鄉鎮市區', required: true, initial: true, index: true, trim: true },
    code: { type: String, label: '郵遞區號', required: true, initial: true, trim: true }
});
AddrPrefix.relationship({ ref: Constants.FarmerListName, refPath: 'dist', path: 'farmersInArea' });
AddrPrefix.defaultColumns = 'city, dist, code';
AddrPrefix.register();
