---
layout: default
title: "读书笔记: 《现代前端技术解析》 2017.4出版 "
author: 李佶澳
createdate: "2019-06-03T22:28:44+0800"
last_modified_at: "2019-06-13T00:03:02+0800"
categories: 方法
tags: 前端
cover:
keywords: 前端开发,html,css,javascript,前端组件开发,ECMAScript
description: "一句话总结：掌握结构层 HTML、表现层 CSS、行为层 JavaScript 的最新标准，使用组件化开发"
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

张成文.《现代前端技术解析》，2017年4月份出版，需要电子版的加微信 **lijiaocn**。

一句话总结：掌握结构层 HTML、表现层 CSS、行为层 JavaScript 的最新标准，使用组件化开发。

## 第1章 Web前端技术基础

### HTML DOM

HTML DOM （Document Object Model），文档对象模型，浏览器将HTML文件解析后生成的树形对象。JS 可以直接读取操作 DOM 中的元素：

```js
/* 直接操作 */
document.getElementById('text').innerHTML='这是一段文本';

/* jQuery 操作 */
$('#text').html('这是一段文本');

张成文. 现代前端技术解析 (Kindle Location 363). 
```

### 页面代码模块化、组件化

将页面代码进行拆分，HTML 5 支持 Web Component，可以注册新的标签（自定义标签）。

```
<linkhref="./ximage.html"rel="import">

<ximagewidth="300"height="200"></ximage>

张成文. 现代前端技术解析 (Kindle Locations 417-418). 
```

### 提高页面加载速度

图片使用webp格式。

浏览器端缓存。

### JS相关组件

Koa，Node.js端Web框架。

### JavaScript 标准

ECMAScript 6 -> ECMAScript 6 + > ECMAScript 7。

### 浏览器内核

主流浏览器内核：

Trident 内核：Internet Explorer、360 浏览器、搜狗浏览器。

Gecko 内核：Netscape 6 及以上版本、Firefox、SeaMonkey。

Presto 内核：Opera 7 及以上。

Webkit 内核：Safari、Chrome 。

Blink 内核：Webkit内核的分支，较多的移动端浏览器逐渐采用 Blink。

### 浏览器渲染引擎

渲染引擎用于解析 HTML 和 CSS，然后将 CSS 规则应用到 HTML 标签元素上。

渲染过程：解析 HTML 构建 DOM 树、构建渲染树（带有样式描述的 DOM 树）、渲染树布局（位置属性生效）、绘制渲染树（背景颜色等属性生效）。

页面生成后，如果页面元素位置发生了变化，要从布局阶段开始重新渲染，即**页面重排**，页面重排代价大，要尽量避免。

渲染引擎对渲染树的解析和输出是逐行进行的，尽量不要在 HTML 显示内容中插入 script 脚本等，会阻塞页面结构的渲染。

不同的浏览器内核，渲染过程有所不同。

### CSS 规则权重

! important > 内联样式规则 > id 选择器 > 类选择器 > 元素选择器。

### 浏览器数据持久化

HTTP 文件缓存、LocalStorage、SessionStorage、indexDB、Web SQL、Cookie、CacheStorage、Application Cache、Flash。

目前可以在项目中配置应用到只有：HTTP 缓存、LocalStorage 和 Cookie，ServiceWorker 在将来可能被使用，但目前兼容性欠缺（2019-06-07 17:03:39）。

#### HTTP 文件缓存

页面中的 Cache-Control 设置相对过期时间，Expires 设置绝对过期时间。

如果上次请求的页面中有 Etag，浏览器想服务端发送 If-None-Match 请求，如果页面没有变化，服务端范围 304，否则返回 200。

如果上次请求的页面中有 Last-Modified 信息，连同 If-None-Match 一起发送到服务器，如果 Last-Modified 未失效返回304，否则范围 200。

![浏览器缓存]({{ site.imglocal }}/article/brower-cache.png)

```html
<metahttpequiv="Expires"content="Mon,20Jul201623:00:00GMT"/>
<metahttpequiv="CacheControl"content="maxage=7200"/>

张成文. 现代前端技术解析 (Kindle Locations 605-606). 
```

#### LocalStorage

