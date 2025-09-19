---
layout: default
title: "Kubernetes的Pod无法删除，glusterfs导致docker无响应，集群雪崩"
author: 李佶澳
createdate: "2019-04-08 10:10:10 +0800"
last_modified_at: "2019-09-16 14:13:54 +0800"
categories: 问题
tags: kubernetes_problem
keywords: kubernetes,terminating,pod,docker hang,glusterfs,NotReady
description: 故障容器都挂载了glusterfs，不可用的node上也有，这些容器被重新调度到哪里，哪个node就随之崩溃。 
---

## 目录
* auto-gen TOC:
{:toc}

## 结论

该问题的调查过程相当曲折，这里只记录了Pod无法删除的调查过程。最终调查发现，下面这三个问题都是因为容器挂载了glusterfs导致的：

1. pod无法删除
2. docker ps无响应
3. kubelet异常node突然不可用，并且发生雪崩式扩散，十几分钟内几十台故障

因为历史遗留问题，一些容器都挂载了glusterfs，这些容器中的一部分突然故障，随后被重新调度，漂移到哪个node，哪个node就随之崩溃，同时发现这些容器中的一部分一直在Terminating状态，无法删除。

通过分析故障node的上日志，发现不可用的node在创建pod时，首先没有成功创建要挂载glusterfs的容器，随即docker ps无响应，最后导致node变成NotReady状态。将glusterfs卸载（进程杀死）之后，删不掉的容器被成功删除，docker ps也有响应了。

## 现象

Pod删除失败，一直在Terminating状态，describe信息如下：

```sh
Events:
  Type     Reason                 Age                From                      Message
  ----     ------                 ----               ----                      -------
  Normal   Killing                11m (x35 over 1h)  kubelet, kube-cluster-node-xxx  Killing container with id docker://xxxx-xxxxx-index-task:Need to kill Pod
  Normal   SuccessfulMountVolume  8m                 kubelet, kube-cluster-node-xxx  MountVolume.SetUp succeeded for volume "xxxx-xxxxx-index-task-volume-log"
  Normal   SuccessfulMountVolume  8m                 kubelet, kube-cluster-node-xxx  MountVolume.SetUp succeeded for volume "xxxx-xxxxx-index-task-volume-custom"
  Normal   SuccessfulMountVolume  8m                 kubelet, kube-cluster-node-xxx  MountVolume.SetUp succeeded for volume "default-token-xxt6c"
  Normal   Killing                9s (x4 over 6m)    kubelet, kube-cluster-node-xxx  Killing container with id docker://xxxx-xxxxx-index-task:Need to kill Pod
  Warning  FailedKillPod          9s (x4 over 6m)    kubelet, kube-cluster-node-xxx  error killing pod: failed to "KillContainer" for "xxxx-xxxxx-index-task" with KillContainerError: "rpc error: code = Unknown desc = operation timeout: context deadline exceeded"
  Warning  FailedPreStopHook      8s (x5 over 8m)    kubelet, kube-cluster-node-xxx  Exec lifecycle hook ([/bin/sleep 30]) for Container "xxxx-xxxxx-index-task" in Pod "xxxx-xxxxx-index-task-569f775985-2qv8x_xxx-xxxx(2b8e5882-5146-11e9-b3b3-525400dd6f19)" failed - error: command '/bin/sleep 30' exited with 126: , message: "rpc error: code = 2 desc = oci runtime error: exec failed: container_linux.go:240: creating new parent process caused \"container_linux.go:1254: running lstat on namespace path \\\"/proc/30849/ns/ipc\\\" caused \\\"lstat /proc/30849/ns/ipc: no such file or directory\\\"\"\n\r\n"
```

## 调查

Kubelet中显示删除失败，调用preStop的命令失败，和describe中的一致：

```sh
Apr 08 13:33:44 kube-cluster-node-xxx kubelet[27666]: E0408 13:33:44.466398   27666 remote_runtime.go:229] StopContainer "17619dcf545c0936b5a5bad416c1fe50064547f49ba3f34721baf4201f242c1b" from runtime service failed: rpc error: code = Unknown desc = operation timeout: context deadline exceeded
Apr 08 13:33:44 kube-cluster-node-xxx kubelet[27666]: E0408 13:33:44.466507   27666 kuberuntime_container.go:604] Container "docker://17619dcf545c0936b5a5bad416c1fe50064547f49ba3f34721baf4201f242c1b" termination failed with gracePeriod 30: rpc error: code = Unknown desc = operation timeout: context deadline exceeded
Apr 08 13:33:44 kube-cluster-node-xxx kubelet[27666]: E0408 13:33:44.468600   27666 kubelet.go:1532] error killing pod: failed to "KillContainer" for "xxxx-xxxxx-index-task" with KillContainerError: "rpc error: code = Unknown desc = operation timeout: context deadline exceeded"
Apr 08 13:33:44 kube-cluster-node-xxx kubelet[27666]: E0408 13:33:44.468641   27666 pod_workers.go:186] Error syncing pod 2b8e5882-5146-11e9-b3b3-525400dd6f19 ("xxxx-xxxxx-index-task-569f775985-2qv8x_xxx-xxxx(2b8e5882-5146-11e9-b3b3-525400dd6f19)"), skipping: error killing pod: failed to "KillContainer" for "xxxx-xxxxx-index-task" with KillContainerError: "rpc error: code = Unknown desc = operation timeout: context deadline exceeded"
Apr 08 13:33:45 kube-cluster-node-xxx kubelet[27666]: E0408 13:33:45.099777   27666 kuberuntime_container.go:495] preStop hook for container "xxxx-xxxxx-index-task" failed: command '/bin/sleep 30' exited with 126:
```

