---
layout: default
title: 网络报文抓取破解的方法
author: lijiaocn
createdate: 2018/02/05 22:07:28
changedate: 2018/02/06 01:01:48
categories: 技巧
tags: security
keywords: 加密报文破解,Charles
description: 有时候需要分析一些通讯协议，这些工具特别有用。

---

* auto-gen TOC:
{:toc}

## 说明

有时候需要分析一些通讯协议。

## charles proxy

到[charlesproxy][1]下载安装包，支持windows、macOS、linux。

charles是一款收费软件，需要License，破解方法是有的。

	Registered Name:https://zhile.io
	License Key: 48891cf209c6d32bf4

charles启动时自动启动http代理服务，默认地址如下：

	http代理：  127.0.0.1:8888

可以在proxy->proxy setting中修改代理服务器地址，以及开启socks代理。

勾选proxy->windows proxy后，会将其设置为系统代理。（windows版本）

### 抓取网页

勾选了proxy->windows proxy，或者将浏览器的代理设置为charles之后，点击工具栏中的`start recording`按钮，即开始记录有charles代理的访问。

工具栏中的`start throttling`用于减慢请求速度。

抓取到内容在左侧以structure和sequence两种格式显示。

	structure:  将http请求按照域名分组
	sequence:   将http请求按照时间排列

### 截断请求

首先抓取得到一堆的请求，然后在想要截断的请求上点击右键，选中"Breakpoints"。

在工具栏中点击`Enable Breakpoints`开始截断模式。

这时候重新发起请求，被设置了Breakpoints的请求，会被截断弹出，这时候你可以将请求数据或者响应数据重新编辑后，再将其放行。

### 解密https

charles可以自动生成证书，扮演中间人。

在`proxy->ssl proxying setting`中勾选"Enalble SSL Proxying"，添加需要通过https解密的目标域名。

然后访问目标域名时，charles会用自己证书替换服务端证书，从而将通信内容解密。

使用浏览器访问的时候，会提示目标网站证书不可信，可以添加例外。但是有一些网站采用HSTS(HTTP严格传输机制)，不能添加例外。

例如：

	此网站采用了 HTTP 严格传输安全（HSTS）机制，要求 Firefox 只能与其建立安全连接。正因如此，您也不能将此证书加入例外列表。
	
	目前无法访问 www.baidu.com，因为此网站使用了 HSTS。网络错误和攻击通常是暂时的，因此，此网页稍后可能会恢复正常。

需要到`Help->SSL Proxying->Save Charles Root Certificate`中将根证书导出，然后加入到浏览器的受信任根证书中。

### 移动设备捕获与解密

ios系统在设置->Wi-Fi，进入连接的网络中，手动设置代理。代理地址设置为charles的地址。

移动设置介入charles代理时,charles会弹出提示，选择允许。

然后点击`Help->SSL Proxying->Install Charles Root Certificate On a Mobile Device or Remote Brower`

按照弹出框中的提示，在移动端用浏览器打开网址：chls.pro/ssl。按照提示完成证书安装。

安装之后，还要到“通用->设置->关于本机->证书信任设置”中将安装的证书启用。

最后在`proxy->ssl proxying setting`中勾选"Enalble SSL Proxying"，添加需要被解密的域名。

在ios中手动设置的代理是http代理，可以用shadowsocks实现全局代理: [iOS通过Shadowsocks设备实现全局代理][4]

## 参考

1. [charlesproxy][1]
2. [程序员都应会的抓包工具][2]
3. [iOS开发之抓包工具Charles的安装配置及使用详解][3]
4. [iOS通过Shadowsocks设备实现全局代理][4]

[1]: https://www.charlesproxy.com/  "charlesproxy" 
[2]: https://github.com/xiyouMc/PythonGuide/wiki/%E7%A8%8B%E5%BA%8F%E5%91%98%E9%83%BD%E5%BA%94%E8%AF%A5%E4%BC%9A%E7%9A%84%E6%8A%93%E5%8C%85%E5%B7%A5%E5%85%B7-Charles  "程序员都应会的抓包工具" 
[3]: https://www.jianshu.com/p/31fea1314a50 "iOS开发之抓包工具Charles的安装配置及使用详解" 
[4]: https://www.maoshu.cc/3409.html "iOS通过Shadowsocks设备实现全局代理"
