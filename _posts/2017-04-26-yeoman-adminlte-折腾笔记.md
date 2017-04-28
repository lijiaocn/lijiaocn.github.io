---
layout: default
title: yeoman-adminlte-折腾笔记
author: lijiaocn
createdate: 2017/04/26 09:49:03
changedate: 2017/04/26 10:35:40
categories:
tags: 前端
keywords: yeoman,adminlte,前端技术,折腾笔记
description: 折腾了很久总算是大概厘清了yeoman套件的工作过程。算是有了一点小进步。

---

* auto-gen TOC:
{:toc}

如果不了yeoman、Grunt，先去了解一下：[前端开发工具][1]、[Grunt使用手册][2]。

## 创建yeoman项目

yeoman项目的详情可以参考本站的手册[前端开发工具][1]。

	npm install -g yo bower grunt-cli gulp
	npm install -g generator-angular
	yo angular 
	bower install      //安装bower.json中列出的依赖文件
	npm install        //安装package.json中的列出的依赖文件
	bower install --save admin-lte   //--save，在bower.json中添加依赖文件

## 在bower.json中添加adminlte依赖的两个包

	"dependencies": {
	  "AdminLTE": "adminLTE#^2.3.11",
	  "font-awesome": "4.5.0",    
	  "ionicons-min": "2.0.1"
	},

然后`bower install`。

## 去掉bower自动注入功能

在index.html中去掉注释:

	<!-- bower:css -->
	...
	<!-- endbower -->

	<!-- bower:js -->
	...
	<!-- endbower -->

Gruntfile.js中的插件会自动在这个注释端里插入，每个依赖包的bower.json中的main中指定的文件。

例如bower_components/AdminLTE/bower.json中:

	"main": [
	"index2.html",
	    "dist/css/AdminLTE.css",
	    "dist/js/app.js",
	    "build/less/AdminLTE.less"

`grunt build`后, js和css就会添加到对应的注释块中。

可以通过修改我们自己项目的bower.json中，更改要引入的文件，例如:

	"overrides":{
	  "AdminLTE": {
	    "main": [
	        "bootstrap/css/bootstrap.min.css",
	        "dist/css/AdminLTE.min.css",
	        "dist/css/skins/_all-skins.css",
	        "plugins/jQuery/jquery-2.2.3.min.js",
	        "bootstrap/js/bootstrap.min.js",
	        "dist/js/app.js"
	    ]
	  }

但是因为在后面的js压缩中发现了问题，所以这里去掉了注释块，没有使用自动注入功能。

## 引用adminlte的css

因为前面去掉了注释块，只能手动添加引用，直接在app/index.html文件中:

	<!-- build:css(.) styles/vendor.css -->
	<!-- Font Awesome -->
	<link rel="stylesheet" href="bower_components/font-awesome/css/font-awesome.min.css">
	<!-- Ionicons -->
	<link rel="stylesheet" href="bower_components/ionicons-min/css/ionicons.min.css">
	<!-- Bootstrap 3.3.6 -->
	<link rel="stylesheet" href="bower_components/AdminLTE/bootstrap/css/bootstrap.min.css">
	<!-- Theme style -->
	<link rel="stylesheet" href="bower_components/AdminLTE/dist/css/AdminLTE.min.css">
	<!-- AdminLTE Skins. Choose a skin from the css/skins
	     folder instead of downloading all of them to reduce the load. -->
	<link rel="stylesheet" href="bower_components/AdminLTE/dist/css/skins/_all-skins.min.css">
	<!-- endbuild -->

注意这些css的link都放在注释块中:

	<!-- build:css(.) styles/vendor.css -->
	....
	<!-- endbuild -->

Gruntfile.js中的插件usermin插件会自动把这个注释块中的css压缩成vendor.css，并插入到最后的html中:

	// Reads HTML for usemin blocks to enable smart builds that automatically
	// concat, minify and revision files. Creates configurations in memory so
	// additional tasks can operate on them
	useminPrepare: {
	  html: '<%= yeoman.app %>/index.html',
	  options: {
	    dest: '<%= yeoman.dist %>',             //压缩后的文件复制到dist目录中
	    flow: {
	      html: {
	        steps: {
	          js: ['concat', 'uglifyjs'],
	          css: ['cssmin']
	        },
	        post: {}
	      }
	    }
	  }
	},

`grunt build`之后可以看到:

	▾ dist/
	  ▸ fonts/
	  ▸ images/
	  ▸ scripts/
	  ▾ styles/
	      vendor.608a15b5.css   <-- 压缩得到的css

在生成的dist/index.html中可以看到, link已经替换成了vendor.css

	<link rel="stylesheet" href="styles/vendor.608a15b5.css"> 

## 引用adminlte的js

本来js是可以和css一样，将link添加到注释块中，自动压缩成一个js文件。但是测试发现，grunt将多个js压缩成一个js文件后，最终得到的页面完全不响应鼠标点击事件了。控制台也没有报错，原因暂时未知，不得已，采用了这种很low的方式。

将需要使用的adminlte的文件复制到app目录下:

	cp bower_components/AdminLTE/bootstrap/js/bootstrap.min.js  app/scripts/jsmin/
	.... 省略其它复制过程...

在index.html中引用js:

	<script src="scripts/jsmin/jquery.min.js"></script>
	<script src="scripts/jsmin/jquery-ui.min.js"></script>
	<script src="scripts/jsmin/bootstrap.min.js"></script>

在Grunfile.js中添加一个复制过程:

	// Copies remaining files to places other tasks can use
	copy: {
	  dist: {
	    files: [{
	      expand: true,
	      dot: true,
	      cwd: '<%= yeoman.app %>',
	      dest: '<%= yeoman.dist %>',
	      src: [
	        '*.{ico,png,txt}',
	        '*.html',
	        'images/{,*/}*.{webp}',
	        'styles/fonts/{,*/}*.*',  <-- 会被复制到dist目录中
	        'scripts/jsmin/*.js',     <-- 会被复制到dist目录中
	        'fonts/*'
	      ]
	    }, {

自己的js可以正常压缩:

	<!-- build:js({.tmp,app}) scripts/app.js -->
	<script src="scripts/adminlte.js"></script>
	<!-- endbuild -->

## Grunt Build

`Grunt build`之后，dist目录下的文件就可以直接拿去使用了。

## 参考

1. [前端开发工具][1]
2. [Grunt使用手册][2]

[1]: 前端开发工具  "http://www.lijiaocn.com/1011/01/01/manual-Web-FrontEnd.html" 
[2]: Grunt使用手册  "http://www.lijiaocn.com/1011/01/02/manual-Web-FrontEnd-Grunt.html" 
