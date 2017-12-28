angular.module('mainApp')
.controller('TestCtrler', [TestCtrler])
.controller('HomeController', ['$http', HomeCtrler]);

function TestCtrler() {
  var vm = this;
  vm.greetMsg = 'Hello world!';
}

function HomeCtrler($http) {
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


  $http({
    method: 'GET',
    url: '/pathToHome'
  })
  .then(
    function successCallback(response) {
      // this callback will be called asynchronously
      // when the response is available
      vm.msg = 'found, where:' + response.data["addr"];
    }, 
    function errorCallback(response) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
      vm.msg = 'lost';
    }
  );
}
