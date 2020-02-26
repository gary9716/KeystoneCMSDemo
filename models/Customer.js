var keystone = require('keystone');
var Types = keystone.Field.Types;
var Constants = require(__base + 'Constants');

var mongoose = keystone.get('mongoose');
//var Schema = mongoose.Schema;

var CustomerSurvey = new keystone.List(Constants.CustomerSurveyListName, {
	label: '客戶訪談',
	nocreate: true
});

CustomerSurvey.add({
	formType: { type: Types.Select, label: '表單類型', options: [
		{ value: 'A', label: '信用' },
		{ value: 'B', label: '供銷' },
		{ value: 'C', label: '其他' }
	], initial: true, default: 'A' },
	formID: { type:String, label: '流水號', index: true, initial: true, trim: true },
	formDate: { type: Types.Datetime, format: 'YYYY-MM-DD', label: '表單日期', default: Date.now, initial: true, noedit: true },

	interviewDate: { type: Types.Datetime, format: 'YYYY-MM-DD', label: '拜訪日期', initial: true, noedit: true },
	lastInterviewDate: { type: Types.Datetime, format: 'YYYY-MM-DD', label: '上次拜訪日期', initial: true, noedit: true },
	
	interviewType: { type: Types.Select, label: '拜訪類別', options: [ 
		{ value: 'init', label: '初訪' },
		{ value: 're', label: '回訪' }
	], trim: true, initial: true },

	name: { type:String, label: '客戶/商號名稱', index: true, required: true, initial: true, trim: true },
	interviewer: { type:String, label: '訪查員', initial: true, trim: true },

	job: { type:String, label: '職業', initial: true, trim: true },
	bank: { type:String, label: '往來銀行', initial: true, trim: true },
	age : { type: Number, label: '年齡', initial: true },
	sex : { type: Types.Select, label: '性別', options: [ 
		{ value: 'male', label: '男性' },
		{ value: 'female', label: '女性' },
		{ value: 'none', label: '無' }
	], trim: true, initial: true },
	finance: { type:String, label:'經濟狀況', initial: true, trim: true },
	isCustomer: { type: Boolean, label: '是否為本會客戶', initial: true, index: true},
	
	rating: { type: Types.Select, label: '對本會滿意度', options: [
		{ value: '0', label: '很好' },
		{ value: '1', label: '好' },
		{ value: '2', label: '普通' },
		{ value: '3', label: '差' },
		{ value: '4', label: '很差' },
	], initial: true },
	lineGroup: { type: Types.Select, label: '是否已加入本會Line@生活圈', options: [ 
		{ value: '1', label: '已加入' },
		{ value: '2', label: '已邀請' },
		{ value: '3', label: '未邀請' },
	], initial: true },
	customerType: { type: Types.Select, label: '往來狀況', options: [
		{ value: '0', label: '非本會客戶' },
		{ value: '1', label: '資金往來戶' },
		{ value: '2', label: '農保戶' },
		{ value: '3', label: '農業資材運用戶' },
		{ value: '4', label: '家用雜貨使用戶' },
	], initial: true },
	
	teleNum1: { type:String, label:'電話號碼', index: true, initial: true, trim: true },
	teleNum2: { type:String, label:'傳真號碼', index: true, initial: true, trim: true },
	contactNum: { type:String, label:'聯絡電話', initial: true, trim: true },
	companyWin: {  type:String, label:'商號窗口', initial: true, trim: true },

	city : { type:Types.Relationship, label:'直轄縣市', ref:Constants.CityListName, index: true, initial: true },
	dist : { type:Types.Relationship, label:'縣市鄉鎮', ref:Constants.AddrPrefixListName, index: true, initial: true },
	village: { type:Types.Relationship, label:'里別', ref:Constants.VillageListName, index: true, initial: true },

	addrRest: { type:String, label:'路名細節', initial: true, trim: true },
	addr : { type:String, initial: true, trim: true, label:'住址' },

	need : { type: Types.Textarea, label: '客戶需求', trim: true, initial: true },
	comment: { type: Types.Textarea, label: '會相關部門', trim: true, initial: true },

	state : { type: Types.Select, label: '表格狀態', options: [ 
		{ value: 'editting', label: '編修' },
		{ value: 'reviewing', label: '審核' },
		{ value: 'filed', label: '歸檔' }
	], trim: true, initial: true, default: 'editting' },

	customerRank: { type: Types.Select, label: '客戶評等', options: [ 
		{ value: '0', label: 'VIP' },
		{ value: '1', label: '潛力' },
		{ value: '2', label: '持平' },
		{ value: '3', label: '危機' },
		{ value: '4', label: '憂鬱' }
	], trim: true, initial: true },
	
	recommendedProduct: { type:String, label: '推薦產品', initial: true, trim: true },
	alreadySale: { type:String, label: '已導入銷售', initial: true, trim: true },
	thisTimeSale: { type:String, label: '本次新增品項', initial: true, trim: true },
	exeProgress: { type: Types.Select, label: '執行進度', options: [ 
		{ value: '0', label: '報價' },
		{ value: '1', label: '簽約' },
		{ value: '2', label: '其他' }
	], trim: true, initial: true },
	exeProgressOthers: { type:String, label: '執行進度(其他)', initial: true, trim: true },
	
	receptionistRating: { type: Number, label: '電話接待人員評分', initial: true },
	onTimeRating: { type: Number, label: '產品準時到貨評分', initial: true  },
	qualityRating: { type: Number, label: '產品品質評分', initial: true  },
	stackRating: { type: Number, label: '堆疊翻新整齊度', initial: true  },
	goodsReturnRating: { type: Number, label: '瑕疵退貨處理評分', initial: true },
	deliveryRating: { type: Number, label: '運輸人員態度評分', initial: true },
	agentRating: { type: Number, label: '業代服務評分', initial: true },
	billProcessRating: { type: Number, label: '帳務處理評分', initial: true },
	
	customerComment: { type: String, label: '其他客訴或回饋', initial: true }
});
CustomerSurvey.defaultColumns = 'formDate, name, age, sex';
CustomerSurvey.register();

var FormData = new keystone.List(Constants.FormDataListName, {
	label: '表單資料',
	nocreate: true
});

FormData.add({
	formType: { type: Types.Select, label: '表單類型', options: [
		{ value: 'A', label: '信用' },
		{ value: 'B', label: '供銷' },
		{ value: 'C', label: '其他' }
	], initial: true },
	numForms: { type: Number, label: '表單數', initial: true, default:0 },
	lastDate: { type: Types.Datetime, format: 'YYYY-MM-DD', label: '最後一筆日期', default: Date.now, initial: true, noedit: true },
});

FormData.defaultColumns = 'formType, numForms, lastDate';
FormData.register();
