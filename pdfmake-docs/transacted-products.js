var moment = require('moment');
var keystone = require('keystone');

module.exports = function(req, res) {
    
    var form = req.body;
    var filename = '';

    var startMoment, endMoment, intervalInfo = [];
    var sysInfo = keystone.get('sysParams');
    var locationName = sysInfo.farmName;
    
    var sheetName = '商品兌領統計報表';
    

    if(form.shop) {
        locationName += ('-' + form.shop);
        filename += (form.shop);
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
                text: '印表日期:' + moment().rocFormat(true),
                width: '50%',
                alignment: 'right'
            }
        ]
    };

    filename += '的兌領統計表.pdf';
    res.locals.filename = filename;

    var footerFunc = function(page, pages) {
        return [
            divisionInfo,
            {
                alignment: 'center',
                text: { text: '第' + page + '頁' },
            }
        ];

    };

    var products = form.products;
    var transCount = form.transCount? form.transCount : 0;

    var tableBody = [
        ['品號', '品名', '包數', '總重(kg)', '單價', '總金額', '辦事處'],
    ];

    var offset = 0;

    var divisionInfo = {
        columns: [
            '記帳', '出納', '供銷部主任', '會計主任', '秘書', '總幹事'
        ],
        margin: [10, 100 + offset]
    };

    if(products) {
        var wholeQty = 0;
        var wholeMoney = 0;
        var wholeWeight = 0;
        products.forEach(function(product) {
            wholeQty += product.qty;
            wholeMoney += product.totalMoney;
            wholeWeight += product.totalWeight;
            var shopName = (product._id.shop && product._id.shop.name)? product._id.shop.name: '';
            tableBody.push([product._id.pid, product._id.name, product.qty, product.totalWeight, product._id.price, product.totalMoney, shopName]);
        });
        tableBody.push(['合計','',wholeQty, wholeWeight, '', wholeMoney,'']);
    }
    
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
                table: {
                    widths: [80, 100, 40, 60, '*', 80, '*'], //width can be [number, *, auto]
                    body: tableBody
                }
            },
            { text: ('兌領次數:' + transCount), fontSize: 14, alignment: 'right' },
            
        ],

        footer: footerFunc
    };

    return doc;

}