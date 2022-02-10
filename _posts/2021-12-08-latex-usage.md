---
layout: default
title: "排版工具 LaTeX 的指令系统、安装使用和简明排版语法"
author: 李佶澳
date: "2021-12-08 14:38:31 +0800"
last_modified_at: "2022-01-19 17:26:31 +0800"
categories: 编程
cover:
tags:
keywords: LaTeX,tex
description: TeX 是 Donald Knuth 开发的排版工具，将带有排版指令的文本文件转换成 pdf 等
---

## 本篇目录

* auto-gen TOC:
{:toc}

## LaTeX 与 TeX 的关系

TeX 是 Donald Knuth 开发的排版工具，用来生成设备无关的排版后的 dvi文件，DeVice Independent format。
TeX 内置了大约 300 个命令，支持用定义 macro 的方式扩充指令。
macro 定义文件被编译成 .fmt 文件后通过 tex 的 -fmt 参数引用，例如 `tex -fmt fmt文件`。

Donald Knuth 编写了一个名为 Plain TeX 的 package，增加了大概 600 个指令 。

Leslie Lamport 创建了名为 [LaTeX][15] 的 package，提供了更高阶的指令，并且为 LaTeX 定义了 package  标准，支持用 \usepackage 导入其它 package 。
基于 LaTeX 的 pacakge 数量开始大量增加，LaTeX 成为主流，\begin{enviroment} 等常见指令都是在 LaTeX 中定义的。

在 Plain TeX 上扩展而成的 AMSTeX 被 AMS 在 1982~1985 使用，现在被做成了 LaTeX 系统中的一个 package `\usepackage{amsmath}`。
1990 年 Hans Hagen 开发了另一套名为 [ConTeXt][18] 的 package 系统，独立于 LaTeX，

现在主流使用的 LaTeX 以及过去的 Plain TeX 等，都构建在原始的 TeX 指令之上，由 TeX 负责解析执行。
作为执行引擎的 TeX 在 1989 年完成了特性开发进入 stable 维护阶段，之后的重大改进以新项目的方式独立于 TeX 进行。

1990s，Hàn Thế Thành 在 TeX 基础上开发了 [pdfTeX][21]，可以直接输出 pdf 文件。Tex 输出的 dvi 文件需要先转换成 PostScript 文件再转换成 pdf。

2004，Jonathon Kew 开发了 [XeTeX][22]，支持多语种和新字体。

2007，[LuaTeX][23] 将 TeX 扩展为支持 Lua，解决 TeX 语法编写的 package 文件难以阅读的问题。

[The TeX family tree: LaTeX, pdfTeX, XeTeX, LuaTeX and ConTeXt][24] 介绍了以上发展过程。

## 学习资料

**考古教程**：

1986 年 Tex 作者 Donald E. Knuth  编写的 《The TeXbook》 大概是最早的介绍 TeX 的出版物：[Donald E. Knuth, The TeXbook, Addison-Wesley, 1986, ISBN 0-201-13447-0][25]

1994 年 LaTeX 作者 Leslie Lamport 编写的 《LaTeX A Document Preparation System》发行了第二版：[LaTeX: A document preparation system, User’s guide and reference manual][16]

**现代入门**：下面是比较现代的入门资料，OverLeaf 网站的上的文档有很高的学习价值

* LaTeX 16节课：[Learn LaTeX][17]，建议通过这个教程入门
* LaTeX 开源书：[Formatting Information：An introduction to typesetting with LATEX][8]
* OverLeaf Doc：[OverLeaf Document][16] （overleaf是一个在线的 LaTex 编辑器）
* 相关图书： [TeX and LaTeX Books][6]
* 更多资料： [LaTex Useful Links][7]

**TeX/LaTex 在线资料**：

* Tex 原始指令：[TeX Primitive Control Sequences][11]
* Tex 非官方手册：[LaTeX2e unofficial reference manual (July 2021)][10]，其它格式[下载][9]
* TeX 用户组：[TeX User Group][14]
* TeX 问题列表：[The TeX Frequently Asked Question List][13]
* LaTeX Package： [The Comprehensive TEX Archive Network][5]
* LaTeX Package 文档本地查看 ：用命令 “texdoc 包名”查看，例如 `texdoc docstrip`
* LaTeX 项目网站： [The LaTeX Project][15]


## Tex、LaTex 套件安装

