angular.module('mainApp')
.controller('TestCtrler', [
  function () {
  var vm = this;
  vm.greetMsg = 'Hello world!';
}])
.controller('HomeController', 
  ['$http','$rootScope', 
  function ($http, $rootScope) {
    var vm = this;
    vm.msg = 'finding...';
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

    /*
    vm.testAjax = function() {
      $http({
        method: 'GET',
        url: '/pathToHome'
      })
      .then(
        function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
          vm.msg = 'found, where:' + response.data["addr"];
          response.data.message = 'test msg';
          $rootScope.$broadcast(response.data);
        }, 
        function errorCallback(response) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          vm.msg = 'lost';
        }
      );
    };
    */
}]);







