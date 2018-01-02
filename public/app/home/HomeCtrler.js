angular.module('mainApp')
.controller('HomeCtrler', 
  ['$http','$rootScope', 
  function ($http, $rootScope) {
    var vm = this;
    vm.msg = 'test msg';
    vm.addrList = [
      {
        addr: 'yokohama',
        id: '1'
      },
      
      {
        addr: 'ikebukuro',
        id: '2'
      },

      {
        addr: 'shinjyuku',
        id: '3'
      },

      {
        addr: 'ueno',
        id: '4'
      },

    ];

    
}]);







