var moment = require('moment');
var keystone = require('keystone');
var Constants = require(__base + 'Constants');
var opTypeMap =
{
    'create':'開戶' ,
    'deposit':'入款' ,
    'withdraw':'提款' ,
    'annuallyWithdraw':'年度結清',
    'unfreeze':'解凍',
    'freeze':'凍結' ,
    'transact':'兌領' ,
    'close':'結清' ,
    'accUserChange':'過戶' 
};
const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports = function(req, res) {
    
    var form = req.body;
    var filename = '';

    var startMoment, endMoment, intervalInfo = [];
    var sysInfo = keystone.get('sysParams');
    var locationName = sysInfo.farmName;
    
    var sheetName;
    sheetName = '農民期間交易明細表';
    
    if(form.startDate) {
        startMoment = moment(form.startDate);
        var txt = '從'  + startMoment.rocFormat();
        filename += (txt);
        intervalInfo.push(txt);
    }
    
    if(form.endDate) {
        endMoment = moment(form.endDate);
        var txt = '到' + endMoment.rocFormat();
        filename += (txt);
        intervalInfo.push(txt);
    }

    var metaInfo = {
        columns: [
            {
                text: "農民姓名:" + form.farmer.name,
                width: "20%"
            },
            {
                text: "資料期間:" + intervalInfo,
                width: '50%'
            },
            {
                text: '印表日期:' + moment().rocFormat(),
                width: '30%',
                alignment: 'right'
            }
        ]
    };

    filename += '的' + sheetName + '.pdf';
    res.locals.filename = filename;

    //footer------
    var offset = 0;

    var divisionInfo = {
        columns: [
            '記帳', '出納', '供銷部主任', '會計主任', '秘書', '總幹事'
        ],
        margin: [10, 100 + offset]
    };

    var footerFunc = function(page, pages) {
        return {
            alignment: 'center',
            text: { text: '第' + page + '頁' }
        };

    };
    //-----------
    var accountRecList = keystone.list(Constants.AccountRecordListName);

    var applyDateFilter = false;
    var dateFilters = {};
    if(form.startDate) {
        dateFilters['$gte'] = form.startDate;
        applyDateFilter = true;
    }

    if(form.endDate) {
        dateFilters['$lt'] = form.endDate;
        applyDateFilter = true;
    }
        
    var filters = {
        account: form._id,
    };

    if(applyDateFilter) {
        filters['date'] = dateFilters;
    }

    return accountRecList.model.find(filters)
    .populate('operator period')
    .sort('-date')
    .lean()
    .exec()
    .then(function(accRecs) {
        //main content
        var tableBody = [
            ['日期','類別','金額','對口帳戶','期別','操作員'] //header
        ];

        accRecs.forEach(function(accRec) {
            var dateStr = moment(accRec.date).format('YYYY/MM/DD');
            var rowOfData = [ 
                dateStr, 
                opTypeMap[accRec.opType], 
                numberWithCommas(accRec.amount), 
                accRec.ioAccount? accRec.ioAccount : '', 
                accRec.period? accRec.period.name : '', 
                accRec.operator? accRec.operator.name : ''
            ];
            //console.log(rowOfData);
            tableBody.push(rowOfData);
        });

        tableBody.forEach(function(textArray) {
            //make 金額 align right
            textArray[2] = {
                text: textArray[2],
                alignment: 'right'
            }
        });

        var tableContent = {
            // headers are automatically repeated if the table spans over multiple pages
            // you can declare how many rows should be treated as headers
            headerRows: 1,
            widths: [ 70, 60, 90, '*', 70, 60],
            body: tableBody? tableBody : [['']]
        };

        var doc = {
            // a string or { width: number, height: number }
            pageSize: 'A4',

            // by default we use portrait, you can change it to landscape if you wish
            pageOrientation: 'portrait',
            
            // [left, top, right, bottom] or [horizontal, vertical] or just a number for equal margins
            pageMargins: [ 40, 40, 40, 40 ],
            
            defaultStyle: {
                font: 'msjh'
            },
            content: [
                { text: locationName, fontSize: 18, alignment: 'center' },
                { text: sheetName , fontSize: 14, alignment: 'center' },
                metaInfo,
                {
                    //layout: 'lightHorizontalLines', // optional
                    table: tableContent,
                    margin: [ 0, 5]
                },
            ],

            footer: footerFunc
        };

        return doc;

    });

}