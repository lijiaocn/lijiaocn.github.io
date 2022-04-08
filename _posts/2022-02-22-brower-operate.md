---
layout: default
title: "用代码操作浏览器的方法：Puppeteer/Chromedp/Selenium"
author: 李佶澳
date: "2022-02-22 19:41:52 +0800"
last_modified_at: "2022-04-08 12:07:19 +0800"
categories: 编程
cover:
tags:  spider 浏览器
keywords: Puppeteer,Chromedp,Selenium,CDP
description: 基于CDP协议的Puppeteer和Chromedp能操作Chrome浏览器，Selenium可以驱动大部分主流浏览器

---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

几种用代码操作浏览器的方法，基于 CDP 协议的 Puppeteer 和 Chromedp 只能操作 Chrome 系列的浏览器，Selenium 可以驱动大部分主流浏览器。


## Chrome DevTools Protocol （CDP协议）

[Chrome DevTools Protocol][7] 是 Chromium 提供的调试协议协议，可以通过该协议控制 Chrome 或 Chromium 浏览器。[Contributing to Chrome DevTools Protocol][9] 介绍了协议的整体轮廓。

CDP 协议中包含 `client`、`target`、`session`、`handler` 四个概念。
client 是要发起浏览器操作的客户端，target 是可以被操作的浏览器内实体（例如 page、service worker），client 和 target 建立链接后得到 session，session 上挂载有执行动作 handler。

CDP 将支持操作划分成 dom、debugger、network 等多个 domain，每个 domain 有命令、事件和定义组成，[Chrome DevTools Protocol][7] 左下脚边栏列出了 CDP 的所有 domain，譬如 [Target Domain][12]、[Page Domain][13]：

![CDP Domains]({{ site.article }}/cdp-domains.png)

### 启动 Chrome DevTools Server

在命令行执行 Chrome 命令，指定参数 --remote-debugging-port=0 时，chrome 开启一个 websocket 接口接收 CDP 指令： 

```sh
# 执行之前先把 chrome 浏览器关闭，关闭所有页面
$ /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome  --remote-debugging-port=0

DevTools listening on ws://127.0.0.1:60076/devtools/browser/6c6433c6-f7fe-417e-8716-4ee5cf633666
```

建立 websocket 链接后就可以发送 CDP 执行，javascript 示意代码如下：

```javascript
//获取支持的 Target ：
// Get list of all targets and find a "page" target.
const targetsResponse = await SEND(ws, {
  id: 1,
  method: 'Target.getTargets',
});

// 绑定 PageTarget，建立 Session：
const pageTarget = targetsResponse.result.targetInfos.find(info => info.type === 'page');
// Attach to the page target.
const sessionId = (await SEND(ws, {
  id: 2,
  method: 'Target.attachToTarget',
  params: {
    targetId: pageTarget.targetId,
    flatten: true,
  },
})).result.sessionId;


// 通过指定 SessionId 向绑定的 Target 发起操作：
// Navigate the page using the session.
await SEND(ws, {
  sessionId,
  id: 1, // Note that IDs are independent between sessions.
  method: 'Page.navigate',
  params: {
    url: 'https://pptr.dev',
  },
});
```

发出的指令需要有一个在 Session 内唯一的 ID。

### HTTP Endpoint

chrome 还提供了少量的 http 接口，指定非零端口，然后用另一个浏览器打开对应地址即可：

```sh
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome  --remote-debugging-port=9222
```

[HTTP Endpoints][11] 介绍了这些 http 接口的情况，注意这些 http 接口使用的不是 CDP 协议。

### 浏览器内查看 CDP 通信

在开发者工具的 Setting 面板中，勾选 Protocol monitor，即可查看 CDP 通信过程：

![open proto monitor]({{ site.article }}/proto-monitor.png)

## Puppeteer 操作 Chrome

[Puppeteer][10] 是 Chrome DevTools team 团队维护的一个基于 CDP 的 api 库，如果没有需要特别考虑的因素，建议直接用 puppeteer。

## Chomedp 操作 Chrome

[Chromedp][14] 是一套实现 CDP 协议的 Go Pacakge，主要由 cdproto 和 chromdp 两部分组成：`cdproto` 和 CDP 协议一一对应，包含每个 domain 中的 target 和函数定义，详情见 [cdproto doc][15]；`chromedp` 用于启动浏览器、发送 CDP 指令等，详情见 [chromedp doc][16]。


