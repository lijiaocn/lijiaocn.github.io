---
title: 使用 kubespray 部署 kubernetes 集群
createtime: '2024-05-13 16:20:50 +0800'
last_modified_at: '2024-05-17 14:52:10 +0800'
categories:
- 技巧
tags:
- kubernetes
keywords: kubernetes
description: kubespray是kubernetes社区维护的一个部署方案，通过生成 ansible 文件，指定生成的 hosts.yaml 以及 kubespray
  项目中的 cluster.yml，完成部署。
author: 李佶澳
layout: default
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

## 基础用法

下载 kubespray 仓库并切换到目标版本：

```bash
git clone https://github.com/kubernetes-sigs/kubespray.git
cd kubespray 
git checkout v2.24.1
```

准备一个 python 运行环境，并安装 kubespray 需要的 python 代码包：

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

inventory/ 中的每个目录是一个部署实例，从 sample 中复制一份：

```bash
cp -r inventory/sample inventory/local-demo
```

指定目标机器的 IP 地址，生成对应的 hosts.yml 文件：

```bash
declare -a IPS=(192.168.33.11 192.168.33.12 192.168.33.13 192.168.33.14)
CONFIG_FILE=inventory/local-demo/hosts.yml python3 contrib/inventory_builder/inventory.py ${IPS[@]}
```

执行结束后，生成文件 inventory/local-demo/hosts.yml。其中定义了机器列表和机器分组。

最后执行 ansible 命令，指定生成的 hosts.yaml 以及 kubespray 项目中的 cluster.yml，完成部署。

```bash
ansible-playbook -i inventory/mycluster/hosts.yaml -u $USERNAME -b -v --private-key=~/.ssh/id_rsa cluster.yml
```

cluster.yml 在不同机器组上部署 kubernetes 的不同组件。

## 自定义集群配置

kubespary 支持通过变量自定义集群的配置:

* 支持的变量 [Configurable Parameters in Kubespray][2]
* 变量的默认值 [kubespray default config][3]

在 inventory 的每个实例目录中修改变量数值，比如 inventory/sample 中的变量配置：

```bash
$ ls inventory/sample/group_vars/all
all.yml         azure.yml       coreos.yml      docker.yml      gcp.yml         huaweicloud.yml offline.yml     upcloud.yml
aws.yml         containerd.yml  cri-o.yml       etcd.yml        hcloud.yml      oci.yml         openstack.yml   vsphere.yml
```

## 参考

1. [李佶澳的博客][1]
2. [Configurable Parameters in Kubespray][2]
3. [kubespray default config][3]
4. [Installing Kubernetes with deployment tools][4]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://kubespray.io/#/docs/vars "Configurable Parameters in Kubespray"
[3]: https://github.com/kubernetes-sigs/kubespray/blob/release-2.24/roles/kubespray-defaults/defaults/main/main.yml "kubespray default config"
[4]: https://kubernetes.io/docs/setup/production-environment/tools/ "Installing Kubernetes with deployment tools"
