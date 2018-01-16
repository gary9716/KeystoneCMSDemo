angular.module('ngCart', ['ngCart.directives', 'ngLodash'])

    .config([function () {

    }])

    .provider('$ngCart', function () {
        this.$get = function () {
        };
    })

    .run(['$rootScope', 'ngCart','ngCartItem', 'store', function ($rootScope, ngCart, ngCartItem, store) {

    }])

    .service('ngCart', ['$rootScope', '$window', 'ngCartItem', 'store', function ($rootScope, $window, ngCartItem, store) {

        //private variables---
        var ngCart = this;
        var $cart;
        //--------------------

        this.init = function(storeKey){
            $cart = {
                shipping : null,
                taxRate : null,
                tax : null,
                items : [],
                storeKey: storeKey? storeKey : 'ngShop'
            };

            //console.log($cart);
        };

        this.setStoreKey = function(key) {
            $cart.storeKey = key;
        }

        this.addItem = function (data) {

            var item = this.getItemById(data._id);

            if (typeof item === 'object'){
                //Update quantity of an item if it's already in the cart
                item.setName(name);
                item.setPrice(price);
                item.setQuantity(quantity, false); //set directly instead of adding
                item.weight = data.weight;
                item.image = data.image;

                $rootScope.$broadcast('ngCart:itemUpdated', item);
            } else {
                if(data instanceof ngCartItem)
                    item = data;
                else
                    item = new ngCartItem(data);
                $cart.items.push(item);
                $rootScope.$broadcast('ngCart:itemAdded', item);
            }

            $rootScope.$broadcast('ngCart:change');

            return item;
        };

        this.getItemById = function (itemId) {
            var items = $cart.items;
            var build = false;

            items.some(function (item) {
                if  (item.getId() === itemId) {
                    build = item;
                    return true;
                }
                else 
                  return false;
            });

            return build;
        };

        this.isItemInCart = function(itemId) {
            var items = $cart.items;
            return items.some(function (item) {
                return  (item.getId() === itemId);
            });
        };

        this.setShipping = function(shipping){
            $cart.shipping = shipping;
            return this.getShipping();
        };

        this.getShipping = function(){
            if ($cart.items.length == 0) return 0;
            return  $cart.shipping;
        };

        this.setTaxRate = function(taxRate){
            $cart.taxRate = +parseFloat(taxRate).toFixed(2);
            return this.getTaxRate();
        };

        this.getTaxRate = function(){
            return $cart.taxRate;
        };

        this.getTax = function(){
            return +parseFloat(((this.getSubTotal()/100) * this.getCart().taxRate )).toFixed(2);
        };

        this.setCart = function (cart) {
            $cart = cart;
            return $cart;
        };

        this.getCart = function(){
            return $cart;
        };

        this.getItems = function(){
            return $cart.items;
        };

        this.getTotalItems = function () {
            var count = 0;
            var items = this.getItems();
            angular.forEach(items, function (item) {
                count += item.getQuantity();
            });
            return count;
        };

        this.getTotalUniqueItems = function () {
            return $cart.items.length;
        };

        this.getSubTotal = function(){
            var total = 0;
            angular.forEach($cart.items, function (item) {
                total += item.getTotal();
            });
            return +parseFloat(total).toFixed(2);
        };

        this.totalCost = function () {
            return +parseFloat(this.getSubTotal() + this.getShipping() + this.getTax()).toFixed(2);
        };

        this.removeItem = function (index) {
            var item = $cart.items.splice(index, 1)[0] || {};
            $rootScope.$broadcast('ngCart:itemRemoved', item);
            $rootScope.$broadcast('ngCart:change');

        };

        this.removeItemById = function (id) {
            var item;
            var cart = $cart;
            angular.forEach(cart.items, function (item, index) {
                if(item.getId() === id) {
                    item = cart.items.splice(index, 1)[0] || {};
                }
            });
            this.setCart(cart);
            $rootScope.$broadcast('ngCart:itemRemoved', item);
            $rootScope.$broadcast('ngCart:change');
        };

        this.empty = function () {
            
            $rootScope.$broadcast('ngCart:change');
            $cart.items = [];
            $window.localStorage.removeItem($cart.storeKey);
        };
        
        this.isEmpty = function () {
            
            return ($cart.items.length > 0 ? false : true);
            
        };

        this.toObject = function() {

            if (this.getItems().length === 0) return false;

            var items = [];
            angular.forEach(this.getItems(), function(item){
                items.push (item.toObject());
            });

            return {
                shipping: this.getShipping(),
                tax: this.getTax(),
                taxRate: this.getTaxRate(),
                subTotal: this.getSubTotal(),
                totalCost: this.totalCost(),
                items:items
            }
        };


        this.$restore = function(key){
            if(key)
              storedCart = store.get(key);
            else 
              storedCart = store.get($cart.storeKey);

            $cart.items = [];
            $cart.shipping = storedCart.shipping;
            $cart.tax = storedCart.tax;

            angular.forEach(storedCart.items, function (item) {
                $cart.items.push(new ngCartItem(item));
            });

            this.$save();
        };

        this.dataIsValid = function() {
            if($cart.items.length > 0)
                return $cart.items.every(function(item) {
                    return !isNaN(item.getTotal());
                });
            else 
                return true;
        }

        this.$save = function () {
            if(this.dataIsValid())
                return store.set($cart.storeKey, JSON.stringify($cart));
        }

        $rootScope.$on('ngCart:change', function(){
            ngCart.$save();
        });

    }])

    .factory('ngCartItem', ['$rootScope', '$log', 'lodash', function ($rootScope, $log, _) {

        var item = function (data) {
            /*
            this.setId(data._id);
            this.setName(data.name);
            this.setPrice(data.price);
            this.setQuantity(data.quantity);
            */

            _.assign(this, data);
        };


        item.prototype.setId = function(id){
            if (id)  this._id = id;
            else {
                $log.error('An ID must be provided');
            }
        };

        item.prototype.getId = function(){
            return this._id;
        };


        item.prototype.setName = function(name){
            if (name)  this.name = name;
            else {
                $log.error('A name must be provided');
            }
        };
        item.prototype.getName = function(){
            return this.name;
        };

        item.prototype.setPrice = function(price){
            var priceFloat = parseFloat(price);
            if (priceFloat) {
                if (priceFloat <= 0) {
                    $log.error('A price must be over 0');
                } else {
                    this.price = (priceFloat);
                }
            } else {
                $log.error('A price must be provided');
            }
        };

        item.prototype.getPrice = function(){
            return this.price;
        };


        item.prototype.setQuantity = function(quantity, relative){

            var quantityInt = parseInt(quantity);
            if (quantityInt % 1 === 0){
                if (relative === true){
                    this.quantity  += quantityInt;
                } else {
                    this.quantity = quantityInt;
                }
                if (this.quantity < 1) this.quantity = 1;

            } else {
                this.quantity = 1;
                $log.info('Quantity must be an integer and was defaulted to 1');
            }

        };

        item.prototype.getQuantity = function(){
            return this.quantity;
        };

        item.prototype.setData = function(data){
            if (data) this.data = data;
        };

        item.prototype.getData = function(){
            if (this.data) return this.data;
            else $log.info('This item has no data');
        };


        item.prototype.getTotal = function(){
            return +parseFloat(this.getQuantity() * this.getPrice()).toFixed(2);
        };

        item.prototype.toObject = function() {
            return {
                id: this.getId(),
                name: this.getName(),
                price: this.getPrice(),
                quantity: this.getQuantity(),
                data: this.getData(),
                total: this.getTotal()
            }
        };

        return item;

    }])

    .service('store', ['$window', function ($window) {

        return {

            get: function (key) {
                var cached = $window.localStorage.getItem(key);
                if ( cached )  {
                    var data = angular.fromJson( cached ) ;
                    return JSON.parse(data);
                }
                return false;

            },


            set: function (key, val) {

                if (val === undefined) {
                    $window.localStorage.removeItem(key);
                } else {
                    $window.localStorage.setItem( key, angular.toJson(val) );
                }
                return $window.localStorage.getItem(key);
            }
        }
    }])

    .controller('CartController',['$scope', 'ngCart', function($scope, ngCart) {
        $scope.ngCart = ngCart;

    }])

    .value('version', '1.0.0');

