//Specify all dependencies and config provider

// Define the `mainApp` module
angular.module('mainApp', [
  // ...which depends on the modules below  
  'ui.router',
  'angular.filter',
  'ui.bootstrap'
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
      controller: 'HomeCtrler as ctrler',
      url: '/',
    })
    .state({
      name: 'home.addrList',
      templateUrl: appRootPath + 'home/addrList.html',
    })

    .state({
      name: 'farmer',
      templateUrl: appRootPath + 'farmer/index.html',
      url: '/farmer'
    })

    .state({
      name: 'farmerRegister',
      templateUrl: appRootPath + 'farmer/register.html',
      url: '/farmer/register',
      controller: 'FarmerPageCtrler as ctrler',
      resolve: {
        condition1 : ['myValidation', function(myValidation) {
          //if this promise is rejected, then the transition will fail
          return myValidation.checkPermission([
              {
                listName: 'Farmer',
                opName: 'create'
              },

            ]); 
        }]
      }

    })

    .state({
      name: 'farmerSearch',
      templateUrl: appRootPath + 'farmer/search.html',
      url: '/farmer/search',
      controller: 'FarmerPageCtrler as ctrler',
      resolve: {
        condition1 : ['myValidation', function(myValidation) {
          //if this promise is rejected, then the transition will fail
          return myValidation.checkPermission([
              {
                listName: 'Farmer',
                opName: 'read'
              },

            ]); 
        }]
      }

    })

    .state({
      name: '403',
      templateUrl: appRootPath + 'error/403.html',
      url: '/error/403'
    })

    .onInvalid(function(toState, fromState) {
      console.log('invalid state from ',fromState,' to ',toState);
      return false;
    });

}])
.run(['$state', '$http', '$rootScope', '$transitions', 'myValidation',
  function ($state, $http, $rootScope, $transitions, myValidation) {
    console.log('config end, angular app start to run');
    //console.log(locals);
/*
    $transitions.onStart({ }, function(trans) {
      console.log('trans start');
      var SpinnerService = trans.injector().get('SpinnerService');
      SpinnerService.transitionStart();
      trans.promise.finally(SpinnerService.transitionEnd);
    });
*/
    
    $transitions.onError({}, function(transition) {
      var errorReason = transition.error().detail;
      if(errorReason === "access denied") {
        $state.go('403');
      }
      
    });

    $state.go(locals.state);
}]);

