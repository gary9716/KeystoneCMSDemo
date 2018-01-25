
var keystone = require('keystone');
var Constants = require(__base + 'Constants');
module.exports = function(req, res) {
    
    var form = req.body;
    var accountRecList = keystone.list(Constants.AccountRecordListName);
    var gAccRec;
    

    function getNumDigits(number) {
        return number.toString().length;
    }
    
    //TODO: generate pdf based on withdraw/deposit record
    return accountRecList.model.findOne({ _id : form._id })
        .populate('account account.farmer')
        .lean()
        .exec()
        .then(function(accRec) {
            if(!accRec)
                return Promise.reject('存摺紀錄不存在');

            if(accRec.opType !== 'withdraw' && accRec.opType !== 'deposit')
                return Promise.reject('錯誤存摺紀錄類型');

            gAccRec = accRec;

            return keystone.list(Constants.FarmerListName).model.findOne({
                _id: accRec.account.farmer
            }).exec();

        })
        .then(function(farmer){
            var accRec = gAccRec;

            res.locals.filename = accRec.account.accountID + '_' + accRec.opType + '.pdf';
            
            var factor,ioAccount,money,itemComment,entireComment,dateTxt;
            var date = new Date(accRec.date);

            if(accRec.opType === 'deposit') {
                factor = 595/ 2293;

                dateTxt = {
                    year:{
                        text: (date.getFullYear() - 1911).toString(),
                        x: 1100 * factor,
                        y: 165  * factor
                    },
                    month: {
                        text: (date.getMonth() + 1).toString(),
                        x: 1310 * factor,
                        y: 165  * factor
                    },
                    date: {
                        text: date.getDate().toString(),
                        x: 1464 * factor,
                        y: 165  * factor
                    },
                    fontSize: 12
                };

                ioAccount = {
                    text: accRec.ioAccount,
                    x: 217 * factor,
                    y: 297 * factor
                };
                
                money = {
                    text: ('$' + accRec.amount),
                    x: (1272 + (11 - getNumDigits(accRec.amount)) * 48) * factor,
                    y: 297 * factor,
                    characterSpacing: 6
                };

                itemComment = {
                    text: accRec.comment? accRec.comment : (farmer.name + ' 白米存摺轉入'),
                    x: 590 * factor,
                    y: 297 * factor
                };

                entireComment = {
                    text: '入款用',
                    fontSize: 20,
                    x: 344 * factor,
                    y: 778 * factor
                };
                
            }
            else { //withdraw
                factor = 595/ 2296;

                dateTxt = {
                    year:{
                        text: (date.getFullYear() - 1911).toString(),
                        x: 1100 * factor,
                        y: 156  * factor
                    },
                    month: {
                        text: (date.getMonth() + 1).toString(),
                        x: 1310 * factor,
                        y: 156  * factor
                    },
                    date: {
                        text: date.getDate().toString(),
                        x: 1464 * factor,
                        y: 156  * factor
                    },
                    fontSize: 12
                };

                ioAccount = {
                    text: accRec.ioAccount,
                    x: 217 * factor,
                    y: 288 * factor
                };
                
                money = {
                    text: ('$' + accRec.amount),
                    x: (1272 + (11 - getNumDigits(accRec.amount)) * 48) * factor,
                    y: 288 * factor,
                    characterSpacing: 6
                };

                itemComment = {
                    text: accRec.comment? accRec.comment : (farmer.name + ' 白米存摺轉出'),
                    x: 590 * factor,
                    y: 288 * factor
                };

                entireComment = {
                    text: '提款用',
                    fontSize: 20,
                    x: 344 * factor,
                    y: 778 * factor
                };
                
            }
            

            var doc = {
                // a string or { width: number, height: number }
                pageSize: 'A4',

                // by default we use portrait, you can change it to landscape if you wish
                pageOrientation: 'portrait',

                defaultStyle: {
                    font: 'msjh'
                },     
                images: {
                    'bgImg': __base + 'public/images/' + accRec.opType + '.jpg'
                },

                background: {
                    image: 'bgImg',
                    width: '595' //A4 width in pixels with 72DPI
                },
                content: [
                    { 
                        text: ioAccount.text, 
                        fontSize: 11,
                        absolutePosition: { x: ioAccount.x, y: ioAccount.y } 
                    },
                    { 
                        text: money.text,
                        characterSpacing: money.characterSpacing,
                        absolutePosition: { x: money.x, y: money.y },
                    },
                    {
                        text: itemComment.text,
                        absolutePosition: {x : itemComment.x, y: itemComment.y},
                    },
                    {
                        text: entireComment.text,
                        absolutePosition: {x : entireComment.x, y: entireComment.y},
                        fontSize: entireComment.fontSize
                    },
                    
                    {
                        text: dateTxt.year.text,
                        absolutePosition: dateTxt.year,
                        fontSize: dateTxt.fontSize
                    },
                    {
                        text: dateTxt.month.text,
                        absolutePosition: dateTxt.month,
                        fontSize: dateTxt.fontSize
                    },
                    {
                        text: dateTxt.date.text,
                        absolutePosition: dateTxt.date,
                        fontSize: dateTxt.fontSize
                    }

                ],

            };

            return doc;
        
        });


}