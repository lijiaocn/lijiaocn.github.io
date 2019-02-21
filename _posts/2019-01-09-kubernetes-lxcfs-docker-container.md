---
layout: default
title: "Lxcfs是什么？ 怎样通过lxcfs在容器内显示容器的CPU、内存状态"
author: 李佶澳
createdate: "2019-01-09 14:12:25 +0800"
changedate: "2019-02-21 13:43:56 +0800"
categories: 技巧
tags: kubernetes docker
keywords: kubernetes,lxcfs,docker,container,top,memory,disk
description:  LXCFS，FUSE filesystem for LXC，运行时会维护一组与/proc中的文件同名的文件，提供容器的状态信息
---

* auto-gen TOC:
{:toc}

## 说明

容器中的top/free/df等命令，展示的状态信息是从/proc目录中的相关文件里读取出来的：

```
/proc/cpuinfo
/proc/diskstats
/proc/meminfo
/proc/stat
/proc/swaps
/proc/uptime
```

LXCFS，[FUSE filesystem for LXC][2]是一个常驻服务，它启动以后会在指定目录中自行维护与上面列出的/proc目录中的文件同名的文件，容器从lxcfs维护的/proc文件中读取数据时，得到的是容器的状态数据，而不是整个宿主机的状态。

相关笔记：

[Lxcfs是什么？怎样通过lxcfs在容器内显示容器的CPU、内存状态](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/09/kubernetes-lxcfs-docker-container.html)

[Lxcfs根据cpu-share、cpu-quota等cgroup信息生成容器内的/proc文件（上）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/11/lxcfs-support-cpu-share-and-cpu-quota-1.html)

[Lxcfs根据cpu-share、cpu-quota等cgroup信息生成容器内的/proc文件（中）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/15/lxcfs-support-cpu-share-and-cpu-quota-2.html)

[Lxcfs根据cpu-share、cpu-quota等cgroup信息生成容器内的/proc文件（下）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/21/lxcfs-support-cpu-share-and-cpu-quota-3.html)

[Linux的cgroup功能（三）：cgroup controller汇总和控制器的参数（文件接口）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/18/linux-tool-cgroup-parameters.html)

[Linux的cgroup功能（二）：资源限制cgroup v1和cgroup v2的详细介绍](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/28/linux-tool-cgroup-detail.html)

[Linux的cgroup功能（一）：初级入门使用方法](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/07/26/linux-tool-cgroup.html)

## 安装

### yum安装

```
wget https://copr-be.cloud.fedoraproject.org/results/ganto/lxd/epel-7-x86_64/00486278-lxcfs/lxcfs-2.0.5-3.el7.centos.x86_64.rpm
yum install lxcfs-2.0.5-3.el7.centos.x86_64.rpm  
```
### 编译安装

也可以自己编译，需要提前安装fuse-devel：

```
yum install -y fuse-devel
```

下载代码编译，`bootstrap.sh`执行结束后，会在生成`configure`等文件，编译安装方法在`INSTALL`文件中：

```
git clone https://github.com/lxc/lxcfs.git
cd lxcfs
git checkout lxcfs-3.0.3

./bootstrap.sh
./configure --prefix=/
make
make install
```

可以用下面的方法启动：

```
/etc/init.d/lxcfs start
```

但是`/etc/init.d/lxcfs`这个启动脚本比较古老，在CentOS7上运行可能会遇到下面的问题：

```
/etc/init.d/lxcfs: line 20: /lib/lsb/init-functions: No such file or directory
/etc/init.d/lxcfs: line 29: init_is_upstart: command not found
```

与其修改这个启动脚本，不足自己写一个systemd文件，lxcfs命令用法很简单，只有三个参数：

```
$ lxcfs -h
Usage:

lxcfs [-f|-d] [-p pidfile] mountpoint
  -f running foreground by default; -d enable debug output
  Default pidfile is /run/lxcfs.pid
lxcfs -h
```

