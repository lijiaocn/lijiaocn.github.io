---
layout: default
title: "排版工具 LaTeX 的安装使用和简明排版语法"
author: 李佶澳
date: "2021-12-08 14:38:31 +0800"
last_modified_at: "2021-12-10 11:12:50 +0800"
categories: 编程
cover:
tags:
keywords: LaTeX,tex
description: TeX 是 Donald Knuth 开发的排版工具，将带有排版指令的文本文件转换成 pdf 等
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

TeX 是 Donald Knuth 开发的排版工具，将带有排版指令的文本文件转换成带有格式的 pdf 等文件。

LaTeX 与 TeX 的关系：LaTeX 是一个排版设计工具，它的指令被翻译成更底层的 TeX 指令。Tex 是一个命令行程序，LaTeX 提供的 TeXShop 是一个封装了 TeX 的 GUI 应用，

## 安装

mac 上安装 Latex 编辑器 [mactex][2]：

```sh
brew install mactex
```

安装完成后，找名为 TeXShop 的应用，打开，即可编写 Latex 文件。

![TeXShop 编辑界面]({{ site.article }}/latex-1.png)

输入文本：

```tex
%!TEX program = xelatex
\documentclass{article}  
\usepackage[UTF8]{ctex}  
\begin{document}  
Hello，中国！
\end{document}
```

使用快捷键盘：Command+t

tex 命令位于：

```sh
ls  /usr/local/texlive/2021/bin/universal-darwin/
```


## 基本元素

LaTeX 当前的主线版本是 LaTeX2（1985 年的 2.0.9 是第一个广泛使用的版本），[LaTeX 2ε for authors][3] 介绍了 LaTeX2 定义的新格式和提供的新指令，下一代 LaTeX3 的规划是一个还在进行中的长期工程。

[LaTeX 2ε for authors][3] 只介绍了新的特性，要系统了解 LaTeX 需要阅读 1994 年出版的 《LaTeX: A Document Preparation System》。

LaTeX 支持的字符：

	字母和数字        a-z A-Z 0-9 
	十六个标点符号    . : ; , ? | ` ' ( ) [ ] - / * @ 
	十个特殊字符      # $ % & ~ _ ^ \ { }
	五个运算符        + = | < >

>注意；左引号用 `，右引号用 '，双引号同理。

LaTeX 对空格的处理：

	连续的多个空格被视作是一个空格
	空白行（只有空格的行）做视作段落的结束

### LaTeX 文档设置

\documentclass 指令选择文档class，{ } 内是选择的 class ：

```tex
\documentclass{article}  
\begin{document}
%文档内容

\end{document}
```

article 是 tex 支持的文档类型中的一种，用于短文档，另外还有 report 等多种类型。可以设置 article class 的配置项, [ ] 内是可选参数，{ } 内是必须参数：

```tex
\documentclass[towcolumn,10pt,a4paper]{article}  
\begin{document}
%文档内容

\end{document}
```

\usepackage 用于加载 package，package 用来提供更多指令, \usepackage 用法和 \documentclass 类似：

```tex
\documentclass[towcolumn,10pt,a4paper]{article}  
\usepackage{latexsym}

\begin{document}
%文档内容

\end{document}
```

如果有文档内要自定义指令，自定义指令放在 \documentclass 和 \usepackage 之后。

\begin 和 \end 标记文档的开始和结束，结束标记后的文本都被 tex 忽略：

```tex
\begin{document}
%文档内容

\end{document}

这里的文本都被忽略
```

### LaTeX 文档标题

\maketitle 用于生成文档标题页，该指令之前建议不要有任何文档中的内容

```tex
%!TEX program = xelatex
\documentclass[towcolumn,10pt,a4paper]{article}
%\usepackage[UTF8]{ctex}
\title{Gnus of the World}
\author{R. Dather \and J. Pennigs \and B. Talkmore}
\date{4 July 1997}

\begin{document}
% \maketitle 生成标题封面
\maketitle

\end{document}
```

\title \author \date 等只要位于 \maketitle 之前就可以。

### LaTeX 章节

文档由章节组成、章节由段落组成、段落由句子组成。

章节指令主要由一下几个：

```
\part           用于 section 划分，不影响 section  编号
\chapter        article 类型不支持，report 类型中用该指令引用一个 article
\section 
\subsection     必须位于 \section，在 report 类型中需要位于 \chapter 中
\subsubsection  
\paragraph      历史遗留
\subparagraph   历史遗留
\appendix
```

documentclass 会影响章节的样式和编号。

\section 的参数中如果要使用指令，在指令前面加上 \protect 保护：

```tex
\section{Chapter 1}
\subsection{SubChapter 1}
\subsection{Is \protect\( x+y \protect\) Prime?}
\subsection{Is $x+y$ Prime?}
```

>原文说需要保护的是 fragile 指令，但是不知道什么类型的指令是 fragile。$ 指令就不需要加 \protect


### LaTeX 段落和句子

