module.exports = function(req, res) {

    var form = req.body;
    var accountRecList = keystone.list(Constants.AccountRecordListName);

    //TODO: generate pdf based on withdraw/deposit record
    accountRecList.model.findOne({ _id : form._id })
        .select('account opType amount date')


}