LocalStorage 是 HTML5 的本地缓存方案，用于在浏览器端保存体积较大的数据，不同的浏览器中能保存的数据长度是不同的。

```js
//localStorage核心API:
localStorage.setItem(key,value)    //设置localStorage存储记录
localStorage.getItem(key)          //获取localStorage存储记录
localStorage.removeItem(key)       //删除该域名下单条localStorage存储记录
localStorage.clear()               //删除该域名下所有localStorage

张成文. 现代前端技术解析 (Kindle Locations 611-613).
```

![浏览器localstorage存储]({{ site.imglocal }}/article/brower-localstorage.png)

#### SessionStorage

SessionStorage 和 LocalStorage 类似，但是在浏览器关闭时会自动清空，不能持久化存储，实际使用较少。

#### Cookie

一条 Cookie 记录由键、值、域、过期时间和大小组成，不同浏览器支持的 Cookie 长度不同。

![不同浏览器的 cookie 最大长度]({{ site.imglocal }}/article/cookie-length.png)

不设置过期时间的 Cookie 的有效期是浏览器会话期间，关闭浏览器，即消失，是 Session Cookie，一般保留在内存中。

设置有过期的时间的持久性 Cookie 被浏览器保存在硬盘上，再次打开浏览器时有效，直到过期。

设置了 `HttpOnly` 的 Cookie，用 document.cookie 读取不到，只能通过 HTTP 请求头发送到服务器端。

#### WebSQL

WebSQL 用于在浏览器端存储较大量的数据，只有较新版本的 Chrome 浏览器支持（2019-06-07 16:45:50）：

1. WebSQL 在 HTML5 之前就已经存在，只特定的浏览器特性，有单独的规范；
2. WebSQL 将数据以二维表的方式存储，用 js 读取；
3. WebSQL 允许 SQL 语句查询。

```js
//openDatabase()方法可以打开已经存在的数据库，不存在则创建
letdb=openDatabase('mydatabase','1.0','testtable',2*1024*1024);

letname=[2,'ouven'];

db.transaction(function(table){table.executeSql('CREATETABLEIFNOTEXISTSt1(idunique,msg)');
    table.executeSql('INSERTINTOt1(id,msg)VALUES(1,"hello")');
    table.executeSql('INSERTINTOt1(id,msg)VALUES(?,?)',name);
});

transaction();    //transaction()这个方法允许我们根据情况控制执行事务提交或回滚
executeSql();     //executeSql()用于执行真实的SQL查询语句

张成文. 现代前端技术解析 (Kindle Locations 689-693). 
```

#### IndexDB

WebSQL 不是 HTML5 规范，一般推荐使用 IndexDB 进行大量数据存储，IndexDB 基本实现和 WebSQL 类似，只是 API 规范不同，使用的是 NoSQL。

#### Application Cache

通过 mainifest 配置文件在本地有选择地存储 JavaScript、CSS、图片等静态资源，实现离线访问。

Application Cache 是一个不成熟的缓存方案，已经开始被标准弃用，逐渐被 ServiceWorker 代替。

#### CacheStorage

CacheStorage 是 ServiceWorker 规范中定义的，是可能代替 Application Cache 的离线方案。

```js
caches.has();     //检查如果包含Cache对象，则返回一个promise对象
caches.open();    //打开一个Cache对象，并返回一个promise对象
caches.delete();  //删除Cache对象，成功则返回一个promise对象，否则返回false
caches.keys();    //含有keys中字符串的任意一个，则返回一个promise对象
caches.match();   //匹配key中含有该字符串的cache对象，返回一个promise对象

张成文. 现代前端技术解析 (Kindle Locations 752-755). 
```

ServiceWorker 在浏览器后台作为一个独立的线程运行 JavaScript，通过 message/postMessage 方法在页面之间通信，但是不能与前端界面进行交互，可以实现类似消息推送、离线使用、自动更新等功能。

#### Flash 缓存

基于网页端 Flash，具有读写浏览器端本地目录的功能。

### 前端常用工具

#### 开发工具

![前端常用开发工具]({{ site.imglocal }}/article/qianduan-ide.png)

#### 调试工具

Chrome、Firefox 浏览器的调试功能。

设备模拟：在不同终端中的显示效果；

Elements：阅读 DOM 结构 和 DOM 样式；

