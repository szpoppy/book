(function(global, factory) {
    // UMD 加载方案
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory();
        return;
    }
    if (typeof define === "function" && define.amd) {
        define(factory);
        return;
    }
    global.Ajax = factory();
})(window, function() {
    "use strict";

    let toString = Object.prototype.toString;
    // EventEmitter
    let EventEmitter = (function() {
        // 全局事件按类来分
        let monitorAll = new Map();
        // ES6 实现 EventEmitter 的方式
        class EventEmitter {
            constructor() {
                let monitor = {};
                if (this._monitor_) {
                    for (let n in this._monitor_) {
                        if (Object.prototype.hasOwnProperty.call(this._monitor_, n)) {
                            (monitor[n] = []).push(...this._monitor_[n]);
                        }
                    }
                }
        
                Object.defineProperty(this, "_monitor_", {
                    get() {
                        // 按照类名返回真实的全局事件
                        return monitor;
                    },
                    set(value) {
                        // 按照类名来设置全局类的全局事件
                        monitor = value;
                    }
                });
            }
            /**
             * 绑定事件
             * @param type 事件名称
             * @param fun 事件方法
             * @returns {EventEmitter}
             */
            on(type, fun) {
                let monitor = this._monitor_ || (this._monitor_ = {});
                monitor[type] || (monitor[type] = []);
                monitor[type].push(fun);
                return this;
            }

            /**
             * 判断是否还有特定事件
             * @param type
             * @returns {Boolean}
             */
            hasEvent(type) {
                let monitor = (this._monitor_ && this._monitor_[type]) || [];
                return monitor.length > 0;
            }

            /**
             * 只有执行一次的事件
             * @param type 事件名称
             * @param fun 事件方法
             * @returns {EventEmitter}
             */
            once(type, fun) {
                function funOnce() {
                    fun.apply(this, arguments);
                    this.off(type, funOnce);
                }
                this.on(type, funOnce);
                return this;
            }

            /**
             * 移除事件
             * @param type 事件名称
             * @param fun 事件方法
             * @returns {EventEmitter}
             */
            off(type, fun) {
                let monitor = this._monitor_;
                if (monitor) {
                    if (fun) {
                        let es = monitor[type];
                        if (es) {
                            let index = es.indexOf(fun);
                            if (index > -1) {
                                es.splice(index, 1);
                            }
                            if (es.length == 0) {
                                delete monitor[type];
                            }
                        }
                    } else if (type) {
                        delete monitor[type];
                    } else {
                        delete this._monitor_;
                    }
                }
                return this;
            }

            /**
             * 触发事件
             * @param {String} type 事件名称
             * @param {*} ag 传递的参数
             */
            emit(type, ...ag) {
                let es = (this._monitor_ && this._monitor_[type]) || [];
                if (es.length) {
                    for (let i = 0; i < es.length; i += 1) {
                        es[i].apply(this, ag);
                    }
                }
                return ag;
            }
        }

        Object.defineProperty(EventEmitter.prototype, "_monitor_", {
            get() {
                // 按照类名返回真实的全局事件
                return monitorAll.get(this.constructor);
            },
            set(value) {
                // 按照类名来设置全局类的全局事件
                monitorAll.set(this.constructor, value);
            }
        });

        return EventEmitter;
    })();

    // URL 查询字符串
    let qs = {
        parse: function(str, opt) {
            let sep = (opt && opt.sep) || "&";
            let eq = (opt && opt.eq) || "=";
            let unescape = (opt && opt.unescape) || window.decodeURIComponent;

            let data = {};
            // 去除部分没有的字符
            str.replace(/^[\s#?]+/, "")
                .split(sep)
                .forEach(function(item) {
                    if (!item) {
                        return;
                    }
                    let arr = item.split(eq);
                    let key = arr[0];
                    if (key) {
                        let val = unescape(arr[1] || "");
                        if (data[key] === undefined) {
                            // 赋值
                            data[key] = val;
                        } else if (data[key].push) {
                            // 多个相同字符
                            data[key].push(val);
                        } else {
                            // 值转化为数组
                            data[key] = [data[key], val];
                        }
                    }
                });
            return data;
        },
        stringify: function(json, opt) {
            let sep = (opt && opt.sep) || "&";
            let eq = (opt && opt.eq) || "=";
            let escape = (opt && opt.escape) || window.encodeURIComponent;

            let arr = [];
            for (let n in json) {
                if (json.hasOwnProperty(n)) {
                    let item = json[n];
                    if (item == null) {
                        item = "";
                    }
                    let key = escape(n);
                    if (item && item.constructor == Array) {
                        // 数组要转化为多个相同kv
                        for (let i = 0; i < item.length; i += 1) {
                            arr.push(key + eq + escape(item[i]));
                        }
                    } else {
                        // 直接push
                        arr.push(key + eq + escape(item));
                    }
                }
            }
            return arr.join(sep);
        }
    };

    /**
     * 数据循环
     * @param {Array、Object} arr 循环的数据
     * @param {Function} fun 每次循环执行函数
     * @param {Array} exe fun return后推入次数组
     * @param {*} scope fun this指向
     */
    let forEach = (function() {
        function forpush(arr, v) {
            arr.push(v);
            return v;
        }

        function forappend(obj, v, k) {
            obj[k] = v;
        }

        function forback() {
            return arguments[1];
        }

        // 支持for循环的 数据
        const types = "-[object array]-[object nodelist]-[object htmlcollection]-[object arguments]-";

        return function(arr, fun, exe, scope) {
            scope || (scope = this);
            if (arr) {
                let doExe = exe ? (exe.push ? forpush : forappend) : forback;
                let len = arr.length;
                if (types.indexOf("-" + toString.call(arr).toLowerCase() + "-") > -1 || "[object htmlcollection]" == String(arr).toLowerCase()) {
                    for (let i = 0; i < len; i += 1) {
                        let item = fun.call(scope, arr[i], i);
                        if (item === false) {
                            break;
                        }
                        doExe(exe, item, i);
                    }
                } else {
                    for (let n in arr) {
                        if (!arr.hasOwnProperty || arr.hasOwnProperty(n)) {
                            let item = fun.call(scope, arr[n], n);
                            if (item === false) {
                                break;
                            }
                            doExe(exe, item, n);
                        }
                    }
                }
            }
            return exe || scope;
        };
    })();

    // 当前页面的域名， 带端口号
    let host = window.location.host;
    // 是否原声支持 fetch
    let hasFetch = !!window.fetch;

    // 深度克隆
    function assign(target, objs) {
        forEach(objs, function(source) {
            forEach(source, function(item, n) {
                if (item && typeof item == "object") {
                    //console.log(JSON.stringify(item), JSON.stringify(target[n]), n, toString.call(target[n]), toString.call(item))
                    if (target[n] == null || toString.call(target[n]) != toString.call(item)) {
                        // 发现 原来 target 存在相同的数据，不在此覆盖数据
                        // 于 Object.assign 不同在于此
                        target[n] = item instanceof Array ? [] : {};
                    }
                    assign(target[n], [item], flg);
                } else {
                    target[n] = item;
                }
            });
        });
        return target;
    }

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

    // 结束 同意处理返回的数据
    function responseEnd(req, res) {
        if (!res.json && res.text && !res.result) {
            // 尝试格式为 json字符串
            res.json = {};
            try {
                JSON.parse(res.text);
            } catch (e) {}
        }

        delete this._req;

        // 出发验证事件
        this.emit("verify", res, req);

        if (res.cancel === true) {
            // 验证事件中设置 res.cancel 为false，中断处理
            return;
        }
        // callback事件，可以看做函数回调
        this.emit("callback", res, req);
    }

    // ==============================================jsonp==============================================
    function jsonpSend(req, res) {
        // jsonp 无法获得header，所以全部返回 空
        res.getHeader = function() {
            return "";
        };

        // 参数
        let param = req.param;

        // callback
        let key = req.jsonpKey || this.jsonpKey;
        // jsonp回调字符串
        let backFunKey = param[key];
        if (!backFunKey) {
            // 没设置，自动设置一个
            param[key] = backFunKey = "jsonp_" + getUUID();
        }

        // 控制，只出发一次回调
        let backFunFlag;
        // 回调函数
        let backFun = data => {
            if (!backFunFlag) {
                backFunFlag = true;
                // json数据
                res.json = data;
                // json字符串
                res.text = "";
                // 错误，有data就正确的
                res.err = data ? null : "http error";
                if (!req.outFlag) {
                    // outFlag 就中止
                    responseEnd.call(this, req, res);
                }
            }
        };

        // 设置默认的回调函数
        window[backFunKey] = backFun;

        // 所有参数都放在url上
        let url = fixedURL(req.url, param);

        // 发送事件出发
        this.emit("send", req);
        // 发送请求
        loadJS(url, function() {
            backFun();
        });
    }

    /**
     * fetch 发送数据
     */
    function fetchSend(req, res) {
        // 方法
        let method = String(req.method || "GET").toUpperCase();

        // 参数
        let param = req.param;

        // fetch option参数
        let option = {
            method: method,
            headers: req.header
        };

        let url = req.url;

        if (method == "GET") {
            url = fixedURL(url, param);
            option.body = param = null;
        } else {
            option.body = getParamString(param, req.dataType) || null;
            if (req.header["Content-Type"] === undefined && !req.isFormData) {
                // 默认 Content-Type
                req.header["Content-Type"] = getDefaultContentType(dataType);
            }
        }

        if (req.header["X-Requested-With"] === undefined && !req.isCross) {
            // 跨域不增加 X-Requested-With
            req.header["X-Requested-With"] = "XMLHttpRequest";
        }

        if (req.isCross) {
            // 跨域
            option.mode = "cors";
            if (req.withCredentials) {
                // 发送请求，带上cookie
                option.credentials = "include";
            }
        } else {
            // 同域，默认带上cookie
            option.credentials = "same-origin";
        }

        // response.text then回调函数
        let fetchData = ([text, result]) => {
            res.text = text;
            res.result = result;
            // 统一处理 返回数据
            responseEnd.call(this, req, res);
        };

        // fetch then回调函数
        function fetchBack(response) {
            if (!req.outFlag) {
                // outFlag 为true，表示 中止了

                // 获取header
                res.getHeader = function(key) {
                    try {
                        return response.headers.get(key);
                    } catch (e) {
                        return "";
                    }
                };

                // 状态吗
                res.status = response.status;
                // 返回的字符串
                res.text = "";
                // 是否有错误
                res.err = response.ok ? null : "http error [" + res.status + "]";
                let results = ["", null];
                try {
                    results[0] = response.text();
                } catch (e) {}

                if (["json", "text"].indexOf(req.resType) < 0) {
                    try {
                        results[1] = response[req.resType]();
                    } catch (e) {}
                }

                Promise.all(results).then(fetchData, fetchData);
            }
            delete req.outFlag;
        }

        // 发送事件处理
        this.emit("send", req);
        // 发送数据
        window.fetch(req.url, option).then(fetchBack, fetchBack);
    }

    //创建XHR，兼容各个浏览器
    function createXHR(isCross) {
        if (window.XDomainRequest && isCross) {
            // IE8 创建跨域请求的xhr
            return new window.XDomainRequest();
        }
        return new window.XMLHttpRequest();
    }
    // xhr的onload事件
    function onload(req, res) {
        let xhr = req.xhr;
        // req.outFlag 为true 表示，本次ajax已经中止，无需处理
        if (xhr && !req.outFlag) {
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
            res.result = null;
            try {
                // 返回的文本信息
                res.result = xhr.response;
            } catch (e) {}

            // 默认状态值为 0
            res.status = 0;
            try {
                // xhr status
                res.status = xhr.status;
            } catch (e) {}
            // if(res.status === 0){
            //     res.status = res.text ? 200 : 404;
            // }
            let s = res.status;
            // 默认只有当 正确的status才是 null， 否则是错误
            res.err = (s >= 200 && s < 300) || s === 304 || s === 1223 ? null : "http error [" + s + "]";
            // 统一后处理
            responseEnd.call(this, req, res);
        }
        delete req.xhr;
        delete req.outFlag;
    }
    /**
     * xhr 发送数据
     * @returns {ajax}
     */
    function xhrSend(req, res) {
        // XHR
        req.xhr = createXHR(req.isCross);

        // xhr 是否使用了 IE8 XDR
        let isXDR = (req.isXDR = req.xhr.constructor == window.XDomainRequest);
        if (isXDR && req.async === false) {
            // 注意 IE8 XDR无法同步
            req.async = true;
        }

        // xhr 请求方法
        let method = String(req.method || "GET").toUpperCase();

        if (req.withCredentials) {
            // xhr 跨域带cookie
            req.xhr.withCredentials = true;
        }

        let param = req.param;
        if (method == "GET") {
            // get 方法，参数都组合到 url上面
            req.xhr.open(method, fixedURL(req.url, param), req.async);
            param = null;
        } else {
            // 其他可以放 body上
            let url = req.url;
            if (isXDR) {
                // XDR 不能发送 body数据，参数只能放 url上
                url = fixedURL(url, param);
                param = null;
            }
            req.xhr.open(method, req.url, req.async);
            if (req.header["Content-Type"] === undefined && !req.isFormData) {
                // Content-Type 默认值
                req.header["Content-Type"] = getDefaultContentType(req.dataType);
            }
        }
        if (req.header["X-Requested-With"] === undefined && !req.isCross) {
            // 跨域不增加 X-Requested-With 如果增加，容易出现问题，需要可以通过 事件设置
            req.header["X-Requested-With"] = "XMLHttpRequest";
        }

        if (!isXDR) {
            // XDR 不能设置 header
            forEach(req.header, function(v, k) {
                req.xhr.setRequestHeader(k, v);
            });
        }
        res.status = 0;

        if (this.hasEvent("progress")) {
            // 跨域 加上 progress post请求导致 多发送一个 options 的请求
            // 只有有进度需求的任务,才加上
            try {
                req.xhr.upload.onprogress = () => {
                    this.emit("progress", event);
                };
            } catch (e) {}
        }

        //发送请求
        if (req.async) {
            // onload事件
            req.xhr.onload = onload.bind(this, req, res);
        }

        // 发送前出发send事件
        this.emit("send", req);

        if (["arrayBuffer", "blob"].indexOf(req.resType) >= 0) {
            req.xhr.responseType = req.resType;
        }

        // 发送请求，注意要替换
        req.xhr.send(getParamString(param, req.dataType, true) || null);

        if (!req.async) {
            onload.call(this, req, res);
            return res;
        }
    }

    // 发送数据整理
    function requestSend(param, req) {
        if (req.outFlag) {
            // 已经中止
            return;
        }

        // 方法
        req.method = String(this.method || "get").toUpperCase();

        // url
        req.url = this.url;

        // 缓存，只针对get请求
        req.cache = this.cache;

        // 请求类型
        let dataType = (req.dataType = String(this.dataType || "").toLowerCase());
        req.resType = this.resType;

        // callback中接收的 res
        let res = {
            // ajax 实例
            root: this
        };

        // 异步 只读
        let async = req.async;

        // 是否为 FormData
        let isFormData = false;
        if (window.FormData && param instanceof window.FormData) {
            isFormData = true;
        }
        req.isFormData = isFormData;

        if (isFormData) {
            // FormData 将参数都添加到 FormData中
            forEach(this.param, function(value, key) {
                if (param.has(key)) {
                    param.append(key, value);
                }
            });
            req.param = param;
        } else {
            if (typeof param == "string") {
                // 参数为字符串，自动格式化为 object，后面合并后在序列化
                param = req.dataType == "json" ? JSON.parse(param) : qs.parse(param);
            }
            req.param = assign({}, this.param, param || {});
        }

        // 合并默认的header
        req.header = assign({}, this.header);

        // 出发open事件
        this.emit("open", req);

        // 还原,防止复写， 防止在 open中重写这些参数
        req.isFormData = isFormData;
        req.async = async;
        req.dataType = dataType;

        let method = String(req.method || "get").toUpperCase();
        if (method == "GET") {
            if (req.cache === false && !req.param._r_) {
                // 加随机数，去缓存
                req.param._r_ = getUUID();
            }
        }

        // 是否跨域, 获全路径后，比对
        req.isCross = !/:\/\/$/.test(getFullUrl(req.url).split(host)[0] || "");

        if (async && method == "JSONP") {
            // jsonp 获取数据
            jsonpSend.call(this, req, res);
            return;
        }

        if (hasFetch && async && this.useFetch && !this.hasEvent("progress")) {
            //fetch 存在 fetch 并且无上传或者进度回调 只能异步
            fetchSend.call(this, req, res);
            return;
        }

        // 走 XMLHttpRequest
        xhrSend.call(this, req, res);
    }

    /**
     * Ajax基础类
     * @param url
     * @param method
     * @param async
     */
    class Ajax extends EventEmitter {
        // 初始化
        constructor({ url = "", method = "GET", dataType, resType, async = true, param = {}, header = {}, jsonpKey } = {}) {
            super();

            // url  ==> req
            this.url = url;

            // 方法 ==> req
            this.method = String(method || "GET").toUpperCase();

            // 异步？ ==> req
            this.async = async;

            // 参数  ==> req
            this.param = param;

            // 请求头设置 ==> req
            this.header = header;

            // 缓存 get ==> req
            this.dataType = (dataType === undefined ? this.dataType : dataType) || "";

            // 返回数据类型
            this.resType = (resType === undefined ? this.resType : resType) || "";

            if (jsonpKey) {
                this.jsonpKey = jsonpKey;
            }
        }

        // 中止 请求
        abort() {
            let req = this._req;
            if (req) {
                // 设置outFlag，会中止回调函数的回调
                req.outFlag = true;
                if (req.xhr) {
                    // xhr 可以原声支持 中止
                    req.xhr.abort();
                    req.xhr = null;
                }
                delete this._req;
            }
            return this;
        }

        // 超时
        timeout(time, callback) {
            setTimeout(() => {
                let req = this._req;
                if (req) {
                    // 超时 设置中止
                    this.abort();
                    // 出发超时事件
                    this.emit("timeout", req);
                }
            }, time);
            callback && this.on("timeout", callback);
            return this;
        }

        // 发送数据， over 代表 是否要覆盖本次请求
        send(param, over) {
            if (this._req) {
                // 存在 _req
                if (!over) {
                    // 不覆盖，取消本次发送
                    return this;
                }
                // 中止当前的
                this.abort();
            }

            // 制造 req
            let req = (this._req = {
                root: this,
                async: this.async
            });

            if (!this.async) {
                // 同步
                return requestSend.call(this, param || {}, req);
            }
            // 异步，settime 部分参数可以后置设置生效
            setTimeout(requestSend.bind(this, param || {}, req), 1);
            return this;
        }
    }

    // 使用 fetch
    Ajax.prototype.useFetch = true;
    // 默认的 jsonp 的 callbackkey
    Ajax.prototype.jsonpKey = "callback";

    // 用于生成快捷方法
    function shortcut(type) {
        return (Ajax[type] = function(opt, callback, param) {
            if (typeof opt == "string") {
                opt = {
                    url: opt
                };
            }
            if (type != "loader") {
                opt.method = type;
            }
            let t = new Ajax(opt);
            callback && t.on("callback", callback);
            t.send(param);
            return t;
        });
    }

    // 三个快捷方法
    shortcut("get");
    shortcut("post");
    shortcut("put");
    shortcut("jsonp");
    shortcut("loader");

    return Ajax;
});
