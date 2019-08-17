---
layout: default
title: "Python 网络爬虫学习笔记"
author: 李佶澳
date: "2019-08-04T11:41:22+0800"
last_modified_at: "2019-08-04T11:41:22+0800"
categories: 编程
cover: 
tags: spider python
keywords: python3,网络爬虫
description: 介绍了Requests、Selenium、PhantomJS、Beautiful Soup、Charles、Scrapy等python库或工具的用法

---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

Python2 马上就要不维护了，现在要尽量使用 Python3，正好`崔庆才`写了一本[《Python 3网络爬虫开发实战》][4]，介绍了 Requests、Selenium、PhantomJS、Beautiful Soup 等 python 库的用法。

## 工具了解

Python3 的安装就不说了，小儿科，需要提一下的是可以用 virtualenv 创建的 python 运行环境，用下面的方式指定用 python3：

```sh
pip install virtualenv
virtualenv  -p python3 env
source env/bin/activate
```

### Python 请求库

[Requests](https://github.com/requests/requests) 是一个发送 http 请求的 python 库，[英文文档](https://2.python-requests.org/en/master/)，[中文文档](http://2.python-requests.org/zh_CN/latest/)：

	pip3 install requests

[Selenium](https://github.com/SeleniumHQ/selenium/tree/master/py) 是一个用于 Web 自动化测试的浏览器，能够用代码控制浏览器内操作的特性使 Selenium 具有更广阔的应用空间，[英文文档](https://selenium-python.readthedocs.io/)、[中文文档](https://selenium-python-zh.readthedocs.io/en/latest/)：

	pip3 install selenium

[Chrome Driver](https://sites.google.com/a/chromium.org/chromedriver) 和 [Gecko Driver](https://github.com/mozilla/geckodriver) 是配合 Selenium 使用的，分别用来驱动 Chrome 浏览器和 Firefox 浏览器，安装方法见：[chromedriver](https://cuiqingcai.com/5135.html) 和 [geckodriver](https://cuiqingcai.com/5153.html) 。

[Phantomjs](http://phantomjs.org) 是无界面的 WebKit 浏览器，无界面运行效率高，需要 [下载安装](https://phantomjs.org/download.html) 。可以被 Selenium 驱动，如下：


```python
from selenium import webdriver
browser = webdriver.PhantomJS()
browser.get('https://www.baidu.com')
print(browser.current_url)
```

[aiohttp](https://github.com/aio-libs/aiohttp) 是一个异步发送 http 请求的 python 库，[英文文档](https://aiohttp.readthedocs.io/en/stable/)，采用异步机制，效率大大提高。

	pip3 install aiohttp

### Python 解析库

[lxml](https://github.com/lxml/lxml) 支持 HTML、XML 解析，支持 XPath 解析方式。

	pip3 install lxml

[Beautiful Soup](https://www.crummy.com/software/BeautifulSoup/bs4/doc) 支持 HTML、XML 解析，API 强大，解析方法多，依赖前面的 lxml。

	pip3 install beautifulsoup4

[pyquery](https://github.com/gawel/pyquery) 使用类似 jQuery 的语法解析 HTML。

	pip3 install pyquery

[tesserocr](https://github.com/sirfz/tesserocr)  是一个 OCR 识别库 [tesserac](https://github.com/tesseract-ocr/tesseract) 的 Python API，可以用来识别图片中的文字。

	yum install -y tesseract
	pip3 install tesserocr pillow

### 移动端工具

用于对接 Mysql、Redis 等存储系统的 Python 库就不提了，重点介绍几个抓包和移动端工具，通过这些抓包工具可以抓取 APP 的通信数据，从而分析出协议规则。

[Charles](https://www.charlesproxy.com) 是一款相当强大的抓包工具，具备代理功能， [用charles和Fiddler抓取、破解、改写（请求拦截）PC端、手机移动端通信数据](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2018/02/05/pkt-capture.html) 中有简单介绍。

[mitmproxy](https://github.com/mitmproxy/mitmproxy) 是一个支持 HTTP 和 HTTPS 抓包的控制台工具。

[Appium](htttps://github.com/appium/appium) 是移动端的自动化工具，相当于移动端 Selenium，可以驱动 Android、iOS 等移动设备，模拟点击、滑动、输入等操作，非常强大。

### 爬虫框架

爬虫框架集成了必须的爬取、解析、提取、存放工具，按照框架规则填写代码即可。

[pyspider](https://github.com/binux/pyspider) 国人开发的带有 Web 页面的开源爬虫框架。

[Scrapy](https://github.com/scrapy/scrapy) 是一个强大的爬虫框架，[英文文档](https://docs.scrapy.org/en/master/intro/overview.html)、[中文文档](https://scrapy-chs.readthedocs.io/zh_CN/0.24/intro/overview.html0)。

## 简单电影爬虫开发记录

这里简单地用 requests 和 Beautiful Soup 爬取电影资讯。

创建单独的 python 环境

```sh
mkdir spider3
cd spider3
virtualenv  -p python3 env
source env/bin/activate
pip3 install django mysqlclient requests beautifulsoup4
```

创建 Django 项目后，创建 movie 应用：

```sh
python manage.py startapp movie
```

完成数据库配置以及 models 定义后，创建数据库表：

```sh
python manage.py makemigrations movie
python manage.py migrate
```

创建文件 bin/movie-spider.py，导入 django 环境。

**后续内容见**： **[编程手册——Python3 爬虫开发](https://www.lijiaocn.com/prog/py3spider/)**

## 参考

1. [李佶澳的博客][1]
2. [Python3网络爬虫开发实战教程][2]
3. [What is Selenium?][3]
4. [崔庆才：《Python 3网络爬虫开发实战》][4]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://cuiqingcai.com/5052.html "Python3网络爬虫开发实战教程"
[3]: https://www.seleniumhq.org/ "What is Selenium?"
[4]: https://union-click.jd.com/jdc?e=&p=AyIGZRtYFAcXBFIZWR0yEgRXGVkRBxM3EUQDS10iXhBeGlcJDBkNXg9JHU4YDk5ER1xOGRNLGEEcVV8BXURFUFdfC0RVU1JRUy1OVxUBEAVXH14UMlYDHU8Sd19AYigcI0NLSQEKezN3QmILWStaJQITBlQbWRUHEwJlK1sSMkBpja3tzaejG4Gx1MCKhTdUK1sRBRcOXR1dHQsQAlYrXBULIkUQXw5dbFdZA08eTFZRN2UrWCUyIgdlGGtXbBpVBk4JHAARDgBMDhALRQMGGA4RCkIDVkxYRwEQU1dJaxcDEwNc "崔庆才：《Python 3网络爬虫开发实战 》"
