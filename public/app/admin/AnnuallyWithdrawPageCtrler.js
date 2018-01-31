angular.module('mainApp')
.controller('AnnuallyWithdrawPageCtrler', 
  ['$http', '$window', '$rootScope', '$uibModal', 'lodash','localStorageService', 'appRootPath',
  function($http, $window, $rootScope, $uibModal, _ , localStorageService, appRootPath) {
    var vm = this;
    
    var thisYear = new Date();
    thisYear.setDate(1);
    thisYear.setMonth(0);

    vm.cancelAWDate = thisYear;
    vm.downloadAWDate = thisYear;

    vm.doAW = function() {
        vm.isProcessing = true;
        $http.post('/api/account/annually-withdraw',{
            code: vm.code
        })
        .then(function(res) {
            var data = res.data;
            if(data.success) {
                var filename = data.filename;
                var file = new Blob([new Uint8Array(data.content.data)],{type: 'text/plain'});
                saveAs(file, filename);

                vm.checkCode = data.checkCode;
                $rootScope.pubSuccessMsg('年度結算執行成功,已下載媒體擋');
            }
        })
        .catch(function(err) {
            var msg = err && err.data? err.data.toString():(err? err.toString(): '');
            $rootScope.pubErrorMsg('年度結算執行失敗,'+ msg);
        })
        .finally(function() {
            vm.isProcessing = false;
        });
    }

    vm.cancelAW = function() {
        vm.isProcessing = true;
        $http.post('/api/account/cancel-annually-withdraw',{
            date: vm.cancelAWDate
        })
        .then(function(res) {
            var data = res.data;
            if(data.success) {
                $rootScope.pubSuccessMsg('年度結算撤銷成功');
            }
        })
        .catch(function(err) {
            var msg = err && err.data? err.data.toString():(err? err.toString(): '');
            $rootScope.pubErrorMsg('年度結算撤銷失敗,'+ msg);
        })
        .finally(function() {
            vm.isProcessing = false;
        });
    }

    vm.downloadAWFile = function() {
        vm.isProcessing = true;
        $http.post('/api/account/gen-annually-withdraw-file', {
            code: vm.code,
            date: vm.downloadAWDate
        })
        .then(function(res) {
            var data = res.data;
            if(data.success) {
                var filename = data.filename;
                var file = new Blob([new Uint8Array(data.content.data)],{type: 'text/plain'});
                saveAs(file, filename);

                $rootScope.pubSuccessMsg('年度結算媒體檔已下載');
            }
        })
        .catch(function(err) {
            var msg = err && err.data? err.data.toString():(err? err.toString(): '');
            $rootScope.pubErrorMsg('年度結算媒體檔下載失敗,'+ msg);
        })
        .finally(function() {
            vm.isProcessing = false;
        });
    }

  }]
);