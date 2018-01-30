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

exports.aggregateProducts = function(req, res) {
    var form = req.body;

    var pipeline = [];

    if(form.filters) {
        for(let prop in form.filters.date) {
            form.filters.date[prop] = new Date(form.filters.date[prop]);
        }

        if(form.filters.shop) {
            form.filters.shop = mongoose.Types.ObjectId(form.filters.shop);
        }

        pipeline.push({
            $match: form.filters
        });
    }
        
    var projectStage = {
        //only include these fields(1 means including)
        //can only use either including or excluding, not both(except for _id)
        $project: {
            _id: 0, //not include _id
            
            //amount: 1,
            //trader: 1,
            //date: 1,

            account: 1,
            shop: 1,
            products: 1
        }
    };

    var unwindStage = {
        $unwind: "$products"
    };
    
    var facetStage = {
        $facet: {
            "basicInfo": [
                { 
                    $group: {
                        _id: '$products.pid',
                        // these values should be the same, so just arbitraily get one.
                        name: { $first: '$products.name' }, 
                        //pType: { $first: '$products.pType' },
                        weight: { $first: '$products.weight' },
                    }  
                }               
            ],
            "productByShop": [
                { 
                    $group: {
                        _id: { 
                            shop: '$shop',
                            pid: '$products.pid',
                            price: '$products.price'
                        },
                        qty: { $sum: '$products.qty' },
                    }  
                }
            ]
        }
    };

    pipeline.push(projectStage, unwindStage, facetStage);

    var finalResult;
    //console.log(pipeline[0]);
    
    const cursor = transactionList.model.aggregate(pipeline).allowDiskUse(true).cursor({ batchSize: 1000 }).exec();
    
    cursor.next()
    .then(function(result) {
        finalResult = result;
        //console.log(finalResult);

        if(form.filters)
            return transactionList.model.count(form.filters).exec();
        else
            return transactionList.model.count().exec();
    })
    .then(function(count) {
        finalResult.transCount = count;
        res.json({
            success: true,
            result: finalResult
        });
    })
    .catch(function(err) {
        res.ktSendRes(400, err);
    });

}

exports.aggregateAccRecs = function(req, res) {
    var form = req.body;

    var mainPipeline = [], depositPipeline = [];

    if(form.filters) {
        for(let prop in form.filters.date) {
            form.filters.date[prop] = new Date(form.filters.date[prop]);
        }

        mainPipeline.push({
            $match: form.filters
        });
    }

    if(form.period) {
        form.period = mongoose.Types.ObjectId(form.period);
        depositPipeline.push({
            $match: {
                opType: 'deposit',
                period: form.period
            }
        },
        {
            $project: {
                _id: 0,
                amount: 1,
            }
        },
        {
            $group: {
                _id: null, //calculate as whole
                amount: { $sum: '$amount' }
            }
        });

    }

    mainPipeline.push({
        //only include these fields(1 means including)
        //can only use either including or excluding, not both(except for _id)
        $project: {
            _id: 0, //not include _id
            opType: 1,
            amount: 1,
        }
    },
    {
        $group: {
            _id: '$opType',
            amount: { $sum: '$amount' },
            count: { $sum: 1 }
        }
    });

    //combine mainPipeline and depositPipeline into one facetStage
    var facetStage = {
        $facet: {
            "countOpTypeAndSumAmount": mainPipeline,
        }
    };

    if(depositPipeline.length > 0) {
        facetStage.$facet["sumDepositAmountByPeriod"] = depositPipeline;
    }

    const cursor = transactionList.model.aggregate([facetStage]).allowDiskUse(true).cursor({ batchSize: 1000 }).exec();
    
    cursor.next()
    .then(function(result) {
        console.log(result);
        res.json({
            success: true,
            result: result
        });
    })
    .catch(function(err) {
        res.ktSendRes(400, err);
    });

}