Docker日志显示，exec命令执行失败：

```sh
Apr 08 13:31:09 kube-cluster-node-xxx dockerd[10628]: time="2019-04-08T13:31:09.609938386+08:00" level=info msg="Container 17619dcf545c failed to exit within 10 seconds of kill - trying direct SIGKILL"
Apr 08 13:31:44 kube-cluster-node-xxx dockerd[10628]: time="2019-04-08T13:31:44.464673647+08:00" level=error msg="Error running exec in container: rpc error: code = 2 desc = oci runtime error: exec failed: container_linux.go:240: creating new parent process caused \"container_linux.go:1254: running lstat on namespace path \\\"/proc/30849/ns/ipc\\\" caused \\\"lstat /proc/30849/ns/ipc: no such file or directory\\\"\"\n"
Apr 08 13:32:14 kube-cluster-node-xxx dockerd[10628]: time="2019-04-08T13:32:14.466737962+08:00" level=info msg="Container 17619dcf545c0936b5a5bad416c1fe50064547f49ba3f34721baf4201f242c1b failed to exit within 30 seconds of signal 15 - using the force"
Apr 08 13:32:24 kube-cluster-node-xxx dockerd[10628]: time="2019-04-08T13:32:24.467687487+08:00" level=info msg="Container 17619dcf545c failed to exit within 10 seconds of kill - trying direct SIGKILL"
```

## 观察无法删除的容器的状态

执行docker rm -f  17619dcf54，长时间没有响应，同时docker ps无响应。尝试用docker-runc直接删除，不成功：

```sh
$ docker-runc   delete -f  17619dcf545c0936b5a5bad416c1fe50064547f49ba3f34721baf4201f242c1b
kill container 17619dcf545c0936b5a5bad416c1fe50064547f49ba3f34721baf4201f242c1b: container init still running
one or more of the container deletions failed

$ docker ps |grep 17619dc
17619dcf545c        xxxx.xxxx.com/hindex/xxxx-xxxxx-index-task      "./entrypoint.sh /..."   10 days ago         Up 10 days                              k8s_xxxx-xxxxx-index-task_xxxx-xxxxx-index-task-569f775985-2qv8x_xxx-xxxx_2b8e5882-5146-11e9-b3b3-525400dd6f19_0
```

尝试进入无法删除的容器，失败，输出信息与docker中的日志一致：

```sh
$ docker exec -it 17619dcf545c /bin/sh
rpc error: code = 2 desc = oci runtime error: exec failed: container_linux.go:240: creating new parent process caused "container_linux.go:1254: running lstat on namespace path \"/proc/30849/ns/ipc\" caused \"lstat /proc/30849/ns/ipc: no such file or directory\""
```

使用docker-runc也不行：

```sh
$ docker-runc list  |grep 17619d
17619dcf545c0936b5a5bad416c1fe50064547f49ba3f34721baf4201f242c1b   31238       running     /run/docker/libcontainerd/17619dcf545c0936b5a5bad416c1fe50064547f49ba3f34721baf4201f242c1b   2019-03-28T10:42:35.848580074Z

$ docker-runc ps 17619dcf545c0936b5a5bad416c1fe50064547f49ba3f34721baf4201f242c1b
UID        PID  PPID  C STIME TTY          TIME CMD
root     31238 31221  0 Mar28 ?        00:57:40 [java] <defunct>
root     31284 31238  0 Mar28 ?        00:00:00 /usr/sbin/sshd

$ docker-runc  exec -t 17619dcf545c0936b5a5bad416c1fe50064547f49ba3f34721baf4201f242c1b ps
exec failed: container_linux.go:240: creating new parent process caused "container_linux.go:1254: running lstat on namespace path \"/proc/30849/ns/ipc\" caused \"lstat /proc/30849/ns/ipc: no such file or directory\""
```

## 调查namespace

用exec尝试进入容器的时候，提示namespace文件（lstat /proc/30849/ns/ipc）不存在，但是30849这个进程不存在。

找到存活容器内的进程：

```
$ docker-runc  ps  17619dcf545c0936b5a5bad416c1fe50064547f49ba3f34721baf4201f242c1b
UID        PID  PPID  C STIME TTY          TIME CMD
root     31238     1  0 Mar28 ?        00:57:40 [java] <defunct>
```

该进程变成了僵尸进程：
 
```
$ ps aux|grep Zsl
root     17258  0.0  0.0 112636  2060 pts/0    R+   14:19   0:00 grep --color=auto Zsl
root     31238  0.3  0.0      0     0 ?        Zsl  Mar28  57:40 [java] <defunct>
```

对应的ns也是残缺的：

```
$ ls /proc/31238/ns
ls: cannot read symbolic link net: No such file or directory
ls: cannot read symbolic link uts: No such file or directory
ls: cannot read symbolic link ipc: No such file or directory
ls: cannot read symbolic link mnt: No such file or directory
total 0
lrwxrwxrwx 1 root root 0 Apr  8 14:21 ipc
lrwxrwxrwx 1 root root 0 Mar 28 18:42 mnt
lrwxrwxrwx 1 root root 0 Apr  8 14:21 net
lrwxrwxrwx 1 root root 0 Mar 28 18:42 pid -> pid:[4026532484]
lrwxrwxrwx 1 root root 0 Apr  8 14:21 user -> user:[4026531837]
lrwxrwxrwx 1 root root 0 Mar 28 18:42 uts
```

这时候发现该容器对应的pause容器早已经被删除。

最后如本文开头所讲，卸载glusterfs之后，这些容器随即被成功删除，将glusterfs进程杀死之后，docker ps也能够响应了。
