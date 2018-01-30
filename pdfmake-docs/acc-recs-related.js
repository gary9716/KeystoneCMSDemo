var moment = require('moment');
var keystone = require('keystone');

module.exports = function(req, res) {
    
    var form = req.body;
    var filename = '';

    var startMoment, endMoment, intervalInfo = [];
    var sysInfo = keystone.get('sysParams');
    var locationName = sysInfo.farmName;
    
    var sheetName = '存摺紀錄統計表';
    
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
    var totalActiveBalance = form.totalActiveBalance? form.totalActiveBalance : 0;

    var tableBody;
    if(accRecsAgg) {
        tableBody = [
            ['開戶次數', accRecsAgg.create.count, '結清次數', accRecsAgg.close.count],
            ['凍結次數', accRecsAgg.freeze.count, '解凍次數', accRecsAgg.unfreeze.count],
            ['入款次數', accRecsAgg.deposit.count, '入款總金額', accRecsAgg.deposit.amount],
            ['提款次數', accRecsAgg.withdraw.count, '提款總金額', accRecsAgg.withdraw.amount],
            ['兌領次數', accRecsAgg.transact.count, '兌領總金額', accRecsAgg.transact.amount],
            ['當前未結清存摺總餘額', totalActiveBalance, '', '']
        ]
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