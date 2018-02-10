angular.module('mainApp')
.controller('AnnuallyWithdrawPageCtrler', 
  ['$http', '$window', '$rootScope', '$uibModal', 'lodash','localStorageService', 'appRootPath',
  function($http, $window, $rootScope, $uibModal, _ , localStorageService, appRootPath) {
    var vm = this;
    
    var thisYear = new Date();
    vm.cancelAWDate = thisYear;
    vm.downloadAWDate = thisYear;
    vm.doAWDate = new Date(thisYear.getFullYear() + '/06/30');
    vm.doAWDate.setHours(12,0,0,0);
    vm.code = '000';

    vm.doAW = function() {
        vm.isProcessing = true;
        $http.post('/api/account/annually-withdraw',{
            code: vm.code,
            date: vm.doAWDate
        })
        .then(function(res) {
            var data = res.data;
            if(data.success) {
                var filename = data.filename;
                var file = new Blob([new Uint8Array(data.content.data)],{type: 'text/plain'});
                saveAs(file, filename);

                vm.checkCode = data.checkCode;
                $rootScope.pubSuccessMsg('年度結清執行成功,已下載媒體檔');
            }
        })
        .catch(function(err) {
            var msg = err && err.data? err.data.toString():(err? err.toString(): '');
            $rootScope.pubErrorMsg('年度結清執行失敗,'+ msg);
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
            vm.checkCode = undefined;
            var data = res.data;
            if(data.success) {
                $rootScope.pubSuccessMsg('年度結清撤銷成功');
            }
        })
        .catch(function(err) {
            var msg = err && err.data? err.data.toString():(err? err.toString(): '');
            $rootScope.pubErrorMsg('年度結清撤銷失敗,'+ msg);
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
                var file = new Blob([new Uint8Array(data.content.data)],{type: "text/plain;charset=big-5"});
                saveAs(file, filename);

                $rootScope.pubSuccessMsg('年度結清媒體檔已下載');
            }
        })
        .catch(function(err) {
            var msg = err && err.data? err.data.toString():(err? err.toString(): '');
            $rootScope.pubErrorMsg('年度結清媒體檔下載失敗,'+ msg);
        })
        .finally(function() {
            vm.isProcessing = false;
        });
    }

  }]
);