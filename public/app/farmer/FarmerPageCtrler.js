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
                var msg = err && err.data? err.data.toString():(err? err.toString(): '');
                $rootScope.pubErrorMsg('抓取地理資訊失敗,' + msg);
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
      if(str)
        return str.replace( /\D+/g, '');
      else
        return '';
    }

    var removeSpaces = function(str) {
      if(str)
        return str.replace(/[^A-Z0-9]/ig, "");
      else
        return '';
    }

    var setTeleNum = function() {
      vm.tele1 = getPureNumStr(vm.tele1);
      vm.tele2 = getPureNumStr(vm.tele2);
    }

    vm.refreshData = function() {
      setPID();
      setAddr();
      setTeleNum();
      vm.ioAccount = removeSpaces(vm.ioAccount);
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
        addr: vm.fullAddr,
        ioAccount: vm.ioAccount
      };

      vm.isRegistering = true;
      
      $http.post('/api/farmer/register', farmerData)
      .then(function(res){
        var data = res.data;
        if(data.success) {
          console.log('register farmer success');
          $rootScope.pubSuccessMsg('註冊成功,即將返回入口頁面');
          setTimeout(function() {
            $state.go('farmer');
          }, 3000);
        }
        else {
          $rootScope.pubWarningMsg('註冊失敗,' + data.message);
        }
      })
      .catch(function(err) {
        var msg = err && err.data? err.data.toString():(err? err.toString(): '');
        $rootScope.pubErrorMsg('註冊失敗,' + msg);
      })
      .finally(function() {
        vm.isRegistering = false;
      });
    }

    var setRestOfDefaultValues = function(level) {

      if($rootScope.locals) {
        var sysParams = $rootScope.locals.sys;
        vm.citySelect = _.find(vm.cities, function(city) {
          return city._id === sysParams.cityDist.city;
        });

        vm.selectOnChange('dists',vm.citySelect._id)
          .then(function(dists) {
            
          if(level === 'city')
            return;
            
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
        
        if($state.current.name === 'farmerRegister')
          setRestOfDefaultValues();
        
      });
    }

		vm.maxCanDisplay = 50;
		
		var resetFields = function() {
			vm.farmerName = "";
			vm.pid = "";
			vm.tele = "";
			vm.citySelect = undefined;
			vm.distSelect = undefined;
			vm.villageSelect = undefined;
		}

    vm.search = function() {
      var farmerData = {
        name: vm.farmerName && vm.farmerName.length ? vm.farmerName : undefined,
        pid: vm.pid && vm.pid.length ? vm.pid : undefined,
        tele: vm.tele && vm.tele.length ? vm.tele : undefined,
        city: vm.citySelect ? vm.citySelect._id : undefined,
        dist: vm.distSelect ? vm.distSelect._id : undefined,
        village: vm.villageSelect ? vm.villageSelect._id : undefined,
        _limit: vm.maxCanDisplay
      };

      vm.isSearching = true;

      $http.post('/api/farmer/search',farmerData)
      .then(function(res) {
        var data = res.data;
        if(data.success) {
          if(!data.result || data.result.length == 0)
            $rootScope.pubInfoMsg('無任何結果,請更改條件再行搜尋');
          vm.farmers = data.result;
          vm.numTotalResult = data.total;
        }
        else {
          vm.farmers = [];
          $rootScope.pubWarningMsg(data.message);
				}
				resetFields();
      })
      .catch(function(err) {
        var msg = err && err.data? err.data.toString():(err? err.toString(): '');
        $rootScope.pubErrorMsg('搜尋失敗,' + msg);
        console.log(err);
      })
      .finally(function() {
				vm.isSearching = false;
      });

    }

}]);
