---
layout: default
title:  typescript语法手册
author: lijiaocn
createdate: 2018/03/02 13:52:00
changedate: 2018/03/10 14:15:24
categories: 编程
tags: 编程语言
keywords:
description: 

---

* auto-gen TOC:
{:toc}

## 说明

可以到[TypeScript中文网][6]中学习ts，这里先简单的学习下。

## TypeScript

ts是编译型语言，ts文件被编译成js，ts的语法是js语法的超集。

ts的优势特别显著，它增强了js的语法，可以在编译时检查出语法错误。

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

## 类型注解

ts可以为函数的参数设置类型约束：

	function greeter(person: string) {
		return "Hello, " + person;
	}

注意`: string`，这是js中没有的语法，表示传入参数的类型必须是string。

## 接口

定义接口类型，变量只要实现了接口要求的内容，就可以作为该接口类型使用。

	interface Person {
		firstName: string;
		lastName: string;
	}
	
	function greeter(person: Person) {
		return "Hello, " + person.firstName + " " + person.lastName;
	}
	
	let user = { firstName: "Jane", lastName: "User" };  //user可以作为函数greeter的参数

可以设置可选属性：

	interface SquareConfig {
	  color?: string;
	  width?: number;
	}

可以设置只读属性，只有创建时可以设置值的属性：

	interface Point {
		readonly x: number;
		readonly y: number;
	}
	let p1: Point = { x: 10, y: 20 };
	p1.x = 5; // error!

可以设置一个可以接受任意属性的属性：

	interface SquareConfig {
		color?: string;
		width?: number;
		[propName: string]: any;
	}

可以设置函数类型的属性：

	interface SearchFunc {
	  (source: string, subString: string): boolean;
	}

表示该类型的函数可以赋给对应接口类型的变量：
	
	let mySearch: SearchFunc;
	mySearch = function(source: string, subString: string) {
	  let result = source.search(subString);
	  return result > -1;
	}

可以在接口中定义索引类型:

	interface StringArray {
	  [index: number]: string;
	}

表示当用number索引时，能够得到一个string类型的值，例如：

	let myArray: StringArray;
	myArray = ["Bob", "Fred"];
	
	let myStr: string = myArray[0];

索引类型有两种：字符串索引和数字索引。 

可以同时使用两种类型的索引，但是数字索引的返回值必须是字符串索引返回值类型的`子类型`。

(因为js会把数字转换成string，然后进行按照字符串索引处理)

	class Animal {
		name: string;
	}
	class Dog extends Animal {
		breed: string;
	}

	// 错误：使用number索引时，会得到Animal，违背了[x: string]: Dog!
	interface NotOkay {
		[x: number]: Animal;
		[x: string]: Dog;
	}

因为字符串索引支持`obj.property`和`obj["property"]`两种形式，因此：

	interface NumberDictionary {
	  [index: string]: number;
	  length: number;    // 可以有，length是number类型
	  name: string       // 不能有，`name`的类型与索引类型返回值的类型不匹配
	}

可以将索引签名设置为只读，这样就防止了给索引赋值：

	interface ReadonlyStringArray {
		readonly [index: number]: string;
	}

	let myArray: ReadonlyStringArray = ["Alice", "Bob"];
	myArray[2] = "Mallory"; // error!

类可以实现`implements`后面的接口，接口描述的是类的公有部分：

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

在判断一个类是否实现了`implements`指定的接口时，只会检查类的实例部分，构造函数constructor属于静态部分，不会被检查。

所以下面的Clock类没有实现ClockConstructor接口：

	interface ClockConstructor {
		new (hour: number, minute: number);
	}
	
	class Clock implements ClockConstructor {
		currentTime: Date;
		constructor(h: number, m: number) { }    <--错误： 构造函数不在检查范围内
	}

如果要确保一个类实现了特定类型的构造函数，可以用其它方法绕过：

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

	let digital = createClock(DigitalClock, 12, 17);  //函数createClock的第一个参数类型是ClockConstructor

一个接口可以继承另一个接口，用`extends`指示被继承的接口：

	interface Shape {
	    color: string;
	}
	
	interface Square extends Shape {
	    sideLength: number;
	}

可以同时继承多个接口：
	
	interface Shape {
	    color: string;
	}
	
	interface PenStroke {
	    penWidth: number;
	}
	
	interface Square extends Shape, PenStroke {
	    sideLength: number;
	}

通过接口可以实现混合类型，譬如既是一个函数，又有多个属性：

	interface Counter {
		(start: number): string;
		interval: number;
		reset(): void;
	}

	function getCounter(): Counter {
		let counter = <Counter>function (start: number) { };
		counter.interval = 123;
		counter.reset = function () { };
		return counter;
	}

	let c = getCounter();
	c(10);
	c.reset();
	c.interval = 5.0;

接口还可以继承类，是的，没看错，是继承类，它会继承类的成员，而忽略实现：

接口会继承类的private和protected成员，这时，这个接口只可以被这个类以及它的子类实现。

	class Control {
		private state: any;
	}
	
	interface SelectableControl extends Control {
		select(): void;
	}
	
	// 子类实现接口
	class Button extends Control implements SelectableControl {
		select() { }
	}

	// 非子类，错误：“Image”类型缺少“state”属性。
	class Image implements SelectableControl {
		select() { }
	}

