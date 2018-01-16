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

	dataCollection[Constants.RegulatedListName] = ([
		Constants.RoleListName,
		Constants.UserListName,
		Constants.ShopListName,
		Constants.PermissionListName,
		Constants.RegulatedListName,
		Constants.FarmerListName,
		Constants.TransactionListName,
		Constants.AccountRecordListName,
		Constants.AccountListName,
		Constants.ProductTypeListName,
		Constants.ProductListName
	]).map(function(listName) {
		return {
			name: listName
		};
	});

	dataCollection[Constants.RoleListName] = [
				{ 
					name: '農民資料管理者',
					__ref: 'role_farmer_manage' 
				},
				{
					name: '訪客',
					__ref: 'role_guest'
				},
				
	];

	dataCollection[Constants.UserListName] = [
		{ 
			'userID': 'admin',
			'name': '管理者',
			'email': 'gary9716@gmail.com', 
			'password': 'admin', 
			'isAdmin': true
		},
		{ 
			'userID': 'test',
			'name': '測試者', 
			'email': 'gary9716@gmail.com', 
			'password': 'test', 
			'isAdmin': false,
			'roles': ['role_farmer_manage'] 
		}
	];

	return {
		create: dataCollection

	};

})();

