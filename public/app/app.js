//Specify all dependencies and config provider

// Define the `mainApp` module
angular.module('mainApp', [
  // ...which depends on the modules below  
  'ngAnimate',
  'ui.router',
  //'angular.filter',
  'ui.bootstrap',
  'ngCart',
  'LocalStorageModule',
  'ngFileUpload'
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
})())
.constant('cachedFarmersKey', 'mainApp:cachedFarmers');//to inject into config, we need to register this value as constant

angular.module('mainApp')
.config(['appRootPath', '$stateProvider', '$urlRouterProvider', 'localStorageServiceProvider',
  function (appRootPath, $stateProvider, $urlRouterProvider, localStorageServiceProvider){
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
      name: 'farmerDetail',
      templateUrl: appRootPath + 'farmer/detail.html',
      url: '/farmer/detail/',
      params: {
        farmerPID: null
      },
      controller: 'AccountPageCtrler as ctrler',
      resolve: {
        condition1 : ['myValidation', function(myValidation) {
          //if this promise is rejected, then the transition will fail
          return myValidation.checkPermission([
              {
                listName: 'Farmer',
                opName: 'read'
              },

              {
                listName: 'Account',
                opName: 'read'
              }
            ]); 
        }]
      }

    })

    .state({
      name: 'product',
      templateUrl: appRootPath + 'product/index.html',
      url: '/product/',
    })

    .state({
      name: 'productSell',
      templateUrl: appRootPath + 'product/sell.html',
      url: '/product/sell',
      controller: 'ProductPageCtrler as ctrler',
      resolve: {
        condition1 : ['myValidation', function(myValidation) {
          //if this promise is rejected, then the transition will fail
          return myValidation.checkPermission([
              {
                listName: 'Product',
                opName: 'read'
              },
            ]); 
        }]
      }
    })

    .state({
      name: 'productManage',
      templateUrl: appRootPath + 'product/manage.html',
      url: '/product/manage',
      controller: 'ProductPageCtrler as ctrler',
      resolve: {
        condition1 : ['myValidation', function(myValidation) {
          //if this promise is rejected, then the transition will fail
          return myValidation.checkPermission([
              {
                listName: 'Product',
                opName: ['create', 'update', 'delete']
              },
            ]); 
        }]
      }
    })

    .state({
      name: 'productType',
      templateUrl: appRootPath + 'product/product-type.html',
      url: '/product/product-type',
      controller: 'ProductTypePageCtrler as ctrler',
      resolve: {
        condition1 : ['myValidation', function(myValidation) {
          //if this promise is rejected, then the transition will fail
          return myValidation.checkPermission([
              {
                listName: 'ProductType',
                opName: ['create', 'read']
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

    //$urlRouterProvider.when('', '/');
    $urlRouterProvider.otherwise('/');

    localStorageServiceProvider.setPrefix('mainApp').setNotify(false, false);

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

    //buttons on nav bar
    $rootScope.openShopCart = function() {
      if($rootScope.productPageCtrler) {
        $rootScope.productPageCtrler.openShopCart();
      }
    }
    
    $rootScope.openProductEdit = function() {
      if($rootScope.productPageCtrler) {
        $rootScope.productPageCtrler.openProductEditModal();
      }
    }

    $rootScope.openProductTypeEdit = function() {
      if($rootScope.productTypePageCtrler) {
        $rootScope.productTypePageCtrler.openEditModal();
      }
    }

    $rootScope.openCachedFarmerList = function() {
      var modalInstance = $uibModal.open({
        templateUrl: appRootPath + 'farmer/farmerList.html',
        controller: 'CachedFarmerListCtrler as ctrler',
        size: 'lg', //'md','lg','sm'
      });

      modalInstance.result
      .catch(function () {
        modalInstance.close(); 
      });
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

