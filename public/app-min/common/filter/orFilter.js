!function(){"use strict";angular.module("mainApp").filter("orFilter",["$filter",function(n){return function(r,t,u,e,i){var c=n("filter");if(t&&t.length>0&&u){var f=t.map(function(n){var t={};return t[n]=u,c(r,t,e)});return f=f.reduce(function(n,r){return n.concat(r)}),i?_.uniqBy(f,i):_.uniq(f)}return c(r,u,e)}}])}();