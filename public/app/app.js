//Specify all dependencies and config provider

// Define the `mainApp` module
angular.module('mainApp', [
  // ...which depends on the modules below  
	'ngAnimate',
	'ngLodash',
  'ui.router',
  //'angular.filter',
  'ui.bootstrap',
  'ngCart',
  'LocalStorageModule',
  'ngFileUpload'
])
.constant('appRootPath',(function() {
  if(locals.env === 'production') {
    locals.appRootPath = '/app-min/';
  }
  else {
    locals.appRootPath = '/app/';
  }
  return locals.appRootPath;

})())
.constant('cachedFarmersKey', 'mainApp:cachedFarmers');//to inject into config, we need to register this value as constant

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
      name: 'home',
      templateUrl: appRootPath + 'home/index.html',
      controller: 'HomeCtrler as ctrler',
      url: '/',
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
                opName: createOp
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
                opName: readOp
              },

            ]); 
        }]
      }

    })
    .state({
      name: 'farmerDetail',
      templateUrl: appRootPath + 'farmer/detail.html',
      url: '/farmer/detail',
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
                opName: readOp
              },

              {
                listName: 'Account',
                opName: readOp
              },
              
              {
                listName: 'AccountRecord',
                opName: readOp
              },
            ]); 
        }]
      }

    })

    .state({
      name: 'product',
      templateUrl: appRootPath + 'product/index.html',
      url: '/product',
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
                opName: readOp
              },
              
              {
                listName: 'Farmer',
                opName: readOp
              },

              {
                listName: 'Account',
                opName: [readOp, updateOp]
              },

              {
                listName: 'AccountRecord',
                opName: createOp
              },

              {
                listName: 'Transaction',
                opName: createOp
              }

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
                opName: [createOp, readOp, updateOp, deleteOp]
              },
              {
                listName: 'ProductType',
                opName: [createOp, readOp, updateOp, deleteOp]
              },
            ]); 
        }]
      }
    })
    
    .state({
      name: 'statistics',
      templateUrl: appRootPath + 'statistics/index.html',
      url: '/statistics'
    })

    .state({
      name: 'transStatisData',
      templateUrl: appRootPath + 'statistics/transaction-list.html',
      url: '/statistics/transaction',
      controller: 'TransListPageCtrler as ctrler',
      resolve: {
        condition1 : ['myValidation', function(myValidation) {
          //if this promise is rejected, then the transition will fail
          return myValidation.checkPermission([
              {
                listName: 'Transaction',
                opName: readOp
              },
              {
                listName: 'AccountRecord',
                opName: readOp
              }
            ]); 
        }]
      }
    })

    .state({
      name: 'accRecStatisData',
      templateUrl: appRootPath + 'statistics/acc-rec-aggregate.html',
      url: '/statistics/acc-rec-aggregate',
      controller: 'AccRecAggPageCtrler as ctrler',
      resolve: {
        condition1 : ['myValidation', function(myValidation) {
          //if this promise is rejected, then the transition will fail
          return myValidation.checkPermission([
            {
              listName: 'Transaction',
              opName: readOp
            },
            {
              listName: 'AccountRecord',
              opName: readOp
            }
          ]); 
        }]
      }
    })

    .state({
      name: 'admin',
      templateUrl: appRootPath + 'admin/index.html',
      url: '/admin-front',
      resolve: {
        condition1 : ['myValidation', function(myValidation) {
          //if this promise is rejected, then the transition will fail
          return myValidation.isAdmin(locals.user);
        }]
      }
    })

    .state({
      name: 'adminAnnuallyWithdraw',
      templateUrl: appRootPath + 'admin/annually-withdraw.html',
      url: '/admin-front/annually-withdraw',
      controller: 'AnnuallyWithdrawPageCtrler as ctrler',
      resolve: {
        condition1 : ['myValidation', function(myValidation) {
          //if this promise is rejected, then the transition will fail
          return myValidation.isAdmin(locals.user);
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
    
    if(locals.user && locals.user.shop && locals.user.shop !== '') {
      $http.post(
        '/api/read',
        {
          listName: 'Shop',
          filters: {
            _id: locals.user.shop
          }
        }
      )
      .then(function(res) {
        if(res.data.success) {
          $rootScope.locals.user.shopName = res.data.result[0].name;
        }
  
      })
      .catch(function(err) {
        console.log(err);
      });
    }

    

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

