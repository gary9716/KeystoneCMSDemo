angular.module('mainApp')
.controller('FarmerPageCtrler', 
  ['myValidation', '$http', '$window', '$state', '$rootScope', 'geoDataService', 'lodash',
  function(myValidation, $http, $window, $state, $rootScope, geoDataService, _ ) {
    var vm = this;

    //for register page
    vm.birth = new Date(1980, 0 , 1);
    vm.showRegisterTable = false;
    vm.isRegistering = false;
    
    //for search page
    vm.isSearching = false;

    //common
    
    var defaultAddPrefix;
    
    vm.selectOnChange = function(targetName, selectVal) {
      if(targetName === 'dists') {
        vm.distSelect = null;
        vm.villages = null;
      }

      return geoDataService.fetch(targetName, selectVal)
              .then(function(data) {
                vm[targetName] = data;
                return data;
              })
              .catch(function(err) {
                console.log(err);
              });
    }

    var setAddr = function() {
      if(vm.hasOwnProperty("cities") && vm.hasOwnProperty("dists")
        && vm.citySelect && vm.distSelect) {
        vm.fullAddr = (vm.citySelect.name + vm.distSelect.dist + vm.addrRest); 
      }
      else {
        vm.fullAddr = '';
      }
    }

    var setPID = function() {
      if(vm.pid) {
        vm.pid = vm.pid.toUpperCase();
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
        city: vm.citySelect._id,
        dist: vm.distSelect._id,
        village: vm.villageSelect._id,
        addrRest: vm.addrRest,
        addr: vm.fullAddr
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

    var setRestOfDefaultValues = function() {

      if($rootScope.locals) {
        var sysParams = $rootScope.locals.sys;
        vm.citySelect = _.find(vm.cities, function(city) {
          return city._id === sysParams.cityDist.city;
        });

        vm.selectOnChange('dists',vm.citySelect._id)
          .then(function(dists) {
            vm.distSelect = _.find(vm.dists, function(dist) {
              return dist._id === sysParams.cityDist._id;
            });
            vm.selectOnChange('villages',vm.distSelect._id);
          }); 
      }
    
    }

    //initialization
    vm.getCities = function() {
      vm.selectOnChange('cities', null)
      .then(function(data) {
        //setRestOfDefaultValues();
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
        city: vm.citySelect ? vm.citySelect._id : undefined,
        dist: vm.distSelect ? vm.distSelect._id : undefined,
        village: vm.villageSelect ? vm.villageSelect._id : undefined
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