var keystone = require('keystone');
var mongoose = keystone.get('mongoose');
var Constants = require(__base + 'Constants');

var farmerList = keystone.list(Constants.FarmerListName);
var accountList = keystone.list(Constants.AccountListName);
var accountRecList = keystone.list(Constants.AccountRecordListName);
var periodList = keystone.list(Constants.PeriodListName);
var productList = keystone.list(Constants.ProductListName);
var productTypeList = keystone.list(Constants.ProductTypeListName);
var transactionList = keystone.list(Constants.TransactionListName);

/*

Name	Description
$eq	Matches values that are equal to a specified value.
$gt	Matches values that are greater than a specified value.
$gte	Matches values that are greater than or equal to a specified value.
$in	Matches any of the values specified in an array.
$lt	Matches values that are less than a specified value.
$lte	Matches values that are less than or equal to a specified value.
$ne	Matches all values that are not equal to a specified value.
$nin	Matches none of the values specified in an array.

*/

exports.aggregateInInterval = function(req, res) {
    var form = req.body;

    var startDate = form.startDate;
    var stopDate = form.stopDate;

    var pipeline = [];
    pipeline.push({ 
        //find data between these two dates
        $match: { 
            $and: [
                { date: { $gte: startDate } },
                { date: { $lte: stopDate } },
            ]
        }
    });

    var groupStage;
    var unwindStage;
    var projectStage;

    if(form.target === 'transactionProducts') {
        projectStage = {
            //only include these fields(1 means including)
            //can only use either including or excluding, not both(except for _id)
            $project: {
                _id: 0, //not include _id
                //date: 1,
                //account: 1,
                //amount: 1,
                //shop: 1,
                //trader: 1,
                products: 1
            }
        };
        unwindStage = {
            $unwind: "$products"
        };
        groupStage = {
            $group: {
                _id: { //group by pid
                    pid: '$products.pid'
                },
                name: { $first: '$products.name' },
                pType: { $first: '$products.pType' },
                weight: { $first: '$products.weight' },
                price: { $first: '$products.price' },
                qty: { $sum: '$products.qty' }
            }
        };

        pipeline.push(projectStage, unwindStage, groupStage);
    }

    transactionList.aggregate(pipeline)
        .exec()
        .then(function(result) {
            res.json({
                success: true,
                result: result
            });
        })
        .catch(function(err) {
            res.ktSendRes(400, err.toString());
        });

}