angular.module('mainApp')
.service('myValidation', [
  '$http', 
  function($http) {
    this.checkPID = checkPID;
    this.checkAuth = checkAuth;

    function checkPID(pid, errCB) {
   
        var err = {};

        if ( pid.length !== 10 ) {
          if(errCB) {
            err.message = '身分證字號長度不正確';
            errCB(err);  
          }
          return false;
        }
        
        if (/^[A-Za-z][12][\d]{8}$/.test(pid) || //國民（身分證字號）
            /^[A-Za-z][A-Da-d][\d]{8}$/.test(pid)) { //外國人(居留證號)
          var table = 'ABCDEFGHJKLMNPQRSTUVXYWZIO';
          var A1 = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3];
          var A2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5];
          var Mx = [9, 8, 7, 6, 5, 4, 3, 2, 1, 1]; //last digit is for checkCode
          //Mx[0] is A2Factor
          var A1Factor = 1;
          var sum = 0;
          pid.split('').forEach(function(curChar, curIndex) {
            if(curIndex == 0) {
              var i = table.indexOf(curChar.toUpperCase());
              sum = A1[i] * A1Factor + A2[i] * Mx[curIndex];
            }
            else if(curIndex == 1) {
              var i = table.indexOf(curChar.toUpperCase());
              if(i != -1) {
                sum += i * Mx[curIndex];
              }
              else {
                var val = parseInt(curChar);
                if(isNaN(val)) {
                  sum = val;
                }
                else {
                  sum += val * Mx[curIndex];  
                }
              }
            }
            else {
              var val = parseInt(curChar);
              if(isNaN(val)) {
                sum = val;
              }
              else {
                sum += val * Mx[curIndex];  
              }
            }

          });

          if(sum % 10 == 0) {
            return true;
          }
          else {
            if(errCB) {
              err.message = '不合法身分證字號';
              errCB(err);  
            }
            
            return false;
          }

        }
        else {
          if(errCB) {
            err.message = '含不合法字元，請檢查';
            errCB(err);
          }
          return false;
        }
        
    }

    function checkAuth() {

    }
}]);