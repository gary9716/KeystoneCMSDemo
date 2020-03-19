module.exports = function(done) {
    var keystone = require('keystone');
    var async = require('async');
    var fs = require('fs');
    var Constants = require(__base + 'Constants');
    var mongoose = keystone.get('mongoose');
    
    var regulatedList = keystone.list(Constants.RegulatedListName);
    var permissionList = keystone.list(Constants.PermissionListName);
    var roleList = keystone.list(Constants.RoleListName);

    const createOp = 'create';
    const readOp = 'read';
    const updateOp = 'update';
    const deleteOp = 'delete';
    var gRL = null;
    var gP = null;

    regulatedList.model.findOne({ 
        name: Constants.CustomerSurveyListName
    })
    .exec()
    .then((rl) => {
        if(rl) {
            return rl;
        }
        else {
            var newRL = new regulatedList.model({
                name: Constants.CustomerSurveyListName
            });
            return newRL.save();
        }
    })
    .then((rl) => {
        gRL = rl;
        return permissionList.model.findOne({
            listName: rl._id
        }).exec();
    })
    .then((p) => {
        if(p) {
            p.listName = gRL._id;
            p.name = gRL.name + '存取權限';
            return p.save();
        }
        else {
            let newP = new permissionList.model({
                listName: gRL._id,
                name: gRL.name + '存取權限',
                create: [],
                read: [],
                update: [],
                delete: []
            });

            return newP.save();
        }
    })
    .then((p) => {
        gP = p;
        return roleList.model.findOne({
            name: '訪查員'
        }).exec();
    })
    .then((r) => {
        if(r) return r;
        else {
            var newR = new roleList.model({
                name: '訪查員'
            });
            return newR.save();
        }
    })
    .then((r) => {
        done();
    })
    .catch(function(err) {
        done(err);
    });
};