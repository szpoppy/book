# AJAX 中的数据

## 常用的数据

-   URL 查询字符串(通常用于 Ajax 请求数据参数)[https://baijiahao.baidu.com/s?id=1619273328999923463&wfr=spider&for=pc](https://baijiahao.baidu.com/s?id=1619273328999923463&wfr=spider&for=pc)
-   JSON JS 中最基础的数据格式,通常用于数据获取[http://www.json.org](http://www.json.org)
-   XML 在没有 JSON 数据格式化的时候，最流行的一种数据格式，现在基本不用
-   FormData 用于模拟表单数据，通常用户上传文件时使用

## 其他的数据类型支持

-   不是很常用,请参照[https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API/Using_Fetch#Body](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API/Using_Fetch#Body)

## URL 查询字符串

-   以&作为分隔符，=为 key 和 value 分割的连接字符串
-   nodejs 已经原生实现[querystring](http://nodejs.cn/api/querystring.html)
    > {x:[1,2]} 将解析为 x=1&x=2 反之 x=1&x=2 => {x:[1,2]}

## 简单的实现 querystring （parse， stringify）

```javascript
var querystring = {
    parse: function(str, opt) {
        var sep = opt && opt.sep || '&'
        var eq = opt && opt.eq || '='
        var unescape = opt && opt.unescape || window.decodeURIComponent

        let data= {}
        // 去除部分没有的字符
        str.replace(/^[\s#?]+/, "").split(sep).forEach(function(item){
            if(!item) {
                return ;
            }
            let arr = item.split(eq)
            let key = arr[0];
            if(key){
                let val = unescape(arr[1] || "");
                if (data[key] === undefined) {
                    // 赋值
                    data[key] = val;
                }
                else if (data[key].push) {
                    // 多个相同字符
                    data[key].push(val);
                }
                else {
                    // 值转化为数组
                    data[key] = [data[key], val];
                }
            }
        })
        return data;
    },
    stringify: function(json, opt) {
        var sep = opt && opt.sep || '&'
        var eq = opt && opt.eq || '='
        var unescape = opt && opt.unescape || window.decodeURIComponent

        let arr = []
        for(let n in json){
            if(json.hasOwnProperty(n)){
                let item = json[n]
                if(item == null) {
                    item = "";
                }
                let key = escape(n)
                if( item && item.constructor == Array ){
                    // 数组要转化为多个相同kv
                    for (let i = 0; i < item.length; i += 1) {
                        arr.push(key + eq + escape(item[i]));
                    }
                }
                else{
                    // 直接push
                    arr.push(key + eq + escape(item));
                }
            }
        }
        return arr.join(sep)
    }
}
```

## JSON 数据

-   JS 中支持最好的数据结构
-   原生支持 通过 JSON.parse JSON.stringify 来操作数据

## XML 数据

-   目前基本上不使用了，XMLHttpRequest 的返回数据中默认包含次数据
-   浏览器都能支持此数据格式，但是，不同浏览器使用方式不同，需要兼容

## FormData 数据

-   H5 浏览器都支持，使用 new window.FormData()
-   一般使用在通过 Ajax 上传文件

## 加入数据格式支持的 AJAX 库的实现

```javascript
function ajax(options) {
    var req = {
        // 请求url
        url: options.url,
        // 请求参数
        param: options.param,
        // 请求头
        header: options.header,
        // 请求方法
        method: options.method || "get",
        // ajax请求超时
        timeout: options.timeout || 0,
        // 上传数据类型 (主要需要区分 json数据和url查询字符串)
        dataType: options.dataType
    };

    // 系统xhr 请求对象
    req.xhr = new window.XMLHttpRequest();

    if (options.onopen) {
        // 这里可以直接通过改变req中的值，来改变接线来的操作
        options.onopen(req);
    }

    var isJSONData = req.dataType == "json";

    // 请求方法 GET POST PUT 等
    var method = (req.method || "get").toUpperCase();
    // 参数
    var bodyParam = req.param;
    // 参数是否为object对象
    var isParamObj = Object.prototype.toString.call(bodyParam).toLowerCase() == '[object object]'
    // 参数是否为FormData对象
    var isFormData = window.FormData && req.param instanceof window.FormData;
    if (isParamObj) {
        bodyParam = isJSONData ? JSON.stringify(req.param) : querystring.stringify(req.param);
    }
    // 参数为字符串
    var isBodyParamStr = typeof bodyParam == 'string'
    var url = req.url || "";
    if (method == "GET") {
        if(isBodyParamStr) {
            // 将参数放到url上
            url = url + (url.indexOf("?") > -1 ? "&" : "?") + bodyParam;
        }
        bodyParam = null;
    } else {
        
        if (header["Content-Type"] === undefined && !isFormData) {
            // json 默认使用 application/json
            header["Content-Type"] = isJSONData ? "application/json" : "application/x-www-form-urlencoded";
        }
        if(isBodyParamStr) {
            // 特殊字符过滤
            bodyParam = bodyParam.replace(/[\x00-\x08\x11-\x12\x14-\x20]/g, "*");
        }
    }
    req.xhr.open(method, url, true);

    for (var n in req.header) {
        // 设置req的header
        if (Object.prototype.hasOwnProperty.call(req.header, n)) {
            req.xhr.setRequestHeader(n, req.header[n]);
        }
    }

    if (options.onprogress) {
        // 如果有上传进度回到，附加方法
        // 此方法在低端浏览器上无实现，为了不影响主流程，使用try
        try {
            req.xhr.upload.onprogress = function(event) {
                options.onprogress(event, req);
            };
        } catch (e) {}
    }

    // 返回数据集合
    var res = {
        _req: req,
        xhr: req.xhr
    };

    function _onload() {
        var xhr = req.xhr;
        if (!res.isTimeout && !xhr && xhr.readyState != 4) {
            // readyState 非4，返回
            return;
        }

        // 表示已经完成，并获取到结果
        res.isEnd = true;

        var headers = "";
        try {
            // 获取所有可以的的header值（字符串）
            headers = xhr.getAllResponseHeaders();
        } catch (e) {}

        // 获取某个headers中的值
        res.getHeader = function(key) {
            return new RegExp("(?:" + key + "):[ \t]*([^\r\n]*)\r").test(headers) ? RegExp["$1"] : "";
        };

        res.text = "";
        try {
            // 返回的文本信息
            res.text = xhr.responseText;
        } catch (e) {}
        res.json = {};
        try {
            // 返回的JSON对象
            res.json = JSON.parse(res.text);
        } catch (e) {}
        // 默认状态值为 0
        res.status = 0;
        try {
            // xhr status
            res.status = xhr.status;
        } catch (e) {}

        var s = res.status;
        // 返回这些状态值表示正确
        res.isOk = (s >= 200 && s < 300) || s === 304 || false;
        if (options.callback) {
            // 执行回调函数
            options.callback(res);
        }
        return res;
    }

    // 加入onload事件
    if ("onload" in req.xhr) {
        req.xhr.onload = _onload;
    } else {
        req.xhr.onreadystatechange = _onload;
    }

    if (req.timeout) {
        // 超时设置
        setTimeout(function() {
            if (res.isEnd) {
                // 已经完成流程，不需要触发超时
                return;
            }
            res.isTimeout = true;
            req.xhr.abort();
        }, req.timeout);
    }

    req.xhr.send(bodyParam);
}
```
