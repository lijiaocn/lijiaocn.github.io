---
layout: default
title:  typescript语言入门
author: 李佶澳
createdate: 2018/04/18 16:25:00
changedate: 2018/04/18 16:28:54
categories: 编程
tags:  前端
keywords: typescript,javascript,angularjs
description: 了解AngularJS2的时候学习了一下TypeScript

---

* auto-gen TOC:
{:toc}

## TypeScript

ts是编译型语言，ts文件被编译成js，ts的语法是js语法的超集。

ts的优势特别显著，它增强了js的语法，而且可以编译时检查出语法错误。

安装：

	npm install -g typescript

编写源码greeter.ts:

	function greeter(person) {
		return "Hello, " + person;
	}
	
	let user = "Jane User";
	
	document.body.innerHTML = greeter(user);

编译：

	tsc greeter.ts

编译得到greeter.js文件。

### 类型注解

ts可以为函数的参数设置类型约束：

	function greeter(person: string) {
		return "Hello, " + person;
	}

注意`: string`，这是js中没有的语法，表示传入参数的类型必须是string。

## 接口

可以定义一个接口类型，变量只要实现了接口要求的内容，就可以作为接口类型。

	interface Person {
		firstName: string;
		lastName: string;
	}
	
	function greeter(person: Person) {
		return "Hello, " + person.firstName + " " + person.lastName;
	}
	
	let user = { firstName: "Jane", lastName: "User" };

可以定义可选属性：

	interface SquareConfig {
	  color?: string;
	  width?: number;
	}

可以定义只读属性，只有创建时可以设置值的属性：

	interface Point {
		readonly x: number;
		readonly y: number;
	}
	let p1: Point = { x: 10, y: 20 };
	p1.x = 5; // error!

可以定义一个可以接受任意属性的属性：

	interface SquareConfig {
		color?: string;
		width?: number;
		[propName: string]: any;
	}

接口中可以包含函数类型：

	interface SearchFunc {
	  (source: string, subString: string): boolean;
	}

表示可以使用上面列出函数调用，例如：
	
	let mySearch: SearchFunc;
	mySearch = function(source: string, subString: string) {
	  let result = source.search(subString);
	  return result > -1;
	}

接口中可以包含可索引类型:

	interface StringArray {
	  [index: number]: string;
	}

表示当用number索引时，能够得到一个string类型的值，例如：

	let myArray: StringArray;
	myArray = ["Bob", "Fred"];
	
	let myStr: string = myArray[0];

索引类型有两种：字符串索引和数字索引。 可以同时使用两种类型的索引，但是数字索引的返回值必须是字符串索引返回值类型的`子类型`。
(因为js会把数字转换成string，然后进行索引)

	class Animal {
		name: string;
	}
	class Dog extends Animal {
		breed: string;
	}

	// 错误：使用'string'索引，有时会得到Animal!
	interface NotOkay {
		[x: number]: Animal;
		[x: string]: Dog;
	}

因为字符串索引支持`obj.property`和`obj["property"]`两种形式，因此：

	interface NumberDictionary {
	  [index: string]: number;
	  length: number;    // 可以，length是number类型
	  name: string       // 错误，`name`的类型与索引类型返回值的类型不匹配
	}

将索引签名设置为只读，这样就防止了给索引赋值：

	interface ReadonlyStringArray {
		readonly [index: number]: string;
	}

	let myArray: ReadonlyStringArray = ["Alice", "Bob"];
	myArray[2] = "Mallory"; // error!

可以要求一个类实现了某个接口，接口描述的是类的公有部分：

	interface ClockInterface {
		currentTime: Date;
		setTime(d: Date);
	}

	class Clock implements ClockInterface {
		currentTime: Date;
		setTime(d: Date) {
			this.currentTime = d;
		}
		constructor(h: number, m: number) { }
	}

在实现接口的时候，只会检查类的实例部分，构造函数constructor存在于静态部分，不会被检查。
所以下面的实现会报错：

	interface ClockConstructor {
		new (hour: number, minute: number);
	}
	
	class Clock implements ClockConstructor {
		currentTime: Date;
		constructor(h: number, m: number) { }    <--错误，构造函数不在检查范围内
	}

如果要检查构造函数，可以用其它方法绕过：

	interface ClockConstructor {
		new (hour: number, minute: number): ClockInterface;
	}
	interface ClockInterface {
		tick();
	}

	function createClock(ctor: ClockConstructor, hour: number, minute: number): ClockInterface {
		return new ctor(hour, minute);
	}

	class DigitalClock implements ClockInterface {
		constructor(h: number, m: number) { }
		tick() {
			console.log("beep beep");
		}
	}

	let digital = createClock(DigitalClock, 12, 17);

