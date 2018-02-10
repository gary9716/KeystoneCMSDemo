angular.module('mainApp')
.controller('AccRecAggPageCtrler', 
  ['$http', '$window', '$state', '$rootScope', 'lodash', 'localStorageService', '$uibModal',
  function($http, $window, $state, $rootScope, _ , localStorageService, $uibModal ) {
    var vm = this;
    
    /*
    var nowDate = new Date();
    nowDate.setFullYear(nowDate.getFullYear() - 1, 6, 1); //July first in previous year
    vm.startDateFilter = nowDate;
    */

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
        var opTypes = ['create','close','freeze','unfreeze', 'deposit', 'withdraw', 'transact', 'accUserChange', 'annuallyWithdraw'];

        result.countOpTypeAndSumAmount.forEach(function(opTypeInfo) {
            aggResult[opTypeInfo._id] = opTypeInfo;
        });

        opTypes.forEach(function(opType) {
            if(!aggResult[opType])
                aggResult[opType] = {
                    _id: opType,
                    count: 0,
                    amount: 0
                };
        });

        var accTypes = ['all','freeze','unfreeze'];
        var accAgg = {};
        
        accTypes.forEach(function(accType) {
            accAgg[accType] = { count: 0, balance: 0 };
        })

        result.aggAcc.forEach(function(acc) {
            if(acc._id.freeze) {
                accAgg['freeze'].count += acc.count;
                accAgg['freeze'].balance += acc.balance;
            }
            else {
                accAgg['unfreeze'].count += acc.count;
                accAgg['unfreeze'].balance += acc.balance;
            }

            accAgg['all'].count += acc.count;
            accAgg['all'].balance += acc.balance;

        });

        vm.aggregateData.accAgg = accAgg;
        vm.aggregateData.accRecsAgg = aggResult;
    }

    vm.aggregateAccRecs = function(tag) {
        vm.isAggregating = true;
        
        if(!vm.aggregateData) 
            vm.aggregateData = {};

        delete vm.aggregateData.accAgg;
        delete vm.aggregateData.accRecsAgg;

        vm.aggregateData.startDate = vm.filters.date && _.isDate(vm.filters.date.$gte) ? new Date(vm.filters.date.$gte): undefined;
        vm.aggregateData.endDate = vm.filters.date && _.isDate(vm.filters.date.$lt) ? new Date(vm.filters.date.$lt): undefined;
        if(vm.aggregateData.endDate)
            vm.aggregateData.endDate.setHours(-24,0,0,0); //to make filename normal
        
        $http.post('/api/account-rec/aggregate',{
            filters: vm.filters
        })
        .then(function(res) {
            var data = res.data;
            if(data.success) {
                vm.setAggregateResult(data.result);
                vm.pubSuccessMsg('統計成功');
            }
        })
        .catch(function(err) {
            var msg = err && err.data? err.data.toString():(err? err.toString(): '');
            vm.pubErrorMsg('統計失敗,'+ msg);
        })
        .finally(function() {
            vm.isAggregating = false;
        });
    }

    vm.downloadAccRecsAggInfoPDF = function(tag) {
        vm.isDownloading = true;
        $http.post('/pdf/acc-recs-aggregate',
        {
            tag: tag,
            startDate: vm.aggregateData.startDate,
            endDate: vm.aggregateData.endDate,
            accRecsAgg: vm.aggregateData.accRecsAgg,
            accAgg: vm.aggregateData.accAgg
        })
        .then(function(res) {
            var filename = res.data.filename;
            var file = new Blob([new Uint8Array(res.data.content.data)],{type: 'application/pdf'});
            saveAs(file, filename);
            if(tag === 'all')
                vm.pubSuccessMsg('下載交易匯總統計表成功');
            else
                vm.pubSuccessMsg('下載年度結清總表成功');

        })
        .catch(function(err) {
            var msg = err && err.data? err.data.toString():(err? err.toString(): '');
            if(tag === 'all')
                vm.pubErrorMsg('下載交易匯總統計表失敗,'+ msg);
            else
                vm.pubErrorMsg('下載年度結清總表失敗,'+ msg);
        })
        .finally(function(){
            vm.isDownloading = false;
        });
    }

  }]
);
