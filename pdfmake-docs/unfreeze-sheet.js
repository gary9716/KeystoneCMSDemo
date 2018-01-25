module.exports = function(req, res) {
  var moment = require('moment');

  var data = res.locals;
  res.locals.filename = 'unfreeze-sheet_' + req.body.accountID + '.pdf';

  return {
    info: {
      title: '解凍單',
      author: 'kt chou',
    },

    defaultStyle: {
      font: 'msjh'
    },

    content: [
      'First paragraph',
      'Another paragraph, this time a little bit longer to make sure, this line will be divided into at least two lines',
      '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n',
      'Another Page',
      '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n',
      'Another Page'
    ],

    
  };

};