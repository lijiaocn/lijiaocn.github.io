---
layout: default
title: "kubernetes configmap 热加载，inotifywatch 监测文件触发热更新"
author: 李佶澳
date: "2020-04-13T19:26:22+0800"
last_modified_at: "2020-04-21T23:14:49+0800"
categories: 技巧
cover:
tags: kubernetes
keywords:  configmap热加载,configmap热更新,inotifywatch,热加载,热更新
description: 用 inotifywatch 监测挂载到 Pod 中到 configmap 的变化，触发 nginx 配置文件的热加载
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

用 inotifywatch 监测挂载到 Pod 中到 configmap 的变化，触发 nginx 配置文件的热加载。

## 安装 inotify-tool

```sh
$ yum install -y epel-release && yum search  inotify-tools &&  yum install -y inotify-tools
```

## 实验

```sh
$ inotifywatch -e modify,create,delete,move -r -t 15 /mnt/webserver/conf   2>&1
Establishing watches...
```

`-r`：同时监控子目录

`-t 15`： 15 秒后退出，并打印结果的意思。

watch 期间，在 /mnt/webserver/conf/ 中随意创建一个文件，观测到期后，打印下面的结果：

```sh
Finished establishing watches, now collecting statistics.
total  create  filename
1      1       /mnt/webserver/conf/
```

如果没有任何变化，打印下面的结果：

```sh
$ inotifywatch -e modify,create,delete,move -r -t 1 /mnt/webserver/conf   2>&1
Establishing watches...
Finished establishing watches, now collecting statistics.
No events occurred.
```

所以要判断目录的内容是否发生了变化，可以通过观察结果中是否包含 `filename` 字符，如下：

```sh
while true; do
  echo "watch start"
  if [[ "$(inotifywatch -e modify,create,delete,move -r -t 5 /mnt/webserver/conf 2>&1)" =~ filename ]]; then
    echo "config changed"
  fi;
done
```

## 案例

entrypoint 可以用下面的文件：

```sh
./watch.sh &

$NGINX_BIN -g "daemon off;"
```

watch.sh 监测文件变化，并触发更新：

```sh
while true; do
  if [[ "$(inotifywatch -e modify,create,delete,move -r -t 10 /mnt/webserver/conf 2>&1)" =~ filename ]]; then
    echo "Try to verify updated nginx config..."
    $NGINX_BIN -t
    if [ $? -ne 0 ]; then
      echo "ERROR: New configuration is invalid!!"
    else
      echo "Reloading nginx with new config..."
      $NGINX_BIN -s reload
    fi
  fi
done
```

## 参考

1. [李佶澳的博客][1]
2. [Inotify in Containers][2]
3. [Auto-Reload from ConfigMap][3]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://william-yeh.net/post/2019/06/inotify-in-containers/ "Inotify in Containers"
[3]: https://william-yeh.net/post/2019/06/autoreload-from-configmap/ "Auto-Reload from ConfigMap"
