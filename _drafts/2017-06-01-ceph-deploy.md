---
layout: default
title: 使用Ceph-deploy部署Ceph集群
author: lijiaocn
createdate: 2017/06/01 13:13:26
changedate: 2017/06/02 18:05:29
categories: 项目
tags: ceph
keywords: ceph,ceph-deploy
description: ceph的部署相对复杂，如果不了解ceph的工作原理操作起来会更困难，ceph-deploy是ceph的一个集群部署工具

---

* auto-gen TOC:
{:toc}

## ceph架构简单介绍

ceph是一个比较复杂、拥有很多特性的分布式存储系统，[ceph arch][6]对ceph的原理做了很好对介绍。这里简要说明一下。

rados是ceph的基石，它是一个自治的对象存储系统，由osd和mon组成，osd是实际的存储单元，mon维护了集群的map。

mds是与osd和mon并列的一个子系统，用来存储文件系统的元数据(metadata)，只有CephFS会用到mds。mds将数据存储在内存中。

在rados也就是osd和mon的基础上，开发了librados，并在此基础上开发了对象存储网关(Ceph Object Store)和块设备(Ceph Block Device)。在rados和mds的基础上，开发了文件系统（Ceph Filesystem)。

rados的核心是CRUSH算法，也就是如何计算出object的存放位置，ceph中很多参数也都是rados相关的。

rados中可以创建多个pool，每个object存储在一个pool中的，所以当向rados中写入object时的输入是：

	pool name, object ID (name), data

client首先通过object ID计算得到一个hash value，并将hash value对PGs(Placement Group)取模后得到PG ID，然后通过pool name得到pool ID，将pool ID和PG ID拼接到一起就是object的存放地址，例如:

	4.58
	4是pool ID
	58是PG ID

还要计算出object应当存放到哪个osd，也就是将PG ID转换成一个OSD地址。PGs数量是部署Ceph系统是固定好的一个数值。

## ceph配置文件

[ceph config][7]中详细介绍了ceph的配置文件。

ceph系统的三个守护进程ceph-mon、ceph-osd、ceph-mds都会按照下列顺序寻找ceph.conf:

	$CEPH_CONF
	-c path/path 
	/etc/ceph/ceph.conf
	~/.ceph/config
	./ceph.conf 

ceph.config由下面五个部分组成:

	[global]
	
	[osd]
	
	[mon]
	
	[mds]
	
	[client]

osd、mon、mds中的配置会覆盖global中的配置。还可以通过ID设置更细的配置：

	[osd.XX]
	
	[mon.XX]
	
	[mds.XX]

## 节点

	deploy:  192.168.40.2
	master:   192.168.40.10
	slave1:   192.168.40.11
	slave2:   192.168.40.12

deploy用来部署部署ceph集群（因为后面使用ceph-deploy失败，实际deploy没有用到）

	master: 部署一个mon
	slave1: 部署一个osd
	slave1: 部署一个osd

## ceph-deploy安装

### 设置deploy节点

在deploy上安装:

	yum install -y epel-release
	yum install -y ceph-deploy

### 设置node节点

在所有的Ceph Node上安装:

	yum install -y ntp ntpdate ntp-doc
	yum install -y openssh-server

在所有的Ceph Node创建Ceph用户:

	useradd -d /home/ceph -m ceph
	passwd ceph       #这里设置密码为ceph

为Ceph用户添加sudo权限：

	echo "ceph ALL = (root) NOPASSWD:ALL" | tee /etc/sudoers.d/ceph ;chmod 0440 /etc/sudoers.d/ceph

### 在deploy设置免密码登陆

在deploy上执行：

	ssh-keygen
	ssh-copy-id ceph@master
	ssh-copy-id ceph@slave1
	ssh-copy-id ceph@slave2

在deploy的的~/.ssh/config中添加：

	Host master
	   Hostname master
	   User ceph
	Host slave1
	   Hostname slave1
	   User ceph
	Host slave2
	   Hostname slave2
	   User ceph

这时候可以直接使用主机名登陆`ssh master`。

设置hosts，使得各个ceph node可以通过hostname访问，注意访问自己的hostname的时候，不能解析到127.0.0.1。

	192.168.40.10 master
	192.168.40.11 slave1
	192.168.40.12 slave2

设置防火墙:

	ceph mons之间默认使用6789端口，osd之间默认使用6300:7300端口。

暂时关闭selinux:

	setenforce 0

安装epel:

	yum install -y epel-release

### 在deploy上开始安装(未成功)

在deploy上，创建目录用于保存安装过程中生成的文件:

	mkdir ceph-cluster
	cd ceph-cluster

指定一个节点，先创建cluster:

	ceph-deploy new master

