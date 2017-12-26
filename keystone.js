// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').config();

// Require keystone
var keystone = require('keystone');
var handlebars = require('express-handlebars');
var async = require('async');

// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

keystone.init({
	'name': 'testProj',
	'brand': 'testProj',

	'less': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': '.hbs',

	'custom engine': handlebars.create({
		layoutsDir: 'templates/views/layouts',
		partialsDir: 'templates/views/partials',
		defaultLayout: 'default',
		helpers: new require('./templates/views/helpers')(),
		extname: '.hbs',
	}).engine,

	//'emails': 'templates/emails',
	'session store': 'connect-redis',
	'auto update': true,
	'auth': true,
	'user model': 'User',
});

// Load your project's Models
keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js
keystone.set('locals', {
	_: require('lodash'),
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable,
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
		regulatedList.model.find(null, 'name', {lean: true}, function (err1, rlNames) {
			next(err1, rlNames);
		});
	},

	function(rlNames, next) {
		allListNames.forEach(function(listItem) {
			if(!rlNames.some(function(rlItem) {
				if(rlItem.name === listItem)
					return true;
				else
					return false;
			})) {
				//didn't find the object in regulated list
				regulatedList.model.create({name: listItem}, function (err2, item) {
					if(err2) next(err2);
				});
			}
		});
		
		next(null, null);
	},
	/*
	function(next) {
		next();
	},
	*/
	],
	function(errs, results) {
    if(errs) throw errs;    // errs = [err1, err2, err3]
    //console.log(results);   // results = [result1, result2, result3]
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
