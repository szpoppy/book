# fetch API

具体 API 请查看 [官方文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API/Using_Fetch)

## fetch 和 XMLHttpRequest 常用功能对比  

| 内容        | fetch                                | XMLHttpRequest                    |
| ----------- | ------------------------------------ | --------------------------------- |
| 创建方式    | 函数 window.fetch(options)           | 对象 new XMLHttpRequest()         |
| 同步&异步   | 不支持同步，天生异步（Promise）      | 支持同步&异步                     |
| 跨域        | 支持跨域，设置内容更多               | 支持跨域                          |
| cookie      | 支持                                 | 支持                              |
| 跨域 cookie | 支持设置                             | 支持设置                          |
| header      | 允许通过 new Headers()               | xhr.setRequestHeader(key, value)  |
| 请求体      | 允许通过 new Request()               | 通过 xhr 参数设置                 |
| 响应体      | 专门的 Response 实例，数据支持多样化 | 通过读取 xhr 的数据，数据支持单一 |
| 响应方式    | Promise                              | 事件回调                          |
| 文件上传    | 支持，但是不支持上传进度             | 完全支持                          |
