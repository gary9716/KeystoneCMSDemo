exports = module.exports = (function() {
  var keystone = require('keystone');
  var async = require('async');
  var fs = require('fs');
  var Constants = require(__base + 'Constants');
  
  var dataCollection = {};
  
  dataCollection[Constants.ProductTypeListName] = [
    {
      name: '蓬萊米',
      code: 'A',
    },
    {
      name: '在來米',
      code: 'B',
    }
  ];

  return {
    create: dataCollection,
  };

})();