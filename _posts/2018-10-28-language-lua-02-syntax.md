---
layout: default
title:  "编程语言Lua（二）：基本语法学习"
author: 李佶澳
createdate: 2018/10/28 13:42:00
changedate: 2018/10/28 13:42:00
categories: 编程
tags: lua 视频教程
keywords:  lua,编程语言,idea,luarocsk,lua代码调试
description: 这里简单记录Lua的语法，直接罗列语法，定位是一个速查手册，不进行长篇大论

---

* auto-gen TOC:
{:toc}

## 说明

这是[编程语言Lua系列文章](https://www.lijiaocn.com/tags/class.html)中的一篇。

在[编程语言Lua（一）：入门介绍、学习资料、项目管理与调试方法](https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/10/22/language-lua-study.html#lua%E7%9A%84%E5%AD%A6%E4%B9%A0%E8%B5%84%E6%96%99)中给出了一些学习资料。

其中，最适合Lua语法学习的资料有两份。

第一份是Lua的设计者`Roberto Ierusalimschy`写的Lua语言教程：[Programming in Lua](https://www.lua.org/pil/)，2016年出版了第4版，覆盖了Lua 5.3。
这份资料详细讲解了Lua的语法和使用，适合初学者使用，百度云下载地址：[Download：Programming in Lua, 4th Edition](https://pan.baidu.com/s/1NOhdKjDbg18RQ_4DkGC8tg)。

第二份是Lua各个版本的手册，例如[Lua 5.3 Reference Manual](https://www.lua.org/manual/5.3/)。这份资料的难度比较高，高到如果你对编程语言本身没有足够的认识，根本看不懂它在讲什么。
这份资料是Lua语言的定义，可以理解为Lua语言的设计文档，是对Lua的最精确的表述。这份资料难度大，初学者不要死磕，经常看一看，慢慢地能看懂一些就可以了，在编程的世界里浸淫久了，里面的内容就会理解了。

另外，360公司的[moonbingbing](https://github.com/moonbingbing)（真名不知道）组织编写的[OpenResty 最佳实践](https://moonbingbing.gitbooks.io/openresty-best-practices/content/)中，对Lua也做了简短介绍。

我的学习顺序是，先把[《OpenResty最佳实践》](https://moonbingbing.gitbooks.io/openresty-best-practices/content/)中的Lua的章节快速读了一下，然后仔细阅读[《Programming in Lua》](https://www.lua.org/pil/)。主要是因为前者是中文的，内容也比较少，可以很快的过完，但是表述上来说，后者的更为精确，内容也细致，如果时间足够或者编程基础较弱，可以从后者看起。

下面是我的学习笔记。

## 关键特性记录

来自OpenResty最佳实践：

	Lua语言的各个版本是`不兼容的`。
	
	变量名没有类型，值有类型，变量名可以绑定任意类型的值。
	
	只有一种数据结构Table，Table是数组和哈希的混合，可以用任意类型的值作为Key和Value。
	
	函数是基本类型之一，支持匿名函数和正则尾递归（proper tail recursion）。
	
	支持词法定界（Lexical scoping）和闭包（closure）。
	
	支持用线程（Thread）和协程（coroutine）实现多任务。
	
	能够在运行时载入程序文本执行。
	
	支持通过元表（metatable）和元方法（metamethod）提供动态元机制（dynamic meta-mechainsm），允许运行时改变或扩充语法的内定语义。
	
	支持用Table和动态元机制（dynamic meta-mechainsm)实现基于原型（prototype-based）的面向对象模型。

Lua最新的版本是5.3，但是一个用C和汇编语言编写的更高效的Lua解释器[LuaJIT](http://luajit.org/luajit.html)现在只全兼容Lua5.1，所以如果要用LuaJIT运行，注意一定要用5.1的语法。

## 基本情况

### 保留关键字和有特殊含义的符号

保留了以下关键字：

	and       break     do        else      elseif
	end       false     for       function  if
	in        local     nil       not       or
	repeat    return    then      true      until     while

有特殊意义的符号总共有下面这些：

	+     -     *     /     %     ^     #
	==    ~=    <=    >=    <     >     =
	(     )     {     }     [     ]
	;     :     ,     .     ..    ...


### 代码执行

一段Lua代码，无论是一个lua文件，还是命令行模式下的一行lua代码，称呼一个`Chunk`。

Lua5.3支持直接在Lua命令行输入表达式，lua5.1不行：

	% lua
	> a = 15
	> a^2
	> a + 2
	--> 225 --> 17

其它版本需要在前面加上“=”：

	Lua 5.1.5  Copyright (C) 1994-2012 Lua.org, PUC-Rio
	> a=15
	> =a+2
	17

在Lua命令行中，还可以用`dofile()`函数立即加载执行一个lua文件：

	> dofile("01-hello-world.lua")
	Hello World 1!
	>

标记符（identifier，就是变量名、函数名等所有事物的名字）可以是任意不以数字开头的字符、数字、下划线的混合。

需要避免使用下划线后面接大写字母的名字，例如`_VERSION`，这种类型的标记符被Lua使用。

保留了以下关键字：

	and       break     do        else      elseif
	end       false     for       function  goto
	if        in        local     nil       not
	or        repeat    return    then      true
	until     while

Lua区分大小写，例如and是保留关键字，但是And、AND等不是，可以作为标记符使用。

注释用`--`标记，一直作用到行尾。

多行注释，在`--`后面跟随`[[`，一直作用到`]]`，例如：

	--[[A multi-line
	     long comment
	]]

多行注释通常采用下面的样式：

	--[[
	    print(1)
	    print(2)
	    print(3)
	--]]

Lua语句之间可以使用“;”作为分隔符，但分隔符不是必须的，可以没有，另外换行符对lua来说不具备语法上的意义。

	a = 1  b = a * 2    -- ugly, but valid

变量如果不明确指定为局部的，那么就是全局变量，默认值是nil。

## 基本数据类型

Lua是动态类型语言，函数`type()`返回一个变量或者一个值的类型：

	$ lua5.1
	Lua 5.1.5  Copyright (C) 1994-2012 Lua.org, PUC-Rio
	> print(type("hello world"))
	string

Lua的基本类型有：

	nil       空类型，表示无效值，变量在被赋值前都是nil，将nil赋给一个全局变量等同将其删除
	boolean   布尔类型，值为true/false，只有nil和false为“假”，其它如0和""都是真，这一点要特别特别注意！
	number    数字，值为实数，Lua默认为double，LuaJIT会根据上下文选择用整型或者浮点型存储
	string    字符串，支持单引号、双引号和长括号的方式
	table     表，关联数组
	function  函数
	userdata  用来保存应用程序或者C语言写的函数库创建的新类型。

### nil

nil类型需要注意的是： 变量在被赋值前都是nil，将nil赋给一个全局变量等同将其删除

### boolean

布尔类型需要注意的是： 只有nil和false为“假”，其它如0和""都是真。

### number

Lua默认为double，LuaJIT会根据上下文选择用整型或者浮点型存储。

整数和浮点数的类型都是number：

	> type(3)    --> number
	> type(3.5)  --> number
	> type(3.0)  --> number

如果非要区分整形和浮点数，可以用math中的type函数：

	> math.type(3)     --> integer
	> math.type(3.0)   --> float

### string

支持单引号、双引号和长括号的方式。

长括号分正反，正的就是两个中间有任意个“=”的`[`，一个“=”表示一级，例如：

	[[          0级正长括号
	[=[         1级正长括号
	[===[       3级正长括号

它们分别和反长括号对应：

	]]          0级反长括号
	]=]         1级反长括号
	]===]       3级反长括号

一个字符串可以以任意级别的长括号开始，直到遇到同级别的反长括号，`长括号中的所有字符不被转义`，包括其它级别的长括号，例如：

	> print([==[ string have a [=[ in ]=] ]==])
	string have a [=[ in ]=]

Lua中`字符串不能被修改`，如果要修改只能在原值的基础上新建一个字符串，也不能通过下标访问字符串中的字符。操作字符串可以用`String模块`中的方法。

所有的字符串都存放在一个全局的哈希表中，`相同的字符串只会存储一份`。因此创建多个内容相同的字符串，不会多占用存储空间，字符串之间的比较也是O(1)的。

### table

table是Lua唯一支持的数据结构，它是一个`关联数组`，一种有特殊索引的数组，索引可以是除nil以外的任意类型的值。

下面是一个table的定义和使用：

	local corp = {
	    web = "www.google.com",   --索引为字符串，key = "web",
	                              --            value = "www.google.com"
	    telephone = "12345678",   --索引为字符串
	    staff = {"Jack", "Scott", "Gary"}, --索引为字符串，值也是一个表
	    100876,              --相当于 [1] = 100876，此时索引为数字
	                         --      key = 1, value = 100876
	    100191,              --相当于 [2] = 100191，此时索引为数字
	    [10] = 360,          --直接把数字索引给出
	    ["city"] = "Beijing" --索引为字符串
	}
	
	print(corp.web)               -->output:www.google.com
	print(corp["telephone"])      -->output:12345678
	print(corp[2])                -->output:100191
	print(corp["city"])           -->output:"Beijing"
	print(corp.staff[1])          -->output:Jack
	print(corp[10])               -->output:360

在Lua内部table可能使用哈希表实现的，也可能是用数组实现的，或者两者的混合，这是根据table中的数值动态决定的。

#### 操作table的函数

	table.remove
	table.concat


### function

函数本身也是一种基本类型，可以存储在变量中，以及通过参数传递。

	local function foo()
	    print("in the function")
	    --dosomething()
	    local x = 10
	    local y = 20
	    return x + y
	end
	
	local a = foo    --把函数赋给变量
	
	print(a())

`有名函数`就是将一个匿名函数赋给同名变量，下面的函数定义：

	function foo()
	end

等同于：

	foo = function ()
	end

### array

Lua虽然只有一种数据结构`table`，但是可以通过为table添加按照数字索引的方式，实现数组。

一个新数组就是一个空的table，无法指定大小，可以不停的写入。

	local a = {}    -- new array
	for i = 1, 1000 do
	    a[i] = 0 end
	end

通过`a[i]`的方式读取，如果i超范围，返回nil。

通过`#`操作符，获得数组的长度：

	print(#a) --> 1000

## 表达式

表达式由算术运算符、关系运算符、逻辑运算符、字符串连接组成。

### 算术运算符

算术运算符有：

	+  -  *  /  ^（指数）  %（取模）

需要特别注意的是`/`表示除法，它的结果是浮点数：

	print(5/10)      --结果是0.2，不是0

Lua5.3引入了新的算数运算符`//`，取整除法（floor division），确保返回的是一个整数：

	> 3 // 2        --> 1
	> 3.0 // 2      --> 1.0
	> 6 // 2        --> 3
	> 6.0 // 2.0    --> 3.0
	> -9 // 2       --> -5
	> 1.5 // 0.5    --> 3.0

### 关系运算符

关系运算符有：

	<   >  <=  >=  ==  ~=（不等于）

特别注意，不等于用`~=`表示。

Lua中的`==`和`~=`，比较的是变量绑定对象是否相同，而不是比较绑定的对象的值。

下面两个变量a、b，分别绑定的对象的值相同，但是a和b是不等的：

	local a = { x = 1, y = 0}
	local b = { x = 1, y = 0}
	if a == b then
	  print("a==b")
	else
	  print("a~=b")
	end
	
	---output:
	a~=b

### 逻辑运算符

逻辑运算符包括：

	and   or   not

逻辑运算符`and`和`or`的也需要特别注意，它们的结果是不是0和1，又不是true和false，而是运算符两边的操作数中的一个：

	a and b       -- 如果 a 为 nil，则返回 a，否则返回 b;
	a or b        -- 如果 a 为 nil，则返回 b，否则返回 a。

总结一下就是：对于and和or，返回第一个使表达式的结果确定的操作数。

not的返回结果是true或者false。

### 字符串拼接

字符串拼接运算符是`..`，如果一个操作数是数字，数字被转换成字符串。

需要特别注意的是`..`每执行一次，都会创建一个新的字符串。

如果要将多个字符串拼接起来，为了高效，应当把它们写在一个table中，然后用`table.concat()`方法拼接。

	local pieces = {}
	for i, elem in ipairs(my_list) do
	    pieces[i] = my_process(elem)
	end
	local res = table.concat(pieces)

### 运算符优先级

优先级如下，由高到底排序，同一行的优先级相同：

	^
	not   # -
	*   /   %
	+   -
	..
	< > <=  >=  ==  ~=
	and
	or

## 控制结构

Lua支持一下控制结构：

	if
	while
	repeat
	for
	break
	return

## if

	x = 10
	if x > 0 then
	    print("x is a positive number")
	end
	
	
	x = 10
	if x > 0 then
	    print("x is a positive number")
	else
	    print("x is a non-positive number")
	end
	
	
	score = 90
	if score == 100 then
	    print("Very good!Your score is 100")
	elseif score >= 60 then
	    print("Congratulations, you have passed it,your score greater or equal to 60")
	--此处可以添加多个elseif
	else
	    print("Sorry, you do not pass the exam! ")
	end

### while

	x = 1
	sum = 0
	
	while x <= 5 do
	    sum = sum + x
	    x = x + 1
	end
	print(sum)  -->output 15

特别注意，Lua中没有`continue`，支持`break`。

### repeat

	x = 10
	repeat
	    print(x)
	until false    -- 一直false，死循环

支持`break`。

### for

for分数字for（numeric for）和范型for（generic for）。

数字for，就是设定从一个数值，按照指定的跨度递增，直到终止值：

	for i = 1, 5 do       -- 从1增长到5，每一次增加1
	  print(i)
	end

	for i = 1, 10, 2 do   -- 从1增长到10，每一次增加2
	  print(i)
	end

如果跨度是负数，还可以递减：

	for i = 10, 1, -1 do  -- 从10递减到1，每一次减去1
	  print(i)
	end

范型for，就是迭代器（iterator）：

	local a = {"a", "b", "c", "d"}
	for i, v in ipairs(a) do
	  print("index:", i, " value:", v)
	end

`ipairs()`是遍历数组的迭代器函数，i是索引值，v是索引对应的数值。

支持的迭代器还有：

	io.lines         迭代每行
	paris            迭代table
	ipairs           迭代数组元素
	string.gmatch    迭代字符串中的单词

>在 LuaJIT 2.1 中，ipairs() 内建函数是可以被 JIT 编译的，而 pairs() 则只能被解释执行。
>因此在性能敏感的场景，应当合理安排数据结构，避免对哈希表进行遍历。
>事实上，即使未来 pairs 可以被 JIT 编译，哈希表的遍历本身也不会有数组遍历那么高效，毕竟哈希表就不是为遍历而设计的数据结构。

### break、return

break用于终止循环， return用于从函数中返回结果。

在函数中使用return的时候，需要注意前面加`do`：

	local function foo()
	    print("before")
	    do return end
	    print("after")  -- 这一行语句永远不会执行到
	end

## 函数

函数用关键字`function`定义，默认为全局的。

全局函数保存在全局变量中，会增加性能损耗，应当尽量使用局部函数，前面加上local：

	local function function_name (arc)
	  -- body
	end

函数的定义需要在使用之前。

还可以把函数定义到某个Lua表的某个字段：

	function foo.bar(a, b, c)
	    -- body ...
	end

等同于：

	foo.bar = function (a, b, c)
	    print(a, b, c)
	end

如果参数类型不是table，参数是`按值传递`的，否则传递的是table的引用。

调用函数时，如果传入的参数超过函数定义中的形参个数，多出的实参被忽略，如果传入的参数少于定义中的形参个数，没有被实参初始化的形参被用nil初始化。

变长参数用`...`表示，访问的时候也使用`...`：

	local function func( ... )                -- 形参为 ... ,表示函数采用变长参数
	
	   local temp = {...}                     -- 访问的时候也要使用 ...
	   local ans = table.concat(temp, " ")    -- 使用 table.concat 库函数对数
	                                          -- 组内容使用 " " 拼接成字符串。
	   print(ans)
	end

table按引用传递，可以在函数修改其中的数值：

	function change(arg)             --change函数，改变长方形的长和宽，使其各增长一倍
	  arg.width = arg.width * 2      --表arg不是表rectangle的拷贝，他们是同一个表
	  arg.height = arg.height * 2
	end                              -- 没有return语句了
	
	local rectangle = { width = 20, height = 15 }
	
	change(rectangle)

函数是多值返回的：

	local function swap(a, b)   -- 定义函数 swap，实现两个变量交换值
	   return b, a              -- 按相反顺序返回变量的值
	end
	
	local x = 1
	local y = 20
	x, y = swap(x, y)    

函数返回值个数大于接收返回值的变量的个数的时候，多余的返回值被忽略，小于的时候，多出的接收值被设置为nil。

在多变量赋值的列表表达式中，如果多值返回的函数不在最后一个，那么只有第一个返回值会被使用：

	local function init()       -- init 函数 返回两个值 1 和 "lua"
	    return 1, "lua"
	end
	
	local x, y, z = init(), 2   -- init 函数的位置不在最后，此时只返回 1
	print(x, y, z)              -- output  1  2  nil
	
	local a, b, c = 2, init()   -- init 函数的位置在最后，此时返回 1 和 "lua"
	print(a, b, c)              -- output  2  1  lua

需要注意的是，调用函数时，传入的参数也是列表表达式，遵循同样的规则：

	local function init()
	    return 1, "lua"
	end
	
	print(init(), 2)   -->output  1  2
	print(2, init())   -->output  2  1  lua

如果要确保函数只返回一个值，可以用括号将函数包裹：

	local function init()
	    return 1, "lua"
	end
	
	print((init()), 2)   -->output  1  2
	print(2, (init()))   -->output  2  1

函数回调时，用unpack处理传入的变长参数：

	local function run(x, y)
	    print('run', x, y)
	end
	
	local function attack(targetId)
	    print('targetId', targetId)
	end
	
	local function do_action(method, ...)
	    local args = {...} or {}
	    method(unpack(args, 1, table.maxn(args)))
	end
	
	do_action(run, 1, 2)         -- output: run 1 2
	do_action(attack, 1111)      -- output: targetId    1111

## 模块

模块在[编程语言Lua（一）：入门介绍、学习资料、项目管理与调试方法-Lua Module][2]中已经提过了，这里只记一下怎样写模块。

>在 Lua 中创建一个模块最简单的方法是：创建一个 table，并将所有需要导出的函数放入其中，最后返回这个 table 就可以了。

假设模块my对应的my.lua文件内容下：

	local foo={}
	
	local function getname()
	    return "Lucy"
	end
	
	function foo.greeting()
	    print("hello " .. getname())
	end
	
	return foo

引用模块my：

	local fp = require("my")
	fp.greeting()     -->output: hello Lucy

## 元表 metatable

Lua5.1中，元表相当于重新定义操作符，类似于C++中的操作符重载。

元表用函数`setmetatable(table, metatable)`和函数`getmetatable(table)`操作。

元表是作用在一个具体的table上的，元表中是一组重定义的`元方法`：

支持的元方法有：

	"__add"         + 操作
	"__sub"         - 操作 其行为类似于 "add" 操作
	"__mul"         * 操作 其行为类似于 "add" 操作
	"__div"         / 操作 其行为类似于 "add" 操作
	"__mod"         % 操作 其行为类似于 "add" 操作
	"__pow"         ^ （幂）操作 其行为类似于 "add" 操作
	"__unm"         一元 - 操作
	"__concat"      .. （字符串连接）操作
	"__len"         # 操作
	"__eq"          == 操作 函数 getcomphandler 定义了 Lua 怎样选择一个处理器来作比较操作 仅在两个对象类型相同且有对应操作相同的元方法时才起效
	"__lt"          < 操作
	"__le"          <= 操作
	"__index"       取下标操作用于访问 table[key]
	"__newindex"    赋值给指定下标 table[key] = value
	"__tostring"    转换成字符串
	"__call"        当 Lua 调用一个值时调用
	"__mode"        用于弱表(week table)
	"__metatable"   用于保护metatable不被访问

以重设__index方法为例：

	mytable = setmetatable({key1 = "value1"},   --原始表
	  {__index = function(self, key)            --重载元方法
	    if key == "key2" then
	      return "metatablevalue"
	    end
	  end
	})
	print(mytable.key1,mytable.key2)            --> output：value1 metatablevalue

注意`元方法`中第一个参数是`self`。

`__index`元方法有点特殊，它除了可以是一个函数，还可以是一个table：

	t = setmetatable({[1] = "hello"}, {__index = {[2] = "world"}})
	print(t[1], t[2])   -->hello world

上面名为t的table中,t[2]是存放在`__index`table中，当在t中找不到时，去`__index`table中查找。
这个特性被下面的面向对象编程用到。

## 面向对象

坦白讲，感觉Lua的面向对象很不直观，只是可以实现类似面对对象的功能而已。

### 类的实现

例如下面就是一个类的实现account.lua：

	local _M = {}
	
	local mt = { __index = _M }
	
	function _M.deposit (self, v)
	    self.balance = self.balance + v
	end
	
	function _M.withdraw (self, v)
	    if self.balance > v then
	        self.balance = self.balance - v
	    else
	        error("insufficient funds")
	    end
	end
	
	function _M.new (self, balance)
	    balance = balance or 0
	    return setmetatable({balance = balance}, mt)
	end
	
	return _M

类的方法被装在了`_M`表中，而_M又被赋给了`__index`，__index绑定的是`mt`。

模块返回的是`_M`，调用_M中的new方法的时候，模块中的mt被作为元表绑定到了传入的table，因此传入的table就可以调用mt中的方法。

	local account = require("account")
	
	local a = account:new()
	a:deposit(100)
	
	local b = account:new()
	b:deposit(50)
	
	print(a.balance)  --> output: 100
	print(b.balance)  --> output: 50

### 继承

继承的实现就更麻烦了....下面是一个实现：

	---------- s_base.lua
	local _M = {}
	
	local mt = { __index = _M }
	
	function _M.upper (s)
	    return string.upper(s)
	end
	
	return _M
	
	---------- s_more.lua
	local s_base = require("s_base")
	
	local _M = {}
	_M = setmetatable(_M, { __index = s_base })
	
	
	function _M.lower (s)
	    return string.lower(s)
	end
	
	return _M
	
	---------- test.lua
	local s_more = require("s_more")
	
	print(s_more.upper("Hello"))   -- output: HELLO
	print(s_more.lower("Hello"))   -- output: hello

### 私有成员

私有成员的实现也是非常trick，下面的例子中实现了私有成员balance：

	function newAccount (initialBalance)
	    local self = {balance = initialBalance}
	    local withdraw = function (v)
	        self.balance = self.balance - v
	    end
	    local deposit = function (v)
	        self.balance = self.balance + v
	    end
	    local getBalance = function () return self.balance end
	    return {
	        withdraw = withdraw,
	        deposit = deposit,
	        getBalance = getBalance
	    }
	end
	
	a = newAccount(100)
	a.deposit(100)
	print(a.getBalance()) --> 200
	print(a.balance)      --> nil

感觉非常不好，如果要使用面向对象的设计，就不应该用Lua，对Lua来说太沉重了。

## 变量的作用域

这里有个很大的坑，在一个代码块中定义的变量，如果没有指定是局部变量，那么认为它是全局的。

局部变量必须使用`local`显著标记，否则要么定义了一个全局变量，要么引用其它地方定义的同名全局变量：

	g_var = 1         -- global var
	local l_var = 2   -- local var

局部变量的作用域是定义它的代码库（block），例如while循环中的代码块、if中的代码块：

	x = 10
	local i = 1         -- 程序块中的局部变量 i
	
	while i <=x do
	  local x = i * 2   -- while 循环体中的局部变量 x
	  print(x)          -- output： 2, 4, 6, 8, ...
	  i = i + 1
	end
	
	if i > 20 then
	  local x           -- then 中的局部变量 x
	  x = 20
	  print(x + 2)      -- 如果i > 20 将会打印 22，此处的 x 是局部变量
	else
	  print(x)          -- 打印 10，这里 x 是全局变量
	end
	
	print(x)            -- 打印 10

## 需要注意的问题


## 常用函数

### pairs：遍历Table

[pairs](https://www.lua.org/manual/5.3/manual.html#pdf-pairs)遍历table：

	for k in pairs(cmds) do
	  cmds_arr[#cmds_arr+1] = k
	end

### pcall,xpcall：调用函数

	function pcall(f, arg1, ...) end
	function xpcall(f, msgh, arg1, ...) end

### pl.lapp 处理命令行参数

### _G：存放全局变量的table

[_G](https://www.lua.org/manual/5.3/manual.html#pdf-_G)

## 参考

1. [OpenResty 最佳实践][1]
2. [编程语言Lua（一）：入门介绍、学习资料、项目管理与调试方法-Lua Module][2]

[1]: https://moonbingbing.gitbooks.io/openresty-best-practices/content/ "OpenResty 最佳实践"
[2]: https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/10/22/language-lua-study.html#lua-module "编程语言Lua（一）：入门介绍、学习资料、项目管理与调试方法-Lua Module"
