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
var compression = require('compression');
var path = require('path');
var fs = require('fs');
var morgan = require('morgan');
var logDirectory = path.join(__base, 'Logs');
var util = require('util');

// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

function pad(num) {
    return (num > 9 ? "" : "0") + num;
}
 
const logNameBase = 'access.log';
function generator(time, index) {
    if(! time)
        return logNameBase;
 
    var month  = time.getFullYear() + "" + pad(time.getMonth() + 1);
    var day    = pad(time.getDate());
    var hour   = pad(time.getHours());
    var minute = pad(time.getMinutes());
 
    return month + "/" + month +
        day + "-" + hour + minute + "-" + index + "-" +logNameBase;
}

//rotating logging sys
var rfs    = require('rotating-file-stream');
var accessLogStream = rfs(generator, {
    //size:     '10M', // rotate every 10 MegaBytes written
    interval: '1d',  // rotate daily
    compress: 'gzip', // compress rotated files
    maxFiles: 45, //keep 45 days log
    path: logDirectory
});

morgan.token('sysUser', function (req) {
  var user = req.user;
  if(user) 
    return util.format('{uid: %s, name: %s, roles: %s, admin: %s}', user.userID, user.name, user.roles? user.roles.toString(): '', user.isAdmin );
  else
    return undefined;
});

morgan.token('errInfo', function (req, res) {
  return res.myErrInfo? res.myErrInfo: res.statusMessage;
});

// Common Middleware
keystone.pre('admin', middleware.blockRoute);
keystone.pre('routes', middleware.refreshSysInfo, middleware.initLocals, middleware.addCustomResHandler);
keystone.pre('render', middleware.flashMessages);

// Import Route Controllers
var routes = {
	ctrler: importRoutes('./ctrler'),
  api: importRoutes('./api')
};

