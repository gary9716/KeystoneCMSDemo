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

exports.updateComment = (req, res) => {
	var form = req.body;
	customerSurveyList.model
		.findById(form._id)
		.exec()
		.then(function(customer) {
			if (customer) {
				if(customer.state !== 'filed') {
					customer.comment = form.comment;
					return customer.save();
				}
				else {
					return Promise.reject('此件已進入' + labelMap[customer.state] + '狀態');
				}
			}
			else {
				return Promise.reject('新建客戶無法進行此動作');
			}
		})
		.then((savCustomer) => {
			return res.json({
				success: true,
				result: savCustomer
			});
		})
		.catch((err) => {
			return res.ktSendRes(400, err);
		});

};

exports.upsert = (req, res) => {
	var form = req.body;
	var andCondition = [];
	var id = undefined;
	var age = 0;

	if(form.hasOwnProperty("_id")) {
		id = form._id;
	}

	if(form.hasOwnProperty("age")) {
		age = parseInt(form.age);
		if(isNaN(age)) {
			return res.ktSendRes(400, "年齡不是數字");
		}
		form.age = age;
	}

	try {
		form.formDate = new Date(form.formDate);
	}
	catch(e) {
		return res.ktSendRes(400, "表單日期出現問題");
	}

	if(!form.hasOwnProperty("customerName")) {
		return res.ktSendRes(400, "顧客名為空");
	}
	
	if(!form.hasOwnProperty("interviewer")) {
		return res.ktSendRes(400, "訪查員為空");
	}

	var data = {
		formDate: form.formDate? form.formDate:Date.now(),
		name: form.customerName,
		job: form.job? form.job:undefined,
		bank: form.bank? form.bank:undefined,
		age: form.age? form.age:undefined,
		sex: form.sex? form.sex:undefined,
		finance: form.finance? form.finance:undefined,
		interviewer: form.interviewer,
		isCustomer: form.isCustomer? form.isCustomer:undefined,
		lineGroup: form.lineGroup? form.lineGroup:undefined,
		customerType: form.customerType? form.customerType:undefined,
		teleNum1: form.tele1? form.tele1:undefined,
		teleNum2: form.tele2? form.tele2:undefined,
		city: form.city? form.city:undefined,
		dist: form.dist? form.dist:undefined,
		village: form.village? form.village:undefined,
		addrRest: form.addrRest? form.addrRest:undefined,
		addr: form.addr? form.addr:undefined,
		need: form.need? form.need:undefined,
		comment: form.comment? form.comment:undefined,
		rating: form.rating? form.rating:undefined
	};
	
	var getQuery = function() {
		let q = id? (customerSurveyList.model.findById(id).exec()):(Promise.resolve());
		return q.then(function(customer) {
				if(customer) {
					if(customer.state === 'editting') {
						_.assign(customer, data);
						return customer.save();
					}
					else if(customer.state === 'reviewing') {
						customer.comment = form.comment? form.comment:"";
						return customer.save();
					}
					else {
						return Promise.reject('此件已進入' + labelMap[customer.state] + '狀態');
					}
				}
				else {
					var newCustomer = new customerSurveyList.model(data);
					return newCustomer.save();
				}
			});
	}

	getQuery()
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
	var andCondition = [];

	if(form.hasOwnProperty("_id")) {
		andCondition.push({ '_id': form._id });
	}

	if(form.hasOwnProperty("customerName")) {
		andCondition.push({ 'name': form.customerName });
	}

	if(form.hasOwnProperty("tele1")) {
		form.tele1 = middleware.getPureNumStr(form.tele1);
		andCondition.push({ 'teleNum1': form.tele1 });
	}

	if(form.hasOwnProperty("tele2")) {
		form.tele2 = middleware.getPureNumStr(form.tele2);
		andCondition.push({ 'teleNum2': form.tele2 });
	}

	if(form.hasOwnProperty("interviewer")) {
		andCondition.push({ 'interviewer': form.interviewer });
	}

	if(form.hasOwnProperty("state")) {
		andCondition.push({ 'state': form.state });
	}

	let q = customerSurveyList.model.find({ 
		$and: andCondition
	});

	if(form.hasOwnProperty("populateFields")) {
		q = q.populate(form.populateFields);
	}

	q.lean()
	.exec()
	.then((customers) => {
		if(customers && customers.length > 0) {
			res.json({
				success: true,
				result: customers.length === 1? customers[0]: customers
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

	if(!form.hasOwnProperty("state")) {
		res.ktSendRes(400, 'no state');
		return;
	}

	customerSurveyList.model
	.findById(form._id)
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

exports.delete = (req, res) => {
	var form = req.body;
	customerSurveyList.model
	.findByIdAndRemove(form._id)
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
				success: false
			});
		}
	})
	.catch(function(err) {
		return res.ktSendRes(400, err);
	});
};

//
exports.search = (req, res) => {
	var form = req.body;

	if(!_.isEmpty(form)) { //filter with state
		let filter = [];
		if(form.hasOwnProperty("state")) 
			filter.push( {
				state : form.state 
			});
		if(form.hasOwnProperty("startDate") || form.hasOwnProperty("endDate")) {
			let formDateFilter = {};
			formDateFilter.formDate = {};
			if(form.hasOwnProperty("startDate")) formDateFilter.formDate.$gte = new Date(form.startDate);
			if(form.hasOwnProperty("endDate")) {
				let endDate = new Date(form.endDate);
				endDate.setTime(endDate.getTime() + 24 * 3600 * 1000);
				formDateFilter.formDate.$lt = endDate;
			}
			filter.push(formDateFilter);
		}
		
		if(form.hasOwnProperty("startAge") || form.hasOwnProperty("endAge")) {
			let ageFilter = {};
			ageFilter.age = {};
			if(form.hasOwnProperty("startAge")) ageFilter.age.$gte = parseInt(form.startAge);
			if(form.hasOwnProperty("endAge")) ageFilter.age.$lte = parseInt(form.endAge);
			filter.push(ageFilter);
		}
		
		if(form.hasOwnProperty("sex")) {
			filter.push({
				sex: form.sex
			});
		}

		if(form.hasOwnProperty("rating")) {
			filter.push({
				rating: form.rating
			});
		}

		if(form.hasOwnProperty("lineGroup")) 
			filter.push({
				lineGroup: form.lineGroup
			});

		if(form.hasOwnProperty("customerType")) 
			filter.push({
				customerType: form.customerType
			});
		
		if(form.hasOwnProperty("isCustomer")) {
			filter.push({
				isCustomer: form.isCustomer
			});
		}
		
		if(form.hasOwnProperty("interviewer")) {
			filter.push({
				interviewer: form.interviewer
			});
		}

		if(form.hasOwnProperty("customerName")) {
			filter.push({
				name: form.customerName
			});
		}

		customerSurveyList.model
		.find({
			$and: filter
		})
		.populate('city dist village')
		.lean()
		.exec()
		.then((customers) => {
			if(customers && customers.length > 0) {
				res.json({
					success: true,
					result: customers
				});
			}
			else {
				res.json({
					success: false
				});
			}
		});

		return;
	}
	else {
		//no filter
		customerSurveyList.model
		.find()
		.populate('city dist village')
		.lean()
		.exec()
		.then((customers) => {
			if(customers && customers.length > 0) {
				res.json({
					success: true,
					result: customers
				});
			}
			else {
				res.json({
					success: false
				});
			}
		});

		return;
	}
};
