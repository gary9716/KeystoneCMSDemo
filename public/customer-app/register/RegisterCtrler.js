angular.module('mainApp')
.controller('RegisterCtrler', 
  ['$http', '$window', '$state', '$rootScope', '$uibModal', 'lodash','localStorageService', 'appRootPath', 'geoDataService',
  function ($http, $window, $state, $rootScope, $uibModal, _ , localStorageService, appRootPath, geoDataService) {
    var vm = this;
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
		console.log('after sync');
		console.log(data);
		_.assign(vm, data);
		vm.tele1 = data.teleNum1;
		vm.tele2 = data.teleNum2;
		vm.customerName = data.name;
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

		vm.isCustomer = findWithValue(vm.isCustomerLabels, data.isCustomer);
		vm.lineGroup = findWithValue(vm.lineGroupStates, data.lineGroup);
		vm.customerType = findWithValue(vm.customerTypes, data.customerType);
		vm.sex = findWithValue(vm.sexLabels, data.sex);
		vm.evaluation = findWithValue(vm.ratingList, data.rating);
		vm.exeProgress = findWithValue(vm.exeProgressList, data.exeProgress);
		vm.customerRank = findWithValue(vm.customerRankList, data.customerRank);
		vm.formType = findWithValue(vm.formTypeList, data.formType);

		if(!vm.interviewDate) vm.interviewDate = Date.now();
		else vm.interviewDate = new Date(vm.interviewDate);

		if(!vm.lastInterviewDate) vm.lastInterviewDate = Date.now();
		else vm.lastInterviewDate = new Date(vm.lastInterviewDate);
	};

	var emptyForm = () => {
		vm._id = undefined;
		vm.customerName = undefined;
		vm.interviewer = undefined;
		vm.sex = undefined;
		vm.age = undefined;
		vm.bank = undefined;
		vm.job = undefined;
		vm.tele1 = undefined;
		vm.tele2 = undefined;
		vm.teleNum1 = undefined;
		vm.teleNum2 = undefined;
		vm.name = undefined;
		vm.city = undefined;
		vm.dist = undefined;
		vm.village = undefined;
		vm.addrRest = undefined;
		vm.fullAddr = undefined;
		vm.finance = undefined;
		vm.isCustomer = undefined;
		vm.lineGroup = undefined;
		vm.customerType = undefined;
		vm.need = undefined;
		vm.comment = undefined;
		vm.evaluation = undefined;
		vm.formDate = Date.now();
		vm.interviewDate = Date.now();
		vm.lastInterviewDate = Date.now();
		vm.state = "editting";
		vm.formType = vm.formTypeList[0];
		vm.formID = undefined;
	}

	vm.daysBetweenInterviews = () => {
		try {
			let d1 = new Date(vm.interviewDate);
			let d2 = new Date(vm.lastInterviewDate);
			return (d1.getTime() - d2.getTime())/(1000*60*60*24);
		}
		catch (e) {
			console.log(e);
			return "";
		}
	};

	vm.nextCustomer = () => {
		vm.customerIndex = (vm.customerIndex + 1) % vm.candidates.length;
		extractData(vm.candidates[vm.customerIndex]);
	}

	vm.syncData = function() {
		if(!vm.interviewer && !vm.customerName) {
			$rootScope.pubWarningMsg('訪查者名或客戶名至少得有一者不為空');
			return;
		}

		if(vm.isSearching) return;
		vm.isSearching = true;
		vm.candidates = [];
		vm.customerIndex = 0;
	
		//search with customer name and tele1 or tele2
		let customerData = {
			customerName: vm.customerName,
			tele1: vm.tele1,
			tele2: vm.tele2,
			interviewer: vm.interviewer,
		};

		if(vm.onlyReturnEdittable)
			customerData.state = 'editting';

		$http.post('/api/customer-survey/sync', customerData)
		.then((res) => {
			var data = res.data;
				if(data.success) {
					$rootScope.pubSuccessMsg('同步成功');
					if(_.isArray(data.result)) {
						vm.candidates = data.result;
						extractData(vm.candidates[vm.customerIndex]);
					}
					else
						extractData(data.result);
				}
				else {
					$rootScope.pubWarningMsg('沒找到');
					emptyForm();
				}
		})
		.catch((err) => {
			var msg = err && err.data? err.data.toString():(err? err.toString(): '');
			$rootScope.pubErrorMsg('同步失敗,' + msg);
			emptyForm();   
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

	vm.openNewForm = () => {
		$state.reload();
	}

	vm.submit = function() {
		let customerData = {
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
			billProcessRating: vm.billProcessRating? vm.billProcessRating:undefined
		};

		if(vm.exeProgress) customerData["exeProgress"] = vm.exeProgress.value;
		if(vm.customerRank) customerData["customerRank"] = vm.customerRank.value;
		if(vm.formType) customerData["formType"] = vm.formType.value;
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
				setTimeout(() => {
					vm.openNewForm();
				}, 500);
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

	vm.candidates = [];
	vm.customerIndex = 0;
	vm.onlyReturnEdittable = true;
	vm.isSearching = false;
	vm.isEditting = true;
	vm.formDate = Date.now();
	vm.interviewDate = Date.now();
	vm.lastInterviewDate = Date.now();
	vm.addrRest = "";
	vm.state = 'editting';
	vm.formType = vm.formTypeList[0];
	
}]);
