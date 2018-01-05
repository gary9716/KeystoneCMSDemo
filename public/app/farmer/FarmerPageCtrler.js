angular.module('mainApp')
.controller('FarmerPageCtrler', 
  ['myValidation', '$http', '$window', '$state',
  function(myValidation, $http, $window, $state) {
    var vm = this;
    vm.showRegisterTable = false;
    vm.farmerVillage = null;
    vm.farmerAddr = null;
    vm.isRegistering = false;

    var dataCache = {
      dists: {},
      villages: {}
    };

    var filterKeys = {
      dists: "city",
      villages: "cityDist"
    };

    vm.selectOnChange = function(targetName, selectVal, listName) {
      if(!selectVal)
        return;

      if(targetName === 'dists') {
        vm.villages = null;
      }

      var cache = dataCache[targetName];
      if(cache.hasOwnProperty(selectVal)) {
        vm[targetName] = cache[selectVal];
        return;
      }

      var filter = {};
      filter[filterKeys[targetName]] = selectVal;

      $http.post('/api/read',{
        listName: listName,
        filters: filter
      })
      .then(function(res) {
        var data = res.data;
        if(data.success) {
          vm[targetName] = data.result;
          cache[selectVal] = data.result;
        }
        else {
          //TODO: show on web page
          console.log(err.message);
        }
      })
      .catch(function(err) {
        //TODO: show on web page
        console.log(err);
      });
    }

    var setAddr = function() {
      if(vm.hasOwnProperty("cities") && vm.hasOwnProperty("dists")
        && vm.citySelect && vm.distSelect) {
        var cityData = vm.cities.find(function(elem) {
          return elem._id === vm.citySelect;
        });

        var distData = vm.dists.find(function(elem) {
          return elem._id === vm.distSelect;
        });

        vm.farmerAddr = (cityData.name + distData.dist + vm.addrRest); 
      }
      else {
        vm.farmerAddr = '';
      }
    }

    var setPID = function() {
      if(vm.pid) {
        vm.pid = vm.pid.toUpperCase();
      }
    }

    var setVillage = function() {
      if(vm.hasOwnProperty("villages") && vm.villageSelect) {
        vm.farmerVillage = vm.villages.find(function(elem) {
          return elem._id === vm.villageSelect;
        }).name;
      }
    }

    var getPureNumStr = function(str) {
      return str.replace( /\D+/g, '');
    }

    var setTeleNum = function() {
      vm.tele1 = getPureNumStr(vm.tele1);
      vm.tele2 = getPureNumStr(vm.tele2);
    }

    vm.refreshData = function() {
      setPID();
      setVillage();
      setAddr();
      setTeleNum();
    }


/*
  name: { type:String, index: true, required: true, initial: true },
  pid: { type:String, index: true, unique: true, required: true, initial: true },
  birth: { type:Types.Date, initial: true },
  teleNum1: { type:String, index: true, initial: true },
  teleNum2: { type:String, index: true, initial: true },
  city : { type:Types.Relationship, ref:Constants.CityListName, required: true, index: true, initial: true },
  dist : { type:Types.Relationship, ref:Constants.AddrPrefixListName, required: true, index: true, initial: true },
  village: { type:Types.Relationship, ref:Constants.VillageListName, required: true, index: true, initial: true },
  addr : { type:String, initial: true },
*/
    
    vm.registerFarmer = function() {
      var farmerData = {
        name: vm.farmerName,
        pid: vm.pid,
        teleNum1: vm.tele1,
        teleNum2: vm.tele2,
        city: vm.citySelect,
        dist: vm.distSelect,
        village: vm.villageSelect,
        addr: vm.farmerAddr
      };

      vm.isRegistering = true;
      
      $http.post('/api/farmer/register', farmerData)
      .then(function(res){
        vm.isRegistering = false;

        var data = res.data;
        if(data.success) {
          console.log('register farmer success');
          $state.go('farmer');
          //TODO: redirect to farmer index
        }
        else {
          //TODO: show on web page
          console.log(data.message);
        }
      })
      .catch(function(err) {
        vm.isRegistering = false;

        //TODO: show on web page
        console.log(err);
      });
    }

    vm.getCities = function() {
      $http.post('/api/read',{
        listName: 'City'
      })
      .then(function(res){
        var data = res.data;
        if(data.success) {
          vm.cities = data.result;
        }
        else {
          //TODO: show on web page
          console.log(err.message);
        }
      })
      .catch(function(err) {
        //TODO: show on web page
        console.log(err);
      });
    }

}]);