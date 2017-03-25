---
layout: default
title: OpenStack
tags: 杂项

---

# OpenStack
创建时间: 2014/08/17 12:35:56  修改时间: 2016/12/06 00:19:49 作者:lijiao

----

## 摘要

最早接触到OpenStack是在2012年的样子, 那时候正是大肆推广的阶段，到处都能看到。那时新浪正将其落地。只是当时基础不足，仅仅是下载后无脑的安装了下, 很多事情都不清楚。

因最近找工作, 面试了一个岗位是OpenStack相关，因此拾起来继续学习下。看了下最新的icehouse版本的安装手册, 明显的比两年前的版本更加丰富、条理, SDN相关的内容也被引入了。(2014-08-17 12:43:15)

## 资料

首先获取一些必要资料:

OpenStack的路线图, [https://www.openstack.org/software/roadmap/](https://www.openstack.org/software/roadmap/)

	April 17, 2014: Icehouse Software Release           (当前版本,2014-08-17 14:47:20)
	May 13-16, 2014: Juno Release Design Summit
	October 16 2014: Juno Software Release              (正在开发中的下一个版本)
	November 5-8, 2014: "K" Release Design Summit       (下下个版本的设计阶段, 如果顺利的找到OpenStack相关工作, 可以全程跟踪这个版本)
	April 2015: "K" Software Release

OpenStack的文档: [http://docs.openstack.org/](http://docs.openstack.org/)

OpenStack的Wiki: [https://wiki.openstack.org/wiki/Main_Page](https://wiki.openstack.org/wiki/Main_Page)

## 组件概览

OpenStack一套由多个组件组成的系统, icehouse的手册一开始就抛出了10个组件, 不必急于记住这些组件分别是做什么的。首先设想一些，如果自己要做这样一套系统, 会设计哪些组件。

从本质上讲, 其实就是提供虚拟机服务, 核心就在于如何创建、管理大量的虚拟机。

第一, 在哪里存放? 

云环境下虚拟机的数量会非常多, 数据量非常大, 因此需要使用分布式存储。虚拟机的物理文件一般都是大文件, 而且不需要目录结构, 因此可以使用对象存储。

	OpenStack采用的对象存储是Swift。

	OpenStack使用Glance进行虚拟机镜像的统一管理。

第二, 在哪里运行? 

虚拟机的物理文件已经保存在分布式存储中, 可以被随时读取了。那么读取出来之后, 安放到哪里执行呢？

设想一:

	拥有一台非常庞大的超级计算机, 它可能有上千个CPU, 几TB的内存。只需要把虚拟机的物理文件拽到其中直接打开运行就可以了。
	
	至于几千个CPU如何协调, 几TB的内存如何组织, 统统由运行在超级计算机上的操作系统负责。

	系统的可靠性，也统统由超级计算机负责。

设想二:

	拥有很多台普通的Server，每台Server有1~4个CPU，8~32G的内存，上面可以同时运行2~4个虚拟机。
	
	将这些Server的信息全部汇总到一个中心点, 中心点知悉所有Server的状态(例如硬件规格、负载情况).

	当要开启一台虚拟机的时候，中心点挑选出一个Server, 将虚拟机的物理文件拽到这台Server上，然后打开虚拟机。

	每一台Server都有宕机的可能，中心点需要考虑，怎样在运行虚拟机的Server宕机的情况, 保证虚拟机工作的连续性。

OpenStack使用的应该是第二种方案。

	OpenStack中的Nova组件负责这部分工作。

第三, 虚拟机的诉求。

通过前两步的设计，已经可以管理运行大量的虚拟机了。但是，这时的虚拟机仅仅是可以运行了而已。更严格的说这时的虚拟机仅仅是拥有了CPU, 虚拟机中运行的系统还需要内存、硬盘、网卡等设备, 虚拟机之间还需要进行组网。

内存:

	可以直接使用Server的内存, 但是, 这样Server宕机的时候, 虚拟机的内存一并失效。

	可以使用分布式的内存, 即使Server宕机, 虚拟机的内存也会保存在系统中. (是否有这方面的技术？)
	
	Openstack使用的方式待求证。

硬盘:

	可以使用虚拟磁盘文件, 虚拟磁盘的物理文件和虚拟机镜像文件一同存放到分布式存储中。

	可以直接使用支持块存储的分布式文件系统。

	Openstack中使用的是Cinder。

网卡/虚拟网络:

	虚拟机的任何网络通信必然全部需要经过Server的物理网卡进行。需要在既定的物理连接上, 控制虚拟机的通信, 实现虚拟网络。

	OpenStack中使用的是Neutron。(还可以使用nova-network, 但是显然Neutron才是最终方案)

第四, 产品化

通过前面三步的设计, 实现了虚拟机的安放、运行、组网。在共产主义大家庭, 人人都是君子的情况下, 这套系统可以直接对外发布了。任何需要的人, 都可以随时在其中建立运行自己的虚拟机, 就好像公用的水龙头一样。

然而现在依然是资本主义、商业社会，个体之间还需要使用Money进行协作。人们也不是君子, 窥视他人数据的欲望依然旺盛。因此还需要一些支撑组件，例如认证系统、记账系统等等。当前的社会现实, 使我们浪费了多少时间和精力以及物理资源在这些不创造价值的事情上...

	OpenStack使用了这些支撑组件: KyeStone(认证系统)、Ceilometer(记账系统)、Horizon(管理面板)。

除此之外, 为了保证系统运行的稳定性，还需要各种监控组件，为了满足用户需求，需要与其它的云服务商对接等。可以到Openstack项目中查看正在维护的组件。

[https://github.com/openstack](https://github.com/openstack)

第五, 其它服务

通过前面四步的设计, 用户已经可以在这个系统申请虚拟机了, 用户的程序、数据都可以入驻到这个系统中了。只要用户入驻了进来, 就可以趁机推销其它的服务, 这大概才是云计算的商业魅力所在。

例如，可以为用户提供分布式缓存、分布式数据库、负载均衡、CDN加速，各种服务的逐一开发, 最终形成一篮子解决方案，提供一条龙服务。

	OpenStack中使用Trove提供数据库服务。

## 节点规划

总共3个节点，Controller、Network、Compute1

### 角色规划 

Controller作为中心控制节点，承当的服务也最多:

	依赖服务: Database(Mysql/MariaDB)、Message Broker(RabbitMQ/Qpid)
	基础服务: Identify(KeyStone)、Image Service(Glance)、Compute(Nova Management)、Networking(Neutron Server ML2 Plug-In)、Dashboard(Horizion)
	可选服务: Block Service(Cinder Management)、Object Storage(Swift Proxy)、Database Service(Trove Management)、Orchestration(Heat)、Telemetry(Ceilometer Core)
		注意: 这些可选服务中的有的本身就是一套分布式系统，只是将与这些系统对接的部分安装在了Controller上，例如Swift Proxy。

Network作为网络节点:

	基础服务: Networking(ML2 Plug-in、Layer 2 Agent、Layer 3 Agent、DHCP Agent)
		//这个莫非就是传说中的SDN的控制器? 要好好研究一下
		//注意: Netron Server位于Controller上, 该节点可能主要负责报文的转发服务.

Compute1作为运算节点(就是承担虚拟机运行的节点):

	基础服务: Compute(Nova Hypervisor KVM or QEMU) Networking(ML2 Plug-in、Layer 2 Agent)
	可选服务: Telemetry(Ceilometer Agent)


仔细看一下，可以发现有些基础服务是只在Controller上运行, 类似于CS模式。有些则是分布式部署。

	CS模式的有: Identify(KeyStone)、Image Service(Glance)、Dashboard(Horizion)
	分布式的有: Compute(Nova Management + Nova Hypervisor)、Networking(Neutron Server + Layer [2/3] Agent)

每个节点的角色是有安装在上面的组件决定的。节点上分别安装了不同的组件, 提供不同的服务, 因此具备了不同的角色。实际上，完全可以将这些服务随机分配到不同节点上，或者全部安装到同一个节点上(all-in-one)。

更需要认真的考虑的是, 生产环境中应该如何规划。例如Controller是很多服务的中心点, 一旦宕机, 整个系统就陷入停顿，生产环境中必须认真考虑这些中心节点的可靠性。

生产环境中的实施，有待实战.....

### 网络规划

总共有三个网络: 管理网(10.0.0.0/24)、内部网(10.0.1.0/24)、外部网(联通外网)。

使用vmware虚拟机模拟部署时, 管理网和内部网可以使用vmware的虚拟网络

所有的结点都位于管理网中: 

	controller(10.0.0.11)  
	network(10.0.0.21) 
	compute1(10.0.0.31)

除controller外, 其它节点全部位于内部网中:

	network(10.0.1.21/24) 
	compute1(10.0.1.31/24)

network与外网相连接:  

	network(外网IP)

生产环境中的网络规划，显然也是一件很关键的事情，可靠性、低延迟、跨机房、脑裂等等, 有待实战。

## 部署准备

这里使用的部署环境是三台运行CentOS7.0的Vmware虚拟机, 按照icehouse安装文档的示例进行安装。

每个节点都需要进行如下操作:

	启用network:
		service NetworkManager stop
		service network start
		chkconfig NetworkManager off
		chkconfig network on
			//CentOS7默认使用的是NetworkManager, 按照icehouse示例，改为使用以往的network(可以使用if-ethX配置文件)

	启用iptables:
		service firewalld stop  
		service iptables start
		chkconfig firewalld off
		chkconfig iptables  on
			//CentOS7默认使用firewalld，icehouse中的建议使用iptables, CentOS7中通过 yum install iptables-services 安装iptables服务

	在/etc/hosts中添加:
		controller    XXX.XXX.XXX.XXX
		network       XXX.XXX.XXX.XXX
		compute1      XXX.XXX.XXX.XXX

	更新软件包:
		yum upgrade   //下面的一些软件可能需要依赖最新的软件包,例如openstack-selinux依赖最新的selinux-policy-targeted

	安装ntp:  
		yum install ntp
		将/etc/ntp.conf中的server改为controller

	安装mysql-python
		yum install MySQL-python
			//MySQL-python是每个节点都需要使用的Mysql的Python接口


	安装RDO源:
		yum install yum-plugin-priorities
		yum install http://repos.fedorapeople.org/repos/openstack/openstack-icehouse/rdo-release-icehouse-4.noarch.rpm
		yum install https://dl.fedoraproject.org/pub/epel/beta/7/x86_64/epel-release-7-0.2.noarch.rpm
			//注意: 这里安装的epel版本是7, 在CentOS7安装需要安装版本7。手册中使用的epel版本是6
			//现在,epel-7还在beta阶段
	
	安装Openstack的安装工具:
		yum install openstack-utils
		yum install openstack-selinux  

关于RDO:

RDO是一套在Rethat系列的发型版上安装Openstack的安装工具

[http://openstack.redhat.com/Main_Page](http://openstack.redhat.com/Main_Page)

>在运行CentOS7的Vmware虚拟机上尝试了一下allinone安装, 结果出错, 一开始是版本号的原因, 修改后可以了。然后又是一个yum命令执行出错，然后就没什么兴趣折腾了。花费时间去折腾只适用于Redhat系列的自动安装工具, 还不如全手工安装。

## Controller -- 控制节点

### 网络配置

假设使用eth1接入管理网。/etc/sysconfig/network-scripts/if-eth1:

	DEVICE=eth1
	TYPE=Ethernet
	BOOTPROTO=static
	IPADDR=10.0.0.11
	GATEWAY=10.0.0.1
	NETMASK=255.255.255.0
	ONBOOT=yes

### 数据库 -- mariadb

很多服务需要使用数据库存储数据。数据库服务是OpenStack依赖的服务之一。

mariadb是社区在mysql被Oracle纳入麾下后新辟的一个mysql分支。采用mariadb是因为位于Oracle阴影的下mysql被普遍看衰, 而mariadb则呼声很高。mariadb的接口与mysql完全兼容, 因此不会影响到使用mysql的程序。

	yum install mariadb-server

	配置, 在/etc/my.cnf的[mysqld]一节中增加:

		bind-address = 10.0.0.11
		default-storage-engine = innodb
		innodb_file_per_table
		collation-server = utf8_general_ci
		init-connect = 'SET NAMES utf8'
		character-set-server = utf8
	
	启动以及添加到开机自启动:

		systemctl start mariadb
		chkconfig mariadb on

	设置密码以及删除匿名用户:

		mysql_secure_installation
			//运行过程中，会提示设置root密码, 删除匿名用户

>设置的mariadb的root用户密码为: dbroot123

### 消息队列 -- qpid

OpenStack的众多服务之间需要使用消息队列进行彼此协调。(对消息队列没有太多了解,待学习)

手册中推荐在redhat系列上使用qpid

	yum install qpid-cpp-server


在/etc/qpid/qpidd.conf中添加:

	auth=no
		//不需要认证，这么做仅仅是为了简化实验环境的搭建。

启动:

	# service qpidd start
	# chkconfig qpidd on

### Identity Service -- KeyStone

KeyStone是Openstack使用的认证服务。OpenStack中的其它服务也需要经过Keystone的认证, 因此KeyStone是Openstack的第一个服务。

因为在部署准备，已经将RDO源添加到了yum.repos.d中, 因此可以直接使用yum安装。

>源地址: [http://repos.fedorapeople.org/repos/openstack/openstack-icehouse/epel-7/](http://repos.fedorapeople.org/repos/openstack/openstack-icehouse/epel-7/)

	yum install openstack-keystone python-keystoneclient

~~安装时发现, CentOS7的python版本是2.7, 而rdo源中依赖的是2.6, 依赖检查不通过。不想降低版本。尝试源码安装:~~

纠错: 实际是因为安装epel时错误的在CentOS7上安装版本6的epel，在此进行纠正, 源码的安装的部分安排到后续的开发环境搭建中。

>epel是fedora维护的企业版的安装包, 版本号与CentOS、Redhat一致。

设置KeyStone的数据库:

	openstack-config --set /etc/keystone/keystone.conf database connection mysql://keystone:keystone1@controller/keystone
	
	//创建keystone数据库
	$ mysql -u root -p
	mysql> CREATE DATABASE keystone;
	mysql> GRANT ALL PRIVILEGES ON keystone.* TO 'keystone'@'localhost' IDENTIFIED BY 'keystone1';
	mysql> GRANT ALL PRIVILEGES ON keystone.* TO 'keystone'@'%' IDENTIFIED BY 'keystone1';
	mysql> exit

	//创建表
	 su -s /bin/sh -c "keystone-manage db_sync" keystone
		//这时候查看数据库keystone，其中已经建立了数据表
		 MariaDB [keystone]> show tables;
		+-----------------------+
		| Tables_in_keystone    |
		+-----------------------+
		| assignment            |
		| credential            |
		| domain                |
		| endpoint              |
		| group                 |
		| migrate_version       |
		| policy                |
		| project               |
		| region                |
		| role                  |
		| service               |
		| token                 |
		| trust                 |
		| trust_role            |
		| user                  |
		| user_group_membership |
		+-----------------------+
		16 rows in set (0.01 sec)

设置Keystone的访问token:

	# ADMIN_TOKEN=$(openssl rand -hex 10)
	# echo $ADMIN_TOKEN
	# openstack-config --set /etc/keystone/keystone.conf DEFAULT admin_token $ADMIN_TOKEN

		//OpenStack中的其它服务可以通过这个密钥访问keystone
	
设置KeyStone的公私钥:

	# keystone-manage pki_setup --keystone-user keystone --keystone-group keystone
	# chown -R keystone:keystone /etc/keystone/ssl
	# chmod -R o-rwx /etc/keystone/ssl

至此，安装工作完成，启动:

	# service openstack-keystone start
	# chkconfig openstack-keystone on

KeyStone中过期的token会被保存在数据库中(做审计的时候可能会用到), 可以使用cron定时任务定时过期的token移动到记录文件中。

	(crontab -l -u keystone 2>&1 | grep -q token_flush) || echo '@hourly /usr/bin/keystone-manage token_flush >/var/log/keystone/keystone-tokenflush.log 2>&1' >> /var/spool/cron/keystone

KeyStone的交互客户端是命令keystone, 通过keystone -h可以查看使用方法。

#### 设置

因为刚刚安装KeyStone, 其中还没有任何用户，因此只能通过使用安装时设置的token来访问KeyStone的服务。KeyStone默认管理端口35357，服务端口5000。

在环境变量中指定要使用的Token和服务地址:

	export OS_SERVICE_TOKEN=$ADMIN_TOKEN
	export OS_SERVICE_ENDPOINT=http://controller:35357/v2.0

KeyStone中，用户(User)是使用者单位, 角色(Role)是权限单位，租户(Tenant)是资源单位

创建admin用户:

	keystone user-create --name=admin --pass=admin1 --email=admin@xxx.com
			//新建用户
			+----------+----------------------------------+
			| Property |              Value               |
			+----------+----------------------------------+
			|  email   |          admin@xxx.com           |
			| enabled  |               True               |
			|    id    | b88cd2e9112f4493b4c93c2c6c4daded |
			|   name   |              admin               |
			| username |              admin               |
			+----------+----------------------------------+
	
	keystone role-create --name=admin
			//新建角色
			+----------+----------------------------------+
			| Property |              Value               |
			+----------+----------------------------------+
			|    id    | b91ef879c43648a9a85cabe28c11e71e |
			|   name   |              admin               |
			+----------+----------------------------------+

	keystone tenant-create --name=admin --description="Admin Tenant"
			//新建租户
			+-------------+----------------------------------+
			|   Property  |              Value               |
			+-------------+----------------------------------+
			| description |           Admin Tenant           |
			|   enabled   |               True               |
			|      id     | 0fa4e3b95aa54f3eb9f64466b709021d |
			|     name    |              admin               |
			+-------------+----------------------------------+

	keystone user-role-add --user=admin --tenant=admin --role=admin
			//关联用户/角色/租户
	keystone user-role-add --user=admin --role=_member_ --tenant=admin
			//关联_member

创建普通用户:

	keystone user-create --name=demo --pass=demo1 --email=demo@xxx.com
			//新建用户
			+----------+----------------------------------+
			| Property |              Value               |
			+----------+----------------------------------+
			|  email   |           demo@xxx.com           |
			| enabled  |               True               |
			|    id    | 682f75ab1bfe41aa8c0baffa109613f5 |
			|   name   |               demo               |
			| username |               demo               |
			+----------+----------------------------------+

	keystone tenant-create --name=demo --description="Demo Tenant"
			//新建租户
			+-------------+----------------------------------+
			|   Property  |              Value               |
			+-------------+----------------------------------+
			| description |           Demo Tenant            |
			|   enabled   |               True               |
			|      id     | 9caafa03ee714efd94a5e6ddf7766a9e |
			|     name    |               demo               |
			+-------------+----------------------------------+

	 keystone user-role-add --user=demo --role=_member_ --tenant=demo

创建服务:

	keystone tenant-create --name=service --description="Service Tenant"

	keystone service-create --name=keystone --type=identity --description="OpenStack Identity"
			//新建服务
			+-------------+----------------------------------+
			|   Property  |              Value               |
			+-------------+----------------------------------+
			| description |        OpenStack Identity        |
			|   enabled   |               True               |
			|      id     | b574dea1fba74ada9cc7008dd458637c |
			|     name    |             keystone             |
			|     type    |             identity             |
			+-------------+----------------------------------+

	keystone endpoint-create --service-id=$(keystone service-list | awk '/ identity / {print $2}')  --publicurl=http://controller:5000/v2.0  --internalurl=http://controller:5000/v2.0 --adminurl=http://controller:35357/v2.0
			//指定url
			+-------------+----------------------------------+
			|   Property  |              Value               |
			+-------------+----------------------------------+
			|   adminurl  |   http://controller:35357/v2.0   |
			|      id     | bd749a1704b8469d8d9cbe11698ba5e1 |
			| internalurl |   http://controller:5000/v2.0    |
			|  publicurl  |   http://controller:5000/v2.0    |
			|    region   |            regionOne             |
			|  service_id | b574dea1fba74ada9cc7008dd458637c |
			+-------------+----------------------------------+

#### 以用户身份访问

创建用户后，就可以以用户的身份访问keystone服务,例如:

	keystone --os-username=admin --os-password=admin1 --os-auth-url=http://controller:35357/v2.0 token-get
		//获取token
	keystone --os-username=admin --os-password=admin1 --os-auth-url=http://controller:35357/v2.0 user-list
		//获取用户列表

### Image Servie -- glance

glance用来管理虚拟机镜像。

	yum install openstack-glance python-glanceclient

配置:

	openstack-config --set /etc/glance/glance-api.conf database connection mysql://glance:glance1@controller/glance
	openstack-config --set /etc/glance/glance-registry.conf database connection mysql://glance:glance1@controller/glance
		//指定数据库


	openstack-config --set /etc/glance/glance-api.conf DEFAULT rpc_backend qpid
	openstack-config --set /etc/glance/glance-api.conf DEFAULT qpid_hostname controller
		//指定消息队列

	$ mysql -u root -p
	mysql> CREATE DATABASE glance;
	mysql> GRANT ALL PRIVILEGES ON glance.* TO 'glance'@'localhost' IDENTIFIED BY 'glance1';
	mysql> GRANT ALL PRIVILEGES ON glance.* TO 'glance'@'%' IDENTIFIED BY 'glance1';
		//创建数据库

	 su -s /bin/sh -c "glance-manage db_sync" glance
		//创建数据库表

	keystone user-create --name=glance --pass=glance1 --email=glance@xxx.com
	keystone user-role-add --user=glance --tenant=service --role=admin
			//在keystone中创建glance用户
	
	openstack-config --set /etc/glance/glance-api.conf keystone_authtoken  auth_uri http://controller:5000
	openstack-config --set /etc/glance/glance-api.conf keystone_authtoken  auth_host controller
	openstack-config --set /etc/glance/glance-api.conf keystone_authtoken  auth_port 35357
	openstack-config --set /etc/glance/glance-api.conf keystone_authtoken  auth_protocol http
	openstack-config --set /etc/glance/glance-api.conf keystone_authtoken  admin_tenant_name service
	openstack-config --set /etc/glance/glance-api.conf keystone_authtoken  admin_user glance
	openstack-config --set /etc/glance/glance-api.conf keystone_authtoken  admin_password glance1
	openstack-config --set /etc/glance/glance-api.conf paste_deploy  flavor keystone
			//glance-api

	openstack-config --set /etc/glance/glance-registry.conf keystone_authtoken  auth_uri http://controller:5000
	openstack-config --set /etc/glance/glance-registry.conf keystone_authtoken  auth_host controller
	openstack-config --set /etc/glance/glance-registry.conf keystone_authtoken  auth_port 35357
	openstack-config --set /etc/glance/glance-registry.conf keystone_authtoken  auth_protocol http
	openstack-config --set /etc/glance/glance-registry.conf keystone_authtoken  admin_tenant_name service
	openstack-config --set /etc/glance/glance-registry.conf keystone_authtoken  admin_user glance
	openstack-config --set /etc/glance/glance-registry.conf keystone_authtoken  admin_password glance1
	openstack-config --set /etc/glance/glance-registry.conf paste_deploy  flavor keystone
			//glance-registry


注册服务:

	keystone service-create --name=glance --type=image --description="OpenStack Image Service"
	keystone endpoint-create  --service-id=$(keystone service-list | awk '/ image / {print $2}')  --publicurl=http://controller:9292  --internalurl=http://controller:9292  --adminurl=http://controller:9292

启动:
	service openstack-glance-api start
	service openstack-glance-registry start
	chkconfig openstack-glance-api on
	chkconfig openstack-glance-registry on

#### 使用

向glance中上传镜像:

	glance image-create --name "cirros-0.3.2-x86_64" --disk-format qcow2 --container-format bare --is-public True --progress < cirros-0.3.2-x86_64-disk.img
		//上传本地镜像
	glance image-create --name="cirros-0.3.2-x86_64" --disk-format=qcow2 --container-format=bare --is-public=true --copy-from http://cdn.download.cirros-cloud.net/0.3.2/cirros-0.3.2-x86_64-disk.img
		//上传指定位置处的镜像
		+------------------+--------------------------------------+
		| Property         | Value                                |
		+------------------+--------------------------------------+
		| checksum         | None                                 |
		| container_format | bare                                 |
		| created_at       | 2014-08-21T21:01:12                  |
		| deleted          | False                                |
		| deleted_at       | None                                 |
		| disk_format      | qcow2                                |
		| id               | 5fe8b793-ddfa-49f9-a11c-d8bd4a20e0c7 |
		| is_public        | True                                 |
		| min_disk         | 0                                    |
		| min_ram          | 0                                    |
		| name             | cirros-0.3.2-x86_64                  |
		| owner            | 0fa4e3b95aa54f3eb9f64466b709021d     |
		| protected        | False                                |
		| size             | 13167616                             |
		| status           | queued                               |
		| updated_at       | 2014-08-21T21:01:12                  |
		| virtual_size     | None                                 |
		+------------------+--------------------------------------+

查看镜像:

	glance image-list
		+--------------------------------------+---------------------+-------------+------------------+----------+--------+
		| ID                                   | Name                | Disk Format | Container Format | Size     | Status |
		+--------------------------------------+---------------------+-------------+------------------+----------+--------+
		| 5fe8b793-ddfa-49f9-a11c-d8bd4a20e0c7 | cirros-0.3.2-x86_64 | qcow2       | bare             | 13167616 | saving |
		+--------------------------------------+---------------------+-------------+------------------+----------+--------+

注意，从数据库glance的image_locations表中可以看到，镜像文件存放在/var/lib/glance/images中

	MariaDB [glance]> select id,image_id,value from image_locations;
	+----+--------------------------------------+--------------------------------------------------------------------+
	| id | image_id                             | value                                                              |
	+----+--------------------------------------+--------------------------------------------------------------------+
	|  1 | 5fe8b793-ddfa-49f9-a11c-d8bd4a20e0c7 | file:///var/lib/glance/images/5fe8b793-ddfa-49f9-a11c-d8bd4a20e0c7 |
	+----+--------------------------------------+--------------------------------------------------------------------+
	1 row in set (0.00 sec)

生产环境中,存放位置需要被替换为存放到分布式文件系统中,或其他的可靠的存储。

### 计算节点控制器 -- Nova

Nova分为控制器和agent的两部分, 这里将控制部分安装到Controller上。

	yum install openstack-nova-api openstack-nova-cert openstack-nova-conductor openstack-nova-console openstack-nova-novncproxy openstack-nova-scheduler python-novaclient

配置:

	openstack-config --set /etc/nova/nova.conf database connection mysql://nova:nova1@controller/nova
			//设置数据库
	openstack-config --set /etc/nova/nova.conf DEFAULT rpc_backend qpid
	openstack-config --set /etc/nova/nova.conf DEFAULT qpid_hostname controller
			//设置消息队列

	openstack-config --set /etc/nova/nova.conf DEFAULT my_ip 10.0.0.11
	openstack-config --set /etc/nova/nova.conf DEFAULT vncserver_listen 10.0.0.11
	openstack-config --set /etc/nova/nova.conf DEFAULT vncserver_proxyclient_address 10.0.0.11
			//配置ip

	$ mysql -u root -p
	mysql> CREATE DATABASE nova;
	mysql> GRANT ALL PRIVILEGES ON nova.* TO 'nova'@'localhost' IDENTIFIED BY 'nova1';
	mysql> GRANT ALL PRIVILEGES ON nova.* TO 'nova'@'%' IDENTIFIED BY 'nova1';
			//创建数据库

	su -s /bin/sh -c "nova-manage db sync" nova
			//创建数据库表

	keystone user-create --name=nova --pass=nova1 --email=nova@xxx.com
	keystone user-role-add --user=nova --tenant=service --role=admin

	openstack-config --set /etc/nova/nova.conf DEFAULT auth_strategy keystone
	openstack-config --set /etc/nova/nova.conf keystone_authtoken auth_uri http://controller:5000
	openstack-config --set /etc/nova/nova.conf keystone_authtoken auth_host controller
	openstack-config --set /etc/nova/nova.conf keystone_authtoken auth_protocol http
	openstack-config --set /etc/nova/nova.conf keystone_authtoken auth_port 35357
	openstack-config --set /etc/nova/nova.conf keystone_authtoken admin_user nova
	openstack-config --set /etc/nova/nova.conf keystone_authtoken admin_tenant_name service
	openstack-config --set /etc/nova/nova.conf keystone_authtoken admin_password nova1

	keystone service-create --name=nova --type=compute   --description="OpenStack Compute"
	keystone endpoint-create   --service-id=$(keystone service-list | awk '/ compute / {print $2}')   --publicurl=http://controller:8774/v2/%\(tenant_id\)s   --internalurl=http://controller:8774/v2/%\(tenant_id\)s   --adminurl=http://controller:8774/v2/%\(tenant_id\)s

启动:

	service openstack-nova-api start
	service openstack-nova-cert start
	service openstack-nova-consoleauth start
	service openstack-nova-scheduler start
	service openstack-nova-conductor start
	service openstack-nova-novncproxy start
	chkconfig openstack-nova-api on
	chkconfig openstack-nova-cert on
	chkconfig openstack-nova-consoleauth on
	chkconfig openstack-nova-scheduler on
	chkconfig openstack-nova-conductor on
	chkconfig openstack-nova-novncproxy on

### 网络控制器 -- neutron

neutron分为controller上的控制组件、网络节点上的组件、计算节点上的组件三部分。

	yum install openstack-neutron openstack-neutron-ml2 python-neutronclient

	openstack-config --set /etc/neutron/neutron.conf database connection mysql://neutron:neutron1@controller/neutron

	keystone user-create --name neutron --pass neutron1 --email neutron@xxx.com
	keystone user-role-add --user neutron --tenant service --role admin
	keystone service-create --name neutron --type network --description "OpenStack Networking"
	keystone endpoint-create --service-id $(keystone service-list | awk '/ network / {print $2}') --publicurl http://controller:9696 --adminurl http://controller:9696  --internalurl http://controller:9696
			//创建用户，以及注册服务

	openstack-config --set /etc/neutron/neutron.conf DEFAULT  auth_strategy keystone
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  auth_uri http://controller:5000
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  auth_host controller
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  auth_protocol http
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  auth_port 35357
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  admin_tenant_name service
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  admin_user neutron
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  admin_password neutron1
			//配置认证

	openstack-config --set /etc/neutron/neutron.conf DEFAULT  rpc_backend neutron.openstack.common.rpc.impl_qpid
	openstack-config --set /etc/neutron/neutron.conf DEFAULT  qpid_hostname controller
			//配置消息队列

	openstack-config --set /etc/neutron/neutron.conf DEFAULT  notify_nova_on_port_status_changes True
	openstack-config --set /etc/neutron/neutron.conf DEFAULT  notify_nova_on_port_data_changes True
	openstack-config --set /etc/neutron/neutron.conf DEFAULT  nova_url http://controller:8774/v2
	openstack-config --set /etc/neutron/neutron.conf DEFAULT  nova_admin_username nova
	openstack-config --set /etc/neutron/neutron.conf DEFAULT  nova_admin_tenant_id $(keystone tenant-list | awk '/ service / { print $2 }')
	openstack-config --set /etc/neutron/neutron.conf DEFAULT  nova_admin_password nova1
	openstack-config --set /etc/neutron/neutron.conf DEFAULT  nova_admin_auth_url http://controller:35357/v2.0
			//网络变更时通知nova

	openstack-config --set /etc/neutron/neutron.conf DEFAULT  core_plugin ml2
	openstack-config --set /etc/neutron/neutron.conf DEFAULT  service_plugins router
			//服务插件

	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini ml2  type_drivers gre
	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini ml2  tenant_network_types gre
	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini ml2  mechanism_drivers openvswitch
	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini ml2_type_gre  tunnel_id_ranges 1:1000
	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini securitygroup  firewall_driver neutron.agent.linux.iptables_firewall.OVSHybridIptablesFirewallDriver
	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini securitygroup  enable_security_group True

	openstack-config --set /etc/nova/nova.conf DEFAULT  network_api_class nova.network.neutronv2.api.API
	openstack-config --set /etc/nova/nova.conf DEFAULT  neutron_url http://controller:9696
	openstack-config --set /etc/nova/nova.conf DEFAULT  neutron_auth_strategy keystone
	openstack-config --set /etc/nova/nova.conf DEFAULT  neutron_admin_tenant_name service
	openstack-config --set /etc/nova/nova.conf DEFAULT  neutron_admin_username neutron
	openstack-config --set /etc/nova/nova.conf DEFAULT  neutron_admin_password neutron1
	openstack-config --set /etc/nova/nova.conf DEFAULT  neutron_admin_auth_url http://controller:35357/v2.0
	openstack-config --set /etc/nova/nova.conf DEFAULT  linuxnet_interface_driver nova.network.linux_net.LinuxOVSInterfaceDriver
	openstack-config --set /etc/nova/nova.conf DEFAULT  firewall_driver nova.virt.firewall.NoopFirewallDriver
	openstack-config --set /etc/nova/nova.conf DEFAULT  security_group_api neutron
			//配置nova使用的网络服务

	ln -s plugins/ml2/ml2_conf.ini /etc/neutron/plugin.ini

	service openstack-nova-api restart
	service openstack-nova-scheduler restart
	service openstack-nova-conductor restart
			//重启nova

	service neutron-server start
	chkconfig neutron-server on
			//启动neutron


	openstack-config --set /etc/nova/nova.conf DEFAULT  service_neutron_metadata_proxy true
	openstack-config --set /etc/nova/nova.conf DEFAULT  neutron_metadata_proxy_shared_secret metadata1
	service openstack-nova-api restart
			//配置metadata


## Network -- 网络节点

网络节点主要作用支持虚拟网络，也就是SDN。这里安装neutron的在网络节点上的组件。

配置/etc/sysctl.conf:

	net.ipv4.ip_forward=1
	net.ipv4.conf.all.rp_filter=0
	net.ipv4.conf.default.rp_filter=0

配置命令:

	sysctl -p

	yum install openstack-neutron openstack-neutron-ml2 openstack-neutron-openvswitch

	openstack-config --set /etc/neutron/neutron.conf DEFAULT  auth_strategy keystone
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  auth_uri http://controller:5000
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  auth_host controller
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  auth_protocol http
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  auth_port 35357
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  admin_tenant_name service
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  admin_user neutron
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  admin_password neutron1

	openstack-config --set /etc/neutron/neutron.conf DEFAULT  rpc_backend neutron.openstack.common.rpc.impl_qpid
	openstack-config --set /etc/neutron/neutron.conf DEFAULT  qpid_hostname controller

	openstack-config --set /etc/neutron/neutron.conf DEFAULT  core_plugin ml2
	openstack-config --set /etc/neutron/neutron.conf DEFAULT  service_plugins router

	openstack-config --set /etc/neutron/l3_agent.ini DEFAULT  interface_driver neutron.agent.linux.interface.OVSInterfaceDriver
	openstack-config --set /etc/neutron/l3_agent.ini DEFAULT  use_namespaces True

	openstack-config --set /etc/neutron/dhcp_agent.ini DEFAULT  interface_driver neutron.agent.linux.interface.OVSInterfaceDriver
	openstack-config --set /etc/neutron/dhcp_agent.ini DEFAULT  dhcp_driver neutron.agent.linux.dhcp.Dnsmasq
	openstack-config --set /etc/neutron/dhcp_agent.ini DEFAULT  use_namespaces True

	openstack-config --set /etc/neutron/metadata_agent.ini DEFAULT  auth_url http://controller:5000/v2.0
	openstack-config --set /etc/neutron/metadata_agent.ini DEFAULT  auth_region regionOne
	openstack-config --set /etc/neutron/metadata_agent.ini DEFAULT  admin_tenant_name service
	openstack-config --set /etc/neutron/metadata_agent.ini DEFAULT  admin_user neutron
	openstack-config --set /etc/neutron/metadata_agent.ini DEFAULT  admin_password neutron1
	openstack-config --set /etc/neutron/metadata_agent.ini DEFAULT  nova_metadata_ip controller
	openstack-config --set /etc/neutron/metadata_agent.ini DEFAULT  metadata_proxy_shared_secret metadata1
			//配置metadata

	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini ml2  type_drivers gre
	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini ml2  tenant_network_types gre
	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini ml2  mechanism_drivers openvswitch
	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini ml2_type_gre  tunnel_id_ranges 1:1000

	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini ovs  local_ip 10.0.1.21
	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini ovs  tunnel_type gre
	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini ovs  enable_tunneling True

	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini securitygroup  firewall_driver neutron.agent.linux.iptables_firewall.OVSHybridIptablesFirewallDriver
	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini securitygroup  enable_security_group True

	service openvswitch start
	chkconfig openvswitch on
	ovs-vsctl add-br br-int
	ovs-vsctl add-br br-ex
	ovs-vsctl add-port br-ex eth2 
	ethtool -K eth2 gro off
			//eth2是外网网卡

	ln -s plugins/ml2/ml2_conf.ini /etc/neutron/plugin.ini
	service neutron-openvswitch-agent start
	service neutron-l3-agent start
	service neutron-dhcp-agent start
	service neutron-metadata-agent start
	chkconfig neutron-openvswitch-agent on
	chkconfig neutron-l3-agent on
	chkconfig neutron-dhcp-agent on
	chkconfig neutron-metadata-agent on


## Compute1 -- 计算节点

计算节点上需要安装nova和neutron两部分内容。

### nova部分:

	yum install openstack-nova-compute

	openstack-config --set /etc/nova/nova.conf database connection mysql://nova:nova1@controller/nova
	openstack-config --set /etc/nova/nova.conf DEFAULT auth_strategy keystone
	openstack-config --set /etc/nova/nova.conf keystone_authtoken auth_uri http://controller:5000
	openstack-config --set /etc/nova/nova.conf keystone_authtoken auth_host controller
	openstack-config --set /etc/nova/nova.conf keystone_authtoken auth_protocol http
	openstack-config --set /etc/nova/nova.conf keystone_authtoken auth_port 35357
	openstack-config --set /etc/nova/nova.conf keystone_authtoken admin_user nova
	openstack-config --set /etc/nova/nova.conf keystone_authtoken admin_tenant_name service
	openstack-config --set /etc/nova/nova.conf keystone_authtoken admin_password nova1

	openstack-config --set /etc/nova/nova.conf DEFAULT rpc_backend qpid
	openstack-config --set /etc/nova/nova.conf DEFAULT qpid_hostname controller

	openstack-config --set /etc/nova/nova.conf DEFAULT my_ip 10.0.0.31 openstack-config --set /etc/nova/nova.conf DEFAULT vnc_enabled True openstack-config --set /etc/nova/nova.conf DEFAULT vncserver_listen 0.0. 0.0
	openstack-config --set /etc/nova/nova.conf DEFAULT vncserver_proxyclient_address 10.0.0.31
	openstack-config --set /etc/nova/nova.conf DEFAULT novncproxy_base_url http://controller:6080/vnc_auto.html

	openstack-config --set /etc/nova/nova.conf DEFAULT glance_host controller
			//配置glance地址

使用下面命令检查是否支持硬件加速:

	 egrep -c '(vmx|svm)' /proc/cpuinfo

如果不支持(返回0)，需要进行如下配置:

	openstack-config --set /etc/nova/nova.conf libvirt virt_type qemu

启动:

	service libvirtd start
	service messagebus start
	service openstack-nova-compute start
	chkconfig libvirtd on
	chkconfig messagebus on
	chkconfig openstack-nova-compute on
			//启动

### neutron部分:

编辑/etc/sysctl.conf

	net.ipv4.conf.all.rp_filter=0
	net.ipv4.conf.default.rp_filter=0

安装/配置:

	sysctl -p
	yum install openstack-neutron-ml2 openstack-neutron-openvswitch

	openstack-config --set /etc/neutron/neutron.conf DEFAULT  auth_strategy keystone
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  auth_uri http://controller:5000
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  auth_host controller
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  auth_protocol http
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  auth_port 35357
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  admin_tenant_name service
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  admin_user neutron
	openstack-config --set /etc/neutron/neutron.conf keystone_authtoken  admin_password neutron1

	openstack-config --set /etc/neutron/neutron.conf DEFAULT  rpc_backend neutron.openstack.common.rpc.impl_qpid
	openstack-config --set /etc/neutron/neutron.conf DEFAULT  qpid_hostname controller

	openstack-config --set /etc/neutron/neutron.conf DEFAULT  core_plugin ml2
	openstack-config --set /etc/neutron/neutron.conf DEFAULT  service_plugins router

	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini ml2  type_drivers gre
	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini ml2  tenant_network_types gre
	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini ml2  mechanism_drivers openvswitch
	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini ml2_type_gre tunnel_id_ranges 1:1000
	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini ovs  local_ip 10.0.1.31
	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini ovs  tunnel_type gre
	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini ovs  enable_tunneling True
	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini securitygroup firewall_driver neutron.agent.linux.iptables_firewall.OVSHybridIptablesFirewallDriver
	openstack-config --set /etc/neutron/plugins/ml2/ml2_conf.ini securitygroup enable_security_group True


	service openvswitch start
	chkconfig openvswitch on
	ovs-vsctl add-br br-int

	openstack-config --set /etc/nova/nova.conf DEFAULT  network_api_class nova.network.neutronv2.api.API
	openstack-config --set /etc/nova/nova.conf DEFAULT  neutron_url http://controller:9696
	openstack-config --set /etc/nova/nova.conf DEFAULT  neutron_auth_strategy keystone
	openstack-config --set /etc/nova/nova.conf DEFAULT  neutron_admin_tenant_name service
	openstack-config --set /etc/nova/nova.conf DEFAULT  neutron_admin_username neutron
	openstack-config --set /etc/nova/nova.conf DEFAULT  neutron_admin_password neutron1
	openstack-config --set /etc/nova/nova.conf DEFAULT  neutron_admin_auth_url http://controller:35357/v2.0
	openstack-config --set /etc/nova/nova.conf DEFAULT  linuxnet_interface_driver nova.network.linux_net.LinuxOVSInterfaceDriver
	openstack-config --set /etc/nova/nova.conf DEFAULT  firewall_driver nova.virt.firewall.NoopFirewallDriver
	openstack-config --set /etc/nova/nova.conf DEFAULT  security_group_api neutron

	ln -s plugins/ml2/ml2_conf.ini /etc/neutron/plugin.ini
	service openstack-nova-compute restart
	service neutron-openvswitch-agent start
	chkconfig neutron-openvswitch-agent on

## 创建OpenStack虚拟网络

至此，最基本的服务(Keystone、nova、neutron)已经安装完成。下面进行虚拟网络的创建(在controller上操作)

创建一个外部网络和一个租户网络, 并使两者可以连通。

使用admin用户，创建外部网络(外部网络必须由admin用户创建):

	neutron net-create ext-net --shared --router:external=True
	neutron subnet-create ext-net --name ext-subnet --allocation-pool start=192.168.88.10,end=192.168.88.90 --disable-dhcp --gateway 192.168.88.1 192.168.88.0/24
		//neutron subnet-create ext-net --name ext-subnet --allocation-pool start=203.0.113.101,end=203.0.113.200 --disable-dhcp --gateway 203.0.113.1 203.0.113.0/24

使用demo用户, 创建租户网络:

	neutron net-create demo-net
	neutron subnet-create demo-net --name demo-subnet --gateway 192.168.7.1 192.168.7.0/24

使用demo用户，设置租户网络与外部网络的路由:

	neutron router-create demo-router
	neutron router-interface-add demo-router demo-subnet
	neutron router-gateway-set demo-router ext-net
			//租户网络的网关设置为外部网络

neutron文档: 

[https://wiki.openstack.org/wiki/Neutron](https://wiki.openstack.org/wiki/Neutron)

[http://docs.openstack.org/developer/neutron/](http://docs.openstack.org/developer/neutron/)

## 启动虚拟机

这里使用用户demo进行虚拟机启动。

设置demo环境变量，(可以在命令行指定，设置参数更简洁)

	export OS_USERNAME=demo
	export OS_PASSWORD=demo1
	export OS_TENANT_NAME=demo
	export OS_AUTH_URL=http://controller:35357/v2.0

生成demo用户的密钥对(通过密钥对进行免密码登录)

	ssh-keygen
	nova keypair-add --pub-key ~/.ssh/id_rsa.pub demo-key
			//将生成的公钥提交到openstack中

启动:

	nova boot --flavor m1.tiny --image cirros-0.3.2-x86_64 --nic net-id=虚拟网络的id--security-group default --key-name demo-key demo-instance1

			//可以通过nova flavor-list、nova image-list、neutron net-list、nova secgroup-list 查看可用的选项内容

启动后，可以通过nova list和 nova get-vnc-console获得虚拟机状态:

	[root@controller log]# nova list
	+--------------------------------------+----------------+--------+------------+-------------+-----------------------+
	| ID                                   | Name           | Status | Task State | Power State | Networks              |
	+--------------------------------------+----------------+--------+------------+-------------+-----------------------+
	| 9d430396-eb51-470e-9160-3e8240582ce7 | demo-instance3 | ACTIVE | -          | Running     | demo-net=192.168.7.11 |
	+--------------------------------------+----------------+--------+------------+-------------+-----------------------+
			//注意虚拟机的网络地址

	[root@controller log]# nova get-vnc-console demo-instance3 novnc
	+-------+---------------------------------------------------------------------------------+
	| Type  | Url                                                                             |
	+-------+---------------------------------------------------------------------------------+
	| novnc | http://controller:6080/vnc_auto.html?token=0eee1683-bbbd-4652-be4d-f934eb1dbab3 |
	+-------+---------------------------------------------------------------------------------+
			//获得vnc访问地址

## 遇到的问题 

### 无法启动的问题解决方法

虚拟机出现故障时, 可以通"nova show 虚拟机名"查看虚拟机状态:

	[root@controller nova]# nova show demo-instance2
	+--------------------------------------+------------------------------------------------------------------------------------------+
	| Property                             | Value                                                                                    |
	+--------------------------------------+------------------------------------------------------------------------------------------+
	| OS-DCF:diskConfig                    | MANUAL                                                                                   |
	| OS-EXT-AZ:availability_zone          | nova                                                                                     |
	| OS-EXT-STS:power_state               | 0                                                                                        |
	| OS-EXT-STS:task_state                | -                                                                                        |
	| OS-EXT-STS:vm_state                  | error                                                                                    |
	| OS-SRV-USG:launched_at               | -                                                                                        |
	| OS-SRV-USG:terminated_at             | -                                                                                        |
	| accessIPv4                           |                                                                                          |
	| accessIPv6                           |                                                                                          |
	| config_drive                         |                                                                                          |
	| created                              | 2014-08-23T12:59:31Z                                                                     |
	| fault                                | {"message": "No valid host was found. ", "code": 500, "created": "2014-08-23T12:59:32Z"} |
	| flavor                               | m1.tiny (1)                                                                              |
	| hostId                               |                                                                                          |
	| id                                   | e2f33522-8e5c-4243-9e2e-efbe28b3a520                                                     |
	| image                                | cirros-0.3.2-x86_64 (5fe8b793-ddfa-49f9-a11c-d8bd4a20e0c7)                               |
	| key_name                             | demo-key                                                                                 |
	| metadata                             | {}                                                                                       |
	| name                                 | demo-instance2                                                                           |
	| os-extended-volumes:volumes_attached | []                                                                                       |
	| status                               | ERROR                                                                                    |
	| tenant_id                            | 9caafa03ee714efd94a5e6ddf7766a9e                                                         |
	| updated                              | 2014-08-23T12:59:32Z                                                                     |
	| user_id                              | 682f75ab1bfe41aa8c0baffa109613f5                                                         |
	+--------------------------------------+------------------------------------------------------------------------------------------+

遇到问题可以到对应节点的/var/log对应的目录下查看对应的日志文件, 日志文件可以提供很多线索

#### neutron openvswitch-agent 没有启动

在controller上使用neutron agent-list查看时，可以看到openvswitch agent的状态是"XXX":

	[root@controller log]# neutron agent-list
	+--------------------------------------+--------------------+----------+-------+----------------+
	| id                                   | agent_type         | host     | alive | admin_state_up |
	+--------------------------------------+--------------------+----------+-------+----------------+
	| 099fcaac-e727-4936-ad1f-ef2737ed7aa1 | Open vSwitch agent | compute1 | xxx   | True           |
	| 7c7fe1aa-be36-4a55-84c9-5562ac9df4b8 | Metadata agent     | network  | :-)   | True           |
	| 92a16b26-76b8-433d-8159-b8e5b5b878ed | L3 agent           | network  | :-)   | True           |
	| a5bda57d-01e9-4e13-a6aa-376bd3d09333 | Open vSwitch agent | network  | xxx   | True           |
	| fd6a6389-1ca4-40aa-951d-cd6efad1fb75 | DHCP agent         | network  | :-)   | True           |
	+--------------------------------------+--------------------+----------+-------+----------------+

解决方法: 修改/usr/lib/systemd/system/neutron-openvswitch-agent.service中的启动参数

	将
	ExecStart=  (.....省略....) --config-file /etc/neutron/plugins/openvswitch/ovs_neutron_plugin.ini 
	修改为:
	ExecStart=  (.....省略....) --config-file /etc/neutron/plugin.ini 
			//就是配置文件改变, icehouse中说这是package中的bug

对于CentOS7修改的文件位于/usr/lib/systemd/system/目录下, 对于其它系统启动文件可能位于其它地方.

#### 消息队列连接不上

日志文件中提示AMQP连接失败, telnet对应端口时也失败。防火墙配置的原因，开放消息队列的端口。这里因为只是试验环境, 直接关闭了防火墙。(生产环境切勿如此)

>纠错: 不能直接关闭iptables, openstack中需要使用iptables进行报文的转发。

在controller里配置iptables:

	*filter
	:INPUT ACCEPT [0:0]
	:FORWARD ACCEPT [0:0]
	:OUTPUT ACCEPT [0:0]
	-A INPUT -m state --state RELATED,ESTABLISHED -j ACCEPT
	-A INPUT -p icmp -j ACCEPT
	-A INPUT -i lo -j ACCEPT
	-A INPUT -p tcp -m state --state NEW -m tcp --dport 22 -j ACCEPT

	-A INPUT -p tcp -m multiport --dports 3260 -m comment --comment "001 cinder incoming" -j ACCEPT
	-A INPUT -p tcp -m multiport --dports 80 -m comment --comment "001 horizon incoming" -j ACCEPT
	-A INPUT -p tcp -m multiport --dports 9292 -m comment --comment "001 glance incoming" -j ACCEPT
	-A INPUT -p tcp -m multiport --dports 5000,35357 -m comment --comment "001 keystone incoming" -j ACCEPT
	-A INPUT -p tcp -m multiport --dports 3306 -m comment --comment "001 mariadb incoming" -j ACCEPT
	-A INPUT -p tcp -m multiport --dports 6080 -m comment --comment "001 novncproxy incoming" -j ACCEPT
	-A INPUT -p tcp -m multiport --dports 8770:8780 -m comment --comment "001 novaapi incoming" -j ACCEPT
	-A INPUT -p tcp -m multiport --dports 9696 -m comment --comment "001 neutron incoming" -j ACCEPT
	-A INPUT -p tcp -m multiport --dports 5672 -m comment --comment "001 qpid incoming" -j ACCEPT
	-A INPUT -p tcp -m multiport --dports 8700 -m comment --comment "001 metadata incoming" -j ACCEPT
	-A INPUT -p gre -j ACCEPT
	-A OUTPUT -p gre -j ACCEPT

	-A INPUT -j REJECT --reject-with icmp-host-prohibited
	-A FORWARD -j REJECT --reject-with icmp-host-prohibited

	COMMIT

在network上配置iptables:

	*filter
	:INPUT ACCEPT [0:0]
	:FORWARD ACCEPT [0:0]
	:OUTPUT ACCEPT [0:0]
	-A INPUT -m state --state RELATED,ESTABLISHED -j ACCEPT
	-A INPUT -p icmp -j ACCEPT
	-A INPUT -i lo -j ACCEPT
	-A INPUT -p tcp -m state --state NEW -m tcp --dport 22 -j ACCEPT
	-A INPUT -j REJECT --reject-with icmp-host-prohibited
	-A FORWARD -j REJECT --reject-with icmp-host-prohibited
	COMMIT

在compute1上配置iptables:

	*filter
	:INPUT ACCEPT [0:0]
	:FORWARD ACCEPT [0:0]
	:OUTPUT ACCEPT [0:0]
	-A INPUT -m state --state RELATED,ESTABLISHED -j ACCEPT
	-A INPUT -p icmp -j ACCEPT
	-A INPUT -i lo -j ACCEPT
	-A INPUT -p tcp -m state --state NEW -m tcp --dport 22 -j ACCEPT

	-A INPUT -m state --state NEW -m tcp -p tcp --dport 5900:5999 -j ACCEPT
	-A INPUT -m state --state NEW -m tcp -p tcp --dport 22 -j ACCEPT
	-A INPUT -p gre -j ACCEPT 
	-A OUTPUT -p gre -j ACCEPT

	-A INPUT -j REJECT --reject-with icmp-host-prohibited
	-A FORWARD -j REJECT --reject-with icmp-host-prohibited

	COMMIT

>可以使用netstat -atun查看哪些端口需要开放。

### 没有配置virt_type

虚拟机总是启动失败时, 在compute1的/var/log/nova/nova-compute.log中找到以下日志:

	TRACE nova.compute.manager  Traceback (most recent call last):
	TRACE nova.compute.manager    File "/usr/lib/python2.7/site-packages/nova/compute/manager.py", line 1714, in _spawn
	TRACE nova.compute.manager      block_device_info)
	TRACE nova.compute.manager    File "/usr/lib/python2.7/site-packages/nova/virt/libvirt/driver.py", line 2262, in spawn
	TRACE nova.compute.manager      write_to_disk=True)
	TRACE nova.compute.manager    File "/usr/lib/python2.7/site-packages/nova/virt/libvirt/driver.py", line 3443, in to_xml
	TRACE nova.compute.manager      disk_info, rescue, block_device_info)
	TRACE nova.compute.manager    File "/usr/lib/python2.7/site-packages/nova/virt/libvirt/driver.py", line 3259, in get_guest_config
	TRACE nova.compute.manager      flavor)
	TRACE nova.compute.manager    File "/usr/lib/python2.7/site-packages/nova/virt/libvirt/vif.py", line 384, in get_config
	TRACE nova.compute.manager      _("Unexpected vif_type=%s") % vif_type)
	TRACE nova.compute.manager  NovaException: Unexpected vif_type=binding_failed
	TRACE nova.compute.manager 

