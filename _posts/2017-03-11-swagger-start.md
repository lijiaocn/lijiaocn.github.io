---
layout: default
title: Swagger初次使用
author: lijiaocn
createdate: 2017/03/11 19:06:24
changedate: 2017/09/11 16:14:45
categories: 技巧
tags: swagger
keywords: swagger,restful
description: Swagger是一种描述RESTful APIs的方法（Specification）。它对REST API做了系统的整理，提出一套完整的描述方式。配套的UI工具（swagger-ui）和代码生成器器

---

Swagger是一种描述RESTful APIs的方法（Specification）。它对REST API做了系统的整理，提出一套完整的描述方式。并且开发了配套的UI工具（swagger-ui）和代码生成器器（swagger-codegen）。

使用Swagger不纯粹是为了生成一个漂亮的API文档，也不纯粹是为了自动生成多种语言的代码框架，重要的是，通过遵循它的标准，可以使REST API分组清晰、定义标准。并且Swagger对REST API做了系统的整理，学习使用Swagger可以对REST API形成一个系统的认识。

## 基本结构

[Swagger Specification][1]很详细地描述了Swagger的格式要求。它是一个json格式或者yaml格式的文件，前半部分描述这份API的基本情况，由下面几个Field组成：

	Field Name   Type        Desciption
	----------------------------------------
	swagger     string       使用的swagger的版本,推荐2.0   
	info        Info Object  API的源数据（metadata）
	host        string       提供API的主机名或者IP
	basePath    string       API的basePath，比如以"/"开始
	schemes     string       传输协议，http https ws wss
	consumes    string       输入数据类型，MIME types
	produces    string       输出数据类型，MIME types

紧接着是对每一个API的具体描述：

	paths       Paths Objects    每个REST API

然后是接口的安全性要求：

	security

为了能够方便清晰的描述，可以将一些通用的部分在下面的Fields中描述：

	definitions
	parameters
	responses
	securityDefinitions
	tags

最后附加一个到其它文档的链接:

	externalDocs

## 实战操作

在实际环境中，可能有非常多的REST接口，如果将这些REST接口全部定义在一个swagger文件中，这个swagger文件的行数会很多，无论是阅读还是维护都会非常不方便。

可用利用$ref属性，将swagger文件拆分成多个文件，例如：

	▾ definitions/          <--  定义数据结构
	    UserInfo.yaml
	▾ paths/                <--  定义API
	    user.yaml
	▾ responses/            <--  定义返回类型
	    NotFound.yaml
	    Success.yaml
	    UnExpected.yaml
	  config.json            
	  swagger.yaml          <--  入口的swagger.yaml

在swagger.yaml中引入path:

	paths:
	    /user:
	        $ref: './paths/user.yaml#/'

## 使用swagger-codegen生成代码

安装swagger-codegen:

	git clone https://github.com/swagger-api/swagger-codegen
	cd swagger-codegen
	mvn clean package

生成代码：

	jar=swagger-codegen/modules/swagger-codegen-cli/target/swagger-codegen-cli.jar
	java -jar $jar  generate -i ./swagger.yaml -l go -c ./config.json -o  ./
	java -jar $jar  generate -i ./swagger.yaml -l go-server -c ./config.json -o  ./

需要注意的是，PATH的定义中必须要设置TAG，否则对应的代码不会生成。

代码分为Server和Client两部分，API的处理在Server部分，结构体的定义在Client部分。

	  ▾ client/
	    ▸ docs/
	      api_client.go
	      api_response.go
	      configuration.go
	      git_push.sh
	      LICENSE
	      pom.xml
	      README.md
	      user_api.go
	      user_info.go
	  ▾ server/
	    ▸ api/
	    ▸ go/
	      LICENSE
	      main.go

## 使用Swagger-editor编辑以及测试

可以在本地安装[swagger-editor][2]（需要翻墙才能下载release包）

也可以在线使用[swagger-editor-online][3]。

并且可以直接在swagger-editor中测试API:

![swagger-editor](http://article.img.znr.io/2017-03-12-1-1.jpg)

[示例代码][4]

## 参考

1. [swagger specification][1]
2. [swagger editor install][2]
3. [swagger editor online][3]
4. [swagger usage example][4]

[1]: http://swagger.io/specification/  "specification" 
[2]: https://github.com/swagger-api/swagger-editor/ "swagger-editor install"
[3]: http://editor.swagger.io/#!/  "swagger-editor online"
[4]: https://github.com/lijiaocn/swagger-usage  "swagger useage example"