在 mac 上安装 [mactex][2]后 ，会将 tex、pdftex、latex、luatex 等一系列命令按安装好：

```sh
$ brew install mactex
```

/usr/local/texlive/2021/bin/universal-darwin/ 目录下是大量可用命令。

还包含名为 TeXShop 的图形编辑器：

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

TeXShop 生成 pdf 快捷盘：Command+t

## TeX 用法

TeX 处理的文本样式如下：

```tex
\TeX{} is good at typesetting words like `fjord', `efficiency',
and `fiasco'. It is also good at typesetting math like,
$a^2 + b^2 = c^2$.
\bye
```

用 tex 命令生成 dvi 文件：

```sh
 tex origin-tex.tex
This is TeX, Version 3.141592653 (TeX Live 2021) (preloaded format=tex)
(./origin-tex.tex [1] )
Output written on origin-tex.dvi (1 page, 536 bytes).
Transcript written on origin-tex.log.
```

## LaTeX 用法

LaTex 处理的文本样式如下，第一行 %!TEX 指定处理引擎是 TeXShop 的能力，命令行执行时被忽略：

```tex
%!TEX program = xelatex
\documentclass{article}  
\usepackage[UTF8]{ctex}  
\begin{document}  
Hello，中国！
\end{document}
```

用 xelatex 引擎处理，生成 pdf： 

```sh
$ xelatex  origin-latex.tex
This is pdfTeX, Version 3.141592653-2.6-1.40.22 (TeX Live 2021) (preloaded format=latex)
 restricted \write18 enabled.
...省略...

$ ls 
origin-latex.aux origin-latex.log origin-latex.pdf origin-latex.tex
```

## LaTex 可用指令

LaTex 可用指令由三部分组成：

1. Tex 内置的原始指令（Primitive），原始指令列表：[TeX Primitive Control Sequences][11]
2. 内置的用 tex 语法定义的 base 指令，代码目录： [latex2e/base/][18]，mac 的安装目录：/usr/local/texlive/2021/texmf-dist/tex/latex/base/
3. 通过 CTAN 下载的 package 中的指令： [The Comprehensive TEX Archive Network][5]

### 原始指令

原始指令中用来创建 macro 的 [def][19] 指令是 LaTeX 指令体系的基石。

在 LaTeX 中使用 TeX 原始指令（[TeX Primitive Control Sequences][11]）：

{% raw %}

```tex
\documentclass[12pt]{article}
\begin{document}

\newpage
\voffset=-1.5in    %上边距调整
%\vsize=           %header,body,footer组合中body的高度
\hoffset=-1.5in    %左边距调整
\hsize=4in         %每行的长度
\leftskip=0in      %每行左侧
\rightskip=0in     %每行右侧
\parindent=0in     %首行缩进

e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e

atop, put a line at the top of other: $ top \atop bottom $

$$n \atop k = n! / k!(n-k)!$$
$${n \atop k} = n! / k!(n-k)!$$
$$n \atop k = n! / k!(n-k)!$$
$${n \atop k} = {n! \over k!(n-k)!} = n! / k!(n-k)!$$

\vspace{1cm}

%atopwithdelims: $top \atopwithdelims{a,b} bottom$

Example:

\def\tabove#1%
{%
    {{2 \over 3}\above#1 {1 \over 6}} =
    {{2 \over 3}\cdot{6 \over 1}} = {12 \over 3} = 4
}
$$\hbox{$\tabove{1pt}$,}\quad
  \hbox{$\tabove{2pt}$,}\quad
  \tabove{1pt},\quad
  \tabove{2pt}$$

\end{document}
```

{% endraw %}

### base 指令

内置的 base 指令在安装目录 /usr/local/texlive/2021/texmf-dist/tex/latex/base/ 中。
以 LaTeX 支持的基本文档类型 article 为例，\documentclass 不是原始指令，是在 latex.ltx 中定义：

```tex
%!TEX program = xelatex
\documentclass{article}  

\begin{document}  
Hello，中国！
\end{document}
```

```sh
$ grep  -R -n "documentclass" . |grep def
./ltluatex.tex:65:  \ifx\documentclass\@undefined
./latex.ltx:9778:\def\@documentclasshook{ %               
./latex.ltx:10025:\def\documentclass{ %                  <-- documentclass 是在这个文件里
./latex209.def:64: with the \string\documentclass\space command.^^J\space
./latex209.def:100:         should begin with \string\documentclass\space
./latex209.def:124:\def\@documentclasshook{ %
```

