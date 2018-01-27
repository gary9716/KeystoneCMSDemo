// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').config();
global.__base = __dirname + '/';

// Require keystone
var Fawn = require("fawn");
var keystone = require('keystone');
var dotEngine = require('express-dot-engine');
var async = require('async');
var helperFuncs = require('./templates/views/helpers/index');
var _ = require('lodash');
var middleware = require('./routes/middleware');
var Constants = require(__base + 'Constants');
var fs = require('fs');

var mongoose = keystone.get('mongoose');

keystone.set('defaultState', process.env.DEFAULT_STATE || 'home' );

if(!process.env.FILE_UPLOAD_PATH)
	throw new Error('please specify file upload directory in .env');

var uploadDir = process.env.FILE_UPLOAD_PATH
fs.existsSync(uploadDir) || fs.mkdirSync(uploadDir)

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
	'name': '白米兌換管理系統',
	'brand': '白米兌換管理系統',
	'port': 8080,
	'less': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': 'dot',
	'custom engine': dotEngine.__express,
	'session store': 'connect-redis',
	'auto update': false,
	'user model': 'User',
	'auth' : true,
	'compress': false //controle the compress middleware myself
});


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

keystone.set('file limit', 1000000); //in bytes(1MB)

// Use our own sign in and sign out route
keystone.set('signin url', '/auth');
keystone.set('signin redirect', '/');
keystone.set('signout redirect', keystone.get('signin url') + '?status=signed_out');


// Load your project's Routes
keystone.set('routes', require('./routes'));

// Configure the navigation bar in Keystone's Admin UI
keystone.set('nav', {
	'使用者': ['users', 'shops'],
	'權限': ['permissions', 'roles'],
	'農民': ['farmers'],
	'存摺': ['accounts','account-records'],
	'交易': ['products','product-types','periods','transactions'],
	'地理資訊': ['cities', 'addr-prefixes', 'villages'],
	'系統': ['systems'],
});

/*
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
*/


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


//Fawn.init(mongoose);
//var roller = Fawn.Roller();
//roller.roll()
//.then(function() {
//	console.log('rollback process complete');	

	//do db updates here
	//manually do db update after some incomplete transaction rollback completed
	require('./DBUpdate')(function() {
		//set system parameters after DB update
		middleware.refreshSysInfo(null, null, function(err) {
			if(err) throw err;
			console.log('sys parameters set');

		});
	});

//});

/*
var dbRecList = keystone.list(Constants.DBRecordListName);
dbRecList.model.find().sort('-createdAt').limit(1).lean()
.then(function(rec) {
	if(rec && rec.length > 0)
		console.log('latest rec,',rec[0]);
});
*/

keystone.start();
