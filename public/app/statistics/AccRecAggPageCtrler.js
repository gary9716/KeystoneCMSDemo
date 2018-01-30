angular.module('mainApp')
.controller('AccRecAggPageCtrler', 
  ['$http', '$window', '$state', '$rootScope', 'lodash', 'localStorageService', '$uibModal',
  function($http, $window, $state, $rootScope, _ , localStorageService, $uibModal ) {
    var vm = this;
    vm.aggregateData = {};
        
    var nowDate = new Date();
    nowDate.setFullYear(nowDate.getFullYear() - 1, 6, 1); //July first in previous year
    vm.startDateFilter = nowDate;

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

    vm.setAggregateResult = function(result) {
        var aggResult = {};
        result.countOpTypeAndSumAmount.forEach(function(opTypeInfo) {
            aggResult[opTypeInfo._id] = opTypeInfo;
        });
        vm.aggregateData.totalActiveBalance = result.totalActiveBalance;
        vm.aggregateData.accRecsAgg = aggResult;
    }

    vm.aggregateAccRecs = function() {
        vm.isAggregating = true;
        vm.aggregateData.accRecsAgg = undefined;

        vm.aggregateData.startDate = vm.filters.date && _.isDate(vm.filters.date.$gte) ? new Date(vm.filters.date.$gte): undefined;
        vm.aggregateData.endDate = vm.filters.date && _.isDate(vm.filters.date.$lt) ? new Date(vm.filters.date.$lt): undefined;
        if(vm.aggregateData.endDate)
            vm.aggregateData.endDate.setHours(-24,0,0,0); //to make filename normal
        
        $http.post('/api/account-rec/aggregate',vm.filters)
        .then(function(res) {
            var data = res.data;
            if(data.success) {
                vm.pubSuccessMsg('統計成功');
                vm.setAggregateResult(data.result);
            }
            
        })
        .catch(function(err) {
            vm.pubErrorMsg('統計失敗,', err.data.toString());
        })
        .finally(function() {
            vm.isAggregating = false;
        });
    }

    vm.downloadAccRecsAggInfoPDF = function() {
        vm.isDownloading = true;
        $http.post('/pdf/acc-recs-aggregate',
        {
            startDate: vm.aggregateData.startDate,
            endDate: vm.aggregateData.endDate,
            accRecsAgg: vm.aggregateData.accRecsAgg,
            totalActiveBalance: vm.aggregateData.totalActiveBalance
        })
        .then(function(res) {
            var filename = res.data.filename;
            var file = new Blob([new Uint8Array(res.data.content.data)],{type: 'application/pdf'});
            saveAs(file, filename);

            vm.pubSuccessMsg('下載兌領統計表成功');
        })
        .catch(function(err) {
            vm.pubErrorMsg('下載兌領統計表失敗,', err.data.toString());
        })
        .finally(function(){
            vm.isDownloading = false;
        });
    }

  }]
);