继承接口...TODO
混合类型..TODO

## 类

类与接口是不同的抽象层次，类可以定义构造函数：

	class Student {
		fullName: string;
		constructor(public firstName, public middleInitial, public lastName) {
			this.fullName = firstName + " " + middleInitial + " " + lastName;
		}
	}

在类的构造函数的参数上使用`public`等同于创建了同名的成员变量。

类的实例如果满足接口的要求，也可作为接口类型：

	function greeter(person : Person) {
	    return "Hello, " + person.firstName + " " + person.lastName;
	}
	
	let user = new Student("Jane", "M.", "User");
	
	document.body.innerHTML = greeter(user);

## 类型

布尔boolean:

	let isDone: boolean = false;

数字number：

	let decLiteral: number = 6;
	let hexLiteral: number = 0xf00d;
	let binaryLiteral: number = 0b1010;
	let octalLiteral: number = 0o744;

字符串string：

	let name: string = "bob";
	name = "smith";

模版字符串，用反引号包裹：

	let sentence: string = `Hello, my name is ${ name }.
	
	I'll be ${ age + 1 } years old next month.`;

等同于：

	let sentence: string = "Hello, my name is " + name + ".\n\n" +
	    "I'll be " + (age + 1) + " years old next month.";

数组Array：

	let list: number[] = [1, 2, 3];
	let list: Array<number> = [1, 2, 3];      //指定数组元素类型为number

只读数组ReadonlyArray：

	let a: number[] = [1, 2, 3, 4];
	let ro: ReadonlyArray<number> = a;
	ro[0] = 12; // error!
	ro.push(5); // error!
	ro.length = 100; // error!
	a = ro; // error!     将其赋值给普通数组也不可以

元组，元组中可以包含多个不同类型的变量：

	// Declare a tuple type
	let x: [string, number];
	
	// Initialize it
	x = ['hello', 10]; // OK
	
	// Initialize it incorrectly
	x = [10, 'hello']; // Error

元组中的变量通过索引获取：

	console.log(x[0].substr(1)); // OK
	console.log(x[1].substr(1)); // Error, 'number' does not have 'substr'

对元组的索引类型操作越界时，使用联合类型：

	x[3] = 'world'; // OK, 字符串可以赋值给(string | number)类型
	
	console.log(x[5].toString()); // OK, 'string' 和 'number' 都有 toString
	
	x[6] = true; // Error, 布尔不是(string | number)类型

枚举enum：

	enum Color {Red, Green, Blue}
	let c: Color = Color.Green;

任意类型any:

	let notSure: any = 4;
	notSure = "maybe a string instead";
	notSure = false; // okay, definitely a boolean

any不同于Object：

	let notSure: any = 4;
	notSure.ifItExists(); // okay, ifItExists might exist at runtime
	notSure.toFixed(); // okay, toFixed exists (but the compiler doesn't check)
	
	let prettySure: Object = 4;
	prettySure.toFixed(); // Error: Property 'toFixed' doesn't exist on type 'Object'.

空类型void:

	function warnUser(): void {
		alert("This is my warning message");
	}

undefined和null，是所有类型的子类型:

	// Not much else we can assign to these variables!
	let u: undefined = undefined;
	let n: null = null;

当你指定了--strictNullChecks标记，null和undefined只能赋值给void和它们各自。

永不存在值的类型never：

	// 返回never的函数必须存在无法达到的终点
	function error(message: string): never {
		throw new Error(message);
	}

	// 推断的返回值类型为never
	function fail() {
		return error("Something failed");
	}

	// 返回never的函数必须存在无法达到的终点
	function infiniteLoop(): never {
		while (true) {
		}
	}

never类型是那些总是会抛出异常或根本就不会有返回值的函数表达式或箭头函数表达式的返回值类型；
变量也可能是 never类型，当它们被永不为真的类型保护所约束时。

类型断言(叫做类型转换更恰当),

	let someValue: any = "this is a string";
	let strLength: number = (<string>someValue).length;      //尖括号样式

	let someValue: any = "this is a string";
	let strLength: number = (someValue as string).length;    //as样式

## 变量声明

相比var，用let声明的变量存在于词法作用域，且不能在作用域内被重复定义，`var声明的变量可以包含它们的函数外访问`。

用let声明变量与在其它语言声明变量类似，let的目的主要是消除var带来的很多困扰。

const用来声明常量，被赋值后不能再改变。

