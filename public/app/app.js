(function(){
//Specify all dependencies and config provider
  
  // Define the `mainApp` module
  angular.module('mainApp', [
    // ...which depends on the modules below
    'ui.router'
  ])
  .config(config)
  .run(run);

  config.$inject = ['$stateProvider', '$urlServiceProvider'];
  function config($stateProvider, $urlServiceProvider) {
      $stateProvider
      .state('test', {
        templateUrl: '/app/test/test.html',
        controller: 'testCtrler as testCtrler'
      })
      .state('home',{
        template: '<p>home path:{{homeCtrler.msg}}</p>',
        controller: 'homeController as homeCtrler'
      });
  }

  run.$inject =['$state'];
  function run($state) {
    console.log('config end, start to run');
    window.setTimeout(function() {
      $state.go('home');  
    },1500);
    
  }


})();