如果不支持硬件加速, 需要制定virt_type。判断硬件加速的方法前面部署时已经讲明。

	openstack-config --set /etc/nova/nova.conf libvirt virt_type qemu

### vnc控制台网址打不开

在controller的nova.conf中:

	novncproxy_host=0.0.0.0
	novncproxy_port=6080
	novncproxy_base_url=http://controller:6080/vnc_auto.html

在compute1的nova.conf中:

	vnc_enabled=True
	novncproxy_base_url=http://controller:6080/vnc_auto.html
	vncserver_listen=0.0.0.0
	vncserver_proxyclient_address=controller

#### No valid host was found

如果虚拟机状态中提示No valid host was found。可能是计算节点工作已经饱和。

在我的部署环境中发现(在只有一个单核单线程的compute1), 只能运行一个虚拟机。

>推测: 可能是虚拟机化的限制，也可能是配置上的限制，原因目前不明

### 虚拟机没有ip，无法ping通网关

现象:

	cirros启动后，在"nova list"中可以看到分配的网址, 但是在虚拟机内，网卡没有ip, 手动配置ip后无法ping通网关以及dhcp服务器。

这个问题折腾很久..., 最后发现是security-group的原因。

可以看到,demo用户下总共有3个port

	[root@controller lja]# neutron port-list
	+--------------------------------------+------+-------------------+-------------------------------------------------------------------------------------+
	| id                                   | name | mac_address       | fixed_ips                                                                           |
	+--------------------------------------+------+-------------------+-------------------------------------------------------------------------------------+
	| 576c3f23-2ce3-430f-b2bd-cad8d8aa41a8 |      | fa:16:3e:55:7b:64 | {"subnet_id": "36a7442b-b946-46b4-9b0f-51f3d9a5bc3b", "ip_address": "192.168.7.14"} |
	| 98a9a751-9fa8-431b-b982-46d5fb2a21ac |      | fa:16:3e:7f:c1:50 | {"subnet_id": "36a7442b-b946-46b4-9b0f-51f3d9a5bc3b", "ip_address": "192.168.7.16"} |
	| f486da93-7a37-4e98-aed0-f55ebcf0d7f2 |      | fa:16:3e:99:4a:4e | {"subnet_id": "36a7442b-b946-46b4-9b0f-51f3d9a5bc3b", "ip_address": "192.168.7.1"}  |
	+--------------------------------------+------+-------------------+-------------------------------------------------------------------------------------+

