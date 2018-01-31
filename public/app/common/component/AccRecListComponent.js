angular.module('mainApp')
.controller('AccRecListCtrler',[
    '$http', 'lodash', '$window', '$uibModal',
    function($http, _, $window, $uibModal) {
        var vm = this;
        
        //official hooks
        vm.$onInit = function() {
            vm.curPage = 1;
            
            vm.refreshAccRecs = vm.getAccountRecords;
            vm.updateRecFunc = vm.updateRecOp;
            vm.downloadDWSheetFunc = vm.downloadDWSheetOp;

            vm.initDateFilter();
            vm.filterChange();
        }

        /*
        vm.$onChanges = function (changes) {
        
        }
        */
        
        var opTranslate = {
            'any': '任何',
            'transact': '兌換',
            'deposit': '入款',
            'withdraw': '提款',
            'close': '結清',
            'freeze': '凍結',
            'unfreeze': '解凍',
            'create': '開戶',
            'accUserChange': '過戶'
        };

        vm.opTypes = [];
        for(let prop in opTranslate) {
            vm.opTypes.push({
                name: opTranslate[prop],
                value: prop 
            });
        }

        vm.initDateFilter = function() {     
            var todayStart = new Date();
            todayStart.setHours(0,0,0,0);
            
            if(!_.isDate(vm.startDateFilter))
                vm.startDateFilter = todayStart;
            
            if(!_.isDate(vm.endDateFilter))
                vm.endDateFilter = todayStart;
            
            vm.applyDateFilter = true;
        }

        vm.getAccountRecords = function() {  
            $http.post('/api/read', {
                listName: 'AccountRecord',
                filters: vm.filters,
                sort: '-date',
                populate: 'operator period account',
                select: 'opType account amount date operator comment period ioAccount transaction',
                page: vm.curPage,
                perPage: vm.perPage
            })
            .then(function(res) {
                var data = res.data;
                if(data.success) {
                    data.result.forEach(function(rec) {
                        rec.opType = {
                            name: opTranslate[rec.opType],
                            value: rec.opType
                        };
                    });
                    vm.accountRecs = data.result;
                    vm.totalAccRecs = data.total;
                    if(vm.getAccRecSuccessCB)
                        vm.getAccRecSuccessCB({ accRecs: vm.accountRecs, totalCount: vm.totalAccRecs });
                }
                else {
                    if(vm.getAccRecErrorCB)
                        vm.getAccRecErrorCB({ msg: ('讀取操作記錄失敗,' + data.message) });
                }
            })
            .catch(function(err) {
                var msg = err && err.data? err.data.toString():(err? err.toString(): '');
                if(vm.getAccRecErrorCB)
                    vm.getAccRecErrorCB({ msg: ('讀取操作記錄失敗,' + msg) });
            });
        }

        vm.opTypeFilterSelected = function() {
            if(vm.opTypeFilter && vm.opTypeFilter !== 'any')
                vm.applyOpTypeFilter = true;
        }
    
        vm.datePickerChange = function() {
            if(_.isDate(vm.endDateFilter) || _.isDate(vm.startDateFilter)) {
                vm.applyDateFilter = true;
            }
        }
    
        vm.filterChange = function() {
            var filters = {};
            if(vm.account) {
                filters.account = vm.account._id;
            }
        
            if(vm.applyOpTypeFilter && vm.opTypeFilter && vm.opTypeFilter !== 'any') {
                filters.opType = vm.opTypeFilter;
            }
        
            if(_.isDate(vm.endDateFilter) && vm.endDateFilter < vm.startDateFilter) {
                vm.endDateFilter = vm.startDateFilter;
            }
        
            if(vm.applyDateFilter) {
        
                if(_.isDate(vm.startDateFilter)) {
                    var start = new Date(vm.startDateFilter);
                    start.setHours(0,0,0,0);
                    
                    if(_.isDate(vm.endDateFilter)) {
                        var end = new Date(vm.endDateFilter);
                        end.setHours(24,0,0,0);
                        filters.date = { $gte: start, $lt: end };
                    }
                    else {
                        filters.date = { $gte: start };
                    }
                }
                else if(_.isDate(vm.endDateFilter)) {
                    var end = new Date(vm.endDateFilter);
                    end.setHours(24,0,0,0);
                    filters.date = { $lt: end };
                }
                
            }
        
            vm.filters = filters;
            vm.getAccountRecords(); 
        }

        vm.isActCountZero = function(accRec) {
            var opType = accRec.opType.value;
            if(opType === 'freeze' || 
                opType === 'unfreeze' ||
                opType === 'create' || 
                opType === 'accUserChange') {
                return true;
                }
            else 
                return false;
        }
      
        vm.hasAct = function(accRec, act) {
            var opType = accRec.opType.value;
            if(opType === 'freeze' || 
              opType === 'unfreeze' ||
              opType === 'create' || 
              opType === 'accUserChange') {
                return false;
              }
            else if(opType === 'transact') {
                if(act === 'delete' || act === 'update' || act === 'detail')
                  return true;
                else
                  return false;
            }
            else if(opType === 'close') {
                if(act === 'delete') {
                  return true;
                }
                else {
                  return false;
                }
            }
            else if(opType === 'deposit' ||
                    opType === 'withdraw') {
                if(act === 'delete' || act === 'download' || act === 'update')
                  return true;
                else
                  return false;
            }
        }

        vm.deleteRec = function(accRec) {
            if($window.confirm('即將刪除此記錄, 確定嗎')) {
              $http.post('/api/account-rec/delete', accRec)
              .then(function(res) {
                var data = res.data;
                if(data.success) {
                  if(vm.deleteAccRecSuccessCB)
                    vm.deleteAccRecSuccessCB({ msg: '刪除紀錄成功,已更新畫面' });
                  
                  if(vm.edittingRec && accRec._id === vm.edittingRec._id) {
                    vm.edittingRec = undefined;
                  }

                  if(vm.account)
                    _.assign(vm.account, data.result);

                  vm.getAccountRecords();
                }
              })
              .catch(function(err) {
                var msg = err && err.data? err.data.toString():(err? err.toString(): '');
                if(vm.deleteAccRecErrorCB)
                    vm.deleteAccRecErrorCB({ msg: '刪除紀錄失敗,' + msg});
              });
              
            }
        }
      
        vm.selectEdittingRec = function(accRec, readOnly) {
            vm.edittingRec = _.clone(accRec);
            if(vm.edittingRec.opType.value === 'transact') {
                //fetch transaction data
                $http.post('/api/read/',{
                    listName: 'Transaction',
                    filters: {
                        _id: accRec.transaction
                    }
                })
                .then(function(res) {
                    var data = res.data;
                    if(data.success) {
                        vm.edittingRec.products = data.result[0].products;
                    }
                })
                .catch(function(err) {
                    var msg = err && err.data? err.data.toString():(err? err.toString(): '');
                    if(vm.getTransErrorCB)
                        vm.getTransErrorCB({ msg:'抓取兌領紀錄失敗,' + msg });
                });
            }
            else {
                vm.edittingRec.period = vm.edittingRec.period ? vm.edittingRec.period.name : vm.edittingRec.period;
            }
            vm.edittingRec.readOnly = readOnly;
            vm.accountOp = 'update-rec';
            if(vm.accRecEditMode === 'modal') {
                vm.openAccRecEditModal();
            }
        }
      
        vm.updateRecOp = function() {
            var accRec = vm.edittingRec;
            if(accRec.opType.value === 'transact') {
                if(!accRec.products || accRec.products.length === 0) {
                    if(vm.updateAccRecErrorCB)
                        vm.updateAccRecErrorCB({ msg: '產品列表不能為空的,不然就請刪除此紀錄' });
                    return;
                }
            }
        
            vm.isProcessing = true;
            $http.post('/api/account-rec/update', accRec)
            .then(function(res) {
                var data = res.data;
                if(data.success) {
                    if(vm.account)
                        _.assign(vm.account, data.result.account);
                    vm.getAccountRecords();
                    vm.edittingRec = undefined;
                    if(vm.updateAccRecSuccessCB)
                        vm.updateAccRecSuccessCB({ msg:'更新存摺紀錄成功,已更新畫面' });
                }
            })
            .catch(function(err) {
                var msg = err && err.data? err.data.toString():(err? err.toString(): '');
                if(vm.updateAccRecErrorCB)
                    vm.updateAccRecErrorCB({ msg:'更新存摺紀錄失敗,' + msg });
            })
            .finally(function(){
                vm.isProcessing = false;
            });
        }

        vm.downloadDWSheetOp = function(accRec, op, msg) {
            vm.isProcessing = true;
            return $http.post('/pdf/deposit-withdraw-sheet',
            {
              op: op,
              _id: accRec._id? accRec._id : accRec
            })
            .then(function(res) {
              var filename = res.data.filename;
              var file = new Blob([new Uint8Array(res.data.content.data)],{type: 'application/pdf'});
              saveAs(file, filename);
      
              if(vm.downloadDWSheetSuccessCB) {
                if(msg)
                    vm.downloadDWSheetSuccessCB({ msg: (msg + ',轉帳單已下載') });
                else
                    vm.downloadDWSheetSuccessCB({ msg: '下載轉帳單成功' });
              }
              
            })
            .catch(function(err) {
                var msg = err && err.data? err.data.toString():(err? err.toString(): '');
                if(vm.downloadDWSheetErrorCB)
                    vm.downloadDWSheetErrorCB({ msg: '下載轉帳單失敗,' + msg });
            })
            .finally(function(){
              vm.isProcessing = false;
            });
        }
      
        vm.downloadRecPDF = function(accRec) {
            if(accRec.opType.value === 'withdraw' || accRec.opType.value === 'deposit') {
              vm.downloadDWSheetOp(accRec, accRec.opType.value);
            }
        }

        vm.openAccRecEditModal = function() {
            var modalSize = vm.edittingRec.opType.value === 'transact'? 'lg':'md';
            var modalInstance = $uibModal.open({
                templateUrl: 'acc-rec-edit.html', 
                controller: 'AccRecEditModalCtrler as ctrler',
                size: modalSize, //'md','lg','sm'
                resolve: { //used for passing parameters to modal controller
                  accRec: function() {
                      return vm.edittingRec;
                  }
                }
              });
        
              modalInstance.result
              .then(function() {
                vm.updateRecOp();
              })
              .catch(function () { 
                vm.edittingRec = undefined;
                modalInstance.close(); 
              });
        }
    }]
)
.controller('AccRecEditModalCtrler', [
    '$uibModalInstance', 'accRec', '$scope', '$http',
    function($uibModalInstance, accRec, $scope, $http) {
        var vm = this;
        vm.edittingRec = accRec;
        vm.isModalMode = true;

        vm.getPeriods = function(keyword) {
            return $http.post('/api/read', {
              listName: 'Period',
              contains: { name: keyword },
              limit: 8,
            })
            .then(function(res) {
              if(res.data.success) {
                return res.data.result;
              }
              else {
                return $q.reject();
              }
            });
        }


        vm.changeQty = function(item, val) {
            item.qty += val;
        }
  
        vm.rmItem = function(item) {
            if(vm.edittingRec.products) {
            var index = _.findIndex(vm.edittingRec.products, function(product) {
                return product.pid === item.pid;
            });
            if(index !== -1)
                vm.edittingRec.products.splice(index, 1);
            }
        }
  
        vm.getTotal = function() {
            if(vm.edittingRec && vm.edittingRec.products) {
            var total = 0;
            vm.edittingRec.products.forEach(function(product) {
                total += (product.price * product.qty);
            });
    
            return total;
            }
            else {
            return 0;
            }
        }

        vm.isUpdateRecButtonDisabled = function() {
            if(vm.edittingRec) {
                if(vm.edittingRec.opType.value === 'transact') {
                    return (vm.isProcessing || ($scope.accountOpForm.editRecItemQty && $scope.accountOpForm.editRecItemQty.$invalid));
                }
                else if(vm.edittingRec.opType.value === 'withdraw' || vm.edittingRec.opType.value === 'deposit') {
                    return (vm.isProcessing || $scope.accountOpForm.editRecAmount.$invalid);
                }
            }
            else {
                return false;
            }
        }

        vm.updateRec = function() {
            $uibModalInstance.close();
        }

        vm.cancel = function() {
            $uibModalInstance.dismiss('cancel');
        }


    }]
)
.component('accRecList', {
    templateUrl: locals.appRootPath + 'common/component/acc-rec-list.html',
    bindings: {
        perPage : '@', //constant
        showAccField : '<',
        showOperatorField : '<',
        accRecEditMode: '@',
        
        curPage : '=?',
        account : '=?',
        filters : '=?',
        opTypeFilter: '=?',
        applyDateFilter: '=?',
        startDateFilter: '=?',
        endDateFilter: '=?',
        accountOp: '=?',
        edittingRec: '=?',
        isProcessing: '=?',

        //exposed functions
        refreshAccRecs : '=?',
        updateRecFunc: '=?',
        downloadDWSheetFunc: '=?',

        //callbacks
        getAccRecErrorCB: '&',
        getAccRecSuccessCB: '&',

        updateAccRecErrorCB: '&',
        updateAccRecSuccessCB: '&',

        deleteAccRecErrorCB: '&',
        deleteAccRecSuccessCB: '&',

        getTransErrorCB: '&',
        getTransSuccessCB: '&',

        downloadDWSheetSuccessCB: '&',
        downloadDWSheetErrorCB: '&',
    },
    controller: 'AccRecListCtrler as ctrler'
});
  