angular.module('mainApp')
.controller('AccountPageCtrler', 
  ['$http', '$window', '$state', '$rootScope', '$uibModal', 'cachedFarmersKey', 'lodash','localStorageService', 'appRootPath',
  function($http, $window, $state, $rootScope, $uibModal, cachedFarmersKey, _ , localStorageService, appRootPath) {

    var vm = this;
    const farmerPIDKey = 'farmerDetail:farmerPID';

    if(!$state.params) {
      console.log('error: no params');
      return;
    }

    var farmerPID = $state.params.farmerPID;
    if(farmerPID) {
      localStorageService.set(farmerPIDKey, farmerPID);
    }
    else {
      farmerPID = localStorageService.get(farmerPIDKey); //retrieve pid from cache to make page refreshable
    }

    vm.accountUser = '';

    vm.getDetail = function() {

      $http.post('/api/farmer/get-and-populate',
      {
        farmerPID: farmerPID,
        _populate: 'village'
      })
      .then(function(res) {
        var data = res.data;
        if(data.success) {
          vm.farmer = data.result.farmer;
          vm.accounts = data.result.accounts;
        }
        else {
          $rootScope.pubWarningMsg(data.message);
        }
      })
      .catch(function(err) {
        var msg = err && err.data? err.data.toString():(err? err.toString(): '');
        $rootScope.pubErrorMsg('抓取農民存摺資訊失敗,' + msg);
        console.log(err);
      });

    }

    vm.createAccount = function() {

      $http.post('/api/account/create',
      {
        farmerPID: farmerPID,
        accountUser: vm.accountUser,
        comment: vm.comment
      })
      .then(function(res) {
        var data = res.data;
        if(data.success) {
          if(!vm.accounts instanceof Array)
            vm.accounts = [];

          var newAccIndex = vm.accounts.length + 1;
          $rootScope.pubSuccessMsg('存摺' + newAccIndex.toString() + '開立成功');
          vm.accounts.push(data.result);
        }
        else {
          $rootScope.pubWarningMsg(data.message);
        }
      })
      .catch(function(err) {
        var msg = err && err.data? err.data.toString():(err? err.toString(): '');
        $rootScope.pubErrorMsg('開立存摺失敗,' + msg);
        console.log(err);
      });

    };

    vm.openCreateAccountModal = function() {
      var modalInstance = $uibModal.open({
        templateUrl: 'create-account.html', //this template is embedded in detail.html
        controller: 'CreateAccountModalCtrler as $ctrl',
        size: 'md', //'md','lg','sm'
      });

      modalInstance.result
      .then(function (result) {
        vm.accountUser = result.accountUser;
        vm.comment = result.comment;
        vm.createAccount();
      })
      .catch(function () { 
        modalInstance.close(); 
      });
      
    };

    vm.openAccountDetail = function(account) {
      account.farmer = vm.farmer;
      var modalInstance = $uibModal.open({
        templateUrl: 'account-detail.html', //this template is embedded in detail.html
        controller: 'AccountDetailModalCtrler as ctrler',
        size: 'lg', //'md','lg','sm'
        resolve: { //used for passing parameters to modal controller
          account: function() {
            return account;
          }
        }
      });

      modalInstance.result
      .then(function(successMsg) {
        $rootScope.pubSuccessMsg(successMsg);
      })
      .catch(function () { 
        modalInstance.close(); 
      });
    };
    
    vm.openUpdateFarmerModal = function() {
      var modalInstance = $uibModal.open({
        templateUrl: (appRootPath + 'farmer/update.html'), 
        controller: 'UpdateFarmerModalCtrler as ctrler',
        size: 'md', //'md','lg','sm'
        resolve: { //used for passing parameters to modal controller
          farmer: function() {
            return vm.farmer;
          }
        }
      });

      modalInstance.result
      .then(function(newFarmer) {
        newFarmer._populate = 'village';
        $http.post('/api/farmer/update', newFarmer)
        .then(function(res) {
          var data = res.data;
          if(data.success) {
            $rootScope.pubSuccessMsg('更新成功,頁面資料已更新');
            vm.farmer = data.result;
          }
          else {
            $rootScope.pubErrorMsg('更新失敗,' + data.message);
          }
        })
        .catch(function(err) {
            var msg = err && err.data? err.data.toString():(err? err.toString(): '');
            $rootScope.pubErrorMsg('更新失敗,' + msg);
        });
      })
      .catch(function () { 
        modalInstance.close(); 
      });
    }

    vm.addFarmerToCache = function() {
      if(vm.farmer) {
        var cachedFarmers = localStorageService.get(cachedFarmersKey);
        if(!cachedFarmers)
          cachedFarmers = [];

        if(_.findIndex(cachedFarmers, function(farmer) {
          return farmer.pid === vm.farmer.pid;
        }) === -1) { //hasn't been added
          cachedFarmers.push(vm.farmer);
          localStorageService.set(cachedFarmersKey,cachedFarmers);
          $rootScope.pubSuccessMsg('已加入暫存列表,可用於購物車等其他服務');
        }
        else {
          $rootScope.pubErrorMsg('該農民已在暫存列表');
        }
      }
    }

  }]
)
.controller('CreateAccountModalCtrler', 
  ['$uibModalInstance',
  function($uibModalInstance) {
    var $ctrl = this;
    $ctrl.result = {
      accountUser: ''
    };

    $ctrl.ok = function () {
      $uibModalInstance.close($ctrl.result);
    };

    $ctrl.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  }]
)
.controller('AccountDetailModalCtrler', 
  ['$uibModalInstance', 'account', '$http', 'lodash', '$q', 'Upload', '$window', '$scope',
  function($uibModalInstance, account, $http, _ , $q, Upload, $window, $scope) {
    var vm = this;
    vm.account = account;
    
    var nowDate = new Date();
    nowDate.setFullYear(nowDate.getFullYear() - 1, 6, 1); //July first in previous year
    vm.startDateFilter = nowDate;

    vm.resetOpView = function() {
      //default values
      vm.closeAcc = {};
      vm.deposit = {};
      vm.withdraw = {};
      vm.setFreeze = {};
      vm.isProcessing = false;

      if(locals.depositLimit && locals.depositLimit > 0)
        vm.deposit.limit = locals.depositLimit;
      else
        vm.deposit.limit = 50000;

      vm.withdraw.comment = vm.account.farmer.name + " 白米存摺轉出";
      vm.withdraw.ioAccount = vm.account.farmer.ioAccount;
      
    }
    vm.resetOpView();

		vm.reachDepositLimit = function() {
			return vm.deposit.amount > vm.deposit.limit;
		}

    vm.alerts = [];
    vm.pubSuccessMsg = function(msg) {
      vm.alerts.push({ type:'success', msg: msg });
    }

    vm.pubWarningMsg = function(msg) {
      vm.alerts.push({ type:'warning', msg: msg }); 
    }

    vm.pubInfoMsg = function(msg) {
      vm.alerts.push({ type:'info', msg: msg }); 
    }

    vm.pubErrorMsg = function(msg) {
      vm.alerts.push({ type:'danger', msg: msg }); 
    }

    var notEmptyOrUndefThenAdd = function(obj, key, val) {
      if(_.isString(val)) {
        if(val.length > 0) {
          obj[key] = val;
        }
      }
      else if(_.isNumber(val)) {
        obj[key] = val;
      }
    } 

    vm.getPeriods = function() {
      return $http.post('/api/read', {
        listName: 'Period',
        sort: '-createdAt',
        limit: 8,
      })
      .then(function(res) {
        if(res.data.success) {
          vm.periods = res.data.result;
          if(vm.periods && vm.periods.length > 0)
            vm.deposit.period = vm.periods[0];
        }
        else {
          return $q.reject();
        }
      });
    }

    vm.changeQty = function(item, val) {
      item.qty += val;
    }

    vm.rmItem = function(item) {
      if(vm.edittingRec.products) {
        var index = _.findIndex(vm.edittingRec.products, function(product) {
          return product.pid === item.pid;
        });
        if(index !== -1)
          vm.edittingRec.products.splice(index, 1);
      }
    }

    vm.getTotal = function() {
      if(vm.edittingRec && vm.edittingRec.products) {
        var total = 0;
        vm.edittingRec.products.forEach(function(product) {
          total += (product.price * product.qty);
        });

        return total;
      }
      else {
        return 0;
      }
    }

    vm.isUpdateRecButtonDisabled = function() {
      if(vm.edittingRec) {
        if(vm.edittingRec.opType.value === 'transact') {
          return (vm.isProcessing || ($scope.accountOpForm.editRecItemQty && $scope.accountOpForm.editRecItemQty.$invalid));
        }
        else if(vm.edittingRec.opType.value === 'withdraw' || vm.edittingRec.opType.value === 'deposit') {
          return (vm.isProcessing || $scope.accountOpForm.editRecAmount.$invalid);
        }
      }
      else {
        return false;
      }
    }
    
    vm.depositOp = function() {
      vm.isProcessing = true;

      var data = {
        _id: vm.account._id,
        amount: vm.deposit.amount
      };

      if(vm.deposit.period)
        notEmptyOrUndefThenAdd(data, 'period', vm.deposit.period.name);
        
      notEmptyOrUndefThenAdd(data, 'comment', vm.deposit.comment);
      notEmptyOrUndefThenAdd(data, 'ioAccount', vm.deposit.ioAccount);

      $http.post('/api/account/deposit', data)
      .then(function(res) {
        var resData = res.data;
        if(resData.success) {
          _.assign(vm.account, resData.result);
          vm.resetOpView();
          vm.getAccountRecords();
          var accRec = vm.account.lastRecord;
          
          vm.pubSuccessMsg('入款成功,頁面資料已更新');
          //return vm.downloadDWSheetOp(accRec, 'deposit','入款成功,頁面資料已更新'); //this function is defined in common/AccRecListComponent
        
        }
        else {
          vm.pubErrorMsg('入款失敗,' + resData.message);
        }
      })
      .catch(function(err) {
        var msg = err && err.data? err.data.toString():(err? err.toString(): '');
        vm.pubErrorMsg('入款失敗,' + msg);
      })
      .finally(function() {
        vm.isProcessing = false;
      });

    }

    vm.withdrawOp = function() {
      vm.isProcessing = true;
      var data = {
        _id: vm.account._id,
        amount: vm.withdraw.amount
      };

      notEmptyOrUndefThenAdd(data, 'comment', vm.withdraw.comment);
      notEmptyOrUndefThenAdd(data, 'ioAccount', vm.withdraw.ioAccount);

      $http.post('/api/account/withdraw', data)
      .then(function(res) {
        var resData = res.data;
        if(resData.success) {
          _.assign(vm.account, resData.result);
          vm.resetOpView();
          vm.getAccountRecords();
          var accRec = vm.account.lastRecord;
          
          vm.pubSuccessMsg('提款成功,頁面資料已更新');
          //return vm.downloadDWSheetOp(accRec, 'withdraw','提款成功,頁面資料已更新'); //this function is defined in common/AccRecListComponent
        
        }
        else {
          vm.pubErrorMsg('提款失敗,' + resData.message);
        }
      })
      .catch(function(err) {
        var msg = err && err.data? err.data.toString():(err? err.toString(): '');
        vm.pubErrorMsg('提款失敗,' + msg);
      })
      .finally(function() {
        vm.isProcessing = false;
      })

    }

    vm.FileSizeLimit = '1MB';
    vm.unfreezeFileSelect = function(file, errFiles) {
      vm.errFile = errFiles && errFiles[0];
      if(vm.errFile.$error === 'maxSize') {
        vm.errFile.errorChMsg = '超過檔案限制 ' + vm.FileSizeLimit;
      }
      else {
        vm.errFile.errorChMsg = vm.errFile.$error;
      }
    }

    vm.downloadUnfreezeSheetOp = function() {
      vm.isProcessing = true;
      $http.post('/pdf/unfreeze-sheet', 
      {
        _id: vm.account._id,
      })
      .then(function(res) {
        var filename = res.data.filename;
        var file = new Blob([new Uint8Array(res.data.content.data)],{type: 'application/pdf'});
        saveAs(file, filename);

        vm.pubSuccessMsg('下載解凍單成功');
      })
      .catch(function(err) {
        var msg = err && err.data? err.data.toString():(err? err.toString(): '');
        vm.pubErrorMsg('下載解凍單失敗,' + msg);
      })
      .finally(function() {
        vm.isProcessing = false;
      });
      
    }

    vm.setFreezeOp = function() {
      vm.isProcessing = true;
      var data = {
        _id: vm.account._id,
      };

      notEmptyOrUndefThenAdd(data, 'comment', vm.setFreeze.comment);

      var fd = new FormData();
      if(vm.setFreeze.unfreezeSheet)
        fd.append('relatedFile', vm.setFreeze.unfreezeSheet);

      fd.append('opData', angular.toJson(data)); //convert it into json string

      Upload.http({
        url: '/api/account/set-freeze',
        headers:  {'Content-type': undefined },
        data: fd
      })
      .then(function(res) {
        var resData = res.data;
        if(resData.success) {
          _.assign(vm.account, resData.result);
          vm.resetOpView();
          vm.getAccountRecords();
          vm.pubSuccessMsg((vm.account.freeze? '凍結成功':'解凍成功') + ',頁面資料已更新');
        }
        else {
          vm.pubErrorMsg('失敗,' + resData.message);
        }
      })
      .catch(function(err) {
        var msg = err && err.data? err.data.toString():(err? err.toString(): '');
        vm.pubErrorMsg('失敗,' + msg);
      })
      .finally(function() {
        vm.isProcessing = false;
      },
      function(evt) {
        // progress notify
        vm.setFreeze.uploadProgress = parseInt(100.0 * evt.loaded / evt.total);
      });

    }

    vm.closeAccOp = function() {
      vm.isProcessing = true;
      var data = {
        _id: vm.account._id,
      };

      notEmptyOrUndefThenAdd(data, 'comment', vm.closeAcc.comment);

      $http.post('/api/account/close', data)
      .then(function(res) {
        var resData = res.data;
        if(resData.success) {
          _.assign(vm.account, resData.result);
          vm.resetOpView();
          vm.getAccountRecords();
          vm.pubSuccessMsg('結清成功,已呈現最新資料');
        }
        else {
          vm.pubErrorMsg('結清失敗,' + resData.message);
        }
      })
      .catch(function(err) {
        var msg = err && err.data? err.data.toString():(err? err.toString(): '');
        vm.pubErrorMsg('結清失敗,' + msg);
      })
      .finally(function() {
        vm.isProcessing = false;
      });

    }

    vm.accUserChangeOp = function() {
      vm.isProcessing = true;
      var data = {
        _id: vm.account._id,
        newUser: vm.accUserChange.newUser
      };

      notEmptyOrUndefThenAdd(data, 'comment', vm.accUserChange.comment);

      $http.post('/api/account/change-acc-user', data)
      .then(function(res) {
        var resData = res.data;
        if(resData.success) {
          _.assign(vm.account, resData.result);
          vm.resetOpView();
          vm.getAccountRecords();
          vm.pubSuccessMsg('過戶成功,已呈現最新資料');
        }
        else {
          vm.pubErrorMsg('過戶失敗,' + resData.message);
        }
      })
      .catch(function(err) {
        var msg = err && err.data? err.data.toString():(err? err.toString(): '');
        vm.pubErrorMsg('過戶失敗,' + msg);
      })
      .finally(function() {
        vm.isProcessing = false;
      });
    }

    vm.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  }]
)
.controller('UpdateFarmerModalCtrler', 
  ['$uibModalInstance','farmer', 'geoDataService','$rootScope',
  function($uibModalInstance, farmer, geoDataService, $rootScope){
    var vm = this;
    vm.farmer = _.clone(farmer, false);
    vm.farmer.birth = Date.parse(vm.farmer.birth);

    vm.selectOnChange = function(targetName, selectVal) {
      if(targetName === 'dists') {
        vm.distSelect = null;
        vm.villages = null;
      }

      return geoDataService.fetch(targetName, selectVal)
              .then(function(data) {
                vm[targetName] = data;
                return data;
              });
    }

    var setAddr = function() {
      if(vm.hasOwnProperty("cities") && vm.hasOwnProperty("dists")
        && vm.citySelect && vm.distSelect) {
        vm.farmer.addr = (vm.citySelect.name + vm.distSelect.dist + vm.farmer.addrRest); 
      }
      else {
        vm.farmer.addr = '';
      }
    }

    //initialization
    vm.getCities = function() {
      vm.selectOnChange('cities', null)
      .then(function(cities) {
        vm.citySelect = _.find(vm.cities, function(city) {
          return city._id === vm.farmer.city;
        });

        return vm.selectOnChange('dists',vm.citySelect._id);
      })
      .then(function(dists) {
        vm.distSelect = _.find(vm.dists, function(dist) {
          return dist._id === vm.farmer.dist;
        });

        return vm.selectOnChange('villages',vm.distSelect._id);
      })
      .then(function(villages) {
        vm.villageSelect = _.find(vm.villages, function(village) {
          return village._id === vm.farmer.village._id;
        });
      })
      .catch(function(err) {
        var msg = err && err.data? err.data.toString():(err? err.toString(): '');
        $rootScope.pubErrorMsg('抓取地理資訊失敗,' + msg);
        console.log(err);
      });
    }

    vm.ok = function () {
      vm.farmer.city = vm.citySelect._id;
      vm.farmer.dist = vm.distSelect._id;
      vm.farmer.village = vm.villageSelect._id;
      setAddr();
      $uibModalInstance.close(vm.farmer);
    };
    vm.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  }]
);
