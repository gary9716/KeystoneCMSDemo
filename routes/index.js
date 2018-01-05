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
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

// Import Route Controllers
var routes = {
	views: importRoutes('./views'),
  api: importRoutes('./api')
};

// Setup Route Bindings
exports = module.exports = function (app) {
	
  // Views
  app.get('/',routes.views.defaultViewCtrler.bind({
    viewPath: 'app',
    state: keystone.get('defaultState')
  }), middleware.doViewRender);

  app.get('/home',routes.views.defaultViewCtrler.bind({
    viewPath: 'app',
    state: 'home'
  }), middleware.doViewRender);

  app.get('/signin_or_register', routes.views.signinOrRegister, middleware.doViewRender);

  /*
  app.get('/blog/:category?', routes.views.blog);
	app.get('/blog/post/:post', routes.views.post);
	app.get('/gallery', routes.views.gallery);
  app.all('/contact', routes.views.contact);
  */

  //APIs
  app.post('/api/userRegister',routes.api.UserService.register);
  app.post('/api/userSignin',routes.api.UserService.signin);
  app.post('/api/read',routes.api.RegulatedCRUDOp.read);
  app.post('/api/permission',middleware.permissionCheck,middleware.okResponse);

  app.post('/api/farmer/register',
    middleware.permissionCheck.bind({
      opName: 'create',
      listName: Constants.FarmerListName
    }),
    routes.api.FarmerService.register
  );

  //app.post('/api/create',routes.api.RegulatedCRUDOp.create);
  //app.post('/api/update',routes.api.RegulatedCRUDOp.update);
  //app.post('/api/delete',routes.api.RegulatedCRUDOp.delete);
  
  // NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
	// app.get('/protected', middleware.requireUser, routes.views.protected);

};
