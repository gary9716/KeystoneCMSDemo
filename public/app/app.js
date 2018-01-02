//Specify all dependencies and config provider

// Define the `mainApp` module
angular.module('mainApp', [
  // ...which depends on the modules below  
  'ui.router',
  'angular.filter'
])
.constant('appRootPath',(function() {
  if(locals && locals.env) {
    if(locals.env === 'production') {
      return '/app-min/';
    }
    else {
      return '/app/';
    }
  }
  else {
    return '/app/';
  }
})());//to inject into config, we need to register this value as constant

angular.module('mainApp')
.config(['appRootPath', '$stateProvider', '$urlRouterProvider', 
  function (appRootPath, $stateProvider, $urlRouterProvider){
    $stateProvider
    .state({
      name: 'home',
      templateUrl: appRootPath + 'home/index.html',
      controller: 'HomeCtrler as ctrler'
    })
    .state({
      name: 'home.addrList',
      templateUrl: appRootPath + 'home/addrList.html'
    })

    .state({
      name: 'farmerRegister',
      templateUrl: appRootPath + 'farmerRegister/index.html',
      controller: 'FarmerRegisterCtrler as ctrler'
    })

    .onInvalid(function(toState, fromState) {
      console.log('invalid state from ',fromState,' to ',toState);
      return false;
    });

}])
.run(['$state', '$http', '$rootScope',
  function ($state, $http, $rootScope) {
    console.log('config end, start to run');
    console.log(locals);
    $state.go(locals.state);
}]);

