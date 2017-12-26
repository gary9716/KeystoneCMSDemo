var keystone = require('keystone');

var Role = new keystone.List('Role', {
    label: '角色名',
    autokey: { path: 'key', from: 'name', unique: true },
    track: true
});

Role.add({
    name: { type: String, required: true, unique: true, index: true }
});

// Relationship definitions are optional
Role.relationship({ ref: 'User', refPath: 'roles', path: 'usersWithRole' });
Role.relationship({ ref: 'Permission', refPath: 'create', path: 'createsWithRole' });
Role.relationship({ ref: 'Permission', refPath: 'read', path: 'readsWithRole' });
Role.relationship({ ref: 'Permission', refPath: 'update', path: 'updatesWithRole' });
Role.relationship({ ref: 'Permission', refPath: 'delete', path: 'deletesWithRole' });

Role.defaultColumns = 'name';
Role.register();