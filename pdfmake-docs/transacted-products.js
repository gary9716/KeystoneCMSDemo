module.exports = function(req, res) {
    var moment = require('moment');

    var form = req.body;
    var filename = '';

    if(form.shop) {
        filename += (form.shop + "_");
    }

    if(form.startDate) {
        filename += ('from_' + moment(form.startDate).format('YYYY-MM-DD_'));
    }
    
    if(form.endDate) {
        filename += ('to_' + moment(form.endDate).format('YYYY-MM-DD_'));
    }

    filename += 'products-statistics.pdf';
    console.log(filename);
    res.locals.filename = filename;

    var products = form.products;
    var transCount = form.transCount? form.transCount : 0;

    var tableBody = [
        ['品號', '品名', '包數', '總重', '單價', '總金額', '兌領處'],
    ];

    if(products) {
        var wholeQty = 0;
        var wholeMoney = 0;
        var wholeWeight = 0;
        var wholePrice = 0;
        products.forEach(function(product) {
            wholeQty += product.qty;
            wholeMoney += product.totalMoney;
            wholeWeight += product.totalWeight;
            wholePrice += product._id.price;
            var shopName = (product._id.shop && product._id.shop.name)? product._id.shop.name: '';
            tableBody.push([product._id.pid, product._id.name, product.qty, product.totalWeight, product._id.price, product.totalMoney, shopName]);
        });
        tableBody.push(['合計','',wholeQty, wholeWeight, wholePrice, wholeMoney,'']);
    }

    var doc = {
        // a string or { width: number, height: number }
        pageSize: 'A4',

        // by default we use portrait, you can change it to landscape if you wish
        pageOrientation: 'portrait',

        defaultStyle: {
            font: 'msjh'
        },

        content: [
            { text: '商品兌領統計報表' , fontSize: 18, alignment: 'center' },
            {
                margin: [0, 5, 0, 15],
                table: {
                    widths: [80, 100, 40, 60, '*', 80, '*'], //width can be [number, *, auto]
                    body: tableBody
                }
            },
            { text: ('兌領次數:' + transCount), fontSize: 14, alignment: 'right' }
        ]
    };

    return doc;

}