/**
 * This script automatically creates a default Admin user when an
 * empty database is used for the first time. You can use this
 * technique to insert data into any List you have defined.
 *
 * Alternatively, you can export a custom function for the update:
 * module.exports = function(done) { ... }
 */
exports = module.exports = (function() {
	var keystone = require('keystone');
	var async = require('async');
	var fs = require('fs');
	var Constants = require(__base + 'Constants');
	
	var dataCollection = {};
	dataCollection[Constants.UserListName] = [
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
	];

	dataCollection[Constants.RoleListName] = [
				{ 
					name: '用戶資料管理者',
					__ref: 'role_user_manage' 
				},
				{
					name: '訪客',
					__ref: 'role_guest'
				},
				
	];

	var jsonData = JSON.parse(fs.readFileSync(__base + 'initData/zipCodeAndDist.json', 'utf8'));
	dataCollection[Constants.CityListName] = jsonData.cities;
	dataCollection[Constants.AddrPrefixListName] = jsonData.details;

	return {
		create: dataCollection

	};

})();

