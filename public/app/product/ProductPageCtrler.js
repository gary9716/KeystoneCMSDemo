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
  ['$uibModalInstance', 'curShopCart',
  function($uibModalInstance, curShopCart) {
    var vm = this;

    vm.getCartItems = function() {
        return curShopCart.getItems();
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
        }
    }

    vm.getTotalPrice = function() {
        return curShopCart.getSubTotal();
    } 
  }]
);