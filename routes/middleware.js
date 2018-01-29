/**
 * This file contains the common middleware used by your routes.
 *
 * Extend or replace these functions as your application requires.
 *
 * This structure is not enforced, and just a starting point. If
 * you have more middleware you may want to group it as separate
 * modules in your project's /lib directory.
 */

var async = require('async');
var Constants = require(__base + 'Constants');
var _ = require('lodash');
var keystone = require('keystone');
var UrlPattern = require('url-pattern');
var htmlmin = require('htmlmin');
var keystonePathPrefix = '/'+ keystone.get('admin path');
var moment = require('moment');
var routesToBlock = [keystonePathPrefix + '/signin', keystonePathPrefix + '/api/session/signin'];

//var pdf = require('html-pdf');

var Pdfmake = require('pdfmake');

var fonts = {
  'ming' : {
    normal: __base + 'fonts/pming.ttf'
  },

  'msjh': {
    normal: __base + 'fonts/msjhl.ttf',
    bold: __base + 'fonts/msjhb.ttf',
  },

  'kai': {
    normal: __base + 'fonts/kaiu.ttf'
  },
};

var printer = new Pdfmake(fonts);
var fs = require('fs');


moment.prototype.rocYear = function() {
  return this.year() - 1911;
}

moment.prototype.rocFormat = function(includeTime) {
  var detailFormat = includeTime? '年MM月DD號HH點mm分ss秒':'年MM月DD號';
  return this.rocYear() + this.format(detailFormat);
}


exports.blockRoute = function (req, res, next) {
  var urlPattern = new UrlPattern(req.path);
	var testRoute = function(element) {
    var pattern = urlPattern.match(element);
    if(pattern)
      return true;
  };

	if(routesToBlock.some(testRoute)) {
    res.myErrInfo = 'forbidden routes';
		res.status(403).send('forbidden routes');
	}
	else
		next();
}

/**
	Initialises the standard view locals

	The included layout depends on the navLinks array to generate
	the navigation in the header, you may wish to change this array
	or replace it with your own templates / logic.
*/
exports.initLocals = function (req, res, next) {

  res.locals.navLinks = require(__base + 'NavLinkInfo');

  res.locals.env = keystone.get('env');

  res.locals.sys = keystone.get('sysParams');

	var from = req.query["from"];
  if(from) {
    res.locals.redirect = from;
  }

	if(req.user) {
		var user = req.user;
		res.locals.user = {
			isAdmin: user.isAdmin,
			userID: user.userID,
			name: user.name
		};
	}
	
	next();
};

/**
	Fetches and clears the flashMessages before a view is rendered
*/
exports.flashMessages = function (req, res, next) {
	var flashMessages = {
		info: req.flash('info'),
		success: req.flash('success'),
		warning: req.flash('warning'),
		error: req.flash('error'),
	};
	res.locals.messages = _.some(flashMessages, function (msgs) { return msgs.length; }) ? flashMessages : false;
	next();
};


/**
	Prevents people from accessing protected pages when they're not signed in
 */
exports.requireUser = function (req, res, next) {
	if (!req.user) {
		req.flash('error', 'Please sign in to access this page.');
		res.redirect(keystone.get('signin url'));
	} else {
		next();
	}
};

var htmlMinify = function (err, html) {
	//this would be bound in renderFunc
	if(err) {
    return this.ktSendRes(500, 'something blew up in htmlMinify');
	}
	this.send(
		htmlmin(html, {
        collapseWhitespace: true,
        removeComments: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        removeEmptyAttributes: true
  	})
  );

}

var renderFunc = function (err, req, res) {
	if(err) {
    return res.ktSendRes(500, 'something blew up in renderFunc' );
  }
	var cb = htmlMinify.bind(res); //apply minify middleware
	res.render(res.locals.viewPath,null,cb); //this would be bound in getRenderFunc
}

exports.doViewRender = function(req, res) {
	var view = new keystone.View(req, res);
	view.render(renderFunc);
}

exports.doPDFGenViaHTMLToPDF = function(req, res) {
  //since we don't need to trigger render hooks in keystone
  //(render hooks should be specified in index.js)
  //we can just do server side rendering through res.render
  
  //option format reference:(https://www.npmjs.com/package/html-pdf)
  var pdfOpts = {
      // Export options
      "directory": (__base + "tmp"),       // The directory the file gets written into if not using .toFile(filename, callback). default: '/tmp'

      // Papersize Options: http://phantomjs.org/api/webpage/property/paper-size.html
      "format": "A4",        // allowed units: A3, A4, A5, Legal, Letter, Tabloid
      "orientation": "portrait", // portrait or landscape
      "base": req.protocol + '://' + req.get('host') 
      // Page options
      /*
      "border": {
        "top": "2in",            // default is 0, units: mm, cm, in, px
        "right": "1in",
        "bottom": "2in",
        "left": "1.5in"
      },
      */

    };

  res.render(
    res.locals.viewPath,
    null, //locals, we have set it on res
    function(err, html) {
      if(err) {
        return res.ktSendRes(500, 'pdf產生失敗' );
      }
      pdf.create(html, pdfOpts).toBuffer(function(err, buffer) {
        res.set('Content-Type', 'application/pdf');
        res.send(buffer);
      });

    }
  );

}

