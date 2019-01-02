---
layout: default
title: "Mac系统升级后，Vim中使用的UltiSnip插件出错：Error No module named UltiSnips"
author: 李佶澳
createdate: "2019-01-02 14:48:14 +0800"
changedate: "2019-01-02 14:48:14 +0800"
categories: 问题
tags: 问题
keywords: UltiSnips,vim,macvim
description: "mac升级后，安装了ultisnips的插件的vim不好使了，键入字符时弹出下面的错误`No module named UltiSnips`"
---

* auto-gen TOC:
{:toc}

## 说明

mac升级后，安装了ultisnips的插件的vim不好使了，具体是那次升级记不准了，当时忙其它事情，直接把插件删了。

没有了UltiSnips插件，用vim写的代码片段的时候，还挺不方便的，尤其是经常忘记各种语言的语法格式... 

经常在各种编程语言之间切换时，UltiSnips的补全还是挺有用的，可以快速唤起沉睡在脑海中的语法记忆。

下面是用macvim时遇到的问题，换了原生的vim后，所有问题都消失了，当初使用macvim的原因见最后一节。

##  现象1：No module named UltiSnips

键入字符时弹出下面的错误`No module named UltiSnips`：

```bash
Error detected while processing /Users/lijiao/Work-Finup/vim-config/.vim/bundle/ultisnips/autoload/UltiSnips.vim:
line    8:
Traceback (most recent call last):
Press ENTER or type command to continue
Error detected while processing /Users/lijiao/Work-Finup/vim-config/.vim/bundle/ultisnips/autoload/UltiSnips.vim:
line    8:
  File "<string>", line 1, in <module>
Press ENTER or type command to continue
Error detected while processing /Users/lijiao/Work-Finup/vim-config/.vim/bundle/ultisnips/autoload/UltiSnips.vim:
line    8:
ImportError: No module named UltiSnips
Press ENTER or type command to continue
```

把[ImportError: No module named UltiSnips #244](https://github.com/SirVer/ultisnips/issues/244)一路看完，说是符号链接的问题，我的`.vim`和`.vimrc`文件是两个符号链接，连接到了位于其它目录中.vim。

## 现象2： NameError: name 'UltiSnips_Manager' is not defined

把.vim和.vimrc直接移动到`~/`目录后，原先的错误没有了，但是有了新的错误`NameError: name 'UltiSnips_Manager' is not defined`：

```bash
Error detected while processing function UltiSnips#TrackChange:
line    1:
Traceback (most recent call last):
Error detected while processing function UltiSnips#TrackChange:
line    1:
  File "<string>", line 1, in <module>
Press ENTER or type command to continue
Error detected while processing function UltiSnips#TrackChange:
line    1:
NameError: name 'UltiSnips_Manager' is not defined
Press ENTER or type command to continue
Error detected while processing function UltiSnips#TrackChange:
line    1:
Traceback (most recent call last):
Press ENTER or type command to continue
```

[Vim with two dynamic python #469](https://github.com/SirVer/ultisnips/issues/469)中ultisnips的作者回复说，这是使用了python2的缘故，`UltiSnips should default to python3`。

按照[ltiSnips.txt#L114](https://github.com/SirVer/ultisnips/blob/master/doc/UltiSnips.txt#L114)的方法检查了一下，当前使用的macvim只支持python2，如果通过下面的参数设置使用python3，打开的时候会出错：

```vim
	let g:UltiSnipsUsePythonVersion=3。
```

UltiSnips会告知python3不可用：

```
UltiSnips: the Python version from g:UltiSnipsUsePythonVersion (3) is not available.
```

## 最后的解决方法：换用原生的vim

换用原生的vim：

```
brew unlink macvim
brew install vim 
```

换完之后一切正常，并且`~/.vim`是符号链接也没有问题了。

之前从vim切换成macvim，是因为YCM插件对vim版本要求比较高，当时brew默认安装的vim版本还比较低，和YCM插件不匹配，现在默认vim版本已经是8.X，可以换回原生vim了。

当时情况见[Vim使用手册：YouCompleteMe](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/04/01/linux-tool-vim.html#youcompleteme)

## 参考

1. [Vim使用教程手册，命令、配置与插件][1]

[1]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/04/01/linux-tool-vim.html "Vim使用手册"
