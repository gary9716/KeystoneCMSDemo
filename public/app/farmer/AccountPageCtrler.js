angular.module('mainApp')
.controller('AccountPageCtrler', 
  ['$http', '$window', '$state', 
  function($http, $window, $state) {

    var vm = this;

    if(!$state.params) {
      console.log('error: no params');
      return;
    }

    vm.farmerPID = $state.params.farmerPID;
    vm.accountUser = "QAQ";

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
          vm.newAccount = data.result;
          console.log(vm.newAccount);
        }
        else {
          console.log('創建存摺失敗,', data.message);
        }
      })
      .catch(function(err) {
        console.log(err);
      });

    }




  }]
);