var moment = require('moment');
var keystone = require('keystone');
var Constants = require(__base + 'Constants');
var accountList = keystone.list(Constants.AccountListName);
var accountRecList = keystone.list(Constants.AccountRecordListName);

module.exports = function(req, res) {
  
  var form = req.body;
  var account;
  return accountList.model.findOne({ _id: form._id })
          .populate('farmer')
          .lean()
          .then(function(_account) {
            if(!_account) 
              return Promise.reject('該存摺不存在');
            account = _account;

            res.locals.filename =  account.accountID + '的掛失止付書.pdf';

            return accountRecList.model
              .find({ account: account._id, opType: { $in: ['deposit','withdraw'] } })
              .lean().sort('-date').limit(1).exec();
          })
          .then(function(accRecs) {  
            var accRec;
            if(accRecs && accRecs.length > 0) {
              accRec = accRecs[0];
            }

            var content = [];
            var factor = 1;

            //console.log(account.farmer);

            content.push({
              text: account.accountID,
              absolutePosition: {
                x: 61  * factor,
                y: 159 * factor
              },
              fontSize: 12
            });
            
            if(account.farmer.addr)
              content.push({
                text: account.farmer.addr,
                absolutePosition: {
                  x: 199 * factor,
                  y: 372 * factor
                },
                fontSize: 12
              });

            if(account.farmer.name)
              content.push({
                  text: account.farmer.name,
                  absolutePosition: {
                    x: 199 * factor,
                    y: 326 * factor
                  },
                  fontSize: 12
              });

            if(account.farmer.pid)
              content.push({
                  text: account.farmer.pid,
                  absolutePosition: {
                    x: 199 * factor,
                    y: 351 * factor
                  },
                  fontSize: 12
              });

            if(account.farmer.teleNum1)
              content.push({
                text: account.farmer.teleNum1,
                absolutePosition: {
                  x: 440  * factor,
                  y: 373  * factor
                },
                fontSize: 12
              });
            else if(account.farmer.teleNum2)
              content.push({
                text: account.farmer.teleNum2,
                absolutePosition: {
                  x: 440  * factor,
                  y: 373  * factor
                },
                fontSize: 12
              });

            var balanceTxt = {
              text: (account.balance + ' 元'),
              absolutePosition: {
                  x: 243 * factor,
                  y: 186  * factor
              },
              fontSize: 12
            }

            content.push(balanceTxt);

            if(accRec) {
                var date = new Date(accRec.date);
                var lastDepositWithdrawDateTxt = {
                    year:{
                        text: (date.getFullYear() - 1911).toString(),
                        absolutePosition: {
                            x: 372 * factor,
                            y: 158 * factor
                        },
                        fontSize: 12
                    },
                    month: {
                        text: (date.getMonth() + 1).toString(),
                        absolutePosition: {
                            x: 419 * factor,
                            y: 158 * factor
                        },
                        fontSize: 12
                    },
                    date: {
                        text: date.getDate().toString(),
                        absolutePosition: {
                            x: 460 * factor,
                            y: 158 * factor
                        },
                        fontSize: 12
                    },
                };

                content.push(lastDepositWithdrawDateTxt.year,
                  lastDepositWithdrawDateTxt.month,
                  lastDepositWithdrawDateTxt.date);
            }
            
            var doc = {
              // a string or { width: number, height: number }
              pageSize: 'A4',

              // by default we use portrait, you can change it to landscape if you wish
              pageOrientation: 'portrait',

              defaultStyle: {
                  font: 'kai'
              },

              images: {
                'bgImg': __base + 'public/images/unfreeze-freeze_v3.jpg'
              },

              background: {
                  image: 'bgImg',
                  width: '595' //A4 width in pixels with 72DPI
              },
              content: content
            };

            return doc;
          });


};

/*
  var doc = {
    
    styles: {
      header: {
        fontSize: 20,
        alignment: 'center',
        margin: [0,10,0,20]
      },
    },

    // a string or { width: number, height: number }
    pageSize: 'A4',

    // by default we use portrait, you can change it to landscape if you wish
    pageOrientation: 'portrait',

    defaultStyle: {
        font: 'kai'
    },

    // [left, top, right, bottom] or [horizontal, vertical] or just a number for equal margins
    pageMargins: [ 46, 41, 46, 57 ],


    content: [
        { text: [
        '臺中市大甲區農會',
        { text: '白米存摺', decoration: 'underline'},
        '掛失止付申請書'
        ], style: 'header' },
        { text: '(登記掛失止付號碼字第 號)', fontSize: '14' }
    ],

    background: {
      canvas: [{
          type: 'rect',
          x: 46, y: 42, w: 503, h: 461,
          lineWidth: 1,
          lineColor: '#000000',
          color: '#ffffff',
          fillOpacity: 0
      }]
    }

    
  };
  */