---
layout: default
title: "使用Lua编程时需要注意的一些影响性能的操作"
author: 李佶澳
createdate: "2018-12-10 21:01:58 +0800"
last_modified_at: "2018-12-10 21:01:58 +0800"
categories: 编程
tags: lua
keywords: lua,lua编程,lua性能,性能优化,lua优化
description: Lua Performance Tips给出了很重要的性能优化建议，这些建议都是用Lua编程时需要时刻注意的事项。
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

[Lua Performance Tips](https://www.lua.org/gems/sample.pdf)给出了很重要的性能优化建议，这些建议都是用Lua编程时需要时刻注意的事项。

本页内容可以到[Lua编程时性能方面的注意事项](http://www.lijiaocn.com/nginx/chapter1/03-lua-performance.html)中分章节查看。

## 局部变量比全局变量快30%

Lua代码是被解释执行的，Lua代码被解释成Lua虚拟机的指令，交付给Lua虚拟机执行。

Lua虚拟机不是对常见的物理计算机的模拟，而是完全定义了自己的规则。Lua虚拟机中虚拟了寄存器，但是它的寄存器是和函数绑定的一起的，并且每个函数可以使用高达250个虚拟寄存器（使用栈的方式实现的）。

操作局部变量时，使用的指令非常少，例如`a=a+b`只需要一条指令`ADD 0 0 1`。

如果`a`和`b`是全局变量，则需要四条指令：

	GETGLOBAL       0 0     ; a
	GETGLOBAL       1 1     ; b
	ADD             0 0 1
	SETGLOBAL       0 0     ; a

下面两段代码var_global.lua和var_local.lua性能相差30%：

var_global.lua：

```lua
for i = 1, 1000000 do
local x = math.sin(i)
end
```

var_local.lua：

```lua
local sin = math.sin
for i = 1, 1000000 do
local x = sin(i)
end
```

运行耗时占比：

```bash
➜  03-performance git:(master) ✗ time lua5.1 ./var_global.lua
lua5.1 ./var_global.lua  8.02s user 0.01s system 99% cpu 8.036 total

➜  03-performance git:(master) ✗ time lua5.1 ./var_local.lua
lua5.1 ./var_local.lua  6.01s user 0.01s system 99% cpu 6.026 total
```

因此在阅读使用lua代码时，经常看到下面的做法，将其它包中的变量赋值给本地变量：

```lua
local sin = math.sin
function foo (x)
  for i = 1, 1000000 do
    x = x + sin(i)
  end
  return x
end

print(foo(10))
```

## 动态加载代码是非常慢的

Lua中可以用[load](http://www.lua.org/manual/5.1/manual.html#pdf-load)、[load](http://www.lua.org/manual/5.1/manual.html#pdf-loadfile)和[loadstring](http://www.lua.org/manual/5.1/manual.html#pdf-loadstring)动态加载代码并执行。应当尽量避免这种用法，动态加载代码需要被立即编译，编译开销很大。

load_dynamic.lua：

```lua
local lim = 10000000
local a = {}
for i = 1, lim do
	a[i] = loadstring(string.format("return %d", i))
end
print(a[10]())  --> 10
```

load_static.lua：

```lua
function fk (k)
	return function () return k end
end

local lim = 10000000
local a = {}
for i = 1, lim do
	a[i] = fk(i)
end

print(a[10]())  --> 10
```

上面两段代码的性能完全不同，后者耗时只有前者的十分之一：

```bash
➜  03-performance git:(master) ✗ time lua-5.1 ./load_dynamic.lua
10
lua-5.1 ./load_dynamic.lua  47.99s user 3.81s system 99% cpu 52.069 total

➜  03-performance git:(master) ✗ time lua-5.1 ./load_static.lua
10
lua-5.1 ./load_static.lua  4.66s user 0.62s system 99% cpu 5.308 total
```

## table容量扩增的代价很高

Lua的table是由`数组部分（array part）`和`哈希部分（hash part）`组成。数组部分索引的key是1~n的整数，哈希部分是一个哈希表（open address table）。

向table中插入数据时，如果已经满了，Lua会重新设置数据部分或哈希表的大小，容量是成倍增加的，哈希部分还要对哈希表中的数据进行整理。

需要特别注意的没有赋初始值的table，数组和部分哈希部分默认容量为0。

```lua
local a = {}     --容量为0
a[1] = true      --重设数组部分的size为1
a[2] = true      --重设数组部分的size为2
a[3] = true      --重设数组部分的size为4

local b = {}     --容量为0
b.x = true       --重设哈希部分的size为1
b.y = true       --重设哈希部分的size为2
b.z = true       --重设哈希部分的size为4
```

因为容量是成倍增加的，因此越是容量小的table越容易受到影响，每次增加的容量太少，很快又满。

对于存放少量数据的table，要在创建table变量时，就设置它的大小，例如：

table_size_predefined.lua：

```lua
for i = 1, 1000000 do
  local a = {true, true, true}   -- table变量a的size在创建是确定
  a[1] = 1; a[2] = 2; a[3] = 3   -- 不会触发容量重设
end
```

如果创建空的table变量，插入数据时，会触发容量重设，例如：

table_size_undefined.lua：

```lua
for i = 1, 1000000 do
  local a = {}                   -- table变量a的size为0
  a[1] = 1; a[2] = 2; a[3] = 3   -- 触发3次容量重设
end
```

后者耗时几乎是前者的两倍：

```bash
➜  03-performance git:(master) ✗ time lua-5.1 table_size_predefined.lua
lua-5.1 table_size_predefined.lua  4.17s user 0.01s system 99% cpu 4.190 total

➜  03-performance git:(master) ✗ time lua-5.1 table_size_undefined.lua
lua-5.1 table_size_undefined.lua  7.63s user 0.01s system 99% cpu 7.650 total
```
对于哈希部分也是如此，用下面的方式初始化:

	local b = {x = 1, y = 2, z = 3}

## table只有在插入数据时，才会rehash

table只有在满的情况下，继续插入的数据的时候，才会触发rehash。如果将一个table中的数据全部设置为nil，后续没有插入操作，这个table的大小会继续保持原状，不会收缩，占用的内存不会释放。
除非不停地向table中写入nil，写入足够多的次数后，重新触发rehash，才会发生收缩：

```lua
a = {}
lim = 10000000

for i = 1, lim do a[i] = i end            --  create a huge table
print(collectgarbage("count"))            --> 196626

for i = 1, lim do a[i] = nil end          --  erase all its elements
print(collectgarbage("count"))            --> 196626，不会收缩

for i = lim + 1, 2*lim do a[i] = nil end  --  create many nil element
print(collectgarbage("count"))            --> 17，添加足够多nil之后才会触发rehash
```

**不要用这种方式触发rehash**，如果想要释放内存，就直接释放整个table，不要通过清空它包含的数据的方式进行。

将table中的成员设置为nil的时候，不触发rehash，是为了支持下面的用法：

```lua
for k, v in pairs(t) do
  if some_property(v) then
    t[k] = nil    -- erase that element
  end
end
```

如果每次设置nil都触发rehash，那么上面的操作就是一个灾难。

## 清理table中的所有数据时，用pairs，不要用next

如果要在保留table变量的前提下，清理table中的所有数据，一定要用[pairs()](http://www.lua.org/manual/5.1/manual.html#pdf-pairs)函数，不能用[next()](http://www.lua.org/manual/5.1/manual.html#pdf-next)。

next()函数是返回中的table第一个成员，如果使用下面方式，next()每次从头开始查找第一个非nil的成员：

```lua
while true do
	local k = next(t)
	if not k then break end
	t[k] = nil
end
```

正确的做法是用`pairs`：

```lua
for k in pairs(t) do
	t[k] = nil
end
```

## 慎用字符串拼接

Lua中的字符串是非常不同的，它们全部是内置的（internalized），或者说是全局的，变量中存放的是字符串的地址，并且每个变量索引的都是全局的字符串，没有自己的存放空间。

例如下面的代码，为变量a和变量b设置了同样的内容的字符串"abc"，"abc"只有一份存在，a和b引用的是同一个：

	local a = "abc"
	local b = "abc"

如果要为a索引的字符串追加内容，那么会创建一个新的全局字符串：

	a = "abc" .. "def"

创建全局字符串的开销是比较大的，在lua中慎用字符串拼接。

如果一定要拼接，将它们写入table，然后用`table.contat()` 连接起来，如下：

```lua
local t = {}
for line in io.lines() do
  t[#t + 1] = line
end

s = table.concat(t, "\n")
```

## 尽量少创建变量

假设要存放多边形的多个顶点，每个顶点一个x坐标，一个y坐标。

方式一，每个顶点分配一个table变量：

```lua
polyline = { { x = 10.3, y = 98.5 },
             { x = 10.3, y = 18.3 },
             { x = 15.0, y = 98.5 },
             ...
           }
```

方式二，每个顶点分配一个数组变量，开销要比第一种方式少：

```lua
polyline = { { 10.3, 98.5 },
             { 10.3, 18.3 },
             { 15.0, 98.5 },
             ...
           }
```

方式三，将x坐标和y坐标分别存放到两个数组的中，一共只需要两个数组变量，开销更少：

```lua
polyline = { x = { 10.3, 10.3, 15.0, ...},
             y = { 98.5, 18.3, 98.5, ...}
           }
```

要有意思的的优化代码，尽量少创建变量。

## 在循环外部创建变量

如果在循环内创建变量，那么每次循环都会创建变量，导致不必要的创建、回收：

在循环内创建变量，var_inloop.lua：

```lua
function foo ()
	for i = 1, 10000000 do
		local t = {0}
		t[1]=i
	end
end

foo()

```

在循环外创建变量，var_outloop.lua：

```lua
local t={0}
function foo ()
	for i = 1, 10000000 do
		t[1] = i
	end
end

foo()
```

这两段代码的运行时间不是一个数量级的：

```bash
➜  03-performance git:(master) ✗ time lua-5.1 var_inloop.lua
lua-5.1 var_inloop.lua  3.41s user 0.01s system 99% cpu 3.425 total

➜  03-performance git:(master) ✗ time lua-5.1 var_outloop.lua
lua-5.1 var_outloop.lua  0.22s user 0.00s system 99% cpu 0.224 total
	
```

变量是这样的，函数也是如此：

```lua
local function aux (num)
	num = tonumber(num)
	if num >= limit then return tostring(num + delta) end
end
	
for line in io.lines() do
	line = string.gsub(line, "%d+", aux)
	io.write(line, "\n")
end
```

不要用下面的这种方式：

```lua
for line in io.lines() do
	line = string.gsub(line, "%d+", 
	     function (num)
	         num = tonumber(num)
	         if num >= limit then return tostring(num + delta) 
	     end
	)
	io.write(line, "\n")
end
```

## 尽量在字符串上创建分片

能用分片表示字符串，就不要创建新的字符串。

## 缓存运行结果，减少运算

```lua
function memoize (f)
    local mem = {}                       -- memoizing table
    setmetatable(mem, {__mode = "kv"})   -- make it weak
    return function (x)       -- new version of ’f’, with memoizing
        local r = mem[x]
        if r == nil then      -- no previous result?
            r = f(x)          -- calls original function
            mem[x] = r        -- store result for reuse
        end
        return r
    end
end
```

用`memoize()`创建的函数的运算结果可以被缓存：

```lua
loadstring = memoize(loadstring)
```

## 主动控制垃圾回收

可以通过`collectgarbage`干预垃圾回收过程，通过collectgarbage可以停止和重新启动垃圾回收。

可以在需要被快速运行完成的地方，关闭垃圾回收，等运算完成后再重启垃圾回收。

## 参考

1. [Nginx、OpenResty、Lua与Kong](https://www.lijiaocn.com/nginx/)
2. [What can I do to increase the performance of a Lua program?](https://stackoverflow.com/questions/154672/what-can-i-do-to-increase-the-performance-of-a-lua-program)
3. [Lua Performance Tips](http://www.lua.org/gems/sample.pdf)
4. [Lua Optimisation Tips](http://lua-users.org/wiki/OptimisationTips)
5. [luajit官方性能优化指南和注解](https://www.cnblogs.com/zwywilliam/p/5992737.html)
6. [Numerical Computing Performance Guide](http://wiki.luajit.org/Numerical-Computing-Performance-Guide)