### CTAN Package

从 CTAN 下载的 package 在 mac 上的安装目录，例如 package geometry：

```sh
$ ls /usr/local/texlive/2021/texmf-dist/tex/latex/geometry
geometry.sty
```

### 用于生成安装文件的 docstrip 机制

查看安装目录里的文件会发现前面有这样的内容：

```sh
%% This is file `article.cls',
%% generated with the docstrip utility.
%%
%% The original source files were:
%%
%% classes.dtx  (with options: `article')
%%
%% This is a generated file.
...
```

article.cls 是通过 classes.dtx 生成的，classes.dtx 位于 latex 项目代码 [latex2e/base/][18] 中。

从 classes.dtx 生成 article.cls 使用的 tex 的 docstrip 功能：

```sh
$ texdoc docstrip
```

用上面指令打开的文档里有详细说明，简单说就是用 \input docstrip 插入 docstrip 文件后，可以用 \generate 指令根据一个文件生成另一个文件，以项目代码  latex2e/base/classes.ins 为例：

```tex
\input docstrip

\preamble
This is a generated file.
... 省略 ...
\endpreamble

\keepsilent
\usedir{tex/latex/base}

\generate{\file{article.cls}{\from{classes.dtx}{article}}
          \file{report.cls}{\from{classes.dtx}{report}}
          \file{book.cls}{\from{classes.dtx}{book}}
          \file{size10.clo}{\from{classes.dtx}{10pt}}
          \file{size11.clo}{\from{classes.dtx}{11pt}}
          \file{size12.clo}{\from{classes.dtx}{12pt}}
          \file{bk10.clo}{\from{classes.dtx}{10pt,bk}}
          \file{bk11.clo}{\from{classes.dtx}{11pt,bk}}
          \file{bk12.clo}{\from{classes.dtx}{12pt,bk}}
          }
... 省略 ....
```

上述 generate 指令以 classes.dtx 为输入，分别生成了 article.cls、report.cls 等文件。

生成文件与原始的文件的区别：1. 原有文件中的注释被去除了（docstrip)；2. 保留 option 匹配的注释行中代码。


```tex
\generate{\file{article.cls}{\from{classes.dtx}{article}}   % option 是最后一个 {} 中的 article
```

```tex
44 %<article>\ProvidesClass{article}    <--- 指定 article option 时，包含该行指令
45 %<report>\ProvidesClass{report}      <--- 指定 report option 时，包含该行指令
46 %<book>\ProvidesClass{book}          <--- 指定 book option 时，包含该行指令 
```

article.cls、report.cls 和 book.cls 文件中对应的内容分别是：

```tex
\ProvidesClass{article}
\ProvidesClass{report}
\ProvidesClass{book}
```

docstrip 也是一个 tex 文件，用 tex 直接解析会提示输入来源文件名，`*.ins`文件通过 `\input docstrip`指令插入该文件：

