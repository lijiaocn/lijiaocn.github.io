---
layout: default
title: Liquid语法
author: lijiaocn
createdate: "2017-04-26 13:13:03 +0800"
last_modified_at: "2019-01-09 17:35:25 +0800"
categories: 编程
tags: jekyll
keywords: liquid语法,liquid,模版语言 
description: Liquid是一个ruby开发的开源的模版语言,静态网页生成工具jekyll中使用liquid。

---

## 目录
* auto-gen TOC:
{:toc}

## 介绍 

[Liquid][1]是[shopify][2]公司开发的模版语言，shopify是一家电商软件开发公司。

[liquid doc][3]中介绍了liquid的语法。

	Liquid code can be categorized into `objects`, `tags`, and `filters`。

## Objects

Objects是用\{\{和\}\}围起来的liquid代码

{% raw %}

	Objects tell Liquid where to show content on a page. 
	Objects and variable names are denoted by double curly braces: {{ and }}.

{% endraw %}

example:

{% raw %}

	{{ page.title }}

{% endraw %}

## Tags

Tags是用`{ %` 和`% }`包裹起来的liquid代码，做逻辑处理和control flow。

{% raw %}

	Tags create the logic and control flow for templates. 
	They are denoted by curly braces and percent signs: {% and %}.

{% endraw %}

分为Control flow、Iteration、Variable assignments三类。

### Control flow

Control flow有三个：if-else，unless，case/when

#### if/elsif/else

{% raw %}

	{% if customer.name == 'kevin' %}
	  Hey Kevin!
	{% elsif customer.name == 'anonymous' %}
	  Hey Anonymous!
	{% else %}
	  Hi Stranger!
	{% endif %}

{% endraw %}

#### unless

{% raw %}

	{% unless product.title == 'Awesome Shoes' %}
	  These shoes are not awesome.
	{% endunless %}

{% endraw %}

#### case/when

{% raw %}

	{% assign handle = 'cake' %}
	{% case handle %}
	  {% when 'cake' %}
	     This is a cake
	  {% when 'cookie' %}
	     This is a cookie
	  {% else %}
	     This is not a cake nor a cookie
	{% endcase %}

{% endraw %}

### Iteration

Iteration:  for、 

#### for/break/continue

{% raw %}

	{% for i in (1..5) %}
	  {% if i == 4 %}
	    {% continue %}
	  {% else %}
	    {{ i }}
	  {% endif %}
	{% endfor %}

	{% for i in (1..5) %}
	  {% if i == 4 %}
	    {% break %}
	  {% else %}
	    {{ i }}
	  {% endif %}
	{% endfor %}

{% endraw %}

#### for（带参数)

#### limit，限制循环次数

{% raw %}

	<!-- if array = [1,2,3,4,5,6] -->
	{% for item in array limit:2 %}
	  {{ item }}
	{% endfor %}

{% endraw %}

Output:

	1 2

#### offset，设置开始位置

{% raw %}

	<!-- if array = [1,2,3,4,5,6] -->
	{% for item in array offset:2 %}
	  {{ item }}
	{% endfor %}

{% endraw %}

Output:

	3 4 5 6

#### (), 指定范围

{% raw %}

	{% for i in (3..5) %}
	  {{ i }}
	{% endfor %}

{% endraw %}

也可以是使用变量:

{% raw %}

	{% assign num = 4 %}
	{% for i in (1..num) %}
	  {{ i }}
	{% endfor %}

{% endraw %}

#### reversed, 逆序

{% raw %}

	<!-- if array = [1,2,3,4,5,6] -->
	{% for item in array reversed %}
	  {{ item }}
	{% endfor %}

{% endraw %}

Output

	6 5 4 3 2 1

### cycle in for

类似于生成器，每次吐出下一个字符串，但是`必须在for中使用`。

	Loops through a group of strings and outputs them in the order that they were passed as parameters. 
	Each time cycle is called, the next string that was passed as a parameter is output.

