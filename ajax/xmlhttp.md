# 简单的AJAX库的实现
 - 一个异步AJAX的实现
 - 支持超时、header设置和获取
 - 支持回调函数
 - 支持上传文件调用（FormData）以及上传进度回调
 - 以下代码封装，可以满足90%的需求

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
        method: options.method || 'get',
        // ajax请求超时
        timeout: options.timeout || 0
    }

    // 系统xhr 请求对象
    req.xhr = new window.XMLHttpRequest();

    if(options.onopen) {
        // 这里可以直接通过改变req中的值，来改变接线来的操作
        options.onopen(req)
    }

    // 请求方法 GET POST PUT 等
    var method = (req.method || 'get').toUpperCase()
    req.xhr.open(method, req.url, true);
    if(method != 'GET') {
        var isFormData = window.FormData && req.param instanceof window.FormData
        if(header["Content-Type"] === undefined && !isFormData) {
            // 请求参数格式，如果非querystring格式，请手动设置这个header值
            header["Content-Type"] = 'application/x-www-form-urlencoded'
        }
    }

    for(var n in req.header) {
        // 设置req的header
        if(Object.prototype.hasOwnProperty.call(req.header, n)) {
            req.xhr.setRequestHeader(n, req.header[n])
        }
    }

    if(options.onprogress) {
        // 如果有上传进度回到，附加方法
        // 此方法在低端浏览器上无实现，为了不影响主流程，使用try
        try {
            req.xhr.upload.onprogress = function(event){
                options.onprogress(event, req);
            }
        }catch(e){}
    }

    // 返回数据集合
    var res = {
        _req: req,
        xhr: req.xhr
    }

    function _onload () {
        var xhr = req.xhr;
        if (!res.isTimeout && !xhr && xhr.readyState != 4) {
            // readyState 非4，返回
            return
        }

        // 表示已经完成，并获取到结果
        res.isEnd = true

        let headers = "";
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
        res.json = {}
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

        let s = res.status;
        // 返回这些状态值表示正确
        res.isOk = (s >= 200 && s < 300) || s === 304 || false
        if(options.callback) {
            // 执行回调函数
            options.callback(res)
        }
        return res;
    }

    // 加入onload事件
    if('onload' in req.xhr) {
        req.xhr.onload = _onload
    }
    else {
        req.xhr.onreadystatechange = _onload
    }

    if(req.timeout) {
        // 超时设置
        setTimeout(function() {
            if(res.isEnd) {
                // 已经完成流程，不需要触发超时
                return ;
            }
            res.isTimeout = true;
            req.xhr.abort()
        }, req.timeout)
    }

    var param = req.param
    if(method == 'GET') {
        // GET 无需传入param
        param = null
    }
    else if(typeof param == 'string') {
        // string需要过滤部分特殊字符
        param = param.replace(/[\x00-\x08\x11-\x12\x14-\x20]/g, "*")
    }

    req.xhr.send(param);
}
```