## 类型推断

没有明确指定类型时候，类型是推断出来的。

推断为基础类型：

	let x = 3;    //推断为number

推断为最佳通用类型，使用这些表达式的类型来推断出一个最合适的通用类型：

	let x = [0, 1, null];   //使用兼容所有成员

如果，没有一个类型能做为所有候选类型的类型：

	let zoo = [new Rhino(), new Elephant(), new Snake()];

可以指定期待的类型：

	let zoo: Animal[] = [new Rhino(), new Elephant(), new Snake()];

如果没有找到最佳通用类型的话，类型推断的结果为联合数组类型，(Rhino | Elephant | Snake)[]。

根据上下文推断：

	window.onmousedown = function(mouseEvent) {
		console.log(mouseEvent.button);  //<- Error
	};

	//根据函数windows.onmousedown推断出mouseEvent的类型。

包含明确的类型后，就不再推断：

	window.onmousedown = function(mouseEvent: any) {
	    console.log(mouseEvent.button);  //<- Now, no error is given
	};

下面的最佳通用类型有4个候选者：Animal，Rhino，Elephant和Snake。Animal会被做为最佳通用类型。

	function createZoo(): Animal[] {
		return [new Rhino(), new Elephant(), new Snake()];
	}

## 展开

数组展开，做了一份浅拷贝，不会更改被展开的对象：

	let first = [1, 2];
	let second = [3, 4];
	let bothPlus = [0, ...first, ...second, 5];
	
	//bothPlus为：[0, 1, 2, 3, 4, 5]

对象展开，只会包含对象自身可以枚举的属性：

	let defaults = { food: "spicy", price: "$$", ambiance: "noisy" };
	let search = { ...defaults, food: "rich" };
	
	//search为： { food: "rich", price: "$$", ambiance: "noisy" }

## 解构

解构是与展开相对的概念，可以理解为取出被解构对象中的部分值。

数组的解构：

	let input = [1, 2];
	let [first, second] = input;
	console.log(first); // outputs 1
	console.log(second); // outputs 2

创建了两个命名变量first和second，相当于：

	first = input[0];
	second = input[1];

可以作用于已有的变量：

	// swap variables
	[first, second] = [second, first];

可以作用于函数参数：

	function f([first, second]: [number, number]) {
		console.log(first);
		console.log(second);
	}
	f(input);

可以用`...`创建剩余变量：

	let [first, ...rest] = [1, 2, 3, 4];
	console.log(first); // outputs 1
	console.log(rest); // outputs [ 2, 3, 4 ]

也可以忽略不关系的元素：

	let [first] = [1, 2, 3, 4];
	console.log(first); // outputs 1

或者只保留其中的部分元素：

	let [, second, , fourth] = [1, 2, 3, 4];

对象也可以解构，取出感兴趣的元素：

	let o = {
		a: "foo",
		b: 12,
		c: "bar"
	};
	let { a, b } = o;

也可以解构没有声明的变量：

	({ a, b } = { a: "baz", b: 101 });  //需要用()包裹

在对象解构中，也可以用`...`创建剩余变量：

	let { a, ...passthrough } = o;
	let total = passthrough.b + passthrough.c.length;

还可以修改属性名:

	let { a: newName1, b: newName2 } = o;

等同于：

	let newName1 = o.a;
	let newName2 = o.b;

需要特别注意，上面的解构中的冒号用法与声明变量的类型的样式`只是类似`，如果要声明类型要用下面的方式：

	let { a: newName1, b: newName2 }: {a: string, b: number} = o;

可以是在解构时，用`=`设置默认值，传入参数的b是可选的:

	function keepWholeObject(wholeObject: { a: string, b?: number }) {
		let { a, b = 1001 } = wholeObject;
	}

在函数声明中，也可以使用解构：

	type C = { a: string, b?: number }
	function f({ a, b }: C): void {
		// ...
	}

函数声明的解构通过用来设置默认值：

	function f({ a, b } = { a: "", b: 0 }): void {   //这里的使用了类型推断
		// ...
	}
	f(); // ok, default to { a: "", b: 0 }

在函数声明中使用解构的时候，传入的参数，需要包含必须有的属性：

	function f({ a, b = 0 } = { a: "" }): void {     //这里使用了类型推断
		// ...
	}
	f({ a: "yes" }); // ok, default b = 0
	f(); // ok, default to {a: ""}, which then defaults b = 0
	f({}); // error, 'a' is required if you supply an argument

## 参考

1. [TypeScript中文网][1]

[1]: https://www.tslang.cn/ "TypeScript中文网"