```go
package main

import (
    "context"
    "fmt"
    "log"
    "reflect"
    "time"

    "github.com/chromedp/cdproto/network"
    "github.com/chromedp/cdproto/page"

    "github.com/chromedp/chromedp"
)

func main() {
    // 手动设置浏览器参数
    opts := []chromedp.ExecAllocatorOption{
        chromedp.DisableGPU,
    }
    allocCtx, cancel := chromedp.NewExecAllocator(context.Background(), opts...)
    defer cancel()
    taskCtx, cancel := chromedp.NewContext(allocCtx)
    defer cancel()

    ////  默认无头模式
    //taskCtx, cancel := chromedp.NewContext(context.Background())
    //defer cancel()

    var idSuValue string
    var idKwValue string = "lijiaocn"

    // ensure that the browser process is started
    if err := chromedp.Run(taskCtx); err != nil {
        panic(err)
    }

    chromedp.ListenBrowser(taskCtx, browerEvent)
    chromedp.ListenTarget(taskCtx, targetEvent)

    if err := chromedp.Run(taskCtx, tasks(idKwValue, &idSuValue)); err != nil {
        log.Fatal(err)
    }

    fmt.Printf("idSuValue: %s\n", idSuValue)
    time.Sleep(30 * time.Second)
}

func browerEvent(ev interface{}) {
    fmt.Printf("Receive browerEvent TypeName：%v\n", reflect.TypeOf(ev).String())
}

func targetEvent(ev interface{}) {
    fmt.Printf("Receive targetEvent TypeName：%v\n", reflect.TypeOf(ev).String())
}

func tasks(idKwValue string, idSuValue *string) chromedp.Tasks {
    return chromedp.Tasks{
        page.Enable(),    // 开启 page 事件通知
        network.Enable(), // 开启 network 事件通知
        chromedp.Navigate("https://www.baidu.com"),
        chromedp.Value("su", idSuValue, chromedp.ByID),    //页面元素读取
        chromedp.SendKeys("kw", idKwValue, chromedp.ByID), //页面文本框输入
        chromedp.Sleep(2 * time.Second),
        chromedp.Click("su", chromedp.ByID), //页面元素点击
        chromedp.Sleep(10 * time.Second),
    }
}
```


## Selenium 的 Python SDK

安装 Python 包：

```sh
pip install selenium
```

从 [Install browser drivers][5] 给出的链接中下载某一版本的 ChromeDriver。

### 打开网页并模拟操作

```python
import time
from selenium import webdriver
from selenium.webdriver.common.by import By

if __name__ == '__main__':
    driver = webdriver.Chrome('/Users/Work/Bin/selenuim/chromedriver')
    driver.get('https://www.baidu.com')
    driver.implicitly_wait(1)
    print("title: %s" % driver.title)
    print("cookies: %s" % driver.get_cookies())

    searchBoxInput = driver.find_element(By.ID, "kw")
    searchBoxButton = driver.find_element(By.ID, "su")

    searchBoxInput.send_keys("lijiaocn.com")
    time.sleep(1)

    searchBoxButton.click()

    searchBoxInput = driver.find_element(By.ID, "kw")
    print("value: %s" % searchBoxInput.get_attribute("value"))

    time.sleep(10)

    driver.quit()
```

### 执行网页中的js函数

```python
import time
from selenium import webdriver

if __name__ == '__main__':
    driver = webdriver.Chrome('/Users/Work/Bin/selenuim/chromedriver')
    driver.get('file:///tmp/demo.html')
    driver.implicitly_wait(1)
    # 执行页面 js 代码并返回结果
    result=driver.execute_script('return window.getPageInfo()')
    print("%s" % result)

    time.sleep(10)

    driver.quit()
```

### 网页截图

```python
import time
from selenium import webdriver
from selenium.webdriver.common.by import By

if __name__ == '__main__':
    driver = webdriver.Chrome('/Users/Work/Bin/selenuim/chromedriver')
    driver.implicitly_wait(1)
    driver.set_window_size(1920, 1080)
    driver.get('file:///tmp/demo.html')

    succ = driver.save_screenshot("/tmp/window.png")
    if not succ:
        print("fail")

    succ = driver.find_element(By.ID, 'snapshot_wrapper').screenshot("/tmp/body.png")
    if not succ:
        print("fail")

    time.sleep(10)

    driver.quit()
```

## 参考

1. [李佶澳的博客][1]
2. [Selenium overview][2]
3. [Write your first Selenium script][3]
4. [Install a Selenium library][4]
5. [Install browser drivers][5]
6. [html - How are pixels defined?][6]
7. [Chrome DevTools Protocol][7]
8. [Selenium with Python][8]
9. [Contributing to Chrome DevTools Protocol][9]
10. [Puppeteer][10]
11. [HTTP Endpoints][11]
12. [Target Domain][12]
13. [Page Domain][13]
14. [Chromedp][14]
15. [cdproto doc][15]
16. [chromedp doc][16]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.selenium.dev/documentation/overview/ "Selenium overview"
[3]: https://www.selenium.dev/documentation/webdriver/getting_started/first_script/ "Write your first Selenium script"
[4]: https://www.selenium.dev/documentation/webdriver/getting_started/install_library/ "Install a Selenium library"
[5]: https://www.selenium.dev/documentation/webdriver/getting_started/install_drivers/ "Install browser drivers"
[6]: https://stackoverflow.com/questions/27859219/html-how-are-pixels-defined "html - How are pixels defined?"
[7]: https://chromedevtools.github.io/devtools-protocol/ "Chrome DevTools Protocol"
[8]: https://selenium-python.readthedocs.io/ "Selenium with Python"
[9]: https://docs.google.com/document/d/1c-COD2kaK__5iMM5SEx-PzNA7HFmgttcYfOHHX0HaOM/edit# "Contributing to Chrome DevTools Protocol"
[10]: https://github.com/puppeteer/puppeteer "puppeteer"
[11]: https://chromedevtools.github.io/devtools-protocol/#endpoints "HTTP Endpoints"
[12]: https://chromedevtools.github.io/devtools-protocol/tot/Target/ "Target Domain"
[13]: https://chromedevtools.github.io/devtools-protocol/tot/Page/ "Page Domain"
[14]: https://github.com/chromedp/ "chromedp"
[15]: https://pkg.go.dev/github.com/chromedp/cdproto "cdproto doc"
[16]: https://pkg.go.dev/github.com/chromedp/chromedp "chromedp doc"
