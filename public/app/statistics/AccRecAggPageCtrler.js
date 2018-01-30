angular.module('mainApp')
.controller('AccRecAggPageCtrler', 
  ['$http', '$window', '$state', '$rootScope', 'lodash', 'localStorageService', '$uibModal',
  function($http, $window, $state, $rootScope, _ , localStorageService, $uibModal ) {
    var vm = this;

    vm.initDateFilter = function() {

    }

    vm.opTypeSelected = function() {

    }

    vm.filterChange = function() {

    }

    vm.pubSuccessMsg = function(msg) {
        $rootScope.pubSuccessMsg(msg);
    }

    vm.pubWarningMsg = function(msg) {
        $rootScope.pubWarningMsg(msg);
    }

    vm.pubInfoMsg = function(msg) {
        $rootScope.pubInfoMsg(msg);
    }

    vm.pubErrorMsg = function(msg) {
        $rootScope.pubErrorMsg(msg);
    }

  }]
);
