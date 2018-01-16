angular.module('mainApp')
.controller('FarmerPageCtrler', 
  ['myValidation', '$http', '$window', '$state', '$rootScope',
  function(myValidation, $http, $window, $state, $rootScope) {
    var vm = this;
    vm.showRegisterTable = false;
    vm.isRegistering = false;
    vm.isSearching = false;
    vm.birth = new Date(1980, 0 , 1);
    
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

    vm.registerFarmer = function() {
      var farmerData = {
        name: vm.farmerName,
        pid: vm.pid,
        birth: vm.birth,
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
        var data = res.data;
        if(data.success) {
          console.log('register farmer success');
          $rootScope.pubSuccessMsg('註冊成功');
          $state.go('farmer');
        }
        else {
          $rootScope.pubWarningMsg(data.message);
        }
      })
      .catch(function(err) {
        $rootScope.pubErrorMsg('系統似乎出現一些錯誤');
        console.log(err);
      })
      .finally(function() {
        vm.isRegistering = false;
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
          $rootScope.pubWarningMsg(data.message);
        }
      })
      .catch(function(err) {
        $rootScope.pubErrorMsg('系統似乎出現一些錯誤');
        console.log(err);
      });
    }

    vm.search = function() {
      var farmerData = {
        name: vm.farmerName && vm.farmerName.length ? vm.farmerName : undefined,
        pid: vm.pid && vm.pid.length ? vm.pid : undefined,
        tele: vm.tele && vm.tele.length ? vm.tele : undefined,
        city: vm.citySelect && vm.citySelect.length ? vm.citySelect : undefined,
        dist: vm.distSelect && vm.distSelect.length ? vm.distSelect : undefined,
        village: vm.villageSelect && vm.villageSelect.length ? vm.villageSelect : undefined
      };

      vm.isSearching = true;

      $http.post('/api/farmer/search',farmerData)
      .then(function(res) {
        var data = res.data;
        if(data.success) {
          if(!data.result || data.result.length == 0)
            $rootScope.pubInfoMsg('無任何結果');
          vm.farmers = data.result;
        }
        else {
          vm.farmers = [];
          $rootScope.pubWarningMsg(data.message);
        }
      })
      .catch(function(err) {
        $rootScope.pubErrorMsg('系統似乎出現一些錯誤');
        console.log(err);
      })
      .finally(function() {
        vm.isSearching = false;
      });

    }

}]);