---
layout: default
title: Grunt使用手册
author: lijiaocn
createdate: 2017/04/25 15:41:52
changedate: 2017/09/04 21:45:32
categories: 技巧
tags: 前端
keywords: Grunt,Grunt插件,javascript,构建工具
description: Grunt,JaveScript世界的构建工具,主要还是依靠大量的插件，了解插件的功能和配置方式即可。

---

* auto-gen TOC:
{:toc}

## Grunt项目

项目中添加两份文件：package.json 和 Gruntfile。

	package.json: 此文件被npm用于存储项目的元数据，以便将此项目发布为npm模块。
	Gruntfile: 此文件被命名为 Gruntfile.js 或 Gruntfile.coffee，用来配置或定义任务（task）并加载Grunt插件的。

## package.json

package.json应当放置于项目的根目录中，与Gruntfile在同一目录中，并且应该与项目的源代码一起被提交。

在项目目录里运行`npm install`时，packeg.json中列出的依赖文件会被自动安装到项目根目录下的`node_modules`目录中。

创建基本的package.json：

	npm init

安装依赖包，并将其写入package.json:

	npm install <module> --save-dev

package.json

	{
	  "name": "enterpaas",
	  "private": true,
	  "devDependencies": {
	    "autoprefixer-core": "^5.2.1",
	    "grunt": "^0.4.5",
	    "grunt-angular-templates": "^0.5.7",
	    "grunt-concurrent": "^1.0.0",
	    "grunt-contrib-clean": "^0.6.0",
	    "grunt-contrib-concat": "^0.5.0",
	    "grunt-contrib-connect": "^0.9.0",
	    "grunt-contrib-copy": "^0.7.0",
	    ... 省略...
	    "karma": "^1.6.0",
	    "karma-jasmine": "^1.1.0",
	    "karma-phantomjs-launcher": "^1.0.4",
	    "phantomjs-prebuilt": "^2.1.14",
	    "time-grunt": "^1.0.0"
	  },
	  "engines": {
	    "node": ">=0.10.0"
	  },
	  "scripts": {
	    "test": "karma start test/karma.conf.js"
	  }
	}

## Gruntfile

Gruntfile.js 或 Gruntfile.coffee 文件是有效的 JavaScript 或 CoffeeScript 文件。

应当放在你的项目根目录中，和package.json文件在同一目录层级，并和项目源码一起加入源码管理器。

	module.exports = function(grunt) {                   //warpper函数，Grunt代码必须都在这个函数里
	
	  grunt.initConfig({                                 //initConfig的参数一个map，可以任意添加key-value
	    pkg: grunt.file.readJSON('package.json'),
	    uglify: {                                        //插件grunt-contrib-uglify要求的参数
	      options: {
	        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
	      },
	      build: {
	        src: 'src/<%= pkg.name %>.js',
	        dest: 'build/<%= pkg.name %>.min.js'
	      }
	    }
	  });
	
	  grunt.loadNpmTasks('grunt-contrib-uglify');        //加载包含 "uglify" 任务的插件
	  grunt.registerTask('default', ['uglify']);         //默认被执行的任务列表
	
	};

## Grunt插件

主要还是用插件！[Grunt插件][3]

### grunt-contrib-clean

[grunt-contrib-clean][4]删除指定的文件

	// Empties folders to start fresh
	clean: {
	  dist: {
	    files: [{
	      dot: true,
	      src: [
	        '.tmp',
	        '<%= yeoman.dist %>/{,*/}*', 
	        '!<%= yeoman.dist %>/.git{,*/}*'
	      ]
	    }]
	  },
	  server: '.tmp'
	},

`grunt clean`将会删除`dist`和`server`中的文件。

`grunt clean:dist`删除`dist`中的文件。

### grunt-wiredep

[grunt-wiredep][5] finds your components and injects them directly into the HTML file you specify.

### grunt-usemin

[grunt-usemin][6] replaces the references of scripts, stylesheets and other assets within HTML files dynamically with optimized versions of them.

usemin包含两个过程`useminPrepare`和`usermin`

userminPrepare将指定的html文件中的被标记的代码段(block)中的link压缩替换

block标记方法:

	<!-- build:<type>(alternate search path) <path> -->
	... HTML Markup, list of script / link tags.
	<!-- endbuild -->

例如，将代码块中的所有css文件将为压缩成vendor.css:

	<!-- build:css(.) styles/vendor.css -->
	<!-- Bootstrap 3.3.6 -->
	<link rel="stylesheet" href="bower_components/AdminLTE/bootstrap/css/bootstrap.min.css">
	<!-- Theme style -->
	<link rel="stylesheet" href="bower_components/AdminLTE/dist/css/AdminLTE.min.css">
	<!-- AdminLTE Skins. Choose a skin from the css/skins
	     folder instead of downloading all of them to reduce the load. -->
	<link rel="stylesheet" href="bower_components/AdminLTE/dist/css/skins/_all-skins.min.css">
	<!-- endbuild -->

useminPrepare:

	// Reads HTML for usemin blocks to enable smart builds that automatically
	// concat, minify and revision files. Creates configurations in memory so
	// additional tasks can operate on them
	useminPrepare: {
	  html: '<%= yeoman.app %>/index.html',
	  options: {
	    dest: '<%= yeoman.dist %>',
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

usermin:

	// Performs rewrites based on filerev and the useminPrepare configuration
	usemin: {
	  html: ['<%= yeoman.dist %>/{,*/}*.html'],
	  css: ['<%= yeoman.dist %>/styles/{,*/}*.css'],
	  js: ['<%= yeoman.dist %>/scripts/{,*/}*.js'],
	  options: {
	    assetsDirs: [
	      '<%= yeoman.dist %>',
	      '<%= yeoman.dist %>/images',
	      '<%= yeoman.dist %>/styles'
	    ],
	    patterns: {
	      js: [[/(images\/[^''""]*\.(png|jpg|jpeg|gif|webp|svg))/g, 'Replacing references to images']]
	    }
	  }
	},

## 参考

1. [Gruntjs][1]
2. [Gruntjs Quick Start][2]
3. [Gruntjs plugins][3]
4. [grunt-contrib-clean][4]
5. [grunt-wiredep][5]
6. [gurnt-usemin][6]

[1]: http://www.gruntjs.net/  "http://www.gruntjs.net/" 
[2]: http://www.gruntjs.net/getting-started "http://www.gruntjs.net/getting-started"
[3]: http://www.gruntjs.net/plugins "http://www.gruntjs.net/plugins"
[4]: https://www.npmjs.com/package/grunt-contrib-clean "https://www.npmjs.com/package/grunt-contrib-clean"
[5]: https://www.npmjs.com/package/grunt-wiredep "https://www.npmjs.com/package/grunt-wiredep"
[6]: https://www.npmjs.com/package/grunt-usemin "https://www.npmjs.com/package/grunt-usemin"