angular.module('ngCart.directives', ['ngCart.fulfilment'])

    .controller('CartController',['$scope', 'ngCart', function($scope, ngCart) {
        $scope.ngCart = ngCart;
    }])

    .directive('ngcartAddtocart', ['ngCart', function(ngCart){
        return {
            restrict : 'E',
            controller : 'CartController',
            scope: {
                id:'@',
                name:'@',
                quantity:'@',
                quantityMax:'@',
                price:'@',
                data:'='
            },
            transclude: true,
            templateUrl: function(element, attrs) {
                if ( typeof attrs.templateUrl == 'undefined' ) {
                    return 'template/ngCart/addtocart.html';
                } else {
                    return attrs.templateUrl;
                }
            },
            link:function(scope, element, attrs){
                scope.attrs = attrs;
                scope.inCart = function(){
                    return  ngCart.getItemById(attrs.id);
                };

                if (scope.inCart()){
                    scope.q = ngCart.getItemById(attrs.id).getQuantity();
                } else {
                    scope.q = parseInt(scope.quantity);
                }

                scope.qtyOpt =  [];
                for (var i = 1; i <= scope.quantityMax; i++) {
                    scope.qtyOpt.push(i);
                }

            }

        };
    }])

    .directive('ngcartCart', [function(){
        return {
            restrict : 'E',
            controller : 'CartController',
            scope: {},
            templateUrl: function(element, attrs) {
                if ( typeof attrs.templateUrl == 'undefined' ) {
                    return 'template/ngCart/cart.html';
                } else {
                    return attrs.templateUrl;
                }
            },
            link:function(scope, element, attrs){

            }
        };
    }])

    .directive('ngcartSummary', [function(){
        return {
            restrict : 'E',
            controller : 'CartController',
            scope: {},
            transclude: true,
            templateUrl: function(element, attrs) {
                if ( typeof attrs.templateUrl == 'undefined' ) {
                    return 'template/ngCart/summary.html';
                } else {
                    return attrs.templateUrl;
                }
            }
        };
    }])

    .directive('ngcartCheckout', [function(){
        return {
            restrict : 'E',
            controller : ('CartController', ['$rootScope', '$scope', 'ngCart', 'fulfilmentProvider', function($rootScope, $scope, ngCart, fulfilmentProvider) {
                $scope.ngCart = ngCart;

                $scope.checkout = function () {
                    fulfilmentProvider.setService($scope.service);
                    fulfilmentProvider.setSettings($scope.settings);
                    fulfilmentProvider.checkout()
                        .success(function (data, status, headers, config) {
                            $rootScope.$broadcast('ngCart:checkout_succeeded', data);
                        })
                        .error(function (data, status, headers, config) {
                            $rootScope.$broadcast('ngCart:checkout_failed', {
                                statusCode: status,
                                error: data
                            });
                        });
                }
            }]),
            scope: {
                service:'@',
                settings:'='
            },
            transclude: true,
            templateUrl: function(element, attrs) {
                if ( typeof attrs.templateUrl == 'undefined' ) {
                    return 'template/ngCart/checkout.html';
                } else {
                    return attrs.templateUrl;
                }
            }
        };
    }]);
;
angular.module('ngCart.fulfilment', [])
    .service('fulfilmentProvider', ['$injector', function($injector){

        this._obj = {
            service : undefined,
            settings : undefined
        };

        this.setService = function(service){
            this._obj.service = service;
        };

        this.setSettings = function(settings){
            this._obj.settings = settings;
        };

        this.checkout = function(){
            var provider = $injector.get('ngCart.fulfilment.' + this._obj.service);
              return provider.checkout(this._obj.settings);

        }

    }])


.service('ngCart.fulfilment.log', ['$q', '$log', 'ngCart', function($q, $log, ngCart){

        this.checkout = function(){

            var deferred = $q.defer();

            $log.info(ngCart.toObject());
            deferred.resolve({
                cart:ngCart.toObject()
            });

            return deferred.promise;

        }

 }])

.service('ngCart.fulfilment.http', ['$http', 'ngCart', function($http, ngCart){

        this.checkout = function(settings){
            return $http.post(settings.url,
                { data: ngCart.toObject(), options: settings.options});
        }
 }])


.service('ngCart.fulfilment.paypal', ['$http', 'ngCart', function($http, ngCart){


}]);