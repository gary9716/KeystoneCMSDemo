angular.module('mainApp')
.controller('ProductPageCtrler', 
  ['$http', '$window', '$state', 'ngCart', '$filter', '$rootScope', '$uibModal', 'ngCartItem', '$scope', 'lodash',
  function($http, $window, $state, ngCart, $filter, $rootScope, $uibModal, ngCartItem, $scope, _ ) {
    //TODO:
    
    //1. create product
    //2. read product list
    //3. delete expired product(?
    //4. update product

    var cartKey = 'riceShop';
    if(locals && locals.user)
        cartKey = locals.user.userID + "-cart";

    $rootScope.productPageCtrler = this;

    ngCart.init(cartKey);
    ngCart.$restore();

    ngCart.setTaxRate(5); //5%
    ngCart.setShipping(1); //no currency convert
    
    //ngCart.empty(); //maybe we may need to empty this after user log out
    
    var vm = this;
    var listTo2DMat = $filter('listTo2DMat');
    
    //test data
    var names = ['在來米','蓬萊米','越光米','池上米'];
    var weights = [2.5, 3, 5, 10];
    var mPrices = [250, 400, 700, 1000];
    var exPrices = [200, 300, 600, 700];
    var discounts = [0.85, 0.8, 0.95, 0.9];

    var dummy = names.map(function(name, index) { 
      
      var productInfo = { //this should be pull from DB
        _id: index + 1,
        name: name,
        weight: weights[index],
        marketPrice: mPrices[index],
        exchangePrice: exPrices[index],
        discountPrice: Math.round(discounts[index] * mPrices[index]),
        image: 'images/test-rice' + (index+1).toString() + '.jpg',
      };

      var item = ngCart.getItemById(productInfo._id);
      var productItem;
    
      if(item) {
        _.assign(item, productInfo); //preserve price and quantity
        productItem = item;
      }
      else {
        productInfo.price = productInfo.marketPrice;
        productInfo.quantity = 1;
        productItem = new ngCartItem(productInfo);
      }
        
      return productItem;
    });

    //refresh product state after restore cart record from localstorage
    dummy.forEach(function(product) {
        var item = ngCart.getItemById(product._id);
        if(item) {
            product.isInCart = true;
            //product.quantity = item.getQuantity();
            //product.price = item.getPrice();
        }
        else {
            product.isInCart = false;
        }
    });

    //put data onto view
    vm.products = listTo2DMat(dummy,3); //each row contains 3 product

    vm.viewDetail = function() {
        //TODO: show product detail in modal view
    };

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
          .then(function () { //after pressing checkout
            console.log('do checkout');
            $rootScope.pubSuccessMsg('兌換成功');
          })
          .catch(function () { //dismissed by user
            modalInstance.close(); 
          });
    }

    /*
    var dumpItems = function() {
        console.log(ngCart.getItems());
    }
    */

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

  }]
)
.controller('ShopCartModalCtrler', 
  ['$q','$http', '$uibModalInstance', 'curShopCart', 'localStorageService', 'cachedFarmersKey', 'lodash', '$scope',
  function($q, $http, $uibModalInstance, curShopCart, localStorageService, cachedFarmersKey, _, $scope) {
    var vm = this;

    var getAccountsWithFarmerPID = function(farmerPID) {
      return $http.post('/api/farmer/get-and-populate',
      {
        farmerPID: farmerPID
      })
      .then(function(res) {
        var data = res.data;
        if(data.success) {
          //vm.farmer = data.result.farmer;
          vm.accounts = data.result.accounts;
          if(vm.accounts && vm.accounts.length > 0)
            localStorageService.set(farmerPID + ',accounts:', vm.accounts);
          else
            vm.accounts = [];
          return vm.accounts;
        }
        else {
          console.log(data.message);
          return $q.reject();
        }
      })
    }

    vm.farmerSelected = function(fetchAcc) {
        if(vm.selectedFarmer) {
            var farmerPID = vm.selectedFarmer.pid;
            localStorageService.set('ProductPage:selectedFarmer', farmerPID);
            if(fetchAcc) {
                getAccountsWithFarmerPID(farmerPID);
            }
            else {            
                vm.accounts = localStorageService.get(farmerPID + ',accounts:');
                if(!vm.accounts)
                    getAccountsWithFarmerPID(farmerPID);
            }
            
            var selAcc_id = localStorageService.get(farmerPID + ',ProductPage:selectedAccount:');
            if(selAcc_id)
                vm.selectedAccount = _.find(vm.accounts, function(account) {
                    return (account._id === selAcc_id);
                });
            else
                vm.selectedAccount = _.find(vm.accounts, function(account) {
                    return (account.active);
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
      $uibModalInstance.close();
    };

    vm.cancel = function () {
      $uibModalInstance.dismiss('cancel');
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
                        alert('沒找到相對應的存摺');   
                    }
                  }
                  else if(data.result) {
                    vm.selectedAccount = data.result;
                  }
                  else {
                    alert('沒找到相對應的存摺');
                  }
                }
                else {
                  console.log(data.message);
                  alert('沒找到相對應的存摺');
                }
            })
            .catch(function(err) {
                console.log(err);
                alert('系統有些錯誤,請再試一次');
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
);