function isPromise(obj) {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

exports.doPDFGenViaPDFMake = function(req, res) {

  //if we forget to add .js ,it would be treated as object and cannot be used
  //as function
  var docPath = __base + 'pdfmake-docs/' + this.doc + '.js';
  
  function restOfJob(docDefinition) {
    //filename should be customized for each req
    //(for example: use accountID as part of filename)
    if(!res.locals.filename) 
      res.locals.filename = 'temp.pdf';

    var pdfDoc = printer.createPdfKitDocument(docDefinition);

    var chunks = [];
    var result;
    pdfDoc.on('data', function (chunk) {
      chunks.push(chunk);
    });
    pdfDoc.on('end', function () {
      result = Buffer.concat(chunks);
      res.json({
        filename: res.locals.filename,
        content: result.toJSON()
      });
    });
    pdfDoc.end();

  }
  
  var obj = require(docPath)(req,res);
  if(isPromise(obj)) {
    obj
    .then(function(docDefinition){
      restOfJob(docDefinition);
    })
    .catch(function(err) {
      res.ktSendRes(400, err);
    }); 
  }
  else {
    restOfJob(obj);
  }

  

}

/* 依據內政部：
   1. 身分證編碼原則
   2. 外來人口統一證號編碼原則(居留證) https://www.immigration.gov.tw/ct_cert.asp?xItem=1106801&ctNode=32601&mp=1
   身分證及居留證通用
第一碼 縣市編碼原則：
  A=10 台北市    J=18 新竹縣    S=26 高雄縣 
  B=11 台中市    K=19 苗栗縣    T=27 屏東縣 
  C=12 基隆市    L=20 台中縣    U=28 花蓮縣 
  D=13 台南市    M=21 南投縣    V=29 台東縣 
  E=14 高雄市    N=22 彰化縣    W=32 金門縣 
  F=15 台北縣    O=35 新竹市    X=30 澎湖縣 
  G=16 宜蘭縣    P=23 雲林縣    Y=31 陽明山 
  H=17 桃園縣    Q=24 嘉義縣    Z=33 連江縣 
  I=34 嘉義市    R=25 台南縣
  
第二碼
  身分證：  1  男姓     2 女生
  居留證：
    臺灣地區無戶籍國民、大陸地區人民、港澳居民：
      A 男性      B 女性
    外國人：
      C 男性      D 女性
    
第三碼
  身分證：  目前均為 0
  居留證：  1 男性      2 女性
  
其餘 4~9 碼均為數字 0...9
    
最末碼 檢核碼
  檢核碼為根據前九碼編碼加權後之計算產生，用以核對 (checksum) 字號正確性
  檢核碼意義可以參考 http://finalfrank.pixnet.net/blog/post/19639058-身分證字號驗證方法
  
  身分證字號產生器 https://people.debian.org/~paulliu/ROCid.html，可用以檢核程式是否正確
  居留證號碼也是利用類似的概念，祇是第二碼英文字依第一碼原則取對照數字，祇取個位數，也就是
    A 取 0,   B 取 1, C 取 2, D 取 3
以下是身分證檢核 JavaScript 程式函式 */

exports.checkPID = checkPID;
function checkPID(pid) {
   
    var err = {};

    if (!pid || pid.length !== 10 ) {
      return false;
    }
    
    if (/^[A-Za-z][12][\d]{8}$/.test(pid) || //國民（身分證字號）
        /^[A-Za-z][A-Da-d][\d]{8}$/.test(pid)) { //外國人(居留證號)
      var table = 'ABCDEFGHJKLMNPQRSTUVXYWZIO';
      var A1 = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3];
      var A2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5];
      var Mx = [9, 8, 7, 6, 5, 4, 3, 2, 1, 1]; //last digit is for checkCode
      //Mx[0] is A2Factor
      var A1Factor = 1;
      var sum = 0;
      pid.split('').forEach(function(curChar, curIndex) {
        if(curIndex == 0) {
          var i = table.indexOf(curChar.toUpperCase());
          sum = A1[i] * A1Factor + A2[i] * Mx[curIndex];
        }
        else if(curIndex == 1) {
          var i = table.indexOf(curChar.toUpperCase());
          if(i != -1) { //A->0,B->1,C->2,D->3
            sum += i * Mx[curIndex];
          }
          else {
            var val = parseInt(curChar);
            if(isNaN(val)) {
              sum = val;
            }
            else {
              sum += val * Mx[curIndex];  
            }
          }
        }
        else {
          var val = parseInt(curChar);
          if(isNaN(val)) {
            sum = val;
          }
          else {
            sum += val * Mx[curIndex];  
          }
        }

      });

      if(sum % 10 == 0) {
        return true;
      }
      else {
        return false;
      }

    }
    else {
      return false;
    }
    
}

exports.checkAuth = function(next) {
  if (!this.user) {
    next({
      message:'請登入後再存取該資源'
    });
  } 
  else {
    next();
  }
};

