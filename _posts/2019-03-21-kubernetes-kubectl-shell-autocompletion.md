---
layout: default
title: "Kubernetes的操作命令kubectl在shell中的自动补全"
author: 李佶澳
createdate: "2019-03-21 18:49:16 +0800"
last_modified_at: "2019-03-21 19:04:31 +0800"
categories: 技巧
tags: kubernetes
keywords: kubernetes,kubectl,自动补全
description: kubernetes的操作命令kubectl的子命令比较多，设置了自动补全后，可以加快操作速度，
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

kubernetes的操作命令kubectl的子命令比较多，设置了自动补全后，可以加快操作速度，减少敲击键盘的次数。[kubectl Enabling shell autocompletion][1]。

## 在zsh上设置

```sh
source <(kubectl completion zsh)
```

可以导入到.zshrc中实现自动加载：

```sh
kubectl completion zsh >> ~/.zshrc
```

键入-n以后，按tab，自动弹出可用的ns：

```sh
➜  admin kubectl -n
default        demo-echo      demo-webshell  kong           kube-public    kube-system
```

## 在linux上设置

```sh
yum install bash-completion
source /usr/share/bash-completion/bash_completion
echo 'source <(kubectl completion bash)' >>~/.bashrc
kubectl completion bash >/etc/bash_completion.d/kubectl
```

## 在mas上设置-bash

```sh
brew install bash-completion@2
export BASH_COMPLETION_COMPAT_DIR=/usr/local/etc/bash_completion.d
[[ -r /usr/local/etc/profile.d/bash_completion.sh ]] && . /usr/local/etc/profile.d/bash_completion.sh
echo 'source <(kubectl completion bash)' >>~/.bashrc
kubectl completion bash >/usr/local/etc/bash_completion.d/kubectl
```

## 参考

1. [kubectl Enabling shell autocompletion][1]

[1]: https://kubernetes.io/docs/tasks/tools/install-kubectl/#enabling-shell-autocompletion  "Enabling shell autocompletion"
