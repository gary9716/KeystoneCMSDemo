var middleware = require('../middleware');
var Constants = require(__base + 'Constants');
var keystone = require('keystone');
var moment = require('moment');
var _ = require('lodash');
var labelMap = {
	editting: '編修',
	reviewing: '審核',
	filed: '歸檔'
};
var customerSurveyList = keystone.list(Constants.CustomerSurveyListName);
var formDataList = keystone.list(Constants.FormDataListName);

exports.updateComment = (req, res) => {
	var form = req.body;
	customerSurveyList.model
		.findById(form._id)
		.exec()
		.then(function(customer) {
			if (customer) {
				if(customer.state !== 'filed') {
					customer.comment = form.comment;
					customer.comment2 = form.comment2;
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
		interviewer: form.interviewer,

		job: form.job? form.job:undefined,
		bank: form.bank? form.bank:undefined,
		age: form.age? form.age:undefined,
		sex: form.sex? form.sex:undefined,
		finance: form.finance? form.finance:undefined,
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
		comment2: form.comment2? form.comment2:undefined,
		rating: form.rating? form.rating:undefined,

		interviewDate: form.interviewDate? form.interviewDate:undefined,
		lastInterviewDate: form.lastInterviewDate? form.lastInterviewDate:undefined,
		companyWin: form.companyWin? form.companyWin:undefined,
		contactNum: form.contactNum? form.contactNum:undefined,
		
		//sale form fields
		recommendedProduct: form.recommendedProduct? form.recommendedProduct:undefined,
		alreadySale: form.alreadySale? form.alreadySale:undefined,
		thisTimeSale: form.thisTimeSale? form.thisTimeSale:undefined,
		exeProgressOthers: form.exeProgressOthers? form.exeProgressOthers:undefined,

		receptionistRating: form.receptionistRating? form.receptionistRating:undefined,
		onTimeRating: form.onTimeRating? form.onTimeRating:undefined,
		qualityRating: form.qualityRating? form.qualityRating:undefined,
		stackRating: form.stackRating? form.stackRating:undefined,
		goodsReturnRating: form.goodsReturnRating? form.goodsReturnRating:undefined,
		deliveryRating: form.deliveryRating? form.deliveryRating:undefined,
		agentRating: form.agentRating? form.agentRating:undefined,
		billProcessRating: form.billProcessRating? form.billProcessRating:undefined,
		customerComment: form.customerComment? form.customerComment:undefined,

		exeProgress: form.exeProgress? form.exeProgress:undefined,
		customerRank: form.customerRank? form.customerRank:undefined,
		formType: form.formType? form.formType:undefined,
		interviewType: form.interviewType? form.interviewType:undefined
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
						customer.comment2 = form.comment2? form.comment2:"";
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

	let padZero = (num, size) => {
		var s = num + "";
		while (s.length < size) s = "0" + s;
		return s;
	};

	var genFormID = (curCustomer) => {
		let curMoment = moment();
		if(curCustomer.formID) {
			console.log('form id existed');
			return Promise.resolve(curCustomer);
		}
		else if (curCustomer.formType) {
			return formDataList.model.findOne({ formType: curCustomer.formType }).exec()
			.then((fd) => {
				if (fd) {
					let lastDateMoment = new moment(fd.lastDate);
					if ((curMoment.year() - lastDateMoment.year()) !== 0 || (curMoment.month() - lastDateMoment.month()) !== 0)
						fd.numForms = 1;
					else
						fd.numForms++;
					fd.lastDate = curMoment.toDate();
					return fd.save();
				}
				else {
					
					//create new formType
					let newFD = new formDataList.model({
						formType: curCustomer.formType,
						numForms: 1,
						lastDate: curMoment.toDate()
					});
					return newFD.save();
				}
			})
			.then((fd) => {
				let formID = fd.formType + curMoment.rocYear() + curMoment.format('MM') + padZero(fd.numForms, 4);
				console.log(formID);
				curCustomer.formID = formID;
				return curCustomer.save();
			});
		}
		else {
			return Promise.reject("no formType");
		}
	};

	getQuery()
	.then(genFormID)
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

exports.simpleSync = (req, res) => {
	var form = {
		_id: req.body._id
	};
	
	let q = customerSurveyList.model.find(form);
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

		if(form.hasOwnProperty("interviewType")) {
			filter.push({
				interviewType: form.interviewType
			});
		}

		if(form.hasOwnProperty("formType")) {
			filter.push({
				formType: form.formType
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
