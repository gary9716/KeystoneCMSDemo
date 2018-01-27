var Constants = require(__base + 'Constants');
var keystone = require('keystone');
var _ = require('lodash');
var mongoose = keystone.get('mongoose');
var dbRecList = keystone.list(Constants.DBRecordListName);

module.exports = function(tag) {
    var obj = this;
    
    var pendingPromises = [];
    obj.dbRec = new dbRecList.model({
        _id: mongoose.Types.ObjectId(),
        status: 'processing',
        steps: []
    });
    var stepModels = [];
    var dbRec = obj.dbRec;
    
    if(tag)
        dbRec.tag = tag;

    obj.results = [];

    obj.addPending = function(promiseFunc, model, oldData, newData) {
        var recStep = {
            status: 'pending',
        };
        
        if(newData && oldData) { //update
            recStep.op = 'update';
            recStep.data = {
                modelName: model.modelName,
                new: newData.toObject? newData.toObject() : newData,
                old: oldData.toObject? oldData.toObject() : oldData
            };
            
        }
        else if(newData) { //create
            recStep.op = 'create';
            recStep.data = {
                modelName: model.modelName,
                new: newData.toObject? newData.toObject() : newData
            };
        }
        else if(oldData) { //delete
            recStep.op = 'delete';
            recStep.data = {
                modelName: model.modelName,
                old: oldData.toObject? oldData.toObject() : oldData
            };
        }
        else {
            throw new Error('unknown operation');
        }

        stepModels.push(model);
        //executing promiseFunc will return promise
        pendingPromises.push(promiseFunc);
        obj.dbRec.steps.push(recStep);

        return obj;
    }

    var updateStatus = function(index, status) {
        dbRec.steps[index].status = status;
        return dbRec.save();
    }

    obj.exec = function() {
        //save pending steps
        var pChain = dbRec.save().then(function(savRec) {
            dbRec = savRec;
        });

        //start to executing query promises
        for(let index = 0;index < pendingPromises.length;index++) {
            pChain = pChain.then(function() {
                return pendingPromises[index]()
                .then(function(result) {
                    obj.results.push(result);
                    return updateStatus(index, 'done');
                });
            });
        }

        return pChain.then(function(){
            //mark this db record done
            return dbRecList.model.update(
                { _id: dbRec._id },
                { status: 'done' }
            ).exec();
        })
        .then(function() {
            //return queries results
            return obj.results;
        })
        .catch(function(err) {
            console.log('start to rollback, err:',err?err.toString():'');

            //rollback
            var steps = dbRec.steps;
            var clearChain = Promise.resolve();
            for(let index = steps.length - 1;index >= 0;index--)  {
                if(steps[index].status === 'done') {
                    if(steps[index].op === 'create') {
                        clearChain = clearChain.then(function() {
                            var savData = obj.results[index];
                            var model = stepModels[index];
                            return model.remove({ _id: savData._id }).exec();
                        }).then(function() {
                            return updateStatus(index, 'rollback');
                        });
                    }
                    else if(steps[index].op === 'update') {
                        clearChain = clearChain.then(function() {
                            var savData = obj.results[index];
                            var model = stepModels[index];
                            var oldData = steps[index].data.old;
                            return model.update({ _id: savData._id }, oldData).exec();
                        }).then(function() {
                            return updateStatus(index, 'rollback');
                        });
                    }
                    else if(steps[index].op === 'delete') {
                        clearChain = clearChain.then(function() {
                            var savData = obj.results[index];
                            var model = stepModels[index];
                            return (new model(savData)).save();
                        }).then(function() {
                            return updateStatus(index, 'rollback');
                        });
                    }
                }
                //else ignore 
            }
            
            clearChain
            .then(function(){
                //mark this db record done
                return dbRecList.model.update(
                    { _id: dbRec._id },
                    { status: 'rollback' }
                ).exec();
            })
            .then(function(){
                console.log('rollback successfully');
            })
            .catch(function(err) {
                console.log('rollback failed', err? err.toString(): '');
            });

        }); //execute promise
    
    }
}