example:

{% raw %}

	{% cycle 'one', 'two', 'three' %}
	{% cycle 'one', 'two', 'three' %}
	{% cycle 'one', 'two', 'three' %}
	{% cycle 'one', 'two', 'three' %}

{% endraw %}

Output

	one
	two
	three
	one

### tablerow

生成一个table，`必须在table标签中使用`。

{% raw %}

	<table>
	{% tablerow product in collection.products %}
	  {{ product.title }}
	{% endtablerow %}
	</table>

{% endraw %}

Output:

{% raw %}

	<table>
	  <tr class="row1">
	    <td class="col1">
	      Cool Shirt
	    </td>
	    <td class="col2">
	      Alien Poster
	    </td>
	    <td class="col3">
	      Batman Poster
	    </td>
	  </tr>
	</table>

{% endraw %}

### tablerow, 参数

#### cols，指定列数


{% raw %}

	{% tablerow product in collection.products cols:2 %}
	  {{ product.title }}
	{% endtablerow %}

{% endraw %}

Output

	<table>
	  <tr class="row1">
	    <td class="col1">
	      Cool Shirt
	    </td>
	    <td class="col2">
	      Alien Poster
	    </td>
	  </tr>
	  <tr class="row2">
	    <td class="col1">
	      Batman Poster
	    </td>
	    <td class="col2">
	      Bullseye Shirt
	    </td>
	  </tr>
	  <tr class="row3">
	    <td class="col1">
	      Another Classic Vinyl
	    </td>
	    <td class="col2">
	      Awesome Jeans
	    </td>
	  </tr>
	</table>

#### limit，限制表格项数目

{% raw %}

	{% tablerow product in collection.products cols:2 limit:3 %}
	  {{ product.title }}
	{% endtablerow %}

{% endraw %}

#### offset，指定开始位置

{% raw %}

	{% tablerow product in collection.products cols:2 offset:3 %}
	  {{ product.title }}
	{% endtablerow %}

{% endraw %}

#### ()，range

{% raw %}

	<!--variable number example-->
	{% assign num = 4 %}
	<table>
	{% tablerow i in (1..num) %}
	  {{ i }}
	{% endtablerow %}
	</table>

	<!--literal number example-->
	<table>
	{% tablerow i in (3..5) %}
	  {{ i }}
	{% endtablerow %}
	</table>

{% endraw %}

### Variable assignments

#### assign，创建变量

{% raw %}

	{% assign my_variable = false %}
	{% if my_variable != true %}
	  This statement is valid.
	{% endif %}

	{% assign foo = "bar" %}
	{{ foo }}

{% endraw %}

#### capture, 捕获变量值,合并入新变量

{% raw %}

	{% capture my_variable %}I am being captured.{% endcapture %}
	{{ my_variable }}

{% endraw %}

变量my_variable的值就是capture中字符串，如果其中有变量，变量解析成值。

#### increment，创建递增变量

初始值为0

{% raw %}

	{% increment my_counter %}
	{% increment my_counter %}
	{% increment my_counter %}

{% endraw %}

Output

	0
	1
	2

注意increment中的变量和assign、capture创建的变量是`相互独立`的，仔细看下面列子的output:

{% raw %}

	{% assign var = 10 %}
	{% increment var %}
	{% increment var %}
	{% increment var %}
	{{ var }}

{% endraw %}

Output

	0
	1
	2
	10

#### decrement，创建递减变量

初始值为-1

{% raw %}

	{% decrement variable %}
	{% decrement variable %}
	{% decrement variable %}

{% endraw %}

Output

	-1
	-2
	-3

和increment类似，decrement创建的变量是`独立`于assign、capture创建的变量的。

## Filters

Filters用于改变输出的值

example

{% raw %}

	{{ "/my/fancy/url" | append: ".html" }}

{% endraw %}

Output

	/my/fancy/url.html