Console：控制台输出和执行 JS ；

Sources：网页加载的所有静态目录资源；

NetWork：页面加载的网络请求；

TimeLine：浏览器执行性能和内存消耗的时序图；

Profiles：测试网页性能消耗的方式；

Application: 浏览器缓存；

Security：网站安全证书；

Audits：优化建议。

Chrome 提供了比较多的扩展功能，打开 chrome://chrome-urls/ 查看。

#### 辅助工具

Fiddler：请求拦截、改写、发送。

node-inspector：node 调试工具。

Vorlon.js、Weinre：用于移动端的浏览器远程调试工具。

## 第2章 前端与协议

HTTP 协议先后经历 0.9、1.0、1.1 和 2 四个版本，目前最广泛使用的是 HTTP 1.1，发布于 1999 年。

![HTTP请求透和响应头]({{ site.imglocal }}/article/qianduan-1-http-procol.png)

### HTTP 1.1

#### 长连接

长连接用 `Conneciton: keep-alive` 控制。

HTTP 1.0 默认响应没有 keep-alive，可以在 HTTP 1.0 的请求消息中包含 Connection: keep-alive，如果服务器先用中也包含 keep-alive，那么连接可以复用。

HTTP 1.1 所有的请求都含有 keep-alive。

#### 协议扩展切换

HTTP 1.1 支持在请求头中包含 Upgrade，让服务端根据客户端的指令切换到其它协议，并用切换后的协议与客户端通信，譬如切换到 WebSocket 协议。

![WebSocket通信建立过程]({{ site.imglocal }}/article/qianduan-2-websocket.png)

#### 缓存控制

HTTP 1.1 之前，用 Expires 头实现缓存控制，HTTP 1.1 增加了 Cache-Control，可以设置相对过期时间，支持 Etag 和 Last-Modified，向服务端发起缓存有效性验证。

