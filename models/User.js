var keystone = require('keystone');
var Types = keystone.Field.Types;

// Create a list of regions / territories
var Territory = new keystone.List('Territory'); //分部
Territory.add({
  name: {type: Types.Text, label: "分部名"}
}).register();

/**
 * User Model
 * ==========
 */
var User = new keystone.List('User', {
  track: true //track when and who the data was created, updated
});

User.add(
  {
  	userID: { type: String, label: '使用者ID', initial: true, unique: true, index: true, required: true, noedit:true},
    name: { type: Types.Name, label: '姓名' , initial: true},
  	email: { type: Types.Email, label: '信箱', initial: true, index: true },
  	password: { type: Types.Password, label: '密碼', initial: true, required: true },
    territory: {type: Types.Relationship, label: '分部', initial: true, ref: 'Territory'}
  }, 
  'Permissions', 
  {
	  isAdmin: { type: Boolean, label: '管理者', initial: true, index: true, default: false }, //最高權限者（第一層級）
    roles: { type: Types.Relationship, label: '角色', ref: 'Role', initial: true, many: true, dependsOn : {isAdmin: false} }
    
  }
);

// Provide access to Keystone
User.schema.virtual('canAccessKeystone').get(function () {
	return this.isAdmin;
});


/**
 * Relationships
 */
User.relationship({ ref: 'Post', path: 'posts', refPath: 'author' });


/**
 * Registration
 */
User.defaultColumns = 'userID, name, email, isAdmin';
User.register();