## 类

类与接口是不同的抽象层次，TypeScript中的类与JAVA中的类类似：

使用`new`创建类的实例，在类内部，使用`this.成员名`读取设置成员。

	class Greeter {
		greeting: string;
		constructor(message: string) {
			this.greeting = message;
		}
		greet() {
			return "Hello, " + this.greeting;
		}
	}
	
	let greeter = new Greeter("world");

可以直接为构造函数的参数设置`public`、`private`或者`protected`属性，等同于创建了同名的成员变量。

	class Student {
		fullName: string;
		constructor(public firstName, public middleInitial, public lastName) {
			this.fullName = firstName + " " + middleInitial + " " + lastName;
		}
	}

一个类可以继承`extend`指定的另一个类，子类需要显式调用父类的构造函数，子类可以重写父类的方法：

	class Animal {
		name: string;
		constructor(theName: string) { this.name = theName; }
		move(distanceInMeters: number = 0) {
			console.log(`${this.name} moved ${distanceInMeters}m.`);
		}
	}
	
	class Snake extends Animal {
		constructor(name: string) { super(name); }
		move(distanceInMeters = 5) {
			console.log("Slithering...");
			super.move(distanceInMeters);
		}
	}
	
	class Horse extends Animal {
		constructor(name: string) { super(name); }
		move(distanceInMeters = 45) {
			console.log("Galloping...");
			super.move(distanceInMeters);
		}
	}
	
	let sam = new Snake("Sammy the Python");
	let tom: Animal = new Horse("Tommy the Palomino");
	
	sam.move();
	tom.move(34);

类成员有`public`、`private`和`protected`三种属性，默认是public。

private成员不能在从类的外部访问：

	class Animal {
		private name: string;
		constructor(theName: string) { this.name = theName; }
	}

	new Animal("Cat").name; // 错误: 'name' 是私有的.

protected也不能从类的外部访问，但可以从子类中访问：

	class Person {
		protected name: string;
		constructor(name: string) { this.name = name; }
	}
	
	class Employee extends Person {
		private department: string;
		
		constructor(name: string, department: string) {
			super(name)
			this.department = department;
		}
		
		public getElevatorPitch() {
			return `Hello, my name is ${this.name} and I work in ${this.department}.`;
		}
	}

构造函数也可以是protected，这个类不能被实例化，但可以被继承，它的子类可以实例化：

	class Person {
		protected name: string;
		protected constructor(theName: string) { this.name = theName; }
	}
	
	// Employee 能够继承 Person
	class Employee extends Person {
		private department: string;
		
		constructor(name: string, department: string) {
			super(name);
			this.department = department;
		}
		
		public getElevatorPitch() {
			return `Hello, my name is ${this.name} and I work in ${this.department}.`;
		}
	}
	
	let howard = new Employee("Howard", "Sales");
	let john = new Person("John"); // 错误: 'Person' 的构造函数是被保护的.

类成员还可以被设置为只读的，`readonly`，只读属性必须在声明或者构造函数里初始化：

	class Octopus {
		readonly name: string;
		readonly numberOfLegs: number = 8;
		constructor (theName: string) {
			this.name = theName;
		}
	}
	let dad = new Octopus("Man with the 8 strong legs");
	dad.name = "Man with the 3-piece suit"; // 错误! name 是只读的.

可以为置get和set方法，截断对类成员的读取和修改，即设置存储器：

	let passcode = "secret passcode";
	
	class Employee {
		private _fullName: string;
		
		get fullName(): string {
			return this._fullName;
		}
		
		set fullName(newName: string) {
			if (passcode && passcode == "secret passcode") {
				this._fullName = newName;
			}
			else {
				console.log("Error: Unauthorized update of employee!");
			}
		}
	}
	
	let employee = new Employee();
	employee.fullName = "Bob Smith";
	if (employee.fullName) {
		alert(employee.fullName);
	}

还可以用`static`标识类的静态成员，静态成员是隶属于类的，使用`类名.属性名`的方式读取或者设置。

	class Grid {
		static origin = {x: 0, y: 0};
		calculateDistanceFromOrigin(point: {x: number; y: number;}) {
			let xDist = (point.x - Grid.origin.x);
			let yDist = (point.y - Grid.origin.y);
			return Math.sqrt(xDist * xDist + yDist * yDist) / this.scale;
		}
		constructor (public scale: number) { }
	}

可以用`abstract`指定抽象类，抽象类一般作为父类使用，不会被实例化，抽象方法必须在子类中实现：

	abstract class Department {
		
		constructor(public name: string) {
		}
		
		printName(): void {
			console.log('Department name: ' + this.name);
		}
		
		abstract printMeeting(): void; // 必须在派生类中实现
	}
	
	class AccountingDepartment extends Department {
		
		constructor() {
			super('Accounting and Auditing'); // 在派生类的构造函数中必须调用 super()
		}
		
		printMeeting(): void {
			console.log('The Accounting Department meets each Monday at 10am.');
		}
		
		generateReports(): void {
			console.log('Generating accounting reports...');
		}
	}

