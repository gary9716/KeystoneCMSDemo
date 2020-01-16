
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

	var customerList = form.customerList;
	
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

	var customerListContent = {
		widths: ['*', '*', '*', '*', '*', '*', '*', '*', '*', '*'], //width can be [number, *, auto]
		body: [
			['姓名', '性別', '年齡', '直轄縣市', '鄉鎮市區', '村里', 'Line群組', '客戶類型', '滿意度', '狀態']
		]
	};

	
	var filter = form.filter;
	var filterInfo = "";
	if(filter.hasOwnProperty("state")) 
		filterInfo += ("狀態:" + stateLabelMap[filter.state] + "\n");
	let getDateStr = (d) => {
		return d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate();
	}
	if(filter.hasOwnProperty("customerName")) {
		filterInfo += ("客戶名稱:" + filter.customerName + "\n");
	}
	if(filter.hasOwnProperty("interviewer")) {
		filterInfo += ("訪查員:" + filter.interviewer + "\n");
	}
	if(filter.hasOwnProperty("startDate")) 
		filterInfo += ("日期起點:" + getDateStr(new Date(filter["startDate"])) + "\n");
	if(filter.hasOwnProperty("endDate")) 
		filterInfo += ("日期終點:" + getDateStr(new Date(filter["endDate"])) + "\n");
	if(filter.hasOwnProperty("startAge"))
		filterInfo += ("年齡起點:" + filter["startAge"] + "\n");
	if(filter.hasOwnProperty("endAge"))
		filterInfo += ("年齡終點:" + filter["endAge"] + "\n");
	
	if(filter.hasOwnProperty("sex"))
		filterInfo += ("性別:" + sexLabelMap[filter["sex"]] + "\n");

	if(filter.hasOwnProperty("rating")) {
		filterInfo += ("滿意度:" + ratingList[filter["rating"]] + "\n");
	}

	if(filter.hasOwnProperty("lineGroup")) 
		filterInfo += ("line群組:" + lineGroupStatesMap[filter["lineGroup"]] + "\n");

	if(filter.hasOwnProperty("customerType"))
		filterInfo += ("客戶類型:" + customerTypeMap[filter.customerType] + "\n");
	
	if(filter.hasOwnProperty("isCustomer")) {
		filterInfo += ("是否為本會客戶:" + (filter.isCustomer? "是":"否") + "\n");
	}

	for(let customer of customerList) {
		let rowData = [];
		rowData.push(customer.name);
		rowData.push(sexLabelMap[customer.sex]);
		rowData.push(customer.age);
		rowData.push(customer.city.name);
		rowData.push(customer.dist.dist);
		rowData.push(customer.village.name);
		rowData.push(lineGroupStatesMap[customer.lineGroup]);
		rowData.push(customerTypeMap[customer.customerType]);
		rowData.push(ratingList[customer.rating]);
		rowData.push(stateLabelMap[customer.state]);
		customerListContent.body.push(rowData);
	}

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
			{ text: '大甲農會客戶訪查清單', fontSize: 18, alignment: 'center' },
			timeInfo,
			{ text: '過濾條件:', style: 'Bold', alignment: 'left' },
			{ text: filterInfo, alignment: 'left' },
			{ text: '統計筆數:' + customerList.length + "筆", alignment: 'left' },
			{
				margin: [0, 5, 0, 0],
				table: customerListContent
			}
		],
	};

	filename = "大甲農會客戶訪查清單.pdf";
	res.locals.filename = filename;

	return doc;


};