运行结束后，可以看到生成下面的文件:

	ceph.conf  ceph.log  ceph.mon.keyring

如果只有两个OSD，需要在ceph.conf中修改为使用2备份，添加在[global]中:

	osd pool default size = 2

在ceph.conf中配置public network:

	public network = 192.168.40.10/24

安装:

	ceph-deploy install master slave1 slave2

ceph-deploy过程中有各种问题，改为手动部署。

## 手动安装

手动安装过程中不需要使用deploy节点。

### 在所有ceph节点上安装ceph

安装epel源:

	yum install -y epel-release

安装yum-plugin-priorities:

	yum install -y yum-plugin-priorities

在/etc/yum/pluginconf.d/priorities.conf中添加:

	[main]
	enabled = 1

安装key:

	rpm --import 'https://download.ceph.com/keys/release.asc'

编辑/etc/yum.repos.d/ceph.repo，注意将{ceph-release}和{distro}替换为[ceph-release][2]中的版本。

	[ceph]
	name=Ceph packages for $basearch
	baseurl=https://cn.ceph.com/rpm-{ceph-release}/{distro}/$basearch
	enabled=1
	priority=2
	gpgcheck=1
	gpgkey=https://cn.ceph.com/keys/release.asc

	[ceph-noarch]
	name=Ceph noarch packages
	baseurl=https://cn.ceph.com/rpm-{ceph-release}/{distro}/noarch
	enabled=1
	priority=2
	gpgcheck=1
	gpgkey=https://cn.ceph.com/keys/release.asc

	[ceph-source]
	name=Ceph source packages
	baseurl=https://cn.ceph.com/rpm-{ceph-release}/{distro}/SRPMS
	enabled=0
	priority=2
	gpgcheck=1
	gpgkey=https://cn.ceph.com/keys/release.asc

cn.ceph.com是ceph的中国区[镜像][3]。

如果在ceph.repo中更改了版本，需要执行一下`yum clean all`。

安装:

	yum install -y snappy leveldb gdisk python-argparse gperftools-libs
	yum install -y ceph

注意需要安装epel源，否则出现下面的错误:

	Error: Package: 1:ceph-common-11.2.0-0.el7.x86_64 (ceph)
	           Requires: libbabeltrace-ctf.so.1()(64bit)
	Error: Package: 1:librados2-11.2.0-0.el7.x86_64 (ceph)
	           Requires: liblttng-ust.so.0()(64bit)
	Error: Package: 1:librbd1-11.2.0-0.el7.x86_64 (ceph)
	           Requires: liblttng-ust.so.0()(64bit)
	Error: Package: 1:ceph-common-11.2.0-0.el7.x86_64 (ceph)
	           Requires: libbabeltrace.so.1()(64bit)
	Error: Package: 1:ceph-base-11.2.0-0.el7.x86_64 (ceph)
	           Requires: liblttng-ust.so.0()(64bit)
	 You could try using --skip-broken to work around the problem
	 You could try running: rpm -Va --nofiles --nodigest

### 配置mon

生成一个uuid作为cluster id:

	$uuidgen
	4aead7ee-d530-49f5-80b1-8f0c43f25146

编辑/etc/ceph/ceph.conf文件:

	$cat /etc/ceph/ceph.conf
	fsid = 4aead7ee-d530-49f5-80b1-8f0c43f25146
	mon initial members = master
	mon host = 192.168.40.10

执行下列操作:

	#Create a keyring for your cluster and generate a monitor secret key.
	ceph-authtool --create-keyring /tmp/ceph.mon.keyring --gen-key -n mon. --cap mon 'allow *'

	#Generate an administrator keyring, generate a client.admin user and add the user to the keyring.
	ceph-authtool --create-keyring /etc/ceph/ceph.client.admin.keyring --gen-key -n client.admin --set-uid=0 --cap mon 'allow *' --cap osd 'allow *' --cap mds 'allow'

	#Add the client.admin key to the ceph.mon.keyring.
	ceph-authtool /tmp/ceph.mon.keyring --import-keyring /etc/ceph/ceph.client.admin.keyring

	#Generate a monitor map using the hostname(s), host IP address(es) and the FSID. Save it as /tmp/monmap:
	monmaptool --create --add master 192.168.0.1 --fsid a7f64266-0894-4f1e-a635-d0aeaca0e993 /tmp/monmap

	#prepare monitor data directory
	mkdir /var/lib/ceph/mon/ceph-master
	chown -R /var/lib/ceph

	#Populate the monitor daemon(s) with the monitor map and keyring.
	sudo -u ceph ceph-mon --mkfs -i master --monmap /tmp/monmap --keyring /tmp/ceph.mon.keyring

