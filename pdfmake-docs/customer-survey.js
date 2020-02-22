
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
		table: {
			widths: ['*', '*', '*', '*', '*'],
			heights: ['auto', 50],
			body: [
				['經辦', '廠長', '主任', '秘書', '總幹事'],
				['', '', '', '', '']
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

				let getFormID = () => {
					return customer.formID?customer.formID:"";
				};
				
				let daysBetweenInterview = "0";
				try {
					let d1 = new Date(customer.interviewDate);
					let d2 = new Date(customer.lastInterviewDate);
					daysBetweenInterview = (d1.getTime() - d2.getTime())/(1000*60*60*24) + "";
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
					return (-8 + (pos - 1) * 37); 
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
						circle: 'data:image/png;base64,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'
					},
					defaultStyle: {
						font: 'msjh'
					},
					content: [
						{ text: '大甲區農會客戶訪問表', fontSize: 18, alignment: 'center' },
						timeInfo,
						{
							margin: [0 ,5 ,0 ,-1],
							table: {
								widths: [65, 75, 80, 70, 80, 30, '*'],
								body:[
									//each row should contains 6 elements
									['拜訪日期', interviewDateStr, '前次拜訪日期', lastInterviewDateStr, '距離前次天數', { text: daysBetweenInterview, colSpan: 2 }, ''],
									[{ text: '客戶姓名\n/商號', rowSpan: 2 }, { text: customer.name?customer.name:"", rowSpan: 2, colSpan: 2 }, '', '電話', { text: customer.teleNum1?customer.teleNum1:"", colSpan: 3 }, '', ''], 
									['', '', '', '傳真', { text: customer.teleNum2?customer.teleNum2:"", colSpan: 3 }, '', ''],
									['商號窗口', companyWin, '連絡電話', { text: contactNum, colSpan: 4 }, '', '', '' ],
									[{ text: '地址'}, { text: customer.addr?customer.addr:"", colSpan: 6 }, '', '', '', '', '' ],
									[{ text: '本會信用\n客戶' }, { stack: [ { columns: [getCheckBox(isCustomer), { text: '是', width: 15 }] }, { columns: [ getCheckBox(!isCustomer), { text: '否', width: 15 }, { text: '', width: 5 }, { text: '往來銀行: ', width: 60 }, { text: customer.bank?customer.bank:"", width: '*' }] } ], colSpan: 2 }, '', { text: '往來狀況' },{ text: customer.customerType?customerTypeMap[customer.customerType]:"" },{ text: 'LINE\n群組' },{ text: customer.lineGroup?lineGroupStatesMap[customer.lineGroup]:"" }],
									[{ text: '訪查員'}, { text: (customer.interviewer?customer.interviewer:""), colSpan: 2 }, '', { text: '拜訪項目' }, { stack: getFormTypeStack(), colSpan: 3 }, '', '' ],
									[{ text: '訪問情形'}, { stack: [ { text: customer.need?customer.need:"" }, { columns: [ { text: '', width: '40%' }, { text: ('對本會滿意度: ' + rating), alignment: 'left', width: '60%' } ] } ], colSpan: 6 }, '', '', '', '', '' ],
									
									[{ text: '※供銷客戶續填', colSpan: 7 }, '', '', '', '', '', ''],
									[{ text: '推薦產品'}, { text: recommendedProduct, colSpan: 2 }, '', { text: '已導入的銷售'}, { text: alreadySale, colSpan: 3 }, '', ''],
									//[{ text: '本次新增品項'}, { columns: [ { text: '', width: '40%' },{ text: '報價/簽約/其他 ____', width: '60%' } ], colSpan: 6 }, '', '', '', '', ''],
									[{ text: '本次新增品項'}, { text: thisTimeSale, colSpan: 2 }, '', { text: '執行進度' }, { stack: getExeProgressStack(), colSpan: 3 }, '', ''],
									[{ text: '客戶滿意度:1 ~ 5分(滿分為5分)', colSpan: 7 }, '', '', '', '', '', ''],
									[{ text: '電話接待人員'}, receptionistRating, { text: '產品到貨準時'}, onTimeRating, { text: '產品品質'}, { text: qualityRating, colSpan: 2 }, '' ],
									[{ text: '堆疊翻新整齊度'}, stackRating, { text: '瑕疵退貨處理'}, goodsReturnRating, { text: '運輸人員服務態度'}, { text: deliveryRating, colSpan: 2 }, '' ],
									[{ text: '業代服務態度'}, agentRating, { text: '帳務處理'}, { text: billProcessRating, colSpan: 4 }, '', '', ''],
									[{ text: ('其他客訴或回饋:\n' + comment) ,colSpan: 7 }, '', '', '', '', '', ''],
									//['', '', '', '', '', '', ''],
									[{ columns: [ { text: '客戶評級:', width: 60 }, 
										{ text: '', width: 10 }, getCheckBox(customerRank === '0'), { text: 'VIP', width: 30 },
										{ text: '', width: 20 }, getCheckBox(customerRank === '1'), { text: '潛力', width: 30 },
										{ text: '', width: 20 }, getCheckBox(customerRank === '2'), { text: '持平', width: 30 },
										{ text: '', width: 20 }, getCheckBox(customerRank === '3'), { text: '危機', width: 30 },
										{ text: '', width: 20 }, getCheckBox(customerRank === '4'), { text: '憂鬱', width: 30 }  ], colSpan: 7 }, '', '', '', '', '', ''],
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
