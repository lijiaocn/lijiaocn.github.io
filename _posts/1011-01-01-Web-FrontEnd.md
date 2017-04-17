---
layout: default
title: 前端开发工具
author: lijiaocn
createdate: 2015/11/26 13:50:55
changedate: 2017/04/17 13:11:47
categories:
tags: 手册
keywords:
description: 对前端不熟悉，这是初学过程中学到的一些内容，仅供参考，有问题请留言。

---

* auto-gen TOC:
{:toc}

## Yeoman工具链

[yeoman官方网站](http://yeoman.io/)

[yeoman start: http://yeoman.io/learning/index.html](http://yeoman.io/learning/index.html)

[IBM社区文档: Yeoman - Web应用开发流程与工具](http://www.ibm.com/developerworks/cn/web/1402_chengfu_yeoman/)

Yeoman定义了一套开发流程，工具链包括: Yo、Bower、Grunt。

	Yo: 生成使用Grunt和Bower的应用模版。
	
	Bower: 统一管理应用的依赖，例如JavaScript库、CSS等。
	
	Grunt: 将开发过程中需要到一些操作自动化，例如JavaScript质量检查、CSS压缩等。
	       开发人员只需要运行一条Grunt命令就可以完成要做的操作。

安装工具链:

	npm install -g yo bower grunt-cli gulp

### npm

因为Yeoman的使用的软件包是用npm管理的，因此先了解一下npm是很有必要的。

	npm install
	npm search 
	npm ls

global模式安装和local模式安装：

	在用npm安装软件包的时候，有两种模式:
	
	    -g --global:  global模式，安装到系统目录中
	    默认local :   安装到当前目录的 ./node_modules目录中

在用npm ls查看安装了哪些包时，默认查看local, 如果要看系统中的需要使用"-g"

还需要使用npm安装yeoman的工具链：

	npm install -g yo bower grunt-cli gulp

使用国内源, 在~/.npmrc中写入源地址:

	registry =https://registry.npm.taobao.org   

### 模版生成器

yo将使用模版生成器来生成项目文件。生成器需要用npm事先安装。

首先安装一个模版生成器: 

	npm install -g generator-webapp   # -g 表示安装到系统目录中

查看已经安装的模版生成器:

	npm ls -g  |grep generator

>这里安装的webapp是一个默认应用项目模版，包含HTML5、Boilerplate、jQuery、 Modernizr和Bootstrap。

类似，安装angular生成器:

	npm install -g generator-angular   # -g 表示安装到系统目录中

查看生成器的主页:

	npm home generator-webapp
	npm home generator-angular

### Yo

[Yo GetStart](http://yeoman.io/learning/index.html)

查看可用的生成器:

	yo --help

查看结果如下:

	lijiaos-MacBook-Pro:~ lijiao$ yo --help
	Usage: yo GENERATOR [args] [options]

	General options:
	--help         # Print this info and generator's options and usage
	-f, --force    # Overwrite files that already exist
	--version      # Print version
	--no-color     # Disable colors
	--[no-]insight # Toggle anonymous tracking
	--generators	 # Print available generators

	Available Generators:
		angular
			common
			constant
			controller
			decorator
			directive
			factory
			filter
			main
			provider
			route
			service
			value
			view
		karma
		webapp

从上面的输出中可以看到，angular还有它自己的子生成器common等。

查看生成器等帮助手册:

	yo angular --help          #angular生成器
	yo angular:common --help   #angular:common
	yo webapp  --help          #webapp

准备一个干净的目录，在里面使用指定的生成器，生成项目目录:

	yo webapp     # 使用generator-webapp
	yo angular    # 使用generator-angular

得到以下文件：

	Gruntfile.js    app[dir]    bower.json   bower_components[dir]  node_modules[dir]    package.json     test[dir]

文件和目录的作用如下:

	Gruntfile.js:       Grunt的执行命令
	app:                应用文件
	bower.json:         依赖关系， 需要使用bower安装这里面列出的包
	bower_components:   目录中存放依赖的文件, bower负责管理这个目录中的内容
	node_modules:       npm在当前目录中安装的软件包
	package.json:       未知...
	test:               测试文件

### Bower

[Bower官方网站](http://bower.io/)

[Bower Getting started](http://bower.io/#getting-started)

使用yo命令生成的项目根目录中会存在bower.json文件。需要使用bower命令安装里面的依赖包:

	bower install

假设我们想自己在添加admin-lte:

	$ bower search admin-lte
	Search results:
	    admin-lte https://github.com/almasaeed2010/AdminLTE.git
	    admin-lte-rtl https://github.com/airani/AdminLTE.git
	    admin-lte.scss https://github.com/aguegu/AdminLTE.git
	    admin-lte-sass https://github.com/Poolshark/AdminLTE.git
	$ bower install admin-lte --save
	....(省略输出)....

>指定--save选项，bower会自动把安装的包添加到bower.json文件中。

其它常用操作：

	#Search for a dependency in the Bower registry.
	    $ bower search <dep>
	
	#Install one or more dependencies.
	    $ bower install <dep>..<depN>
	
	#List out the dependencies you have installed for a project.
	    $ bower list
	
	#Update a dependency to the latest version available.
	    $ bower update <dep>

### Grunt 

[Grunt](http://www.gruntjs.net/)

[快速入门](http://www.gruntjs.net/getting-started)

使用yo命令生成的项目根目录中会存在Gruntfile.js和package.json两个文件。package.json中记录的是grunt依赖的包，Gruntfile.js是grunt的工作内容。

需要用npm安装package.json中的依赖包，在项目根目录下执行:

	npm install

安装完成后，执行:

	grunt serv

这时候会自动打开一个浏览器，看到示例的网页。

grunt的子命令都是在Gruntfile.js文件中定义的，通常可以：

	grunt serv    //启动webserver查看当前页面
	grunt build   //将app/*下的页面素材压缩打包到dist目录, dist目录中的文件作为发布内容

查看grunt的帮助命令:

	grunt --help

### 开始工作

完成上面的bower install和 npm install以后，就可以开始项目里添加自己的内容了，app目录中是存放开发的项目文件。

下面回顾开发一个angular应用的完整准备过程:

	安装angular的模版生成器：
	
	    npm install -g generator-angular
	
	进入到工作目录：
	
	    mkdir angular-app
	    cd angular-app
	
	生成模版，安装依赖文件：
	
	    yo angular && bower install && npm install
	
	安装依赖库：
	
	    bower install admin-lte
	
	添加一个路由
	
	    yo angular:route Detail    //将会同时生成router、controller和view
	
	单独创建controller:
	
	    yo angular:controller myController
	
	查看生成器的帮助手册, 使用更多的命令:
	
	    yo angular --help
	
	查看生成器首页手册：
	
	    npm home generator-angular

### 问题

#### 没有compass命令

问题如下:

	Warning: Command failed: /bin/sh -c compass --version
	/bin/sh: compass: command not found

解决办法:

	gem install compass

如果安装失败，可以考虑在gem中增加taobao源后，再次安装:

	gem sources --add https://ruby.taobao.org/

#### Cannot read property 'contents' of undefined

[github issues](https://github.com/gruntjs/grunt-contrib-imagemin/issues/344)已经解决了这个问题。

把npm更新后，并将package.json中"grunt-contrib-imagemin"版本修改为1.0.0以后，解决了这个问题.

	npm update

## 文献
