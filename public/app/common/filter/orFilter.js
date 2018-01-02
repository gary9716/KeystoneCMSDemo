angular.module('mainApp')
.filter('orFilter', [
  '$filter', 
  function($filter) {
    return function (input, fields, filterText, strict, trackField) {
      var filterFunc = $filter('filter');
        if(fields && fields.length > 0 && filterText) {
            var result = fields.map(function(field) {
              var filterInfo = {};
                filterInfo[field] = filterText;
              return filterFunc(input, filterInfo, strict);
            });
            
            result = result.reduce(function(total, current) {
              return total.concat(current);
            });
            
            if(trackField)
              return _.uniqBy(result, trackField);
            else
              return _.uniq(result);
        }
        else {
          return filterFunc(input, filterText, strict);
        }
        
    };

}]);