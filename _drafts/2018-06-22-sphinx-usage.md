---
layout: default
title: Sphinx的简单使用
author: lijiaocn
createdate: 2018/06/22 13:34:00
changedate: 2018/06/22 18:01:53
categories: 技巧
tags: Sphinx
keywords: Sphinx
description: Sphinx 是一种文档工具，它可以令人轻松的撰写出清晰且优美的文档, 由 Georg Brandl 在BSD 许可证下开发

---

* auto-gen TOC:
{:toc}

## 说明

[Sphinx][3]是一种文档工具，它可以令人轻松的撰写出清晰且优美的文档, 由 Georg Brandl 在BSD 许可证下开发。

很多技术手册都是使用Sphinx生成，例如[Python的文档][2]。

[Sphinx中文手册][1]

## 安装

	brew install sphinx-doc
	echo 'export PATH="/usr/local/opt/sphinx-doc/bin:$PATH"' >> ~/.bash_profile

创建文档目录:

	sphinx-quickstart

按照提示输入参数后，会的到下面文件：

	$ ls
	Makefile build    make.bat source

source中文档目录：

	ls source/
	_static    _templates conf.py    index.rst

执行make，进行编译：

	$ make
	Sphinx v1.7.5
	Please use `make target' where target is one of
	  html        to make standalone HTML files
	  dirhtml     to make HTML files named index.html in directories
	  singlehtml  to make a single large HTML file
	  pickle      to make pickle files
	  json        to make JSON files
	  htmlhelp    to make HTML files and an HTML help project
	  qthelp      to make HTML files and a qthelp project
	  devhelp     to make HTML files and a Devhelp project
	  epub        to make an epub
	  latex       to make LaTeX files, you can set PAPER=a4 or PAPER=letter
	  latexpdf    to make LaTeX and PDF files (default pdflatex)
	  latexpdfja  to make LaTeX files and run them through platex/dvipdfmx
	  text        to make text files
	  man         to make manual pages
	  texinfo     to make Texinfo files
	  info        to make Texinfo files and run them through makeinfo
	  gettext     to make PO message catalogs
	  changes     to make an overview of all changed/added/deprecated items
	  xml         to make Docutils-native XML files
	  pseudoxml   to make pseudoxml-XML files for display purposes
	  linkcheck   to check all external links for integrity
	  doctest     to run all doctests embedded in the documentation (if enabled)
	  coverage    to run coverage check of the documentation (if enabled)

编译的结果位于build目录中:

	$ make ls build/
	doctrees html

## 参考

1. [Sphinx使用手册][1]
2. [Python的文档][2]
3. [Sphinx][3]

[1]: https://zh-sphinx-doc.readthedocs.io/en/latest/ "Sphinx 使用手册" 
[2]: http://docs.python.org/ "Python文档"
[3]: http://www.sphinx-doc.org/en/master/ "Sphinx"
