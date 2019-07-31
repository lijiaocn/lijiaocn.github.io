---
layout: default
title:  好雨云帮，一款不错的国产开源PaaS
author: 李佶澳
createdate: 2018/03/01 14:02:00
last_modified_at: 2018/07/15 13:23:04
categories: 项目
tags: paas
keywords: goodrain, rainbond,好雨云
description: 知道这个产品已经有很长一段时间了，但是一直没试用，最近有时间整一下

---

## 目录
* auto-gen TOC:
{:toc}

## 说明 

知道这个产品已经有很长的时间了，几年前前同事过去，就粗略看了一下。当时感觉不错，但是一直没试用，最近有时间整一下。

1. [好雨云官网][1]
2. [好雨科技官方开源项目][4]

## 安装

[好雨云安装][2]中给出配置需求为：demo环境需要4C8G，100G磁盘，支持CentOS7。

一键部署脚本托管在github：[rainbond-install][5]

如果机器中已经安装了其它相关服务，先卸载：

	yum erase nginx docker kubernetes

这里使用一下它的开发中的版本v3.6。

	git clone --depth 1 -b v3.6 https://github.com/goodrain/rainbond-install.git
	cd rainbond-install
	./setup.sh install

安装脚本的交互过程很赞:

![安装过程]( {{ site.imglocal }}/goodrain/install.png)

安装过程会下载docker镜像，我安装的时候下载calico的镜像非常慢，修改`rainbond.yaml.default`中的镜像源，更改为阿里云的：

	registry-mirrors: "https://0leoc7x1.mirror.aliyuncs.com"

另外，我安装的过程中，安装network的时候失败，检查发现是etcd容器启动失败。原因是`/etc/salt/minion.d/minion.ex.conf`中记录的IP是eth0网卡的IP，而不是我指定的eth1网卡的IP，直接更改之后，再次安装成功。

安装过程耗时比较长，这期间学习了一下它的安装脚本。

### 安装过程分析

`rainbond.yaml.default`是安装过程中使用的配置文件，通过其中的`install-type`可以设置为在线安装，不设置为就离线安装:

	install-type: online

在`setup.sh`脚本中可以看到，在线安装会调用`init_config`：

	install)
	    #do not check the internet when install offline
	    if $( grep 'install-type: online' rainbond.yaml.default >/dev/null );then
	    check_func && init_config && install_func ${@:2}
	    else
	    init_config && install_func
	    fi
	;;

#### init_config 

`init_config`中调用脚本`./scripts/init_sls.sh`，看了一眼init_sls.sh，首先设置了一下源，安装了相关的软件，重点是生成了配置文件`/srv/pillar/rainbond.sls`。

`/srv/pillar/rainbond.sls`就是`rainbond.yaml.default`的这个配置模版的实例版。

init_sls.sh在rainbond.sls设置了数据库、etcd、calico、entrance(LB)等参数，例如它会自动根据本地IP，选取calico使用的IP地址:

	    IP_INFO=$(ip ad | grep 'inet ' | egrep ' 10.|172.|192.168' | awk '{print $2}' | cut -d '/' -f 1 | grep -v '172.30.42.1')
	    IP_ITEMS=($IP_INFO)
	    INET_IP=${IP_ITEMS%%.*}
	    if [[ $INET_IP == '172' ]];then
	        CALICO_NET=10.0.0.0/16
	    elif [[ $INET_IP == '10' ]];then
	        CALICO_NET=172.16.0.0/16
	    else
	        CALICO_NET=172.16.0.0/16
	    fi

最后在本地安装、启动Salt服务，每个组件的salt文件位于`install/salt`中，这个目录被复制到了`/srv/`中。

#### install_func

当前的机器是作为管理节点的，将会安装下面的组件：

	MANAGE_MODULES="init \
	storage \
	docker \
	misc \
	grbase \
	etcd \
	network \
	kubernetes.server \
	node \
	db \
	plugins \
	proxy \
	prometheus \
	kubernetes.node"

每个模块的安装方式为：

	salt "*" state.sls $module

## 使用

安装完成之后直接打开网址，就进入到注册页面：

	http://<Master的IP地址>:7070/

![注册页面]({{ site.imglocal }}/rainbond/register.png)

默认第一个注册用户为平台管理员。

插件设计是亮点，缺点是目前功能还有点少，没有多团队管理、镜像仓库、构建过程管理、持续集成等功能。

## 参考

1. [好雨云官网][1]
2. [好雨云安装前准备][2]
3. [好雨云安装][3]
4. [好雨科技官方开源项目][3]
5. [rainbond-install][5]

[1]: https://www.goodrain.com/ "好雨云官网" 
[2]: https://www.goodrain.com/docs/stable/getting-started/before-installation.html "好雨云安装前准备"
[3]: https://www.goodrain.com/docs/stable/getting-started/online-installation.html  "好雨云安装" 
[4]: https://github.com/goodrain "好雨科技官方开源项目"
[5]: https://github.com/goodrain/rainbond-install.git "rainbond-install"
