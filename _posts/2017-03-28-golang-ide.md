---
layout: default
title: go的开发环境
author: 李佶澳
createdate: 2017/03/28 10:01:38
changedate: 2017/11/15 10:49:06
categories: 编程
tags: golang
keywords: Go编程
description: Go编程

---

* auto-gen TOC:
{:toc}

## 安装go

下载安装文件go1.3.linux-amd64.tar.gz, 解压到/opt

## 运行环境

在.bashrc中添加:

	#golang的安装目录
	export GOROOT=/opt/go            
	
	#golang工程目录
	export GOPATH=/opt/go-workspace
	
	export PATH=$PATH:$GOROOT/bin:$GOPATH/bin:$GOPATH/bin 

执行`source ./bashrc`后，查看go环境变量:

	[root@localhost dockerImages]## go env
	GOARCH="amd64"
	GOBIN=""
	GOCHAR="6"
	GOEXE=""
	GOHOSTARCH="amd64"
	GOHOSTOS="linux"
	GOOS="linux"
	GOPATH="/opt/go-workspace"       ##GOPATH is workspace's location
	GORACE=""
	GOROOT="/opt/go-1.3.1"
	GOTOOLDIR="/opt/go-1.3.1/pkg/tool/linux_amd64"
	CC="gcc"
	GOGCCFLAGS="-fPIC -m64 -pthread -fmessage-length=0"
	CXX="g++"
	CGO_ENABLED="1"

## workspace

设置workspace:

	mkdir -p $GOPATH/src
	mkdir -p $GOPATH/bin
	mkdir -p $GOPATH/pkg

## 版本管理工具

go get支持git等版本管理工具，可以自动使用版本工具拉取代码。

[go get tools][2]中给出了go支持的版本管理工具，根据需要安装:

	svn - Subversion, download at: http://subversion.apache.org/packages.html
	hg - Mercurial, download at https://www.mercurial-scm.org/downloads
	git - Git, download at http://git-scm.com/downloads
	bzr - Bazaar, download at http://wiki.bazaar.canonical.com/Download

如果需要通过代理获取代码，设置环境变量`http_proxy=代理地址`，例如:

	http_proxy=127.0.0.1:80

### godep

godep是用于第三方依赖包的管理，可以将工程中依赖的package打包(godep save)到Godeps目录中，以及安装依赖包(go restore).

安装：

	go get github.com/tools/godep

### gotag

[gotag][3]用来与vim配合，生成ctags文件:

安装:

	go get -u github.com/jstemmer/gotags

### 安装gocode

[gocode][4]用于golang代码的自动补全，与vim等配合使用

	go get -u github.com/nsf/gocode

## 配置VIM

可以直接使用[github.com/lijiaocn/vim][5]中的vim配置，已经包含了多种常用插件。

### 安装vim-go

[vim-go][6]是vim的一个golang全家桶插件，提供了很多非常实用的命令。

	:GoBuild
	:GoInstall
	:GoTest
	:GoCoverage
	:GoCoverageBrowser
	:GoDef
	:GoDecls 
	:GoDeclsDir
	:GoDoc
	:GoDocBrowser
	:GoRun
	:GoImplements
	:GoCallees
	:GoReferrers
	:GoPath
	:GoMetaLinter
	:GoRename
	:GoPlay
	:GoAlternate
	:GoAddTags
	:GoImport
	:GoDrop

快捷键需要自行设置。vim-go/doc/vim-go.txt的go-mappings中给出可用的映射:

	au FileType go nmap <leader>r <Plug>(go-run)
	au FileType go nmap <leader>b <Plug>(go-build)
	au FileType go nmap <leader>t <Plug>(go-test)
	au FileType go nmap <leader>c <Plug>(go-coverage)

vim-go的作者[fatih][7]专门写了一个[教程][8]。

### vim-go 安装

安装很简单，将插件加入到vim中即可：

	Pathogen:
	    git clone https://github.com/fatih/vim-go.git ~/.vim/bundle/vim-go
	vim-plug:
	    Plug 'fatih/vim-go'
	Vim packages:
	    git clone https://github.com/fatih/vim-go.git ~/.vim/pack/plugins/start/vim-go

然后直接在vim中执行:

	:GoInstallBinaries

但是要注意这个过程会联网安装，会访问golang.org，可能需要翻墙。

