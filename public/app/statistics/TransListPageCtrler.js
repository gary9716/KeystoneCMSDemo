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

    vm.datePickerChange = function() {
        if(_.isDate(vm.endDateFilter) || _.isDate(vm.startDateFilter)) {
            vm.applyDateFilter = true;
        }
    }

    vm.filterChange = function() {
        var filters = {};

        if(vm.applyShopFilter && vm.shopFilter && vm.shopFilter !== 'any') {
            filters.shop = vm.shopFilter;
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
        vm.aggregateData = {};
        vm.getTransactionData();
    }

    var shopInfoMap = {};
    vm.getShops = function() {
        $http.post('/api/read', {
            listName: 'Shop'
        })
        .then(function(res) {
            var data = res.data;
            if(data.success) {
                vm.shops = data.result;
                vm.shops.forEach(function(shop) {
                    shopInfoMap[shop._id] = shop;
                });
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

    var productInfoMap = {};
    var setAggregateResult = function(result) {
        var productsInfo = result.basicInfo;
        var productByShop = result.productByShop;

        productsInfo.forEach(function(productInfo) {
            productInfo._id = productInfo._id.pid;
            productInfoMap[productInfo._id] = productInfo;
        });

        vm.aggregateData.products = productByShop.map(function(info) {
            _.assign(info._id, productInfoMap[info._id.pid]);
            info.totalMoney = info._id.price * info.qty;
            info.totalWeight = info._id.weight * info.qty;
            info._id.shop = shopInfoMap[info._id.shop];
            return info;
        });
        if(vm.aggregateData.products) {
            vm.aggregateData.products.sort(function(p1, p2) {
                var pid1 = p1._id.pid.toUpperCase();
                var pid2 = p2._id.pid.toUpperCase();
                if(pid1 < pid2) {
                    return -1;
                }
                else if(pid1 > pid2) {
                    return 1;
                }
                else 
                    return 0;
            });
        }


        vm.aggregateData.transCount = result.transCount;

        //console.log(vm.aggregateData.products);
    };

    vm.getAggVal = function(name) {
        if(vm.aggregateData.products) {
            var total = 0;
            if(name === 'qty') {
                vm.aggregateData.products.forEach(function(product) {
                    total += product.qty;
                });
            }
            else if(name === 'money') {
                vm.aggregateData.products.forEach(function(product) {
                    total += product.totalMoney;
                });
            }
            else if(name === 'weight') {
                vm.aggregateData.products.forEach(function(product) {
                    total += product.totalWeight;
                });
            }
            return total;
        }
        else 
            return 0;
    }




    vm.aggregateData = {};
    vm.aggregateProducts = function() {
        vm.aggregateData.products = undefined;
        vm.isAggregating = true;

        vm.aggregateData.startDate = vm.filters.date && _.isDate(vm.filters.date.$gte) ? new Date(vm.filters.date.$gte): undefined;
        vm.aggregateData.endDate = vm.filters.date && _.isDate(vm.filters.date.$lt) ? new Date(vm.filters.date.$lt): undefined;
        if(vm.aggregateData.endDate)
            vm.aggregateData.endDate.setHours(-24,0,0,0); //to make filename normal
        //it's chinese,so temporarily disable it
        //vm.aggregateData.shop = vm.filters.shop? shopInfoMap[vm.filters.shop]: undefined; 
        
        var reqData = {};
        if(!_.isEmpty(vm.filters)) {
            reqData.filters = vm.filters;
        }

        $http.post("/api/transaction/aggregate-product",reqData)
        .then(function(res) {
            var data = res.data;
            if(data.success) {
                setAggregateResult(data.result);
                $rootScope.pubSuccessMsg("統計成功,已更新畫面");
            }
        })
        .catch(function(err) {
            $rootScope.pubErrorMsg("統計失敗,", err.data.toString());
        })
        .finally(function() {
            vm.isAggregating = false;
        });
        
    }

    vm.downloadProductAggInfoPDF = function() {
        vm.isDownloading = true;
        $http.post('/pdf/transacted-products',
        {
            shop: vm.aggregateData.shop,
            startDate: vm.aggregateData.startDate,
            endDate: vm.aggregateData.endDate,
            products: vm.aggregateData.products,
            transCount: vm.aggregateData.transCount
        },
        {
            responseType: 'arraybuffer'
        })
        .then(function(res) {
            var filenameInfo = res.headers('Content-disposition').split('filename=');
            var file = new Blob([res.data],{type: 'application/pdf'});
            
            saveAs(file, filenameInfo[1]);

            $rootScope.pubSuccessMsg('下載兌領統計表成功');
        })
        .catch(function(err) {
            $rootScope.pubErrorMsg('下載兌領統計表失敗,', err.data.toString());
        })
        .finally(function(){
            vm.isDownloading = false;
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