```tex
%多个连续的空格被视作一个空格（针对英文单词）。
Hello      World !
%用空行表示上个段落结束，新起一个段落。

A new paragraphs.

single left quote  `

single right quote  '

double left quote  ``

double right quote '' 

%单引号和双引号相邻时，用 \, 分隔,
``\,`Apple' or `Pear'\,'', he asked.  

%\,是一个指令，含义是插入一丁点间隔
abc\,de\,\,\,\,f

% -,--,--- 分别是三个样式连字符
a-b,a--b,a---b

% \ 和 \@ 的用途没有搞明白，在 LaTeX 上没看出区别。
Hi, my name is lijiao. I came from China.
abc\@.def

%十个特殊字符中的7个用\修饰可以展示出来
\# \$ \% \& \_  \{  \}

%另外三个特殊字符：~^\ 需要用指令展示 

%\TeX 和 \LaTeX，以及 \today 等指令用于生成文本。
TeX: \TeX

LaTeX: \LaTeX 

today: \today

%省略号
\ldots

%\LaTeX后面需要 \ ，才会插入空格
This page of \LaTeX\ manual was produced on \today.

%强调文本, \emph 是指令, emphasized text 指令的入参
Here is some silly \emph{emphasized text}.

%\emph可以嵌套使用
He said \emph{i want \emph{an red apple}, can you give me?} very carefully.

%~用于标识这里不可以分行
Chapter~3. Mr.~Jones

%\mbox标记一段不可分行的文本
you cant break \mbox{Doctor Lamport}.

%\footnote生成注脚, \footnote之前不需要空格。 footnote通常不能用在其它命令的参数中
Gnus\footnote{A gnu is a big animal} can be quite a gnusance. 

%公式等同于名词，不能用在句子的开头或者独立成一个句子，否则会导致 tex 找不到句子的开始。
%数学公式用 \( \) 包裹，公式中空格都被忽略，tex 把公式整体作为一个单词看待
The formula \( x-3  y   =7 \) 

%\begin{math}...\end{math}  等价于 \(...\) ，这种写法可以避免忘写结束位置
The formula \begin{math} x-3  y   =7 \end{math} 

%左下角标用_，右上角标用^
\( a_1 > x^{2n} / y ^{2n}\)

%右引号生成撇号
\( x' < x'' - y'_{3} < 10 x''' z \)

%简短的公式可以用 $$
Let $x$ be a prime such that $y>2x$.

%以 % 开头的行，和每个新行前面的空格都被忽略。
      Hello world!
```

### LaTeX 显示环境

\begin{} 和 \end{} 实际标记的是一个展示环境的开始和结束。LaTeX 提供了多种展示环境。

#### 引用 \begin{quote}

```tex
%引用
He turned and said to me:
\begin{quote}
\ldots\ I've done all I'm going to. 

I refuse to have any further part in it. My answer is no!
\end{quote}
and then he left.
```

#### 列表 \begin{itemize/}

无符号列表和有符号列表：

```tex
\begin{itemize}
    \item List1
    \item List2
        \begin{enumerate}
            \item Item1
            \item item2
        \end{enumerate}
    \item List3
\end{itemize}
```

#### 解释 \begin{description}

名词注解样式：

```tex
Three animals you should know:
\begin{description}
    \item[gnat] A small animal
    \item[gnu] A  large animal
\end{description}
```

#### 诗歌 \begin{verse}

诗歌样式，\\提示换行，\\* 提示换行并且禁止从这里开始新的 page：

```tex
\begin{verse}
There is an enviroment for verse \\
Whose feature some poets will curse

For instead of makeing\\*
abc
\end{verse}
```

公式样式：

```tex
\begin{displaymath}
x' + y^{2} = z_{i}^{2}
\end{displaymath}

%\[ 等价于 \begin{displaymath}
\[ x' + y^{2} = z_{i}^{2} \]
```

带编号的公式：

```tex
\begin{equation}
x' + y^{2} = z_{i}^{2}
\end{equation}

\begin{equation}
x' + y^{2} = z_{i}^{2}
\end{equation}
```

### 声明指令

\em 是一个声明指令，声明从这之后的文本的显示样式，直到第一个 \end 或者 }：

```tex
\begin{quote}
wait, \em Here is an exciting quote
\end{quote}

\begin{quote}
wait, {\em Here is} an exciting quote
\end{quote}
```

与 \emph 对比，\emph 是指令接收参数，和 \em 使用方式不同：

```tex
\begin{quote}
wait, \emph{Here is} an exciting quote
\end{quote}
```


## 问题记录

### CTeX fontset `mac' is unavailable in current mode

在文件开头添加：

```
%!TEX program = xelatex
```

## 参考

1. [李佶澳的博客][1]
2. [mactex][2]
3. [LaTeX 2ε for authors][3]
4. [LaTeX Core Documentation][4]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://tug.org/mactex/ "mactex"
[3]: https://www.latex-project.org/help/documentation/usrguide.pdf "LaTeX 2ε for authors"
[4]: https://www.latex-project.org/help/documentation/ "LaTeX Core Documentation"
