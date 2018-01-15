angular.module('mainApp')
.controller('AccountPageCtrler', 
  ['$http', '$window', '$state', '$rootScope', '$uibModal', 'cachedFarmersKey', 'lodash','localStorageService',
  function($http, $window, $state, $rootScope, $uibModal, cachedFarmersKey, _ , localStorageService) {

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
      farmerPID = localStorageService.get(farmerPIDKey);
    }

    vm.accountUser = '';

    vm.getDetail = function() {

      $http.post('/api/farmer/get-and-populate',
      {
        farmerPID: farmerPID
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
        accountUser: vm.accountUser
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
        controller: 'AccountDetailModalCtrler as $ctrl',
        size: 'md', //'md','lg','sm'
        resolve: { //used for passing parameters to modal controller
          account: function() {
            return account;
          }
        }
      });

      modalInstance.result.catch(function () { 
        modalInstance.close(); 
      });
    };
    
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
          $rootScope.pubSuccessMsg('成功把農民加入暫存列表');
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
  ['$uibModalInstance', 'account',
  function($uibModalInstance, account) {
    var $ctrl = this;
    $ctrl.account = account;
    $ctrl.ok = function () {
      $uibModalInstance.close();
    };
  }]
);

