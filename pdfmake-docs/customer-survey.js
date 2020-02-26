
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
		'2': '已邀請'
	};

	let ratingList = {
		'0': '很好',
		'1': '好',
		'2': '普通',
		'3': '差',
		'4': '很差'
	};

	let customerRankMap = {
		'0': 'VIP',
		'1': '潛力',
		'2': '持平',
		'3': '危機',
		'4': '憂鬱',
	};
	
	let formTypeMap = {
		'A': '信用',
		'B': '供銷',
		'C': '其他'
	};

	let interviewTypeMap = {
		'init': '初訪',
		're': '回訪'
	};

	let exeProgressMap = {
		'0': '報價',
		'1': '簽約',
		'2': '其他'
	};

	var form = req.body;
	var checkboxSize = 14;

	var getCheckBox = (checked, size) => {
		return {
			image: checked? 'checkedBox':'uncheckedBox',
			width: size? size: checkboxSize,
			height: size? size: checkboxSize
		};
	};

	var filename = '';
	var offset = 0;

    var divisionInfo = {
		widths: ['*', '*', '*', '*', '*'],
		heights: ['auto', 50],
		margin: [0, 5, 0, 0],
		columns: ['經辦', '廠長', '主任', '秘書', '總幹事']
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

				let getFormID = () => {
					return customer.formID?customer.formID:"";
				};
				
				let daysBetweenInterview = "0";
				try {
					if(customer.lastInterviewDate && customer.interviewDate) {
						let d1 = new Date(customer.interviewDate);
						let d2 = new Date(customer.lastInterviewDate);
						let val = (d1.getTime() - d2.getTime())/(1000*60*60*24);
						daysBetweenInterview = isNaN(val)? "":(Math.floor(val) + "");
					}
					else {
						daysBetweenInterview = "";
					}
					
				}
				catch (e) {
				}
				let interviewDateStr = customer.interviewDate? moment(customer.interviewDate).rocFormat():"";
				let lastInterviewDateStr = customer.lastInterviewDate? moment(customer.lastInterviewDate).rocFormat():"";
				let sex = customer.sex?sexLabelMap[customer.sex]:"";
				let age = customer.age?customer.age:"";
				let finance = customer.finance?customer.finance:"";
				let job = customer.job?customer.job:"";
				let isCustomer = customer.isCustomer;
				let rating = customer.rating?ratingList[customer.rating]:"";
				let comment = customer.comment?customer.comment:"";
				let contactNum = customer.contactNum?customer.contactNum:"";
				let companyWin = customer.companyWin?customer.companyWin:"";
				
				let interviewType = customer.interviewType?customer.interviewType:"";
				let customerRank = customer.customerRank?customer.customerRank:"";
				let formType = customer.formType?customer.formType:"";
				
				let recommendedProduct = customer.recommendedProduct?customer.recommendedProduct:"";
				let alreadySale = customer.alreadySale?customer.alreadySale:"";
				let thisTimeSale = customer.thisTimeSale?customer.thisTimeSale:"";
				let exeProgress = customer.exeProgress?customer.exeProgress:"";
				let exeProgressOthers = customer.exeProgressOthers?customer.exeProgressOthers:"";
				let receptionistRating = customer.receptionistRating?customer.receptionistRating:"";
				let onTimeRating = customer.onTimeRating?customer.onTimeRating:"";
				let qualityRating = customer.qualityRating?customer.qualityRating:"";
				let stackRating = customer.stackRating?customer.stackRating:"";
				let goodsReturnRating = customer.goodsReturnRating?customer.goodsReturnRating:"";
				let deliveryRating = customer.deliveryRating?customer.deliveryRating:"";
				let agentRating = customer.agentRating?customer.agentRating:"";
				let billProcessRating = customer.billProcessRating?customer.billProcessRating:"";
				let customerComment = customer.customerComment?customer.customerComment:"";
				
				let timeInfo = {
					columns: [
						{
							text: '填單流水號: ' + getFormID(), //add form id
							width: '30%',
							alignment: 'left'
						},
						getCheckBox(interviewType === 'init'),
						{
							text: '初訪',
							width: '7%'
						},
						getCheckBox(interviewType === 're'),
						{
							text: '回訪',
							width: '7%'
						},
						{
							text: '印表日期:' + moment().rocFormat(),
							alignment: 'right'
						}
					],
					margin: [0, 5, 0, 0]
				};

				let leftMarginShift = (pos) => {
					return (-5 + (pos - 1) * 42); 
				};

				let putCircleAt = (pos) => {
					return { image: 'circle', width: 36, height: 20, margin: [ leftMarginShift(pos), -18, 0, 0 ] };
				};

				let formTypePosMap = {
					'A': 1,
					'B': 2,
					'C': 3
				};

				let exeProgressMap = {
					'0': 1,
					'1': 2,
					'2': 3
				};

				let getCirclePosForFormType = () => {
					return formTypePosMap[formType];
				};

				let getCirclePosForExeProgress = () => {
					return exeProgressMap[exeProgress];
				};

				let getFormTypeStack = () => {
					let content = [ { text: '信用 / 供銷 / 其他 ____' } ];
					if(formType !== "")
						content.push(putCircleAt(getCirclePosForFormType()));
					return content;
				};

				let getExeProgressStack = () => {
					let content = [ { text: '報價 / 簽約 / 其他 ' + (exeProgressOthers === "" ? "____" : exeProgressOthers) } ];
					if(exeProgress !== "")
						content.push(putCircleAt(getCirclePosForExeProgress()));
					return content;
				};
				var firstCol = 60;
				var largeHeight = 80;
				var doc = {
					// a string or { width: number, height: number }
					pageSize: 'A4',
			
					// by default we use portrait, you can change it to landscape if you wish
					pageOrientation: 'portrait',
					
					// [left, top, right, bottom] or [horizontal, vertical] or just a number for equal margins
					pageMargins: [ 40, 40, 40, 30 ],
					images: {
						uncheckedBox: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAJtJREFUaIHt2DsOgzAQRdGXiH0xOwtLG3aWhiIFYJuPn4LukVxhpLngyhIA4IRX4XksyymXtWoovBySPtfNclhuPXh3HOIWpT/wa9bOl7hYSBprNrYEpKSpfZZDJlUG/P0RIsCNADcC3AhwI8CNADcC3AhwI8CNADcC3Ahwa7mZC/W7mYvajS0Boyqv+3p6/BHKHkMUpHsAAHiwL/oCCsw/nWW1AAAAAElFTkSuQmCC',
						checkedBox: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAWhJREFUaIHtmHFOgzAUh781nsOrjHvMbWq8hxxE3bwJXmzzD2h4UaTQvrZxeV9ClpTSfT9a2gIYhmEYCWwC55vhqEk3HJPcBS5ugFc9l2i6v064ghJZCPWA5IuZO6FMA2yXVFwToAPa9S5RtCwM8O+HkAWojQVIJLSQBqkZwAHvJM5sa6ZRTRzwBjyJsja2odL4Oy/l74kcTqV7wAEfwFGUnYAX4BrbYCnm5C8pjaaypOsdvayqvG84hZZ+PM+144AzcBBlKvKQ9gy0jO8KDnieEPLye1GmJu//IIYN/czhOdKLyfYc8ElGeYjvgesgAuN0eKAP9jj8noEHcY26PKQNoQu/Q+wZe2En6maRh/R1YCrE7kedbPKgM436EKeJc1nlQW8hmwqRXR50txJyOEEBedDfC8kQ2eUhz2auiLin9htZMhagNmuegYZyX+aapRXXBNiy8HNfSW5+CHUlJAJ0tQUMwzBumG9510GEK8GE/wAAAABJRU5ErkJggg==',
						circle: "data:image/png;base64,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"
					},
					defaultStyle: {
						font: 'kai'
					},
					content: [
						{ text: '大甲區農會客戶訪問表', fontSize: 18, alignment: 'center' },
						timeInfo,
						{
							margin: [0, 5, 0, -1],
							table: {
								widths: [firstCol, 85, 80, 85, 80, '*'],
								body: [
									['拜訪日期', interviewDateStr, '前次拜訪日期', lastInterviewDateStr, '距離前次天數', { text: isNaN(daysBetweenInterview)? "":daysBetweenInterview } ]
								]
							}
						},
						{
							margin: [0 ,0 ,0 ,-1],
							table: {
								widths: [firstCol, 140, 60, 50, '*'],
								body: [
									[{ text: '客戶姓名\n/商號', rowSpan: 2 }, { text: customer.name?customer.name:"", rowSpan: 2 }, { text: '性別: ' + sex }, '電話', { text: customer.teleNum1?customer.teleNum1:"" } ], 
									['', '', { text: '年齡: ' + age }, '傳真', { text: customer.teleNum2? customer.teleNum2:"" }]
								]
							}
						},
						{
							margin: [0 ,0 ,0 ,-1],
							table: {
								heights: ['auto','auto','auto','auto', largeHeight],
								widths: [firstCol, 85, 80, 60, 85, 30, '*'],
								body:[
									//each row should contains 7 elements
									['商號窗口', companyWin, '連絡電話', { text: contactNum, colSpan: 4 }, '', '', '' ],
									[{ text: '地址'}, { text: customer.addr?customer.addr:"", colSpan: 6 }, '', '', '', '', '' ],
									[{ text: '本會信用\n客戶' }, { stack: [ 
																	{ columns: [getCheckBox(isCustomer), { text: '是', width: 15 }] }, 
																	{ columns: [ getCheckBox(!isCustomer), { text: '否', width: 15 }, { text: '', width: 5 }, { text: '往來銀行: ', width: 60 }, { text: customer.bank?customer.bank:"", width: '*' }] } ], 
																	colSpan: 2 }, 
																	'', 
																	{ text: '往來狀況' },
																	{ text: customer.customerType?customerTypeMap[customer.customerType]:"" },
																	{ text: 'LINE\n群組' }, 
																	{ text: customer.lineGroup?lineGroupStatesMap[customer.lineGroup]:"" }],
									[{ text: '訪查員'}, { text: (customer.interviewer?customer.interviewer:""), colSpan: 2 }, '', { text: '拜訪項目' }, { stack: getFormTypeStack(), colSpan: 3 }, '', '' ],
									[{ text: '訪問情形', border: [true, false, true, false] }, { text: customer.need?customer.need:"", colSpan: 6, border: [true, false, true, false] }, '', '', '', '', '' ],
									[{ text: '', border: [true, false, true, true] }, { columns: [ { text: '', width: '40%' }, { text: ('對本會滿意度: ' + rating), alignment: 'left', width: '60%' } ] , border: [true, false, true, true] , colSpan:6 }, '', '', '', '', '']
									
								]
							}
						},
						{
							margin: [0 ,0 ,0 ,-1],
							table: {
								widths: [85, 60, 80, 75, 98, '*'],
								heights: [ 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', largeHeight],
								body:[
									[{ text: '※供銷客戶續填', colSpan: 6 }, '', '', '', '', ''],
									[{ text: '推薦產品'}, { text: recommendedProduct, colSpan: 2 }, '', { text: '已導入的銷售'}, { text: alreadySale, colSpan: 2 }, ''],
									//[{ text: '本次新增品項'}, { columns: [ { text: '', width: '40%' },{ text: '報價/簽約/其他 ____', width: '60%' } ], colSpan: 6 }, '', '', '', '', ''],
									[{ text: '本次新增品項'}, { text: thisTimeSale, colSpan: 2 }, '', { text: '執行進度' }, { stack: getExeProgressStack(), colSpan: 2 }, ''],
									[{ text: '客戶滿意度:1 ~ 5分(滿分為5分)', colSpan: 6 }, '', '', '', '', ''],
									[{ text: '電話接待人員'}, receptionistRating, { text: '產品到貨準時'}, onTimeRating, { text: '產品品質'}, { text: qualityRating }],
									[{ text: '堆疊翻新整齊度'}, stackRating, { text: '瑕疵退貨處理'}, goodsReturnRating, { text: '運輸人員服務態度'}, { text: deliveryRating } ],
									[{ text: '業代服務態度'}, agentRating, { text: '帳務處理'}, { text: billProcessRating, colSpan: 3 }, '', ''],
									[{ text: ('其他客訴或回饋:\n' + customerComment) ,colSpan: 6 }, '', '', '', '', ''],
										
								],
								
							},
							border: [true, true, true, true],
							//fillColor: '#eeffee',
							layout: {
								hLineWidth: function (i, node) {
									return (i === 0 || i === node.table.body.length) ? 2 : 1;
								},
								vLineWidth: function (i, node) {
									return (i === 0 || i === node.table.widths.length) ? 2 : 1;
								},
							}
						},
						{
							margin: [0, 0, 0, -1],
							table: {
								widths: [85, 60, 80, 75, 98, '*'],
								heights: ['auto', largeHeight, largeHeight],
								body:[
									[{ columns: [ { text: '客戶評級:', width: 60 }, 
										{ text: '', width: 10 }, getCheckBox(customerRank === '0'), { text: 'VIP', width: 30 },
										{ text: '', width: 20 }, getCheckBox(customerRank === '1'), { text: '潛力', width: 30 },
										{ text: '', width: 20 }, getCheckBox(customerRank === '2'), { text: '持平', width: 30 },
										{ text: '', width: 20 }, getCheckBox(customerRank === '3'), { text: '危機', width: 30 },
										{ text: '', width: 20 }, getCheckBox(customerRank === '4'), { text: '憂鬱', width: 30 }  ], colSpan: 6 }, '', '', '', '', '' ],
									[{ text: '會:', colSpan: 6 }, '', '', '', '', '' ],
									[{ text: '備註: ' + comment, colSpan: 6 }, '', '', '', '', '' ]
								]
							}
						},
						{
							stack: [
								'1.訪客頻率，每週拜訪「初訪」、「回訪」各一次以上(經收期除外)，本表每週提出呈核。(供銷)',
								'2.業專「回訪」隨同當日運輸車輛執行為原則。(供銷)',
								'3.本表年度裝訂成冊，由企稽/供銷主任保管，列入移交。',
								'4.表單共用分別(同仁/企稽、業專/供銷)呈核統整。'
							],
							margin: [0 ,5 ,0 , 0],
							fontSize: 10
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
