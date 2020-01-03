var middleware = require('../middleware');
var Constants = require(__base + 'Constants');
var keystone = require('keystone');
var _ = require('lodash');
var labelMap = {
	editting: '編修',
	reviewing: '審核',
	filed: '歸檔'
};
var customerSurveyList = keystone.list(Constants.CustomerSurveyListName);

exports.upsert = (req, res) => {
	var form = req.body;
	var orCondition = [];

	if(form.hasOwnProperty("_id")) {
		orCondition.push({ "_id": form._id });
	}

	if(form.hasOwnProperty("customerName")) {
		orCondition.push({ 'name': form.customerName });
	}

	if(form.hasOwnProperty("tele1")) {
		form.tele1 = middleware.getPureNumStr(form.tele1);
		orCondition.push({ 'teleNum1': form.tele1 });
	}

	if(form.hasOwnProperty("tele2")) {
		form.tele2 = middleware.getPureNumStr(form.tele2);
		orCondition.push({ 'teleNum2': form.tele2 });
	}

	let age = parseInt(form.age);
	if(isNaN(age)) {
		return res.ktSendRes(400, "年齡不是數字");
	}
	form.age = age;

	try {
		form.formDate = new Date(form.formDate);
	}
	catch(e) {
		return res.ktSendRes(400, "表單日期出現問題");
	}

	var data = {
		formDate: form.formDate? form.formDate:Date.now(),
		
		name: form.customerName? form.customerName:"",
		job: form.job? form.job:"",
		bank: form.bank? form.bank:"",
		age: form.age? form.age:0,
		sex: form.sex? form.sex:"",
		finance: form.finance? form.finance:"",
		isCustomer: form.isCustomer? form.isCustomer:"",
		lineGroup: form.lineGroup? form.lineGroup:"",
		customerType: form.customerType? form.customerType:"",
		teleNum1: form.tele1? form.tele1:"",
		teleNum2: form.tele2? form.tele2:"",
		city: form.city? form.city:"",
		dist: form.dist? form.dist:"",
		village: form.village? form.village:"",
		addrRest: form.addrRest? form.addrRest:"",
		addr: form.addr? form.addr:"",
		need: form.need? form.need:"",
		comment: form.comment? form.comment:""
	};

	var getUpdateQuery = function() {
		return customerSurveyList.model
		  .findOne({ $or: orCondition })
		  .exec()
		  .then(function(customer) {
			if(customer) {
			  if(customer.state === 'editting') {
				  _.assign(customer, data);
				  return customer.save();
			  }
			  else {
				  return Promise.reject('此件已進入' + labelMap[customer.state] + '狀態');
			  }
			}
			else {
			  console.log(data);
			  var newCustomer = new customerSurveyList.model(data);
			  return newCustomer.save();
			}
		  });
	  }

	  getUpdateQuery()
	  .then((savCustomer) => {
		return res.json({
			success: true,
			result: savCustomer
		});
	  })
	  .catch(function(err) {
		return res.ktSendRes(400, err);
	  });

};

exports.sync = (req, res) => {
	var form = req.body;
	var orCondition = [];

	if(form.hasOwnProperty("customerName")) {
		orCondition.push({ 'name': form.customerName });
	}

	if(form.hasOwnProperty("tele1")) {
		form.tele1 = middleware.getPureNumStr(form.tele1);
		orCondition.push({ 'teleNum1': form.tele1 });
	}

	if(form.hasOwnProperty("tele2")) {
		form.tele2 = middleware.getPureNumStr(form.tele2);
		orCondition.push({ 'teleNum2': form.tele2 });
	}

	customerSurveyList.model
	.findOne({ 
		$or: orCondition
	})
	.lean()
	.exec()
	.then((customer) => {
		if(customer) {
			res.json({
				success: true,
				result: customer
			});
		}
		else {
			res.json({
				success:false
			});
		}
	})
	.catch(function(err) {
		return res.ktSendRes(400, err);
	});

};

exports.changeState = (req, res) => {
	var form = req.body;
	var orCondition = [];

	if(!form.hasOwnProperty("state")) {
		res.ktSendRes(400, 'no state');
		return;
	}

	if(form.hasOwnProperty("_id")) {
		orCondition.push({ "_id": form._id });
	}

	if(form.hasOwnProperty("customerName")) {
		orCondition.push({ 'name': form.customerName });
	}

	if(form.hasOwnProperty("tele1")) {
		form.tele1 = middleware.getPureNumStr(form.tele1);
		orCondition.push({ 'teleNum1': form.tele1 });
	}

	if(form.hasOwnProperty("tele2")) {
		form.tele2 = middleware.getPureNumStr(form.tele2);
		orCondition.push({ 'teleNum2': form.tele2 });
	}

	customerSurveyList.model
	.findOne({ 
		$or: orCondition
	})
	.exec()
	.then((customer) => {
		customer.state = form.state;
		customer.save();
	})
	.then((savCustomer) => {
		res.json({
			success: true,
			result: savCustomer
		});
	})
	.catch(function(err) {
		return res.ktSendRes(400, err);
	});
};

//
exports.search = (req, res) => {
	var form = req.body;
};
