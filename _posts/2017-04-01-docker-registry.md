---
layout: default
title: Docker image的存储管理
author: lijiaocn
createdate: 2017/04/01 16:39:28
changedate: 2017/09/11 16:21:15
categories: 项目
tags: docker
keywords: Docker,image,Registry
description: 收录介绍了几种Docker镜像存储、管理方法。

---

* auto-gen TOC:
{:toc}

## Docker Distribution

[docker-distribution][1]就是docker registry，docker公司开源的镜像管理系统，项目名现在已经改为Docker/Distribution。

开源的版本没有认证管理、帐号、权限管理等功能，需要对接到其它认证系统，商业版本是[Docker Trusted Registry](https://docker.github.io/datacenter/dtr/2.1/guides/)。

distribution本身是一个无状态的服务，镜像存放在独立的存储系统中，可以通过配置不同的driver选择不同的存储系统。

支持通过WebHook进行通知，可以与CI/CD系统对接。

### 在CentOS中通过RPM安装

	yum install -y docker-distribution

配置:

	# /etc/docker-distribution/registry/config.yml
	addr: 192.168.40.10:5000

启动:

	systemctl start docker-distribution

## Harbor

Harbor是vmware开源的一套面向企业用户的docker镜像管理系统，在docker distribution的基础上扩展了企业应用时需要的特性:

	RBAC权限控制，
	多registry部署，多备份存储
	AD/LDAP集成
	审计
	RESTful API

## 参考

1. [docker-distribution][1]
2. [docker-registry-html][2]
3. [docker-registry-md][3]
4. [vmware-harbor][4]
5. [harbor-doc][5]

[1]: https://github.com/docker/distribution "docker-distribution"
[2]: https://docker.github.io/registry/ "docker-registry-html"
[3]: https://github.com/docker/docker.github.io/tree/master/registry "docker-registry-md"
[4]: https://vmware.github.io/harbor/ "vmware-harbor"
[5]: https://github.com/vmware/harbor/tree/master/docs "harbor-doc"
