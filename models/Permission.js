var keystone = require('keystone');
var Types = keystone.Field.Types;
var Constants = require(__base + 'Constants');

//console.log(Constants.PermissionListName);
var Permission = new keystone.List(Constants.PermissionListName, {
  label: '權限'
});

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
