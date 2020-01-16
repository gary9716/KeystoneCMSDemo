
var Constants = require(__base + 'Constants');
var keystone = require('keystone');
var moment = require('moment');
var _ = require('lodash');
var customerSurveyList = keystone.list(Constants.CustomerSurveyListName);

module.exports = (req, res) => {
	
	let stateLabelMap = {
		editting: '編修',
		reviewing: '審核',
		filed: '歸檔'
	};

	let sexLabelMap = {
		male: '男性',
		female: '女性'
	};

	let customerTypeMap = {
		'0': '非本會客戶',
		'1': '資金往來戶',
		'2': '農保戶',
		'3': '農業資材運用戶',
		'4': '家用雜貨使用戶'
	};

	let lineGroupStatesMap = {
		'1': '已加入',
		'2': '已邀請',
		'3': '未邀請'
	};

	let ratingList = {
		'0': '很好',
		'1': '好',
		'2': '普通',
		'3': '差',
		'4': '很差'
	};
	
	var form = req.body;
	var filename = '';
	var timeInfo = {
		text: '印表日期:' + moment().rocFormat(),
		alignment: 'right'
    };

	var offset = 0;

    var divisionInfo = {
		table: {
			widths: ['*', '*', '*', '*'],
			heights: ['auto', 70],
			body: [
				['經辦', '主任', '秘書', '總幹事'],
				['', '', '', '']
			]
		}
	};
	
    var footerFunc = function(page, pages) {
        return [
            divisionInfo,
			/*
			{
                alignment: 'center',
                text: { text: '第' + page + '頁' },
			}
			*/
        ];

    };

	return customerSurveyList.model
		.findById(form._id)
		.lean()
		.exec()
		.then((customer) => {
			if(customer) {
				let customerName = customer.name;
				filename = customerName + "的訪問表.pdf";
				res.locals.filename = filename;

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
						{ text: '大甲農會客戶訪問表', fontSize: 18, alignment: 'center' },
						timeInfo,
						{
							margin: [0, 5, 0, -1],
							table: {
								widths: [60, 145, 60, '*', 60, '*'], //width can be [number, *, auto]
								body: [
									['姓名', customer.name, '性別', sexLabelMap[customer.sex], '年齡', customer.age],
									['住址', customer.addr, '經濟狀況', customer.finance, '電話', customer.teleNum1],
									['職業', customer.job, '往來銀行', customer.bank, '傳真', customer.teleNum2],
									['本會客戶', customer.isCustomer? "是":"否", '往來狀況', customerTypeMap[customer.customerType], 'Line群組', lineGroupStatesMap[customer.lineGroup]]
								] 
							}
						},
						{
							margin: [0, 0, 0, -1],
							table: {
								widths: [60, '*'],
								body: [
									['客戶需求', customer.need]
								]
							}
						},
						{
							margin: [0, 0, 0, -1],
							table: {
								widths: [60, 145, 60, '*'],
								body: [
									['訪查員', customer.interviewer, '對本會滿意度', ratingList[customer.rating]]
								]
							}
						},
						{
							margin: [0, 0, 0, 5],
							table: 
							{
								widths: [60, '*'],
								heights: [200],
								body: [
									['會相關部門', customer.comment]
								]
							}
						},
						divisionInfo
					]
				};
			
				return doc;

			}
			else {
				return Promise.reject('沒找到對應的客戶資訊');
			}
		})
		.catch((err) => {
			return res.ktSendRes(400, err);
		});


};
