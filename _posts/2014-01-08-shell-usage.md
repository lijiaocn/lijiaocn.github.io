---
layout: default
title: Shell(bash)编程
author: 李佶澳
createdate: 2014/04/30 16:33:01
last_modified_at: 2017/12/16 19:51:05
categories: 编程
tags: shell
keywords:
description:  积累的一些shell用法。

---

创建时间: 2014/04/30 17:03:58  修改时间: 2016/12/16 15:56:54 作者:lijiao

----

## 目录
* auto-gen TOC:
{:toc}

## 摘要

这里使用的是bash，bash兼容sh，并且吸收了ksh和csh的一些特性，`man bash`是最好的文档。

## BASH内置命令与语法 

### BASH BUILTIN COMMANDS

### exec

	exec [-cl] [-a name] [command [arguments]]
	
	If command is specified, it replaces the shell.  No new process is created.
	-l: the shell places  a  dash  at the  beginning of  the  zeroth argument passed to command
	-c: causes command to be executed with an empty environment
	-a: passes name as the zeroth argument to the executed command

### eval

	eval [arg ...]
	
	The args are read and concatenated together into a single command.
	This command is then read and executed by the shell, and its exit status is returned as the value of eval.  If there are no args, or only null arguments, eval returns 0

### Bash Options

bash有自己的运行时配置，这里只列举常用的一些参数：

	-c string:     从string读取命令
	-i:            交互式运行
	-r:            RESTRICTED SHELL
	-O [options]:  设置shell内置命令的选项
	+O [options]:  取消shell内置命令选项的设置
	--:            表示Options结束, --之后的字符被当作文件名和传入参数

除了上面的列出的这些，bash还有大量运行时配置，这些配置使用`set`命令设置，例如:

	set [--abefhkmnptuvxBCHP] [-o option] [arg ...]

### ARGUMENTS

### INVOCATION

### DEFINITIONS

### RESERVED WORDS

### GRAMMER

### Simple Commands

命令执行，返回值的是命令的退出状态。

如果命令是被信号终止的，返回值是`128+signal num`。

### Pipelines

	[time [-p]] [ ! ] command [ | command2 ... ]
	
	time: 显示整个pipline的执行时间
	-p:   指定输出格式
	!:    对pipline的结果取反

pipline中的每个命令都在一个独立的进程中执行的。

如果没有设置`pipefail`，返回的是最后一个命令的退出状态。

如果设置了`pipefail`，只有所有命令都返回0，才返回0，否则返回的是最后一个不为0的退出状态。

pipfail设置方法:

	set -o pipefail

### Lists

Lists是多个拼接到一起的pipeline。

pipelines通过下面保留字符拼接：

	;   &   &&   ||

以这些字符结尾：

	;   &   <newline>

字符含义：

	&    命令在后台的执行，前台shell不等待命令执行的完成，立即得到返回值0。
	;    分割开的命令单独执行，前台等待每个命令完成，返回的是最后一个命令的退出状态。
	&&   只有前面的命令的返回值是0，才会执行后面的命令，返回最后一个命令的退出状态。
	||   只有前面的命令的返回值非0，才会执行后面的命令，返回最后一个命令的退出状态。

### Compound Commands


