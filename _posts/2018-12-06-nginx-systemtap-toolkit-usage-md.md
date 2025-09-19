---
layout: default
title: "火焰图生成工具nginx-systemtap-toolkit使用时遇到的问题"
author: 李佶澳
createdate: "2018-12-06 14:20:35 +0800"
last_modified_at: "2019-03-01 17:11:47 +0800"
categories: 问题
tags: linux
keywords: linux,flame,stap,sytemtap,火焰图,性能分析
description:  stapxx是一套封装了stap命令的perl脚本，可以抓取nginx，以及系统上其它进程的调用栈
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

[stapxx](https://github.com/openresty/stapxx)是一套使用stap命令的perl脚本，不仅nginx，还可以抓取系统上其它进程的调用栈。

使用方法见：[Web开发平台OpenResty（三）：火焰图性能分析][1]和[Kong的性能瓶颈分析方法][2]。

## WARNING: Missing unwind data for a module，rerun with XXX

用`sample-bt.sxx`抓取时，出现下面的情况：

```bash
[root@10.10.64.58 app]# ./stapxx/samples/sample-bt.sxx --arg limit=1000000 --arg time=10  --skip-badvars -x 17816 >resty.bt
WARNING: Start tracing process 17816 (/usr/local/openresty/nginx/sbin/nginx)...
WARNING: Missing unwind data for a module, rerun with 'stap -d (unknown; retry with -DDEBUG_UNWIND)'
WARNING: Missing unwind data for a module, rerun with 'stap -d kernel'
WARNING: _stp_read_address failed to access memory location
WARNING: Missing unwind data for a module, rerun with 'stap -d xfs'
WARNING: Missing unwind data for a module, rerun with 'stap -d ip_vs'
WARNING: Missing unwind data for a module, rerun with 'stap -d nf_conntrack'
WARNING: Missing unwind data for a module, rerun with 'stap -d virtio_ring'
WARNING: Missing unwind data for a module, rerun with 'stap -d virtio_net'
WARNING: Missing unwind data for a module, rerun with 'stap -d nf_nat'
WARNING: Missing unwind data for a module, rerun with 'stap -d nf_defrag_ipv4'
WARNING: Missing unwind data for a module, rerun with 'stap -d ip_tables'
WARNING: Missing unwind data for a module, rerun with 'stap -d nf_conntrack_ipv4'
WARNING: Missing unwind data for a module, rerun with 'stap -d xt_comment'
WARNING: Missing unwind data for a module, rerun with 'stap -d nf_nat_ipv4'
WARNING: Missing unwind data for a module, rerun with 'stap -d iptable_filter'
WARNING: Missing unwind data for a module, rerun with 'stap -d br_netfilter'
WARNING: Missing unwind data for a module, rerun with 'stap -d bridge'
WARNING: Missing unwind data for a module, rerun with 'stap -d iptable_nat'
WARNING: Missing unwind data for a module, rerun with 'stap -d xt_mark'
WARNING: Missing unwind data for a module, rerun with 'stap -d virtio_pci'
WARNING: Missing unwind data for a module, rerun with 'stap -d veth'
WARNING: Time's up. Quitting now...(it may take a while)
ERROR: Skipped too many probes, check MAXSKIPPED or try again with stap -t for more details.
WARNING: Number of errors: 0, skipped probes: 102
WARNING: /usr/bin/staprun exited with status: 1
Pass 5: run failed.  [man error::pass5]
```

在GitHub上有人问类似的问题[Is this WARNING message means that stap can‘t get memory info from specific module??](https://github.com/openresty/stapxx/issues/24)，`agentzh`回答说：

	Not really. It's just that systemtap did not load the debug symbols for those dynamically loaded libraries unless explicitly specifying the -d PATH option.

看了一下stap++的帮助，有一个`-d`参数，指定加载那些目标的debug信息：

```bash
[root@10.10.64.58 app]# stap++ -h
Usage:
    stap++ [optoins] [infile]

Options:
    --arg NM=VAL    Specify extra user arguments (for $^arg_NM).
    --args          Print all available arguments for --arg.
    -c CMD     start the probes, run CMD, and exit when it finishes
    -d PATH         Load debug info for the specified objects
    -D NM=VAL       Emit macro definition into generated C code.
    -e SCRIPT       Run given script.
    --exec PATH     Specify the executable file path to be traced.
    --help          Print this help.
    -I PATH         Specify the stap++ tapset library search directory.
    --master PID    Specify the master pid whose child processes are traced.
    --sample-pid PID  Sample process to inspect DSO objects to load via -d
    -v              Be verbose.
    -x PID          Sets target() to PID (also for $^exec_path and $^libxxx_path).
```

回头再看打印的告警信息，原来里面的`rerun with`就是答案：

	WARNING: Missing unwind data for a module, rerun with 'stap -d kernel'

可以用-d参数一个个指定，但是模块太多了，一个一个指定比较繁琐，打开`stap++`文件一看，它是个一个perl脚本，最终调用的是stap命令，而stap命令有一个`--all-modules`参数，直接在里面加上了`-t --all-modules -DDEBUG_UNWIND`：

	my $cmd = "stap -t --all-modules -DDEBUG_UNWIND " . quote_sh_args(\@stap_opts) . " -";

重新运行还是出错：

```bash
[root@10.10.64.58 app]# ./stapxx/samples/sample-bt.sxx --arg limit=1000000 --arg time=10 --skip-badvars -x 17816 >resty.bt
WARNING: Start tracing process 17816 (/usr/local/openresty/nginx/sbin/nginx)...
WARNING: Missing unwind data for a module, rerun with 'stap -d (unknown; retry with -DDEBUG_UNWIND)'
WARNING: Missing unwind data for a module, rerun with 'stap -d kernel'
WARNING: DWARF expression stack underflow in CFI
ERROR: Skipped too many probes, check MAXSKIPPED or try again with stap -t for more details.
WARNING: Number of errors: 0, skipped probes: 102
WARNING: Skipped due to global '__global_bts' lock timeout: 102
WARNING: /usr/bin/staprun exited with status: 1
```

还是提示return，但这时候没有上次出现的多，不知道会有什么影响，先解决`ERROR`。

ERROR信息是“Skipped too many probes, check MAXSKIPPED or try again with stap -t for more details.”，在`man stap`中找到了这个参数，可以用`-D`重新设置。

加上—D后，重新运行：

```bash
[root@10.10.64.58 app]# ./stapxx/samples/sample-bt.sxx --arg limit=1000000 --arg time=10 --skip-badvars -x 17816 -D  MAXSKIPPED=1000000 >resty.bt

WARNING: Start tracing process 17816 (/usr/local/openresty/nginx/sbin/nginx)...
WARNING: Missing unwind data for a module, rerun with 'stap -d (unknown; retry with -DDEBUG_UNWIND)'
WARNING: Missing unwind data for a module, rerun with 'stap -d kernel'
WARNING: DWARF expression stack underflow in CFI
WARNING: _stp_read_address failed to access memory location
ERROR: probe overhead exceeded threshold
WARNING: Number of errors: 1, skipped probes: 292
WARNING: Skipped due to global '__global_bts' lock timeout: 292
WARNING: /usr/bin/staprun exited with status: 1
Pass 5: run failed.  [man error::pass5]
```

这时候出现了其它ERROR，字面意思是采样太多了，超过限制。

在[systemtap使用笔记](https://www.jianshu.com/p/bb6f88c61449)中得到是可以加上`-DSTP_NO_OVERLOAD`，到stap的手册里找了下，可以直接用参数`--suppress-time-limits`:

       --suppress-time-limits
              Disable -DSTP_OVERLOAD related options as well as -DMAXACTION and -DMAXTRYLOCK.  This option requires guru mode.

继续修改stap++，需要用`-g`设置为`guru`模式：

	  my $cmd = "stap -t --all-modules -DDEBUG_UNWIND -g --suppress-time-limits " . quote_sh_args(\@stap_opts) . " -";

再次运行，结果如下：

```
[root@10.10.64.58 app]# ./stapxx/samples/sample-bt.sxx --arg limit=10000000 --arg time=10 --skip-badvars -x 17816 -D  MAXSKIPPED=100000 >resty.bt
WARNING: Start tracing process 17816 (/usr/local/openresty/nginx/sbin/nginx)...
WARNING: Missing unwind data for a module, rerun with 'stap -d (unknown; retry with -DDEBUG_UNWIND)'
WARNING: Missing unwind data for a module, rerun with 'stap -d kernel'
WARNING: DWARF expression stack underflow in CFI
WARNING: _stp_read_address failed to access memory location
WARNING: Time's up. Quitting now...(it may take a while)
WARNING: Number of errors: 0, skipped probes: 0
WARNING: Skipped due to reentrancy: 4
```

还是有几个告警，但这时候可以运行到结束了，并且resty.bt中有数据了，只抓取了10秒钟，resty.bt文件就400多兆，导致火焰图无法生成，或生成的图片几个G，无法查看。。

后来发现去掉`-DDEBUG_UNWIND`参数后就可以了，`-g`等参数也都需要，生成的数据量可以接受。

重新修改命令，去掉会导致抓取的数据太多的参数：

	  my $cmd = "stap -t --all-modules " . quote_sh_args(\@stap_opts) . " -";

```bash
[root@10.10.64.58 app]# ./stapxx/samples/sample-bt.sxx --arg time=10 --skip-badvars -x 17816 -D  MAXSKIPPED=100000 >resty.bt
WARNING: Start tracing process 17816 (/usr/local/openresty/nginx/sbin/nginx)...
WARNING: Missing unwind data for a module, rerun with 'stap -d (unknown; retry with -DDEBUG_UNWIND)'
WARNING: DWARF expression stack underflow in CFI
WARNING: Missing unwind data for a module, rerun with 'stap -d kernel'
WARNING: _stp_read_address failed to access memory location
WARNING: Time's up. Quitting now...(it may take a while)
WARNING: Number of errors: 0, skipped probes: 88
WARNING: Skipped due to global '__global_bts' lock timeout: 88
```

这时候10s的抓取时间，生成的文件不到900k，不过还是有一些告警，貌似没啥影响。

## ERROR: Array overflow, check MAXMAPENTRIES near identifier 'bts' at input:17:13

现象如下：

```bash
[root@10.10.64.58 app]# ./stapxx/samples/sample-bt.sxx --arg time=20 --skip-badvars -D  MAXSKIPPED=100000  -x 10730 >resty.bt
WARNING: Start tracing process 14968 (/usr/local/openresty/nginx/sbin/nginx)...
WARNING: Missing unwind data for a module, rerun with 'stap -d (unknown; retry with -DDEBUG_UNWIND)'
WARNING: DWARF expression stack underflow in CFI
WARNING: Missing unwind data for a module, rerun with 'stap -d kernel'
WARNING: _stp_read_address failed to access memory location
ERROR: Array overflow, check MAXMAPENTRIES near identifier 'bts' at <input>:17:13
WARNING: Number of errors: 1, skipped probes: 26
WARNING: Skipped due to global '__global_bts' lock timeout: 26
WARNING: Skipped due to reentrancy: 1
WARNING: /usr/bin/staprun exited with status: 1
Pass 5: run failed.  [man error::pass5]
ERROR: No stack counts found
```

在`man stap`中查找`MAXMAPENTRIES`，默认值是2048：

	MAXMAPENTRIES
		Maximum number of rows in any single global array, default 2048.  
		Individual arrays may be declared with a larger or smaller limit instead:

可以用`-D`修改，如下：：

```bash
[root@10.10.64.58 app]# ./stapxx/samples/sample-bt.sxx --arg time=20 --skip-badvars -D  MAXSKIPPED=100000 -D MAXMAPENTRIES=100000 -x 10730 >resty.bt
WARNING: Start tracing process 14968 (/usr/local/openresty/nginx/sbin/nginx)...
WARNING: Missing unwind data for a module, rerun with 'stap -d kernel'
WARNING: Missing unwind data for a module, rerun with 'stap -d (unknown; retry with -DDEBUG_UNWIND)'
WARNING: DWARF expression stack underflow in CFI
WARNING: _stp_read_address failed to access memory location
WARNING: Time's up. Quitting now...(it may take a while)
WARNING: Number of errors: 0, skipped probes: 41
WARNING: Skipped due to global '__global_bts' lock timeout: 41
WARNING: Skipped due to reentrancy: 62
```

## 参考

1. [Web开发平台OpenResty（三）：火焰图性能分析][1]
2. [Kong的性能瓶颈分析方法][2]

[1]: https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/11/02/openresty-study-03-frame-md.html "Web开发平台OpenResty（三）：火焰图性能分析"
[2]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/03/kong-features-19-kong-performance.html#kong%E7%9A%84%E6%80%A7%E8%83%BD%E7%93%B6%E9%A2%88%E5%88%86%E6%9E%90%E6%96%B9%E6%B3%95) "Kong的性能瓶颈分析方法"
