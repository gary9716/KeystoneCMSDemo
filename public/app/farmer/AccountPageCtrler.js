angular.module('mainApp')
.controller('AccountPageCtrler', 
  ['$http', '$window', '$state', '$rootScope', '$uibModal',
  function($http, $window, $state, $rootScope, $uibModal) {

    var vm = this;
    $rootScope.alerts = [];

    if(!$state.params) {
      console.log('error: no params');
      return;
    }

    vm.farmerPID = $state.params.farmerPID;
    vm.accountUser = '';

    vm.getDetail = function() {

      $http.post('/api/farmer/get-and-populate',
      {
        farmerPID: vm.farmerPID
      })
      .then(function(res) {
        var data = res.data;
        if(data.success) {
          vm.farmer = data.result.farmer;
          vm.accounts = data.result.accounts;
        }
        else {
          console.log(data.message);
        }
      })
      .catch(function(err) {
        console.log(err);
      });

    }

    vm.createAccount = function() {

      $http.post('/api/account/create',
      {
        farmerPID: vm.farmerPID,
        accountUser: vm.accountUser
      })
      .then(function(res) {
        var data = res.data;
        if(data.success) {
          if(!vm.accounts instanceof Array)
            vm.accounts = [];

          vm.accounts.push(data.result);
        }
        else {
          $rootScope.alerts.push({ msg: data.message });
        }
      })
      .catch(function(err) {
        $rootScope.alerts.push({ msg: '系統似乎出現一些錯誤' });
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

