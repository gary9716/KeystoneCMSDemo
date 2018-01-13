angular.module('mainApp')
.controller('ProductPageCtrler', 
  ['$http', '$window', '$state', 'ngCart', '$filter',
  function($http, $window, $state, ngCart, $filter) {
    //TODO:
    
    //1. create product
    //2. read product list
    //3. delete expired product(?
    //4. update product

    var cartKey = 'riceShop';
    if(locals && locals.user)
        cartKey = locals.user.userID + "-cart";

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
      var productInfo = {
        _id: (index + 1),
        name: name,
        weight: weights[index],
        marketPrice: mPrices[index],
        exchangePrice: exPrices[index],
        discountPrice: Math.round(discounts[index] * mPrices[index]),
        image: 'images/test-rice' + (index+1).toString() + '.jpg',
      }; 

      //default values
      productInfo.price = productInfo.marketPrice;
      productInfo.quantity = 1;

      return productInfo;
    });

    //refresh product state after restore cart record from localstorage
    dummy.forEach(function(product) {
        var item = ngCart.getItemById(product._id);
        if(item) {
            product.isInCart = true;
            product.quantity = item.getQuantity();
            product.price = item.getPrice();
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

    /*
    var dumpItems = function() {
        console.log(ngCart.getItems());
    }
    */

    vm.addItemToCart = function(product) {
        ngCart.addItem(
            product._id,
            product.name,
            product.price,
            product.quantity,
            product
        );
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
);