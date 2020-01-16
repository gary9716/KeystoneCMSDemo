angular.module('mainApp')
.controller('RegisterCtrler', 
  ['$http', '$window', '$state', '$rootScope', '$uibModal', 'lodash','localStorageService', 'appRootPath', 'geoDataService',
  function ($http, $window, $state, $rootScope, $uibModal, _ , localStorageService, appRootPath, geoDataService) {
    var vm = this;
	vm.isSearching = false;
	vm.isEditting = true;
	vm.formDate = Date.now();
	vm.addrRest = "";

	vm.state = 'editting';
	vm.formStateMap = {
		editting: '可編修',
		reviewing: '呈核中',
		filed: '歸檔'
	};

	vm.sexLabels = [
		{
			value: 'male',
			name: '男性'
		},
		{
			value: 'female',
			name: '女性'
		},
		{
			value: 'none',
			name: '無'
		}
	];

	vm.customerTypes = [
		{
			value: '0',
			name: '非本會客戶'
		},
		{
			value: '1',
			name: '資金往來戶'
		},
		{
			value: '2',
			name: '農保戶'
		},
		{
			value: '3',
			name: '農業資材運用戶'
		},
		{
			value: '4',
			name: '家用雜貨使用戶'
		},
		
	];

	vm.lineGroupStates = [
		{
			value: '1',
			name: '已加入'
		},
		{
			value: '2',
			name: '已邀請'
		},
		{
			value: '3',
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

	vm.ratingList = [
		{
			value: '0',
			name: '很好'
		},
		{
			value: '1',
			name: '好'
		},
		{
			value: '2',
			name: '普通'
		},
		{
			value: '3',
			name: '差'
		},
		{
			value: '4',
			name: '很差'
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

	var findWithID = (dataArray, id) => {
		return _.find(dataArray, (elem) => {
			return elem._id === id;
		});
	}

	var findWithValue = (dataArray, val) => {
		return _.find(dataArray, (elem) => {
			return elem.value === val;
		});
	}

	var extractData = function(data) {
		data.tele1 = data.teleNum1;
		data.tele2 = data.teleNum2;
		data.customerName = data.name;

		vm.citySelect = findWithID(vm.cities, data.city);
		vm.selectOnChange('dists',vm.citySelect._id)
		.then(function(dists) {
			vm.distSelect = _.find(dists, function(dist) {
				return dist._id === data.dist;
			});
			return vm.selectOnChange('villages',vm.distSelect._id);
		})
		.then(function(villages) {
			vm.villageSelect = findWithID(villages, data.village);
		});

		data.isCustomer = findWithValue(vm.isCustomerLabels, data.isCustomer);
		data.lineGroup = findWithValue(vm.lineGroupStates, data.lineGroup);
		data.customerType = findWithValue(vm.customerTypes, data.customerType);
		data.sex = findWithValue(vm.sexLabels, data.sex);
		data.evaluation = findWithValue(vm.ratingList, data.rating);

		_.assign(vm, data);
	};

	vm.syncData = function() {
		if(vm.isSearching) return;
		vm.isSearching = true;

		//search with customer name and tele1 or tele2
		let customerData = {
			customerName: vm.customerName,
			tele1: vm.tele1,
			tele2: vm.tele2
		};

		$http.post('/api/customer-survey/sync', customerData)
		.then((res) => {
			var data = res.data;
				if(data.success) {
					$rootScope.pubSuccessMsg('同步成功');
					extractData(data.result);
				}
				else {
					$rootScope.pubWarningMsg('沒找到');
				}
		})
		.catch((err) => {
			var msg = err && err.data? err.data.toString():(err? err.toString(): '');
       		$rootScope.pubErrorMsg('同步失敗,' + msg);
		})
		.finally(() => {
			vm.isSearching = false;
		});
		
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
		let customerData = {
			formDate: vm.formDate,
			customerName: vm.customerName,
			age: vm.age,
			job: vm.job,
			bank: vm.bank,
			finance: vm.finance,
			interviewer: vm.interviewer,
			
			tele1: vm.tele1,
			tele2: vm.tele2,
			
			addr: vm.fullAddr,
			addrRest: vm.addrRest,
			city: vm.citySelect._id,
			dist: vm.distSelect._id,
			village: vm.villageSelect._id,

			need: vm.need,
			comment: vm.comment
		};
		if(vm.sex) customerData['sex'] = vm.sex.value;
		if(vm.isCustomer) customerData['isCustomer'] = vm.isCustomer.value;
		if(vm.lineGroup) customerData['lineGroup'] = vm.lineGroup.value;
		if(vm.customerType) customerData['customerType'] = vm.customerType.value;
		if(vm.evaluation) customerData['rating'] = vm.evaluation.value;

		$http.post('/api/customer-survey/upsert', customerData)
		.then((res) => {
			let data = res.data;
			if(data.success) {
				$rootScope.pubSuccessMsg('更新成功');
			}
			else {
				$rootScope.pubErrorMsg('更新失敗');
			}
		})
		.catch((err) => {
			var msg = err && err.data? err.data.toString():(err? err.toString(): '');
			$rootScope.pubErrorMsg('更新或上傳失敗,' + msg);
		});
	}

}]);