在/etc/ceph/ceph.conf中添加其它的配置项:

	[global]
	fsid = 4aead7ee-d530-49f5-80b1-8f0c43f25146
	mon initial members = master
	mon host = 192.168.40.10
	public network = 192.168.40.0/24
	auth cluster required = cephx
	auth service required = cephx
	auth client required = cephx
	osd journal size = 1024
	osd pool default size = 2
	osd pool default min size = 1
	osd pool default pg num = 333
	osd pool default pgp num = 333
	osd crush chooseleaf type = 1

启动

	systemctl status ceph-mon@master

ceph-mon@master实质就是启动下面的进程，master作为ID传入，ceph-mon会使用目录/var/lib/ceph/mon/ceph-{ID}/:

	/usr/bin/ceph-mon -f --cluster ceph --id master --setuser ceph --setgroup ceph

这时候，可以查看:

	$ceph -s
	   cluster 4aead7ee-d530-49f5-80b1-8f0c43f25146
	    health HEALTH_ERR
	           64 pgs are stuck inactive for more than 300 seconds
	           64 pgs stuck inactive
	           64 pgs stuck unclean
	           no osds
	    monmap e2: 1 mons at {master=192.168.40.10:6789/0}
	           election epoch 6, quorum 0 master
	       mgr no daemons active
	    osdmap e1: 0 osds: 0 up, 0 in
	           flags sortbitwise,require_jewel_osds,require_kraken_osds
	     pgmap v2: 64 pgs, 1 pools, 0 bytes data, 0 objects
	           0 kB used, 0 kB / 0 kB avail
	                 64 creating

可以看到当前只有1个monitor，0个osd。

查看monitor——master的版本:

	$ceph daemon mon.master version
	{"version":"11.2.0"}

执行命令:

	ceph-create-keys --id master

执行完成后，会生成下面的文件:

	/var/lib/ceph/bootstrap-mds:
	ceph.keyring
	
	/var/lib/ceph/bootstrap-osd:
	ceph.keyring
	
	/var/lib/ceph/bootstrap-rgw:
	ceph.keyring

注意这里使用的master仅仅是hostname，并没有主从的意思。

#### 增加一个monitor

[ceph monitor][4]中对monitor做了说明，奇数个monitor和大1的偶数个monitor的能容忍的故障节点数是相同的。

	mkdir /var/lib/ceph/mon/ceph-{id}
	ceph auth get mon. -o /tmp/keyfile
	ceph mon getmap -o /tmp/mapfile
	sudo ceph-mon -i {id} --mkfs --monmap /tmp/mapfile --keyring /tmp/keyfile

在slave1上再启动一个monitor:

	mkdir /var/lib/ceph/mon/ceph-slave1
	ceph auth get mon. -o /tmp/keyring
	ceph mon getmap -o /tmp/monmap
	sudo ceph-mon -i slave1 --mkfs --monmap /tmp/monmap --keyring /tmp/keyring
	chown -R ceph:ceph /var/lib/ceph
	
	systemctl start ceph-mon@slave1

启动之后，会自动加入:

	$ceph -s
	    cluster 4aead7ee-d530-49f5-80b1-8f0c43f25146
	     health HEALTH_OK
	     monmap e3: 2 mons at {master=192.168.40.10:6789/0,slave1=192.168.40.11:6789/0}
	            election epoch 6, quorum 0,1 master,slave1
	        mgr active: master
	     osdmap e23: 3 osds: 2 up, 2 in
	            flags sortbitwise,require_jewel_osds,require_kraken_osds
	      pgmap v29: 64 pgs, 1 pools, 0 bytes data, 0 objects
	            68860 kB used, 14246 MB / 14313 MB avail
	                  64 active+clean

#### 从健康的集群中移除monitor

停掉对应的monitor服务后:

	ceph mon remove {mon-id}

然后去掉ceph.conf中相关的配置。

#### 从不健康的集群中移除monitor

如果集群是unhealth，譬如monitor之间无法形成有效的选举。

首先停掉所有的monitor，然后到一台确定正常的monitor上操作：

	#导出monmap
	ceph-mon -i {mon-id} --extract-monmap {map-path}

	#将异常的mon从monmap中删除，mon-id是异常的mon的id
	monmaptool {map-path} --rm {mon-id}

	#将修改后的monmap重新注入
	ceph-mon -i {mon-id} --inject-monmap {map-path}

	#启动正常的monitors


### 添加osd

将monitor中的文件:

	/etc/ceph/ceph.conf
	/var/lib/ceph/bootstrap-osd/ceph.keystring

复制到slave1和slave2的同名目录下。如果缺失，在对OSD进行activate操作时会报错。

