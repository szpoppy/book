# 什么是 AJAX

AJAX 全称为“Asynchronous JavaScript and XML”（异步 JavaScript 和 XML），是一种创建交互式网页应用的网页开发技术。  
Ajax 不是一种新的编程语言，而是一种用于创建更好更快以及交互性更强的 Web 应用程序的技术。

## 常用的 AJAX 框架（库）

-   axios 易用、简洁且高效的 http 库 [http://www.axios-js.com](http://www.axios-js.com)
-   Fetch API 是 XMLHttpRequest 的现代替代方法，用于从服务器检索资源 [https://www.w3cschool.cn/fetch_api/](https://www.w3cschool.cn/fetch_api/)
-   jQuery 曾经是 JavaScript 中比较有名的一个前端库，用于处理从 AJAX 调用到操纵 DOM 内容的所有事情。尽管其他相关前端库的相关性有所降低，但仍然可以使用 jQuery 来进行异步调用。[https://api.jquery.com/category/ajax/](https://api.jquery.com/category/ajax/)

## 三种 AJAX 的实现技术

-   XMLHTTPRequest XMLHTTP 是一组 API 函数集
-   fetch 最新浏览器原生支持的，通过 Promise 方案来实现
-   JSONP 为了解决跨域而出现的一种数据获取方案，实现本质是一个动态的 javascript

## XMLHTTPRequest

```javascript
// 创建xmlhttp对象
var xhr = new XMLHttpRequest();
// 通过open传入 接口地址 接口方案 异步加载
xhr.open("/api/user/info", "GET", true);
// 发送
xhr.send();
// 数据返回的回调
xhr.onload = function() {
    // 返回的文本
    xhr.responseText;
    // 返回的XML，如果非xml数据，为null
    xml.responseXML;
    // 返回的状态 一般正常返回都是 200 ，其中304也表示成功
    xml.status;
};
```

## fetch

```javascript
// 发送一个post请求, 天生 Promise
window
    .fetch("/api/user/login", {
        method: "POST",
        body: JSON.stringify({
            account: "locus",
            password: "13456"
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    .then(response => response.json())
    .then(json => console.log(json));
```

## jsonp

> 相对过时的技术，解决老旧浏览器无法跨域请求数据问题

```javascript
// jsonp 只能GET请求

// 创建唯一接受参数函数
var callbackMethod = "jsonp_" + new date().getTime();
// 获取到的数据
var callbackData = null;
window[callbackMethod] = function(data) {
    callbackData = data;
};

// 动态创建script节点
var node = window.document.createElement("script");
// 设置type
node.setAttribute("type", "text/javascript");
// 回调
node.onload = node.onerror = function() {
    // 正常和异常都能触发
    // 释放数据获取函数
    window[callbackMethod] = null;
    // callbackData 为 null 说明没加载到数据
    // ...
};

// 异步，默认也是异步
node.async = true;
window.document.body.appendChild(node);
// 设置url，加载数据
// 返回数据应该为 [callbackMethod](data);
node.src = "/api/user/info?callback=" + callbackMethod;
```
