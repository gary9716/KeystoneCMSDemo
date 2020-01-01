angular.module('mainApp')
.service('geoDataService', 
  ['$http', 'localStorageService', '$q',
  function($http, localStorageService, $q) {
    var model = this;

    var filterKeys = {
      dists: "city", //dists with certain city property
      villages: "cityDist" //villages with certain cityDist property
    };

    var listNames = {
      cities: "City",
      dists: "AddrPrefix",
      villages: "Village"
		}
		
		var routeNames = {
			cities: "city",
			dists: "dist",
			villages: "village"
		};

    model.fetch = function(targetName, selectVal) {
      
      var key = selectVal? (targetName + "-" + selectVal) : targetName;

      var cachedData = localStorageService.get(key);

      if(cachedData) {
        return $q.resolve(cachedData);
      }

      var queryData;
      if(selectVal) {
        var filter = {};
        filter[filterKeys[targetName]] = selectVal;  
        queryData = {
          listName: listNames[targetName],
          filters: filter
        };
      }
      else {
        queryData = {
          listName: listNames[targetName]
        }
      }
      
      return $http.post('/api/read/' + routeNames[targetName],queryData)
      .then(function(res) {
        var data = res.data;
        if(data.success) {
          localStorageService.set(key, data.result);
          return data.result;
        }
        else {
          return $q.reject(data.message);
        }
      })
    }
  }
]);
