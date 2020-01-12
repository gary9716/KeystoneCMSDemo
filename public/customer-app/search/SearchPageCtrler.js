angular.module('mainApp')
.controller('SearchPageCtrler', 
  ['$http', '$window', '$state', '$rootScope', '$uibModal', 'lodash','localStorageService', 'appRootPath',
  function ($http, $window, $state, $rootScope, $uibModal, _ , localStorageService, appRootPath) {
	var vm = this;
	vm.curPage = 1;
	vm.perPage = 10;
	vm.numPages = 5;
	vm.isSearching = false;

	vm.stateLabels = [
		{
			value: 'editting',
			name: '可編修'
		},
		{
			value: 'reviewing',
			name: '呈核中'
		},
		{
			value: 'filed',
			name: '歸檔'
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

	vm.sexLabels = [
		{
			value: 'male',
			name: '男'
		},
		{
			value: 'female',
			name: '女'
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

	vm.findWithValue = (dataArray, val) => {
		return _.find(dataArray, (elem) => {
			return elem.value === val;
		});
	};

	vm.search = () => {
		if(vm.isSearching) return;
		vm.isSearching = true;
		vm.totalCustomers = null;

		let filter = {};
		if (vm.useFormState && vm.state) {
			filter.state = vm.state.value;
		}
		if(vm.useStartDate && vm.startDate) {
			filter.startDate = vm.startDate;
		}
		if(vm.useEndDate && vm.endDate) {
			filter.endDate = vm.endDate;
		}
		if(vm.useIsCustomer && vm.isCustomer) {
			filter.isCustomer = vm.isCustomer.value;
		}
		if(vm.useCustomerType && vm.customerType) {
			filter.customerType = vm.customerType.value;
		}
		if(vm.useLineGroup && vm.lineGroup) {
			filter.lineGroup = vm.lineGroup.value;
		}

		$http.post('/api/customer-survey/search', filter)
		.then((res) => {
			
			let data = res.data;
			if(data.success) {
				vm.totalCustomers = data.result;
			}
			else {
				$rootScope.pubErrorMsg('沒找到');
			}
		})
		.catch((err) => {
			var msg = err && err.data? err.data.toString():(err? err.toString(): '');
       		$rootScope.pubErrorMsg('搜尋失敗,' + msg);
		})
		.finally(() => {
			vm.isSearching = false;
		});

	};

	let updateCustomer = (customer) => {
		$http.post('/api/customer-survey/sync', customer)
		.then((res) => {
			var data = res.data;
			if(data.success) {
				_.assign(customer, data.result);
			}
		})
		.catch((err) => {
			var msg = err && err.data? err.data.toString():(err? err.toString(): '');
       		$rootScope.pubErrorMsg('同步失敗,' + msg);
		});
	}

	vm.openCustomerDetail = function(customer) {
        var modalInstance = $uibModal.open({
            templateUrl: 'customer-detail.html',
            controller: 'CustomerDetailCtrler as ctrler',
            resolve: {
                singleCustomer: function() {
                    return customer;
				}
			},
			size: 'lg'
          });
    
		  modalInstance.result
		  .then(function (newCustomer) {
			//callback from $uibModalInstance.close()
		  })
          .catch(function () {
			//callback from $uibModalInstance.dismiss()
            modalInstance.close(); 
		  })
		  .finally(() => {
			//console.log('update customer');
			updateCustomer(customer);
		  });
    }

}])
.controller('CustomerDetailCtrler',
['$uibModalInstance', 'lodash', 'singleCustomer','$http', '$rootScope', 'geoDataService',
function($uibModalInstance, _, customer, $http, $rootScope, geoDataService) {
	var vm = this;
	vm.isSearching = false;
	vm.isEditting = false;
	
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
                console.log(err);
              });
    }

	var setRestOfDefaultValues = function(level) {
      if($rootScope.locals) {
        var sysParams = $rootScope.locals.sys;
        vm.citySelect = _.find(vm.cities, function(city) {
          return city._id === sysParams.cityDist.city;
        });

        return vm.selectOnChange('dists',vm.citySelect._id)
          .then(function(dists) {
            
          if(level === 'city')
            return;
            
            vm.distSelect = _.find(vm.dists, function(dist) {
              return dist._id === sysParams.cityDist._id;
			});
			
            return vm.selectOnChange('villages',vm.distSelect._id);
          }); 
      }
    }
		
    var setAddr = function() {
      if(vm.citySelect && vm.distSelect) {
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

		vm.selectOnChange('cities',null)
		.then(() => {
			vm.citySelect = findWithID(vm.cities, data.city);
			vm.selectOnChange('dists',vm.citySelect._id)
			.then(function(dists) {
				vm.distSelect = _.find(dists, function(dist) {
					return dist._id === data.dist;
				});
				return vm.selectOnChange('villages',vm.distSelect._id);
			})
			.then(function(villages) {
				vm.villages = villages;
				vm.villageSelect = findWithID(villages, data.village);
			});

			data.isCustomer = findWithValue(vm.isCustomerLabels, data.isCustomer);
			data.lineGroup = findWithValue(vm.lineGroupStates, data.lineGroup);
			data.customerType = findWithValue(vm.customerTypes, data.customerType);
			data.sex = findWithValue(vm.sexLabels, data.sex);
			data.evaluation = findWithValue(vm.ratingList, data.rating);

			_.assign(vm, data);
			
			vm.fullAddr = vm.addr;
		});
	};

	vm.refreshData = function() {
		setAddr();
	};

	vm.revise = function() {
		vm.isEditting = true;
	};

	vm.isState = (stateName) => {
		return vm.state === stateName;
	};

	vm.saveIntoFile = function() {

	};

	var printBlob = (data) => {
		let blobAnchorElem = null;
		var fileURL = URL.createObjectURL(data);
		blobAnchorElem = document.createElement('a');
		blobAnchorElem.href = fileURL;
		blobAnchorElem.target = '_blank';
		//document.body.appendChild(blobAnchorElem);
		blobAnchorElem.click();
		window.print();
		//document.body.removeChild(blobAnchorElem);
	}

	vm.print = function() {
		let customerData = {
			_id: vm._id,
			state: 'reviewing'
		};

		let q = null;
		if(vm.state === 'editting') 
			q = $http.post('/api/customer-survey/changeState', customerData)
			.then((res) => {
				let data = res.data;
				if(data.success) {
					return $http.post('/pdf/customer-survey', customerData);
				}
				else {
					return Promise.reject('改變表格狀態失敗');
				}
			});
		else
			q = $http.post('/pdf/customer-survey', customerData);
		
		q.then((res) => {
			let data = res.data;
			if(data.filename) {	
				var filename = data.filename;
				var file = new Blob([new Uint8Array(data.content.data)],{type: 'application/pdf'});
				//saveAs(file, filename);
				printBlob(file);
				$rootScope.pubSuccessMsg('下載成功');
			}
			else {
				$rootScope.pubErrorMsg('下載失敗');
			}
		})
		.catch((err) => {
			var msg = err && err.data? err.data.toString():(err? err.toString(): '');
			$rootScope.pubErrorMsg('印表失敗,' + msg);
		});

		
		
		
	};

	vm.submit = function() {
		vm.refreshData();
		vm.isEditting = false;

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
				extractData(data.result);
			}
		})
		.catch((err) => {
			var msg = err && err.data? err.data.toString():(err? err.toString(): '');
			$rootScope.pubErrorMsg('更新或上傳失敗,' + msg);
		});

	};

	vm.cancel = function() {
		vm.isEditting = false;
	}
	
	vm.init = function() {
		let newCustomer = _.cloneDeep(customer);
		extractData(newCustomer);
	};

	vm.closeModal = () => {
		$uibModalInstance.dismiss();
	};
}]);
