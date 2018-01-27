angular.module('mainApp')
.controller('TransListPageCtrler', 
  ['$http', '$window', '$state', '$rootScope', 'lodash', 'localStorageService', '$uibModal',
  function($http, $window, $state, $rootScope, _ , localStorageService, $uibModal ) {
    
    var vm = this;

    vm.filters = {};
    vm.shopFilterSelected = function() {
        if(vm.shopFilter && vm.shopFilter !== 'any')
            vm.applyShopFilter = true;
    }

    vm.filterChange = function() {
        var filters = {};

        if(vm.applyShopFilter && vm.shopFilter && vm.shopFilter !== 'any') {
            filters.shop = vm.shopFilter;
        }

        if(!_.isDate(vm.endDateFilter) || vm.endDateFilter < vm.startDateFilter) {
            vm.endDateFilter = vm.startDateFilter;
        }

        if(vm.applyDateFilter && _.isDate(vm.startDateFilter)) {
            var start = new Date(vm.startDateFilter);
            start.setHours(0,0,0,0);
            var end = new Date(vm.endDateFilter);
            end.setHours(24,0,0,0);
            filters.date = { $gte: start, $lt: end };
        }

        vm.filters = filters;
        vm.getTransactionData();
    }

    vm.getShops = function() {
        $http.post('/api/read', {
            listName: 'Shop'
        })
        .then(function(res) {
            var data = res.data;
            if(data.success) {
                vm.shops = data.result;
            }
        })
        .catch(function(err) {
            $rootScope.pubErrorMsg('讀取兌領處資訊失敗,' + err.data.toString());
        });
    }

    vm.perPage = 10;
    vm.curPage = 1;
    
    vm.getTransactionData = function() {
        $http.post('/api/read', {
            listName: 'Transaction',
            filters: vm.filters,
            sort: '-date',
            populate: 'trader shop account',
            page: vm.curPage,
            perPage: vm.perPage
        })
        .then(function(res) {
            var data = res.data;
            if(data.success) {
                vm.transactions = data.result;
                vm.totalTrans = data.total;
            }
            else {
                $rootScope.pubErrorMsg('讀取兌領記錄失敗,' + data.message);
            }
        })
        .catch(function(err) {
            $rootScope.pubErrorMsg('讀取兌領記錄失敗,' + err.data.toString());
        });
    }

    var updateTrans = function(trans) {
        $http.post('/api/transaction/update', {
            _id: trans._id,
            products: trans.products,
        })
        .then(function(res) {
            var data = res.data;
            if(data.success) {
                //refresh data
                vm.getTransactionData();
                $rootScope.pubSuccessMsg('更新兌領紀錄成功');
            }
            else {
                $rootScope.pubErrorMsg('更新兌領紀錄失敗,' + data.message);
            }
        })
        .catch(function(err) {
            $rootScope.pubErrorMsg('更新兌領紀錄失敗,' + err.data.toString());
        });
    }

    vm.deleteTrans = function(trans) {
        if($window.confirm('你確定要刪除此兌領紀錄嗎')) {
            $http.post('/api/transaction/delete', {
                _id: trans._id,
            })
            .then(function(res) {
                var data = res.data;
                if(data.success) {
                    //refresh data
                    vm.getTransactionData();
                    $rootScope.pubSuccessMsg('刪除兌領紀錄成功');
                }
                else {
                    $rootScope.pubErrorMsg('刪除兌領紀錄失敗,' + data.message);
                }
            })
            .catch(function(err) {
                $rootScope.pubErrorMsg('刪除兌領紀錄失敗,' + err.data.toString());
            });
        }
    }

    vm.openProductsModal = function(singleTrans, mode) {
        var modalInstance = $uibModal.open({
            templateUrl: 'trans-detail-and-edit-modal.html',
            controller: 'TransProductsModal as ctrler',
            size: 'lg', //'md','lg','sm'
            resolve: {
                transaction: function() {
                    return singleTrans;
                },
                mode: function() {
                    return mode;
                }
            }
          });
    
          modalInstance.result
          .then(function (newTrans) {
            updateTrans(newTrans);
          })
          .catch(function () { 
            modalInstance.close(); 
          });
    }


  }]
)
.controller('TransProductsModal',
    ['$uibModalInstance', 'lodash', 'transaction', 'mode',
     function($uibModalInstance, _, transaction, mode) {
        var vm = this;
        var transClone = _.clone(transaction);
        vm.products = transClone.products;

        vm.changeQty = function(item, val) {
            item.qty += val;
        }

        vm.rmItem = function(item) {
            if(vm.products) {
                var index = _.findIndex(vm.products, function(product) {
                    return product.pid === item.pid;
                });
                if(index !== -1)
                    vm.products.splice(index, 1);
            }
        }
    
        vm.getTotal = function() {
            if(vm.products) {
                var total = 0;
                vm.products.forEach(function(product) {
                    total += (product.price * product.qty);
                });
                return total;
            }
            else {
                return 0;
            }
        }

        vm.isMode = function(val) {
            return val === mode;
        }

        vm.updateTrans = function() {
            $uibModalInstance.close(transClone);
        }

        vm.cancel = function() {
            $uibModalInstance.dismiss();
        }

     }]
);