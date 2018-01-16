var keystone = require('keystone');
var Types = keystone.Field.Types;
var Constants = require(__base + 'Constants');

var Period = new keystone.List(Constants.PeriodListName, {
  label: '期別',
  track: {
    createdAt: true
  },
  nodelete: true,
});

Period.add({
  name: { type: String, label:'期別名', initial: true, required: true, trim: true }
});
Period.relationship({ ref: Constants.AccountRecordListName, refPath: 'period', path: 'depositInThisPeriod' });
Period.defaultColumns = 'name';
Period.register();
