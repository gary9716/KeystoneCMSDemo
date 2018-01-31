/**
 * This script automatically creates a default Admin user when an
 * empty database is used for the first time. You can use this
 * technique to insert data into any List you have defined.
 *
 * Alternatively, you can export a custom function for the update:
 * module.exports = function(done) { ... }
 */
module.exports = function(done) {
	var keystone = require('keystone');
	var async = require('async');
	var fs = require('fs');
	var Constants = require(__base + 'Constants');

	var userList = keystone.list(Constants.UserListName);

	var defaultAdmin = { 
		'userID': 'admin',
		'name': '管理者', 
		'password': 'admin', 
		'isAdmin': true
	};

	userList.model.findOne({
		userID: defaultAdmin.userID
	}).exec()
	.then(function(user){
		if(user) {
			return Promise.reject('existed');
		}
		else {
			var newUser = new userList.model(defaultAdmin);
			return newUser.save();
		}
	})
	.then(function(savUser) {
		done();
	})
	.catch(function(reason) {
		if(reason !== 'existed')
			done(reason);
		else
			done();
	});
	
}

