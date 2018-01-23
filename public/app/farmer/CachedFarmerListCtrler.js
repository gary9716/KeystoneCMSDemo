angular.module('mainApp')
.controller('CachedFarmerListCtrler',
['cachedFarmersKey', 'lodash', 'localStorageService', '$state', '$uibModalInstance',
  function(cachedFarmersKey, _ , localStorageService, $state, $uibModalInstance) {
    var vm = this;
    
    var farmers = localStorageService.get(cachedFarmersKey);
    if(!farmers) {
      vm.farmers = [];
    }
    else 
      vm.farmers = farmers;

    vm.rmFarmerFromList = function(farmer) {
      var index = _.findIndex(vm.farmers, function(_farmer) {
        return _farmer.pid === farmer.pid;
      });
      if(index !== -1) {
        vm.farmers.splice(index, 1);
        localStorageService.set(cachedFarmersKey, vm.farmers);
      }
    };

    vm.goDetailPage = function(farmer) {
      localStorageService.set('farmerDetail:farmerPID', farmer.pid);
      $state.go('farmerDetail');
      $uibModalInstance.dismiss();
    }

  }
]); 