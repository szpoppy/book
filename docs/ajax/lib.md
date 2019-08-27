# ajax 库的实现（整合 xhr fetch jsonp）

## 先来个流程图

![avatar](./imgs/ajax-1.png)

-   左侧为请求体（Request）
-   右侧为响应体（Response）
-   Event 代表事件相应
-   open 事件可以认为是 axios 中的 request 拦截器
-   verify 事件可以认为是 axios 中的 response 拦截器
-   其他的具体细节可以看代码实现

```javascript
// AJAX 中的数据中已经实现
import qs from "querystring";
// EventEmitter
import EventEmitter from "eventemitter";

// 动态加载js
// jsonp 加载方式需要使用
let head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
function loadJS(url, callback) {
    // 创建节点
    let node = document.createElement("script");
    // 设置属性
    node.setAttribute("type", "text/javascript");
    node.onload = node.onerror = function() {
        node.onload = node.onerror = null;
        callback && callback();
        setTimeout(function() {
            //防止回调的时候，script还没执行完毕
            // 延时 2s 删除节点
            if (node) {
                node.parentNode.removeChild(node);
                node = null;
            }
        }, 2000);
    };

    node.async = true;
    head.appendChild(node);
    node.src = url;
    return node;
}

// 获取页面唯一的 id 值
// jsonp和禁止使用缓存中使用
let soleTime = new Date().getTime() - 1000000;
let soleCount = 1000;
function getUUID() {
    soleCount;
    soleCount += 1;
    return Number(Math.round((Math.random() + 1) * 1000000) + (new Date().getTime() - soleTime) + "" + soleCount).toString(36);
}

// 获得url的真实地址
// 判断请求是否为跨域使用
let linkA = document.createElement("a");
function getFullUrl(url) {
    linkA.setAttribute("href", url);
    return linkA.href;
}

// 当前页面的域名， 带端口号
let host = window.location.host;
// 是否原声支持 fetch
let hasFetch = !!window.fetch;

// 参数整合url, 将多个URLSearchParams字符串合并为一个
function fixedURL(url, paramStr) {
    if (paramStr) {
        return url + (url.indexOf("?") > -1 ? "&" : "?") + paramStr;
    }
    return url;
}

// 参数转为 字符串
function getParamString(param, dataType, isxhr) {
    if (param instanceof window.FormData) {
        return param;
    }
    if (!param || typeof param == "string") {
        return param || "";
    }
    let str = dataType == "json" ? JSON.stringify(param) : stringifyQS(param);
    if (isxhr) {
        return str.replace(/[\x00-\x08\x11-\x12\x14-\x20]/g, "*");
    }
    return str;
}

// 获取默认的 Content-Type 的值
function getDefaultContentType(dataType) {
    if (dataType == "json") {
        return "application/json";
    }
    return "application/x-www-form-urlencoded";
}

//创建XHR，兼容各个浏览器
function createXHR(isCross) {
    if (window.XDomainRequest && isCross) {
        // IE8 创建跨域请求的xhr
        return new window.XDomainRequest();
    }
    return new window.XMLHttpRequest();
};


```
