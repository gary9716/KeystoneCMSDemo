var keystone = require('keystone');

var RegulatedList = new keystone.List('RegulatedList', {
    autokey: { path: 'key', from: 'name', unique: true }
});

RegulatedList.add({
    name: { type: String, required: true, unique: true, index: true }
});

RegulatedList.defaultColumns = 'name';
RegulatedList.register();