angular.module('mainApp')
.controller('FarmerRegisterCtrler', ['myValidation', function(myValidation) {
  var vm = this;
  vm.checkPID = myValidation.checkPID;
  vm.msg = 'Hi, this is FarmerRegisterCtrler';

}]);