/**
 * This script automatically creates a default Admin user when an
 * empty database is used for the first time. You can use this
 * technique to insert data into any List you have defined.
 *
 * Alternatively, you can export a custom function for the update:
 * module.exports = function(done) { ... }
 */

exports.create = {
	Role: [
		{ 
			name: '用戶資料管理者',
			__ref: 'role_user_manage' 
		},
		{
			name: '訪客',
			__ref: 'role_guest'
		},
		
	],
	User: [
		{ 
			'userID': 'admin',
			'name.first': 'Admin', 
			'name.last': 'User', 
			'email': 'gary9716@gmail.com', 
			'password': 'admin', 
			'isAdmin': true
		},
		{ 
			'userID': 'test',
			'name.first': 'Test', 
			'name.last': 'User', 
			'email': 'gary9716@gmail.com', 
			'password': 'test', 
			'isAdmin': false,
			'roles': ['role_guest'] 
		}
	]
};

/*
async.waterfall([
  function(next) {
    fs.readFile('geoData/zipCodeAndDist.json', 'utf8', function(err, geoInfo) {
      if(err) next(err);
      else next(null, JSON.parse(geoInfo));
    });
  },

  function(next) {

    
  },
  
], function(err) {
  if(err) throw err;
});
*/

/*

// This is the long-hand version of the functionality above:

var keystone = require('keystone');
var async = require('async');
var User = keystone.list('User');

var admins = [
	{ email: 'user@keystonejs.com', password: 'admin', name: { first: 'Admin', last: 'User' } }
];

function createAdmin (admin, done) {

	var newAdmin = new User.model(admin);

	newAdmin.isAdmin = true;
	newAdmin.save(function (err) {
		if (err) {
			console.error('Error adding admin ' + admin.email + ' to the database:');
			console.error(err);
		} else {
			console.log('Added admin ' + admin.email + ' to the database.');
		}
		done(err);
	});

}

exports = module.exports = function (done) {
	async.forEach(admins, createAdmin, done);
};

*/