可以连续使用

{% raw %}

	{{ "adam!" | capitalize | prepend: "Hello " }}

{% endraw %}

Output

	Hello Adam!

### filters列表

这是[liquid][3]提供的filter:

	abs
	append
	capitalize
	ceil
	compact
	date
	default
	divided_by
	downcase
	escape
	escape_once
	first
	floor
	join
	last
	lstrip
	map
	minus
	modulo
	newline_to_br
	plus
	prepend
	remove
	remove_first
	replace
	replace_first
	reverse
	round
	rstrip
	size
	slice
	sort
	sort_natural
	split
	strip
	strip_html
	strip_newlines
	times
	truncate
	truncatewords
	uniq
	upcase

## 运算符(Operators)

### Basic

	==     equals
	!=     does not equal
	>      greater than
	<      less than
	>=     greater than or equal to
	<=     less than or equal to
	or     logical or
	and    logical and

### contains, 字符串包含判断

可以判断字符串中是否包含字符串:

{% raw %}

	{% if product.title contains 'Pack' %}
	  This product's title contains the word Pack.
	{% endif %}

{% endraw %}

也可以判断字符串数组中是否包含字符串:

{% raw %}

	{% if product.tags contains 'Hello' %}
	  This product has been tagged with 'Hello'.
	{% endif %}

{% endraw %}

`只能用于字符串`

## 逻辑真，逻辑假的约定

只有`nil`和`false`为逻辑假，其余变量都是逻辑真，0也是真！

All values in Liquid are truthy except nil and false.

{% raw %}

	{% assign tobi = "Tobi" %}
	
	{% if tobi %}
	  This condition will always be true.
	{% endif %}

{% endraw %}

空字符串也为真:

{% raw %}

	{% if settings.fp_heading %}
	  <h1>{{ settings.fp_heading }}</h1>
	{% endif %}

{% endraw %}

Output

	<h1></h1>

## 数据类型

### String

单引号或双引号包裹:

{% raw %}

	{% assign my_string = "Hello World!" %}

{% endraw %}

### Number

支持整型和浮点型:

{% raw %}

	{% assign my_int = 25 %}
	{% assign my_float = 39.756 %}

{% endraw %}

### Boolean

true/false:

{% raw %}

	{% assign foo = true %}
	{% assign bar = false %}

{% endraw %}

### Nil

Nil is a special empty value that is returned when Liquid code has no results. It is not a string with the characters “nil”.

### Array

Arrays hold lists of variables of any type.

遍历:

{% raw %}

	<!-- if site.users = "Tobi", "Laura", "Tetsuro", "Adam" -->
	{% for user in site.users %}
	  {{ user }}
	{% endfor %}

{% endraw %}

索引:

{% raw %}

	<!-- if site.users = "Tobi", "Laura", "Tetsuro", "Adam" -->
	{{ site.users[0] }}
	{{ site.users[1] }}
	{{ site.users[3] }}

{% endraw %}

数组`不能`主动创建，只能是liquid生成，可以通过`split`将字符串转成数组。

{% raw %}

	{% assign beatles = "John, Paul, George, Ringo" | split: ", " %}
	
	{% for member in beatles %}
	  {{ member }}
	{% endfor %}

{% endraw %}

## Liquid的变种

The most popular versions of Liquid that exist are Liquid, Shopify Liquid, and Jekyll Liquid.

Liquid的变种定义了自己的tag，filter等。

[jekyll-templates][4]中列出了扩充的filter。

## 参考

1. [liquid][1]
2. [shopify][2]
3. [liquid-doc][3]
4. [jekyll-templates][4]

[1]: https://shopify.github.io/liquid/ "liquid-main"
[2]: https://www.shopify.com/ "shopify"
[3]: https://shopify.github.io/liquid/basics/introduction/ "liquid-doc "
[4]: http://jekyllrb.com/docs/templates/ "jekyll-templates"
