var keystone = require('keystone');
var Constants = require(__base + 'Constants');

//console.log(Constants.RegulatedListName);
var RegulatedList = new keystone.List(Constants.RegulatedListName, {
  label: '權限管制表格'
});

RegulatedList.add({
    name: { type: String, required: true, unique: true, index: true }
});

RegulatedList.defaultColumns = 'name';
RegulatedList.register();