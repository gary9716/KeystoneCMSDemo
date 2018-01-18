/**
 * This file is where you define your application routes and controllers.
 *
 * Start by including the middleware you want to run for every request;
 * you can attach middleware to the pre('routes') and pre('render') events.
 *
 * For simplicity, the default setup for route controllers is for each to be
 * in its own file, and we import all the files in the /routes/views directory.
 *
 * Each of these files is a route controller, and is responsible for all the
 * processing that needs to happen for the route (e.g. loading data, handling
 * form submissions, rendering the view template, etc).
 *
 * Bind each route pattern your application should respond to in the function
 * that is exported from this module, following the examples below.
 *
 * See the Express application routing documentation for more information:
 * http://expressjs.com/api.html#app.VERB
 */
var _ = require('lodash');
var keystone = require('keystone');
var middleware = require('./middleware');
var importRoutes = keystone.importer(__dirname);
var Constants = require(__base + 'Constants');

// Common Middleware
keystone.pre('admin', middleware.blockRoute);
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

// Import Route Controllers
var routes = {
	ctrler: importRoutes('./ctrler'),
  api: importRoutes('./api')
};

// Setup Route Bindings
exports = module.exports = function (app) {
	
  // Views
  app.get('/',routes.ctrler.defaultViewCtrler.bind({
    viewPath: 'app',
    state: keystone.get('defaultState')
  }), middleware.doViewRender);

  app.get('/home',routes.ctrler.defaultViewCtrler.bind({
    viewPath: 'app',
    state: 'home'
  }), middleware.doViewRender);

  app.get('/auth', routes.ctrler.signinOrRegister, middleware.doViewRender);

  //APIs
  app.post('/api/read',
    middleware.permissionCheck.bind({
      opName: 'read'
    }),
    routes.api.CRUDOp.read);

  app.get('/api/sys/refresh',middleware.refreshSysInfo,middleware.okResponse);

  app.post('/api/permission',middleware.permissionCheck,middleware.okResponse);

  app.post('/api/user/register',routes.api.UserService.register);
  app.post('/api/user/signin',routes.api.UserService.signin);
  
  app.post('/api/farmer/register',
    middleware.permissionCheck.bind({
      opName: 'create',
      listName: Constants.FarmerListName
    }),
    routes.api.FarmerService.upsert.bind({
      mode: 'create'
    })
  );

  app.post('/api/farmer/update',
    middleware.permissionCheck.bind({
      opName: 'update',
      listName: Constants.FarmerListName
    }),
    routes.api.FarmerService.upsert.bind({
      mode: 'update'
    })
  );

  app.post('/api/farmer/search',
    middleware.permissionCheck.bind({
      opName: 'read',
      listName: Constants.FarmerListName
    }),
    routes.api.FarmerService.search
  );

  app.post('/api/farmer/get-and-populate',
    middleware.permissionCheck.bind([
      {
        opName: 'read',
        listName: Constants.FarmerListName
      },
      {
        opName: 'read',
        listName: Constants.AccountListName
      }
    ]),
    routes.api.FarmerService.getAndPopulate
  );



  app.post('/api/account/create',
    middleware.permissionCheck.bind([
      {
        opName: 'create',
        listName: Constants.AccountListName
      },
      {
        opName: 'read',
        listName: Constants.FarmerListName
      },
      {
        opName: 'create',
        listName: Constants.AccountRecordListName
      }
    ]),
    routes.api.AccountService.create
  );

  app.post('/api/account/close',
    middleware.permissionCheck.bind([
      {
        opName: 'update',
        listName: Constants.AccountListName
      },
      {
        opName: 'create',
        listName: Constants.AccountRecordListName
      }
    ]),
    routes.api.AccountService.close
  );

  app.post('/api/account/set-freeze',
    middleware.permissionCheck.bind([
      {
        opName: 'update',
        listName: Constants.AccountListName
      },
      {
        opName: 'create',
        listName: Constants.AccountRecordListName
      }
    ]),
    routes.api.AccountService.setFreeze
  );

  app.post('/api/account/deposit',
    middleware.permissionCheck.bind([
      {
        opName: 'update',
        listName: Constants.AccountListName
      },
      {
        opName: 'create',
        listName: Constants.AccountRecordListName
      }
    ]),
    routes.api.AccountService.deposit
  );

  app.post('/api/account/withdraw',
    middleware.permissionCheck.bind([
      {
        opName: 'update',
        listName: Constants.AccountListName
      },
      {
        opName: 'create',
        listName: Constants.AccountRecordListName
      }
    ]),
    routes.api.AccountService.withdraw
  );



  app.post('/api/p-type/upsert',
    middleware.permissionCheck.bind(
      {
        opName: ['create','update'],
        listName: Constants.ProductTypeListName
      }
    ),
    routes.api.ProductService.pTypeUpsert
  );

  app.post('/api/product/get', 
    middleware.permissionCheck.bind(
      {
        opName: 'read',
        listName: Constants.ProductListName
      }
    ),
    routes.api.ProductService.get
  );

  app.post('/api/product/transact',
    middleware.permissionCheck.bind([
      {
        opName: 'create',
        listName: Constants.TransactionListName
      },
      {
        opName: 'read',
        listName: Constants.ProductListName
      },
      {
        opName: 'update',
        listName: Constants.AccountListName
      },
      {
        opName: 'create',
        listName: Constants.AccountRecordListName
      }
    ]),
    routes.api.ProductService.transact
  );
  
  /*
  app.post('/api/product/create',
    middleware.permissionCheck.bind(
      {
        opName: 'create',
        listName: Constants.ProductListName
      }
    ),
    routes.api.ProductService.upsert.bind({
      mode: 'create'
    })
  );

  app.post('/api/product/update',
    middleware.permissionCheck.bind(
      {
        opName: 'update',
        listName: Constants.ProductListName
      }
    ),
    routes.api.ProductService.upsert.bind({
      mode: 'update'
    })
  );
  */

  app.post('/api/product/upsert',
    middleware.permissionCheck.bind(
      {
        opName: ['create', 'update'],
        listName: Constants.ProductListName
      }
    ),
    routes.api.ProductService.upsert
  );

  app.post('/api/product/delete',
    middleware.permissionCheck.bind(
      {
        opName: 'delete',
        listName: Constants.ProductListName
      }
    ),
    routes.api.ProductService.delete
  );

};
