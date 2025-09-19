---
layout: default
title: "Ansible 常见使用场景"
author: 李佶澳
date: "2023-05-08 19:46:29 +0800"
last_modified_at: "2023-05-08 20:09:35 +0800"
categories:  技巧
cover: 
tags: ansible
keywords:
description: 按需收集下常用的 ansible 操作
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

按需收集下常用的 ansible 操作。

## 操作 Docker

docker 安装脚本：（这里图省事，没有写成 ansible 任务）

```sh
sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg2 \
    software-properties-common

curl -fsSL https://mirrors.ustc.edu.cn/docker-ce/linux/debian/gpg | sudo apt-key add -

sudo add-apt-repository \
  "deb [arch=amd64] https://mirrors.ustc.edu.cn/docker-ce/linux/debian \
 $(lsb_release -cs) \
 stable"

sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io
```

推荐使用 python3，python2 可能会遇到下面的错误：

>FAILED! => {"changed": false, "msg": "Failed to import the required Python library (Docker SDK for Python: docker (Python >= 2.7) or docker-py (Python 2.6)) on n129's Python /usr/bin/python. Please read module documentation and install in the appropriate location. If the required library is installed, but Ansible is using the wrong Python interpreter, please consult the documentation on ansible_python_interpreter, for example via `pip install docker` or `pip install docker-py` (Python 2.6). The error was: cannot import name credentials"}

在目标机器上安装 pip3 以及 docker sdk：

```yaml
- name: install pip3
  apt:        
    name: python3-pip
    state: present

- name: install docker sdk
  pip:
    name: docker

- name: docker is running
  systemd:
    name: docker
    state: started
```

到 [All modules][2] 查找 docker 相关的 module，每个 module 文档的末尾都给出里的大量示范：

![ansible docker moudles]({{site.article}}/ansible-docker-module.png)


docker 登录、删除容器、启动容器等：

```yaml
- name: docker login
  docker_login:
    registry_url: xxx.com
    username: "XXXX"
    password: "XXX"
    reauthorize: true

- name: Delete demo container
  docker_container:
    name: demo
    state: absent
    force_kill: yes

- name: Start demo container
  docker_container:
    name: demo
    image: alpine
    state: started
    recreate: yes
    force_kill: yes
```

## 参考

1. [李佶澳的博客][1]
2. [All modules][2]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://docs.ansible.com/ansible/2.9/modules/list_of_all_modules.html "ansible All modules"

