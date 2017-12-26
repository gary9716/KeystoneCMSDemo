var keystone = require('keystone');
var Types = keystone.Field.Types;
var _ = require('underscore');

var Permission = new keystone.List('Permission', {
    autokey: { path: 'key', from: 'name', unique: true },
    track: true
});

Permission.add({
    name: { type: String, required: true, index: true },
    listName: { type: Types.Relationship, ref: 'RegulatedList', unique: true, required: true, initial: true, index: true },
    create: { type: Types.Relationship, ref: 'Role', many: true, initial: true, index: true },
    read: { type: Types.Relationship, ref: 'Role', many: true, initial: true, index: true},
    update: { type: Types.Relationship, ref: 'Role', many: true, initial: true, index: true },
    delete: { type: Types.Relationship, ref: 'Role', many: true, initial: true, index: true }
});

Permission.defaultColumns = 'name, create, read, update, delete';
Permission.register();
