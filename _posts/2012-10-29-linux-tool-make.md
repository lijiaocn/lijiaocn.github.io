---
layout: default
title: "make：编译管理工具make与makefile"
author: 李佶澳
createdate: 2012/10/29 10:24:34
last_modified_at: 2018/07/22 14:57:40
categories: 技巧
tags: linuxtool
keywords: makefile,linux,make
description: 收集了在一些项目中遇到的Makefile的语法、变量、函数等。

---

## 目录
* auto-gen TOC:
{:toc}

## 摘要

Makefile用于工程管理。

## 规则 

每条规则中的命令和操作系统Shell的命令行是一致的。

make会按顺序一条一条的执行命令，命令如果单起一行，必须以`Tab键`开头，如果不单起一行，用分号`;`规则分开。

## 内置变量

	$@    目标文件集
	$(@D) 目标文件路径的目录部分
	$%    仅当目标文件时一个静态库文件时，代表一个静态库的一个成员名
	$<    第一个依赖文件名
	$?    所有比目标文件新的依赖文件列表。 如果目标是静态库文件，代表库成员。
	$^    所有依赖文件列表
	$+    所有依赖文件列表，保留了依赖文件中重复出现的文件
	$*    目标模式中%代表的部分("茎")，文件名中存在目录时，也包含目录部分
	$(*F)    目标“茎”中的文件名部分
	$(*D)    目标"茎"中的目录部分
	-        用在command前面，忽略命令执行时的错误。如果发生错误,继续执行makefile
	$$$$     随机编号
	vpath        选择性搜索，为符合pattern的文件指定搜索路径dir,vpath pattern dir
	CURDIR       make的工作目录 
	MAKEFLAGS    命令行选项

## 语法 

```bash
	空格          在makefile中不要为了美观而进行缩进，或者使用空格间隔变量,空格是makefile语法的一部分
	:=            定义直接展开式变量
	?=            如果变量未定义则赋予后面的值，否则什么都不作
	=             定义递归展开式变量
	@             规则的命令行以@开头，表示不打印出该条命令
	unexport      不将变量传递给子makefile
	export:       当一个变量使用export进行声明后，变量和它的值将被加入到当前工作的环境变量中，以后make执行的所有规则的命令都可以使用这个变量。
	SHELL         特殊变量，默认传递给子makefile，注意该变量没有使用系统环境变量中的定义，GNUmake默认值为/bin/sh
	MAKEFLAGS     最上层make的命令行选项会被自动的通过环境变量MAKEFLAGS传递给子make进程。
	MAKEFILES     make执行时首先将此变量的值作为需要读入的Makefile文件
	MAKECMDGOALS  记录命令行参数指定的终极目标列表
	VPATH         依赖文件搜索路径，用":"分隔
	多目标规则    一个文件可以作为作为多个规则的目标(多个规则中只能有一个规则定义命令)。以这个文件为目标的规则的所有依赖文件将会被合并成此目标的一个依赖文件列表。
	.PHONY:name   将name声明为伪目标,伪目标指的是不真正生成目标文件,只是为了执行后面的指令
	.SILENT       创建.SILENT依赖列表中的文件时，不打印重建这些文件时使用的命令，例如  .SILENT : all
	$()和${}      取出变量值
	$$            表示一个$符号，因为$在makefile中具有特殊含义，所以要使用$字符时，需要使用$$，类似于C语言中的转义字符
	override      不使用命令行中定义的同名变量替代该变量，对使用override定义的变量追加值时，也需要使用override
	define        多行定义,如下varname是变量名，value1 value2是分行写的value的组成部分,以endef结束 
	               define varname
	               value1
	               value2
	               endef
	ifeq          判断关键字是否相等，四种格式： 
	               ifeq (ARG1, ARG2)    
	               ifeq 'ARG1' 'ARG2
	               ifeq "ARG1" 'ARG2'
	               ifeq 'ARG1' "ARG2"
	shell command  返回command命令在shell中执行的结果（类似于shell脚本中的`command`），注意大小写的含义不同，大写的SHELL是一个特殊变量
	export        将变量添加到当前工作环境，传递给子makefile，不覆盖子makefile中的同名变量(除非是-e选项)。没有使用export的变量（除了一些特殊变量）不传递给子makefile
	
	单行命令与多行命令的区别
	
	               makefile的规则的命令行中，每一行命令在一个独立的子shell进程中被执行。
	               上一行中使用的cd命令不会改变下一行命令的工作目录。可以使用\将一行命令多行排版(与C语言中的\符号作用类似)
	
	.d文件         GNU组织建议为每一个“name.c”的文件都生成一个“name.d'的文件，存放.c文件的依赖关系
	               %.d: %.c
	                   @set -e; rm -f $@; \
	                   gcc -MM $< > $@.$$$$; \
	                   sed 's/\($*\)\.o[ :]*\1.o $@ :/g' < $@.$$$$ > $@; \
	                   rm -f $@.$$$$
	
	FORCE         没有依靠关系也没有命令的规则被认为总是新的,如下面的FORCE
	               clean:FORCE
	                   rm *.o
	               FORCE:
	
	include        make暂停读取当前的Makefile,转去读取include指定的一个或者多个文件，完成以后继续当前Makefile的读取

```

## 内置函数

	origin      $(origin VARIABLE)  查询变量VARIABLE的出处
	            返回值: 1 undefined 2 default 3 environment 4 environment override 5 file 6 command line 7 override 8 automatic 
	if         $(if CONDITION,THEN-PART[,ELSE-PART])
	filter-out  $(filter-out PATTERN...,TEXT) 保留TEXT中不符合PATTERN的内容
	filter      $(filter PATTERN...,TEXT) 取出TEXT中符合PATTERN的内容
	dir         取目录函数
	notdir      取文件名函数
	subst       $(subst from,to,text)  把text中的from替换成to
	call        $(call VARIABLE,PARAM,PARAM),  参数将会依次赋值给临时变量$(1) $(2)等
	firstword   firstword NAMES  取首单词函数
	wildcard    $(wildcard PATTERN)  获取当前目录下符合模式PATTERN的文件名
	patsubst    $(patsubst PATTERN,REPLACEMENT, TEXT) 把TEXT中以空格分隔的、符合模式PATTERN单词替换为REPLACEMENT
	error       产生致命错误, $(error Text)
	$(VAR:x=y)  把var中符合%x的替换成%y
	strip       去掉行首和行尾的空字符和行中重复的空字符
	findstring  $(findstring FIND,IN) 在IN中存在FIND返回FIND，否则返回空
	foreach     $(foreach var,list.text) 展开var和list，不展开text，依次把list中空格分割的值赋给var，然后执行text。类似于for循环。
	eval        $(eval XX) eval将XX展开一次，Makefile会将XX再次展开一次。
	sort        $(sort XX XX XX) 排序和去掉重复的内容
	words       $(words, XX XX) 统计单词个数

## 控制结构 

ifeq:

	ifeq(XXX,XXX)
	command
	else 
	command
	endif
	
	注意command前面不要有TAB键!

ifneq: 同ifeq

ifdef:

ifndef:


## 不依赖任何文件

	$(CRUDIR)/Makefile Makefile: ;

linux3.2.12/Makefile 表示这个Makefile没有任何依赖文件

## 文献

1. 跟我一起写makefile
2. GNU+make中文手册
3. [GNU make manual][3]

[3]: https://www.gnu.org/software/make/manual/ "GNU make manual"
