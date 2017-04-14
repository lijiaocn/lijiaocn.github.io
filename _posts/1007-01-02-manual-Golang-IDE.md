---
layout: default
title: Golang-IDE
author: lijiaocn
createdate: 2017/04/11 13:07:24
changedate: 2017/04/11 14:02:27
categories:
tags: 手册
keywords: Golang,IDE,vim-go
description: 找到一个适合自己的IDE，是开启快乐开发工作的第一步。

---

* auto-gen TOC:
{:toc}

## vim 

可以直接使用[lijiaocn's vim][3]，它已经将常用的一些vim做了打包，包含了vim-go等插件。

安装lijiaocn's vim后，直接按“F12”，就可以打开左侧边栏。对于.go文件，本地需要有gotags命令:

	go get -u github.com/jstemmer/gotags

### vim-go使用

[vim-go][1]是vim的一个golang全家桶插件，提供了很多非常实用的命令。

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

vim-go的作者[fatih][4]专门写了一个[教程][5]。

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

好在github上有mirror, [https://github.com/golang/tools](https://github.com/golang/tools)，修改vim-go的plugin目录下go.vim中的依赖包:

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

## 参考

1. [golang tools][1]
2. [vim-go][2]
3. [lijiaocn's vim][3]
4. [vim-go author: fatih Arslan][4]
5. [vim-go tutorial][5]

[1]: https://github.com/golang/tools "https://github.com/golang/tools"
[2]: https://github.com/fatih/vim-go "https://github.com/fatih/vim-go"
[3]: https://github.com/lijiaocn/Vim "https://github.com/lijiaocn/Vim"
[4]: https://www.patreon.com/fatih "https://www.patreon.com/fatih"
[5]: https://github.com/fatih/vim-go-tutorial "https://github.com/fatih/vim-go-tutorial"
