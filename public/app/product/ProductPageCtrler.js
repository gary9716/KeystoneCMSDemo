angular.module('mainApp')
.controller('ProductPageCtrler', 
  ['appRootPath','$http', '$window', '$state', 'ngCart', '$filter', '$rootScope', '$uibModal', 'ngCartItem', '$scope', 'lodash', 'localStorageService', 'cachedFarmersKey',
  function(appRootPath, $http, $window, $state, ngCart, $filter, $rootScope, $uibModal, ngCartItem, $scope, _ , localStorageService, cachedFarmersKey) {

    //TODO and features:
    
    //1. create product
    //2. read product list
    //3. delete product(
    //4. update product

    //common part
    $rootScope.productPageCtrler = this;
    var listTo2DMat = $filter('listTo2DMat');

    var vm = this;

    vm.productTypeTemplatePath = appRootPath + 'product/product-type.html';

    vm.getProducts = function(mode) {
        return $http.post('/api/product/get',
        {
            mode: mode
        })
        .then(function(res) {
            var data = res.data;
            if(data.success) {
                vm.productList = data.result;
            }
            else {
                console.log(data.message);
            }
        })
        .catch(function(err) {
            var msg = err && err.data? err.data.toString():(err? err.toString(): '');
            $rootScope.pubErrorMsg('抓取商品資訊失敗,' + msg);
        });
    }

    if($state.current.name === 'productSell') { //sell page(sell.html)
        
        vm.clearCart = function() {
            ngCart.empty();
            vm.productList.forEach(function(product) {
                product.isInCart = false;
            });
        }

        vm.viewDetail = function() {
            //future feature(?): show product detail in modal view
        };

        var openCheckoutResult = function(result) {
            var modalInstance = $uibModal.open({
                templateUrl: 'checkout-result.html',
                controller: 'CheckoutResultPageCtrler as ctrler',
                size: 'lg', //'md','lg','sm'
                resolve: {
                    checkoutResult: function() {
                        return result;
                    }
                }
              });

              modalInstance.result
              .catch(function (reason) { //dismissed by user
                modalInstance.close(); 
              });
        }

        var doCheckOut = function(data) {

            var clearAllFarmerAccountCached = function() {
                //make browser re-fetch data
                var farmers = localStorageService.get(cachedFarmersKey);
                farmers.forEach(function(farmer) {
                    localStorageService.remove(farmer.pid + ',accounts:');
                });
            }            

            var productsForEx = ngCart.getItems().map(function(item) {
                var product = {};
                product._id = item._id;

                if(item.marketPrice === item.price) {
                    product.price = 'market';
                }
                else if(item.exchangePrice === item.price) {
                    product.price = 'exchange';
                }
                else {
                    product.price = item.price;
                }

                product.qty = item.quantity;

                return product;
            });

            $http.post('/api/product/transact', {
                _id: data.tranAccount._id,
                products: productsForEx
            })
            .then(function(res) {
                var data = res.data;
                if(data.success) {
                    //$rootScope.pubSuccessMsg('兌換成功');
                    openCheckoutResult(data.result);
                    clearAllFarmerAccountCached();
                    vm.clearCart();
                }
                else {
                    $rootScope.pubErrorMsg('兌換失敗,原因' + data.message);
                }

            })
            .catch(function(err) {
                var msg = err && err.data? err.data.toString():(err? err.toString(): '');
                $rootScope.pubErrorMsg('兌換失敗,原因' + msg);
            })

            
        }

        vm.openShopCart = function() {
            var modalInstance = $uibModal.open({
                templateUrl: 'cart-and-checkout.html',
                controller: 'ShopCartModalCtrler as ctrler',
                size: 'lg', //'md','lg','sm'
                resolve: {
                    curShopCart: function() {
                        return ngCart;
                    }
                }
              });

              modalInstance.result
              .then(function (data) { //after pressing checkout
                doCheckOut(data);
              })
              .catch(function (reason) { //dismissed by user
                if(reason === 'clear') {
                    vm.clearCart();
                    $rootScope.pubSuccessMsg('已清空購物車');
                }
                modalInstance.close(); 
              });
        }

        vm.addItemToCart = function(product) {
            ngCart.addItem(product);
            product.isInCart = true;
        }

        vm.rmItemFromCart = function(product) {
            ngCart.removeItemById(product._id);
            product.isInCart = false;
        }

        vm.isItemInCart = function(product) {
            return ngCart.isItemInCart(product._id);
        }

        vm.qtyIsNaN = function(product) {
            return isNaN(product.quantity);
        }

        vm.changeQty = function(product, val) {
            if(!isNaN(product.quantity)) {
                product.quantity += val;
            }
        }

        var cartKey = 'riceShop';
        if(locals && locals.user)
            cartKey = locals.user.userID + "-cart";

        ngCart.init(cartKey);
        ngCart.$restore();

        ngCart.setTaxRate(5); //5%
        ngCart.setShipping(1); //no currency convert
        
        vm.getProducts('saleable')
        .then(function() {
            //refresh product state after restore cart record from localstorage
            vm.productList = vm.productList.map(function(product) {
                var item = ngCart.getItemById(product._id);
                if(item) {
                    product.isInCart = true;
                    _.assign(item, product);
                    return item;
                }
                else {
                    //default values
                    product = new ngCartItem(product); //make sure there won't be an new object while it added to the shopping cart
                    product.isInCart = false;
                    product.price = product.exchangePrice;
                    product.quantity = 1;
                    return product;
                }
            });
  
        });
    }
    else if($state.current.name === 'productManage') { //manage page(manage.html)

        var removeProductFromList = function(product) {
            var index = _.findIndex(vm.productList, function(_product) {
                return _product._id === product._id;
            });

            if(index !== -1) {
                vm.productList.splice(index, 1);
            }
        }

        var upsertProduct = function(product) {
            $http.post('/api/product/upsert', product)
                .then(function(res) {
                    var data = res.data;
                    if(data.success) {
                      var newProduct = data.result;
                      var productInList = _.find(vm.productList, function(product) {
                        return product._id === newProduct._id;
                      });
                      
                      if(productInList)
                        _.assign(productInList, newProduct);
                      else
                        vm.productList.push(newProduct);

                      $rootScope.pubSuccessMsg('新增成功,已更新畫面');
                    }
                    else {
                      $rootScope.pubErrorMsg('更新失敗,' + data.message);
                    }
                })
                .catch(function(err) {
                    $rootScope.pubErrorMsg(err && err.data? err.data.toString():(err? err.toString(): ''));
                });
        }

        vm.openProductEditModal = function(product) {
            
            var modalInstance = $uibModal.open({
                templateUrl: 'product-edit-modal.html',
                controller: 'ProductEditModalCtrler as ctrler',
                size: 'md', //'md','lg','sm'
                resolve: {
                    product: function() {
                        return product;
                    }
                }
              });

              modalInstance.result
              .then(function (product) {
                upsertProduct(product);
              })
              .catch(function () {
                modalInstance.close(); 
              });

        }

        vm.deleteProduct = function(product) {
            if(confirm('確定要刪除這個產品嗎') === true) {
                $http.post('/api/product/delete', {
                    _id: product._id
                })
                .then(function(res) {
                    var data = res.data;
                    if(data.success) {
                        removeProductFromList(product);
                        $rootScope.pubSuccessMsg('刪除成功,已更新畫面');
                    }
                    else {
                        $rootScope.pubErrorMsg('刪除失敗,' + data.message);
                    }
                })
                .catch(function(err) {
                    var msg = err && err.data? err.data.toString():(err? err.toString(): '');
                    $rootScope.pubErrorMsg('刪除商品失敗,' + msg);
                });

            }
        }

        vm.getProductStatus = function(product) {
            if(!product.canSale) {
                return '下架中';
            }

            var startSaleDate = new Date(product.startSaleDate);
            var nowTime = Date.now();
            
            if(startSaleDate <= nowTime) {
                return '販售中';
            }
            else {
                return '等待上架';
            }
        }

        vm.getProducts('all');
    }

  }]
)
.controller('ProductEditModalCtrler', 
['$http','$uibModalInstance', 'product', 'lodash',
  function($http, $uibModalInstance, product, _) {
    var vm = this;
    
    if(product) {
        var productClone = _.clone(product, false);
        vm.product = productClone;
        productClone.startSaleDate = Date.parse(productClone.startSaleDate);
    }
    else {
        vm.product = {};
    }

    vm.getProductTypes = function() {
          $http.post('/api/read',{
            listName: 'ProductType'
          })
          .then(function(res) {
            var data = res.data;
            if(data.success) {
              vm.pTypeVals = data.result;
              if(vm.product.pType) {
                vm.product.pType = 
                _.find(vm.pTypeVals, 
                  function(pTypeVal) {
                    return pTypeVal._id === vm.product.pType._id;
                  });
              }
              
            }
            else {
              console.log(err.message);
            }
          })
          .catch(function(err) {
            var msg = err && err.data? err.data.toString():(err? err.toString(): '');
            $rootScope.pubErrorMsg('抓取商品類型資訊失敗,' + msg);
          });
    }

    vm.ok = function () {
      $uibModalInstance.close(vm.product);
    };

    vm.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

    vm.pTypeSelect = function() {
      vm.product.pid = vm.product.pType.code;
    }

    vm.getProductTypes();
  }
])

