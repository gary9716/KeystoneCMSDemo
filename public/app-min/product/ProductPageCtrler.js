!function(){"use strict";angular.module("mainApp").controller("ProductPageCtrler",["appRootPath","$http","$window","$state","ngCart","$filter","$rootScope","$uibModal","ngCartItem","$scope","lodash","localStorageService","cachedFarmersKey",function(t,e,c,n,r,a,o,u,s,i,l,d,p){o.productPageCtrler=this;a("listTo2DMat");var f=this;if(f.productTypeTemplatePath=t+"product/product-type.html",f.getProducts=function(t){return e.post("/api/product/get",{mode:t}).then(function(t){var e=t.data;e.success?f.productList=e.result:console.log(e.message)}).catch(function(t){var e=t&&t.data?t.data.toString():t?t.toString():"";o.pubErrorMsg("抓取商品資訊失敗,"+e)})},"productSell"===n.current.name){f.clearCart=function(){r.empty(),f.productList.forEach(function(t){t.isInCart=!1})},f.viewDetail=function(){};var g=function(t){var c=r.getItems().map(function(t){var e={};return e._id=t._id,t.marketPrice===t.price?e.price="market":t.exchangePrice===t.price?e.price="exchange":e.price=t.price,e.qty=t.quantity,e});e.post("/api/product/transact",{_id:t.tranAccount._id,products:c}).then(function(t){var e,c,n=t.data;n.success?(e=n.result,(c=u.open({templateUrl:"checkout-result.html",controller:"CheckoutResultPageCtrler as ctrler",size:"lg",resolve:{checkoutResult:function(){return e}}})).result.catch(function(t){c.close()}),d.get(p).forEach(function(t){d.remove(t.pid+",accounts:")}),f.clearCart()):o.pubErrorMsg("兌換失敗,原因"+n.message)}).catch(function(t){var e=t&&t.data?t.data.toString():t?t.toString():"";o.pubErrorMsg("兌換失敗,原因"+e)})};f.openShopCart=function(){var t=u.open({templateUrl:"cart-and-checkout.html",controller:"ShopCartModalCtrler as ctrler",size:"lg",resolve:{curShopCart:function(){return r}}});t.result.then(function(t){g(t)}).catch(function(e){"clear"===e&&(f.clearCart(),o.pubSuccessMsg("已清空購物車")),t.close()})},f.addItemToCart=function(t){r.addItem(t),t.isInCart=!0},f.rmItemFromCart=function(t){r.removeItemById(t._id),t.isInCart=!1},f.isItemInCart=function(t){return r.isItemInCart(t._id)},f.qtyIsNaN=function(t){return isNaN(t.quantity)},f.changeQty=function(t,e){isNaN(t.quantity)||(t.quantity+=e)};var h="riceShop";locals&&locals.user&&(h=locals.user.userID+"-cart"),r.init(h),r.$restore(),r.setTaxRate(5),r.setShipping(1),f.getProducts("saleable").then(function(){f.productList=f.productList.map(function(t){var e=r.getItemById(t._id);return e?(t.isInCart=!0,l.assign(e,t),e):((t=new s(t)).isInCart=!1,t.price=t.exchangePrice,t.quantity=1,t)})})}else if("productManage"===n.current.name){f.openProductEditModal=function(t){var c=u.open({templateUrl:"product-edit-modal.html",controller:"ProductEditModalCtrler as ctrler",size:"md",resolve:{product:function(){return t}}});c.result.then(function(t){!function(t){e.post("/api/product/upsert",t).then(function(t){var e=t.data;if(e.success){var c=e.result,n=l.find(f.productList,function(t){return t._id===c._id});n?l.assign(n,c):f.productList.push(c),o.pubSuccessMsg("新增成功,已更新畫面")}else o.pubErrorMsg("更新失敗,"+e.message)}).catch(function(t){o.pubErrorMsg(t&&t.data?t.data.toString():t?t.toString():"")})}(t)}).catch(function(){c.close()})},f.deleteProduct=function(t){!0===confirm("確定要刪除這個產品嗎")&&e.post("/api/product/delete",{_id:t._id}).then(function(e){var c=e.data;c.success?(!function(t){var e=l.findIndex(f.productList,function(e){return e._id===t._id});-1!==e&&f.productList.splice(e,1)}(t),o.pubSuccessMsg("刪除成功,已更新畫面")):o.pubErrorMsg("刪除失敗,"+c.message)}).catch(function(t){var e=t&&t.data?t.data.toString():t?t.toString():"";o.pubErrorMsg("刪除商品失敗,"+e)})},f.getProductStatus=function(t){return t.canSale?new Date(t.startSaleDate)<=Date.now()?"販售中":"等待上架":"下架中"},f.getProducts("all")}}]).controller("ProductEditModalCtrler",["$http","$uibModalInstance","product","lodash",function(t,e,c,n){var r=this;if(c){var a=n.clone(c,!1);r.product=a,a.startSaleDate=Date.parse(a.startSaleDate)}else r.product={};r.getProductTypes=function(){t.post("/api/read",{listName:"ProductType"}).then(function(t){var e=t.data;e.success?(r.pTypeVals=e.result,r.product.pType&&(r.product.pType=n.find(r.pTypeVals,function(t){return t._id===r.product.pType._id}))):console.log(err.message)}).catch(function(t){var e=t&&t.data?t.data.toString():t?t.toString():"";$rootScope.pubErrorMsg("抓取商品類型資訊失敗,"+e)})},r.ok=function(){e.close(r.product)},r.cancel=function(){e.dismiss("cancel")},r.pTypeSelect=function(){r.product.pid=r.product.pType.code},r.getProductTypes()}]).controller("ShopCartModalCtrler",["$q","$http","$uibModalInstance","curShopCart","localStorageService","cachedFarmersKey","lodash","$scope",function(t,e,c,n,r,a,o,u){var s=this;s.alerts=[],s.pubSuccessMsg=function(t){s.alerts.push({type:"success",msg:t})},s.pubWarningMsg=function(t){s.alerts.push({type:"warning",msg:t})},s.pubInfoMsg=function(t){s.alerts.push({type:"info",msg:t})},s.pubErrorMsg=function(t){s.alerts.push({type:"danger",msg:t})};var i=function(c){return e.post("/api/farmer/get-and-populate",{farmerPID:c,active:!0,freeze:!1}).then(function(e){var n=e.data;return n.success?(s.accounts=n.result.accounts,s.accounts&&s.accounts.length>0?r.set(c+",accounts:",s.accounts):s.accounts=[],s.accounts):t.reject()}).catch(function(t){s.pubErrorMsg(t.toString())})};if(s.farmerSelected=function(t){if(s.selectedFarmer){var e=s.selectedFarmer.pid;r.set("ProductPage:selectedFarmer",e),i(e).then(function(){var t=r.get(e+",ProductPage:selectedAccount:");s.selectedAccount=t?o.find(s.accounts,function(e){return e._id===t}):o.find(s.accounts,function(t){return t.active})})}},s.isUpdatingAccount=!1,s.updateAccountsInfo=function(){if(s.selectedFarmer){s.isUpdatingAccount=!0;var t=s.selectedAccount?s.selectedAccount._id:null;i(s.selectedFarmer.pid).then(function(){s.selectedAccount=o.find(s.accounts,function(e){return e._id===t})}).finally(function(){s.isUpdatingAccount=!1})}},s.accountSelected=function(){s.selectedAccount&&r.set(s.selectedFarmer.pid+",ProductPage:selectedAccount:",s.selectedAccount._id)},s.isBalanceNotEnough=function(){return!!s.selectedAccount&&s.selectedAccount.balance<s.getTotalPrice()},s.rmItemFromCart=function(t){n.removeItemById(t._id),t.isInCart=!1},s.saveCart=function(){n.$save()},s.checkout=function(){c.close({tranAccount:s.selectedAccount})},s.cancel=function(t){c.dismiss(t||"cancel")},s.cartEmpty=function(){return 0===n.getItems().length},s.changeQty=function(t,e){isNaN(t.quantity)||(t.quantity+=e,s.saveCart())},s.getTotalPrice=function(){return n.getSubTotal()},s.getAfterBalance=function(){return s.selectedAccount?s.selectedAccount.balance-s.getTotalPrice():-1},s.isViaCachedList=function(){return"viaCachedList"===s.accountSrcOpt},s.isViaAccountID=function(){return"viaAccountID"===s.accountSrcOpt},s.setSelectedAccount=function(){s.inputAccID&&s.inputAccID.length>0?(s.isUpdatingAccount=!0,e.post("/api/read",{listName:"Account",filters:{accountID:s.inputAccID}}).then(function(t){var e=t.data;e.success?e.result instanceof Array?e.result.length>0?s.selectedAccount=e.result[0]:s.pubErrorMsg("沒找到相對應的存摺"):e.result?s.selectedAccount=e.result:s.pubWarningMsg("沒有找到存摺"):s.pubErrorMsg("沒找到相對應的存摺,"+e.message)}).catch(function(t){s.pubErrorMsg("失敗,"+msg)}).finally(function(){s.isUpdatingAccount=!1})):alert("請輸入存摺編號")},s.keyPressedInAccIDInput=function(t){13===t.keyCode&&(t.preventDefault(),s.setSelectedAccount())},s.cartItems=n.getItems(),s.cachedFarmers=r.get(a),s.cachedFarmers&&s.cachedFarmers.length>0){var l=r.get("ProductPage:selectedFarmer");s.selectedFarmer=l?o.find(s.cachedFarmers,function(t){return t.pid===l}):s.cachedFarmers[0],s.farmerSelected()}u.$watch("ctrler.selectedAccount",function(t){t&&t.balance>=s.getTotalPrice()?u.cartForm.accountData.$setValidity("balanceEnough",!0):u.cartForm.accountData.$setValidity("balanceEnough",!1)})}]).controller("CheckoutResultPageCtrler",["$uibModalInstance","checkoutResult",function(t,e){this.total=e.transaction.amount,this.account=e.account,this.transactedItems=e.transaction.products,this.cancel=function(){t.dismiss()}}])}();