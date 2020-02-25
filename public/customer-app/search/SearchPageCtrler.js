var printBlob = (data) => {
	let blobAnchorElem = null;
	var fileURL = URL.createObjectURL(data);
	blobAnchorElem = document.createElement('a');
	blobAnchorElem.href = fileURL;
	blobAnchorElem.target = '_blank';
	//document.body.appendChild(blobAnchorElem);
	blobAnchorElem.click();
	//document.body.removeChild(blobAnchorElem);
}

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
		{
			value: 'none',
			name: '無'
		}
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

	vm.findWithValue = (dataArray, val) => {
		return _.find(dataArray, (elem) => {
			return elem.value === val;
		});
	};

	vm.findWithID = (dataArray, id) => {
		return _.find(dataArray, (elem) => {
			return elem._id === id;
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
		if(vm.useSex && vm.sex) {
			filter.sex = vm.sex.value;
		}
		if(vm.useRating && vm.rating) {
			filter.rating = vm.rating.value;
		}
		if(vm.useStartAge && vm.startAge) {
			filter.startAge = vm.startAge;
		}
		if(vm.useEndAge && vm.endAge) {
			filter.endAge = vm.endAge;
		}
		if(vm.useCustomerName && vm.customerName) {
			filter.customerName = vm.customerName;
		}
		if(vm.useInterviewer && vm.interviewer) {
			filter.interviewer = vm.interviewer;
		}

		//console.log(filter);
		vm.lastFilter = filter;

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
		customer.populateFields = 'city dist village';
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
	
		  let dontUpdate = false;
		  modalInstance.result
		  .then(function () {
			//callback from $uibModalInstance.close()
		  })
          .catch(function (res) {
			if(res === 'deleteCustomer') {
				//callback from $uibModalInstance.dismiss()
				dontUpdate = true;
				_.remove(vm.totalCustomers, (c) => {
					return c._id === customer._id;
				});
			}
		  })
		  .finally(() => {
			modalInstance.close();
			if(!dontUpdate) updateCustomer(customer);
		  });
	}
	
	vm.printCustomerList = () => {
		$http.post('/pdf/customer-list',
		{
			customerList: vm.totalCustomers,
			filter: vm.lastFilter
		})
		.then((res) => {
			let data = res.data;
			if(data.filename) {
				var file = new Blob([new Uint8Array(data.content.data)],{type: 'application/pdf'});
				
				var filename = data.filename;
				saveAs(file, filename);
				
				$rootScope.pubSuccessMsg('下載成功');
			}
			else {
				return Promise.reject('');
			}
		})
		.catch((err) => {
			var msg = err && err.data? err.data.toString():(err? err.toString(): '');
			$rootScope.pubErrorMsg('下載失敗,' + msg);
		});
	};

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
		}
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

	vm.customerRankList = [
		{ value: '0', name: 'VIP' },
		{ value: '1', name: '潛力' },
		{ value: '2', name: '持平' },
		{ value: '3', name: '危機' },
		{ value: '4', name: '憂鬱' }
	];

	vm.formTypeList = [
		{ value: 'A', name: '信用' },
		{ value: 'B', name: '供銷' },
		{ value: 'C', name: '其他' }
	];

	vm.interviewTypeList = [
		{ value: 'init', name: '初訪' },
		{ value: 're', name: '回訪' }
	];

	vm.exeProgressList = [
		{ value: '0', name: '報價' },
		{ value: '1', name: '簽約' },
		{ value: '2', name: '其他' }
	];

	vm.isSaleForm = () => {
		let val = vm.formType && vm.formType.value === vm.formTypeList[1].value;
		return val;
	};

	vm.isExeProgessOthers = () => {
		let val = vm.exeProgress && vm.exeProgress.value === vm.exeProgressList[2].value;
		return val;
	};

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
			if(data.city) {
				vm.citySelect = findWithID(vm.cities, data.city._id);
				if(vm.citySelect && data.dist) {
					vm.selectOnChange('dists',vm.citySelect._id)
					.then(function(dists) {
						vm.distSelect = _.find(dists, function(dist) {
							return dist._id === data.dist._id;
						});
						if(vm.distSelect && data.village)
							return vm.selectOnChange('villages',vm.distSelect._id)
								.then(function(villages) {
									vm.villageSelect = findWithID(villages, data.village._id);
								});
					});
				}	
			}
			
			data.isCustomer = findWithValue(vm.isCustomerLabels, data.isCustomer);
			data.lineGroup = findWithValue(vm.lineGroupStates, data.lineGroup);
			data.customerType = findWithValue(vm.customerTypes, data.customerType);
			data.sex = findWithValue(vm.sexLabels, data.sex);
			data.evaluation = findWithValue(vm.ratingList, data.rating);
			data.exeProgress = findWithValue(vm.exeProgressList, data.exeProgress);
			data.customerRank = findWithValue(vm.customerRankList, data.customerRank);
			data.formType = findWithValue(vm.formTypeList, data.formType);
			data.interviewType = findWithValue(vm.interviewTypeList, data.interviewType);
	
			_.assign(vm, data);
	
			if(vm.interviewDate) 
				vm.interviewDate = new Date(vm.interviewDate);

			if(vm.lastInterviewDate)
				vm.lastInterviewDate = new Date(vm.lastInterviewDate);
			vm.fullAddr = vm.addr;
			
			//console.log(vm);
		});
	};

	
	vm.daysBetweenInterviews = () => {
		try {
			let d1 = new Date(vm.interviewDate);
			let d2 = new Date(vm.lastInterviewDate);
			let val = (d1.getTime() - d2.getTime())/(1000*60*60*24);
			if(isNaN(val))
				return "";
			else
				return Math.floor(val);
		}
		catch (e) {
			console.log(e);
			return "";
		}
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

	vm.print = function() {
		let customerData = {
			_id: vm._id,
			state: 'reviewing'
		};

		let q = null;
		if(vm.state === 'editting') {
			q = $http.post('/api/customer-survey/changeState', customerData)
			.then((res) => {
				let data = res.data;
				if(data.success) {
					vm.state = "reviewing";
					return $http.post('/pdf/customer-survey', customerData);
				}
				else {
					return Promise.reject('改變表格狀態失敗');
				}
			});
		}
		else {
			q = $http.post('/pdf/customer-survey', customerData);
		}
			
		q.then((res) => {
			let data = res.data;
			if(data.filename) {	
				var file = new Blob([new Uint8Array(data.content.data)],{type: 'application/pdf'});
				
				var filename = data.filename;
				saveAs(file, filename);

				$rootScope.pubSuccessMsg('下載成功');
			}
			else {
				return Promise.reject('');
			}
		})
		.catch((err) => {
			var msg = err && err.data? err.data.toString():(err? err.toString(): '');
			$rootScope.pubErrorMsg('印表失敗,' + msg);
		});

	};

	vm.updateComment = () => {
		let data = {
			_id: vm._id,
			comment: vm.comment
		};
		//console.log(data);
		$http.post('/api/customer-survey/update-comment', data)
		.then((res) => {
			let data = res.data;
			if(data.success) {
				$rootScope.pubSuccessMsg('更新成功');
			}
			else {
				return Promise.reject(''); 
			}
		})
		.catch((err) => {
			var msg = err && err.data? err.data.toString():(err? err.toString(): '');
			$rootScope.pubErrorMsg('更新或上傳失敗,' + msg);
		});
	}

	vm.submit = function() {
		vm.refreshData();
		vm.isEditting = false;

		let customerData = {
			_id: vm._id? vm._id:undefined,
			formDate: vm.formDate,
			customerName: vm.customerName,
			age: vm.age? vm.age:undefined,
			job: vm.job? vm.job:undefined,
			bank: vm.bank? vm.bank:undefined,
			finance: vm.finance? vm.finance:undefined,
			interviewer: vm.interviewer,
			
			tele1: vm.tele1?vm.tele1:undefined,
			tele2: vm.tele2?vm.tele2:undefined,
			
			addr: vm.fullAddr?vm.fullAddr:undefined,
			addrRest: vm.addrRest?vm.addrRest:undefined,
			city: vm.citySelect?vm.citySelect._id:undefined,
			dist: vm.distSelect?vm.distSelect._id:undefined,
			village: vm.villageSelect?vm.villageSelect._id:undefined,

			need: vm.need?vm.need:undefined,
			comment: vm.comment?vm.comment:undefined,

			interviewDate: vm.interviewDate? vm.interviewDate:undefined,
			lastInterviewDate: vm.lastInterviewDate? vm.lastInterviewDate:undefined,
			companyWin: vm.companyWin? vm.companyWin:undefined,
			contactNum: vm.contactNum? vm.contactNum:undefined,
			
			//sale form fields
			recommendedProduct: vm.recommendedProduct? vm.recommendedProduct:undefined,
			alreadySale: vm.alreadySale? vm.alreadySale:undefined,
			thisTimeSale: vm.thisTimeSale? vm.thisTimeSale:undefined,
			exeProgressOthers: vm.exeProgressOthers? vm.exeProgressOthers:undefined,

			receptionistRating: vm.receptionistRating? vm.receptionistRating:undefined,
			onTimeRating: vm.onTimeRating? vm.onTimeRating:undefined,
			qualityRating: vm.qualityRating? vm.qualityRating:undefined,
			stackRating: vm.stackRating? vm.stackRating:undefined,
			goodsReturnRating: vm.goodsReturnRating? vm.goodsReturnRating:undefined,
			deliveryRating: vm.deliveryRating? vm.deliveryRating:undefined,
			agentRating: vm.agentRating? vm.agentRating:undefined,
			billProcessRating: vm.billProcessRating? vm.billProcessRating:undefined,
			customerComment: vm.customerComment? vm.customerComment:undefined
		};

		if(vm.exeProgress) customerData["exeProgress"] = vm.exeProgress.value;
		if(vm.customerRank) customerData["customerRank"] = vm.customerRank.value;
		if(vm.formType) customerData["formType"] = vm.formType.value;

		if(vm.sex) customerData['sex'] = vm.sex.value;
		if(vm.isCustomer) customerData['isCustomer'] = vm.isCustomer.value;
		if(vm.lineGroup) customerData['lineGroup'] = vm.lineGroup.value;
		if(vm.customerType) customerData['customerType'] = vm.customerType.value;
		if(vm.evaluation) customerData['rating'] = vm.evaluation.value;
		if(vm.interviewType) customerData['interviewType'] = vm.interviewType.value;

		return $http.post('/api/customer-survey/upsert', customerData)
		.then((res) => {
			let data = res.data;
			if(data.success) {
				$rootScope.pubSuccessMsg('更新成功');
				return extractData(data.result);
			}
			else {
				return Promise.reject(''); 
			}
		})
		.catch((err) => {
			var msg = err && err.data? err.data.toString():(err? err.toString(): '');
			$rootScope.pubErrorMsg('更新或上傳失敗,' + msg);
		});

	};
	
	vm.saveIntoFile = function() {
		let customerData = {
			state: 'filed',
			_id: vm._id
		};

		$http.post('/api/customer-survey/changeState', customerData)
		.then((res) => {
			let data = res.data;
			if(data.success) {
				vm.state = 'filed';
			}
			else {
				return Promise.reject('改變表格狀態失敗');
			}
		});

	};

	vm.cancel = function() {
		vm.isEditting = false;
	};

	vm.init = function() {
		let newCustomer = _.cloneDeep(customer);
		extractData(newCustomer);
	};

	vm.closeModal = (res) => {
		$uibModalInstance.dismiss(res);
	};

	vm.delete = () => {
		$http.post('/api/customer-survey/delete', { _id: vm._id })
		.then((res) => {
			let data = res.data;
			if(data.success) {
				$rootScope.pubSuccessMsg('刪除成功');
				vm.closeModal('deleteCustomer');
			}
			else {
				return Promise.reject('');
			}
		})
		.catch((err) => {
			var msg = err && err.data? err.data.toString():(err? err.toString(): '');
			$rootScope.pubErrorMsg('刪除失敗,' + msg);
		});
	};

}]);
