var keystone = require('keystone');
var Constants = require('../Constants');

//console.log(Constants.RegulatedListName);
var RegulatedList = new keystone.List(Constants.RegulatedListName, {
    hidden: true
});

RegulatedList.add({
    name: { type: String, required: true, unique: true, index: true }
});

RegulatedList.defaultColumns = 'name';
RegulatedList.register();