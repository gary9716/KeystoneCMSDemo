angular.module('mainApp')
.filter('listTo2DMat',[function() {
  return function(list, numElemPerRow) {
    if(!list || list.length === 0) {
      return [];
    }

    var mat = [], rowIndex = -1;
    list.forEach(function(item, index) {
      if(index % numElemPerRow === 0) {
        rowIndex++;
        mat[rowIndex] = [];
      }

      mat[rowIndex].push(item);
    });

    return mat;
  };
}]);