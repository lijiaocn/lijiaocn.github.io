---
layout: default
title: "Vim使用教程手册，命令、配置与插件"
author: 李佶澳
createdate: 2017/04/01 11:00:33
changedate: 2018/07/22 14:26:14
categories: 技巧
tags: linuxtool
keywords: vim,vim手册,vim插件,vimp配置,ide
description: vim的使用手册，包含常用的扩展方法，和一些非常有用的小技巧。

---

* auto-gen TOC:
{:toc}

## 摘要

2019-01-02 15:38:43：现在很多IDE都有vim插件，支持vim风格的编辑，相当赞。在看代码和写代码的时候，还是使用IDE的效率更高一些。但有时候只是写点代码片段，试验一些函数的用法，不值得的打开IDE、创建项目，还是用vim立马写比较方便。

--分割线--

Vim折腾过好多次, 耗费了不少时间和精力。但是没有办法，谁让自己对VIM的三种模式和HJKL四个键情有独钟呢？
而且轻量、简洁、奇妙，用了之后才会知道原来用简单的文本还可以做这么多的事情。在一个纯文本的SSH终端中,
用字符的组合完成各种事情, 有时候真是一种美妙的体验。虽然大脑记忆和肌肉记忆一起失效的时候, 也是很抓狂的...

在加上人懒，不愿在把键盘敲的火热的时候, 一只手在键盘和鼠标之间换来换去的, 那简直是不可忍受的！
因此, 虽然有一些功能不如那些臃肿的IDE, 但是为了享受敲击的快感, 忍了。