.controller('ShopCartModalCtrler', 
  ['$q','$http', '$uibModalInstance', 'curShopCart', 'localStorageService', 'cachedFarmersKey', 'lodash', '$scope',
  function($q, $http, $uibModalInstance, curShopCart, localStorageService, cachedFarmersKey, _, $scope) {
    var vm = this;

    vm.alerts = [];
    vm.pubSuccessMsg = function(msg) {
      vm.alerts.push({ type:'success', msg: msg });
    }

    vm.pubWarningMsg = function(msg) {
      vm.alerts.push({ type:'warning', msg: msg }); 
    }

    vm.pubInfoMsg = function(msg) {
      vm.alerts.push({ type:'info', msg: msg }); 
    }

    vm.pubErrorMsg = function(msg) {
      vm.alerts.push({ type:'danger', msg: msg }); 
    }

    var getAccountsWithFarmerPID = function(farmerPID) {
      return $http.post('/api/farmer/get-and-populate',
      {
        farmerPID: farmerPID,
        active: true,
        freeze: false
      })
      .then(function(res) {
        var data = res.data;
        if(data.success) {
          //vm.selectedFarmer = data.result.farmer;
          vm.accounts = data.result.accounts;
          if(vm.accounts && vm.accounts.length > 0)
            localStorageService.set(farmerPID + ',accounts:', vm.accounts);
          else
            vm.accounts = [];
          return vm.accounts;
        }
        else {
          return $q.reject();
        }
      })
      .catch(function(err) {
        vm.pubErrorMsg(err.toString());
      });
    }

    vm.farmerSelected = function(fetchAcc) {
        if(vm.selectedFarmer) {
            var farmerPID = vm.selectedFarmer.pid;
            localStorageService.set('ProductPage:selectedFarmer', farmerPID);
            
            /*
            //disable accounts caching
            if(fetchAcc) {
                getAccountsWithFarmerPID(farmerPID);
            }
            else {            
                vm.accounts = localStorageService.get(farmerPID + ',accounts:');
                if(!vm.accounts)
                    getAccountsWithFarmerPID(farmerPID);
            }
            */
            
            getAccountsWithFarmerPID(farmerPID)
            .then(function() {        
                var selAcc_id = localStorageService.get(farmerPID + ',ProductPage:selectedAccount:');
                if(selAcc_id)
                    vm.selectedAccount = _.find(vm.accounts, function(account) {
                        return (account._id === selAcc_id);
                    });
                else
                    vm.selectedAccount = _.find(vm.accounts, function(account) {
                        return (account.active);
                    });
            });
        }
    }

    vm.isUpdatingAccount = false;
    vm.updateAccountsInfo = function() { //after pressing button
        if(vm.selectedFarmer) {
            vm.isUpdatingAccount = true;
            var selAcc_id = vm.selectedAccount? vm.selectedAccount._id : null;
            getAccountsWithFarmerPID(vm.selectedFarmer.pid)
            .then(function(){
                vm.selectedAccount = _.find(vm.accounts, function(account) {
                    return (account._id === selAcc_id);
                });
            })
            .finally(function(){
                vm.isUpdatingAccount = false;
            });
        } 
    }

    vm.accountSelected = function() {
        if(vm.selectedAccount) {
            localStorageService.set(vm.selectedFarmer.pid + ',ProductPage:selectedAccount:', vm.selectedAccount._id);
        }
    }

    vm.isBalanceNotEnough = function() {
        if(vm.selectedAccount) {
            var ans = vm.selectedAccount.balance < vm.getTotalPrice();
            return ans;
        }
        else 
            return false;
    }

    vm.rmItemFromCart = function(item) {
        curShopCart.removeItemById(item._id);
        item.isInCart = false;
    }

    vm.saveCart = function() {
        curShopCart.$save();
    }

    vm.checkout = function () {
      $uibModalInstance.close({
        tranAccount: vm.selectedAccount
      });
    };

    vm.cancel = function (reason) {
      $uibModalInstance.dismiss(reason? reason : 'cancel');
    };

    vm.cartEmpty = function() {
      return curShopCart.getItems().length === 0;
    }

    vm.changeQty = function(item, val) {
        if(!isNaN(item.quantity)) {
            item.quantity += val;
            vm.saveCart();
        }
    }

    vm.getTotalPrice = function() {
        return curShopCart.getSubTotal();
    } 

    vm.getAfterBalance = function() {
        if(vm.selectedAccount)
            return vm.selectedAccount.balance - vm.getTotalPrice();
        else
            return -1;
    }

    vm.isViaCachedList = function() {
        return vm.accountSrcOpt === 'viaCachedList';
    }

    vm.isViaAccountID = function() {
        return vm.accountSrcOpt === 'viaAccountID';
    }

    vm.setSelectedAccount = function() {
        if(vm.inputAccID && vm.inputAccID.length > 0) {
            vm.isUpdatingAccount = true;
            $http.post('/api/read',
            {
                listName: 'Account',
                filters: {
                    accountID: vm.inputAccID
                }
            })
            .then(function(res) {
                var data = res.data;
                if(data.success) {
                  if(data.result instanceof Array) {
                    if(data.result.length > 0) {
                        vm.selectedAccount = data.result[0];
                    }
                    else {
                        vm.pubErrorMsg('沒找到相對應的存摺');   
                    }
                  }
                  else if(data.result) {
                    vm.selectedAccount = data.result;
                  }
                  else {
                    vm.pubWarningMsg('沒有找到存摺');
                  }
                }
                else {
                  vm.pubErrorMsg('沒找到相對應的存摺,' + data.message);
                }
            })
            .catch(function(err) {
                vm.pubErrorMsg('失敗,' + msg);
            })
            .finally(function(){
                vm.isUpdatingAccount = false;
            });

        }
        else {
            alert('請輸入存摺編號');
        }
    }

    vm.keyPressedInAccIDInput = function(event) {
        if(event.keyCode === 13) {
            event.preventDefault();
            vm.setSelectedAccount();
        }
    }

    vm.cartItems = curShopCart.getItems();
    vm.cachedFarmers = localStorageService.get(cachedFarmersKey);
    if(vm.cachedFarmers && vm.cachedFarmers.length > 0) {
        var cachedFarmerPID = localStorageService.get('ProductPage:selectedFarmer');
        if(cachedFarmerPID)
            vm.selectedFarmer = _.find(vm.cachedFarmers,function(farmer) {
                return farmer.pid === cachedFarmerPID;
            });
        else
            vm.selectedFarmer = vm.cachedFarmers[0];
        vm.farmerSelected();
    }

    //validate selectedAccount
    $scope.$watch('ctrler.selectedAccount', function(account) {
        if(account && account.balance >= vm.getTotalPrice()) {
            $scope.cartForm.accountData.$setValidity('balanceEnough', true);
        }
        else {
            $scope.cartForm.accountData.$setValidity('balanceEnough', false);
        }
    })

  }]
)
.controller('CheckoutResultPageCtrler',
    ['$uibModalInstance','checkoutResult',
    function($uibModalInstance, checkoutResult) {

        var vm = this;
        vm.total = checkoutResult.transaction.amount;
        vm.account = checkoutResult.account;
        vm.transactedItems = checkoutResult.transaction.products;
        vm.cancel = function() {
            $uibModalInstance.dismiss();
        }
    }
]);