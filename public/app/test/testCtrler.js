(function(){

angular.module('mainApp')
.controller('testCtrler', testCtrler)
.controller('homeController', homeCtrler);

testCtrler.$inject = [];
function testCtrler() {
  var vm = this;
  vm.greetMsg = 'Hello world!';
}

homeCtrler.$inject = ['$http'];
function homeCtrler($http) {
  var vm = this;
  vm.msg = 'finding...';
  $http({
    method: 'GET',
    url: '/pathToHome'
  }).then(
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

})();

