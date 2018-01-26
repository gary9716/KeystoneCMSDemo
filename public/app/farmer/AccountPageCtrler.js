angular.module('mainApp')
.controller('AccountPageCtrler', 
  ['$http', '$window', '$state', '$rootScope', '$uibModal', 'cachedFarmersKey', 'lodash','localStorageService', 'appRootPath',
  function($http, $window, $state, $rootScope, $uibModal, cachedFarmersKey, _ , localStorageService, appRootPath) {

    var vm = this;
    const farmerPIDKey = 'farmerDetail:farmerPID';

    if(!$state.params) {
      console.log('error: no params');
      return;
    }

    var farmerPID = $state.params.farmerPID;
    if(farmerPID) {
      localStorageService.set(farmerPIDKey, farmerPID);
    }
    else {
      farmerPID = localStorageService.get(farmerPIDKey); //retrieve pid from cache to make page refreshable
    }

    vm.accountUser = '';

    vm.getDetail = function() {

      $http.post('/api/farmer/get-and-populate',
      {
        farmerPID: farmerPID,
        _populate: 'village'
      })
      .then(function(res) {
        var data = res.data;
        if(data.success) {
          vm.farmer = data.result.farmer;
          vm.accounts = data.result.accounts;
        }
        else {
          $rootScope.pubWarningMsg(data.message);
          console.log(data.message);
        }
      })
      .catch(function(err) {
        $rootScope.pubErrorMsg('抓取農民存摺資訊失敗,' + err.data.toString());
        console.log(err);
      });

    }

    vm.createAccount = function() {

      $http.post('/api/account/create',
      {
        farmerPID: farmerPID,
        accountUser: vm.accountUser,
        comment: vm.comment
      })
      .then(function(res) {
        var data = res.data;
        if(data.success) {
          if(!vm.accounts instanceof Array)
            vm.accounts = [];

          var newAccIndex = vm.accounts.length + 1;
          $rootScope.pubSuccessMsg('存摺' + newAccIndex.toString() + '開立成功');
          vm.accounts.push(data.result);
        }
        else {
          $rootScope.pubWarningMsg(data.message);
        }
      })
      .catch(function(err) {
        $rootScope.pubErrorMsg('開立存摺失敗,' + err.data.toString());
        console.log(err);
      });

    };

    vm.openCreateAccountModal = function() {
      var modalInstance = $uibModal.open({
        templateUrl: 'create-account.html', //this template is embedded in detail.html
        controller: 'CreateAccountModalCtrler as $ctrl',
        size: 'md', //'md','lg','sm'
      });

      modalInstance.result
      .then(function (result) {
        vm.accountUser = result.accountUser;
        vm.comment = result.comment;
        vm.createAccount();
      })
      .catch(function () { 
        modalInstance.close(); 
      });
      
    };

    vm.openAccountDetail = function(account) {
      account.farmer = vm.farmer;
      var modalInstance = $uibModal.open({
        templateUrl: 'account-detail.html', //this template is embedded in detail.html
        controller: 'AccountDetailModalCtrler as ctrler',
        size: 'lg', //'md','lg','sm'
        resolve: { //used for passing parameters to modal controller
          account: function() {
            return account;
          }
        }
      });

      modalInstance.result
      .then(function(successMsg) {
        $rootScope.pubSuccessMsg(successMsg);
      })
      .catch(function () { 
        modalInstance.close(); 
      });
    };
    
    vm.openUpdateFarmerModal = function() {
      var modalInstance = $uibModal.open({
        templateUrl: (appRootPath + 'farmer/update.html'), 
        controller: 'UpdateFarmerModalCtrler as ctrler',
        size: 'md', //'md','lg','sm'
        resolve: { //used for passing parameters to modal controller
          farmer: function() {
            return vm.farmer;
          }
        }
      });

      modalInstance.result
      .then(function(newFarmer) {
        newFarmer._populate = 'village';
        $http.post('/api/farmer/update', newFarmer)
        .then(function(res) {
          var data = res.data;
          if(data.success) {
            $rootScope.pubSuccessMsg('更新成功,頁面資料已更新');
            vm.farmer = data.result;
          }
          else {
            $rootScope.pubErrorMsg('更新失敗,' + data.message);
          }
        })
        .catch(function(err) {
            $rootScope.pubErrorMsg('更新失敗,' + err.data.toString());
        });
      })
      .catch(function () { 
        modalInstance.close(); 
      });
    }

    vm.addFarmerToCache = function() {
      if(vm.farmer) {
        var cachedFarmers = localStorageService.get(cachedFarmersKey);
        if(!cachedFarmers)
          cachedFarmers = [];

        if(_.findIndex(cachedFarmers, function(farmer) {
          return farmer.pid === vm.farmer.pid;
        }) === -1) { //hasn't been added
          cachedFarmers.push(vm.farmer);
          localStorageService.set(cachedFarmersKey,cachedFarmers);
          $rootScope.pubSuccessMsg('已加入暫存列表,可用於購物車等其他服務');
        }
        else {
          $rootScope.pubErrorMsg('該農民已在暫存列表');
        }
      }
    }

  }]
)
.controller('CreateAccountModalCtrler', 
  ['$uibModalInstance',
  function($uibModalInstance) {
    var $ctrl = this;
    $ctrl.result = {
      accountUser: ''
    };

    $ctrl.ok = function () {
      $uibModalInstance.close($ctrl.result);
    };

    $ctrl.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  }]
)
.controller('AccountDetailModalCtrler', 
  ['$uibModalInstance', 'account', '$http', 'lodash', '$q', 'Upload', '$window', '$scope',
  function($uibModalInstance, account, $http, _ , $q, Upload, $window, $scope) {
    var vm = this;
    vm.account = account;
    
    vm.resetOpView = function() {
      //default values
      vm.closeAcc = {};
      vm.deposit = {};
      vm.withdraw = {};
      vm.setFreeze = {};
      vm.isProcessing = false;

      vm.withdraw.comment = vm.account.farmer.name + " 白米存摺轉出";
      vm.withdraw.ioAccount = vm.account.farmer.ioAccount;
      
      vm.deposit.comment = vm.account.farmer.name + " 白米存摺轉入";
      vm.deposit.ioAccount = vm.account.farmer.ioAccount;
    }
    vm.resetOpView();

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

    var notEmptyOrUndefThenAdd = function(obj, key, val) {
      if(_.isString(val)) {
        if(val.length > 0) {
          obj[key] = val;
        }
      }
      else if(_.isNumber(val)) {
        obj[key] = val;
      }
    } 

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

    vm.downloadDWSheetOp = function(accRec, op, msg) {
      vm.isProcessing = true;
      return $http.post('/pdf/deposit-withdraw-sheet',
      {
        op: op,
        _id: accRec._id
      },
      {
        responseType: 'arraybuffer'
      })
      .then(function(res) {
        if(res.status !== 200) {
          console.log('code not 200');
          console.log(res);
        }

        var filenameInfo = res.headers('Content-disposition').split('filename=');
        //console.log(filenameInfo);
        var file = new Blob([res.data],{type: 'application/pdf'});
        
        saveAs(file, filenameInfo[1]);

        if(msg)
          vm.pubSuccessMsg(msg + ',轉帳單已下載');
        else
          vm.pubSuccessMsg('下載轉帳單成功');
      })
      .catch(function(err) {
        vm.pubErrorMsg('下載轉帳單失敗,' + err.data.toString());
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

    vm.deleteRec = function(accRec) {
      if($window.confirm('即將刪除此記錄, 確定嗎')) {
        console.log('delete rec');
        $http.post('/api/account-rec/delete', accRec)
        .then(function(res) {
          var data = res.data;
          if(data.success) {
            vm.pubSuccessMsg('刪除紀錄成功,已更新畫面');
            if(vm.edittingRec && accRec._id === vm.edittingRec._id) {
              vm.edittingRec = undefined;
            }
            _.assign(vm.account, data.result);
            vm.getAccountRecords();
          }
        })
        .catch(function(err) {
          vm.pubErrorMsg('刪除紀錄失敗,' + err.data.toString());
        });
        
      }
    }

    vm.selectEdittingRec = function(accRec) {
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
          vm.pubErrorMsg('抓取兌領紀錄失敗,' + err.data.toString());
        });
      }
      else {
        vm.edittingRec.period = vm.edittingRec.period ? vm.edittingRec.period.name : vm.edittingRec.period;
      }
      vm.accountOp = 'update-rec';
    }

    vm.updateRecOp = function(accRec) {
      var accRec = vm.edittingRec;
      if(accRec.opType.value === 'transact') {
        if(!accRec.products || accRec.products.length === 0) {
          return vm.pubErrorMsg('產品列表不能為空的,不然就請刪除此紀錄');
        }
      }

      vm.isProcessing = true;

      $http.post('/api/account-rec/update', accRec)
        .then(function(res) {
          var data = res.data;
          if(data.success) {
            _.assign(vm.account, data.result.account);
            vm.getAccountRecords();
            vm.edittingRec = undefined;
            vm.pubSuccessMsg('更新存摺紀錄成功,已更新畫面');
          }
        })
        .catch(function(err) {
          vm.pubErrorMsg('更新存摺紀錄失敗,' + err.data.toString());
        })
        .finally(function(){
          vm.isProcessing = false;
        });
    }

    /*
    $scope.$watch('ctrler.accountOp', function(value) {
      if(value !== 'update-rec') {
        vm.edittingRec = undefined;
      }
    });
    */

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

    vm.depositOp = function() {
      vm.isProcessing = true;

      var data = {
        _id: vm.account._id,
        amount: vm.deposit.amount
      };

      notEmptyOrUndefThenAdd(data, 'period', vm.deposit.period);
      notEmptyOrUndefThenAdd(data, 'comment', vm.deposit.comment);
      notEmptyOrUndefThenAdd(data, 'ioAccount', vm.deposit.ioAccount);

      $http.post('/api/account/deposit', data)
      .then(function(res) {
        var resData = res.data;
        if(resData.success) {
          _.assign(vm.account, resData.result);
          vm.resetOpView();
          vm.getAccountRecords();
          var accRec = vm.account.lastRecord;
          return vm.downloadDWSheetOp(accRec, 'deposit','入款成功,頁面資料已更新');
        }
        else {
          vm.pubErrorMsg('入款失敗,' + resData.message);
        }
      })
      .catch(function(err) {
        vm.pubErrorMsg('入款失敗,' + err.data.toString());
      })
      .finally(function() {
        vm.isProcessing = false;
      });

    }

    vm.withdrawOp = function() {
      vm.isProcessing = true;
      var data = {
        _id: vm.account._id,
        amount: vm.withdraw.amount
      };

      notEmptyOrUndefThenAdd(data, 'comment', vm.withdraw.comment);
      notEmptyOrUndefThenAdd(data, 'ioAccount', vm.withdraw.ioAccount);

      $http.post('/api/account/withdraw', data)
      .then(function(res) {
        var resData = res.data;
        if(resData.success) {
          _.assign(vm.account, resData.result);
          vm.resetOpView();
          vm.getAccountRecords();
          var accRec = vm.account.lastRecord;
          return vm.downloadDWSheetOp(accRec, 'withdraw','提款成功,頁面資料已更新');
        }
        else {
          vm.pubErrorMsg('提款失敗,' + resData.message);
        }
      })
      .catch(function(err) {
        vm.pubErrorMsg('提款失敗,' + err.data.toString());
      })
      .finally(function() {
        vm.isProcessing = false;
      })

    }

    vm.FileSizeLimit = '1MB';
    vm.unfreezeFileSelect = function(file, errFiles) {
      vm.errFile = errFiles && errFiles[0];
      if(vm.errFile.$error === 'maxSize') {
        vm.errFile.errorChMsg = '超過檔案限制 ' + vm.FileSizeLimit;
      }
      else {
        vm.errFile.errorChMsg = vm.errFile.$error;
      }
    }

    vm.downloadUnfreezeSheetOp = function() {
      vm.isProcessing = true;
      $http.post('/pdf/unfreeze-sheet')
      .then(function(res) {
        if(res.data.success) {
          $uibModalInstance.close('下載解凍單成功');
        }
        else {
          vm.pubErrorMsg('下載解凍單失敗');
        }
      })
      .catch(function(err) {
        vm.pubErrorMsg('下載解凍單失敗,' + err.data.toString());
      })
      .finally(function() {
        vm.isProcessing = false;
      });
      
    }

    vm.setFreezeOp = function() {
      vm.isProcessing = true;
      var data = {
        _id: vm.account._id,
      };

      notEmptyOrUndefThenAdd(data, 'comment', vm.setFreeze.comment);

      var fd = new FormData();
      if(vm.setFreeze.unfreezeSheet)
        fd.append('relatedFile', vm.setFreeze.unfreezeSheet);

      fd.append('opData', angular.toJson(data)); //convert it into json string

      /*
      $http.post('/api/account/set-freeze', fd, {
            transformRequest: null,
            headers: {'Content-type': undefined }
      })
      */
      Upload.http({
        url: '/api/account/set-freeze',
        headers:  {'Content-type': undefined },
        data: fd
      })
      .then(function(res) {
        var resData = res.data;
        if(resData.success) {
          _.assign(vm.account, resData.result);
          vm.resetOpView();
          vm.getAccountRecords();
          vm.pubSuccessMsg((vm.account.freeze? '凍結成功':'解凍成功') + ',頁面資料已更新');
        }
        else {
          vm.pubErrorMsg('失敗,' + resData.message);
        }
      })
      .catch(function(err) {
        vm.pubErrorMsg('失敗,' + err.data.toString());
      })
      .finally(function() {
        vm.isProcessing = false;
      },
      function(evt) {
        // progress notify
        vm.setFreeze.uploadProgress = parseInt(100.0 * evt.loaded / evt.total);
      });

    }

    vm.closeAccOp = function() {
      vm.isProcessing = true;
      var data = {
        _id: vm.account._id,
      };

      notEmptyOrUndefThenAdd(data, 'comment', vm.closeAcc.comment);

      $http.post('/api/account/close', data)
      .then(function(res) {
        var resData = res.data;
        if(resData.success) {
          _.assign(vm.account, resData.result);
          vm.resetOpView();
          vm.getAccountRecords();
          vm.pubSuccessMsg('結清成功,已呈現最新資料');
        }
        else {
          vm.pubErrorMsg('結清失敗,' + resData.message);
        }
      })
      .catch(function(err) {
        vm.pubErrorMsg('結清失敗,' + err.data.toString());
      })
      .finally(function() {
        vm.isProcessing = false;
      });

    }

    vm.accUserChangeOp = function() {
      vm.isProcessing = true;
      var data = {
        _id: vm.account._id,
        newUser: vm.accUserChange.newUser
      };

      notEmptyOrUndefThenAdd(data, 'comment', vm.accUserChange.comment);

      $http.post('/api/account/change-acc-user', data)
      .then(function(res) {
        var resData = res.data;
        if(resData.success) {
          _.assign(vm.account, resData.result);
          vm.resetOpView();
          vm.getAccountRecords();
          vm.pubSuccessMsg('過戶成功,已呈現最新資料');
        }
        else {
          vm.pubErrorMsg('過戶失敗,' + resData.message);
        }
      })
      .catch(function(err) {
        vm.pubErrorMsg('過戶失敗,' + err.data.toString());
      })
      .finally(function() {
        vm.isProcessing = false;
      });
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
      else if(opType === 'transact' || 
              opType === 'close') {
          if(act === 'delete' || act === 'update')
            return true;
          else
            return false;
      }
      else if(opType === 'deposit' ||
              opType === 'withdraw') {
          if(act === 'delete' || act === 'download' || act === 'update')
            return true;
          else
            return false;
      }
    }

    vm.accRecCurPage = 1;
    vm.perPage = 7;

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

    vm.getAccountRecords = function() {  
      $http.post('/api/read', {
        listName: 'AccountRecord',
        filters: vm.filters,
        sort: 'date',
        populate: 'operator period',
        select: 'opType amount date operator comment period ioAccount transaction',
        page: vm.accRecCurPage,
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
        }
        else {
          vm.pubErrorMsg('讀取操作記錄失敗,' + data.message);
        }
      })
      .catch(function(err) {
        vm.pubErrorMsg('讀取操作記錄失敗,' + err.data.toString());
      });
    }

    vm.filters = {
      account: vm.account._id
    };

    vm.opTypeFilterSelected = function() {
      if(vm.opTypeFilter && vm.opTypeFilter !== 'any')
        vm.applyOpTypeFilter = true;
    }

    vm.filterChange = function() {
      var filters = {
        account: vm.account._id
      };

      if(vm.applyOpTypeFilter && vm.opTypeFilter && vm.opTypeFilter !== 'any') {
        filters.opType = vm.opTypeFilter;
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
      vm.getAccountRecords(); 
    }

    vm.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  }]
)
.controller('UpdateFarmerModalCtrler', 
  ['$uibModalInstance','farmer', 'geoDataService','$rootScope',
  function($uibModalInstance, farmer, geoDataService, $rootScope){
    var vm = this;
    vm.farmer = _.clone(farmer, false);
    vm.farmer.birth = Date.parse(vm.farmer.birth);

    vm.selectOnChange = function(targetName, selectVal) {
      if(targetName === 'dists') {
        vm.distSelect = null;
        vm.villages = null;
      }

      return geoDataService.fetch(targetName, selectVal)
              .then(function(data) {
                vm[targetName] = data;
                return data;
              });
    }

    var setAddr = function() {
      if(vm.hasOwnProperty("cities") && vm.hasOwnProperty("dists")
        && vm.citySelect && vm.distSelect) {
        vm.farmer.addr = (vm.citySelect.name + vm.distSelect.dist + vm.farmer.addrRest); 
      }
      else {
        vm.farmer.addr = '';
      }
    }

    //initialization
    vm.getCities = function() {
      vm.selectOnChange('cities', null)
      .then(function(cities) {
        vm.citySelect = _.find(vm.cities, function(city) {
          return city._id === vm.farmer.city;
        });

        return vm.selectOnChange('dists',vm.citySelect._id);
      })
      .then(function(dists) {
        vm.distSelect = _.find(vm.dists, function(dist) {
          return dist._id === vm.farmer.dist;
        });

        return vm.selectOnChange('villages',vm.distSelect._id);
      })
      .then(function(villages) {
        vm.villageSelect = _.find(vm.villages, function(village) {
          return village._id === vm.farmer.village._id;
        });
      })
      .catch(function(err) {
        var msg = err.data? err.data.toString() : err.toString();
        $rootScope.pubErrorMsg('抓取地理資訊失敗,' + msg);
        console.log(err);
      });
    }

    vm.ok = function () {
      vm.farmer.city = vm.citySelect._id;
      vm.farmer.dist = vm.distSelect._id;
      vm.farmer.village = vm.villageSelect._id;
      setAddr();
      $uibModalInstance.close(vm.farmer);
    };
    vm.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  }]
);