其中192.168.7.16是"nova boot ..."启动虚拟机时创建, 是虚拟机的虚拟网卡接入的端口。在创建虚拟机时, 制定了security-group是default, 对应的port也归入default group, 如下:

	[root@controller lja]# neutron port-show 98a9a751-9fa8-431b-b982-46d5fb2a21ac
	+-----------------------+-------------------------------------------------------------------------------------+
	| Field                 | Value                                                                               |
	+-----------------------+-------------------------------------------------------------------------------------+
	| admin_state_up        | True                                                                                |
	| allowed_address_pairs |                                                                                     |
	| binding:vnic_type     | normal                                                                              |
	| device_id             | 4d19dc13-d801-41f5-9630-d4f1e3343abf                                                |
	| device_owner          | compute:None                                                                        |
	| extra_dhcp_opts       |                                                                                     |
	| fixed_ips             | {"subnet_id": "36a7442b-b946-46b4-9b0f-51f3d9a5bc3b", "ip_address": "192.168.7.16"} |
	| id                    | 98a9a751-9fa8-431b-b982-46d5fb2a21ac                                                |
	| mac_address           | fa:16:3e:7f:c1:50                                                                   |
	| name                  |                                                                                     |
	| network_id            | 72c7aee6-6d1a-4b77-afb3-3a4d1a42c606                                                |
	| security_groups       | 1d610b03-02ac-433b-83c3-6e8b4de57e86                                                |
	| status                | ACTIVE                                                                              |
	| tenant_id             | 9caafa03ee714efd94a5e6ddf7766a9e                                                    |
	+-----------------------+-------------------------------------------------------------------------------------+

