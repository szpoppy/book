# local-store-h5

> 扩展本地存储 localStorage

## 特点

-   支持设置过期时间
-   支持 sessionStorage 特性
-   在浏览器无法使用本地存储时（部分无痕模式），主动降级，将数据存入内存

## 安装

> npm i local-store-h5 --save

## 使用

```javascript
import store from "local-store-h5";

// 获取设置的本地数据
store.getItem("the-key");

// 设置本地存储 默认进程
store.getItem("the-key", "value");

// 设置本地存储 无过期
store.getItem("the-key", "value", -1);

// 设置本地存储 一天后过期
store.getItem("the-key", "value", 1);

// 设置本地存储 2200-10-1日过期
store.getItem("the-key", "value", "2200-10-1");

// 移除
store.removeItem("the-key");

// 更改默认的前置字符串 默认为 :
// 为了原本的本地存储区分，建议将前缀加上
store.prepreposition = "$";
```