好在github上有mirror, [https://github.com/golang/tools][9]，修改vim-go的plugin目录下go.vim中的依赖包:

在.vim/bundle/vim-go/plugin/go.vim中可以看到依赖包:

	let s:packages = [
	            \ "github.com/nsf/gocode",
	            \ "github.com/alecthomas/gometalinter",
	            \ "golang.org/x/tools/cmd/goimports",
	            \ "golang.org/x/tools/cmd/guru",
	            \ "golang.org/x/tools/cmd/gorename",
	            \ "github.com/golang/lint/golint",
	            \ "github.com/kisielk/errcheck",
	            \ "github.com/jstemmer/gotags",
	            \ "github.com/klauspost/asmfmt/cmd/asmfmt",
	            \ "github.com/fatih/motion",
	            \ "github.com/zmb3/gogetdoc",
	            \ ]

手动用mirror安装依赖包:

	go get github.com/golang/tools/cmd/goimports
	go get github.com/golang/tools/cmd/guru
	go get github.com/golang/tools/cmd/gorename

## Golang零碎事项

### 换行

没错，在Go中换行是一个需要注意的问题。因为Go没有向C语言那样用";"作为一行代码的结束。因此有时候需要一些特别处理

例如1:

	 res, err := db.Execute("insert into Session set ItemID=?,ItemType=?,LoginOK=0,"+ 
			 "LoginErr=0,CreateTime=NOW(),LastConnect=NOW()", humanid, itemtype)

	 注意: 连接字符串的"+"必须在第一行，不然Go会以为第一行已经结束了

例如2

	err = db.QueryRow("select NickName, MailIdentify, TIMEDIFF(UnLockTime, NOW()) from "+ 
			"Human where HumanID=? and Passwd=SHA(?)",humanid, zainar.AddSalt(password, email)).
			Scan(&nickname, &realmail, &timewait)

	注意"."号必须位于第二行的行尾，原理同上

>吐槽: 在用Go做一些小东西过程中遇到这个问题, 突然发现整个编码过程中基本就没用的";", 突然感觉C中的";"好冗余。。

### 使用在其他包中定义的结构体

假设在包A中定义了:

	type  AA struct {
		X int
		Y int
		Z int
		x int
		y int
		z int
	}

当在B包使用时, 只能使用大写字母开头的成员(X Y Z):

	var xx A.AA

	xx.X = 1
	xx.Y = 2
	xx.Z = 3

	xx.x = 1 //报错, 因为小写字母开头的成员对外不可见，只能在A包中访问。

### 取消证书验证

golang的net/http中提供了http客户端client, 可以用client发起http操作。但是当目标是https时，client默认会检查证书。在做demo的时候，往往会做一个自己做一个临时证书, 因此需要关闭Client的证书检查。

这里有同样的问题: [https://groups.google.com/forum/##!topic/golang-nuts/TC5DVxYLjjg](https://groups.google.com/forum/#!topic/golang-nuts/TC5DVxYLjjg)

上述连接中，给出的解决方法:

	//Matthew R Chase 12-6-16

	import ("net/http"; "crypto/tls")
	//...
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify : true},   //
	}
	client := &http.Client{Transport: tr}
	resp, err := client.Get("https://someurl:443/)

经过实际验证可行！如下:

	tr := http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify:true}}
	client := http.Client{Transport: &tr}
	
	//用client发起访问:
	client.Post.....

>其实就是替换了默认的设置

## 参考

1. [vim-go][1]
2. [go get tools][2]
3. [gotag][3]
4. [gocode][4]
5. [lijiaocn vim][5]
6. [vim-go][6]
7. [vim-go author: fatih Arslan][7]
8. [vim-go tutorial][8]
9. [golang tools mirror][9]

[1]: https://github.com/fatih/vim-go "https://github.com/fatih/vim-go"
[2]: https://github.com/golang/go/wiki/GoGetTools "go get tools"
[3]: https://github.com/jstemmer/gotags "gotag"
[4]: https://github.com/nsf/gocode "gocode"
[5]: https://github.com/lijiaocn/vim "lijiaocn vim"
[6]: https://github.com/fatih/vim-go "https://github.com/fatih/vim-go"
[7]: https://www.patreon.com/fatih "https://www.patreon.com/fatih"
[8]: https://github.com/fatih/vim-go-tutorial "https://github.com/fatih/vim-go-tutorial"
[9]: https://github.com/golang/tools "https://github.com/golang/tools
