---
layout: default
title: Angularjs学习笔记
categories: 杂项

---

# Angularjs学习笔记
创建时间: 2015/11/19 11:03:12  修改时间: 2015/12/01 16:54:47 作者:lijiao

----

## 摘要

学习资料:  用AngularJS开发下一代Web应用/(美)格林(Green,B.),(美)夏德瑞(Seshadri,S.)著；大漠穷秋译. ——北京:电子工业出版社，2013,10 ISBN 978-7-121-21574-2

## 笔记

P12, ng-app, 声明Angular的边界。

P13, 双花括号插值:

	<p>{{someText}}</p>

>数据加载完成之前, 用户能够看到{{someText}}

P16, ng-bind, 显示文本

	<p ng-bind="greeting"></p>

	数据加载完成之前用户看不到数据

P13, 创建模型对象容纳数据

	var messages = {};
	messages.somText="ssssss"

	function TextController($scope){
		$scope.messages = messages
	}

	<p>{{messages.someText}}</p>

>可以避免一些非预期的行为


P18, 监视表达式，当表达式发生变化时，调用回调函数

	$scope.$watch('funding.startingEstimate', computeNeeded);

>表达式时字符串，被当作Angular表达式执行

P18, ng-submit, 表单提交时执行

P16, ng-model, 把元素绑定到模型属性上

	<input type="checkbox" ng-model="youCheckIt">

P17, ng-change, 指定一个控制器方法，一旦用户修改了输入值，该方法会被调用

	<input ng-change="computeNeeded()" ng-model="XXX">

P19, ng-click, ng-dblclick

P22, ng-repeat

	var students = [{name:'A', id: '1'},
	                {name:'B', id: '2'}];
	
	function StudentListController($scope){
		$scope.students = students;
	}
	
	<ul ng-controller='Studentlistcontroller'>
		<li ng-repeat='student in students'>
			<a href='/student/view/{{student.id}}'>{{student.name}}</a>
		</li>
	</ul>
	
	可以通过$index返回当前引用的元素序号
	$first、$middle、$last, 返回布尔值

P24, ng-show, ng-hide, 显示和隐藏

通过将display设置位block或者none来隐藏元素

P26, ng-class, ng-style, 动态选择样式

P27, ng-src, ng-href

>在src或者href属性上使用{{}}, 无法很好的运行, 可以使用ng-src、ng-href

P28, 表达式

	数学运算: + - / * %
	比较运算: == != > < >= <=
	布尔逻辑: && || !
	位运算:   \^ & |
	调用$scope上的函数
	应用数组和对象符号： [] {}  .

>表达式时通过Angular内置的解析器执行, 不支持循环、流程控制和“++,--"

P28, 控制器职责：

	1. 为应用中的模型设置初始的状态，（变量初值）
	2. 通过$scope对象把数据模型和函数暴露給视图, (UI)
	3. 监视模型其余部分的变化，并采取相应的动作

	建议：
	1. 为视图中的每一块功能区域创建一个控制器
	2. 可以创建嵌套的控制器，通过继承树结构共享数据模型和函数
		子控制器中的$scope可以访问父控制器对象上的所有属性
	<div ng-controller="Parent">
		<div ng-controller="Child">...</div>
	</div>

P29, $scope暴露模型数据, 只有通过$scope触及的数据，Angular才会把它当成数据模型的一部分

	1. 直接显示创建，在控制器中直接创建： $scope.XXX=XXX
	2. 通过表达式
		<button ng-click='count=3'>Set count</button>
		>创建了count
	3. 在表单输入项上使用ng-model

P30 $watch(watchFn, watchAction, deepWatch)
	watchFn:      字符串，Angular表达式或者函数，会被多次调用，所以需要没有副作用。
	watchAction:  function(newValue, oldValue, scope)
	deepWatch:    true，检查被监控对象的每个属性
	return:       用户注销监控器的函数

	var degreg = $scope.$watch('someModel.someProperty', callbackOnChange());
	...
	degre();  //注销

P33 chrome的Angular调试插件Batarang

P35 监控多个属性

	方法1: 监控这些属性连接起来的值
	方法2: 把这些属性放到一个数组或者对象中，deepWatch设置为true

P36 使用模块和模块内置的依赖注入功能，创建服务，简化控制器

	Angular内置的服务: $location、$route、$http等，以$开头

P37 使用Module的api创建服务:

	var shoppingModule = angular.module('Shoppingmodule',[]);

	shoppingmodule.factory('Items', function(){
		var items ={};
		iterms.query= function(){
			...
		};
		return items;
	});
	
	function ShoppingController($scope, Items){
		....
	}

	<html ng-app='ShoopingModule'>
	...
	</html>

P39 引入依赖模块

	var appMod = angular.module('app',['XXXX','XXXXXXX'])

P39 过滤器格式化数据

	{{ expression | filterName: parameter1: ... parameterN }}

	angular内置的过滤器: currency、date、number、uppercase

	编写过滤器：

	var homeModule =angular.module('HomeModule',[]);
	homeModule.filter('titleCase', function(){
categories: 杂项
		XXXXX
		});

P40 $route, 根据URL加载显示模版, 并且关联到指定的controller

P41 ng-view, 展示路由加载的模版

P44 http请求

	function ShoppingController($scope, $http){
		$http.get('/products').success(function(data, status, headers, config){
				$scope.items = data;
		});
	}

P45 自定义指令

	var appModule = angular.module('appModule', [...]);
	appModule.directive('directiveName', directiveFunction);


## 文献



