# vue-life

## Vue 自定义生命周期

-   所有自定义生命周期，都绑定 Vue 的实际生命周期函数，并确保在实际生命周期之后执行
-   自定义生命周期函数的运行受限于本身项目中的特定流程。
-   下面实例

## 示例

```javascript
// 初始化 钩子函数 ready
import VueLife from "vue-life";
Vue.use(VueLife, {
    // 完成回调
    init(emit) {
        // 运行获取完成身份触发的事件
        setTimeout(() => {
            emit("user", { account: "account" });
        }, 500);

        setTimeout(() => {
            emit("ready", "app is ready");
        }, 200);
    },
    // 默认绑定的vue本身生命周期函数
    hookDef: "mounted",
    // 设置特定的生命周期函数绑定
    hooks: {
        user: "created"
    },
    // 默认的宽展字段 默认为 life
    lifeName: "life"
});
```

```javascript
// vue中，实际触发
{
    life: {
        user (user) {
            // 这个生命周期将在 emit("user", {account: "account"}) 和 created 之后来触发生命周期（hooks配置）
            // user 内容为 {account: "account"}
        },
        ready (info) {
            // 这个生命周期将在 emit("ready", "app is ready") 和 mounted 之后来触发生命周期（hookDef配置）
            // user 内容为 "app is ready"
        }
    }
}

```

## 获取安装

> npm install vue-life

## 源代码

```javascript
// vue中，实际触发
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
    global.vueLife = factory();
})(window, function() {
    "use strict";

    // vue中$options中的参数
    var name = "life";
    // 设置同内置生命周期函数绑定
    var hooks = {};

    // 自定义生命周期函数集合
    var hookLifes = [];
    // 触发生命周期数据
    var hookEmitData = {};

    // 触发
    function _hookExec(key, that, data) {
        var lifes = that.$options[name] || [];
        // console.log("lifes", lifes)
        var lifeFn;
        for (var i = 0; i < lifes.length; i += 1) {
            // debugger;
            // console.log(lifes[i])
            lifeFn = lifes[i][key];
            if (lifeFn) {
                lifeFn.call(that, data.data);
            }
        }
    }
    function hookExec(key, that) {
        let data = hookEmitData[key];
        // console.log("1", key, hookEmitData, that, data)
        if (!data) {
            return;
        }
        // console.log("2", key, hookEmitData, that)
        if (that) {
            _hookExec(key, that, data);
            return;
        }
        // console.log("3", key, hookEmitData, that)
        for (var i = 0; i < hookLifes.length; i += 1) {
            _hookExec(key, hookLifes[i], data);
        }
    }

    function hookEmit(key, data) {
        hookEmitData[key] = {
            data: data
        };
        hookExec(key);
    }

    // Vue注册插件方法
    function install(vue, init) {
        // 初始化函数
        if (typeof init == "function") {
            init = {
                init: init
            };
        }
        var initFn = init.init;
        // 设定在什么钩子函数中出发
        var hookDef = init.hookDef || "mounted";
        if (init.hooks) {
            hooks = init.hooks;
        }

        // life 名称
        if (init.lifeName) {
            name = init.lifeName;
        }

        function hookExecByVM(that, lifeName) {
            setTimeout(function() {
                var keyOpt = {};
                for (var n in hooks) {
                    if (hooks[n] == lifeName) {
                        keyOpt[n] = true;
                    }
                }
                var isDefHook = lifeName == hookDef;
                var lifes = that.$options[name] || [];
                var life, k, data;
                for (var i = 0; i < lifes.length; i += 1) {
                    life = lifes[i];
                    for (k in life) {
                        data = hookEmitData[k];
                        if (data && (keyOpt[k] || isDefHook)) {
                            life[k].call(that, data.data);
                        }
                    }
                }
            }, 0);
        }

        function hooksFn(key) {
            return function() {
                var life = this.$options[name];
                if (life) {
                    hookExecByVM(this, key);
                }
            };
        }
        var mixinOpt = {};
        for (var n in hooks) {
            if (!mixinOpt[hooks[n]]) {
                mixinOpt[hooks[n]] = hooksFn(hooks[n]);
            }
        }
        if (!mixinOpt[hookDef]) {
            mixinOpt[hookDef] = hooksFn(hookDef);
        }

        //
        var beforeCreateFn = mixinOpt.beforeCreate;
        mixinOpt.beforeCreate = function() {
            var life = this.$options[name];
            // console.log(">>>...", this.$options[name], name)
            if (life) {
                hookLifes.push(this);
            }

            if (beforeCreateFn) {
                beforeCreateFn.call(this);
            }
        };

        // 销毁
        var destroyedFn = mixinOpt.destroyed;
        mixinOpt.destroyed = function() {
            if (destroyedFn) {
                destroyedFn.call(this);
            }

            var life = this.$options[name];
            if (life) {
                for (var i = 0; i < hookLifes.length; i += 1) {
                    if (this == hookLifes[i]) {
                        hookLifes.splice(i, 1);
                        break;
                    }
                }
            }
        };

        // 全局混入vue
        vue.mixin(mixinOpt);
        // console.log("mixinOpt", mixinOpt)
        // 使得能在 this.$options获取life属性的obj
        vue.config.optionMergeStrategies[name] = function(pVal, nVal) {
            var val = pVal instanceof Array ? pVal : pVal ? [pVal] : [];
            if (nVal) {
                val.push(nVal);
            }
            // console.log(val)
            return val;
        };

        if (initFn) {
            initFn({
                emit: hookEmit,
                vue: vue
            });
        }
    }

    return {
        default: install,
        install: install
    };
});
```