```sh
$ tex docstrip.tex
This is TeX, Version 3.141592653 (TeX Live 2021) (preloaded format=tex)
! I can't write on file `docstrip.log'.
(Press Enter to retry, or Control-D to exit; default file extension is `.log')
Please type another transcript file name:

```


## LaTex 指令

使用 LaTex 排版时，要用指令指明排版样式。LaTeX 指令以 `\` 开头，指令如果支持参数，把参数写在指令后面的`{ }` 中。例如 \documentclass 就是一个指令，用来指定文档类型：

```tex
\documentclass{article}     % article 是传给指令的参数
```

LaTex 支持的指令非常多，可以到 [LaTeX2e unofficial reference manual (July 2021)][10] 中查找一部分。

LaTex 支持通过 package 自定义指令，可以到 [CTAN][5] 中搜索对应 pacakge 的用法，譬如 LaTex 的标准文档类型 article：

![search article in ctan]({{ site.article }}/tex-article-1.png)

进入 package 页面后，可以查看 pacakge 的使用文档：

![article document]({{ site.article }}/tex-article-2.png)

### 使用中文字符

开头注释指定 xelatex，添加 package ctex：

```tex
%!TEX program = xelatex
\documentclass{article}  
\usepackage[UTF8]{ctex}  
\begin{document}  
Hello，中国！
\end{document}
```


### 基本元素

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

### 复杂排版

LaTex 一直处于三种模式中的一种：段落模式（paragraph mode）、数学模式（math mode）、LR模式（left-to-right mode）。

1. 段落模式：LaTeX 将遇到的内容看作一系列单词和句子，被按行、段落或者页面划分。
2. 数学模式：LaTeX 将遇到的字符视作数学符号，并且忽略所有空格。
3. LR模式：LaTeX 类似于在段落模式，但是方向始终从左到右，不产生换行。

进入数学模式：

```tex
$
\(
\[
\begin{equation}
```

进入LR模式：

```tex
\mbox
```

模式可以嵌套，譬如在数学中模式遇到 \mbox 转入 LR模式：

```tex
\(y>z \mbox{if $x^{2}$ real} \)
```


## LaTex Package 使用


### 页面布局：geometry

```sh
texdoc geometry
```

```tex
\documentclass[onecolumn]{article}
%a4:297mm*210mm a3:297mm*420mm
\usepackage[margin=20mm,paperheight=297mm,paperwidth=210mm]{geometry}
\parindent=0mm %首行缩进0
\begin{document}
abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc 
\newpage
def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def
\end{document}
```

### 页眉页脚：fancyhdr

```sh
texdoc fancyhdr
```

```tex
\documentclass[onecolumn,twoside]{article}

%页眉设置
\usepackage{fancyhdr}
\pagestyle{fancy}
\fancyhf{}
\fancyhead[LE,RO]{Overleaf}
\fancyhead[RE,LO]{Guides and tutorials}
\fancyfoot[CE,CO]{\leftmark}
\fancyfoot[LE,RO]{\thepage}


\begin{document}

\section{example title}
abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc abc 
\newpage
def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def def 

\end{document}
```

### 考试排版 

[用LaTeX怎样排版选择题？](https://www.zhihu.com/question/26414466)


### 试卷排版案例

![高考试卷]({{ site.article }}/paper.png)

{% raw %}

```tex
%!TEX program = xelatex

%A3横排双列双面
\documentclass[landscape,twocolumn,twoside]{article} 
\usepackage[a3paper,top=20mm,bottom=20mm,inner=20mm,outer=20mm]{geometry}

%A4竖排双列双面
%\documentclass[twocolumn,twoside]{article} 
%\usepackage[a3paper,top=20mm,bottom=20mm,inner=20mm,outer=20mm]{geometry}

%A4竖排单列双面
%\documentclass[twoside]{article} 
%\usepackage[a4paper,top=20mm,bottom=20mm,inner=20mm,outer=20mm]{geometry}

%\ctexset{fontset=none} %禁止ctx自动检测操作系统、自动设定字库
\usepackage[UTF8]{ctex} %中文显示、中文字体 
\usepackage{enumerate}
\usepackage{fontsize}      % 支持字号设置
\usepackage{sectsty}    %z支持section标题字号设置
\usepackage{amssymb}   %支持符号 /bigstar
\usepackage{calc}             %支持变量运算
\usepackage{graphics}   %支持导入图片
\usepackage{adjustbox} %支持调整大小的box
\usepackage{wrapfig}    %支持文字环绕图片，不能用于list enviroment，用 adjustbox 代替
\usepackage{ifthen}       %支持if语句

%页眉设置
\usepackage{fancyhdr}
\pagestyle{fancy}
\fancyhf{}
\fancyhead[LE,RO]{页眉外侧}
\fancyhead[RE,LO]{\songti\heiti 绝密$\bigstar$启用前\songti}
\fancyfoot[CE,CO]{第 \thepage 页}

%字体、字号、行间距、缩进等
\renewcommand{\thesection}{\zhnum{section}}                  %章节标题使用中文
%\renewcommand{\thesubsection}{\arabic{subsection}.}    %子章节标题
\changefontsize[12pt]{12pt}                       %设置行间距、字体大小
\sectionfont{\fontsize{12}{12}\selectfont}   %设置section标题大小行距
\renewcommand{\baselinestretch}{2}   %设置2倍行距
\renewcommand{\adjboxvtop}{8pt}           %调整adjustbox 垂直对齐时的内容上浮
\parindent=0mm                                %首行缩进0

%自定义指定
\newlength\lastheight   %自定义全局变量，记录上一个minipage高度
%左侧adjbox宽度
\newcommand{\adjboxLwidth}{%
\if@twocolumn \linewidth
\else 0.7\linewidth
}
%右侧adjbox宽度
\newcommand{\adjboxRwidth}{%
\if@twocolumn \linewidth
\else 0.3\columnwidth
}


%选择题选项自动换行
\newlength{\lenA}
\newlength{\lenB}
\newlength{\lenC}
\newlength{\lenD}
\newlength{\lenMax}
\newlength{\lenHalf}
\newlength{\lenQuarter}
\newcommand{\fourItems}[4] {%
\settowidth{\lenA}{A.~#1~~~~~~~}
\settowidth{\lenB}{B.~#2~~~~~~~}
\settowidth{\lenC}{C.~#3~~~~~~~}
\settowidth{\lenD}{D.~#4~~~~~~~}
\ifthenelse{\lengthtest{\lenA > \lenB}} {\setlength{\lenMax}{\lenA}} {\setlength{\lenMax}{\lenB}}
\ifthenelse{\lengthtest{\lenMax < \lenC}} {\setlength{\lenMax}{\lenC}} {}
\ifthenelse{\lengthtest{\lenMax < \lenD}} {\setlength{\lenMax}{\lenD}} {}
\setlength{\lenHalf}{0.5\linewidth}
\setlength{\lenQuarter}{0.25\linewidth}
\ifthenelse{ \lengthtest{ \lenMax < \lenQuarter} }
{
    \makebox[\lenQuarter][l]{A.~#1~~~}\makebox[\lenQuarter][l]{B.~#2~~~}\makebox[\lenQuarter][l]{C.~#3~~~}\makebox[\lenQuarter][l]{D.~#4~~~}
}
 {  \ifthenelse{ \lengthtest{\lenMax <\lenHalf} } 
      {\makebox[\lenHalf][l]{A.~#1~~~}\makebox[\lenHalf][l]{B.~#2~~~}\par\makebox[\lenHalf][l]{C.~#3~~~}\makebox[\lenHalf][l]{D.~#4~~~}} 
      {\makebox[\lenMax][l]{A.~#1~~~}\par\makebox[\lenMax][l]{B.~#2~~~}\par\makebox[\lenMax][l]{C.~#3~~~}\par\makebox[\lenMax][l]{D.~#4~~~}} 
}
}


\begin{document}

\begin{center}
\LARGE 2019 年普通高等学校招生全国统一考试
\end{center}
\begin{center}
\Huge 理科数学
\end{center}

\section{注意事项：}
\begin{enumerate}
	\item 答卷前，考生务必将自己的姓名、考生号等填写在答题卡和试卷指定位置上。
	\item 回答选择题时，选出 每小题答案后，用铅笔把答题卡上对应题目的答案标号涂黑。如需改动，用橡皮擦干净后，再涂选其他答案标号。回答非选择题时，将答案写在答题卡上。写在本试卷上无效。
	\item 考试结束后，将本试卷和答题卡一并交回。
\end{enumerate}

\section{选择题：本题共12小题，每小题5分 ，共60分。在每小题给出的四个选项中，只有一项是符合题目要求的。}
\begin{enumerate}

\item 已知集合$M=\{x \mid-4 <  x < 2 \}$，$N=\{ x \mid x^2-x-6<0\}$，则$M \cap N=$
	\par\fourItems 
	    {$\{ x \mid -4 < x < 3 \}$}
	    {$\{ x \mid -4 < x < -2 \}$}
	    {$\{ x \mid -2 < x < 2 \}$}
	    {$\{ x \mid 2 < x < 3 \}$	}
\item 设复数$z$满足$| z - i | = 1$，$z$在复平面内对应的点为$(x,y)$，则
	\par\fourItems 
	    {$(x+1)^2+y^2=1$}
	    {$(x-1)^2+y^2=1$}
	    {$x^2+(y-1)^2=1$}
	    {$x^2+(y+1)^2=1$}
\item 已知$a=\log_{2}0.2$，$b=2^{0.2}$，$c=0.2^{0.3}$，则
	\par\fourItems
	    {$a<b<c$}
	    {$a<c<b$}
	    {$c<a<b$}
	    {$b<c<a$}
\item \begin{adjustbox}{minipage=[t]{\adjboxLwidth},gstore totalheight=\lastheight}
	古希腊时期，人们认为最美人体的头顶至肚脐的长度与肚脐至足底的长度之比是$\frac{\sqrt{5}-1}{2}$（$\frac{\sqrt{5}-1}{2}\approx0.618$，成为黄金分割比例），著名的“断臂维纳斯”便是如此。此外，最美人体的头顶至咽喉的长度与咽喉至肚脐的长度之比也是 $\frac{\sqrt{5}-1}{2}$。若某人满足上述两个黄金分割比例，且腿长为105cm，头顶至脖子下端的长度为26cm，则其身高可能是
	\end{adjustbox}
	\begin{adjustbox}{center=\adjboxRwidth,height=\lastheight,valign=t}
         	\includegraphics[height=\lastheight]{img/维纳斯.jpeg}
	\end{adjustbox}
	\vspace{\lineskip}    
	\par\fourItems
	{165cm}
	{175cm}
	{182cm}
	{190cm}
\item 函数$f(x)=\frac{\sin x+x}{\cos x+x^2}$在$[-\pi,\pi]$的图像大致为
\end{enumerate}

\end{document}
```

{% endraw %}

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
5. [CTAN: The Comprehensive TEX Archive Network][5]
6. [TeX and LaTeX Books][6]
7. [LaTex Useful Links][7]
8. [Formatting Information：An introduction to typesetting with LATEX][8]
9. [latex2e-help-texinfo – Unofficial reference manual covering LATEX2ε][9]
10. [LaTeX2e unofficial reference manual (July 2021)][10]
11. [TeX Reference Manual by David Bausum][11]
12. [Tex Reference documents][12]
13. [The TeX Frequently Asked Question List][13]
14. [TeX User Group][14]
15. [the LaTeX project][15]
16. [OverLeaf Document][16]
17. [Learn LaTeX][17]
18. [ConTeX][18]
19. [Donald E. Knuth, The TeXbook, Addison-Wesley, 1986, ISBN 0-201-13447-0.][25]
20. [知乎专栏Latex排版和C++][26]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://tug.org/mactex/ "mactex"
[3]: https://www.latex-project.org/help/documentation/usrguide.pdf "LaTeX 2ε for authors"
[4]: https://www.latex-project.org/help/documentation/ "LaTeX Core Documentation"
[5]: https://ctan.org/ "The Comprehensive TEX Archive Network"
[6]: https://www.latex-project.org/help/books/ "TeX and LaTeX Books"
[7]: https://www.latex-project.org/help/links/ "Useful Links"
[8]: http://latex.silmaril.ie/formattinginformation/ "Formatting Information：An introduction to typesetting with LATEX"
[9]: https://ctan.org/pkg/latex2e-help-texinfo "latex2e-help-texinfo – Unofficial reference manual covering LATEX2ε"
[10]: https://latexref.xyz/ "LaTeX2e unofficial reference manual (July 2021)"
[11]: https://www.tug.org/utilities/plain/cseq.html "TeX Reference Manual by David Bausum"
[12]: https://texfaq.org/FAQ-ref-doc "Tex Reference documents"
[13]: https://texfaq.org/ "The TeX Frequently Asked Question List"
[14]: https://tug.org/ "TeX User Group"
[15]: https://www.latex-project.org/ "the LaTeX project"
[16]: https://www.overleaf.com/learn "OverLeaf Document"
[17]: https://www.learnlatex.org/en/ "Learn LaTeX"
[18]: https://github.com/latex3/latex2e/tree/main/base "LaTeX base"
[19]: https://www.tug.org/utilities/plain/cseq.html#def-rp "def"
[20]: http://wiki.contextgarden.net/What_is_ConTeXt "ConTeX"
[21]: https://tug.org/applications/pdftex/ "pdfTeX"
[22]: https://tug.org/xetex/ "xetex"
[23]: http://www.luatex.org/ "luaTex"
[24]: https://www.overleaf.com/learn/latex/Articles/The_TeX_family_tree%3A_LaTeX%2C_pdfTeX%2C_XeTeX%2C_LuaTeX_and_ConTeXt "The TeX family tree: LaTeX, pdfTeX, XeTeX, LuaTeX and ConTeXt"
[25]: http://visualmatheditor.equatheque.net/doc/texbook.pdf  "Donald E. Knuth, The TeXbook, Addison-Wesley, 1986, ISBN 0-201-13447-0."
[26]: https://www.zhihu.com/column/c_149601753 "Latex排版和C++"
