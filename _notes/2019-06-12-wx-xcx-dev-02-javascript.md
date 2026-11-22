---
title: "微信小程序开发学习笔记（二）: JavaScript"
tags:  小程序
permalink: "/项目/2019/06/12/wx-xcx-dev-02-javascript.html"
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

ECMAScript6 直接上手使用见：[JavaScript/ES6 快速上手教程](https://www.lijiaocn.com/tutorial/c/javascript/)。小程序学习笔记计划都更新到 [这里](https://www.lijiaocn.com/tutorial/c/javascript/) 记录。

对于前端程序员来说，小程序的技术栈和前端开发相差不大，比较容易上手。如果没有接触过前端技术，有必要先补一下前端的知识，对前端有一个整体的认识，[《现代前端技术解析》][2]是非常好的入门书。

这篇笔记里主要记录 JavaScript 的知识，JavaScript 的[标准](https://www.lijiaocn.com/%E6%96%B9%E6%B3%95/2019/06/03/xian-dai-qian-duan-notes.html#javascript-%E6%A0%87%E5%87%86)在不停演进，微信小程序支持了绝大多数 ES6 API ，同时为了安全，小程序不支持动态执行 JS代码 详情见：[微信小程序 JavaScript 支持情况][3]。

[![JavaScript/ES6](https://www.lijiaocn.com/tutorial/img/cover/16x9/javascript.001.jpg)](https://www.lijiaocn.com/tutorial/javascript/2019/06/16/javascript-01-intro/)

## ECMAScript

[ECMAScript][5] 是 ECMA International 指定的标准，目的是创建标准化的 JavaScript，已经发展到了 2018 年的 ES9。不过主流似乎是 2015 年制定 ES6，譬如微信小程序就明确说自己实现了大多数 ES6 的接口。

下面的资料分别是最权威的英文资料和比较权威的中文资料：

1. [ECMAScript® 2018 Language Specification][7] 
2. [ECMAScript 6 入门][4] 
3. [JavaScript 教程][8]

第一份是在 ECMA International 的[标准列表](https://www.ecma-international.org/publications/standards/Stnindex.htm)中找到的 [ES9][6]，奇怪的是没有历史年份的连接。
第二份是[阮一峰](https://www.ruanyifeng.com/)编写的，在我的认知里，阮一峰在前端方面的造诣很高，博客文章清晰易懂，所以他写的《ECMAScript 6 入门]》应该也不错。
第三份是阮一峰在第二份资料中给出 JavaScript 入门教程，这份是阮一峰维护的，很新。

## 大事记摘抄

2013年，ECMA 正式推出 JSON 的国际标准，这意味着 JSON 格式已经变得与 XML 格式一样重要和正式了。

2015年3月，Facebook 公司发布了 React Native 项目，将 React 框架移植到了手机端，可以用来开发手机 App。它会将 JavaScript 代码转为 iOS 平台的 Objective-C 代码，或者 Android 平台的 Java 代码，从而为 JavaScript 语言开发高性能的原生 App 打开了一条道路。

2015年6月，ECMA 标准化组织正式批准了 ECMAScript 6 语言标准，定名为《ECMAScript 2015 标准》。JavaScript 语言正式进入了下一个阶段，成为一种企业级的、开发大规模应用的语言。这个标准从提出到批准，历时10年，而 JavaScript 语言从诞生至今也已经20年了。

2015年6月，Mozilla 在 asm.js 的基础上发布 WebAssembly 项目。这是一种 JavaScript 引擎的中间码格式，全部都是二进制，类似于 Java 的字节码，有利于移动设备加载 JavaScript 脚本，执行速度提高了 20+ 倍。这意味着将来的软件，会发布` JavaScript 二进制包`。

2016年6月，《ECMAScript 2016 标准》发布。与前一年发布的版本相比，它只增加了两个较小的特性。

2017年6月，《ECMAScript 2017 标准》发布，正式引入了` async 函数`，使得异步操作的写法出现了根本的变化。

2017年11月，`所有主流浏览器全部支持 WebAssembly`，这意味着任何语言都可以编译成 JavaScript，在浏览器运行。

摘录自：[JavaScript 周边大事记](https://wangdoc.com/javascript/basic/history.html#%E5%91%A8%E8%BE%B9%E5%A4%A7%E4%BA%8B%E8%AE%B0)。

## ECMAScript 6 入门

按照 [ECMAScript 6 入门][4] 的建议先把 [JavaScript 教程][8] 学习一下，简直让人崩溃...... 快速翻阅了 [JavaScript 教程][8] ，就一个感觉， JavaScript 这门语言太变态了，看了一天，头晕脑胀。

建议将 [JavaScript 教程][8] 大概学习一下，直接就使用 [ECMAScript 6 入门][4] 的语法和用法，直接学习使用正确的方式，而不是记住很多种不建议的用法！

如果对 js 的运行环境、DOM 和浏览器模型等不熟悉，可以熟读 [JavaScript 教程][8] 中的相关章节。

各大浏览器对 ES6 的支持情况：[查看](https://kangax.github.io/compat-table/es6/)。

Babel、Traceur 可以将 ES6 代码转为 ES5 代码。

1. 新增 let 命令，用于声明在所在的代码块内有效的变量；
2. let 定义的命令没有变量提升，必须先声明再使用，let 声明的变量不能重复；
3. let 相当于增加了块级作用域；
4. ES6 允许在块级作用域之中声明函数，函数声明语句的行为类似于let，在块级作用域之外不可引用，ES5 不允许；
5. const 声明不可改变的常量，只在声明的块级作用域内有效；
6. const 要求的是特定内存中的数据不能改动，复合类型数据，变量指向的是保存一个指针，const只能保证指针地址是不变的；
7. 将对象冻结，应该使用 Object.freeze()；
8. 还增加了 import 和 class 命令；
9. var命令和function命令声明的全局变量，依旧是顶层对象的属性；另一方面规定，let命令、const命令、class命令声明的全局变量，不属于顶层对象的属性；
10. Node 模块和 ES6 模块中，this返回的是当前模块；
11. 允许模式匹配的变量定义方式：let [a, b, c] = [1, 2, 3];
12. 

## JavaScript 入门

基本概念分为两部分，第一部分是每种编程语言都会有的基本概念，第二部分是 JavaScript 的运行场景带来的一些特有的属性或操作，主要与浏览器相关。

## 语言自身的基本概念

```
语句
变量
标识符
注释
区块
条件语句
循环语句
运算符
数据类型转化
错误处理
标准库
面向对象
异步操作
```



### 语句

statement，以`;`结尾。

### 变量

用 var 声明（可省略）：

1. 变量名区分大小写；
2. 没有赋值的变量值是特殊值 `undifined`；
3. 是动态类型；
4. 声明变量的语句运行时自动提升到代码头部；
5. ES5 只有两个作用域：`全局作用域`、`函数作用域`，ES6 增加了`块级作用域`。

### 标识符

identifier，用来标记变量、函数等的名字：

1. 区分大小写；
2. 以 Unicode 字母、$、_ 开头。

下面这些保留的关键字不能做标识符：

>arguments、break、case、catch、class、const、continue、debugger、default、delete、do、else、enum、eval、export、extends、false、finally、for、function、if、implements、import、in、instanceof、interface、let、new、null、package、private、protected、public、return、static、super、switch、this、throw、true、try、typeof、var、void、while、with、yield。

### 注释

1. 单行注释用`//`；
2. 多行注释用`/* */`；
3. 历史上兼容 html，`<!--` 和行首的 `-->`也被看作单行注释。

### 区块

block，用 `{ }` 包裹的任意数量的语句，注意 js 中区块不是 var 声明的变量的作用域。

在区块中声明的变量，在区块外可以使用，区块不构成变量的作用域，因此一般也不单独使用：

```js
{
  var a = 1;
}
a // 1
```

### 条件语句

1. 支持 `if ... else if ...` ；
2. 支持 `switch ... case ...`；
3. 真是 `true`，伪是 `false`，优先使用「严格相等运算符」 `===`；
4. switch 的 case 语句判断时用的运算符是` ====`，且需要用 break 跳出；
5. 支持三元运算符 `?...:`。

if 语句：

```js
if (m === 0) {
  // ...
} else if (m === 1) {
  // ...
} else if (m === 2) {
  // ...
} else {
  // ...
}
```

switch 语句，需要使用 break 终止，case 的判断采用的是 `===`：

```js
switch (fruit) {
  case "banana":
    // ...
    break;
  case "apple":
    // ...
    break;
  default:
    // ...
}
```

三元运算符： 

```js
var even = (n % 2 === 0) ? true : false;
```

### 循环语句

1. 支持 `for`、`while`、`do...while`；
2. 支持用 `break` 跳出、用 `continue` 跳过；
3. 可以跳转到指定标签。

for 语句：

```js
for (var i = 0; i < x; i++) {
  console.log(i);
}

for ( ; ; ){
  console.log('Hello World');
}
```

while 语句：

```js
while (i < 100) {
  console.log('i 当前为：' + i);
  i = i + 1;
}

do {
  console.log(i);
  i++;
} while(i < x);
```

跳转到标签：

```js
top:
  for (var i = 0; i < 3; i++){
    for (var j = 0; j < 3; j++){
      if (i === 1 && j === 1) break top;
      console.log('i=' + i + ', j=' + j);
    }
  }
```

### 数据类型

截止 ES6 总过有七种数据类型：

```
数值
字符串
布尔值
undifined
null
对象，又可以分为普通对象、数组、函数。
Symbol （ES6 新增）
```

js 的变量是动态类型，可以用下面的方法判断一个值的类型：

1. typeof
2. instanceof
3. Object.prototype.toString

typeof 的返回值分别是`number`、`string`、`boolean`、`function`、`undifined`、`object`：

```js
typeof 123 // "number"
typeof '123' // "string"
typeof false // "boolean"
typeof null // "object"
typeof window // "object"
typeof {} // "object"
typeof [] // "object"
...
```

#### null 与 undefined

`null` 与 `undefined` 值的含义很接近，在 if 语句中都会被转转成 false，它俩也被 `==` 认为相同。undefined 存在是历史原因，谷歌开发的替代语言 Dart 只有 null 没有 undefined：

```
undefined == null  // true
```

但是，判断一个变量是否存在，typeof 返回的是 undefined，不是 null。

#### 布尔值

应当使用 boolean 的位置，上面的值自动转换为布尔值。

被转换为 false 的类型：

```
undefined
null
false
0
NaN
""或''（空字符串）
```

除此之外，全部是 true。

#### 数值

所有数字都是 64 位的浮点数，1 和 1.0 相同，使用国际标准 IEEE754，符号位 1 位，指数 11 位，小数 52 位。

需要特别注意都是浮点数不是精确值，小数结果需要特别注意：

```js
0.1 + 0.2 === 0.3
// false

0.3 / 0.1
// 2.9999999999999996

(0.3 - 0.2) === (0.2 - 0.1)
// false
```

能够精确表示的十进制数范围是 `-2^53 ~ 2^53`（15位以及以内的十进制数）。

能表示的最大整数是 2^1024，超过这个值时，返回 Infinity：

```js
Math.pow(2, 1024) // Infinity
```

小于等于 2^(-1075）的数值，返回 0：

```js
Math.pow(2, -1075) // 0
```

具体的最大值和最小值用下面的方法获取：

```js
Number.MAX_VALUE // 1.7976931348623157e+308
Number.MIN_VALUE // 5e-324
```

支持科学计数：

```js
123e3 // 123000
123e-3 // 0.123
-3.1E+12
.1e-23
```

八进制前缀 `0o`、`0O`，十六进制前缀 `0x`、`0X`，二进制前缀 `0b`、`0B`。

js 的零有正负之分，在作为分母的时候，两者是有区别的，结果分别是 `+Inifinity` 和 `-Inifinity`：

```js
(1 / +0) === (1 / -0) // false
```

NaN 表示非数值，NaN 本身一个 number，不等于任何值包括自己，与任何其它数的运算都是 NaN：

```js
5 - 'x' // NaN

typeof NaN // 'number'

NaN === NaN // false

NaN + 32 // NaN
```

Infinity 大于 NaN 以外的一切数值，-Inifinity 小于 NaN 以外的一切数值，与 NaN 比较全是返回 false，0 乘以 Infinity 结果是 NaN：

```js
0 * Infinity // NaN
0 / Infinity // 0
Infinity / 0 // Infinity

Infinity + Infinity // Infinity
Infinity * Infinity // Infinity
Infinity - Infinity // NaN
Infinity / Infinity // NaN

undefined + Infinity // NaN
undefined - Infinity // NaN
undefined * Infinity // NaN
undefined / Infinity // NaN
Infinity / undefined // NaN

null * Infinity // NaN
null / Infinity // 0
Infinity / null // Infinity

5 * Infinity // Infinity
5 - Infinity // -Infinity
Infinity / 5 // Infinity
5 / Infinity // 0
```


全局方法 parsetInt()，第一个参数是要转换的字符串，第二个参数是进制:

1. 将字符串转为整数
2. 字符串头部有空格，空格会被自动去除
3. 参数不是字符串，则会先转为字符串再转换
4. 遇到不能转为数字的字符，就不再进行下去，返回已经转好的部分
5. 字符串的第一个字符不能转化为数字（后面跟着数字的正负号除外），返回NaN
6. 返回值只有两种可能，要么是一个十进制整数，要么是NaN
7. 字符串以0开头，将其按照10进制解析
8. 字符串以0x或0X开头，parseInt会将其按照十六进制数解析
9. 将科学计数法的表示方法视为字符串
10. 字符串包含对于指定进制无意义的字符，则从最高位开始，只返回可以转换的数值，如果最高位无法转换，则直接返回NaN。


```js
parseInt('123')  // 123，字符串转换为整数
parseInt('1.23') // 1
parseInt('8a') // 8
parseInt('12**') // 12
parseInt('12.34') // 12
parseInt('15e2') // 15
parseInt('15px') // 15
parseInt('10', 37) // NaN
parseInt('10', 1) // NaN
parseInt('10', 0) // 10
parseInt('10', null) // 10
parseInt('10', undefined) // 10
```

全局方法 parseFloat()，将一个字符串转换成浮点数：

1. 字符串符合科学计数法，则会进行相应的转换
2. 包含不能转为浮点数的字符，则不再进行往后转换，返回已经转好的部分
3. 自动过滤字符串前导的空格
4. 参数不是字符串，或者字符串的第一个字符不能转化为浮点数，则返回NaN
5. 将空字符串转为NaN

isNaN() 判断一个值是否为 NaN。

1. 传入字符串的时候，字符串会被先转成NaN，所以最后返回true
2. 使用isNaN之前，最好判断一下数据类型

```js
function myIsNaN(value) {
  return typeof value === 'number' && isNaN(value);
}
```

判断NaN更可靠的方法是，利用NaN为唯一不等于自身的值的这个特点，进行判断：

```js
function myIsNaN(value) {
  return value !== value;
}
```

isFinite方法返回一个布尔值，表示某个值是否为正常的数值 Infinity、-Infinity、NaN 和 undefined 以外的值都返回 true。

#### 字符串

1. 单引号字符串的内部，可以使用双引号；
2. 双引号字符串的内部，可以使用单引号；
3. 单引号内使用单引号、双引号内使用双引号，必须转义；
4. 由于 HTML 语言的属性值使用双引号，所以很多项目约定 JavaScript 语言的字符串只使用单引号；
5. 字符串默认只能写在一行内，分成多行将会报错；
6. 长字符串必须分成多行，可以在每一行的尾部使用反斜杠；
7. 连接运算符（+）可以连接多个单行字符串；
8. 字符串可以被视为字符数组，编号从 0 开始，超出边界返回 undefined；
9. 无法改变字符串之中的单个字符，字符串内部的单个字符无法改变和增删；
10. length属性返回字符串的长度，无法改变；
11. 使用 Unicode 字符集，引擎内部，所有字符都用 Unicode 表示；
12. 会自动识别一个字符是字面形式表示，还是 Unicode 形式表示，输出时，所有字符都会转成字面形式； 
13. 每个字符在 JavaScript 内部都是以16位（即2个字节）的 UTF-16 格式储存，单位字符长度固定为16位长度，即2个字节；
14. 以为历史原因对 UTF-16 的支持不完整，不支持四字节的字符，一个四字节字符被 js 认为是 2 个字符;

```js
var s = 'hello';
s.length // 5
```



输出多行字符串，利用多行注释的变通：

```js
(function () { /*
line 1
line 2
line 3
*/}).toString().split('\n').slice(1, -1).join('\n')
```

转义字符：

```sh
\0 ：null（\u0000）
\b ：后退键（\u0008）
\f ：换页符（\u000C）
\n ：换行符（\u000A）
\r ：回车键（\u000D）
\t ：制表符（\u0009）
\v ：垂直制表符（\u000B）
\' ：单引号（\u0027）
\" ：双引号（\u0022）
\\ ：反斜杠（\u005C）
```

Unicode 字符表示方法：

1. 反斜杠后面紧跟三个八进制数（000到377），代表一个字符，例如 \251，只能表示 256 种字符；
2. \x后面紧跟两个十六进制数（00到FF），代表一个字符，例如 \xA9，只能表示 256 种字符；
3. \u后面紧跟四个十六进制数（0000到FFFF），代表一个字符，例如 \u00A9。

在非特殊字符前面使用反斜杠，则反斜杠会被省略。

在标识符中使用 Unicode 字符：

```js
var f\u006F\u006F = 'abc';
foo // "abc"
```

一个四字节字符的长度：

```js
'𝌆'.length // 2
```

JavaScript 原生提供两个 Base64 相关的方法：

```sh
btoa()：任意值转为 Base64 编码
atob()：Base64 编码转为原来的值
```

将非 ASCII 码字符转为 Base64 编码，须转码：

```js
function b64Encode(str) {
  return btoa(encodeURIComponent(str));
}

function b64Decode(str) {
  return decodeURIComponent(atob(str));
}

b64Encode('你好') // "JUU0JUJEJUEwJUU1JUE1JUJE"
b64Decode('JUU0JUJEJUEwJUU1JUE1JUJE') // "你好"
```

#### 对象

1. 对象就是一组“键值对”（key-value）的集合，是一种无序的复合数据集合；
2. 所有键名都是字符串（ES6 又引入了 Symbol 值也可以作为键名），可以不加引号；
3. 如果键名是数值，会被自动转为字符串；
4. 键名不符合标识名的条件（比如第一个字符为数字，或者含有空格或运算符），且也不是数字，则必须加上引号；
5. 每一个键名又称为“属性”（property），“键值”可以是任何数据类型；
6. 一个属性的值为函数，通常把这个属性称为“方法”；
7. 属性的值还是一个对象，可以形成了链式引用；
8. 属性之间用逗号分隔，最后一个属性可加可不加；
9. 属性可以动态创建，不必在对象声明时就指定；
10. 不同的变量名指向同一个对象，这些变量都是引用，修改一个影响全部；
11. 引用只局限于对象，如果两个变量指向同一个原始类型的值，变量都是拷贝；
12. 读取对象属性，1 使用点运算符，2 使用方括号运算符，方括号内部可以使用表达式，数字自动转换为字符串； 
13. 数值键名不能使用点运算符，只能使用方括号运算符；
14. 查看一个对象本身的所有属性：Object.keys(obj)；
15. delete 命令用于删除对象的属性，删除成功后返回 true；
16. delete 删除一个不存在的属性，delete不报错，而且返回 true；
17. 只有一种情况，delete命令会返回false，那就是该属性存在，且不得删除；
18. delete 命令只能删除对象本身的属性，无法删除继承的属性；
19. in 运算符用于检查对象是否包含某个属性（注意，检查的是键名，不是键值）；
20. in 运算符能识别哪些属性是对象自身的，哪些属性是继承的,使用对象的 hasOwnProperty 方法判断是否为对象自身的属性；
21. for...in循环用来遍历所有可遍历（enumerable）的属性，会跳过不可遍历的属性，也遍历继承的属性；
22. with 在操作同一个对象的多个属性时，提供一些书写的方便；
23. 如果with区块内部有变量的赋值操作，必须是当前对象已经存在的属性，否则会创造一个当前作用域的全局变量；

对象定义：

```js
var obj = {
  foo: 'Hello',
  bar: 'World'
};
```

读取属性：

```js
var obj = {
  p: 'Hello World'
};

obj.p // "Hello World"
obj['p'] // "Hello World"
```

属性后绑定：

```js
var obj = { p: 1 };

// 等价于

var obj = {};
obj.p = 1;
```

查看对象所有属性：

```js
var obj = {
  key1: 1,
  key2: 2
};

Object.keys(obj);
// ['key1', 'key2']
```

删除对象的属性：

```js
var obj = { p: 1 };
Object.keys(obj) // ["p"]

delete obj.p // true
obj.p // undefined
Object.keys(obj) // []
```

遍历所有可以遍历的属性：

```js
var obj = {a: 1, b: 2, c: 3};

for (var i in obj) {
  console.log('键名：', i);
  console.log('键值：', obj[i]);
}
// 键名： a
// 键值： 1
// 键名： b
// 键值： 2
// 键名： c
// 键值： 3
```

with 语句：

```js
with (obj) {
  p1 = 4;
  p2 = 5;
}
// 等同于
obj.p1 = 4;
obj.p2 = 5;
```

建议不要使用 with 语句，可以考虑用一个临时变量代替 with：

```js
with(obj1.obj2.obj3) {
  console.log(p1 + p2);
}

// 可以写成
var temp = obj1.obj2.obj3;
console.log(temp.p1 + temp.p2);
```

#### 函数

1. 三种声明方式：function 命令、函数表达式、Function 构造函数；
2. 如果同一个函数被多次声明，后面的声明就会覆盖前面的声明；
3. 函数可以调用自身，形成递归（recursion）;
4. 函数与其他数据类型地位平等；
5. 函数名视同变量名，所以采用function命令声明函数时，整个函数会像变量声明一样，被提升到代码头部；
6. 函数的name属性返回函数的名字；
7. 函数自带属性： 函数名 .name、传入参数个数 .length、函数代码 .toString()；
8. 函数外部定义的变量是全局变量，可以在函数内部读取；
9. 函数内部定义的变量会覆盖同名的全局变量；
10. 函数运行时使用的定义函数时的作用域；
11. 调用函数时无论提供多少个参数（或者不提供参数），JavaScript 都不会报错！
12. 一定要省略靠前的参数，只有显式传入undefined；
13. 原始类型的值（数值、字符串、布尔值），传递方式是传值传递；
14. 复合类型的值（数组、对象、其他函数），传递方式是传址传递（pass by reference）；
15. 函数内部修改的，不是参数对象的某个属性，而是替换掉整个参数，不会影响到原始值；
16. 有同名的参数，则取最后出现的那个值；
17. arguments对象包含了函数运行时的所有参数，arguments[0]就是第一个参数；
18. 正常模式下，arguments对象可以在运行时修改，严格模式下，arguments对象与函数参数不具有联动关系（修改arguments对象不会影响到实际的函数参数）；
19. arguments很像数组，但它是一个对象，数组专有的 slice 、forEach 方法不能在 arguments 上使用；
20. arguments对象带有一个callee属性，返回它所对应的原函数；
21. 通过arguments.callee 可以调用函数自身，在严格模式里面是禁用的；
22. 闭包可以读取函数内部的变量，使得内部变量记住上一次调用时的运算结果；
23. 立即执行定义的函数：不要让 function 出现在行首，将其放在一个圆括号里面，或者用其它方法，只要 function 不在行首就可以；
24. eval命令接受一个字符串作为参数，并将这个字符串当作语句执行；
25. 放在eval中的字符串，应该有独自存在的意义，不能用来与eval以外的命令配合使用；
26. 如果eval的参数不是字符串，那么会原样返回；
27. eval没有自己的作用域，都在当前作用域内执行，因此可能会修改当前作用域的变量的值，造成安全问题；
28. 使用严格模式，eval内部声明的变量，不会影响到外部作用域；
29. 凡是使用别名执行eval，eval内部一律是全局作用域；

function 命令声明函数：


```js
function print(s) {
  console.log(s);
}
```

函数表达式声明函数：

```js
var print = function(s) {
  console.log(s);
};
```

Function 构造函数声明：

```js
var add = new Function(
  'x',
  'y',
  'return x + y'
);

// 等同于
function add(x, y) {
  return x + y;
}
```

函数的 name 属性：

```js
function f1() {}
f1.name // "f1"
```

以字符串的形式返回函数的代码：

```js
function f() {
  a();
  b();
  c();
}

f.toString()
// function f() {
//  a();
//  b();
//  c();
// }
```

原生函数返回 `[native code]`：

```js
Math.sqrt.toString()
// "function sqrt() { [native code] }"
```


函数内部修改的，不是参数对象的某个属性，而是替换掉整个参数，不会影响到原始值；

```js
var obj = [1, 2, 3];

function f(o) {
  o = [2, 3, 4];
}
f(obj);

obj // [1, 2, 3]
```

严格模式修改 arguments，对传入参数无影响：

```js
var f = function(a, b) {
  'use strict'; // 开启严格模式
  arguments[0] = 3;
  arguments[1] = 2;
  return a + b;
}

f(1, 1) // 2
```

将 arguments 转换成数组：

```js
var args = Array.prototype.slice.call(arguments);

// 或者
var args = [];
for (var i = 0; i < arguments.length; i++) {
  args.push(arguments[i]);
}
```

```js
var f = function () {
  console.log(arguments.callee === f);
}

f() // true
```

立即执行定义的函数：

```js
(function(){ /* code */ }());
// 或者
(function(){ /* code */ })();
```

严格模式 eval 不影响外部：

```js
(function f() {
  'use strict';
  eval('var foo = 123');
  console.log(foo);  // ReferenceError: foo is not defined
})()
```

使用别名执行 eval，eval 内部用的是全局作用域：

```js
var a = 1;

function f() {
  var a = 2;
  var e = eval;
  e('console.log(a)');
}

f() // 1
```

#### 数组

1. 数组用方括号表示，编号从 0 开始；
2. 数组也可以先定义后赋值；
3. 任何类型的数据，都可以放入数组；
4. 数组属于一种特殊的对象，typeof 运算符会返回数组的类型是 object；
5. 数组的特殊性体现在，它的键名是按次序排列的一组整数（0，1，2...），Object.keys方法返回数组的所有键名；
6. 数组的length属性，返回数组的成员数量，成员最多（2^32-1）个；
7. 数组的数字键不需要连续，length属性的值总是比最大的那个整数键大1；
8. length属性是可写的，人为设置一个小于当前成员个数的值，数组的成员会自动减少到length设置的值；
9. 清空数组的一个有效方法，就是将length属性设为0；
10. 如果人为设置length大于当前元素个数，则数组的成员数量会增加到这个值，新增的位置都是空位;
11. 数组本质上是一种对象，所以可以为数组添加属性，但是这不影响length属性的值；
12. 检查某个键名是否存在的运算符in，适用于对象，也适用于数组；
13. for...in循环不仅可以遍历对象，也可以遍历数组，但是，for...in不仅会遍历数组所有的数字键，还会遍历非数字键。；
14. 不推荐使用for...in遍历数组，考虑使用for循环或while循环；
15. 数组的某个位置是空元素，即两个逗号之间没有任何值，我们称该数组存在空位（hole）；
16. 如果最后一个元素后面有逗号，并不会产生空位；
17. 数组的空位是可以读取的，返回undefined；
18. 使用delete命令删除一个数组成员，会形成空位，并且不会影响length属性；
19. 使用数组的forEach方法、for...in结构、以及Object.keys方法进行遍历，空位都会被跳过；
20. 如果某个位置是undefined，遍历的时候就不会被跳过；
21. 空位就是数组没有这个元素，所以不会被遍历到，而undefined则表示数组有这个元素，值是undefined；
22. 一个对象的所有键名都是正整数或零，并且有length属性，那么这个对象语法上称为“类似数组的对象”（array-like object）；
23. 数组的slice方法可以将“类似数组的对象”变成真正的数组；

数组的数字键不需要连续：

```js
var arr = ['a', 'b'];
arr.length // 2

arr[2] = 'c';
arr.length // 3

arr[9] = 'd';
arr.length // 10

arr[1000] = 'e';
arr.length // 1001
```

把类似数组的对象转换成数组：

```js
var arr = Array.prototype.slice.call('abc');
arr.forEach(function (chr) {
  console.log(chr);
});
// a
// b
// c
```

### 运算符

算数运算符： +、-、*、/、**（指数）、%（余数）、++、--

1. 加法运算符会被重载；
2. 加法外的运算符，所有运算子一律转为数值，再进行相应的数学运算；
3. 运算子是对象，必须先转成原始类型的值，obj.valueOf().toString()；
4. 余数运算符结果的正负号由第一个运算子的正负号决定；
5. 余数运算符还可以用于浮点数的运算，浮点数不是精确的值，无法得到完全准确的结果；
6. 指数运算符是右结合，而不是左结合，先进行最右边的计算；

比较运算符：>、<、<=、>=、==、===、!=、!==。

1. 字符串按照字典顺序进行比较；
2. 两个运算子都是原始类型的值，则是先转成数值再比较；
3. 任何值（包括NaN本身）与NaN比较，返回的都是false；
4. 运算子是对象，会转为原始类型的值，再进行比较；
5. 相等运算符（==）比较两个值是否相等，严格相等运算符（===）比较它们是否为“同一个值”；
6. 两个值不是同一类型，严格相等运算符（===）直接返回false，而相等运算符（==）会将它们转换成同一个类型，再用严格相等运算符进行比较；
7. 严格相等：两个复合类型（对象、数组、函数）的数据比较时，不是比较它们的值是否相等，而是比较它们是否指向同一个地址；
8. 严格相等：正0等于负0；
9. 严格相等：undefined和null与自身严格相等； 
10. “严格不相等运算符”（!==），先求严格相等运算符的结果，然后返回相反值；
11. 普通相等：undefined和null与其他类型的值比较时，结果都为false，它们互相比较时结果为true；
12. 相等运算符隐藏的类型转换，会带来一些违反直觉的结果；
13. 建议不要使用相等运算符（==），最好只使用严格相等运算符（===）；

布尔运算符：!、&&、||、?...:...

二进制运算符：|、&、~、^、<<、>>、>>>（头部补 0 右移动）

1. 位运算符直接处理每一个比特位（bit），速度极快;
2. 位运算符只对整数起作用，如果一个运算子不是整数，会自动转为整数后再执行；
3. 做位运算的时候，是以32位带符号的整数进行运算的，并且返回值也是一个32位带符号的整数；
4. 二进制否运算符（~）将每个二进制位都变为相反值；
5. 一个数与自身的取反值相加，等于-1；
6. 连续对两个数a和b进行三次异或运算，可以互换它们的值；
7. 左移运算符，尾部补0；
8. 右移头部补符号位；
9. 头部补零的右移运算符（>>>）头部一律补零，不考虑符号位；

其它运算符：void（执行表达式，不返回任何值）、,（返回后一个表达式的值）。

void 运算符常用语浏览器连接，方法执行，确不产生页面跳转：

```js
<a href="javascript: void(document.form.submit())">
  提交
</a>
```

加法运算符会被重载：

```js
true + true // 2
1 + true // 2
'a' + 'bc' // "abc"
1 + 'a' // "1a"
false + 'a' // "falsea"
'3' + 4 + 5 // "345"
3 + 4 + '5' // "75"
```

加法外的运算符，所有运算子一律转为数值，再进行相应的数学运算：

```js
1 - '2' // -1
1 * '2' // 2
1 / '2' // 0.5
```

运算子是对象，必须先转成原始类型的值（obj.valueOf().toString()，调用对象的 valueof() 方法，然后调用toString()），然后再相加：

```js
var obj = { p: 1 };
obj.valueOf().toString() // "[object Object]"
```

可以自定定义 valueOf 和 toString 方法：

```js
var obj = {
  valueOf: function () {
    return 1;
  }
};

obj + 2 // 3
```

指数运算符是右结合的：

```js
// 相当于 2 ** (3 ** 2)
2 ** 3 ** 2
// 512
```

利用位运算符特性，将数值转换成 32 位整数：

```js
function toInt32(x) {
  return x | 0;
}
```

### 数据类型转化

1. 强制转换函数 Number()、String()、Boolean()；
2. Number() 转换比 parseInt 严格，有一个字符无法转成数值，整个字符串就会被转为NaN；
3. Number() 的参数是对象时，将返回NaN，除非是包含单个数值的数组；
4. String() 可以将任意类型的值转化成字符串；
5. String() 的参数如果是对象，返回一个类型字符串；如果是数组，返回该数组的字符串形式;
6. Boolean() 将任意类型的值转为布尔值；
7. 比较琐碎的是自动转换，运算符章节已经包含该部分内容；

### 错误处理

1. 解析或者运行时，发生粗欧文抛出用 Error() 构造的对象；
2. Error 实例对象必须有 message 属性，name 和 stack 属性不是标准要求；
3. 原生定义了 Error 的 6 个派生对象：SyntaxError、ReferenceError、RangeError、TypeError、URIError、EvalError；
4. 可以自定义错误对象；
5. 用 throw 抛出错误对象实例，实际 throw 可以抛出任意类型的值；
6. 用 try...catch 捕获thow 抛出的值，try...catch 可以嵌套；
7. 支持 try...catch...finally，finally 无论是否抛出异常都会被执行，中断执行之前先执行 finally 代码块，然后在提示报错信息；
8. catch 中的 throw 和 return 都会等 finally 中的代码执行结束后再运行，但是如果 finally 中有 return ，那么 catch 中的 thrown 和 return 就不会执行了，也就是说如果在 finally 中返回了，就直接返回了；

错误实例：

```js
var err = new Error('出错了');
err.message // "出错了"
```

自定义错误对象：

```js
function UserError(message) {
  this.message = message || '默认信息';
  this.name = 'UserError';
}

UserError.prototype = new Error();
UserError.prototype.constructor = UserError;
```

### 面向对象

1. new 执行构造函数，构造函数返回实例对象；
2. 构造函数内部可以用 new.target，用 new 指令时，new.target指向当前函数；
3. Object.create()：以现有的对象作为模板，生成新的实例对象；
4. this 可以用在构造函数之中，表示实例对象；
5. this 在函数体内部，指代函数当前的运行环境；
6. 全局环境使用this，它指的就是顶层对象window；
7. 构造函数中的this，指的是实例对象；
8. 对象的方法里面包含this，this的指向就是方法运行时所在的对象；
9. this的指向是不确定的，所以切勿在函数中包含多层的this；
10. 数组的map和foreach方法，允许提供一个函数作为参数，这个函数内部不应该使用this；
11. 回调函数中的this往往会改变指向，最好避免使用；
12. JavaScript 提供了call、apply、bind这三个方法，来切换/固定this的指向；
13. 函数实例的call方法，函数内部this指向第一个传入参数，如果参数为空、null和undefined，则默认传入全局对象，后面的参数是函数调用时所需的参数；
14. 函数实例的apply()，函数内部this指向第一个传入参数，第二个参数是调用参数数组；
15. bind方法用于将函数体内的this绑定到某个对象，然后返回一个新函数，剩余参数作为函数的传入参数；
16. 类的继承通过原型对象 prototype 实现， ES6 引入了 class 方法；
17. 原型对象的所有属性和方法，都能被实例对象共享；
18. prototype对象有一个constructor属性，默认指向prototype对象所在的构造函数；
19. instanceof运算符返回一个布尔值，表示对象是否为某个构造函数的实例；
20. 子类的构造函数中调用父类的构造函数：第一步, Super.call(this) ，第二步，子类的原型指向父类的原型；
21. JavaScript 不提供多重继承功能，即不允许一个对象同时继承多个对象。但是，可以通过变通方法，实现这个功能；
22. JavaScript 不是一种模块化编程语言，ES6 才开始支持“类”和“模块”；

用 new 调用构造函数：

```js
function f() {
  console.log(new.target === f);
}

f() // false
new f() // true
```

以现有对象为模版，创建新的对象：

```js
var person1 = {
  name: '张三',
  age: 38,
  greeting: function() {
    console.log('Hi! I\'m ' + this.name + '.');
  }
};

var person2 = Object.create(person1);

person2.name // 张三
person2.greeting() // Hi! I'm 张三.
```

bind 绑定方法：

```js
var print = d.getTime.bind(d);
print() // 1481869925657
```

原型对象：

```js
function Animal(name) {
  this.name = name;
}
Animal.prototype.color = 'white';

var cat1 = new Animal('大毛');
var cat2 = new Animal('二毛');

cat1.color // 'white'
cat2.color // 'white'
```

父类：

```js
function Shape() {
  this.x = 0;
  this.y = 0;
}

Shape.prototype.move = function (x, y) {
  this.x += x;
  this.y += y;
  console.info('Shape moved.');
};
```

子类:

```js
// 第一步，子类继承父类的实例
function Rectangle() {
  Shape.call(this); // 调用父类构造函数
}
// 另一种写法
function Rectangle() {
  this.base = Shape;
  this.base();
}

// 第二步，子类继承父类的原型
Rectangle.prototype = Object.create(Shape.prototype);
Rectangle.prototype.constructor = Rectangle;
```

多重继承：

```js
function M1() {
  this.hello = 'hello';
}

function M2() {
  this.world = 'world';
}

function S() {
  M1.call(this);
  M2.call(this);
}

// 继承 M1
S.prototype = Object.create(M1.prototype);
// 继承链上加入 M2
Object.assign(S.prototype, M2.prototype);

// 指定构造函数
S.prototype.constructor = S;

var s = new S();
s.hello // 'hello'
s.world // 'world'
```

### 异步操作

1. 回调函数；
2. 事件监听；
3. 发布/订阅；
4. 定时器，setTimeout()、setInterval()、clearTimeout()、clearInterval()
5. Promise 对象充当异步操作与回调函数之间的中介，使得异步操作具备同步操作的接口
6. 所有异步任务都返回一个 Promise 实例。Promise 实例有一个then方法，用来指定下一步的回调函数；
7. Promise构造函数接受一个参数分别是resolve和reject的函数，这两个参数是由 JavaScript 提供的函数；
8. resolve：Promise实例的状态从“未完成”变为“成功”，在异步操作成功时调用，并将异步操作的结果，作为参数传递出去；
9. reject：Promise实例的状态从“未完成”变为“失败”，异步操作失败时调用，并将异步操作报出的错误，作为参数传递出去；
10. Promise 实例的then方法，用来添加回调函数；

```js
var timerId = setTimeout(func|code, delay);

var id1 = setTimeout(f, 1000);
var id2 = setInterval(f, 1000);

clearTimeout(id1);
clearInterval(id2);
```

```js
// f1的异步操作执行完成，就会执行f2。
var p1 = new Promise(f1);
p1.then(f2);
```

### 严格模式

严格模式是从 ES5 进入标准，明确禁止一些不合理、不严谨的语法，减少 JavaScript 语言的一些怪异行为。

进入严格模式方法：

```js
'use strict';
```

严格模式特点：

1. 只读属性不可写；
2. 只设置了取值器 get 的属性不可写；
3. 对禁止扩展的对象添加新属性，会报错；
4. eval、arguments 不可用作标识名；
5. 函数不能有重名的参数；
6. 禁止八进制的前缀0表示法；
7. 全局变量必须显式声明；
8. 禁止 this 关键字指向全局对象；
9. 禁止使用 fn.callee、fn.caller；
10. 禁止使用 arguments.callee、arguments.caller;
11. 禁止删除变量；
12. 禁止使用 with 语句；
13. 创设 eval 作用域；
14. arguments 不再追踪参数的变化；
15. 非函数代码块不得声明函数，ES6 会引入块级作用域；
16. 严格模式新增了一些保留字：implements、interface、let、package、private、protected、public、static、yield；

### 编程建议

1. 如果前后两句加上分号后无法解释，js 引擎会将两句合并，即不自动在行尾加分号，会出现很奇特的效果，因此最好不省略分号；
2. switch...case结构可以用对象结构代替。

没有加分号的代码：

```js
a = b = c = 1

a
++
b
--
c

console.log(a, b, c)
// 1 2 0
```

等同于：

```js
a = b = c = 1;
a;
++b;
--c;
```

### 标准库

Object 对象:

1. Object.getPrototypeOf()
2. Object.setPrototypeOf()
3. Object.create()
4. Object.prototype.isPrototypeOf()
5. Object.prototype.__proto__
6. Object.getOwnPropertyNames() 
7. Object.prototype.hasOwnProperty()

对象的拷贝：

```js
function copyObject(orig) {
  var copy = Object.create(Object.getPrototypeOf(orig));
  copyOwnPropertiesFrom(copy, orig);
  return copy;
}

function copyOwnPropertiesFrom(target, source) {
  Object
    .getOwnPropertyNames(source)
    .forEach(function (propKey) {
      var desc = Object.getOwnPropertyDescriptor(source, propKey);
      Object.defineProperty(target, propKey, desc);
    });
  return target;
}
```

ES 2017 引入的写法:

```js
function copyObject(orig) {
  return Object.create(
    Object.getPrototypeOf(orig),
    Object.getOwnPropertyDescriptors(orig)
  );
}
```


属性描述对象:

Array 对象:

包装对象: 

Boolean 对象:

Number 对象:

String 对象:

Math 对象:

Date 对象:

RegExp 对象:

JSON 对象：


## 与运行环境相关的概念

```
DOM
事件
浏览器模型
```
### console 对象

console 是 JavaScript 的原生对象，用于输出信息到控制台，包含以下静态方法：

```js
console.log()
console.info()
console.debug()
console.warn()
console.error()
console.table()  // 将复合类型数据以表格形式显示
console.count()  // console 计数器，以输入参数为标签，分类计数
console.dir()    // 以目录形式显示
console.dirxml() // 以目录树形式显示
console.assert() // 断言，第一个参数是条件，第二个是参数是不成立时的显示值
console.time()，console.timeEnd() //用于计时，参数是计时器名称；
console.group()，console.groupEnd()，console.groupCollapsed()  //显示分组边界
console.trace()  // 显示调用堆栈
console.clear()  // 清空控制台
```

这些方法会：

1. 自动添加换行符；
2. 可以使用格式字符串，支持占位符；
3. console.debug 在打开显示级别在 verbose 的情况下显示；

console 支持的占位符，其中 %c 必须对应 CSS 代码：

```sh
%s 字符串
%d 整数
%i 整数
%f 浮点数
%o 对象的链接
%c CSS 格式字符串
```

### 控制台自带命令行方法

1. $_：上一个表达式值；
2. $0 - $4：最近五个在 Elements 选中的 Dom 元素；
3. $(selector)：第一个匹配的元素；
4. $$(selector)：返回选中的 DOM 对象；
5. $x(path)：返回匹配特定 XPath 表达式的所有 DOM 元素；
6. inspect(object)：打开相关面板，并选中相应的元素，显示它的细节；
7. getEventListeners(object): 登记了回调函数的各种事件；
8. keys(object)：返回一个数组，包含object的所有键名；
9. values(object)：object的所有键值；
10. monitorEvents(object[, events])：监听特定对象上发生的特定事件；
11. Chrome 浏览器中，当代码运行到debugger语句时，就会暂停运行，自动打开脚本源码界面；

### DOM

节点类型 7 种： Document、DocumentType、Element、Attribute、Text、Comment、DocumentFragment。

所有 DOM 对象都继承  Node 属性和方法：

```js
Node.prototype.nodeType
Node.prototype.nodeName
Node.prototype.nodeValue
Node.prototype.textContent
Node.prototype.baseURI
Node.prototype.ownerDocument
Node.prototype.nextSibling
Node.prototype.previousSibling
Node.prototype.parentNode
Node.prototype.parentElement
Node.prototype.firstChild，Node.prototype.lastChild
Node.prototype.childNodes
Node.prototype.isConnected

Node.prototype.appendChild()
Node.prototype.hasChildNodes()
Node.prototype.cloneNode()
Node.prototype.insertBefore()
Node.prototype.removeChild()
Node.prototype.replaceChild()
Node.prototype.contains()
Node.prototype.compareDocumentPosition()
Node.prototype.isEqualNode()，Node.prototype.isSameNode()
Node.prototype.normalize()
Node.prototype.getRootNode()
```

Document 属性和方法：

```js
document.cookie
document.designMode
document.implementation
document.open()，document.close()
document.write()，document.writeln()
document.querySelector()，document.querySelectorAll()
document.getElementsByTagName()
document.getElementsByClassName()
document.getElementsByName()
document.getElementById()
document.elementFromPoint()，document.elementsFromPoint()
document.caretPositionFromPoint()
document.createElement()
document.createTextNode()
document.createAttribute()
document.createComment()
document.createDocumentFragment()
document.createEvent()
document.addEventListener()，document.removeEventListener()，document.dispatchEvent()
document.hasFocus()
document.adoptNode()，document.importNode()
document.createNodeIterator()
document.createTreeWalker()
document.execCommand()，document.queryCommandSupported()，document.queryCommandEnabled()
document.getSelection()
```

Element 属性和方法：

```js
Element.attributes
Element.className，Element.classList
Element.dataset
Element.innerHTML
Element.outerHTML
Element.clientHeight，Element.clientWidth
Element.clientLeft，Element.clientTop
Element.scrollHeight，Element.scrollWidth
Element.scrollLeft，Element.scrollTop
Element.offsetParent
Element.offsetHeight，Element.offsetWidth
Element.offsetLeft，Element.offsetTop
Element.style
Element.children，Element.childElementCount
Element.firstElementChild，Element.lastElementChild
Element.nextElementSibling，Element.previousElementSibling

Element.querySelector()
Element.querySelectorAll()
Element.getElementsByClassName()
Element.getElementsByTagName()
Element.closest()
Element.matches()

Element.scrollIntoView()
Element.getBoundingClientRect()
Element.getClientRects()
Element.insertAdjacentElement()
Element.insertAdjacentHTML()，Element.insertAdjacentText()
Element.remove()
Element.focus()，Element.blur()
Element.click()

Element.getAttribute()
Element.getAttributeNames()
Element.setAttribute()
Element.hasAttribute()
Element.hasAttributes()
Element.removeAttribute()
```

Mutation Observer API 用来监视 DOM 变动。DOM 的任何变动，比如节点的增减、属性的变动、文本内容的变动，这个 API 都可以得到通知

### 事件

```
EventTarget.addEventListener()
EventTarget.removeEventListener()
EventTarget.dispatchEvent()
```

### 浏览器模型

## 参考

1. [李佶澳的博客][1]
2. [读书笔记：《现代前端技术解析》 2017.4出版][2]
3. [微信小程序 JavaScript 支持情况][3]
4. [ECMAScript 6 入门][4]
5. [wikipedia: ECMAScript][5]
6. [Standard ECMA-262][6]
7. [ECMAScript® 2018 Language Specification][7]
8. [JavaScript 教程][8]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.lijiaocn.com/%E6%96%B9%E6%B3%95/2019/06/03/xian-dai-qian-duan-notes.html "读书笔记：《现代前端技术解析》 2017.4出版"
[3]: https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/js-support.html "微信小程序 JavaScript 支持情况"
[4]: https://es6.ruanyifeng.com/ "ECMAScript 6 入门"
[5]: https://en.wikipedia.org/wiki/ECMAScript "wikipedia: ECMAScript"
[6]: https://www.ecma-international.org/publications/standards/Ecma-262.htm "Standard ECMA-262"
[7]: https://www.ecma-international.org/ecma-262/9.0/index.html#Title "ECMAScript® 2018 Language Specification"
[8]: https://wangdoc.com/javascript/ "JavaScript 教程"
