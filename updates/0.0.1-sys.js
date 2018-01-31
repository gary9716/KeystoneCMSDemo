module.exports = function(done) {
  var keystone = require('keystone');
  var async = require('async');
  var fs = require('fs');
  var Constants = require(__base + 'Constants');
  
  var dataCollection = {};
  
  var jsonData = JSON.parse(fs.readFileSync(__base + 'initData/zipCodeAndDist.json', 'utf8'));
  
  var cityList = keystone.list(Constants.CityListName);
  var addrPrefixList = keystone.list(Constants.AddrPrefixListName);
  var villageList = keystone.list(Constants.VillageListName);
  var sysList = keystone.list(Constants.SystemListName);

  var clearChain = Promise.resolve();
  var clearPromisesFunc = [
    cityList.model.remove().exec,
    addrPrefixList.model.remove().exec,
    villageList.model.remove().exec,
    sysList.model.remove().exec
  ];

  clearPromisesFunc.forEach(function(func) {
    clearChain = clearChain.then(function() {
      return func();
    });
  })
  
  clearChain.then(function() {
    return cityList.model.bulkWrite(
      jsonData.cities.map(function(cityData) {
        return {
          insertOne: {
            document: cityData
          }
        };
      })
    );
  })
  .then(function() {
    return addrPrefixList.model.bulkWrite(
      jsonData.dists.map(function(distData) {
        return {
          insertOne: {
            document: distData
          }
        };
      })
    );
  })
  .then(function() {
    return villageList.model.bulkWrite(
      jsonData.villages.map(function(villageData){
        return {
          insertOne: {
            document: villageData
          }
        };
      })
    )
  })
  .then(function() {
    return addrPrefixList.model.findOne({
      city: "臺中市",
      dist: "大甲區"
    }).select('_id').lean().exec();
  })
  .then(function(dist) {
    var newSysData = new sysList.model({ 
      sysName: "白米兌換管理系統",
      farmName: "大甲區農會",
      farmTel: "04-26863990",
      farmAddr : "臺中市大甲區文武路10號",
      farmEmail: "tcfarm@tachia.org.tw",
      cityDist : dist._id,
      finNum: '87101',
    });

    return newSysData.save();
  })
  .then(function() {
    done();
  })
  .catch(function(err){
    done(err);
  });

};