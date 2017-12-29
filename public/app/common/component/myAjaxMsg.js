angular.module('mainApp')
.component('myAjaxMsg', {
  template: '<div id="my-ajax-msg">{{$ctrl.msg}}</div>',
  controller: ['$rootScope', myAjaxMsgCtrler]
});

function myAjaxMsgCtrler($rootScope){
  var vm = this;
  $rootScope.$on('ajaxRes', function(event, res){
    if(res.message)
      vm.msg = res.message;
    else
      vm.msg = '';
  });
}