`类可以被当成接口使用`，

	class Point {
		x: number;
		y: number;
	}
	
	interface Point3d extends Point {
		z: number;
	}
	
	let point3d: Point3d = {x: 1, y: 2, z: 3};

## 函数

可以创建命名函数和匿名函数：

	function add(x: number, y: number): number {
		return x + y;
	}
	
	let myAdd = function(x: number, y: number): number { return x + y; };

函数的完整定义格式如下，用`=>`指示返回值类型：

	let myAdd: (x: number, y: number) => number =
		function(x: number, y: number): number { return x + y; };

用`?:`标记可选参数：

	function buildName(firstName: string, lastName?: string) {
		if (lastName)
			return firstName + " " + lastName;
		else
			return firstName;
	}
	
	let result1 = buildName("Bob");  // works correctly now
	let result2 = buildName("Bob", "Adams", "Sr.");  // error, too many parameters
	let result3 = buildName("Bob", "Adams");  // ah, just right

用`=`设置参数的默认值，当对应参数为空，或者是undefined的时候，使用默认参数:

	function buildName(firstName: string, lastName = "Smith") {
		return firstName + " " + lastName;
	}
	
	let result2 = buildName("Bob", undefined);       // still works, also returns "Bob Smith"

默认参数在类型上等同于可选参数，例如下面两个函数的类型是相同的：

	function buildName(firstName: string, lastName?: string) {
		// ...
	}
	
	function buildName(firstName: string, lastName = "Smith") {
		// ...
	}

带默认值的参数可以在必选参数前面，这时候如果不传入有默认值的参数，必须明确传入`undefined`。

用`...`标识剩余参数：

	function buildName(firstName: string, ...restOfName: string[]) {
	  return firstName + " " + restOfName.join(" ");
	}
	
	let employeeName = buildName("Joseph", "Samuel", "Lucas", "MacKinzie");

`this`的值在函数调用的时候才会指定，可以用`=>`在函数返回时就绑定正确的对象。

	let deck = {
		suits: ["hearts", "spades", "clubs", "diamonds"],
		cards: Array(52),
		createCardPicker: function() {
			// NOTE: the line below is now an arrow function, allowing us to capture 'this' right here
			return () => {
				let pickedCard = Math.floor(Math.random() * 52);
				let pickedSuit = Math.floor(pickedCard / 13);
				
				return {suit: this.suits[pickedSuit], card: pickedCard % 13};
			}
		}
	}

可以明确指定this的类型:

	let deck: Deck = {
		suits: ["hearts", "spades", "clubs", "diamonds"],
		cards: Array(52),
		// NOTE: The function now explicitly specifies that its callee must be of type Deck
		createCardPicker: function(this: Deck) {
			return () => {
				let pickedCard = Math.floor(Math.random() * 52);
				let pickedSuit = Math.floor(pickedCard / 13);
				
				return {suit: this.suits[pickedSuit], card: pickedCard % 13};
			}
		}
	}

JS是动态类型，可以使用typeof判断传入参数类型，实现重载的效果：

	function pickCard(x: {suit: string; card: number; }[]): number;  <-重载函数列表
	function pickCard(x: number): {suit: string; card: number; };    <-重载函数列表
	function pickCard(x): any {                                      <-注意，这个不属于重载函数
		// Check to see if we're working with an object/array
		// if so, they gave us the deck and we'll pick the card
		if (typeof x == "object") {
			let pickedCard = Math.floor(Math.random() * x.length);
			return pickedCard;
		}
		// Otherwise just let them pick the card
		else if (typeof x == "number") {
			let pickedSuit = Math.floor(x / 13);
			return { suit: suits[pickedSuit], card: x % 13 };
		}
	}

编译器按照重载函数的列表的顺序，进行类型检查，使用第一个命中的重载函数，因此需要
把最精确的定义放在最前面。

## 范型

用范型创建可重用的组件，一个组件可以支持多种类型的数据，用`T`捕获实际传入的参数类型。

	function identity<T>(arg: T): T {
		return arg;
	}



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

也可以忽略不关心的元素：

	let [first] = [1, 2, 3, 4];
	console.log(first); // outputs 1

或者只保留其中的部分元素：

	let [, second, , fourth] = [1, 2, 3, 4];

对象也可以解构，从对象中取出感兴趣的元素：

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

需要特别注意，上面的解构中的冒号用法与声明变量的类型的样式`只是类似`，如果要声明类型需要用下面的方式：

	let { a: newName1, b: newName2 }: {a: string, b: number} = o;

可以在解构时，用`=`设置默认值，下面例子中传入参数的属性b是可选的:

	function keepWholeObject(wholeObject: { a: string, b?: number }) {
		let { a, b = 1001 } = wholeObject;
	}

在函数声明中，也可以使用解构：

	type C = { a: string, b?: number }
	function f({ a, b }: C): void {
		// ...
	}

函数声明的解构通常用来设置默认值：

	function f({ a, b } = { a: "", b: 0 }): void {   //这里使用了类型推断
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

