var keystone = require('keystone');
var Constants = require(__base + 'Constants');

//console.log(Constants.RoleListName);
var Role = new keystone.List(Constants.RoleListName, {
    label: '非系統管理者角色',
});

Role.add({
    name: { type: String, required: true, unique: true, index: true, trim: true }
});

// Relationship definitions are optional
Role.relationship({ ref: Constants.UserListName, refPath: 'roles', path: 'usersWithRole' });
Role.relationship({ ref: Constants.PermissionListName, refPath: 'create', path: 'createsWithRole' });
Role.relationship({ ref: Constants.PermissionListName, refPath: 'read', path: 'readsWithRole' });
Role.relationship({ ref: Constants.PermissionListName, refPath: 'update', path: 'updatesWithRole' });
Role.relationship({ ref: Constants.PermissionListName, refPath: 'delete', path: 'deletesWithRole' });

Role.defaultColumns = 'name';
Role.register();