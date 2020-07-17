# EventEmitter

-   [nodejs 中的文档参考](http://nodejs.cn/api/events.html#events_class_eventemitter)
-   下面需要实现在浏览器中的类似功能，主要有 emit on off once
-   增加一个 hasEvent 函数，来判断是否有这个事件加入了
-   支持对类原型上通过 on 来增加全局 eventEmitter 事件
-   本实例会在 ajax 中，实现[ajax 库](ajax/lib.md)中会使用到

```javascript
// 全局事件按类来分
let monitorAll = new Map();
// ES6 实现 EventEmitter 的方式
export default class EventEmitter {
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
```

## EventEmitter 的使用

```javascript
// 基本用法
let em1 = new EventEmitter();
em1.on("event1", function(data) {});
em1.emit("event1", "data1");

// 全局设置
EventEmitter.prototype.on("global1", function() {});

// 这时候，em2中，就包含了global1这个事件
let em2 = new EventEmitter();

// EventEmitter支持被继承，继承后，新的类上设置的全局事件和EventEmitter上的全局事件设置不冲突
class SubEvent extends EventEmitter {
    constructor() {
        super();
    }
}
SubEvent.prototype.on("global2", function() {});
// 这时候，se2中，就包含了global2这个事件
let se2 = new SubEvent();
```
