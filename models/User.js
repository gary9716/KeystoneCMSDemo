var keystone = require('keystone');
var Types = keystone.Field.Types;
var Constants = require(__base + 'Constants');

//console.log(Constants.ShopListName);
var Shop = new keystone.List(Constants.ShopListName, {
  label: '兌領處'
});
Shop.add({
  name: {type: Types.Text, label: '名稱'}
});
Shop.defaultColumns = 'name';
Shop.register();

//console.log(Constants.UserListName);
/**
 * User Model
 * ==========
 */
var User = new keystone.List(Constants.UserListName, {
  label: '系統使用者',
  nodelete: true,
});

User.add(
  '基本資料',
  {
  	userID: { type: String, label: '使用者ID', initial: true, unique: true, index: true, required: true, noedit:true, trim: true },
    name: { type: String, label: '姓名' , initial: true, trim: true },
  	email: { type: Types.Email, label: '信箱', initial: true, index: true, trim: true },
  	password: { type: Types.Password, label: '密碼', initial: true, required: true, trim: true },
    shop: {type: Types.Relationship, label: '兌領處', ref: Constants.ShopListName, index: true, initial: true }
  }, 
  '權限設定', 
  {
	  isAdmin: { type: Boolean, label: '是否為管理者', initial: true, index: true, default: false }, //是否最高權限者（第一層級）
    roles: { type: Types.Relationship, label: '非管理者角色', ref: Constants.RoleListName, index: true, initial: true, many: true, dependsOn : {isAdmin: false} }
  }
);

// Provide access to Keystone
User.schema.virtual('canAccessKeystone').get(function () {
	return this.isAdmin;
});

/**
 * Registration
 */
User.defaultColumns = 'userID, name, email, shop, isAdmin';
User.register();
