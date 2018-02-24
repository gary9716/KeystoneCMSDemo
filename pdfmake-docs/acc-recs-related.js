var moment = require('moment');
var keystone = require('keystone');

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
    if(form.tag === 'all') {
        sheetName = '白米存摺交易匯總表';
    }
    else {
        sheetName = '白米存摺年度結清總表';
    }
    
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

    var timeInfo = {
        columns: [
            {
                text: intervalInfo,
                width: '50%'
            },
            {
                text: '印表日期:' + moment().rocFormat(),
                width: '50%',
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
        return [
            divisionInfo,
            {
                alignment: 'center',
                text: { text: '第' + page + '頁' },
            }
        ];

    };
    //-----------


    //main content
    var accRecsAgg = form.accRecsAgg;
    var accAgg = form.accAgg;

    var balanceSum = accAgg.balanceSum? accAgg.balanceSum : 0;

    var tableBody;
    if(accRecsAgg) {
        if(form.tag === 'all') {
            tableBody = [
                ['開戶次數', accRecsAgg.create? accRecsAgg.create.count:0, '結清次數', accRecsAgg.close? accRecsAgg.close.count:0],
                ['凍結次數', accRecsAgg.freeze? accRecsAgg.freeze.count:0, '解凍次數', accRecsAgg.unfreeze? accRecsAgg.unfreeze.count:0],
                ['入款次數', accRecsAgg.deposit? accRecsAgg.deposit.count:0, '入款總金額', accRecsAgg.deposit? numberWithCommas(accRecsAgg.deposit.amount):0],
                ['提款次數', accRecsAgg.withdraw? accRecsAgg.withdraw.count:0, '提款總金額', accRecsAgg.withdraw? numberWithCommas(accRecsAgg.withdraw.amount):0],
                ['兌領次數', accRecsAgg.transact? accRecsAgg.transact.count:0, '兌領總金額', accRecsAgg.transact? numberWithCommas(accRecsAgg.transact.amount):0],
                ['年度結清戶數', accRecsAgg.annuallyWithdraw? accRecsAgg.annuallyWithdraw.count:0,'年度結清總金額', accRecsAgg.annuallyWithdraw? numberWithCommas(accRecsAgg.annuallyWithdraw.amount):0],
                ['凍結中戶數', accAgg.freeze? accAgg.freeze.count:0,'凍結戶總金額', accAgg.freeze? numberWithCommas(accAgg.freeze.balance):0],
                ['有效戶數', accAgg.unfreeze? accAgg.unfreeze.count:0,'有效戶總金額', accAgg.unfreeze? numberWithCommas(accAgg.unfreeze.balance):0],
                ['全部戶數', accAgg.all? accAgg.all.count:0,'全部未領總金額', accAgg.all? numberWithCommas(accAgg.all.balance):0],  
            ]  
        }
        else {
            tableBody = [
                ['凍結中戶數', accAgg.freeze? accAgg.freeze.count:0,'凍結戶總金額', accAgg.freeze? numberWithCommas(accAgg.freeze.balance):0],
                ['有效戶數', accAgg.unfreeze? accAgg.unfreeze.count:0,'有效戶總金額', accAgg.unfreeze? numberWithCommas(accAgg.unfreeze.balance):0],
                ['全部戶數', accAgg.all? accAgg.all.count:0,'全部未領總金額', accAgg.all? numberWithCommas(accAgg.all.balance):0],  
            ]
        }
        

        tableBody.forEach(function(textArray) {
            textArray[1] = {
                text: textArray[1],
                alignment: 'right'
            }
            textArray[3] = {
                text: textArray[3],
                alignment: 'right'
            }
        });
    }
    
    var tableContent = {
        widths: [120, '*', 120,'*'], //width can be [number, *, auto]
        body: tableBody? tableBody:[]
    };

    var doc = {
        // a string or { width: number, height: number }
        pageSize: 'A4',

        // by default we use portrait, you can change it to landscape if you wish
        pageOrientation: 'portrait',
        
        // [left, top, right, bottom] or [horizontal, vertical] or just a number for equal margins
        pageMargins: [ 40, 40, 40, 250 + offset*2 ],
        
        defaultStyle: {
            font: 'msjh'
        },
        content: [
            { text: locationName, fontSize: 18, alignment: 'center' },
            { text: sheetName , fontSize: 14, alignment: 'center' },
            timeInfo,
            {
                margin: [0, 5, 0, 5],
                table: tableContent
            },
        ],

        footer: footerFunc
    };

    return doc;

}