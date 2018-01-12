module.exports = function() {

  console.log('start db update');

  var keystone = require('keystone');
  keystone.applyUpdates(function(err) {
    if(err) throw err;
    console.log('DB update complete');
  })

};