但是, 192.168.7.14(dhcp服务器)和192.168.7.1(网关)，是默认创建的，不属于任何security-group，例如:

	[root@controller lja]# neutron port-show 576c3f23-2ce3-430f-b2bd-cad8d8aa41a8
	+-----------------------+-------------------------------------------------------------------------------------+
	| Field                 | Value                                                                               |
	+-----------------------+-------------------------------------------------------------------------------------+
	| admin_state_up        | True                                                                                |
	| allowed_address_pairs |                                                                                     |
	| binding:vnic_type     | normal                                                                              |
	| device_id             | dhcp7b60c1d9-602e-5110-8c89-a9475b89732c-72c7aee6-6d1a-4b77-afb3-3a4d1a42c606       |
	| device_owner          | network:dhcp                                                                        |
	| extra_dhcp_opts       |                                                                                     |
	| fixed_ips             | {"subnet_id": "36a7442b-b946-46b4-9b0f-51f3d9a5bc3b", "ip_address": "192.168.7.14"} |
	| id                    | 576c3f23-2ce3-430f-b2bd-cad8d8aa41a8                                                |
	| mac_address           | fa:16:3e:55:7b:64                                                                   |
	| name                  |                                                                                     |
	| network_id            | 72c7aee6-6d1a-4b77-afb3-3a4d1a42c606                                                |
	| security_groups       |                                                                                     |
	| status                | DOWN                                                                                |
	| tenant_id             | 9caafa03ee714efd94a5e6ddf7766a9e                                                    |
	+-----------------------+-------------------------------------------------------------------------------------+