lxcfs.service可以简单写成这样：

```
cat > /usr/lib/systemd/system/lxcfs.service <<EOF
[Unit]
Description=lxcfs

[Service]
ExecStart=/usr/bin/lxcfs -f /var/lib/lxcfs
Restart=on-failure
#ExecReload=/bin/kill -s SIGHUP $MAINPID

[Install]
WantedBy=multi-user.target
EOF
```

启动： 

```
systemctl daemon-reload
systemctl start lxcfs
```

## 使用

用前面的systemctl命令启动，或者在宿主机上直接运行lxcfs：

```
lxcfs /var/lib/lxcfs 
```

### 查看容器内存状态

启动一个容器，用lxcfs维护的/proc文件替换容器中的/proc文件，容器内存设置为256M：

```
docker run -it -m 256m \
      -v /var/lib/lxcfs/proc/cpuinfo:/proc/cpuinfo:rw \
      -v /var/lib/lxcfs/proc/diskstats:/proc/diskstats:rw \
      -v /var/lib/lxcfs/proc/meminfo:/proc/meminfo:rw \
      -v /var/lib/lxcfs/proc/stat:/proc/stat:rw \
      -v /var/lib/lxcfs/proc/swaps:/proc/swaps:rw \
      -v /var/lib/lxcfs/proc/uptime:/proc/uptime:rw \
      ubuntu:latest /bin/bash
```

在容器内看到内存大小是256M：

```
# free -h
              total        used        free      shared  buff/cache   available
Mem:           256M        1.2M        254M        6.1M        312K        254M
Swap:          256M          0B        256M
```

**注意**：如果是alpine镜像看到还是宿主机上的内存状态，alpine中的free命令，似乎是通过其它渠道获得内存状态的。

### 查看容器CPU状态

容器的CPU设置有两种方式，一个是`--cpus 2`，限定容器最多只能使用两个逻辑CPU，另一个是`--cpuset-cpus "0,1"`，限定容器
可以使用的宿主机CPU。

top命令显示的是容器 `可以使用的` 宿主机cpu，如果使用`--cpus 2`，看到的cpu个数是宿主机上的cpu个数。使用`--cpuset-cpus "0,1"`的时候，在容器看到cpu个数是`--cpuset`指定的cpu的个数。

**订正**：这个问题已经解决，见[Lxcfs根据cpu-share、cpu-quota等cgroup信息生成容器内的/proc文件（下）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/21/lxcfs-support-cpu-share-and-cpu-quota-3.html)。


```
docker run -it --rm -m 256m  --cpus 2 --cpuset-cpus "0,1" \
      -v /var/lib/lxcfs/proc/cpuinfo:/proc/cpuinfo:rw \
      -v /var/lib/lxcfs/proc/diskstats:/proc/diskstats:rw \
      -v /var/lib/lxcfs/proc/meminfo:/proc/meminfo:rw \
      -v /var/lib/lxcfs/proc/stat:/proc/stat:rw \
      -v /var/lib/lxcfs/proc/swaps:/proc/swaps:rw \
      -v /var/lib/lxcfs/proc/uptime:/proc/uptime:rw \
      ubuntu:latest /bin/sh
```

这时候在容器内看到的CPU个数是2个：

```
top - 07:30:32 up 0 min,  0 users,  load average: 0.03, 0.09, 0.13
Tasks:   2 total,   1 running,   1 sleeping,   0 stopped,   0 zombie
%Cpu0  :  0.6 us,  0.6 sy,  0.0 ni, 98.7 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
%Cpu1  :  0.6 us,  0.0 sy,  0.0 ni, 99.4 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
```

指定容器只能在指定的CPU上运行应当是利大于弊，就是在创建容器的时候需要额外做点工作，合理分配cpuset。