命令有以下几种组合方式：

	( list )
	    list在一个独立的shell环境中运行，运行时对shell做的设置，在运行结束后失效。
	    返回list的退出状态
	
	{ list; }
	    list在当前shell环境中运行，命令必须用换行符或者分号标记结束。
	    返回list的退出状态
	    注意`{`和`}`必须用空格与后面或者前面都字符区分开。
	
	((expression))
	    算术表达式计算，如果结果非0，返回0，否则返回1
	    等同于 `let "expression"`
	
	[[ expression ]]
	    条件表达式计算，
	    ==,!= :  检查左侧是否匹配了右侧的正则表达式(Pattern Matring)
	             shell option nocasematch，设置是否忽略大小写
	             如果匹配结果与表达式一致，返回0
	    =~:      检查左侧是否匹配右侧的扩展的正则表达式(regex(3))
	             匹配返回0，不匹配返回1
	             正则表达式语法错误，返回2
	             如果匹配结果与表达式一致，返回0
	             表达式匹配的字符串存放在数组BASH_REMATCH
	             BASH_REMATCH[0]: 整个表达式匹配的字符串
	             BASH_REMATCH[n]: 第n个括号中的表达式匹配的字符串
	   注意右侧的正则应当这么写:  if [[ "aaaa" == "a"* ]]
	
	for name [ in word ] ; do list ; done
	     如果没有`in word`，就遍历位置参数(positional parameter)
	     返回最后一次list执行的退出状态
	     如果word是空的，返回0
	
	for (( expr1 ; expr2 ; expr3 )) ; do list ; done
	     对表达式expr1执行算术运算
	     对表达式expr2执行算术运算，如果结果非0，执行list，并对表达式expr3执行算数运算
	     如果表达式为空，认为是1
	     返回最后一次list的执行退出状态
	     如果任意一个表达式错误，放回false
	
	select name [ in word ] ; do list ; done
	     在stderr列出所有的word，提示选择，name的值将为选择的字符串
	     如果在list中，没有遇到`break`，重复这一个过程
	     返回最后一个命令的退出状态
	     如果没有命令被执行，返回0
	
	case word in [ [(] pattern [ | pattern ] ... ) list ;; ] ... esac
	     按照Pathname  Expansion的规则，寻找能够匹配word的pattern，执行后面的对应的list
	     只有第一个匹配有效
	     返回执行的命令的退出状态
	     如果没有匹配，返回0
	
	if list; then list; [ elif list; then list; ] ... [ else list; ] fi
	     如果list退出状态为0，那么执行
	     返回执行的命令的退出状态
	     如果命令执行，返回0
	      
	while list; do list; done
	until list; do list; done

注意`[ expr ]`不是compound commands，而是shell内置命令，作用和test命令相同。

expr是CONDITIONAL EXPRESSIONS。

### Shell Function Definitions

	[ function ] name () compound-command [redirection]

保留字function是可选的，如果使用function，可以省略`()`。

compound-command可以上一节给出的任意一种，不是必须是`{ XXX }`

redirection将函数运行是的输入输出做了重定向。

例如可以写成：

	function a()  ( ls / ) >log

funciton命令的返回值是0，除非有语法错误或者函数重名。

执行function时，返回的是最后一个命令的退出状态。

### COMMENTS

### QUOTING (字符转义)