[我的vim配置](https://github.com/lijiaocn/Vim)

## 概览

下面是我在Windows上的VIM的文件结构。 

	|~__MyVimIDE/
	| |+bat/                        #自己撰写的便捷的脚本
	| |+cscope/                     #Linux程序员应该知道的
	| |+ctags/                      #Linux程序员应该知道的
	| |~gvim74/                     #这里才是vim的主体
	| | |+vim74/                    #windows版的gvim安装文件, 保留不动
	| | |~vimfiles/                 #这里才是定制的主体
	| | | |+autoload/               #管理其它插件的插件, pathongen.vim, 非常重要, 插件再也不乱了
	| | | |~bundle/                 #这个下面就是全部的定制插件，每个插件一个目录
	| | | | |+a.vim/
	| | | | |+bandit/
	| | | | |+c.vim/
	| | | | |+code_complete/
	| | | | |+conque-read-only/
	| | | | |+cscope.vim/
	| | | | |+cscope/
	| | | | |+cscope_maps/
	| | | | |+DrawIt/
	| | | | |+FencView.vim/
	| | | | |+go/
	| | | | |+gocode/
	| | | | |+mark/
	| | | | |+minibufexpl/
	| | | | |+neocomplcache/
	| | | | |+neosnippet/
	| | | | |+nerdtree/
	| | | | |+slimv/
	| | | | |+syntastic/
	| | | | |+tagbar/
	| | | | |+taghighlight/
	| | | | |+template.vim/
	| | | | |+vim-markdown/
	| | | | |+vim-snippets/
	| | | | `+vimwiki/
	| | | |+config/               # 这里是对插件的配置, 配置再也不乱了
	| | | | |-a.vimrc
	| | | | |-autotags.vimrc
	| | | | |-c.vimrc
	| | | | |-code_complete.vimrc
	| | | | |-doxygen.vimrc
	| | | | |-golang.vimrc
	| | | | |-markdown.vimrc
	| | | | |-minibufexpl.vimrc
	| | | | |-neocomplcache.vimrc
	| | | | |-neosnippet.vimrc
	| | | | |-nerdtree.vimrc
	| | | | |-quickfix.vimrc
	| | | | |-slimv.vimrc
	| | | | |-tagbar.vimrc
	| | | | |-timestamp.vimrc
	| | | | |-vim.vimrc
	| | | | `-vimwiki.vimrc
	| | | |+snippets/
	| | | |+template/
	| | | `-README.markdown
	| | |-_vimrc                 # 这是windows下gvim自带的, 保留不动
	| | `-vimrc                  # 这是定制的配置文件, 里面调用了每个插件的配置

## 搜索

在当前目录下所有后缀为.php的文件中搜索:

	:vimgrep /the menu/ *.php

在当前目录的子目录includes中的所有后缀为.php的文件中搜索:

	:vimgrep /the menu/ ./includes/*.*

在当前目录及其子目录中查找:

	:vimgrep /the menu/ **/*.*


## VIM原生功能

VIM本身功能就非常的丰富, 应当尽量使用VIM原生的功能, 尽量避免使用插件。插件过多会直接导致vim的响应变慢。

vim自身的配置,vim.vimrc:

	"#######################################
	"
	"           对vim本身的配置
	"
	"#######################################

	"########  鼠标  ########
	set mouse=v

	"########  兼容性  ########
	"为了使用vim的一些特性，设置为不兼容vi
	set nocp

	"########   编码   ########
	"菜单语言编码
	set langmenu=en_US.utf-8

	"消息语言编码,与vim内部编码一致,不然提示信息乱码
	language message en_US.utf-8

	"终端使用的编码
	set termencoding=en_US.utf-8

	"vim内部使用编码 
	set encoding=utf-8

	"########  文件   #########
	"默认文件编码,新建一个文件时采用的编码
	set fileencoding=utf-8

	"打开一个文件时,按照给出的顺序探测文件编码
	""set fileencodings=gbk,utf-8
	set fileencodings=utf-8,gbk,cp936,ucs-bom,big5,euc-jp,euc-kr,latin1,gb18030,default

	"开启文件类型检测
	filetype plugin indent on

	"####### 个性化  ##########
	"设置tab占用4个空格
	set tabstop=4

	"将tab键转换成空格
	"set expandtab

	"when delete a tab replaced by 4 banks,just put backspace one time
	set smarttab

	"开启智能缩进,类似于C语言的缩进
	set smartindent

	"open c/c++ auto indent
	"in visual mode,choose texts ,then push =,the text will be auto indent
	set cindent

	"开启自动缩进,下一行使用与上一行同样的缩进
	set autoindent

	"auto indentation width
	set shiftwidth=4

	" 显示括号配对情况
	set showmatch 

	"设置一行的最大字符数,超过时将被分成两行
	"set textwidth=80

	"显示行号
	set number

	"when use Tab to autocomplete, show in a single line 
	set wildmenu

	"show the curser's positon ,at which line and which column
	set ruler

	"开启语法高亮
	syntax on

	"colorscheme
	:colors murphy

	"highlight the search keyword
	set hlsearch

	"real-time search,搜索时实时显示匹配字符
	set incsearch 

	"开启状态栏信息
	set laststatus=2                          

	"命令行的高度，默认为1，这里设为2
	set cmdheight=2

	"close the preview windows of completeopt
	set completeopt=longest,menu

	" 状态行显示的内容 [包括系统平台、文件类型、坐标、所占比例、时间等]
	set statusline=%F%m%r%h%w\ [FORMAT=%{&ff}]\ [TYPE=%Y]\ [POS=%l,%v][%p%%]\ %y%r%m%*%=\ %{strftime(\"%d/%m/%y\ -\ %H:%M\")}

	" 突出显示当前行
	set cursorline              

	"显示Tab符，使用一高亮竖线代替
	set list
	set listchars=tab:\|\ ,

	"设定文件浏览器目录为当前目录
	set autochdir 

	"写入文件之前备份一份,写入成功后删除备份
	set writebackup

	"不保存备份文件"
	set nobackup

	"每行超过80个的字符用下划线标示
	""au BufRead,BufNewFile *.wiki,*.md,*.asm,*.c,*.cpp,*.java,*.cs,*.sh,*.lua,*.pl,*.pm,*.py,*.rb,*.hs,*.vim 2match Underlined /.\%81v/
	au BufRead,BufNewFile *.* 2match Underlined /.\%81v/

## 原生扩展

这里实际上自己实现的插件

quickfix.vimrc:

	"######################################
	"
	"     quickfix功能的配置
	"
	"######################################

	"可以将QuickfixToggle映射到快捷键,方便Quickfix窗口的打开/关闭
	let g:QuickfixOpen=0
	function! QuickfixToggle()
		if g:QuickfixOpen
			:cclose
			let g:QuickfixOpen=0
		else
			:botright copen
			let g:QuickfixOpen=1
		endif
	endf

timestamp.vimrc:

	"###################################
	"
	"     自动填写文件创建和修改时间 
	"
	"###################################

	"特别注意这里的正则表达式,'\'需要使用'\'进行转义,不同于直接在命令模式执行!
	"这个问题折腾了近乎一晚上才发现!!
	function! TimestampUpdate()
		exec ":% s#修改时间: \\d\\{4}\/\\d\\{2}\/\\d\\{2} \\d\\{1,2}:\\d\\{2}:\\d\\{2}#\修改时间: ".strftime('%Y\/%m\/%d %H:%M:%S')
	endfun

	autocmd BufWritePre,FileWritePre *.wiki  ks|call TimestampUpdate()|'s
	autocmd BufWritePre,FileWritePre *.md  ks|call TimestampUpdate()|'s

## 插件管理

以前折腾的时候, 试用过很多插件, 到最后自己也不知道都安装了多少插件, 混乱不堪，一度放弃。并一直对没有顺手的IDE这件事耿耿于怀。有一天再次折腾的时候, 看到了别人推荐的pathogen.vim, 安装了之后, 只需把其它的插件放到指定目录就可以了。

[http://www.vim.org/scripts/script.php?script_id=2332 ](http://www.vim.org/scripts/script.php?script_id=2332)

[http://www.vim.org/scripts/script.php?script_id=2332 ](http://www.vim.org/scripts/script.php?script_id=2332)


## 配置管理

Vim和插件都是可以有很多种配置的。最早全部配置都写在vimrc(linux中为.vimrc)文件中, 各种配置杂乱在一起, 经常出现重复配置，以及搞不清谁是谁。后来发现vimrc中可以包含其它的配置文件, 于是把插件的配置拆分到单独的文件中。从此就清净了许多。

我的vimrc(部分):

	" Last Change: 2012-09-14 16:59:38 星期五

	source E:/__MyVimIDE/gvim74/vimfiles/config/vim.vimrc
	source E:/__MyVimIDE/gvim74/vimfiles/config/a.vimrc
	source E:/__MyVimIDE/gvim74/vimfiles/config/autotags.vimrc
	source E:/__MyVimIDE/gvim74/vimfiles/config/doxygen.vimrc
	source E:/__MyVimIDE/gvim74/vimfiles/config/minibufexpl.vimrc
	source E:/__MyVimIDE/gvim74/vimfiles/config/quickfix.vimrc
	source E:/__MyVimIDE/gvim74/vimfiles/config/slimv.vimrc
	source E:/__MyVimIDE/gvim74/vimfiles/config/timestamp.vimrc
	source E:/__MyVimIDE/gvim74/vimfiles/config/vimwiki.vimrc
	source E:/__MyVimIDE/gvim74/vimfiles/config/tagbar.vimrc
	source E:/__MyVimIDE/gvim74/vimfiles/config/nerdtree.vimrc
	source E:/__MyVimIDE/gvim74/vimfiles/config/neocomplcache.vimrc
	source E:/__MyVimIDE/gvim74/vimfiles/config/neosnippet.vimrc
	source E:/__MyVimIDE/gvim74/vimfiles/config/code_complete.vimrc
	source E:/__MyVimIDE/gvim74/vimfiles/config/c.vimrc
	source E:/__MyVimIDE/gvim74/vimfiles/config/golang.vimrc
	source E:/__MyVimIDE/gvim74/vimfiles/config/markdown.vimrc

## 日常使用

这部分插件是一些很实用，与coding无关的插件。

### pathogen

[http://www.vim.org/scripts/script.php?script_id=2332 ](http://www.vim.org/scripts/script.php?script_id=2332)

[https://github.com/tpope/vim-pathogen ](https://github.com/tpope/vim-pathogen)

第一个必须是管理插件的插件！

配置, 在vimrc中添加:

	call pathogen#infect()

### markdown

[https://github.com/tpope/vim-markdown ](https://github.com/tpope/vim-markdown)

从名字就可以看出来，这个是用来支持markdown语法的。markdown的插件很多,试过很多个, 有的高亮会出错, 有的则是太庞大, 导致操作很慢。这里给出的这个是感觉比较合适的。

配置,在markdown.vimrc中:

	"vim-markdown中只判断这个变量是否存在，如果存在开启折叠, 否则不开启
	let g:markdown_folding 

### DrawIt

[https://github.com/vim-scripts/DrawIt.git ](https://github.com/vim-scripts/DrawIt.git)

DrawIt插件使用户可以Vim中画出各种图形.例如:

	
	                                    *******   
	                                 ***       ***
	    +----------+                    *******                   +----------+
	    |          |__                     .                     >|          |
	    +----------+  \_                  /_\                  -/ +----------+
	                    \_                 |                 -/   
	                      \_               |               -/   
	                        \_             |             -/       
	                          \_     *************     -/         
	                            \_***             ****/           
	                                 *************    

配置:

	使用默认配置

### conque

[http://code.google.com/p/conque/ ](http://code.google.com/p/conque/)  需要翻墙..

使用conque插件可以直接在vim中执行交互式命令，例如bash.

该插件需要python. 在linux中使用时非常方便, 例如可以将vim分成两屏, 一边是正在写的脚本, 另一边是shell.

配置:

	使用默认配置

### bufexplore 与 minibufexpl

bufexplore [http://www.vim.org/scripts/script.php?script_id=42 ](http://www.vim.org/scripts/script.php?script_id=42)

minibufexpl [https://github.com/fholgado/minibufexpl.vim ](https://github.com/fholgado/minibufexpl.vim)

查看打开的文件, bufexplore是通过命令\be \bs \bv在新窗口查看, minibufexpl则是在顶部自动开启一个窄条显示所有打开的文件

配置,minibufexpl.vimrc:

	"防止minibufexpl和其它的插件配合不好，导致出现多个minibuf窗口
	let g:miniBufExplorerMoreThanOne = 0


### mark

[http://www.vim.org/scripts/script.php?script_id=2666 ](http://www.vim.org/scripts/script.php?script_id=2666)


这个文件格式vmb.gz, 需要用以下方式安装:

	//name是插件名, name.vba 或者name.vmb.gz
	//bundle/name是目标目录
	:e name.vba
	:!mkdir ~/.vim/bundle/name
	:UseVimball ~/.vim/bundle/name

配置:

	使用默认配置

### nerdtree

[https://github.com/scrooloose/nerdtree ](https://github.com/scrooloose/nerdtree)

nerdtree替换了vim原来的目录浏览结构, 支持树的结构

配置,nerdtree.vimrc:

	"##############################
	"
	"      NERDTree的配置
	"
	"#############################

	"打开一个文件时自动关闭目录窗口
	let g:NERDTreeQuitOnOpen=1

	"将目录窗口显示在左边
	let g:NERDTreeWinPos='left'

	"设置目录窗口的宽度
	let g:NERDTreeWinSize=4

### template

[http://www.vim.org/scripts/script.php?script_id=2834 ](http://www.vim.org/scripts/script.php?script_id=2834)

[https://github.com/thinca/vim-template ](https://github.com/thinca/vim-template)

template是一个模板插件, 在新建一个满足制定条件的文件时, 会自动插入模板内容, 非常方便。

模板文件位于vimfiles/template目录中

配置:

	使用默认配置

## 程序开发

程序开发需要: 项目管理、自动提示、语法高亮、快速跳转等

但是搭配程序开发插件时, 需要清楚一点, 有一些开发项目是天生不适合用vim的, 例如java系列、windows程序开发, 用vim做这些事情绝对是陷入了地狱, 还是乖乖的用IDE为好。

### 项目管理插件

项目管理需要完成对代码目录的统一管理、对编译过程的统一管理、对代码文件属性的统一管理(例如编码统一、tab/空格的约定)

用Vim进行项目管理时这些工作都需要自己完成。是自己动手进行项目管理，还是使用IDE实现傻瓜式管理, 是一个因人而异的问题。

>好消息是Go语言已经在语言层面对代码的目录结构做出了统一要求, 只需要按照要求组织代码文件, 就可以使用go的编译器编译。GO对代码目录的统一和编译的自动化, 减少了对IDE的依赖, 利好vim。这个应该是趋势。

#### project

[http://www.vim.org/scripts/script.php?script_id=69 ](http://www.vim.org/scripts/script.php?script_id=69)

project是一个vim上的项目管理插件, 按照约定的格式编写一个项目文件, 方便在项目间的快速切换。

project实际上是对目录浏览功能的扩展。

>个人感觉这个插件必要性不是很大, 因我是直接到项目目录下查看文件, 使用项目文件反而增加了复杂性. 这里提到project仅仅是作为一个备忘。

### C相关插件

做linux C开发时, 最需要的有: 语法高亮、源文件与头文件的快速切换、自动补全、代码片断。

#### Csupport

[http://www.vim.org/scripts/script.php?script_id=213 ](http://www.vim.org/scripts/script.php?script_id=213)

[https://github.com/WolfgangMehner/vim-plugins ](https://github.com/WolfgangMehner/vim-plugins)

Csupport是一款非常强大的插件, 包含了很多功能, 因此在安装其它插件时最好先看一下Csupport是否已经具备这样的功能了。

安装后第一次启动时候，会提示道 $homn/vimfiles/c-support/templates中配置模板文件Templates, 如下:

	§ =============================================================
	§  User Macros
	§ =============================================================

	SetMacro( 'AUTHOR',      'lja' )
	SetMacro( 'AUTHORREF',   'x' )
	SetMacro( 'COMPANY',     'x' )
	SetMacro( 'COPYRIGHT',   'Copyright (c) |YEAR|, |AUTHOR|' )
	SetMacro( 'EMAIL',       'x' )
	SetMacro( 'LICENSE',     'GNU General Public License' )
	SetMacro( 'ORGANIZATION','x' )

	§ =============================================================
	§  File Includes and Shortcuts
	§ =============================================================

默认快捷键(支持的非常多,详情查看帮助文件):

	\hp  查看csupport帮助文件
	\im  插入main函数
	\if  新建函数
	\id  插入do..while
	\ss  插入switch
	\pg  插入include

\后的第一个字母代表操作种类:

	h: help           帮助相关
	c: comment        注释相关 
	s: statements     插入控制流,if else等
	i: idioms         惯用语
	p: preprocessor   预处理相关
	n: snippets       代码片段
	+: c++            c++相关
	r: run            运行相关

csupport值的好好研究, 而且作者还开发了很多对其它的语言的支持，神一般的人物...

见 [https://github.com/WolfgangMehner/vim-plugins ](https://github.com/WolfgangMehner/vim-plugins)

#### a.vim 

[http://www.vim.org/scripts/script.php?script_id=31 ](http://www.vim.org/scripts/script.php?script_id=31)

比较奇怪的是cuspport没有实现自己的源文件与头文件切换, 而是用了a.vim, 因此需要安装a.vim

配置, a.vimrc

	"###################################
	"
	"     a.vim的配置
	"
	"###################################

	"a.vim 搜索路径
	let g:alternateSearchPath='./include'

#### tagbar

[http://www.vim.org/scripts/script.php?script_id=3465 ](http://www.vim.org/scripts/script.php?script_id=3465)

[https://github.com/majutsushi/tagbar ](https://github.com/majutsushi/tagbar)

tagbar是用来进行标签跳转。需要系统上安装有ctags程序。

如果要在包含多个文件的项目中使用, 需要首先用ctags命令生成整个项目的tags文件, 然后加载。因此如果修改了文件之后, 需要重新手动生成tags文件。

>个人认为只适合在单个文件内跳转, 以及方便查看文件内成员情况, 如果需要复杂跳转, 还是用IDE比较好。

配置,tarbar.vimrc

	"####################################
	"
	"       Tagbar的配置
	"
	"####################################
	"焦点自动移动到Tag
	let g:tagbar_autofocus = 1
	"跳转到一个tag是否关闭tag窗口
	let g:tagbar_autoclose = 0
	"默认左边窗口
	let g:tagbar_left = 1

### python相关插件

waiting...

### go相关插件

waiting...

### 关于补全

vim本身支持基于字符的补全, 这样的补全缺少语法上的分析，因此对于程序开发显然是不够的。(很多补全插件都存在这个问题)

在网上发现了两款基于语法的补全插件: clang_complete 和 YouCompleteMe

[https://github.com/Rip-Rip/clang_complete ](https://github.com/Rip-Rip/clang_complete)

[https://github.com/Valloric/YouCompleteMe ](https://github.com/Valloric/YouCompleteMe)

clang_complete支持 C、C++、Objective-C、Objective-C++。

YouCompleteMe支持的语言更为丰富。

下面是关于YouCompleteMe的两篇博客:

[vim中的杀手级插件: YouCompleteMe ](http://zuyunfei.com/2013/05/16/killer-plugin-of-vim-youcompleteme/)

[Vim自动补全神器–YouCompleteMe ](http://blog.marchtea.com/archives/161)

#### YouCompleteMe

[https://github.com/Valloric/YouCompleteMe ](https://github.com/Valloric/YouCompleteMe)

(2019-01-02 15:28:49) 现在用brew安装的vim，默认已经是8.X的版本了，不要换成macvim，macvim和UltiSnips插件不配套，见：
[Mac系统升级后，Vim中的UltiSnip插件出错：No module named UltiSnips](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2019/01/02/vim-ultisnip-plugin-python3.html)

YCM需要7.4的vim，在mac系统上可以通过下面的命令升级 [Mac自带的Vim怎么升级？](https://www.zhihu.com/question/34113076)：

	brew install vim --with-lua --with-override-system-vi

更多参数通过`brew info vim`查看，例如支持python3：

	—with-python3

或者使用YCM推荐的macvim:

	brew install macvim    //YCM推荐使用macvim

在macOS上安装：

	brew install cmake
	cd .vim/bundle
	git clone https://github.com/Valloric/YouCompleteMe.git

如果要支持C系列语言：

	cd ~/.vim/bundle/YouCompleteMe
	git submodule update --init --recursive
	./install.py --clang-completer

否则：

	cd ~/.vim/bundle/YouCompleteMe
	./install.py

如果需要支持其它语言，使用对应的参数：

	--go-completer   //go
	--js-completer   //js
	--rust-completer //rust
	--all            //所有支持的语言


## 自行设置配色

自动补全(c-x,c-0)的提示菜单的选中颜色不理想。想办法配置。

首先可以从 /usr/share/vim/vim73/colors/中拷贝一个配置文件修改修改的基础， 复制到 .vim/colors/中。这里命名为lijiaocn.vim

我不知道提示菜单的配色语法是什么，所以从:help中开始查找, 顺序如下:。

	:help 
		--> usr_06.txt  Using syntax highlighting
			--> 06.3.2  中找到配色语法: 
			        term            attributes in a B&W terminal
			        cterm           attributes in a color terminal
			        ctermfg         foreground color in a color terminal
			        ctermbg         background color in a color terminal
			        gui             attributes in the GUI 
			        guifg           foreground color in the GUI 
			        guibg           background color in the GUI     
			        但这时候还不知道提示菜单对应Tag
	百度到提示菜单的名称为Pmenu, 到/usr/share/vim/vim73/中搜索，在doc/tags中找到了Pmenu
				hl-Pmenu|       syntax.txt| /*hl-Pmenu*
				hl-PmenuSbar    syntax.txt  /*hl-PmenuSbar* 
				hl-PmenuSel     syntax.txt  /*hl-PmenuSel*
				hl-PmenuThumb   syntax.txt  /*hl-PmenuThumb*
		-->syntax.txt中找到了说明:
			Pmenu           Popup menu: normal item.
			PmenuSel        Popup menu: selected item.
			PmenuSbar       Popup menu: scrollbar.
			PmenuThumb      Popup menu: Thumb of the scrollbar.


还不知道都有哪些颜色可以用

		:runtime syntax/colortest.vim     <--显示所有配色效果

最后编辑在lijiaocn.vim增加配色:

	hi PmenuSel     ctermfg=green ctermbg=yellow 
	hi PmenuThumb   ctermfg=white ctermbg=blue 
	hi PmenuSbar    ctermfg=blue ctermbg=white

在.vimrc中将配色方案修改为lijiaocn

[最终的配色文件](https://github.com/lijiaocn/Vim/tree/master/.vim/colors)

## 模式匹配

### 贪婪与非贪婪匹配

贪婪匹配：
	/a.*b

非贪婪匹配:

	/a.\{-}b
	

## 实用技巧

### vim粘贴时取消自动缩进

	:set paste

重启开启：

	:set nopaste
