angular.module('mainApp')
.controller('RegisterCtrler', 
  ['$http', '$window', '$state', '$rootScope', '$uibModal', 'lodash','localStorageService', 'appRootPath', 'geoDataService',
  function ($http, $window, $state, $rootScope, $uibModal, _ , localStorageService, appRootPath, geoDataService) {
    var vm = this;
		vm.isSearching = false;
		vm.isEditting = true;
		vm.formDate = Date.now();
		vm.addrRest = "";

		vm.customerTypes = [
			{
				value: 1,
				name: '資金往來戶'
			},
			{
				value: 2,
				name: '農保戶'
			},
			{
				value: 3,
				name: '農業資材運用戶'
			},
			{
				value: 4,
				name: '家用雜貨使用戶'
			},
			
		];

		vm.lineGroupStates = [
			{
				value: 1,
				name: '已加入'
			},
			{
				value: 2,
				name: '已邀請'
			},
			{
				value: 3,
				name: '未邀請'
			},
		];

		vm.isCustomerLabels = [
			{
				value: true,
				name: '是'
			},
			{
				value: false,
				name: '否'
			},
		];

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

		vm.getCities = function() {
      vm.selectOnChange('cities', null)
      .then(function(data) {
        
        if($state.current.name === 'register')
          setRestOfDefaultValues();
        
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


		vm.syncData = function() {
			//search with customer name and tele1 or tele2
			$rootScope.pubSuccessMsg('註冊成功,即將返回入口頁面');
		}

		vm.refreshData = function() {
			setAddr();
		}

		vm.confirm = function() {
			vm.refreshData();
			vm.isEditting = false;
		}

		vm.revise = function() {
			vm.isEditting = true;
		}

		vm.submit = function() {

		}

		vm.selData = {};
		vm.setSelOptTxt = function(key, sel) {
			//vm.selData[key] = sel.options[sel.selectedIndex].text;
			console.log(vm.customerType);
			//console.log(vm.selData);
		}
}]);