反斜线`\`是转移字符，更改后面的字符含义。

单引号`'  '`保留了所有的字面取值，所见即所得。

双引号`" "`保留了`$`、`\`，和反引号之外的字符的字面值。

	\a     alert (bell)
	\b     backspace
	\e     an escape character
	\f     form feed
	\n     new line
	\r     carriage return
	\t     horizontal tab
	\v     vertical tab
	\\     backslash
	\'     single quote
	\nnn   the eight-bit character whose value is the octal value nnn (one to three digits)
	\xHH   the eight-bit character whose value is the hexadecimal value HH (one or two hex digits)
	\cx    a control-x character

### PARAMETERS(参数/变量)

参数就是可以存储值的变量：

	name=[value]
	name+=[value]

如果没有value，name的值是null string。

一旦创建了变量，只能通过命令`unset`消除。

变量赋值可以作为这些内置命令的参数:

	alias
	declare
	typeset
	export
	readonly
	local

### Positional Parameters

	When a positional parameter consisting of more than a single digit is expanded, it must be enclosed in braces (see EXPANSION below)

### Special Parameters

	*:    如果位于双引号中(例如"$*")，value是将位置参数用$IFS链接起来后结果，整体是一个word
	@:    如果位于双引号中(例如"$@")，每个位置参数被解读为一个word，是多个word
	#:    位置参数的个数
	?:    上一个前台命令状态
	-:    已经设置了的option，通过通过set命令设置的，和shell启动时传入的
	$:    当前shell的进程ID，如果是在子shell中，返回的也是当前shell的进程ID，不是子shell的
	!:    上一个后台命令的进程ID
	0:    shell或者shell脚本的名称，如果通过bash调用脚本，$0是脚本名，如果是`bash -c`的方式，$0是第一个参数
	_:    shell或者shell脚本的绝对路径

脚本a.sh：

	for i in "$*" ;do echo a$i; done
	for i in "$@" ;do echo b$i; done

执行结果：

	bash ./a.sh  1 2 3 4 5
	a1 2 3 4 5
	b1
	b2
	b3
	b4
	b5

### Shell Variables

Shell的变量比较多，这里不列出

### EXPANSION

### Brace Expansion

### Tilde Expansion

### Parameter Expansion

	${parameter:-word}:  Use Default Values.
	${parameter:=word}:  Assign  Default  Values.
	${parameter:?word}:  Display Error if Null or Unset.
	${parameter:+word}:  Use Alternate Value.
	${parameter:offset}:        Substring  Expansion.
	${parameter:offset:length}: Substring  Expansion.
	${!prefix*}:   Expands to the names of variables whose names begin with prefix
	               separated by the first character of the IFS special variable.
	${!prefix@}:   Expands to the names of variables whose names begin with prefix
	               separated by the first character of the IFS special variable.
	${!name[@]}
	${!name[*]}
	${#parameter}
	${parameter#word}
	${parameter##word}
	${parameter%word}
	${parameter%%word}
	${parameter/pattern/string}


### Command Substitution

### Arithmetic Expansion

### Process Substitution

### Word Splitting

### Pathname Expansion

### REDIRECTION (重定向)

### ALIASES (别名)

### FUNCTIONS

### ARITHMETIC EVALUATION

### CONDITIONAL EXPRESSIONS

### SIMPLE COMMAND EXPANSION

### COMMAND EXECUTION

### COMMAND EXECUTION ENVIRONMENT

### ENVIRONMENT

### EXIT STATUS

### SIGNALS

### JOB CONTRO

### PROMPTING

### READLINE

### HISTORY

### HISTORY EXPANSION

### SHELL BUILTIN COMMANDS

### RESTRICTED SHELL

## 常用的linux命令

这些命令虽然不是shell的命令，但是shell主要就是组合linux命令，所以应当列在这里。

### jq

`jq`是特别有用强大的一个命令，它可以直接解读json字符串。

操作系统上一般默认没有安装，需要安装：

	yum install -y jq

#### filter 

jq强大的地方在于它提供了很多filter命令，可以用读取json字符串指定位置的内容，并以管道的方式传递处理。

在jq的手册中给出了filter的使用说明

	BASIC FILTERS
	   .
	       The absolute simplest (and least interesting) filter is .. This is a filter that takes its input and produces it unchanged as output.
	       Since jq by default pretty-prints all output, this trivial program can be a useful way of formatting JSON output from, say, curl.
	           jq ´.´
	              "Hello, world!"
	           => "Hello, world!"

`.`是最简单的一个filter，它将输入的json字符串格式化后输出：

	$ echo '{"age":"13" ,"name": "li"}'  |jq "."
	{
	  "age": "13",
	  "name": "li"
	}

`.XX`用来读取json中XX对应的值：

	$ echo '{"age":"13" ,"name": "li"}'  |jq ".name"
	"li"

`.[index]`用来取出数组内指定范围的值：

	jq ´.[]´
	   [{"name":"JSON", "good":true}, {"name":"XML", "good":false}]
	=> {"name":"JSON", "good":true}, {"name":"XML", "good":false}

#### parameter

另外还有jq的命令行参数也可以在`man jq`中找到，例如`-r`表示以原始方式输出value。

### awk

不处理第一行：

	kubectl get ns | awk '{ if(NR>1) print $1 }

### comm

comm命令用来比较两个排好序的文件，用`-1`、`-2`、`-3`控制输出哪些内容：

	comm [-123i] file1 file2
	 -1      Suppress printing of column 1.         
	 -2      Suppress printing of column 2.         
	 -3      Suppress printing of column 3.         
	 -i      Case insensitive comparison of lines.

注意comm是逐行比较的！不是用来对value进行去重！

### grep

#### 反向匹配，找出一个文件相比另一个文件多出的内容

下面的命令中，`-v`表示反向匹配，`-f file1`表示从file1中读取匹配模版：

	grep -v -f file1 file2

结果输出的是file2中有、file1中没有的内容。

## 以往遗留的，未整理的内容

### 算数运算

#### let

手册：

	man let

用法：

	let arg [arg ...]
	Each arg is an arithmetic expression to be evaluated (see ARITHMETIC EVALUATION above).
	If the last arg evaluates to 0, let returns 1; 0 is returned otherwise.

运算符:

	+：对两个变量做加法。
	-：对两个变量做减法。
	*：对两个变量做乘法。
	/：对两个变量做除法。
	**：对两个变量做幂运算。
	%：取模运算，第一个变量除以第二个变量求余数。
	+=：加等于，在自身基础上加第二个变量。
	-=：减等于，在第一个变量的基础上减去第二个变量。
	*=：乘等于，在第一个变量的基础上乘以第二个变量。
	/=：除等于，在第一个变量的基础上除以第二个变量。
	%=: 取模赋值，第一个变量对第二个变量取模运算，再赋值给第一个变量

示例：

	let a+=1        //echo $a: 1
	let a+=1        //echo $a: 2

let后面可以添加多个表达式：

	let a=2**2 b=1  //a=2^2 b=1

#### echo $[表达式]

echo $[]表示数学运算。

	将一个数学运算写到$[]符号的中括号中，中括号中的内容将先进行数学运算，使用变量，以及赋值给变量:

示例：

	echo $[1+1]
	echo $[a=1]     //a=1
	echo $[b=$a+1]  //b=2

#### expr
手册：

	man expr

示例：

	expr 1 + 2

### Sed

sed&awk第二版

使用Sed可以非常灵活简便地完成对文本文件的处理, 这主要得益于正则表达式的应用。

使用Sed的时候遇到最多的问题一般也都是关于正则表达式的。

	man sed

#### 命令格式

Sed的命令格式如下:

	[address[,address]]function[arguments]

address表示的是行数, function是sed内置的命令（例如a/b/c/d/D/s等）

例如，删除文件的第一行:

	sed -e "1d"   ##d就是function,没有参数

#### Sed的正则语法

Sed支持两种正则表达式：basic regular expressions (basic REs) 和 extended (modern) regular expressions (extended REs)。

Sed默认传入的正则表达式是basic REs, 使用“-E”选项后, 切换为extended REs。

正则表达式手册：

	man re_format

#### Sed直接修改文件内容 

使用-i选项
sed -i 'command'  filename

#### Sed编辑命令 

p  打印匹配行 

	sed -n '2,4p' a.txt  
	sed -n '/pattern/p' a.txt
	sed -n '2,4/pattern/p' a.txt

$  表示最后一行

l  显示与八进制ASCII代码等价的控制字符

	sed '1,2l' a.txt 

=  显示文件行号

	sed -n '/pattern/=' a.txt
	sed -n -e '/pattern/=' -e '/pattern/p' a.txt

a\ 在定位行号后附加新文本信息

	sed '/pattern/a\new text' a.txt 

i\ 在定位行号前插入新文本信息

	sed '/pattern/i\new text' a.txt 

c\ 用新文本替换定位文本

	sed '/pattern/c\new text' a.txt

d  删除定位行

	sed '1,2d' a.txt 
	sed '/pattern/d' a.txt

s  使用替换模式替换相应模式

	sed 's/pattern/newtext/'  a.txt          替换每行的第一个
	sed 's/pattern/newtext/g'  a.txt         全局替换 
	sed 's/pattern/newtext/p'  a.txt         显示到标准输出
	sed 's/pattern/newtext/w file'  a.txt    将被替换后的行保存到file
	sed 's/pattern/newtext &/p' a.txt        &代表的是pattern匹配的字符

r  从另一个文件中读文本

	sed '/pattern/r file2' file1    用file2中的内容替换file1中的pattern

w  写文本到一个文件

	sed '1,4 w filename'  a.txt

q  第一个模式匹配完成后退出或立即退出

	sed '/pattern/q' a.txt



#### Sed贪婪匹配与非贪婪匹配

re_format(7)：

	Minimal Repetitions (available for enhanced extended REs only)

默认“ * ”等重复匹配操作是贪心（greedy）的，会尽可能多的匹配。但是有时候我们需要的是最小匹配，可以通过在后面添加“?”实现。

例如，对字符串“aaaababb”进行匹配: 

	a*     匹配结果为： aaaaba
	a*?    匹配结果为： a
	.*?b   匹配结果为： aaaab

但是，GNU Sed现在还是不支持非贪婪的方式！可以通过其它的手段实现非贪婪的效果:

	echo "aaaababb" |sed 's/[^b]*b/OOO/'  

	可以看到“[^b]*b”的匹配效果与“.*?b”相同

#### Sed多行匹配

TODO

### find

跳过子目录 

	find . -path '/src' -prune -o -print

执行命令：

	find . -path '/src' -exec COMMAND {}+

### 去除重复行 

	http://churuimin425.blog.163.com/blog/static/341298772012230112956712/
	方法一
	
	    shell> sort -k2n file | uniq > a.out
	
	方法二 
	
	    shell> sort -k2n file | awk '{if ($0!=line) print;line=$0}'
	
	方法三
	
	    shell> sort -k2n file | sed '$!N; /^\(.*\)\n\1$/!P; D'

### 获取当前时间 

直接使用date命令获取当前时间

	date [+FORMAT] 例如
	    date %y-%m-%d-%H-%M-%S


### 调试 

使用set辅助调试

	set -n 读命令但不执行
	
	set -v 显示读取的所有行
	
	set -x 显示所有命令及其参数
	
	set -m 监视器模式
	
	set +x 关闭x选项

### 信号 

kill -l 查看所有信号

#### 捕获信号 

trap "command" signal

捕捉到信号signal后，执行command

	trap ""   signal   ## 忽略sginal
	trap signal        ## 复位signal

### 变量 

#### 赋值

特别注意：“=”两边都不能有空格!

	var=xxxx

#### 访问

	{var:-value}   如果定了变量var，则使用var，否则使用value
	{var:=value}   如果没有定义var，定义并赋值value, 使用定以后的var
	${var:offset}  var的值的子字符串
	${var:offset:length} 

#### 打印特定前缀的变量 

将带有前缀为prefix的参数名打印出来

	${!prefix*}
	${!prefix@}


#### 只读变量

	readonly var 
	readonly 显示所有的只读变量

#### 局部变量 

只能在函数内部使用，定义函数内部变量

	local [option] [name[=value]...]

	option 
	   -a  name is an array variable 
	   -f  use function names only
	   -i  name is an integer
	   -r  name is readonly
	   -t  give name the trace attribute
	   -x  export name to subsequent commands via the environment

#### 本地变量 

默认定义的变量在当前shell的生命期有效，属于本地变量

显示本地变量

	set  

清除变量

	unset

#### 环境变量 

环境变量用于所有用户进程

设置环境变量

	var=value
	export var

显示环境变量

	env 

清除环境变量

	unset var 

已定义的环境变量

	HOME    home路径
	LOGNAME 登录名
	MAIL    邮箱路径名
	PATH    查找目录顺序
	PS1     shell提示符，缺省值为超级用户##，其他用户$
	PS2     附属提示符，用于提示多行命令，缺省为>
	SHELL   缺省shell
	TERM    终端类型，vt100 vt200 linux等
	PWD     当前路径

#### 默认变量

	$0            参数0, 运行程序
	$1-$9-${10}.. 参数
	$##            参数个数
	$*            所有参数，不包括$0
	$@            所有参数，不包括$0
	$$            当前进程ID 
	$!            后台运行的最后一个进程的ID 
	$?            最后命令的退出状态，0表示没有错误

#### 数组 

定义数组array:

	declare -a array

赋值:

	array[index]= value

遍历数值:

	for i in ${array[@]}
	do
	    echo $i
	done

遍历index:

	for i in ${!array[@]}
	do
	    echo $i
	done

显示有value的index:

	echo ${!array[@]}

数组元素个数:

	echo ${##array[@]}

第3个元素中元素的个数:

	echo ${##array[3]}

打印数组下标 

	${!name[@]}
	${!name[*]}
	这个是针对name数组的，打印出来name数组有哪些下标

#### map 

必须是4.1.2以上的bash

### shell嵌入命令完整列表 

	| 命令     | 说明                                     |
	|----------|------------------------------------------|
	| :        | 空，永远返回true                         |
	| .        | 从当前shell中执行操作                    |
	| break    |                                          |
	| cd       |                                          |
	| continue |                                          |
	| echo     |                                          |
	| eval     | 先扫描命令行进行所有的置换，然后执行命令 |
	| exec     | 执行命令，不在当前shell                  |
	| exit     |                                          |
	| export   |                                          |
	| pwd      |                                          |
	| read     |                                          |
	| readonly |                                          |
	| return   |                                          |
	| set      |                                          |
	| shift    | 去除前n个输入参数                        |
	| test     | 评估条件表达式                           |
	| times    |                                          |
	| trap     | 当捕获信号时执行指定命令                 |
	| ulimit   | 显示或设置shell资源                      |
	| umask    |                                          |
	| unset    | 清除变量                                 |
	| wait     | 等待子进程运行完毕                       |
	| type     | 命令是否有效和在系统中的位置             |
	| logger   | 写入系统日志文件                         |
	| local    | 定义局部变量                             |

### 解引用 

双引号

	可解除字符$(美元符号) `(反引号)  \(反斜线) 外的任意字符

