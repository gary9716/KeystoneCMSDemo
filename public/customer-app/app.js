//Specify all dependencies and config provider
angular.module('mainApp', [
	// ...which depends on the modules below  
	'ngAnimate',
	'ngLodash',
	'ui.router',
	//'angular.filter',
	'ui.bootstrap',
	'LocalStorageModule',
	'ngFileUpload'
  ])
  .constant('appRootPath',(function() {
	locals.appRootPath = '/customer-app/';
	return locals.appRootPath;
  })())
  .constant('cachedFarmersKey', 'customer:cachedFarmers');//to inject into config, we need to register this value as constant
  
  angular.module('mainApp')
  .config(['appRootPath', '$stateProvider', '$urlRouterProvider', 'localStorageServiceProvider',
	function (appRootPath, $stateProvider, $urlRouterProvider, localStorageServiceProvider){
	  const createOp = 'create';
	  const readOp = 'read';
	  const updateOp = 'update';
	  const deleteOp = 'delete';
  
	  //for permission validation, here we only need to validate minimal permissions.
	  //in practical, every request has already been guarded by permission check middleware
  
	  $stateProvider
	  .state({
		name: 'register',
		templateUrl: appRootPath + 'register/index.html',
		controller: 'RegisterCtrler as ctrler',
		url: '/',
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
  
	  //$urlRouterProvider.when('', '/');
	  $urlRouterProvider.otherwise('/');
  
	  localStorageServiceProvider.setPrefix('customerApp').setNotify(false, false);
  
  }])
  .run(['$state', '$window', '$http', '$uibModal', '$rootScope', '$transitions', 'myValidation', 'cachedFarmersKey', 'appRootPath',
	function ($state, $window, $http, $uibModal, $rootScope, $transitions, myValidation, cachedFarmersKey, appRootPath) {
	  console.log('config end, angular app start to run');
	  $rootScope.locals = locals; //access global variable locals in $rootScope
	  
	  $rootScope.alerts = [];
	  $rootScope.pubSuccessMsg = function(msg) {
		$rootScope.alerts.push({ type:'success', msg: msg });
	  }
  
	  $rootScope.pubWarningMsg = function(msg) {
		$rootScope.alerts.push({ type:'warning', msg: msg }); 
	  }
  
	  $rootScope.pubInfoMsg = function(msg) {
		$rootScope.alerts.push({ type:'info', msg: msg }); 
	  }
  
	  $rootScope.pubErrorMsg = function(msg) {
		$rootScope.alerts.push({ type:'danger', msg: msg }); 
	  }
  
	  $rootScope.isLogin = function() {
		return locals.user;
	  }
  
	  $rootScope.isPage = function(pageName){
		return $state.current.name === pageName;
	  }
  
	  $transitions.onError({}, function(transition) {
		if(!transition)
		  return;
		var errorReason = transition.error().detail;
		if(errorReason === "access denied") {
		  $state.go('403');
		}
		
	  });
  
	  $rootScope.loadDone = true;
  }]);
  
  