exports.checkPermissions = function (next) {
  var user = this.user;
  var listName = this.listName;
  var opName = this.opName;

  if(user.isAdmin) {
    return next(); //we dont need to check user with highest priviledge
  }

  if(listName) {
    //console.log('test list:',listName);
    keystone.list(Constants.RegulatedListName).model
    .findOne({ name: listName })
    .select('_id')
    .lean()
    .exec()
    .then(function(rl) {
      if(rl)
        return rl._id;
      else if(keystone.list(listName)) {
        //not a regulated list
        //everyone can access this list
        return 'pass';
      }
      else {
        return Promise.reject('查無此列表');
      }
    })
    .then(function(listID) {
      if(listID === 'pass')
        return listID;

      var PermissionList = keystone.list(Constants.PermissionListName);
      if(opName instanceof Array) {
        var opNameStr = opName.join(' ');
        return PermissionList.model
          .findOne({ 'listName' : listID })
          .select(opNameStr)
          .lean()
          .exec();
      }
      else
        return PermissionList.model
          .findOne({ 'listName' : listID })
          .select(opName)
          .lean()
          .exec();
    })
    .then(function(permission){
      if(permission === 'pass')
        return next();

      if(permission) {
        var userRoles = user.roles;
        if(!userRoles || userRoles.length == 0) {
          return Promise.reject('權限不足');
        }

        function strMapper(item){
          return item.toString();
        }

        var userRoleSet = new Set(userRoles.map(strMapper));
        
        //console.log(userRoles);
        //console.log(permission);

        function userHasPermissionWithOpName(singleOpName) {
          var permittedRole = permission[singleOpName];
          if(permittedRole && permittedRole.length) {
            permittedRole = permittedRole.map(strMapper);
            //check permission
            if(permittedRole.some(function(role){
              return userRoleSet.has(role);
            })) {
              //user is permitted to operate this list
              //console.log(singleOpName, ":passed");
              return true;
            }
            else {
              //console.log(singleOpName, ":failed");
              return false;
            }
          }
          else {
            //console.log(singleOpName, ":failed 2");
            return false;
          }
        }

        if(opName instanceof Array) {
          if(opName.every(userHasPermissionWithOpName)) 
          { 
            //all ops was granted
            next();
          }
          else {
            return Promise.reject('權限不足');
          }
        }
        else { //single opName(for CRUD request)
          if(userHasPermissionWithOpName(opName)) {
            next();
          }
          else {
            return Promise.reject('權限不足');
          }
        }
        
      }
      else {
        return Promise.reject('權限未設定');
      }
    })
    .catch(function(err) {
      return next({
        message: err.toString()
      });
    });

  }
  else {
    next({
      message: '沒有指明欲操作的列表'
    });
  }


};

exports.permissionCheck = function(req, res, next) {
  //console.log("body:-----");
  //console.log(req.body);
  //console.log("user:------");
  //console.log(req.user);
  //console.log("-----------");
  
  var funcArray = [ exports.checkAuth.bind(req) ];
  var listName = req.body.listName ? req.body.listName : this.listName;
  var opName = req.body.opName ? req.body.opName : this.opName;

  if(listName && opName) {
    var params = {
      listName: listName,
      user: req.user,
      opName: opName
    };
    funcArray.push(exports.checkPermissions.bind(params));
  }
  else if(req.body.listArray || this instanceof Array) {
    var listArray = req.body.listArray ? req.body.listArray : this;
    listArray.forEach(function(item) {
      var params = {
        listName: item.listName,
        user: req.user,
        opName: item.opName
      };
      funcArray.push(exports.checkPermissions.bind(params));
    });
  }
  else {
    return res.ktSendRes(400, '參數不足');
  }

  funcArray.push(function(){
    next();
  });

  async.series(funcArray, function(err) {
    if(err) {
      return res.ktSendRes(400, err.message);
    }
  });
    
};


exports.getPureNumStr = function(str) {
  return str.replace( /\D+/g, '');
}

exports.getRegExp = function(data, type) {
  if(type === 'substr') {
    return new RegExp(data);
  }
  else {
    return new RegExp(data);
  }
}

exports.okResponse = function(req, res) {
  res.json({
    success: true
  });
}

exports.refreshSysInfo = function(req, res, next) {
  keystone.list(Constants.SystemListName).model
  .find()
  .sort({$natural:-1}) //newest to oldest
  .limit(1)
  .populate('cityDist')
  .then(function(results) {
    var result;
    if(results instanceof Array && results.length > 0)
      result = results[0];
    else
      result = results;
    
    if(result) {
      keystone.set('sysParams', result);
      next();
    }
    else {
      return Promise.reject('no system params found');
    }

  })
  .catch(function(err) {
    if(res)
      return res.ktSendRes(400, err);
    else
      next(err);
  });
}

exports.addCustomResHandler = function(req, res, next) {
  res.ktSendRes = function(code, err) {
    var msg;
    if(typeof err === 'string')
      msg = err;
    else
      msg = err && err.message? err.message : err.toString();
    res.myErrInfo = msg;
    res.status(code).send(msg);
  }

  next();
}