因此需要把这两个端口，加入到default组:

	neutron port-update --security-group default 576c3f23-2ce3-430f-b2bd-cad8d8aa41a8
	neutron port-update --security-group default f486da93-7a37-4e98-aed0-f55ebcf0d7f2


	nova secgroup-add-rule default icmp -1 -1 0.0.0.0/0

下面的资料在解决这个问题过程, 起到了很大间接作用，可以帮助理解neutron到底是如何运作的, 特别是linux的桥和网络空间(ip netns):

[https://blogs.oracle.com/ronen/entry/diving_into_openstack_network_architecture](https://blogs.oracle.com/ronen/entry/diving_into_openstack_network_architecture)

[https://blogs.oracle.com/ronen/entry/diving_into_openstack_network_architecture1](https://blogs.oracle.com/ronen/entry/diving_into_openstack_network_architecture1)

[http://textuploader.com/rcv6](http://textuploader.com/rcv6)


## 小结

至此，已经完成最简单的openstack的部署, 简单到可以用简陋形容, 只包含了不可缺的组件。而生产环境需要的管理界面、分布式存储、node监控、HA等都没有涉及, 这部分以后在实战过程逐渐补充。

## 开发环境

[Openstack develop doc](http://docs.openstack.org/developer/openstack-projects.html)

[Openstack wiki](https://wiki.openstack.org/wiki/Main_Page)

[ceilometer](http://docs.openstack.org/developer/ceilometer/)

### KeyStone

KeyStone提供认证服务, 先理清KeyStone的作用, 可以方便后续的组件的梳理学习。

	yum install -y libxml2-devel libxslt-devel libffi-devel libyaml-devel
	git clone https://github.com/openstack/keystone.git
	#在virtualenv环境中运行keystone
	python ./tools/install_venv.py 
	source .venv/bin/activate

配置文件:

	[identity]
	driver = keystone.identity.backends.sql.Identity
	[database]
	connection = sqlite:///keystone.db
	idle_timeout = 200

设置:

	keystone-manage --config-dir etc/  db_sync

	#因为上面的配置, 可以发现生成了一个名为keystone.db的sqlite文件

启动:

	keystone-all

#### KeyStone的开发环境

这一节的内容尚未完成，请勿参考。Waiting...

>源码地址: [https://github.com/openstack/keystone/releases](https://github.com/openstack/keystone/releases)

从github上下载的release包,不是sdist源码分发包, 也不带有git信息, 直接使用python setup.py install安装时会抛出如下异常:

	Exception: Versioning for this project requires either an sdist tarball, or access to an upstream git repository. Are you sure that git is installed?

可以直接git clone所有源码, 然后选择版本，自己做源码分发包。

	git clone http://github.com/openstack/keystone.git
	git tag    
		//查看所有tag标签, keystone的最新的正式发布版本是grizzly-eol (2014-08-21 15:24:52)
	git checkout grizzly-eol   
		//切换grizzly-eol

	[root@controller keystone]# git branch   
		//查看当前源码位置
		* (detached from grizzly-eol)
		  master

	python ./setup.py sdist    
		//制作分发包
		//制作结束后，在dist目录得到keystone-grizzly.eol.tar.gz

解压得到的分发包keystone-grizzly.eol.tar.gz

	python ./setup.py  --help
		//安装帮助
	python ./setup.py build
		//编译
	python ./setup.py install
		//安装

安装依赖包:

	yum install python-sqlite2 python-lxml python-greenlet-devel python-ldap python-devel libxml2-devel libxslt-devel

## 文献

1. http://xxx  "Name"