根据cpu-share和cpu-quota显示cpu信息的问题在[Does lxcfs have plans to support cpu-shares and cpu-quota?](https://github.com/lxc/lxcfs/issues/239)中有讨论。[aither64](https://github.com/aither64)修改lxcfs的实现，实现了按照cpu的配额计算应该展现的cpu的数量：

>Yes, I have it [implemented](https://github.com/lxc/lxcfs/compare/master...aither64:cpu-views), but I haven't gotten around to cleaning it up and making a PR yet. It works with CPU quotas set e.g. using `lxc.cgroup.cpu.cfs_{quota,period}_us`, CPU shares didn't make sense to me.

lxc/lxcfs的master分支已经合入了aither64的修改，stable-3.0和stable-2.0分支没有合入：[Merge pull request #260 from aither64/cpu-views ](https://github.com/lxc/lxcfs/commit/ea1e6b3776221917464c7dd70d179409719dc41c)。lxcfs的实现分析见：[修改lxcfs，根据cpu-share和cpu-quota生成容器的cpu状态文件（一）：lxcfs的实现学习（源码分析）][6]

**注意**：在容器中用`uptime`看到的系统运行时间是容器的运行时间，但是后面的load还是宿主机的load。

**注意**：在容器内看到的CPU的使用率依然是宿主机上的CPU的使用率！ 这个功能似乎有点鸡肋。

## 在kubernetes中使用lxcfs

在kubernetes中使用lxcfs需要解决两个问题：

第一个问题是每个node上都要启动lxcfs，这个简单，部署一个daemonset就可以了。

第二个问题是将lxcfs维护的/proc文件挂载到每个容器中，阿里云用[Initializers][3]实现的做法，值得借鉴：[Kubernetes之路 2 - 利用LXCFS提升容器资源可见性][1]。

### 开启initializers功能

initializers的工作过程见[Kubernetes initializer功能的使用方法：在Pod落地前修改Pod][4]。

在Kubernetes 1.13中[initializers][3]还是一个alpha特性，需要在Kube-apiserver中添加参数开启。

这里使用的是kubernetes 1.12，设置方法是一样的：

	--enable-admission-plugins="Initializers,NamespaceLifecycle,NamespaceExists,LimitRanger,SecurityContextDeny,ServiceAccount,ResourceQuota"
	--runtime-config=admissionregistration.k8s.io/v1alpha1

`--enable-admission-plugins`和`--admission-control`互斥，如果同时设置，kube-apiserver启动报错：

	error: [admission-control and enable-admission-plugins/disable-admission-plugins flags are mutually exclusive, 
	enable-admission-plugins plugin "--runtime-config=admissionregistration.k8s.io/v1alpha1" is unknown]

### initializer controller的实现

github有一个例子：[lxcfs-initializer][5]。

## 延伸内容

[修改lxcfs，支持根据cpu-share和cpu-quota显示容器的cpu状态][6]

## 参考

1. [Kubernetes之路 2 - 利用LXCFS提升容器资源可见性 ][1]
2. [FUSE filesystem for LXC][2]
3. [Kubernetes Initializers][3]
4. [Kubernetes initializer功能的使用方法：在Pod落地前修改Pod][4]
5. [lxcfs-initializer][5]
6. [修改lxcfs，根据cpu-share和cpu-quota生成容器的cpu状态文件（一）：lxcfs的实现学习（源码分析）][6]

[1]: https://yq.aliyun.com/articles/566208/ "Kubernetes之路 2 - 利用LXCFS提升容器资源可见性 "
[2]: https://github.com/lxc/lxcfs "FUSE filesystem for LXC"
[3]: https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/#initializers "Kubernetes Initializers"
[4]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/09/kubernetes-initializer-usage.html "Kubernetes initializer功能的使用方法：在Pod落地前修改Pod"
[5]: https://github.com/lijiaocn/lxcfs-initializer "lxcfs-initializer"
[6]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/11/lxcfs-support-cpu-share-and-cpu-quota-1.html "修改lxcfs，根据cpu-share和cpu-quota生成容器的cpu状态文件（一）：lxcfs的实现学习（源码分析）"
