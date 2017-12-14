---
layout: default
title: 修改BASH窗口顶层显示的Title
author: lijiaocn
createdate: 2017/12/14 16:55:57
changedate: 2017/12/14 17:17:40
categories: 技巧
tags: shell
keywords: bash,xterm,terminal
description: xterm默认使用的窗口标题提供的有用信息太少，需要修改一下

---

* auto-gen TOC:
{:toc}

## 说明

iterm默认的窗口标题只显示当前正在运行的命令，信息太少。

可以使用下面的控制码，修改iterm的窗口标题，对terminal也同样试用：

	ESC ] 0 ; txt BEL      Set icon name and window title to txt.
	ESC ] 1 ; txt BEL      Set icon name to txt.
	ESC ] 2 ; txt BEL      Set window title to txt.

## 设置

需要把这个命令设在在环境变量`PROMPT_COMMAND`中：

	PROMPT_COMMAND='echo -ne "\033]0;`basename $PWD`\007"'

`033`和`\007`分别是控制键`ESC`和`BEL`的控制代码，可以用`man ascii`查看所有按键的控制码:

	000 nul  001 soh  002 stx  003 etx  004 eot  005 enq  006 ack  007 bel
	010 bs   011 ht   012 nl   013 vt   014 np   015 cr   016 so   017 si
	020 dle  021 dc1  022 dc2  023 dc3  024 dc4  025 nak  026 syn  027 etb
	030 can  031 em   032 sub  033 esc  034 fs   035 gs   036 rs   037 us
	040 sp   041  !   042  "   043  #   044  $   045  %   046  &   047  '
	050  (   051  )   052  *   053  +   054  ,   055  -   056  .   057  /
	060  0   061  1   062  2   063  3   064  4   065  5   066  6   067  7
	070  8   071  9   072  :   073  ;   074  <   075  =   076  >   077  ?
	100  @   101  A   102  B   103  C   104  D   105  E   106  F   107  G
	110  H   111  I   112  J   113  K   114  L   115  M   116  N   117  O
	120  P   121  Q   122  R   123  S   124  T   125  U   126  V   127  W
	130  X   131  Y   132  Z   133  [   134  \   135  ]   136  ^   137  _
	140  `   141  a   142  b   143  c   144  d   145  e   146  f   147  g
	150  h   151  i   152  j   153  k   154  l   155  m   156  n   157  o
	160  p   161  q   162  r   163  s   164  t   165  u   166  v   167  w
	170  x   171  y   172  z   173  {   174  |   175  }   176  ~   177 del

设置了PROMPT_COMMAND之后，就可以看到iterm窗口标题的变化了。

为了避免每次设置，把上面的设置添加到文件`~/.bash_profile`中：

	POMPT_COMMAND='echo -ne "\033]0;`basename $PWD`\007"'

>前面不需要export。

## 参考

1. [设置 Xterm 窗口的标题][1]

[1]: http://bbs.chinaunix.net/thread-1995855-1-1.html  " 设置 Xterm 窗口的标题" 
