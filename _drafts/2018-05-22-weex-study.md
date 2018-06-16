---
layout: default
title: Weex原生应用开发框架初次使用
author: 李佶澳
createdate: 2018/05/22 13:31:00
changedate: 2018/06/03 22:33:03
categories: 项目
tags: 前端
keywords: weex,入门,初次使用,前端开发
description: Weex原生应用开发框架，一次开发，ios、android、web三端支持，体验一下

---

* auto-gen TOC:
{:toc}

## 说明

[Weex官方文档][1]相当不错。

网易严选App感受Weex开发][10]介绍了用Weex仿制网易严选的过程。

## 工作原理

[Weex工作原理][2]是将代码文件打包成一段JS代码，成为一个Weex的JS bundle，该文件被部署到云端。
APP[集成][6]了Weex SDK后，会准备一个JS执行环境，将云端的JS bundler加载之后，将执行中产生的命令发送
native端：

![weex工作原理](http://weex.apache.org/cn/guide/images/flow.png)

IOS中使用的JS引擎是基于JavaScriptCore内核的JSContext，Android中使用的也是JavaScriptCore。

## 基本组成

Weex的开发体验类似于Web开发，并且支持vue、rax框架，但是在weex中使用的内置组件，而不是html组件，
见[Weex与Web平台的差异][4]。

Weex的开发接口由三部分组成：API、内置组件、内置模块。见[Weex手册][3]。

Weex开发时可以使用Vue和Rax框架，见[Weex中的前端框架][7]。

## 开发环境

安装：

	brew install node
	npm config set registry https://registry.npm.taobao.org
	npm install -g weex-toolkit
	weex -v

或者：

	npm install -g cnpm --registry=https://registry.npm.taobao.org
	cnpm install -g weex-toolkit

创建项目：

	weex create example-1

安装项目依赖：

	cd example-1
	npm install

运行项目：

	npm run dev
	npm run serve

默认使用的前段框架是vue，vue的使用可以参考[vue起步][9]。

## IOS模拟器

需要现在mac中安装xcode，然后执行下面的命令：

	sudo gem install cocoapods
	weex platfrom add ios
	weex run ios

如果遇到错误：

	stderr: xcode-select: error: tool 'xcodebuild' requires Xcode, but active developer directory '/Library/Developer/CommandLineTools' is a command line tools instance

执行下面的命令，指定xcode路径：

	sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

`weex run ios`运行时会下载相关文件，最终会提示选择模拟器，选择后会启动ios模拟器。

打包:

	weex build ios

如果提示错误：

	You should config `CodeSign` and `Profile` in the `ios.config.json`

## 要点摘抄

[网易严选App感受Weex开发][10]:

Weex 容器默认的显示宽度 (viewport) 是 750px，页面中的所有组件都会以 750px 作为满屏宽度。

所以我们在使用 Weex 做 UI 适配时就没有所谓的 @2x 图和 @3x 图，所有的尺寸都是Weex帮我们根据
750 作为基数宽做的缩放。

Weex提供了改变此显示宽度的 API，setViewport

[vue教程][11]

每个Vue应用都是通过用Vue函数创建一个新的 Vue 实例。

所有的Vue组件都是 Vue 实例，并且接受相同的选项对象 (一些根实例特有的选项除外)

当一个 Vue 实例被创建时，它向 Vue 的响应式系统中加入了其 data 对象中能找到的所有的属性，当这些属性的值发生改变时，视图将会产生“响应”，即匹配更新为新的值:

	// 我们的数据对象
	var data = { a: 1 }
	
	// 该对象被加入到一个 Vue 实例中
	var vm = new Vue({
	  data: data
	})
	
	// 获得这个实例上的属性
	// 返回源数据中对应的字段
	vm.a == data.a // => true
	
	// 设置属性也会影响到原始数据
	vm.a = 2
	data.a // => 2
	
	// ……反之亦然
	data.a = 3
	vm.a // => 3

使用 Object.freeze()，会阻止修改现有的属性:

	var obj = {
	  foo: 'bar'
	}
	
	Object.freeze(obj)
	
	new Vue({
	  el: '#app',
	  data: obj
	})

Vue 实例还暴露了一些有用的实例属性与方法。它们都有前缀 $，以便与用户定义的属性区分开来，见[vue实例属性][12]。

	var data = { a: 1 }
	var vm = new Vue({
	  el: '#example',
	  data: data
	})
	
	vm.$data === data // => true
	vm.$el === document.getElementById('example') // => true
	
	// $watch 是一个实例方法
	vm.$watch('a', function (newValue, oldValue) {
	  // 这个回调将在 `vm.a` 改变后调用
	})

每个 Vue 实例在被创建时都要经过一系列的初始化过程，在这个过程中也会运行一些叫做生命周期钩子的函数:

	new Vue({
	  data: {
	    a: 1
	  },
	  created: function () {
	    // `this` 指向 vm 实例
	    console.log('a is: ' + this.a)
	  }
	})
	// => "a is: 1"

也有一些其它的钩子，在实例生命周期的不同阶段被调用，如 mounted、updated 和 destroyed。生命周期钩子的 this 上下文指向调用它的 Vue 实例。

![实例生命周期](https://cn.vuejs.org/images/lifecycle.png)

[vue全局API][13]:

	Vue.extend
	Vue.nextTick
	Vue.set
	Vue.delete
	Vue.directive
	Vue.filter
	Vue.component
	Vue.use         : 安装vue插件
	Vue.mixin       : 全局注册一个混入，影响注册之后所有创建的每个Vue实例
	Vue.compile
	Vue.version


[Vue.extend与 Vue.util.extend 有啥区别][14]

[vue router][16]:

通过注入路由器，我们可以在任何组件内通过 this.$router 访问路由器，也可以通过 this.$route 访问当前路由


[weex modal(内置模块)][17]:

	animation      : 用来在组件上执行动画
	clipboard
	dom
	globalEvent
	meta
	modal          : 展示消息框的API：toast、alert、confirm 和 prompt
	navigator      : 前进、回退功能，该模块还允许我们指定在切换页面的时候是否应用动画效果
	picker
	storage
	stream
	webSocket
	webview

[class与style绑定][18]:

可以传给 v-bind:class 一个对象，以动态地切换 class：

	active 这个 class 存在与否将取决于数据属性 isActive 的 truthiness
	<div v-bind:class="{ active: isActive }"></div>

可以在对象中传入更多属性来动态切换多个 class。此外，v-bind:class 指令也可以与普通的 class 属性共存:

	<div class="static"
	     v-bind:class="{ active: isActive, 'text-danger': hasError }">
	</div>

绑定的数据对象不必内联定义在模板里：

	<div v-bind:class="classObject"></div>
	
	data: {
	  classObject: {
	    active: true,
	    'text-danger': false
	  }
	}

也可以在这里绑定一个返回对象的计算属性:

	<div v-bind:class="classObject"></div>
	
	data: {
	  isActive: true,
	  error: null
	},
	computed: {
	  classObject: function () {
	    return {
	      active: this.isActive && !this.error,
	      'text-danger': this.error && this.error.type === 'fatal'
	    }
	  }
	}

可以把一个数组传给 v-bind:class，以应用一个 class 列表:

	<div :class="['wrapper', isIpx&&isIpx()?'w-ipx':'']" >
	
	<div v-bind:class="[activeClass, errorClass]"></div>
	data: {
	  activeClass: 'active',
	  errorClass: 'text-danger'
	}

始终添加 errorClass，但是只有在 isActive 是 truthy 时才添加 activeClass

	<div v-bind:class="[isActive ? activeClass : '', errorClass]"></div>

v-bind:style 的对象语法十分直观——看着非常像 CSS，但其实是一个 JavaScript 对象,CSS 属性名可以用驼峰式 (camelCase) 或短横线分隔 (kebab-case，记得用单引号括起来) 来命名：

	<div v-bind:style="{ color: activeColor, fontSize: fontSize + 'px' }"></div>
	data: {
	  activeColor: 'red',
	  fontSize: 30
	}

直接绑定到一个样式对象通常更好，这会让模板更清晰:

	<div v-bind:style="styleObject"></div>
	data: {
	  styleObject: {
	    color: 'red',
	    fontSize: '13px'
	  }
	}

v-bind:style 的数组语法可以将多个样式对象应用到同一个元素上:

	<div v-bind:style="[baseStyles, overridingStyles]"></div>

从 2.3.0 起你可以为 style 绑定中的属性提供一个包含多个值的数组，常用于提供多个带前缀的值，例如：

	只会渲染数组中最后一个被浏览器支持的值。
	如果浏览器支持不带浏览器前缀的 flexbox，那么就只会渲染 display: flex
	<div :style="{ display: ['-webkit-box', '-ms-flexbox', 'flex'] }"></div>

[weex内置组件][19]:

	<a>
	<div>
	<image>
	<indicator>        : 通常用于显示轮播图指示器效果，必须充当 <slider> 组件的子组件使用
	<input>
	<list>
	<cell>
	<recycle-list>
	<loading>
	<refresh>          : 为容器提供下拉刷新功能，用法和属性与 <loading> 类似
	                     <refresh> 是 <scroller>、<list>、<hlist>、<vlist>、<waterfall> 的子组件，
	                     只能在被它们包含时才能被正确渲染。
	<scroller>
	<slider>           :  用于在一个页面中展示多个图片，在前端，这种效果被称为 轮播图
	<switch> (已废弃)
	<text>
	<textarea>
	<video>
	<waterfall>
	<web>

[vue的模版语法][20]:

{% raw %}

	<span>Message: {{ msg }}</span>
	<span v-once>这个将不会改变: {{ msg }}</span>
	
	双大括号会将数据解释为普通文本，而非 HTML 代码。为了输出真正的 HTML，你需要使用 v-html 指令
	<p>Using v-html directive: <span v-html="rawHtml"></span></p>
	span 的内容将会被替换成为属性值 rawHtml，直接作为 HTML
	
	<div v-bind:id="dynamicId"></div>
	
	对于所有的数据绑定，Vue.js 都提供了完全的 JavaScript 表达式支持
	<div v-bind:id="'list-' + id"></div>

{% endraw %}

指令 (Directives) 是带有 v- 前缀的特殊特性。指令特性的值预期是单个 JavaScript 表达式 (v-for 是例外情况)。

指令的职责是，当表达式的值改变时，将其产生的连带影响，响应式地作用于 DOM。

	v-if 指令将根据表达式 seen 的值的真假来插入/移除 <p> 元素
	<p v-if="seen">现在你看到我了</p>

一些指令能够接收一个“参数”，在指令名称之后以冒号表示:

	将该元素的 href 特性与表达式 url 的值绑定
	<a v-bind:href="url">...</a>
	
	监听 DOM 事件，参数是监听的事件名
	<a v-on:click="doSomething">...</a>

修饰符 (Modifiers) 是以半角句号 . 指明的特殊后缀，用于指出一个指令应该以特殊方式绑定。

	.prevent 修饰符告诉 v-on 指令对于触发的事件调用 event.preventDefault()
	<form v-on:submit.prevent="onSubmit">...</form>

v-bind的缩写：

	<!-- 完整语法 -->
	<a v-bind:href="url">...</a>
	
	<!-- 缩写 -->
	<a :href="url">...</a>

v-on缩写：

	<!-- 完整语法 -->
	<a v-on:click="doSomething">...</a>
	
	<!-- 缩写 -->
	<a @click="doSomething">...</a>

[vue计算属性和侦听器][21]:

任何复杂逻辑，你都应当使用计算属性。


{% raw %}

	声明了一个计算属性 reversedMessage。我们提供的函数将用作属性 vm.reversedMessage 的 getter 函数
	
	<div id="example">
	  <p>Original message: "{{ message }}"</p>
	  <p>Computed reversed message: "{{ reversedMessage }}"</p>
	</div>
	
	var vm = new Vue({
	  el: '#example',
	  data: {
	    message: 'Hello'
	  },
	  computed: {
	    // 计算属性的 getter
	    reversedMessage: function () {
	      // `this` 指向 vm 实例
	      return this.message.split('').reverse().join('')
	    }
	  }
	})

{% endraw %}

计算属性只有在它的相关依赖发生改变时才会重新求值。这就意味着只要 message 还没有发生改变，多次访问 reversedMessage 计算属性会立即返回之前的计算结果，而不必再次执行函数。这一点不同于methods。

假设我们有一个性能开销比较大的计算属性 A，它需要遍历一个巨大的数组并做大量的计算。然后我们可能有其他的计算属性依赖于 A 。如果没有缓存，我们将不可避免的多次执行 A 的 getter。

如果你不希望有缓存，请用方法来替代:

	<p>Reversed message: "{{ reversedMessage() }}"</p>
	
	// 在组件中
	methods: {
	  reversedMessage: function () {
	    return this.message.split('').reverse().join('')
	  }
	}

计算属性默认只有 getter ，不过在需要时你也可以提供一个 setter ：

	// ...
	computed: {
	  fullName: {
	    // getter
	    get: function () {
	      return this.firstName + ' ' + this.lastName
	    },
	    // setter
	    set: function (newValue) {
	      var names = newValue.split(' ')
	      this.firstName = names[0]
	      this.lastName = names[names.length - 1]
	    }
	  }
	}
	// ...

虽然计算属性在大多数情况下更合适，但有时也需要一个自定义的侦听器。这就是为什么 Vue 通过 watch 选项提供了一个更通用的方法，来响应数据的变化。当需要在数据变化时执行异步或开销较大的操作时，这个方式是最有用的。

[侦听器使用见这里](https://cn.vuejs.org/v2/guide/computed.html#%E4%BE%A6%E5%90%AC%E5%99%A8)

使用 watch 选项允许我们执行异步操作 (访问一个 API)，限制我们执行该操作的频率，并在我们得到最终结果前，设置中间状态。这些都是计算属性无法做到的。

[vue条件渲染][22]:

	<h1 v-if="ok">Yes</h1>
	<h1 v-else>No</h1>

v-if 是一个指令，所以必须将它添加到一个元素上。

	如果想切换多个元素可以把一个 <template> 元素当做不可见的包裹元素，并在上面使用 v-if
	<template v-if="ok">
	  <h1>Title</h1>
	  <p>Paragraph 1</p>
	  <p>Paragraph 2</p>
	</template>

v-else-if，2.1.1新增

带有 v-show 的元素始终会被渲染并保留在 DOM 中。v-show 只是简单地切换元素的 CSS 属性 display, 

	v-show 不支持 <template> 元素，也不支持 v-else
	<h1 v-show="ok">Hello!</h1>

v-if有更高的切换开销，而v-show有更高的初始渲染开销。因此，如果需要非常频繁地切换，则使用 v-show 较好；如果在运行时条件很少改变，则使用 v-if 较好。

当v-if与v-for一起使用时，v-for具有比v-if更高的优先级。

v-for 指令根据一组数组的选项列表进行渲染，v-for 指令需要使用 item in items 形式的特殊语法:

	<ul id="example-1">
	  <li v-for="item in items">
	    {{ item.message }}
	  </li>
	</ul>
	
	var example1 = new Vue({
	  el: '#example-1',
	  data: {
	    items: [
	      { message: 'Foo' },
	      { message: 'Bar' }
	    ]
	  }
	})

在 v-for 块中，我们拥有对父作用域属性的完全访问权限。还支持一个可选的第二个参数为当前项的索引:

	<ul id="example-2">
	  <li v-for="(item, index) in items">
	    {{ parentMessage }} - {{ index }} - {{ item.message }}
	  </li>
	</ul>

你也可以用 of 替代 in 作为分隔符:

	<div v-for="item of items"></div>

也可以用 v-for 通过一个对象的属性来迭代:

	<ul id="v-for-object" class="demo">
	  <li v-for="value in object">
	    {{ value }}
	  </li>
	</ul>
	
	new Vue({
	  el: '#v-for-object',
	  data: {
	    object: {
	      firstName: 'John',
	      lastName: 'Doe',
	      age: 30
	    }
	  }
	})

也可以提供第二个的参数为键名：

	<div v-for="(value, key) in object">
	  {{ key }}: {{ value }}
	</div>

第三个参数为索引：

	<div v-for="(value, key, index) in object">
	  {{ index }}. {{ key }}: {{ value }}
	</div>

在遍历对象时，是按 Object.keys() 的结果遍历，但是不能保证它的结果在不同的 JavaScript 引擎下是一致的。

建议尽可能在使用 v-for 时提供 key，除非遍历输出的 DOM 内容非常简单，或者是刻意依赖默认行为以获取性能上的提升:

	<div v-for="item in items" :key="item.id">
	  <!-- 内容 -->
	</div>

变异方法 (mutation method)，顾名思义，会改变被这些方法调用的原始数组:

    push()
    pop()
    shift()
    unshift()
    splice()
    sort()
    reverse()

非变异 (non-mutating method) 方法，例如：filter(), concat() 和 slice() 。这些不会改变原始数组，但总是返回一个新数组。使用非变异方法时，可以用新数组替换旧数组：

	example1.items = example1.items.filter(function (item) {
	  return item.message.match(/Foo/)
	})

Vue 为了使得 DOM 元素得到最大范围的重用而实现了一些智能的、启发式的方法，所以用一个含有相同元素的数组去替换原来的数组是非常高效的操作。

JavaScript 的限制，Vue 不能检测以下变动的数组：

	var vm = new Vue({
	  data: {
	    items: ['a', 'b', 'c']
	  }
	})
	vm.items[1] = 'x' // 不是响应性的
	vm.items.length = 2 // 不是响应性的

以下两种方式都可以实现和 vm.items[indexOfItem] = newValue 相同的效果，同时也将触发状态更新:

	// Vue.set
	Vue.set(vm.items, indexOfItem, newValue)
	
	// Array.prototype.splice
	vm.items.splice(indexOfItem, 1, newValue)

也可以使用 vm.$set 实例方法，该方法是全局方法 Vue.set 的一个别名:

	vm.$set(vm.items, indexOfItem, newValue)

为了解决第二类问题，你可以使用 splice:

	vm.items.splice(newLength)

JavaScript 的限制，Vue 不能检测对象属性的添加或删除。

对于已经创建的实例，Vue 不能动态添加根级别的响应式属性。但是，可以使用 Vue.set(object, key, value) 方法向嵌套对象添加响应式属性。

为已有对象赋予多个新属性，比如使用 Object.assign() 或 \_.extend()。在这种情况下，你应该用两个对象的属性创建一个新的对象:

	vm.userProfile = Object.assign({}, vm.userProfile, {
	  age: 27,
	  favoriteColor: 'Vue Green'
	})

想要显示一个数组的过滤或排序副本，而不实际改变或重置原始数据。在这种情况下，可以创建返回过滤或排序数组的计算属性。

	data: {
	  numbers: [ 1, 2, 3, 4, 5 ]
	},
	computed: {
	  evenNumbers: function () {
	    return this.numbers.filter(function (number) {
	      return number % 2 === 0
	    })
	  }
	}

在计算属性不适用的情况下 (例如，在嵌套 v-for 循环中) 你可以使用一个 method 方法:

	<li v-for="n in even(numbers)">{{ n }}</li>
	
	data: {
	  numbers: [ 1, 2, 3, 4, 5 ]
	},
	methods: {
	  even: function (numbers) {
	    return numbers.filter(function (number) {
	      return number % 2 === 0
	    })
	  }
	}

v-for 也可以取整数:

	<div>
	  <span v-for="n in 10">{{ n }} </span>
	</div>

{% raw %}

类似于 v-if，你也可以利用带有 v-for 的 <template> 渲染多个元素:

	<ul>
	  <template v-for="item in items">
		<li>{{ item.msg }}</li>
		<li class="divider"></li>
	  </template>
	</ul>

{% endraw %}

处于同一节点，v-for 的优先级比 v-if 更高，这意味着 v-if 将分别重复运行于每个 v-for 循环中。
当你想为仅有的一些项渲染节点时，这种优先级的机制会十分有用:

	<li v-for="todo in todos" v-if="!todo.isComplete">
	  {{ todo }}
	</li>

目的是有条件地跳过循环的执行，那么可以将 v-if 置于外层元素:

	<ul v-if="todos.length">
	  <li v-for="todo in todos">
	    {{ todo }}
	  </li>
	</ul>
	<p v-else>No todos left!</p>

在自定义组件里，你可以像任何普通元素一样用 v-for :

	<my-component v-for="item in items" :key="item.id"></my-component>

2.2.0+ 的版本里，当在组件中使用 v-for 时，key 现在是必须的。

然而，任何数据都不会被自动传递到组件里，因为组件有自己独立的作用域。为了把迭代数据传递到组件里，我们要用 props ：

Vue.js 为 v-on 提供了事件修饰符:

	.stop
	.prevent
	.capture
	.self
	.once
	.passive

Vue 允许为 v-on 在监听键盘事件时添加按键修饰符:

	<!-- 只有在 `keyCode` 是 13 时调用 `vm.submit()` -->
	<input v-on:keyup.13="submit">

记住所有的 keyCode 比较困难，所以 Vue 为最常用的按键提供了别名：

	<!-- 同上 -->
	<input v-on:keyup.enter="submit">
	
	<!-- 缩写语法 -->
	<input @keyup.enter="submit">

全部的按键别名：

	.enter
	.tab
	.delete (捕获“删除”和“退格”键)
	.esc
	.space
	.up
	.down
	.left
	.right

可以通过全局 config.keyCodes 对象自定义按键修饰符别名：

	// 可以使用 `v-on:keyup.f1`
	Vue.config.keyCodes.f1 = 112

可直接将 KeyboardEvent.key 暴露的任意有效按键名转换为 kebab-case 来作为修饰符：

	处理函数仅在 $event.key === 'PageDown' 时被调用。
	<input @keyup.page-down="onPageDown">

有一些按键 (.esc 以及所有的方向键) 在 IE9 中有不同的 key 值, 如果你想支持 IE9，它们的内置别名应该是首选。

可以用如下修饰符来实现仅在按下相应按键时才触发鼠标或键盘事件的监听器。2.1.0 新增

	.ctrl
	.alt
	.shift
	.meta
	
	<!-- Alt + C -->
	<input @keyup.alt.67="clear">
	<!-- Ctrl + Click -->
	<div @click.ctrl="doSomething">Do something</div>

.exact 修饰符允许你控制由精确的系统修饰符组合触发的事件:

	<!-- 即使 Alt 或 Shift 被一同按下时也会触发 -->
	<button @click.ctrl="onClick">A</button>
	
	<!-- 有且只有 Ctrl 被按下的时候才触发 -->
	<button @click.ctrl.exact="onCtrlClick">A</button>
	
	<!-- 没有任何系统修饰符被按下的时候才触发 -->
	<button @click.exact="onClick">A</button>

鼠标按钮修饰符,2.2.0 新增:

	.left
	.right
	.middle

{% raw %}

用 v-model 指令在表单 <input> 及 <textarea> 元素上创建双向数据绑定。它会根据控件类型自动选取正确的方法来更新元素。

{% endraw %}

v-model修饰符：

	.lazy
	.number
	.trim

组件是可复用的 Vue 实例，所以它们与 new Vue 接收相同的选项，例如 data、computed、watch、methods 以及生命周期钩子等。仅有的例外是像 el 这样根实例特有的选项。

一个组件的 data 选项必须是一个函数，否则会影响其它所有组件。

组件必须先注册以便 Vue 能够识别。这里有两种组件的注册类型：全局注册和局部注册。

	Vue.component('my-component-name', {
	  // ... options ...
	})

全局注册的组件可以用在其被注册之后的任何 (通过 new Vue) 新创建的 Vue 根实例，也包括其组件树中的所有子组件的模板中。

Prop 是你可以在组件上注册的一些自定义特性。当一个值传递给一个 prop 特性的时候，它就变成了那个组件实例的一个属性。

	Vue.component('blog-post', {
	  props: ['title'],
	  template: '<h3>{{ title }}</h3>'
	})

一个组件默认可以拥有任意数量的 prop，任何值都可以传递给任何 prop。

一个 prop 被注册之后，你就可以像这样把数据作为一个自定义特性传递进来：

	<blog-post title="My journey with Vue"></blog-post>
	<blog-post title="Blogging with Vue"></blog-post>
	<blog-post title="Why Vue is so fun"></blog-post>

可以使用 v-bind 来动态传递 prop:

	<blog-post
	  v-for="post in posts"
	  v-bind:key="post.id"
	  v-bind:title="post.title"
	></blog-post>

每个组件必须只有一个根元素，你可以将模板的内容包裹在一个父元素内来修复这个问题。

和父级组件进行沟通。

在组件上使用v-model:

	<input v-model="searchText">
	等价于
	<input
	  v-bind:value="searchText"
	  v-on:input="searchText = $event.target.value"
	>

在不同组件之间进行动态切换是非常有用的:

	<!-- 组件会在 `currentTabComponent` 改变时改变 -->
	<component v-bind:is="currentTabComponent"></component>


所有的 prop 都使得其父子 prop 之间形成了一个单向下行绑定：父级 prop 的更新会向下流动到子组件中，但是反过来则不行。

每次父级组件发生更新时，子组件中所有的 prop 都将会刷新为最新的值。这意味着你不应该在一个子组件内部改变 prop。

可以为 props 中的值提供一个带有验证需求的对象，而不是一个字符串数组。

	Vue.component('my-component', {
	  props: {
	    // 基础的类型检查 (`null` 匹配任何类型)
	    propA: Number,
	    // 多个可能的类型
	    propB: [String, Number],
	    // 必填的字符串
	    propC: {
	      type: String,
	      required: true
	    },
	    // 带有默认值的数字
	    propD: {
	      type: Number,
	      default: 100
	    },
	    // 带有默认值的对象
	    propE: {
	      type: Object,
	      // 对象或数组且一定会从一个工厂函数返回默认值
	      default: function () {
	        return { message: 'hello' }
	      }
	    },
	    // 自定义验证函数
	    propF: {
	      validator: function (value) {
	        // 这个值必须匹配下列字符串中的一个
	        return ['success', 'warning', 'danger'].indexOf(value) !== -1
	      }
	    }
	  }
	})

type 可以是下列原生构造函数中的一个：

    String
    Number
    Boolean
    Function
    Object
    Array
    Symbol

type 还可以是一个自定义的构造函数，并且通过 instanceof 来进行检查确认:

	function Person (firstName, lastName) {
	  this.firstName = firstName
	  this.lastName = lastName
	}

	Vue.component('blog-post', {
	  props: {
	    author: Person
	  }
	})

一个非 prop 特性是指传向一个组件，但是该组件并没有相应 prop 定义的特性:

	<bootstrap-date-input data-date-picker="activated"></bootstrap-date-input>

对于绝大多数特性来说，从外部提供给组件的值会替换掉组件内部设置好的值。
class 和 style 特性会稍微智能一些，即两边的值会被合并起来。

如果你不希望组件的根元素继承特性，你可以设置在组件的选项中设置 inheritAttrs: false。

	Vue.component('my-component', {
	  inheritAttrs: false,
	  // ...
	})

始终使用 kebab-case 的事件名。

一个组件上的 v-model 默认会利用名为 value 的 prop 和名为 input 的事件，但是像单选框、复选框等类型的输入控件可能会将 value 特性用于不同的目的。

一个组件上的 v-model 默认会利用名为 value 的 prop 和名为 input 的事件。

## 参考

1. [Weex官方文档][1]
2. [Weex工作原理][2]
3. [Weex手册][3]
4. [Weex与Web平台的差异][4]
5. [在Weex中使用Vue.js的注意事项][5]
6. [APP中集成Weex的方法][6]
7. [Weex中的前端框架][7]
8. [WEEX免费视频教程-从入门到放肆][8]
9. [vue起步][9]
10. [网易严选App感受Weex开发][10]
11. [vue教程][11]
12. [vue实例属性][12]
13. [vue全局API][13]
14. [Vue.extend与 Vue.util.extend 有啥区别][14]
15. [Mixin是什么概念?][15]
16. [vue router][16]
17. [weex modal（内置模块）][17]
18. [class与style绑定][18]
19. [weex内置组件][19]
20. [vue的模版语法][20]
21. [vue计算属性和侦听器][21]
22. [vue条件渲染][22]

[1]: http://weex.apache.org/cn/guide/index.html  "Weex官方文档" 
[2]: http://weex.apache.org/cn/wiki/index.html "Weex工作原理"
[3]: http://weex.apache.org/cn/references/ "Weex手册"
[4]: http://weex.apache.org/cn/wiki/platform-difference.html "Weex与Web平台的差异"
[5]: http://weex.apache.org/cn/guide/use-vue.html "在Weex中使用Vue.js的注意事项"
[6]: http://weex.apache.org/cn/guide/integrate-to-your-app.html "APP中集成Weex的方法"
[7]: http://weex.apache.org/cn/guide/front-end-frameworks.html "Weex中的前端框架"
[8]: http://jspang.com/2017/07/12/weex/#14 "WEEX免费视频教程-从入门到放肆"
[9]: https://cn.vuejs.org/v2/guide/ "vue起步"
[10]: https://segmentfault.com/a/1190000011027225 "网易严选App感受Weex开发"
[11]: https://cn.vuejs.org/v2/guide/ "vue教程"
[12]: https://cn.vuejs.org/v2/api/#%E5%AE%9E%E4%BE%8B%E5%B1%9E%E6%80%A7 "vue实例属性"
[13]: https://cn.vuejs.org/v2/api/#%E5%85%A8%E5%B1%80-API "vue全局API"
[14]: https://segmentfault.com/q/1010000012007154/a-1020000012008081 "Vue.extend与 Vue.util.extend 有啥区别"
[15]: https://www.zhihu.com/question/20778853 "Mixin是什么概念?"
[16]: https://router.vuejs.org/zh-cn/ "vue router"
[17]: http://weex.apache.org/cn/references/modules/modal.html "weex modal"
[18]: https://cn.vuejs.org/v2/guide/class-and-style.html "class与style绑定"
[19]: http://weex.apache.org/cn/references/components/index.html "weex内置组件"
[20]: https://cn.vuejs.org/v2/guide/syntax.html "vue的模版语法"
[21]: https://cn.vuejs.org/v2/guide/computed.html "vue计算属性和侦听器"
[22]: https://cn.vuejs.org/v2/guide/conditional.html "vue条件渲染"
[23]: https://www.cnblogs.com/da-yao/p/7986388.html "weex加入iconfont"
