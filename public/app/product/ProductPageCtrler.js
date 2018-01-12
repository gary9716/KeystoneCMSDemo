angular.module('mainApp')
.controller('ProductPageCtrler', 
  ['$http', '$window', '$state', 'ngCart', '$filter',
  function($http, $window, $state, ngCart, $filter) {
    //TODO:
    
    //1. create product
    //2. read product list
    //3. delete expired product(?
    //4. update product

    ngCart.setTaxRate(7.5);
    ngCart.setShipping(2.99);

    var vm = this;
    var listTo2DMat = $filter('listTo2DMat');
    
    //test data
    var names = ['在來米','蓬萊米','越光米','池上米'];
    var weights = [2.5, 3, 5, 10];
    var mPrices = [250, 400, 700, 1000];
    var exPrices = [200, 300, 600, 700];
    var discounts = [0.85, 0.8, 0.95, 0.9];

    var dummy = names.map(function(name, index) { 
      return { 
        name: name,
        weight: weights[index],
        marketPrice: mPrices[index],
        exchangePrice: exPrices[index],
        discountPrice: Math.round(discounts[index] * mPrices[index]),
        image: 'images/test-rice' + (index+1).toString() + '.jpg',
      }; 
    });

    vm.products = listTo2DMat(dummy,3); //each row contains 3 product

    vm.viewDetail = function() {

    };
    
  }]
);