!function(){"use strict";angular.module("mainApp").controller("TransListPageCtrler",["$http","$window","$state","$rootScope","lodash","localStorageService","$uibModal",function(t,a,e,r,n,o,i){var s=this;s.filters={},s.shopFilterSelected=function(){s.shopFilter&&"any"!==s.shopFilter&&(s.applyShopFilter=!0)},s.initDateFilter=function(){var t=new Date;t.setHours(0,0,0,0),s.startDateFilter=t,s.endDateFilter=t,s.applyDateFilter=!0,s.filterChange()},s.datePickerChange=function(){(n.isDate(s.endDateFilter)||n.isDate(s.startDateFilter))&&(s.applyDateFilter=!0)},s.filterChange=function(){var t={};if(s.applyShopFilter&&s.shopFilter&&"any"!==s.shopFilter&&(t.shop=s.shopFilter),n.isDate(s.endDateFilter)&&s.endDateFilter<s.startDateFilter&&(s.endDateFilter=s.startDateFilter),s.applyDateFilter)if(n.isDate(s.startDateFilter)){var a=new Date(s.startDateFilter);if(a.setHours(0,0,0,0),n.isDate(s.endDateFilter))(e=new Date(s.endDateFilter)).setHours(24,0,0,0),t.date={$gte:a,$lt:e};else t.date={$gte:a}}else if(n.isDate(s.endDateFilter)){var e;(e=new Date(s.endDateFilter)).setHours(24,0,0,0),t.date={$lt:e}}s.filters=t,s.aggregateData={},s.getTransactionData()};var c={};s.getShops=function(){t.post("/api/read",{listName:"Shop"}).then(function(t){var a=t.data;a.success&&(s.shops=a.result,s.shops.forEach(function(t){c[t._id]=t}))}).catch(function(t){var a=t&&t.data?t.data.toString():t?t.toString():"";r.pubErrorMsg("讀取兌領處資訊失敗,"+a)})},s.perPage=10,s.curPage=1,s.getTransactionData=function(){t.post("/api/read",{listName:"Transaction",filters:s.filters,sort:"-date",populate:"trader shop account",page:s.curPage,perPage:s.perPage}).then(function(t){var a=t.data;a.success?(s.transactions=a.result,s.totalTrans=a.total):r.pubErrorMsg("讀取兌領記錄失敗,"+a.message)}).catch(function(t){var a=t&&t.data?t.data.toString():t?t.toString():"";r.pubErrorMsg("讀取兌領記錄失敗,"+a)})};s.deleteTrans=function(e){a.confirm("你確定要刪除此兌領紀錄嗎")&&t.post("/api/transaction/delete",{_id:e._id}).then(function(t){var a=t.data;a.success?(s.getTransactionData(),r.pubSuccessMsg("刪除兌領紀錄成功")):r.pubErrorMsg("刪除兌領紀錄失敗,"+a.message)}).catch(function(t){var a=t&&t.data?t.data.toString():t?t.toString():"";r.pubErrorMsg("刪除兌領紀錄失敗,"+a)})},s.openProductsModal=function(a,e){var n=i.open({templateUrl:"trans-detail-and-edit-modal.html",controller:"TransProductsModal as ctrler",size:"lg",resolve:{transaction:function(){return a},mode:function(){return e}}});n.result.then(function(a){var e;e=a,t.post("/api/transaction/update",{_id:e._id,products:e.products}).then(function(t){var a=t.data;a.success?(s.getTransactionData(),r.pubSuccessMsg("更新兌領紀錄成功")):r.pubErrorMsg("更新兌領紀錄失敗,"+a.message)}).catch(function(t){var a=t&&t.data?t.data.toString():t?t.toString():"";r.pubErrorMsg("更新兌領紀錄失敗,"+a)})}).catch(function(){n.close()})};var g={};s.getAggVal=function(t){if(s.aggregateData.products){var a=0;return"qty"===t?s.aggregateData.products.forEach(function(t){a+=t.qty}):"money"===t?s.aggregateData.products.forEach(function(t){a+=t.totalMoney}):"weight"===t?s.aggregateData.products.forEach(function(t){a+=t.totalWeight}):"price"===t&&s.aggregateData.products.forEach(function(t){a+=t._id.price}),a}return 0},s.aggregateData={},s.aggregateProducts=function(){s.aggregateData.products=void 0,s.isAggregating=!0,s.aggregateData.startDate=s.filters.date&&n.isDate(s.filters.date.$gte)?new Date(s.filters.date.$gte):void 0,s.aggregateData.endDate=s.filters.date&&n.isDate(s.filters.date.$lt)?new Date(s.filters.date.$lt):void 0,s.aggregateData.endDate&&s.aggregateData.endDate.setHours(-24,0,0,0),s.aggregateData.shop=s.filters.shop?c[s.filters.shop].name:void 0;var a={};n.isEmpty(s.filters)||(a.filters=s.filters),t.post("/api/transaction/aggregate-product",a).then(function(t){var a,e,o,i=t.data;i.success&&(a=i.result,e=a.basicInfo,o=a.productByShop,e.forEach(function(t){g[t._id]=t}),s.aggregateData.products=o.map(function(t){return n.assign(t._id,g[t._id.pid]),t.totalMoney=t._id.price*t.qty,t.totalWeight=t._id.weight*t.qty,t._id.shop=c[t._id.shop],t}),s.aggregateData.products&&s.aggregateData.products.sort(function(t,a){var e=t._id.pid.toUpperCase(),r=a._id.pid.toUpperCase();return e<r?-1:e>r?1:0}),s.aggregateData.transCount=a.transCount,r.pubSuccessMsg("統計成功,已更新畫面"))}).catch(function(t){var a=t&&t.data?t.data.toString():t?t.toString():"";r.pubErrorMsg("統計失敗,"+a)}).finally(function(){s.isAggregating=!1})},s.downloadProductAggInfoPDF=function(){s.isDownloading=!0,t.post("/pdf/transacted-products",{shop:s.aggregateData.shop,startDate:s.aggregateData.startDate,endDate:s.aggregateData.endDate,products:s.aggregateData.products,transCount:s.aggregateData.transCount}).then(function(t){var a=t.data.filename,e=new Blob([new Uint8Array(t.data.content.data)],{type:"application/pdf"});saveAs(e,a),r.pubSuccessMsg("下載兌領統計表成功")}).catch(function(t){var a=t&&t.data?t.data.toString():t?t.toString():"";r.pubErrorMsg("下載兌領統計表失敗,"+a)}).finally(function(){s.isDownloading=!1})}}]).controller("TransProductsModal",["$uibModalInstance","lodash","transaction","mode",function(t,a,e,r){var n=this,o=a.clone(e);n.products=o.products,n.changeQty=function(t,a){t.qty+=a},n.rmItem=function(t){if(n.products){var e=a.findIndex(n.products,function(a){return a.pid===t.pid});-1!==e&&n.products.splice(e,1)}},n.getTotal=function(){if(n.products){var t=0;return n.products.forEach(function(a){t+=a.price*a.qty}),t}return 0},n.isMode=function(t){return t===r},n.updateTrans=function(){t.close(o)},n.cancel=function(){t.dismiss()}}])}();