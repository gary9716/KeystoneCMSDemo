exports = module.exports = (function() {
  var keystone = require('keystone');
  var async = require('async');
  var fs = require('fs');
  var Constants = require(__base + 'Constants');
  
  var dataCollection = {};
  
  dataCollection[Constants.ShopListName] = [
    {
      name: '一號兌領處',
    },
    {
      name: '二號兌領處',
    }
  ];

  return {
    create: dataCollection,
  };

})();