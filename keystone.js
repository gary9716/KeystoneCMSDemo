// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').config();
global.__base = __dirname + '/';

// Require keystone
var keystone = require('keystone');
//var handlebars = require('express-handlebars');
var dotEngine = require('express-dot-engine');
var async = require('async');
var helperFuncs = require('./templates/views/helpers/index');
var _ = require('lodash');
var Constants = require(__base + 'Constants');

keystone.set('defaultState', process.env.DEFAULT_STATE || 'home' );

// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

/*
// doT settings(for customization)
dotEngine.settings.dot = {
  evaluate:    /\[\[([\s\S]+?)\]\]/g,
  interpolate: /\[\[=([\s\S]+?)\]\]/g,
  encode:      /\[\[!([\s\S]+?)\]\]/g,
  use:         /\[\[#([\s\S]+?)\]\]/g,
  define:      /\[\[##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\]\]/g,
  conditional: /\[\[\?(\?)?\s*([\s\S]*?)\s*\]\]/g,
  iterate:     /\[\[~\s*(?:\]\]|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\]\])/g,
  varname: 'layout, partial, locals, model',
  strip: false,
  append: true,
  selfcontained: false,
};
*/

/*
//this express-dot-engine's templating keyword
[[ ]]     for evaluation
[[= ]]    for interpolation
[[! ]]    for interpolation with encoding
[[# ]]    for compile-time evaluation/includes and partials
[[## #]]  for compile-time defines
[[? ]]    for conditionals
[[~ ]]    for array iteration
*/

keystone.init({
	'name': 'testProj',
	'brand': 'testProj',

	'less': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': 'dot',
	/*
	'custom engine': handlebars.create({
		layoutsDir: 'hbsTemplates/views/layouts',
		partialsDir: 'hbsTemplates/views/partials',
		defaultLayout: 'default',
		helpers: new require('./hbsTemplates/views/helpers')(),
		extname: '.hbs',
	}).engine,
	*/
	'custom engine': dotEngine.__express,

	//'emails': 'templates/emails',
	'session store': 'connect-redis',
	'auto update': true,
	'user model': 'User',
	'auth' : true
});

/*
keystone.initExpressApp();
var app = keystone.app;

//remove official signin routes and api
var officialSigninRoute = '/' + keystone.get('admin path') + '/signin';
var officialSigninAPI = '/' + keystone.get('admin path') + '/api/session/signin';

console.log(app);

var removeRoute = require('express-remove-route');
removeRoute(app, officialSigninAPI);
removeRoute(app, officialSigninRoute);
*/

// Load your project's Models
keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js
keystone.set('locals', {
	_: _,
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable,
	helpers: helperFuncs()
});


// Use our own sign in and sign out route
keystone.set('signin url', '/signin_or_register');
keystone.set('signin redirect', '/');
keystone.set('signout redirect', keystone.get('signin url') + '?status=signed_out');


// Load your project's Routes
keystone.set('routes', require('./routes'));

// Configure the navigation bar in Keystone's Admin UI
keystone.set('nav', {
	/*
	posts: ['posts', 'post-categories'],
	galleries: 'galleries',
	enquiries: 'enquiries',
	*/
	users: 'users',
});

var allListNames = Object.keys(keystone.lists);
var regulatedList = keystone.list('RegulatedList');

async.waterfall([
	function(next) {
		regulatedList.model
		.find()
		.select('name')
		.lean()
		.exec(function (err1, rlNames) {
			next(err1, rlNames);
		});
	},

	function(rlNames, next) {
		var rlEntriesForCreation = [];
		allListNames.forEach(function(listItem) {
			if(!rlNames.some(function(rlItem) {
				if(rlItem.name === listItem)
					return true;
				else
					return false;
			})) {
				//didn't find the object in regulated list
				rlEntriesForCreation.push({ 
					name: listItem,
				});
			}
		});
		
		if(rlEntriesForCreation.length > 0) {
			var dataCollection = {};
			dataCollection[Constants.RegulatedListName] = rlEntriesForCreation;

			keystone.createItems(
				dataCollection,
				function(err, stats) {
					stats && console.log(stats.message);
					next(err, rlNames);
			});
		}
		
	},
	
	function(rlNames, next) {
		var itemsToRemove = _.differenceWith(rlNames, allListNames, function(rlItem, allListItem) {
			return (rlItem.name === allListItem);
		});
		
		if(itemsToRemove)
			console.log('[keystone.js] should remove:['+itemsToRemove.toString()+']');
		
		next();
	},
	
	],
	function(errs) {
    if(errs) throw errs;    // errs = [err1, err2, err3]
});


// Start Keystone to connect to your database and initialise the web server
if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
	console.log('----------------------------------------'
	+ '\nWARNING: MISSING MAILGUN CREDENTIALS'
	+ '\n----------------------------------------'
	+ '\nYou have opted into email sending but have not provided'
	+ '\nmailgun credentials. Attempts to send will fail.'
	+ '\n\nCreate a mailgun account and add the credentials to the .env file to'
	+ '\nset up your mailgun integration');
}

keystone.start();
