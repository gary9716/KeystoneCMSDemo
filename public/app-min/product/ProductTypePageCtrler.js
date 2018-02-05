!function(){"use strict";angular.module("mainApp").controller("ProductTypePageCtrler",["$http","$uibModal","$rootScope","lodash",function(t,e,r,o){var n=this;n.pTypes=[],r.productTypePageCtrler=this,n.getProductTypes=function(){t.post("/api/read",{listName:"ProductType"}).then(function(t){var e=t.data;e.success?n.pTypes=e.result:console.log(err.message)}).catch(function(t){var e=t&&t.data?t.data.toString():t?t.toString():"";r.pubErrorMsg("抓取商品類型資訊失敗,"+e)})};n.openEditModal=function(c){var s=e.open({templateUrl:"product-type-edit-modal.html",controller:"ProductTypeEditModalCtrler as ctrler",size:"md",resolve:{productType:function(){return c}}});s.result.then(function(e){!function(e){t.post("/api/p-type/upsert",e).then(function(t){var e=t.data;if(e.success){r.pubSuccessMsg("操作成功");var c=e.result,s=o.find(n.pTypes,function(t){return t._id===c._id});s?o.assign(s,c):n.pTypes.push(c)}else r.pubErrorMsg("更新失敗,"+e.message)}).catch(function(t){var e=t&&t.data?t.data.toString():t?t.toString():"";r.pubErrorMsg("更新失敗,"+e)})}(e)}).catch(function(){s.close()})},n.getProductTypes()}]).controller("ProductTypeEditModalCtrler",["$uibModalInstance","productType",function(t,e){var r=this;r.productType=e?_.clone(e,!1):{},r.ok=function(){t.close(r.productType)},r.cancel=function(){t.dismiss("cancel")}}])}();