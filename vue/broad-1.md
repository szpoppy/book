# 组件通讯

## props父组件向子组件传参  
[官方文档](https://cn.vuejs.org/v2/guide/components.html#通过-Prop-向子组件传递数据)

## vm.$on、vm.$once、vm.$off、vm.$emit通过事件触发来传递参数  
[官方文档](https://cn.vuejs.org/v2/api/#实例方法-事件)

## vm.$parent、vm.$root、vm.$children、vm.$refs 通过组件之间的相互引用关系来通讯  
[官方文档](https://cn.vuejs.org/v2/api/?#vm-parent)

> 以上官方通讯方案都需要通过组件之间的关系来维护通讯链路。这样会造成组件之间通讯的耦合，增加了模块化开发的难度。 
  

## 组件通讯 - EventBus  

[官方文档](https://github.com/krasimir/EventBus)  

> 通过事件总线进行组件之间通讯  

````javascript
import EventBus from 'eventbusjs'
// vue2 代码
{
    created() {
        // 注册事件
        EventBus.addEventListener("method1", this.method1, this)
    },
    methods: {
        method1 () {
            console.log("method1 console log")
        }
    },
    destroyed () {
        // 必须销毁注册的事件，无法自动销毁，无形中埋雷了
        EventBus.removeEventListener("method1", this.method1, this)
    }
}

// 其他JS或者Vue中，触发事件
EventBus.dispatch("method1")
````

## 组件通讯 - vue-unicom

[官方文档](https://github.com/szpoppy/vue-unicom)  
[使用demo](https://github.com/szpoppy/vue-unicom-demo)

- 任意相对独立的JS之间的通讯（包括Vue组件以及JS）；
- 订阅需要初始化客户端，并且有自身的生命周期；
- 当在Vue组件内，unicom会自动注册和销毁，并和Vue生命周期融合；
- 全局监控支持（当监控到某个组件初始化后，会自动触发回调）。

> Vue插件注册  

````javascript
import Vue from 'vue'
import VueUnicom from 'vue-unicom'
// 非 cli 也必须 install一下
Vue.use(VueUnicom, {
    // 制定名称， 默认为 unicom
    unicom: 'unicom'，
    // 定制分组使用名称 默认为 unicom + 'Name'
    unicomName: 'unicomName',
    // 定制id使用名称 默认为 unicom + 'Id'
    unicomId: 'unicomId',
    // 定制vue中，发布emit方法， this['$' + unicomEmit] 默认为 unicom参数
    unicomEmit: 'unicom',
    // 定制 Vue中，全局访问的类名 默认为  unicom 参数，并将第一个字母大写
    unicomClass: 'Unicom'
})
````

> Vue组件内部使用  

````javascript
{
    // 将这个组件归到group分组， 多个分组请使用字符串数组
    unicomName: 'group',
    // unicom 是组件内部订阅消息设置的
    unicom: {
        // 订阅消息 为 instruct
        instruct (event) {
            // event 参数参照上面《JS中使用》中的on方法回调参数
        }
    },
    method: {
        doExec () {
            // 发布订阅消息
            // instruct 本组件如果订阅，也能收到
            this.$unicom("instruct", arg1, arg2, ...)

            // 获取被命名为 id的组件引用
            // that 为unicom实例，that.target 为Vue的实例
            let that = this.$unicom("#id")

            // 获取分组为 group 的所有vue
            let thats = this.$unicom("@group")

            // 原始 unicom 对象的指向，不介意直接操作
            this._unicom_data_.self
        }
    }
}
````

> Vue组件实例化传参  

````html
<!-- 加入group分组 并且 将本组件命名为 id -->
<component unicom-name="group" unicom-id="id"></component>
<!-- 加入多个分组，请传入数组 -->
<component :unicom-name="['group1', 'group2']"></component>
````