单引号

	单引号忽略任何引用值 

反引号

	反引号中的内容作为系统命令执行,在双引号内可照常使用

反斜线

	屏蔽特殊函数，可以屏蔽反引号`

### 文件类型测试 

	| 操作      | 测试条件                                 |
	|-----------|------------------------------------------|
	| -e        | 文件是否存在                             |
	| -f        | 是一个标准文件                           |
	| -d        | 是一个目录                               |
	| -h        | 文件是一个符号链接                       |
	| -L        | 文件是一个符号链接                       |
	| -b        | 文件是一个块设备                         |
	| -c        | 文件是一个字符设备                       |
	| -p        | 文件是一个管道                           |
	| -S        | 文件是一个socket                         |
	| -t        | 文件与一个终端相关联                     |
	| -N        | 从这个文件最后一次被读取之后, 它被修改过 |
	| -O        | 这个文件的宿主是你                       |
	| -G        | 文件的组id与你所属的组相同               |
	| !         | "非" (反转上边的测试结果)                |
	| -s        | 文件大小不为0                            |
	| -r        | 文件具有读权限                           |
	| -w        | 文件具有写权限                           |
	| -x        | 文件具有执行权限                         |
	| -g        | 设置了sgid标记                           |
	| -u        | 设置了suid标记                           |
	| -k        | 设置了"粘贴位"                           |
	| F1 -nt F2 | 文件F1比文件F2新 *                       |
	| F1 -ot F2 | 文件F1比文件F2旧 *                       |
	| F1 -ef F2 | 文件F1和文件F2都是同一个文件的硬链接 *   |

### 字符串测试 

	=     相等
	!=    不相等
	-z    空串
	-n    非空串

### 数值测试 

	-eq   equal
	-ne   not equal
	-gt   great
	-lt   little
	-le   litter or equal
	-ge   great or littel

### 控制结构 

case

	case $var in
	value) command
	;;
	value) command
	;;
	*) command
	esac

for

	for  var in values
	do
	    command
	done

until

	until  条件
	do
	    command
	done

while

	while  value
	do
	    command
	done

	i=0
	while [ $i -lt 10 ];do
		let i+=1
		echo $i
	done

break 

	跳出循环

continue

	立即开始下一个循环 

### 函数 

	函数名()
	{
	    command
	}
	
	function 函数名()
	{
	    command
	}

向函数参数传递参数

	## 和向脚本传递参数相同，使用特殊变量$0 $1 ... $9 

函数返回值

	## 函数返回值保存在$?中 
	
	compare() $a $b $c     ## 调用
	if[ $? = 0 ]           ## $?是函数的返回值

调用函数文件中的函数

	.   /path/function.sh    ## 引入了函数文件

shift
	将参数向左偏移一位 

获取最后一个参数

	eval echo \$$## 
	shift 'expr $## -2'

getopts

	分别处理 -a -h -f参数
	$OPTARG是对应参数后面的值，必须使用$OPTARG
	:表示前面的选项必须指定参数值
	在最前面放置:,可屏蔽缺值提示，如:ah:f
	while getopts ah:f OPTION
	do
	    case $OPTION in
	    a)
	     ;;
	    h)
	     ;;
	    f)  echo $OPTARG
	     ;;
	    esac
	done


### 查看功能键编码

使用cat可以查看对应功能键的表示方式

	cat -v
	//输入F1等功能键

### 颜色 

注意:如果没有后面的m，表示光标跳转到对应的行和列

	Generic method:   echo '<Ctrl-v><ESCAPE>[背景色编码;前景色编码m'
	System V      :   echo '\033[背景色编码;前景色编码m'
	Linux/bsd     :   echo -e '\033[背景色编码;前景色编码m]'

编码的位置可以互换，同样颜色的起岸景色编码和背景色编码不同

	| 颜色 | 前景色编码 | 背景色编码 |
	|------|------------|------------|
	| 黑色 | 30         | 40         |
	| 红色 | 31         | 41         |
	| 绿色 | 32         | 42         |
	| 黄色 | 33         | 43         |
	| 蓝色 | 34         | 44         |
	| 紫色 | 35         | 45         |
	| 青色 | 36         | 46         |
	| 白色 | 37         | 47         |


### 进制转换

	echo $((16##a));将十六进制数a转换为十进制数表示出来 
	echo $((5##3));将5进制数3转换为十进制数表示出来 

### 模式匹配 

#### 从头匹配 

从头开始扫描word，将匹配word正则表达的字符过滤掉

	${parameter##word}
	${parameter###word}

	##为最短匹配，##为最长匹配

#### 从尾匹配 

从尾开始扫描word，将匹配word正则表达式的字符过滤掉

	${parameter%word}
	${parameter%%word}

	%为最短匹配，%%为最长匹配

#### 替换 

	${parameter/pattern/string}
	${parameter//pattern/string}
	将parameter对应值的pattern字符串替换成为string字符串

	/表示只替换一次
	//表示全部替换

### sar 

http://www.cnblogs.com/jackyrong/archive/2008/08/02/1258835.html
http://www.wuzesheng.com/?p=1657

安装 

	修改 /etc/default/sysstat 文件， 将 ENABLED 设置为 true.

查看网卡速率 

	## 每秒钟统计一次，统计四次
	sar -n DEV 1 4

### cut 

剪切列或域

	-d  指定域分隔符
	-f n,m  剪切域n-m,从1开始编号
	-c n,m  第n-m个字符，注意不能和-f一起使用

### getopt

getopt用来解析输入参数，例如下面的命令中：

	getopt ab:cd -a -b he free cat

`ab:cd`是参数说明，a、b、c、d表示三个同名的命令行参数-a、-b、-c、-d，其中b是带有接收参数的选项。

执行后得到:

	 -a -b he -- free cat

--将选项与非选项参数分开。

### getopts

注意getopts和getopt不是一回事，getopts从stdin每次读取一个参数并赋给指定变量。

	getopts  "参数说明"  变量名   

例如:

	while getopts ":abc" opt ; do
		case $opt in
			a)
				echo $opt
				;;
			b)
				echo $opt
				;;
			c)
				echo $opt
				;;
			\?)
				echo Invalid
				exit 1
				;;
		esac
	done

## 文献

[1]: http://blog.csdn.net/taiyang1987912/article/details/39551385 "括号的用法"
