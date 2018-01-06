angular.module('mainApp')
.controller('AccountPageCtrler', 
  ['$http', '$window', '$state', 
  function($http, $window, $state) {

    var vm = this;

    if(!$state.params) {
      console.log('error: no params');
      return;
    }

    vm.farmerID = $state.params.farmerID;

    vm.getFarmerData = function() {

      $http.post('/api/farmer/get-and-populate',
      {
        farmerID: vm.farmerID
      })
      .then(function(res) {
        var data = res.data;
        if(data.success) {
          vm.farmer = data.result.farmer;
          vm.accounts = data.result.accounts;
        }
        else {
          console.log('抓取農夫資料失敗,', data.message);
        }
      })
      .catch(function(err) {
        console.log(err);
      });

    }

    vm.createAccount = function() {

      $http.post('/api/account/create',
      {
        farmerID: vm.farmerID
      })
      .then(function(res) {
        var data = res.data;
        if(data.success) {
          vm.newAccount = data.result;
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