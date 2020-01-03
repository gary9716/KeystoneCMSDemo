var keystone = require('keystone');
var Types = keystone.Field.Types;
var Constants = require(__base + 'Constants');

var mongoose = keystone.get('mongoose');
//var Schema = mongoose.Schema;

var CustomerSurvey = new keystone.List(Constants.CustomerSurveyListName, {
	label: '客戶訪談',
	noedit: true,
	//nodelete: true,
	nocreate: true,
});
  
CustomerSurvey.add({
	formDate: { type: Types.Datetime, format: 'YYYY-MM-DD', label: '表單時間', default: Date.now, initial: true, noedit: true },
	name: { type:String, label: '姓名', index: true, required: true, initial: true, trim: true },
	job: { type:String, label: '職業', initial: true, trim: true },
	bank: { type:String, label: '往來銀行', initial: true, trim: true },
	age : { type: Number, label: '年齡', default: 0, required: true, initial: true },
	sex : { type: Types.Select, label: '性別', options: [ 
		{ value: 'male', label: '男性' },
		{ value: 'female', label: '女性' }
	], required: true, trim: true, initial: true },
	finance: { type:String, label:'經濟狀況', initial: true, trim: true },
	isCustomer: { type: Boolean, label: '是否為本會客戶', initial: true, index: true, default: false },
	
	lineGroup: { type: Types.Select, label: '是否已加入本會Line@生活圈', options: [ 
		{ value: 1, label: '已加入' },
		{ value: 2, label: '已邀請' },
		{ value: 3, label: '未邀請' },
	], required: true, initial: true },
	customerType: { type: Types.Select, label: '往來狀況', options: [
		{ value: 1, label: '資金往來戶' },
		{ value: 2, label: '農保戶' },
		{ value: 3, label: '農業資材運用戶' },
		{ value: 4, label: '家用雜貨使用戶' },
	], required: true, initial: true },
	
	teleNum1: { type:String, label:'住家電話', index: true, initial: true, trim: true },
	teleNum2: { type:String, label:'行動電話', index: true, initial: true, trim: true },

	city : { type:Types.Relationship, label:'直轄縣市', ref:Constants.CityListName, required: true, index: true, initial: true },
	dist : { type:Types.Relationship, label:'縣市鄉鎮', ref:Constants.AddrPrefixListName, required: true, index: true, initial: true },
	village: { type:Types.Relationship, label:'里別', ref:Constants.VillageListName, required: true, index: true, initial: true },
	addrRest: { type:String, label:'路名細節', initial: true, trim: true },
	addr : { type:String, initial: true, trim: true, label:'住址' },

	need : { type: Types.Textarea, label: '客戶需求', trim: true, initial: true },
	comment: { type: Types.Textarea, label: '會相關部門', trim: true, initial: true },

	state : { type: Types.Select, label: '表格狀態', options: [ 
		{ value: 'editting', label: '編修' },
		{ value: 'reviewing', label: '審核' },
		{ value: 'filed', label: '歸檔' }
	], required: true, trim: true, initial: true, default: 'editting' }
});
CustomerSurvey.defaultColumns = 'formDate, name, age, sex';
CustomerSurvey.register();
  