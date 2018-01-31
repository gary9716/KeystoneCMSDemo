angular.module('mainApp')
.controller('ProductTypePageCtrler', 
['$http', '$uibModal', '$rootScope', 'lodash',
  function($http, $uibModal, $rootScope, _ ) {
    //TODO and features:
    
    //1. create product type
    //2. update product type
    //3. get product type list

    var vm = this;
    vm.pTypes = [];

    $rootScope.productTypePageCtrler = this;

    vm.getProductTypes = function() {
          $http.post('/api/read',{
            listName: 'ProductType'
          })
          .then(function(res) {
            var data = res.data;
            if(data.success) {
              vm.pTypes = data.result;
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

    var updatePType = function(pType) {
      $http.post('/api/p-type/upsert', pType)
      .then(function(res) {
        var data = res.data;
        if(data.success) {
          $rootScope.pubSuccessMsg('操作成功');
          var resultPType = data.result;
          var pTypeInArray = _.find(vm.pTypes,function(pType) {
            return pType._id === resultPType._id;
          });

          if(pTypeInArray) {
            _.assign(pTypeInArray, resultPType);
          }
          else {
            vm.pTypes.push(resultPType);
          }
        }
        else {
          $rootScope.pubErrorMsg('更新失敗,'+ data.message);
        }
      })
      .catch(function(err) {
        var msg = err && err.data? err.data.toString():(err? err.toString(): '');
        $rootScope.pubErrorMsg('更新失敗,' + msg);
      });
    }

    vm.openEditModal = function(pType) {
      var modalInstance = $uibModal.open({
          templateUrl: 'product-type-edit-modal.html',
          controller: 'ProductTypeEditModalCtrler as ctrler',
          size: 'md', //'md','lg','sm'
          resolve: {
              productType: function() {
                  return pType;
              }
          }
        });

        modalInstance.result
        .then(function (pType) { 
          updatePType(pType);
        })
        .catch(function () {
          modalInstance.close(); 
        });
    }

    vm.getProductTypes();

  }
])
.controller('ProductTypeEditModalCtrler', 
['$uibModalInstance','productType',
  function($uibModalInstance, productType) {
    
    var vm = this;

    if(productType) {
      vm.productType = _.clone(productType, false);
    }
    else {
      vm.productType = {};
    }

    vm.ok = function () {
      $uibModalInstance.close(vm.productType);
    };

    vm.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

  }
]);