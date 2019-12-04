# Vue 函数式编程探索

> [github 地址:https://github.com/szpoppy/vue-exec-fun](https://github.com/szpoppy/vue-exec-fun)

## 为什么需要函数式编程

-   组件中，模组一和模组二，相互纠缠，你中有我，我中你；
-   如果组件中模组增多，对开发人员是一种考验，尤其是在团队开发中。

```js
export default {
    components: {},
    props: {},
    data() {
        return {
            moduleData1: {},
            moduleData2: {}
        }
    },
    methods: {
        moduleMethod1() {},
        moduleMethod2() {}
    },
    filters: {},
    computed: {},
    mounted() {
        // 处理各个模块的的初始化
    }
}
```

-   以上 Vue 中的代码中，我们可以看到，划分规则是按照各个参数属性的唯独来划分；
-   如果一个组件的模组很多，就难以维护；
-   全部使用组件来划分模组，有时候有会觉得太重；

## Vue 函数式编程初步尝试

### 最简单的尝试

```js
let options = {}
let optData = {}
options.data = function() {
    return optData
}
// =============================== 模块一
optData.moduleData2 = {}
options.methods = {
    moduleMethod1() {}
}
options.computed = {
    moduleComputed1() {
        return this.moduleData1
    }
}
// =============================== 模块二
optData.moduleData2 = {}
options.methods.moduleMethod2 = function() {}
options.computed.moduleComputed2 = function() {
    return this.moduleData2
}

// 统一做初始化操作
options.mounted = function() {
    // .....
}

export default options
```

-   以上代码模组之间基本已经分开；
-   模组一和模组二的写法上还是有差异，这会导致开发这额外的工作开销；
-   代码已经变得冗余，而且不利于编译压缩。

### 进一步优化

```js
let options = {}
let optData = {}
options.data = function() {
    return optData
}

let methods = (options.methods = {})
let computed = (options.computed = {})
let mounted = []
// =============================== 模块一
optData.moduleData1 = {}
methods.moduleMethod1 = function() {}
computed.moduleComputed1 = function() {
    return this.moduleData1
}
mounted.push(function() {
    // 模块一初始化
})
// =============================== 模块二
optData.moduleData2 = {}
methods.moduleMethod2 = function() {}
computed.moduleComputed2 = function() {
    return this.moduleData2
}
mounted.push(function() {
    // 模块二初始化
})

if (mounted.length) {
    options.mounted = function() {
        mounted.forEach(item => {
            item.apply(this)
        })
    }
}

export default options
```

-   模组一和模组二的写法已经完全一致；
-   同一类型的钩子函数完全可以分配到各个模块去执行；
-   头尾代码基本相似，可以通过整合封装来减少代码量。

### Vue 函数式编程 - 封装

### 封装的初步尝试

```js
function vueExecFun(fn) {
    let options = {}
    let optData = {}

    options.data = funciton(){
        return optData
    }

    function $data(data) {
        Object.assign(optData, data)
    }

    let methods = options.methods = {}
    function $methods(data) {
        Object.assign(methods, data)
    }

    let computed = options.computed = {}
    function $computed(data) {
        Object.assign(computed, data)
    }

    let mounted = []
    function $mounted(fn) {
        mounted.push(fn)
    }

    // ...其他封装

    fn && fn({
        options,
        optData,
        $data,
        $methods,
        $computed,
        $mounted
    })

    if (mounted.length) {
        options.mounted = function() {
            mounted.forEach(fn => {
                fn.apply(this)
            })
        }
    }

    return options
}

export default vueExecFun(function({$data, $methods, $computed, $mounted}) {
    // =============================== 模块一
    $data({
        moduleData1: {}
    })
    $methods({
        moduleMethod1 () {}
    })
    $computed({
        moduleComputed1(){
            return this.moduleData1
        }
    })
    $mounted(function() {
        // 模块一初始化
    })
    // =============================== 模块二
    $data({
        moduleData2: {}
    })
    $methods({
        moduleMethod2 () {}
    })
    $computed({
        moduleComputed2(){
            return this.moduleData2
        }
    })
    $mounted(function() {
        // 模块二初始化
    })
})
```

-   模组一和模组二的写法已经完全一致；
-   vueExecFun 函数已经可以单独提炼作为公共服务包；
-   vueExecFun 按照 vue 的每个属性独立写的，而且$methods和$computed 功能类似，可以进一步封装。

### 封装高级进阶

> 以下代码相对较长，可以从 `let fnArg =` 处开始看起。

```js
let hasOwnProperty = Object.prototype.hasOwnProperty
let toString = Object.prototype.toString
let msgOpt = {
    before: "vue已经初始化，请在初始化之前调用",
    after: "vue还没初始化，请在created之后调用"
}
function warn(msg = "before") {
    console.warn(msgOpt[msg] || msg || "")
}
vueExecFun(function(initFn) {
    // 一些临时字段，unload会自动清理
    let temp = {}

    // 运行环境
    let vm

    let isInit = false

    // 安全获取数据
    function getSafe(key, opt) {
        if (opt === undefined) {
            opt = this
        }
        let arr = key.split(".")
        for (let i = 0; i < arr.length; i += 1) {
            opt = opt[arr[i]]
            if (opt == null) {
                break
            }
        }

        return opt
    }

    // 方法的this绑定 vm
    function $bind(fn, ...arg) {
        return function() {
            if (!vm) {
                warn("after")
                return
            }
            fn.apply(vm, arg.concat(arguments))
        }
    }

    // 代理
    function $vm() {
        return vm
    }

    // ================================对数据的封装
    let optData = {}
    function dataProperty(back, key) {
        // 返回的对象上，做一层代理，可以访问到vm的内部变量
        Object.defineProperty(back, key, {
            get() {
                let opt = vm || optData
                return opt[key]
            },
            set(val) {
                let opt = vm || optData
                // console.log("---------------", opt, key)
                opt[key] = val
            }
        })
    }
    // data封装
    function $data(key, val) {
        let opt = vm || optData
        if (typeof key == "string") {
            if (val === undefined) {
                return getSafe(key, opt)
            }
            key = { [key]: val }
        }

        let back = {}
        for (let n in key) {
            if (hasOwnProperty.call(key, n)) {
                opt[n] = key[n]
                // 对返回对象做一层代理
                dataProperty(back, n)
            }
        }
        return Object.freeze(back)
    }
    let options = {
        data() {
            // console.log("optData", optData)
            return optData
        }
    }

    function fnToBindVM({ value }) {
        if (typeof value == "function") {
            // 方法的this绑定 vm
            return $bind(value)
        }
        return value
    }

    // 属性设置
    function setter({
        // options 属性
        prot,
        // 返回数据的处理
        format,
        // 只读
        isFreeze,
        // 是否需要返回数据
        isBack = true
    }) {
        let opt = {}

        function setterOn(key, val) {
            if (isInit) {
                // isInit之后再调用，抛出警告
                warn()
                return
            }
            if (prot && !options[prot]) {
                // 第一次绑定，讲属性设置到options
                options[prot] = opt
            }
            let back = (isBack && {}) || null
            if (typeof key == "string") {
                // 字符串自动转obj
                key = { [key]: val }
            }
            for (let n in key) {
                if (hasOwnProperty.call(key, n)) {
                    opt[n] = key[n]
                    if (back) {
                        // 需要返回，需要处理返回值
                        if (format) {
                            // 返回对象属性通过format函数处理
                            let bkVal = format({ value: key[n], backData: back, key: n, opt })
                            if (bkVal !== undefined) {
                                // 如果format有返回值，直接设置到back的属性上
                                back[n] = bkVal
                            }
                        } else {
                            back[n] = val
                        }
                    }
                }
            }
            if (back && isFreeze) {
                // 设置不可以更改这个obj
                return Object.freeze(back)
            }
            return back
        }

        return {
            data: opt,
            on: setterOn
        }
    }

    // 简单的设置一些options的属性
    function setProt(prot, format) {
        return function(val) {
            if (isInit) {
                // isInit之后再调用，抛出警告
                warn()
                return
            }
            options[prot] = val
            return format ? format(val) : val
        }
    }

    // mixins 单独处理
    let mixins = []
    function mixin(...arg) {
        if (isInit) {
            warn()
            return
        }
        mixins.push(...arg)
    }

    // 生命周期函数统一处理方法
    function lifecycleExec(fns) {
        return function() {
            for (let i = 0; i < fns.length; i += 1) {
                fns[i].apply(this, arguments)
            }
        }
    }
    function makeLifecycle() {
        let lifecycles = {}

        let back = {
            // 通过on附件生命周期函数
            on(key, fn) {
                if (typeof key == "string") {
                    let lc = lifecycles[key]
                    if (!lc) {
                        lc = lifecycles[key] = []
                    }
                    lc.push(fn)
                    return
                }
                for (let n in key) {
                    back.on(n, key[n])
                }

                return back
            },
            // 最后将需要的生命周期函数绑定到options上
            make(opt) {
                if (typeof opt == "string") {
                    opt = options[opt]
                    if (!opt) {
                        opt = options[opt] = {}
                    }
                }
                for (let n in lifecycles) {
                    opt[n] = lifecycleExec(lifecycles[n])
                }
                return opt
            },
            // 出发每个附加的生命周期函数
            emit(type, ...args) {
                let fns = lifecycles[type] || []
                for (let i = 0; i < fns.length; i += 1) {
                    fns[i].apply(vm, args)
                }
            },
            // on的快捷方式
            currying(key) {
                return fn => back.on(key, fn)
            },
            // 判断是否存在钩子函数
            has() {
                for (let n in lifecycles) {
                    return true
                }
                return false
            }
        }

        return back
    }

    // 对常用的一些原型方法建立快捷方式
    let quickNextArr = []
    function quickVueNext(key) {
        return function() {
            if (!vm) {
                // 还没vm，无发调用，暂存
                quickNextArr.push({
                    key: key,
                    args: arguments
                })
                return
            }
            // 直接调用
            return vm[key](...arguments)
        }
    }

    // 原生一些钩子函数
    let lifecycle = makeLifecycle()
    lifecycle.on("beforeCreate", function() {
        // 复制vm
        vm = this

        // 暂存一些快捷方法
        while (quickNextArr.length) {
            let toDo = quickNextArr.shift()
            vm[toDo.key](...toDo.args)
        }
    })

    // 注入created，此时的this和beforeCreate的this还是有一些细微的差异
    lifecycle.on("created", function() {
        vm = this
    })

    // 注入组件销毁
    lifecycle.on("destroyed", function() {
        vm = null
        isInit = false

        // 自动清理临时字段中数据
        for (let n in temp) {
            if (n.indexOf("$handleT$") == 0) {
                // 清理 setTimeout
                clearTimeout(temp[n])
            }
            if (n.indexOf("$handleI$") == 0) {
                // 清理 setInterval
                clearInterval(temp[n])
            }
            temp[n] = undefined
            delete temp[n]
        }
    })

    // 部分方法执行，需要区分isInit前后
    function initOrLatter(fn1, fn2) {
        return function() {
            isInit ? fn2(...arguments) : fn1(...arguments)
        }
    }

    // emit快捷方式
    let $emit = quickVueNext("$emit")

    // initFn的参数
    let fnArg = {
        // 临时数据
        temp,
        // 参数
        options,
        // 数据
        data: optData,
        // 获取vm
        $vm,
        // 讲方法的this绑定vm
        $bind,
        // name属性
        $name: setProt("name"),
        // 混合
        $mixin: mixin,
        // 子组件，不需要返回
        $components: setter({
            prot: "components",
            sBack: false
        }).on,
        // 自定义指令，不需要返回
        $directives: setter({
            prot: "directives",
            isBack: false
        }).on,

        // 组件入参
        $props: setter({
            prot: "props",
            isFreeze: true,
            // 格式化
            // 通过 setFn 参数，可以对入参赋值
            format({ backData, key, value }) {
                let property = {
                    get() {
                        return vm ? vm[key] : null
                    }
                }
                let setFn = ""
                if (toString.call(value).toLowerCase() == "[object object]") {
                    setFn = value.setFn
                    if (setFn) {
                        if (typeof setFn != "function") {
                            property.set = function(val) {
                                $emit(setFn, val)
                            }
                        } else {
                            property.set = setFn
                        }
                    }
                    delete value.setFn
                }
                Object.defineProperty(backData, key, property)
            }
        }).on,
        // 组件数据函数
        $data,
        // 计算属性函数
        $computed: setter({
            prot: "computed",
            isFreeze: true,
            // 返回数据格式化
            // 可以通过 $computed 的返回值来读取和设置 计算值
            format({ backData, key }) {
                Object.defineProperty(backData, key, {
                    get() {
                        return vm ? vm[key] : null
                    },
                    set(val) {
                        if (vm) {
                            vm[key] = val
                        }
                    }
                })
            }
        }).on,
        // 筛选过滤器
        $filters: setter({
            prot: "filters",
            isFreeze: true,
            format: fnToBindVM
        }).on,
        // 同 model
        $model: setter({
            prot: "model",
            isBack: false
        }).on,
        // 监控
        $watch: initOrLatter(
            // isInit 之前通过 setter
            setter({
                prot: "watch",
                isBack: false
            }).on,
            // isInit 之后，通过 vm.$watch
            quickVueNext("$watch")
        ),
        // 方法
        $methods: setter({
            prot: "methods",
            isFreeze: true,
            // 返回的值可以直接调用，并且保证this指向vm
            format: fnToBindVM
        }).on,

        // 加入其他的钩子函数方法
        $lifecycle: lifecycle.on,
        // 快捷方法 created、mounted、destroyed
        $created: lifecycle.currying("created"),
        $mounted: lifecycle.currying("mounted"),
        $destroyed: lifecycle.currying("destroyed"),

        // 快捷方法
        $emit,
        $nextTick: quickVueNext("$nextTick")
    }

    initFn && initFn(fnArg)

    lifecycle.make(options)

    if (mixins.length) {
        options.mixins = mixins
    }

    isInit = true
    return options
})

export default vueExecFun(function({ $data, $methods, $computed, $mounted, $vm }) {
    // =============================== 模块一
    let m1Data = $data({
        moduleData1: {}
    })
    let m1Methods = $methods({
        moduleMethod1() {}
    })
    let m1Computed = $computed({
        moduleComputed1() {
            return m1Data.moduleData1
        }
    })
    $mounted(function() {
        // 模块一初始化
    })
    // =============================== 模块二
    let m2Data = $data({
        moduleData2: {}
    })
    let m2Methods = $methods({
        moduleMethod2() {}
    })
    let m2Computed = $computed({
        moduleComputed2() {
            return m2Data.moduleData2
        }
    })
    $mounted(function() {
        // 模块二初始化
        // 下面是恒等式
        this === $vm()
    })
})
```

-   模组一和模组二的写法已经完全一致；
-   部分属性，可以通过调用函数返回值的属性来访问，极大的方便了开发；
-   内部书写代码，可以杜绝绝大部分的 this；
-   options 只生成设置的属性；
-   对于插件，可以通过$vm().$route 来访问；
-   如果需要进一步提高开发人员效率，需要对一些 Vue 插件做封装；
-   所以我们对函数式编程进行了插件化开发支持，请看下面代码。

## 封装 - 插件化

```js
let hasOwnProperty = Object.prototype.hasOwnProperty
let toString = Object.prototype.toString
// 插件模式
// eslint-disable-next-line
let Vue
// 插件化函数
let pluginArr = []
// 插件注册
export function vueFunOn(initFn) {
    pluginArr.push(initFn)
}

// 通过vue install的方式注册
export function vueFunInstall(vue, initFn) {
    Vue = vue
    if (initFn) {
        pluginArr.push(initFn)
    }
}

// 重复代码略过...

function vueFun(initFn) {
    // 重复代码略过... 直到定义 fnArg之后

    // initFn执行完之后执行的
    let afterArr = []
    // 运行注册的插件
    pluginArr.forEach(function(pluginFn) {
        pluginFn({
            Vue,
            // temp
            temp,
            // 参数
            options,
            // 数据
            data: optData,
            $vm,
            $bind,
            // 延后执行的函数
            after: function(afterFn) {
                afterArr.push(afterFn)
            },
            // 传入 initFn的参数集
            fnArg,
            // 生命周期钩子函数
            lifecycle,
            // 定义生命周期的基础函数
            makeLifecycle,
            // 自定义属性 setter
            setter,
            // setter 中format函数
            fnToBindVM,
            // 定义快捷方法
            quickVueNext,
            // 定义简单属性
            setProt
        })
    })

    // 初始化组件
    initFn && initFn(fnArg)

    // 延后执行的函数
    afterArr.forEach(function(afterFn) {
        afterFn()
    })

    // 重复代码略过...

    return options
}

vueFun.on = vueFunOn
vueFun.install = vueFunInstall

export default vueFun
```

**书写 vue-exec-fun 插件**

```js
import vueExecFun from "vue-exec-fun"
// 插件通过 vueExecFun.on 或者 vueExecFun.install 注册
Vue.use(vueExecFun.install, function({ fnArg, setter, makeLifecycle, after, fnToBindVM, quickVueNext, options }) {
    // 初始化自定义的生命周期函数
    // 通过 vue-life 定义的
    // 目的是 设置 options.life 属性
    let life = makeLifecycle()

    // 对vue-unicom插件做封装
    // 目的是 设置 options.unicom 属性
    let unicom = setter({
        prot: "unicom",
        isFreeze: true,
        format: fnToBindVM
    })
    function $unicom() {
        return unicom.on(...arguments)
    }
    Object.assign($unicom, unicom)
    // $unicom.send 相当于调用 this.$unicom
    $unicom.send = quickVueNext("$unicom")

    // 目的是 设置 options.unicomId 属性
    Object.defineProperty(unicom, "id", {
        set(val) {
            options.unicomId = val
        },
        get() {
            return options.unicomId
        }
    })
    // 目的是 设置 options.unicomName 属性
    Object.defineProperty(unicom, "name", {
        set(val) {
            options.unicomName = val
        },
        get() {
            return options.unicomName
        }
    })

    Object.assign(fnArg, {
        // unicom 插件函数化
        $unicom: Object.freeze($unicom),

        // vue-life 生命周期钩子函数附加函数
        $life: life.on,
        // before ready 为 vue-life 的快捷的钩子函数
        $before: life.currying("before"),
        $ready: life.currying("ready")
    })

    after(function() {
        if (life.has()) {
            // 如果设置了 life 钩子函数，将钩子函数绑定到options
            life.make("life")
        }

        // console.log("options", options)
    })
})
```

-   通过插件函数，可以增加对 fnArg 属性的增加，丰富函数库；
-   以下代码，就是通过注册插件后，生成的特定的函数。

```js
export default vueExecFun(function({ $unicom, $before }) {
    $unicom({
        // 注册通讯渠道
        channel_msg({ data }) {}
    })

    $before(function({ then }) {
        then(function() {
            // ...
        })
    })

    // 调用这个函数，将在 beforeCreated 钩子函数中出发发出通讯函数
    $unicom.send("channel_msg", "channel_msg_data")
})
```
