//Specify all dependencies and config provider

// Define the `mainApp` module
angular.module('mainApp', [
  // ...which depends on the modules below  
  'ui.router',
  'angular.filter'
])
.constant('appRootPath','/app-min/');

angular.module('mainApp')
.config(['appRootPath', '$stateProvider', '$urlRouterProvider', 
  function (appRootPath, $stateProvider, $urlRouterProvider){
    $stateProvider
    .state({
      name: 'test',
      templateUrl: appRootPath + 'test/test.html',
      controller: 'TestCtrler as testCtrler'
    })
    
    .state({
      name: 'home',
      templateUrl: appRootPath + 'test/home.html',
      controller: 'HomeController as homeCtrler'
    })
    .state({
      name: 'home.list',
      templateUrl: appRootPath + 'test/home.list.html'
    })

    .onInvalid(function(toState, fromState) {
      console.log('invalid state from ',fromState,' to ',toState);
      return false;
    });

}])
.run(['$state', '$http', '$rootScope',
  function ($state, $http, $rootScope) {
    console.log('config end, start to run');
    $state.go(locals.state);
}]);

