/**
 * This script automatically creates a default Admin user when an
 * empty database is used for the first time. You can use this
 * technique to insert data into any List you have defined.
 *
 * Alternatively, you can export a custom function for the update:
 * module.exports = function(done) { ... }
 */
exports = module.exports = (function() {
  var keystone = require('keystone');
  var async = require('async');
  var fs = require('fs');
  var Constants = require(__base + 'Constants');
  
  var dataCollection = {};
  
  var jsonData = JSON.parse(fs.readFileSync(__base + 'initData/zipCodeAndDist.json', 'utf8'));
  
  dataCollection[Constants.CityListName] = jsonData.cities;
  dataCollection[Constants.AddrPrefixListName] = jsonData.dists;
  dataCollection[Constants.VillageListName] = jsonData.villages;

  dataCollection[Constants.SystemListName] = [
        { 
          sysName: "白米兌換管理系統",
          farmName: "大甲區農會",
          farmTel: "04-26863990",
          //farmFax: ,
          farmAddr : "臺中市大甲區文武路10號",
          farmEmail: "tcfarm@tachia.org.tw",
          cityDist : "臺中市大甲區"
        }
  ];

  return {
    create: dataCollection,
  };

})();