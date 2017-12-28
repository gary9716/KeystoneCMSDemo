//Specify all dependencies and config provider
  
// Define the `mainApp` module
angular.module('mainApp', [
  // ...which depends on the modules below
  'ui.router',
  'angular.filter'
])
.config(config)
.run(run);

config.$inject = ['$stateProvider', '$urlRouterProvider'];
function config($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state({
      name: 'test',
      templateUrl: '/app/test/test.html',
      controller: 'TestCtrler as testCtrler'
    })
    
    .state({
      name: 'home',
      templateUrl: '/app/test/home.html',
      controller: 'HomeController as homeCtrler'
    })
    .state({
      name: 'home.list',
      templateUrl: '/app/test/home-list.html'
    })

    .onInvalid(function(toState, fromState) {
      console.log('invalid state from ',fromState,' to ',toState);
      return false;
    });

}

run.$inject =['$state'];
function run($state) {
  console.log('config end, start to run');
  window.setTimeout(function() {
    $state.go('home');  
  },1500);
  
}
