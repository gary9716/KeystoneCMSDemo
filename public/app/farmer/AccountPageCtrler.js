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
          console.log(data.message);
        }
      })
      .catch(function(err) {
        $rootScope.pubErrorMsg('系統似乎出現一些錯誤');
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
        $rootScope.pubErrorMsg('系統似乎出現一些錯誤');
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
        size: 'md', //'md','lg','sm'
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
        size: 'lg', //'md','lg','sm'
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
            $rootScope.pubErrorMsg('更新失敗,' + err.toString());
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
  ['$uibModalInstance', 'account', '$http', 'lodash', '$q',
  function($uibModalInstance, account, $http, _ , $q) {
    var vm = this;
    vm.account = account;
    vm.closeAcc = {};
    vm.deposit = {};
    vm.withdraw = {};
    vm.setFreeze = {};
    vm.isProcessing = false;

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

    vm.getPeriods = function(keyword) {
      return $http.post('/api/read', {
        listName: 'Period',
        contains: { name: keyword },
        limit: 8,
      })
      .then(function(res) {
        if(res.data.success) {
          return res.data.result;
        }
        else {
          return $q.reject();
        }
      });
    }

    vm.depositOp = function() {
      vm.isProcessing = true;

      var data = {
        _id: vm.account._id,
        amount: vm.deposit.amount
      };

      notEmptyOrUndefThenAdd(data, 'period_id', vm.deposit.period_id);
      if(!data.hasOwnProperty('period_id'))
        notEmptyOrUndefThenAdd(data, 'period', vm.deposit.period);

      notEmptyOrUndefThenAdd(data, 'comment', vm.deposit.comment);
      notEmptyOrUndefThenAdd(data, 'ioAccount', vm.deposit.ioAccount);

      console.log(vm.deposit);

      console.log(data);

      $http.post('/api/account/deposit', data)
      .then(function(res) {
        var resData = res.data;
        if(resData.success) {
          _.assign(vm.account, resData.result);
          $uibModalInstance.close('入款成功,頁面資料已更新');
        }
        else {
          vm.pubErrorMsg('入款失敗,' + resData.message);
        }
      })
      .catch(function(err) {
        vm.pubErrorMsg('入款失敗,' + err.toString());
      })
      .finally(function() {
        vm.isProcessing = false;
      })

      //$uibModalInstance.close(vm.deposit);
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
          $uibModalInstance.close('提款成功,頁面資料已更新');
        }
        else {
          vm.pubErrorMsg('提款失敗,' + resData.message);
        }
      })
      .catch(function(err) {
        vm.pubErrorMsg('提款失敗,' + err.toString());
      })
      .finally(function() {
        vm.isProcessing = false;
      })

      //$uibModalInstance.close(vm.withdraw);
    }

    vm.setFreezeOp = function() {
      vm.isProcessing = true;
      var data = {
        _id: vm.account._id,
      };

      notEmptyOrUndefThenAdd(data, 'comment', vm.setFreeze.comment);

      $http.post('/api/account/set-freeze', data)
      .then(function(res) {
        var resData = res.data;
        if(resData.success) {
          _.assign(vm.account, resData.result);
          $uibModalInstance.close((vm.account.freeze? '凍結成功':'解凍成功') + ',頁面資料已更新');
        }
        else {
          vm.pubErrorMsg('失敗,' + resData.message);
        }
      })
      .catch(function(err) {
        vm.pubErrorMsg('失敗,' + err.toString());
      })
      .finally(function() {
        vm.isProcessing = false;
      })

      //$uibModalInstance.close(vm.setFreeze);
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
          $uibModalInstance.close('結清成功,已呈現最新資料');
        }
        else {
          vm.pubErrorMsg('結清失敗,' + resData.message);
        }
      })
      .catch(function(err) {
        vm.pubErrorMsg('結清失敗,' + err.toString());
      })
      .finally(function() {
        vm.isProcessing = false;
      });

      //$uibModalInstance.close(vm.closeAcc);
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
              })
              .catch(function(err) {
                console.log(err);
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
        $rootScope.pubErrorMsg('系統似乎出現一些錯誤');
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