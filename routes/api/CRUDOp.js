var keystone = require('keystone'),
  async = require('async'),
  _ = require('lodash'),
  Constants = require(__base + 'Constants');
var middleware = require('../middleware');

/*
method: POST
format: {
  listName: the list name that is going to be operated with this api,
  itemData: used in 
    create(can be object or array of objects), 
    update(object only, filter with filters and update to itemData),
  filters(object) : 
    used in read(optional), 
            update(required), 
            delete(required)

  select(array): used in read
  populate(array): used in read
  
  pagination:(used in read)
    page: page to start at
    perPage: number of results per page
    maxPages: optional, causes the page calculation to omit pages from the beginning/middle/end
    (useful if you have lots of pages, and do not want them to wrap over several lines).
}
*/

exports.read = function(req, res) {

  var form = req.body;

  var targetList = keystone.list(form.listName);
  if(!targetList)
    return res.ktSendRes(400, '欲讀取的列表不存在');
    
  var query;

  var isPagination;

  if(form.hasOwnProperty("page") && form.hasOwnProperty("perPage")) { //pagination
    
    isPagination = true;

    var paginateOpt = {
      page: form.page,
      perPage: form.perPage,
    };

    if(form.maxPages) {
      paginateOpt.maxPages = form.maxPages;
    }

    if(form.filters) 
      paginateOpt.filters = form.filters;

    query = targetList.paginate(paginateOpt);

  }
  else {
    
    isPagination = false;

    var filters = {};

    if(form.hasOwnProperty("filters"))  {
      filters = form.filters;
    }
    
    if(form.hasOwnProperty("contains")) {
      for(let prop in form.contains) {
        filters[prop] = middleware.getRegExp(form.contains[prop], 'substr');
      }
    }
    
    query = targetList.model.find(filters);


    if(form.hasOwnProperty("limit"))
      query = query.limit(form.limit);
    
  }
  
  if(form.hasOwnProperty("sort")) {
    if(form.sortAscend)
      query = query.sort('+'+form.sort);
    else
      query = query.sort('-'+form.sort);
  }

  if(form.hasOwnProperty("select")) {
    if(form.select instanceof Array)
      query = query.select(form.select.join(' '));
    else
      query = query.select(form.select);
  }
    
  if(form.hasOwnProperty("populate")) {
    if(form.populate instanceof Array)
      query = query.populate(form.populate.join(' '));
    else
      query = query.populate(form.populate);
  }

    query.lean()
    .exec(function(err, data) {
      if(err) {
        return res.ktSendRes(400, err.toString());
      }

      var resData;

      if(isPagination) {
        resData = {
          success: true,
          result: data.results,
          total: data.total
        };
      }
      else {
        resData = {
          success: true,
          result: data
        };
      }

      res.json(resData);
    });
    
};