// Setup Route Bindings
exports = module.exports = function (app) {
  const createOp = 'create';
  const readOp = 'read';
  const updateOp = 'update';
  const deleteOp = 'delete';

  //log request error to log files
  app.use(morgan('{date:":date[clf]", ip:":remote-addr", user::sysUser, method:":method :url", code:":status", msg:":errInfo", agent:":user-agent"}', { 
    stream: accessLogStream,
    //only log error, skip success request
    skip: function (req, res) { return res.statusCode < 400 }, 
  }));

  // Views
  app.get('/',
    compression(),
    routes.ctrler.defaultViewCtrler.bind({
    viewPath: 'app',
    state: keystone.get('defaultState')
  }), middleware.doViewRender);

  app.get('/auth', 
    compression(),
    routes.ctrler.signinOrRegister, 
    middleware.doViewRender);

	app.get('/customer-survey',
	compression(),
    routes.ctrler.defaultViewCtrler.bind({
    viewPath: 'customerApp',
    state: 'register'
  }), middleware.doViewRender);

	if(process.env.RESET_PERMITTED) {
		app.get('/reset', 
			middleware.requireAdmin,
			middleware.resetPartialDB);
	}

  //Gen PDF route
  /*
  
  app.get('/pdf/',
    compression(),
    middleware.doPDFGenViaPDFMake.bind({
      doc: 'test-doc'
    })
  );
  
  */

  //pdf that everyone can print
  
  app.post('/pdf/unfreeze-sheet',
    compression(),
    middleware.doPDFGenViaPDFMake.bind({
      doc: 'unfreeze-sheet'
    })
  );

  app.post('/pdf/transacted-products',
    compression(),
    middleware.doPDFGenViaPDFMake.bind({
      doc: 'transacted-products'
    })
  );

  app.post('/pdf/acc-recs-aggregate',
    compression(),
    middleware.doPDFGenViaPDFMake.bind({
      doc: 'acc-recs-related'
    })
  );

	app.post('/pdf/customer-survey',
		compression(),
		middleware.doPDFGenViaPDFMake.bind({
			doc: 'customer-survey'
		})
	);

	app.post('/pdf/customer-list',
		compression(),
		middleware.doPDFGenViaPDFMake.bind({
			doc: 'customer-list'
		})
	);

  //

  app.post('/pdf/account-rec',
    compression(),
    middleware.permissionCheck.bind([
      {
        listName: Constants.AccountRecordListName,
        opName: readOp
      },
      {
        opName: readOp,
        listName: Constants.FarmerListName
      }
    ]),
    middleware.doPDFGenViaPDFMake.bind({
      doc: 'interval-acc-recs'
    })
  );

  app.post('/pdf/deposit-withdraw-sheet',
    compression(),
    middleware.permissionCheck.bind([
      {
        listName: Constants.AccountRecordListName,
        opName: readOp
      },
      {
        opName: readOp,
        listName: Constants.FarmerListName
      }
    ]),
    middleware.doPDFGenViaPDFMake.bind({
      doc: 'deposit-withdraw-sheet'
    })
  );

  //APIs
  app.post('/api/read',
    compression(),
    middleware.permissionCheck.bind({ //listName would be passed in request
      opName: readOp
    }),
		routes.api.CRUDOp.read);
		
	app.post('/api/read/city',
    compression(),
		routes.api.CRUDOp.read);
		
	app.post('/api/read/village',
    compression(),
		routes.api.CRUDOp.read);
		
	app.post('/api/read/dist',
    compression(),
    routes.api.CRUDOp.read);


  app.get('/api/sys/refresh',middleware.refreshSysInfo,middleware.okResponse);

  app.post('/api/permission',middleware.permissionCheck,middleware.okResponse);

  //app.post('/api/user/register',routes.api.UserService.register); //this register feature was used in front end
  app.post('/api/user/signin',routes.api.UserService.signin);
  

  app.post('/api/farmer/register',
    middleware.permissionCheck.bind({
      opName: createOp,
      listName: Constants.FarmerListName
    }),
    routes.api.FarmerService.upsert.bind({
      mode: createOp
    })
  );

  app.post('/api/farmer/update',
    middleware.permissionCheck.bind({
      opName: updateOp,
      listName: Constants.FarmerListName
    }),
    routes.api.FarmerService.upsert.bind({
      mode: updateOp
    })
  );

  app.post('/api/farmer/search',
    compression(),
    middleware.permissionCheck.bind({
      opName: readOp,
      listName: Constants.FarmerListName
    }),
    routes.api.FarmerService.search
  );

  app.post('/api/farmer/get-and-populate',
    compression(),
    middleware.permissionCheck.bind([
      {
        opName: readOp,
        listName: Constants.FarmerListName
      },
      {
        opName: readOp,
        listName: Constants.AccountListName
      }
    ]),
    routes.api.FarmerService.getAndPopulate
  );

	app.post('/api/customer-survey/upsert',
    compression(),
    middleware.permissionCheck.bind([
      {
        opName: updateOp,
        listName: Constants.CustomerSurveyListName
      }
    ]),
		routes.api.CustomerService.upsert
	);

	
	app.post('/api/customer-survey/sync',
    compression(),
    middleware.permissionCheck.bind([
      {
        opName: readOp,
        listName: Constants.CustomerSurveyListName
      }
    ]),
		routes.api.CustomerService.sync
  );
  
  app.post('/api/customer-survey/simple-sync',
    compression(),
    middleware.permissionCheck.bind([
      {
        opName: readOp,
        listName: Constants.CustomerSurveyListName
      }
    ]),
		routes.api.CustomerService.simpleSync
	);

	app.post('/api/customer-survey/search',
    compression(),
    middleware.permissionCheck.bind([
      {
        opName: readOp,
        listName: Constants.CustomerSurveyListName
      }
    ]),
		routes.api.CustomerService.search
	);

	app.post('/api/customer-survey/changeState',
    compression(),
    middleware.roleExclude.bind({
      roles: ['訪查員']
    }),
		middleware.permissionCheck.bind([
      {
        opName: updateOp,
        listName: Constants.CustomerSurveyListName
      }
    ]),
		routes.api.CustomerService.changeState
	);

	app.post('/api/customer-survey/update-comment',
    middleware.roleExclude.bind({
      roles: ['訪查員']
    }),
    middleware.permissionCheck.bind([
      {
        opName: updateOp,
        listName: Constants.CustomerSurveyListName
      }
    ]),
		routes.api.CustomerService.updateComment
	);

	app.post('/api/customer-survey/delete',
    compression(),
    middleware.permissionCheck.bind([
      {
        opName: deleteOp,
        listName: Constants.CustomerSurveyListName
      }
    ]),
		routes.api.CustomerService.delete
	);

	//
  app.post('/api/account-rec/delete',
    middleware.permissionCheck.bind([
      {
        opName: deleteOp,
        listName: Constants.AccountRecordListName
      },
      {
        opName: deleteOp,
        listName: Constants.TransactionListName
      },
      {
        opName: updateOp,
        listName: Constants.AccountListName
      }
    ]),
    routes.api.AccountService.deleteRec
  );

  app.post('/api/account-rec/update',
    middleware.permissionCheck.bind([
      {
        opName: updateOp,
        listName: Constants.AccountRecordListName
      },
      {
        opName: updateOp,
        listName: Constants.TransactionListName
      },
      {
        opName: updateOp,
        listName: Constants.AccountListName
      }
    ]),
    routes.api.AccountService.updateRec
  );

  app.post('/api/account-rec/aggregate',
    middleware.permissionCheck.bind([
      {
        opName: readOp,
        listName: Constants.AccountRecordListName
      },
      {
        opName: readOp,
        listName: Constants.AccountListName
      }
    ]),
    routes.api.AggregateService.aggregateAccRelated
  );

  app.post('/api/transaction/update', 
    middleware.permissionCheck.bind([
      {
        opName: updateOp,
        listName: Constants.AccountRecordListName
      },
      {
        opName: updateOp,
        listName: Constants.TransactionListName
      },
      {
        opName: updateOp,
        listName: Constants.AccountListName
      }
    ]),
    routes.api.AccountService.lookupAccIDViaTrans,
    routes.api.AccountService.updateRec
  );

  app.post('/api/transaction/delete', 
    middleware.permissionCheck.bind([
      {
        opName: deleteOp,
        listName: Constants.AccountRecordListName
      },
      {
        opName: deleteOp,
        listName: Constants.TransactionListName
      },
      {
        opName: updateOp,
        listName: Constants.AccountListName
      }
    ]),
    routes.api.AccountService.lookupAccIDViaTrans,
    routes.api.AccountService.deleteRec
  );

  app.post('/api/transaction/aggregate-product',
    middleware.permissionCheck.bind([
      {
        opName: readOp,
        listName: Constants.TransactionListName
      },
      {
        opName: readOp,
        listName: Constants.AccountRecordListName
      },
      {
        opName: readOp,
        listName: Constants.AccountListName
      },
      {
        opName: readOp,
        listName: Constants.FarmerListName
      }
    ]),
    routes.api.AggregateService.aggregateProducts
  );



  app.post('/api/account/create',
    middleware.permissionCheck.bind([
      {
        opName: createOp,
        listName: Constants.AccountListName
      },
      {
        opName: readOp,
        listName: Constants.FarmerListName
      },
      {
        opName: createOp,
        listName: Constants.AccountRecordListName
      }
    ]),
    routes.api.AccountService.create
  );

  app.post('/api/account/close',
    middleware.roleExclude.bind({
      roles: ['兌領交易員']
    }),
    middleware.permissionCheck.bind([
      {
        opName: updateOp,
        listName: Constants.AccountListName
      },
      {
        opName: createOp,
        listName: Constants.AccountRecordListName
      }
    ]),
    routes.api.AccountService.close
  );

  app.post('/api/account/set-freeze',
    middleware.roleExclude.bind({
      roles: ['兌領交易員']
    }),
    middleware.permissionCheck.bind([
      {
        opName: updateOp,
        listName: Constants.AccountListName
      },
      {
        opName: createOp,
        listName: Constants.AccountRecordListName
      }
    ]),
    routes.api.AccountService.setFreeze
  );

  app.post('/api/account/deposit',
    middleware.roleExclude.bind({
      roles: ['兌領交易員']
    }),
    middleware.permissionCheck.bind([
      {
        opName: updateOp,
        listName: Constants.AccountListName
      },
      {
        opName: createOp,
        listName: Constants.AccountRecordListName
      }
    ]),
    routes.api.AccountService.deposit
  );

  app.post('/api/account/withdraw',
    middleware.roleExclude.bind({
      roles: ['兌領交易員']
    }),
    middleware.permissionCheck.bind([
      {
        opName: updateOp,
        listName: Constants.AccountListName
      },
      {
        opName: createOp,
        listName: Constants.AccountRecordListName
      }
    ]),
    routes.api.AccountService.withdraw
  );

  app.post('/api/account/change-acc-user',
    middleware.roleExclude.bind({
      roles: ['兌領交易員']
    }),
    middleware.permissionCheck.bind([
      {
        opName: updateOp,
        listName: Constants.AccountListName
      },
      {
        opName: createOp,
        listName: Constants.AccountRecordListName
      }
    ]),
    routes.api.AccountService.changeAccUser
  );

  app.post('/api/account/annually-withdraw',
    middleware.requireAdmin,
    routes.api.AccountService.annuallyWithdraw,
    routes.api.AccountService.downloadAWMediaFile
  );

  app.post('/api/account/cancel-annually-withdraw',
    middleware.requireAdmin,
    routes.api.AccountService.deleteAnnuallyWithdraw);

  app.post('/api/account/gen-annually-withdraw-file',
    middleware.permissionCheck.bind([
      {
        opName: readOp,
        listName: Constants.AccountListName
      },
      {
        opName: readOp,
        listName: Constants.FarmerListName
      },
      {
        opName: readOp,
        listName: Constants.AccountRecordListName
      }
    ]),
    routes.api.AccountService.getAnnuallyWithdrawData,
    routes.api.AccountService.downloadAWMediaFile
  );

  app.post('/api/p-type/upsert',
    middleware.permissionCheck.bind(
      {
        opName: [createOp,updateOp],
        listName: Constants.ProductTypeListName
      }
    ),
    routes.api.ProductService.pTypeUpsert
  );

  app.post('/api/product/get',
    compression(),
    middleware.permissionCheck.bind(
      {
        opName: readOp,
        listName: Constants.ProductListName
      }
    ),
    routes.api.ProductService.get
  );

  app.post('/api/product/transact',
    middleware.permissionCheck.bind([
      {
        opName: createOp,
        listName: Constants.TransactionListName
      },
      {
        opName: readOp,
        listName: Constants.ProductListName
      },
      {
        opName: readOp,
        listName: Constants.ProductTypeListName
      },
      {
        opName: updateOp,
        listName: Constants.AccountListName
      },
      {
        opName: createOp,
        listName: Constants.AccountRecordListName
      }
    ]),
    
    routes.api.ProductService.transact
  );
  
  app.post('/api/product/upsert',
    middleware.permissionCheck.bind(
      {
        opName: [createOp, updateOp],
        listName: Constants.ProductListName
      }
    ),
    routes.api.ProductService.upsert
  );

  app.post('/api/product/delete',
    middleware.permissionCheck.bind(
      {
        opName: deleteOp,
        listName: Constants.ProductListName
      }
    ),
    routes.api.ProductService.delete
  );

};
