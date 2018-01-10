var keystone = require('keystone');
var Types = keystone.Field.Types;
var _ = require('underscore');
var Constants = require('../Constants');

//console.log(Constants.PermissionListName);
var Permission = new keystone.List(Constants.PermissionListName);

Permission.add({
    name: { type: String, required: true, index: true, trim: true },
    listName: { type: Types.Relationship, ref: Constants.RegulatedListName, unique: true, required: true, initial: true, index: true },
    create: { type: Types.Relationship, ref: Constants.RoleListName, many: true, initial: true, index: true },
    read: { type: Types.Relationship, ref: Constants.RoleListName, many: true, initial: true, index: true},
    update: { type: Types.Relationship, ref: Constants.RoleListName, many: true, initial: true, index: true },
    delete: { type: Types.Relationship, ref: Constants.RoleListName, many: true, initial: true, index: true }
});

Permission.defaultColumns = 'name, create, read, update, delete';
Permission.register();
