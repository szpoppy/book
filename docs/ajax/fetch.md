# fetch API

具体 API 请查看 [官方文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API/Using_Fetch)

## fetch 和 XMLHttpRequest 常用功能对比

| 内容        | fetch                           | XMLHttpRequest                   |
| ----------- | ------------------------------- | -------------------------------- |
| 创建方式    | 函数 window.fetch(options)      | 对象 new XMLHttpRequest()        |
| 同步&异步   | 不支持同步，天生异步（Promise） | 支持同步&异步                    |
| 跨域        | 支持跨域，设置内容更多          | 支持跨域                         |
| cookie      | 支持                            | 支持                             |
| 跨域 cookie | 支持设置                        | 支持设置                         |
| header      | 允许通过 new Headers()          | xhr.setRequestHeader(key, value) |
| 请求体      | 允许通过 new Request()          | 通过 xhr 参数设置                |
| 响应方式    | Promise                         | 事件回调                         |
| 文件上传    | 支持，但是不支持上传进度        | 完全支持                         |
| 请求超时    | 不支持，需要自己实现            | 完全支持                         |

## fetch 和 XMLHttpRequest 中响应体数据类型支持

| fetch                                              | XMLHttpRequest                                                             |
| -------------------------------------------------- | -------------------------------------------------------------------------- |
| response.arrayBuffer()                             | xhr.responseType = 'arrayBuffer'                                           |
| response.blob()                                    | xhr.responseType = 'blob'                                                  |
| response.formData()                                | 不支持                                                                     |
| response.json()                                    | xhr.responseType = "json"，支持有限，建议使用 JSON.parse(xhr.responseText) |
| response.text()                                    | xhr.responseType = "text"                                                  |
| 不支持，可以通过 response.text()后，通过字符串转换 | xhr.responseType = "document"(xml)                                         |

## 一些兼容语法写法

```javascript
fetch('url', {
    // json数据发送到服务器
    body: JSON.stringify(data),
    // 缓存设置 其实post 本身就没有缓存
    // *default, no-cache, reload, force-cache, only-if-cached
    cache: 'no-cache',
    // cookie 传入后端方案
    // include（带入）, same-origin(同域名带入), omit(不带)
    // credentials: 'same-origin' 同xhr默认值相同， credentials: 'includd' 同设置 xhr.withCredentials = true 效果相同
    credentials: 'same-origin',
    // 头部信息，一般json数据传入，都会设置 'content-type': 'application/json'
    headers: {
      'content-type': 'application/json'
    },
    method: 'POST',
    // no-cors（不允许，只允许HEAD，GET或POST方法）, cors（使用跨域）, same-origin（只允许同域）
    // mode: 'cors' 同 xhr相同
    mode: 'cors'
  })
  .then(response => {
      // 获取json数据
      // 在 xhr 中，需要将text通过JSON.parse转换为json数据
      response.json()
  })
}
```
