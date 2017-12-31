var keystone = require('keystone');
var Types = keystone.Field.Types;

var AddrPrefix = new keystone.List('AddrPrefix');
AddrPrefix.add({
    city: { type: String, required: true, initial: true, index: true},
    dist: { type: String, required: true, initial: true, index: true},
    code: { type: String, required: true, initial: true}
});
AddrPrefix.relationship({ ref: 'Address', refPath: 'addrPrefix', path: 'addresses' });
AddrPrefix.register();

var Address = new keystone.List('Address');
Address.add({
    addrPrefix: { type: Types.Relationship, ref: 'AddrPrefix', required: true, initial: true, index: true },
    rest: { type: String, initial: true, required: true }
});

Address.register();