在slave1上运行:

	ceph-disk prepare --cluster ceph --cluster-uuid 4aead7ee-d530-49f5-80b1-8f0c43f25146 --fs-type xfs /dev/sdb

这里使用xfs，如果使用其它格式例如ext4，启动时可能报错：ERROR: osd init failed: (36) File name too long

这里直接使用的是/dev/sdb，/dev/sdb会被分区自动格式化，并设置为active。

	$ceph-disk list
	/dev/dm-0 other, ext4, mounted on /
	/dev/dm-1 swap, swap
	/dev/sda :
	 /dev/sda1 other, 0x83
	 /dev/sda2 other, ext4, mounted on /boot
	 /dev/sda3 other, LVM2_member
	/dev/sdb :
	 /dev/sdb1 ceph data, active, cluster ceph, osd.1, journal /dev/sdb2
	 /dev/sdb2 ceph journal, for /dev/sdb1
	/dev/sr0 other, unknown

通过df命令，可以看到/dev/sdb1已经被挂载：

	/dev/sdb1                         7092708     32340   6677036   1% /var/lib/ceph/osd/ceph-1

ceph-1中的1就是OSD的在ceph中分配到的ID号。

如果要卸载OSD:

	umount /dev/sdb1
	ceph-disk deactivate /dev/sdb1  #这时候可以通过ceph-disk activate /dev/sdb1重新启用
	ceph-disk destroy /dev/sdb1     #从ceph中删除osd

启动：

	systemctl start ceph-osd@1

在slave2上进行同样的操作。

因为前面在ceph.conf中配置的是双备份，所以有两个OSD之后，ceph才会进入health状态:

	$ceph -s
	  cluster 4aead7ee-d530-49f5-80b1-8f0c43f25146
	   health HEALTH_OK
	   monmap e2: 1 mons at {master=192.168.40.10:6789/0}
	          election epoch 5, quorum 0 master
	      mgr active: master
	   osdmap e23: 3 osds: 2 up, 2 in
	          flags sortbitwise,require_jewel_osds,require_kraken_osds
	    pgmap v29: 64 pgs, 1 pools, 0 bytes data, 0 objects
	          68860 kB used, 14246 MB / 14313 MB avail
	                64 active+clean

	$ceph osd tree
	ID WEIGHT  TYPE NAME       UP/DOWN REWEIGHT PRIMARY-AFFINITY
	-1 0.01358 root default
	-2 0.00679     host slave1
	 1 0.00679         osd.1        up  1.00000          1.00000
	-3 0.00679     host slave2
	 2 0.00679         osd.2        up  1.00000          1.00000
	 0       0 osd.0              down        0          1.00000

### 配置mds

将下面的{cluster-name}替换成集群的名字ceph, {id}替换成hostname。

	sudo -u ceph mkdir -p /var/lib/ceph/mds/{cluster-name}-{id} 
	ceph-authtool --create-keyring /var/lib/ceph/mds/{cluster-name}-{id}/keyring --gen-key -n mds.{id}
	ceph auth add mds.{id} osd "allow rwx" mds "allow" mon "allow profile mds" -i /var/lib/ceph/mds/{cluster}-{id}/keyring

并且在/etc/ceph/ceph.conf中添加:

	[mds.{id}]
	host = {id}

如果在master上:

	sudo -u ceph mkdir -p /var/lib/ceph/mds/ceph-master 
	ceph-authtool --create-keyring /var/lib/ceph/mds/ceph-master/keyring --gen-key -n mds.master
	ceph auth add mds.master osd "allow rwx" mds "allow" mon "allow profile mds" -i /var/lib/ceph/mds/ceph-master/keyring

在/etc/ceph/ceph.conf中添加：

	[mds.master]
	host = master

然后启动：

	systemctl start ceph-mds@master

## 参考

1. [ceph-deploy][1]
2. [ceph-release][2]
3. [ceph-mirror][3]
4. [ceph monitor][4]
5. [ceph osd][5]
6. [ceph arch][6] 
7. [ceph config][7]

[1]: http://docs.ceph.com/docs/master/start/  "ceph-deploy" 
[2]: http://docs.ceph.com/docs/master/releases/ "ceph-release"
[3]: http://docs.ceph.com/docs/master/install/mirrors/ "ceph-mirror"
[4]: http://docs.ceph.com/docs/master/rados/operations/add-or-rm-mons/ "ceph monitor"
[5]: http://docs.ceph.com/docs/master/rados/operations/add-or-rm-osds/ "ceph osd"
[6]: http://docs.ceph.com/docs/master/architecture/ "ceph arch"
[7]: http://docs.ceph.com/docs/master/rados/configuration/ "ceph config"