第1章中已经讲过：[HTTP 文件缓存](https://www.lijiaocn.com/%E6%96%B9%E6%B3%95/2019/06/03/xian-dai-qian-duan-notes.html#http-%E6%96%87%E4%BB%B6%E7%BC%93%E5%AD%98)

#### 部分内容传输优化

HTTP 1.1 支持请求目标文件的部分内容，用文件起始位置和偏移长度指定要传输的内容。

字段比较多，不摘录了，见 [Hypertext Transfer Protocol -- HTTP/1.1](https://datatracker.ietf.org/doc/rfc2616/?include_text=1)。

### HTTP 2

HTTP 2 协议的前身是 Google 发起的基于 HTTP 的 SPDY 协议，支持多路复用、服务器推送、压缩了 HTTP 头部大小。
但是 SPDY 强制使用 SSL 传输协议，HTTP 网站无法直接使用，因此以 SPDY 2 协议为基础开发了 HTTP 2 协议。

1. HTTP 2 使用了专门设计的 HPACK 压缩算法，完全采用二进制格式传输数据，以帧（Frame）为单位，属于流式传输，不需要每次传输都携带头部信息；

2. HTTP 2 使用 TCP 多路复用，多个请求可以通过一个 TCP 连接并发完成，HTTP 1.1 的 PipeLine 是串行的，多个请求的响应可能被阻塞。（TCP 多路复用和 keep-alive 不通，TCP 多路复用是传输层共享同一个 TCP 连接，不同文件的帧可以同时传输， keep-alive 是应用层的，请求必须是串行的）；

3. HTTP 2 支持在服务端设置文件的传输优先级，比如优先传送 CSS 文件；

4. HTTP 2 支持服务端推送。

使用HTTP 2，浏览器至少需要是 EDAGE 13、Chrome 45、Safari 9.2。

### Web 安全机制

#### XSS 跨站脚本攻击

XSS（Cross Site Script）就是在页面里注入第三方的脚本获取关键信息，根据脚本注入方式分为`存储型 XSS`、`反射型 XSS` 和 `MXSS（DOM XSS）`。

存储型 XSS，就是提交包含或者能够拼凑成脚本的数据，页面在展示这些数据的时候除非脚本执行；

反射型 XSS，在网页的 URI 中注入能被浏览器解析的脚本；

MXSS，在 DOM 属性中注入脚本，DOM 渲染时执行。

防范方法是进行过滤、预处理、转义。

#### SQL 注入

SQL 注入是服务器端未进行验证，导致传入的 SQL 语句被执行。

防范方法是服务端进行 SQL 语句预处理。

#### CSRF 跨站请求

网站 B 的网页获取了用户的信息后，向网站 A 发起请求，操纵网站 A 中的用户数据。

![Web安全CSRF攻击原理]({{ site.imglocal }}/article/qianduan-3-csrf.png)

防范方法是使用加密 Token（session 级别）、服务端禁止跨站请求等。

#### DNS 劫持与 HTTP 劫持

DNS 劫持是劫持 DNS 请求，篡改域名对应的 IP，根源是 DNS 协议不安全。

HTTP 劫持是在网页中插入第三方数据，使用 https 协议可以大大增加 http 劫持难度。

#### 浏览器端安全控制

在响应头中添加一些的字段指导浏览器采用相应的安全措施。

X-XSS-Protection，开启浏览器 XSS防护，高版本的浏览器支持（2019-06-07 19:27:28）： 

```http
XXSSProtection:1;
mode=block 0 – 关闭对浏览器的xss防护；1 – 开启xss防护
mode=block 可以开启XSS防护并通知浏览器阻止而不是过滤用户注入的XSS脚本

张成文. 现代前端技术解析 (Kindle Locations 1234-1235). 
```

StrictTransportSecurity（STS），强制所有通信使用 HTTPS。

ContentSecurityPolicy（CSP），服务端定义的加载策略，浏览器只加载指定来源的内容。

AccessControlAllowOrigin，允许特定的王长访问服务端。

### 前端实时通信协议

现在前端浏览器实时通行的实现方式主要有：WebSocket、Poll、Long-poll 和 DDP。

#### WebSocket

通过 HTTP 1.1 的 Upgrade 将 HTTP 连接升级为 WebSocket 连接，浏览器端与服务端建立起类似 Socket 的通信。

![WebSocket的数据帧结构]({{ site.imglocal }}/article/qianduan-4-websocket-frame.png)

WebSocket 是以帧单位传输的，协议本身略微复杂，详情见 [RFC6455：The WebSocket Protocol](https://tools.ietf.org/html/rfc6455)。

IE 11 以下和 Android 4.4 以下的浏览器不支持 WebSocket。

#### Poll 和 Long-poll

浏览器不支持 WebSocket 协议时，只用轮询的方式实现近似实时通信的功能。

Poll 就是定时轮询，在没有新消息时也要轮询，比较消耗系统资源。

Long-poll 也是定时轮询，但是 Timeout 时间较长，等待响应的时间长，从而可以减少轮询次数，相比 Poll 节省了系统资源，实时性也更好。

扫网页二维码实现登陆，就是典型的 Long-poll 应用：

![二维码扫码登陆原理]({{ site.imglocal }}/article/qianduan-5-ercode-login.png)

#### DDP

DDP 是分布式数据协议，Distributed Data Protocol，是新型的客户端与服务器端的实时通信协议。

DDP 协议中，数据格式是 JSON，便于前端开发，客户端可以向服务器端发起远程服务调用、订阅服务端数据。

Meteor Web 框架的双向实时通信使用的就是 DDP，DDP 现在还存在兼容性问题，以后极有可能广泛使用。（2019-06-07 21:55:21）

### RESTful 

RESTful 约定比较简单，就是 HTTP 的五个操作：

![RESTful协议]({{ site.imglocal }}/article/qianduan-6-restful.png)

### Native 交互协议

Native 就是移动端的原生应用，在 Native APP 中嵌入 Web 页面的方式，能够带来很多开发上的便利，这类应用成为 Hybrid APP。

Hybrid APP 中 Web 页面如何与 Native 通信是一个关键问题，另外要注意Hybrid APP 中 Web 页面可以使用的资源远小于桌面浏览器。

#### Web 调用 Native 的Scheme 协议接口

Native APP 在系统中注册一个 Scheme 协议的 URI，在 Web 页面中调用这个 URI 实现与原生应用的交互。

![Shecme协议注册调用过程]({{ site.imglocal }}/article/qianduan-7-scheme-call.png)

#### Web 调用注入页面的 Native 对象

用 addJavascirptInterface 方法将 Native 对象注入到页面中，Web 页面中用 js 调用。

#### Native 调用 Web 中声明的方法

在 Web 页面中用 JS 在页面中声明方法，Native 用 loadUrl 或类似的方法调用。

另外 JSBridge 协议需要了解下。 

## 第3章 前端三层结构与应用

前端基本构成：结构层 HTML、表现层 CSS、行为层 JavaScript。

HTML 的标准演进：HTML 4 -> HTML 5。

CSS 的标准演进：CSS 2 -> CSS 3 -> CSS 4。

JavaScript 的标准演进：ECMAScript 6 -> ECMAScript 7。

HTML 用组件的方式管理结构，CSS 用 SASS 、postCSS、stylus等更抽象的语法编写，JavaScript 使用 ECMAScript 6+、TypeScript 等标准。

### HTML

HTML 4 是基于 SGML（Standard Generalized Markup Language）规范指定的，需要声明 DTD 定义，以能够用兼容的方式解析文档：

```html
<!DOCTYPE html PUBLIC"-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">

<!DOCTYPE HTML PUBLIC"-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">，
```

HTML 5 不是基于 SGML 的，不需要 DTD 定义：

```html
<!DOCTYPEhtml>
```

能够使用语法标签的，要尽量使用语法表，不要用 div 包打天下：

![HTML 5 部分语义化结构元素标签]({{ site.imglocal }}/article/qianduan-8-html-5-tag.png)

HTML 标签分为三类：

1. 行内元素：包括 a 、 b 、 span 、 img 、 input 、 button 、 select 、 strong 等标签元素，其默认宽度是由内容宽度决定的。
2. 块级元素：包括 div 、 ul 、 ol 、 li 、 dl 、 dt 、 dd 、 h1 、 h2 、 h3 、 h4 、 h5 、 h6 、 p 、 table 等标签元素，其默认宽度为父元素的100%。
3. 常见空元素：例如 br 、 hr 、 link 、 meta 、 area 、 base 、 col 、 command 、 embed 、 keygen 、 param 、 source 、 track 等不能显示内容甚至不会在页面中出现，但是对页面的解析有着其他重要作用的元素。

### AMP HTML

Google 推出页面技术，可以加快页面加载渲染速度。

### Shadow DOM

Shadow DOM 允许浏览器开发者封装自己的 HTML 标签、CSS 样式和特定的 JavaScript，也允许开发人员自定义一级标签，即 Web Component。

### CSS 

CSS 从样式统一一直到现在的预处理，有各种预处理工具，譬如 SASS、LESS等等，CSS3 和 CSS4定义很多特性。

### JavaScript

JavaScript 主线标准 ECMAScript 5 一直到 ECMAScript 7，各路大神们还发展了 js 的各种超级，譬如 CoffeeScript、TypeScript、JSX、HyperScript，这些超集都被转换成 js 运行。

如果精力有限，还是直接学习最原始的 ECMAScript 好了，不变应万变。

### 响应式实现

方法一，根据 User-agent 跳转到不同的页面。

方法二，同一套页面，根据 media query 实现不同的布局显示。

## 第4章 现代前端交互框架

### 直接 DOM 操作

DOM API 是最基础的 API：

![常见的 DOM API 举例]({{ site.imglocal }}/article/qianduan-9-dom-api.png)

jQuery 封装了基础 DOM API，提高了开发效率：

![常见的 jQuery API]({{ site.imglocal }}/article/qianduan-10-jquery-api.png)

### MVC 交互模式

将页面上与 DOM 相关的内容抽象成数据模型、视图、事件控制函数，形成 Model-View-Controller 的设计思路。

Model：请求的数据结果和数据对象；

View：DOM 的更新和修改；

Controller：跟具前端路由调用不同的 Model 给 View 渲染不同的数据内容。

![MVC模式组件结构示意图]({{ site.imglocal }}/article/qianduan-11-mvc.png)

### MVP 交互模式

Model-View-Presenter，Presenter 与 Controller 类似，区别是，用户进行的 DOM 修改操作是通过 View 上的行为触发，然后通知 Presenter 修改 Model 以及其它的 View（MVC 中 用户操作直接交由 Controller 控制 ）。

MVP 模式中， Presenter 和 View 是双向绑定的，各自的改变会触发对方的更改，MVC 中 Controller 和 View 是单向的。

![MVP模式组件结构示意图]({{ site.imglocal }}/article/qianduan-12-mvp.png)

### MVVM 交互模式

ViewModel 代替 Presenter，是自动化的 MVP 框架，用户操作都通过 ViewModel。

### Virtual DOM 交互

Virtual DOM 是描述 HTML DOM 结构的 JavaScript 对象，浏览器根据 Virtual DOM 确定最终 DOM 的结构，减少了对 DOM 的扫码和操作。

### Model-NativeView-*

Web 与移动端应用的结合，催生了 MNV* 模式，即用 JavaScript 调用原生控件，MNV* 模式完全抛弃了 DOM （移动设备的 WebView 中，DOM 操作效率较低）

## 第5章 前端项目与技术实践

### 开发规范

1. 结构层 HTML、表现层 CSS、行为层 JavaScript 三层分离；
2. 移动端适当内联，内联资源大小一般为 2KB 以内，（注意这个和 AMP 背道而驰， AMP 要求样式全部内联）；
3. 缩进 tab 或者 4 个空格；
4. HTML 文档使用 utf-8 编码，CSS 不需要显示定义编码，默认就是 utf-8；
5. 标签、属性都用小写字母；
6. 代码单行长度 120 或者 80；
7. 尽量写注释；

### HTML 规范

1. 使用 HTML 5 的标准文档类型  !DOCTYPE html，简洁，且向后兼容；
2. head 中定义 title、keyword、description；
3. 引用 CSS 或者 JavaScript 时，省略 type 属性，HTML5 有默认类型；
4. 全部用双引号包括属性值；
5. 省略非必要的属性值；
6. 尽量使用语义化标签，正确嵌套，不允许在 inline 元素中包含 block 元素；
7. 非自闭合的标签必须添加关闭标识；
8. 设置 img 的 alt 属性、label 的 for 属性；
9. 模块前后有注释；
10. block 元素另起一行，inline 元素适当换行；
11. 不使用被 HTML 5 废弃的无语义化标签；

### CSS 规范

1. CSS 类的命名规范，小写字母，用“-”间隔；
2. 0 值不需要单位；
3. url 引用资源不需要加引号，例如 url(sprites.png);
4. 颜色值尽量用小写并缩写到 3 位；
5. 属性按照先布局、后内容的顺序排列；
6. 兼容不同浏览器时，先写浏览器的私有属性、然后写标准属性；
7. 避免组合选择器，例如标签名+ ID、标签名 + Class，会降低解析速度，直接使用类；
8. 属性能合并写的合并写；
9. 使用 SASS 等预处理语法编写 CSS；

### ECMAScript 规范

ECMAScript 5：

1. 添加结束分号、空格、空行，便于阅读；
2. JavaScript 字符串最外层统一使用单引号；
3. 常量名全大写、标准变量驼峰式命名；
4. 对象属性名不加引号；
5. 块代码使用大括号包裹；
6. 使用 `===`、`!==` 代替 `==`、`!=`；
7. 不在条件语句后者循环语句中声明函数；
8. 使用 "typeof person === 'undefined'"，不建议 "name == undefined" ；
9. 不在内置对象的原型上添加方法。

ECMAScript 6：

1. 使用变量声明关键字；
2. 使用字符串模版进行字符串拼接；
3. 数组拷贝使用`...items`
4. 数组遍历使用 for...of ，不建议使用 forEach、map等；
5. 使用 ECMAScript 6 的类；
6. 模块导入尽量不用全局导入，import 和 export 不要写在一行；
7. 模块名和文件名相同，类名首字母大写；
8. 用 try...catch 包裹 yield，处理异常；
9. 使用 Promise，避免直接回调；
10. 迭代器性能差，避免使用；
11. 中文的正则匹配和计算消耗时间，容易出问题；
12. 合理使用 Generator，推荐使用 async/await；

### 组件/模块规范

前端开发模式已经进入组件化开发阶段。

有需要的时候再深入阅读。 

### 自动化构建

### 前端性能优化

#### 工具

Performance Timing，获取每个过程消耗的时间。

Profile 分析页面脚本运行时，系统内存和 CPU 资源占用情况。

页面 JavaScript 埋点计时。

资源加载时序图。

#### 桌面优化策略

1. 减少 HTTP 请求；
2. css 和 JavaScript 放到外部文件中；
3. 避免空的 href 和 src，空内容仍然会被加载，会阻塞其它进程；
4. 指定 Cache-Control 或 Expires；
5. 使用 Etag 和 Last-Modified；
6. 减少页面重定向，一次重定向，大概需要 600 毫秒；
7. 静态资源分域存放，增加并行下载数；
8. 使用 CDN;
9. 使用 CDN Combo 将多个文件打包成一个文件下载；
10. 使用可缓存的 AJAX；
11. GET 效率比 POST 高；
12. 减少 Cookie 大小，并进行隔离；
13. 敷哦小的favicon.ico，并缓存；
14. JavaScript 异步加载；
15. 避免在 css 中使用 @import，被 import 的文件之后在解析到时才会加载；
16. CSS 资源放在 HTML 顶部；
17. JavaScript 放在 HTML 底部；
18. 不要在 HTML 中缩放图片；
19. 减少 DOM 数量和层级；
20. table、ifram 是慢元素避免使用；
21. 避免运行耗时的 JavaScript；
22. CSS 表达式和 CSS 滤镜解析渲染慢，避免使用；

#### 移动端优化策略

1. 首屏数据提前获取；
2. 非首屏内容滚屏加载，保证首屏内容最小化；
3. 模块化资源并行加载；
4. 首屏页面渲染时必备的 CSS 和 JavaScript 内联到页面中，避免载入完成到展示中间的空白；
5. 在 meta 中设置 DNS 预解析， linkrel="dnsprefetch"href="//cdn.domain.com"；
6. 资源预先加载；
7. 页面内容在 1KB 以内，充分利用 TCP 的 MTU（1500B）。
8. 合理使用缓存；
9. 静态资源使用离线文件包；
10. 尝试 AMP HTML；
11. 图片压缩，合理使用 base64 内嵌图片（可以减少请求数），超过 2KB 的图片不推荐使用 base64 嵌入；
12. 使用高压缩比格式的图片，webp等；
13. 图片懒加载，imgdatasrc="//cdn.domain.com/path/photo.jpg"alt="懒加载图片"；
14. 使用 Media Query 或 srcset 根据不同屏幕加载不同大小的图片；
15. 使用 iconfont 代替图片图标，iconfont 体积较小，矢量结构不会失真；
16. 单张图片不建议超过 30KB，最好 10KB 以内；
17. 尽量使用速度最快的 id 选择器；
18. 合理缓存 DOM 对象，不要每次都从 DOM 树中查找；
19. 尽量使用事件代理，避免直接事件绑定；
20. 使用 touchstart 代替 click；
21. 避免 touchmove、scroll 连续事件处理，间隔 16ms 进行一次事件处理；
22. 避免使用 eval、with，使用 ECMAScript 6 的字符串模版；
23. 尽量使用 ECMAScript 6+ 的特性；
24. 使用 Viewport 固定屏幕渲染；
25. 避免重排重绘制；
26. 使用 CSS3 动画，并开启 GPU 加速；
27. 合理使用 Canvas、requestAnimationFrame 等搞笑的动画实现，避免使用 setTimeout、setInterval等方式处理连续动画；
28. 使用 SVG 代替图片实现动画，SVG 格式内容更小，SVG DOM 结构方便调整；
29. float 元素布局耗费性能，推荐使用固定布局或者 flex-box 弹性布局；
30. 过多的 font-size 声明会增加字体大小计算，没有必要；
31. 尝试使用 SPDY 和  HTTP2；
32. 使用后端数据渲染；
33. 使用 Native View 代替 DOM；

### 前端日志、性能分析上报

根据实际情况设置上报策略。

### 搜索引擎优化

见 [SEO 相关文章](https://www.lijiaocn.com/tags/all.html#SEO)。

## 第6章 前端跨栈技术

主要关注前后端同构技术，一套代码既可以实现前端加载渲染，也可以用后台直出渲染。

关注跨终端、资源离线和更新技术。
