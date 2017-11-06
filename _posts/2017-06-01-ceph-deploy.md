---
layout: default
title: ceph集群的部署
author: lijiaocn
createdate: 2017/06/01 13:13:26
changedate: 2017/11/06 15:28:18
categories: 技巧
tags: ceph
keywords: ceph,ceph-deploy
description: ceph的部署相对复杂，如果不了解ceph的工作原理操作起来会更困难，ceph-deploy是ceph的一个集群部署工具

---

* auto-gen TOC:
{:toc}

## 概况

ceph是一个比较复杂、拥有很多特性的分布式存储系统，[ceph arch][6]对ceph的原理做了很好对介绍。这里简要说明一下。

rados是ceph的基石，它是一个自治的对象存储系统，由osd和mon组成，osd是实际的存储单元，mon维护了集群的map。

mds是与osd、mon并列的组件，只有使用ceph filesystem时，才需要mds，用来存储文件系统的元数据(metadata)。

librados是rados的sdk，Ceph的块设备(Ceph Block Device)和支持S3、Swift接口的对象存储网关(Ceph Object Gateway)都是通过librados从rados中存取数据。

从rados中读取或者写入object的时候，object的位置是通过Cluster map和CRUSH算法计算出来的。

在rados中，object是存放在pool中的，每个pool都会配置size(备份数目)和PGs(PlaceGroup的数目)。

一个pool中包括多个PG，每个PG的ID是如果pool被设置成备份N份，那么CRUSH会为这个pool分配N个OSD(取决于具体的策略），这N个OSD是这个PG的`Acting Set`。

PG包含的第一个OSD是`Primary OSD`，其它的OSD依次称为`Second OSD`、`Third OSD`。

Primary OSD主动与属于同一个PG的OSD进行同步，OSD状态都正常时，这个PG状态被标记为`active+clean`，这时候这个PG可以被写入数据。

当一个OSD故障后，CRUSH为受到影响的PGs再分配一个OSD，OSD之间自发地进行数据同步。

用来处理Client的请求的OSDs是这个PG的`Up Set`，通常与`Acting Set`是相同的。

操作object时:

	一个object包括：pool name, object ID (name), data
	
	1. client首先从mon中获取一份最新的cluster map，然后通过object ID计算得到一个hash value。
	2. 将hash value对object所属的pool的PGs(Placement Group的数目)取模，得到PG。
	3. 通过pool name得到pool ID，将pool ID和PG ID拼接起来得到PG ID，就是PG在集群中的唯一ID，例如:
	       4.58    //4是pool ID，58是PG ID
	4. 得到PG ID对应的OSDs。
	5. Client直接访问OSD，读取或写入Object的data。

每个OSD会检查其它多个OSD的状态，并将状态上报到MON，MONs之间通过Paxos协议，维护一份一致的ClusterMap，ClusterMap由五部分组成：

	1. The Monitor Map，集群中MONs的状态
	2. The OSD Map，集群中OSDs的状态
	3. The PG Map，集群中PG的状态
	4. The CRUSH Map，集群中存储设备的状态和层级结构，以及层级便利的规则
	5. The MDS Map，集群中MDSs的状态

Active状态:

	Once Ceph completes the peering process, a placement group may become active.
	The active state means that the data in the placement group is generally available 
	in the primary placement group and the replicas for read and write operations.

Clean状态:

	When a placement group is in the clean state, the primary OSD and the replica OSDs
	have successfully peered and there are no stray replicas for the placement group. 
	Ceph replicated all objects in the placement group the correct number of times.

Degraded状态:

	When a client writes an object to the primary OSD, the primary OSD is responsible 
	for writing the replicas to the replica OSDs. After the primary OSD writes the 
	object to storage, the placement group will remain in a degraded state until the 
	primary OSD has received an acknowledgement from the replica OSDs that Ceph created 
	the replica objects successfully.

Recovering状态:

	When the OSD is back up, the contents of the placement groups must be updated to 
	reflect the current state. During that time period, the OSD may reflect a recovering state.

Back Filling状态:

	When a new OSD joins the cluster, CRUSH will reassign placement groups from OSDs 
	in the cluster to the newly added OSD. Forcing the new OSD to accept the reassigned 
	placement groups immediately can put excessive load on the new OSD. Back filling 
	the OSD with the placement groups allows this process to begin in the background. 

Remapped状态:

	When the Acting Set that services a placement group changes, the data migrates 
	from the old acting set to the new acting set. It may take some time for a new 
	primary OSD to service requests. So it may ask the old primary to continue to 
	service requests until the placement group migration is complete.

Stale状态:

	If the Primary OSD of a placement group’s acting set fails to report to the 
	monitor or if other OSDs have reported the primary OSD down, the monitors will 
	mark the placement group stale.

## 配置

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

每一个osd.XX、mon.XX或者mds.XX对应一个进程。

可以在配置文件中直接使用变量:

	$cluster:  Expands to the Ceph Storage Cluster name.
	$type:     Expands to one of mds, osd, or mon, depending on the type of the instant daemon.
	$id:       Expands to the daemon identifier. For osd.0, this would be 0; for mds.a, it would be a.
	$host:     Expands to the host name of the instant daemon.
	$name:     Expands to $type.$id.
	$pid:      Expands to daemon pid.

### mon的配置

[monitor config][8]:

	The primary role of the Ceph Monitor is to maintain a master copy of the cluster map. 
	Ceph Monitors also provide authentication and logging services.

任何一个client（包括osd和mds)只要从mon中获取到最新的cluster map，就可以通过CRUSH算法计算出每个object的存放位置。

ceph-osd、ceph-mds以及ceph client都是通过ceph.conf中的配置找到至少一个ceph-mon，而ceph-mon之间则是用monmap发现彼此。

也正式因为如此，部署第一个ceph-mon时需要通过手动创建monmap文件，后续的的ceph-mon只需要将其添加到monmap即可。[mon-bootstrap][9]

配置项在ceph.conf中的分布：

	[global]
	#全局配置
	mon osd full ratio = .80
	mon osd backfillfull ratio = .75
	mon osd nearfull ratio = .70
	
	[mon]
	#配置所有的mon，example:
	mon host = hostname1,hostname2,hostname3
	mon addr = 10.0.0.10:6789,10.0.0.11:6789,10.0.0.12:6789
	#集群中必须包含的mon, This may reduce the time it takes for your cluster to come online.
	mon initial members = a,b,c
	
	[mon.a]
	#配置mon.a，example:
	host = hostname1
	mon addr = 10.0.0.10:6789
	
	[mon.b]
	#配置mon.b
	
	[mon.c]
	#配置mon.c

也可以用dns srv域名标记mon，[mon-lookup-dns][10]。

	mon force quorum join
	Description:  Force monitor to join quorum even if it has been previously removed from the map
	Type:         Boolean
	Default:      False
	
	mon initial members
	Description:    The IDs of initial monitors in a cluster during startup. If specified, Ceph requires an odd number of monitors to form an initial quorum (e.g., 3).
	Type:           String
	Default:        None

mon数据的默认存放在`/var/lib/ceph/mon/$cluster-$id`，可以修改：

	mon data
	Description:   The monitor’s data location.
	Type:          String
	Default:       /var/lib/ceph/mon/$cluster-$id
	
	mon data size warn
	Description:   Issue a HEALTH_WARN in cluster log when the monitor’s data store goes over 15GB.
	Type:          Integer
	Default:       15*1024*1024*1024*
	...

如果ceph的存储空间完全用尽了，可靠性会降低，需要在ceph.conf中配置最大的使用率：

	mon osd full ratio
	Description:   The percentage of disk space used before an OSD is considered full.
	Type:          Float
	Default:       .95
	
	mon osd backfillfull ratio
	Description:   The percentage of disk space used before an OSD is considered too full to backfill.
	Type:          Float
	Default:       .90
	
	mon osd nearfull ratio
	Description:   The percentage of disk space used before an OSD is considered nearfull.
	Type:          Float
	Default:       .85

更多配置项可以在[monitor config][8]中查看。

### cephx config

[cephx config][11]

When cephx is enabled, Ceph will look for the keyring in the default search path, which includes /etc/ceph/$cluster.$name.keyring. You can override this location by adding a keyring option in the [global] section of your Ceph configuration file, but this is not recommended.

key分为monitor key、daemon key、client key。

monitor key是mon用来签署认证相关内容的key:

	ceph-authtool --create-keyring /tmp/ceph.mon.keyring --gen-key -n mon. --cap mon 'allow *'

daemon key是每个组件使用的key，默认是`/var/lib/ceph/XX/keysting`

client key是client访问集群时使用的key:

	ceph-authtool --create-keyring /etc/ceph/ceph.client.admin.keyring --gen-key -n client.admin --set-uid=0 --cap mon 'allow *' --cap osd 'allow *' --cap mds 'allow'
	ceph-authtool /tmp/ceph.mon.keyring --import-keyring /etc/ceph/ceph.client.admin.keyring

### OSDs config

[osd config][12]

### pool、pg

[pool-pg-config][13]，可以设置每个pool的size(object的备份数)和pg numbers，如果不设置则使用ceph.conf中的默认值。

	[golbal]
	osd pool default size = 4  # Write an object 4 times.
	osd pool default min size = 1 # Allow writing one copy in a degraded state.
	osd pool default pg num = 250
	osd pool default pgp num = 250

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

#### 配置yum源 

安装epel源:

	yum install -y epel-release

安装yum-plugin-priorities:

	yum install -y yum-plugin-priorities

在/etc/yum/pluginconf.d/priorities.conf中添加:

	[main]
	enabled = 1

安装key:

	rpm --import 'https://download.ceph.com/keys/release.asc'

编辑/etc/yum.repos.d/ceph.repo，注意将{ceph-release}和{distro}替换为[ceph-release][2]中的版本，确保[cn.ceph.com][3]中有对应的目录。

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

#### 安装

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

初始化monmap：

	//创建用户`mon.`的keystring
	ceph-authtool --create-keyring /tmp/ceph.mon.keyring --gen-key -n mon. --cap mon 'allow *'
	
	//创建用户`ceph.client.admin`的keystring
	ceph-authtool --create-keyring /etc/ceph/ceph.client.admin.keyring --gen-key -n client.admin --set-uid=0 --cap mon 'allow *' --cap osd 'allow *' --cap mds 'allow'

	//将ceph.client.admin的key导入到mon的keystring中
	ceph-authtool /tmp/ceph.mon.keyring --import-keyring /etc/ceph/ceph.client.admin.keyring

	//生成monmap，将第一个mon加入到monmap
	monmaptool --create --add master 192.168.0.1 --fsid a7f64266-0894-4f1e-a635-d0aeaca0e993 /tmp/monmap

	//准备mon的data目录
	mkdir /var/lib/ceph/mon/ceph-master
	chown -R /var/lib/ceph

	//初始化mon的data
	ceph-mon --mkfs -i master --monmap /tmp/monmap --keyring /tmp/ceph.mon.keyring

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

启动:

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

查看mon.master的版本:

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

这里使用xfs，如果使用其它格式例如ext4，启动时可能报错：

	ERROR: osd init failed: (36) File name too long

这里直接使用的是/dev/sdb，/dev/sdb会被分区自动格式化，并设置为active。

	$ ceph-disk list
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

如果没有挂载，手动激活:

	$ ceph-disk activate /dev/sdb

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

OSD的数据默认存放在`/var/lib/ceph/osd/${cluster}-{id}`:

	activate.monmap  active  ceph_fsid  current  fsid  journal  journal_uuid  
	keyring  magic  ready  store_version  superblock  systemd  type  whoami

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

## 使用

ceph storage cluster、ceph filesystem、ceph block device、ceph object gateway、ceph manager daemon。

### ceph storage cluster (rados)

[ceph-storage-cluster][14]

#### 启动/停止

启动node上所有ceph相关服务：

	systemctl start ceph.target   

查看ceph状态:

	systemctl status ceph\*.service ceph\*.target

启动所有daemon:

	sudo systemctl start ceph-osd.target
	sudo systemctl start ceph-mon.target
	sudo systemctl start ceph-mds.target

启动具体的daemon:

	systemctl start ceph-osd@{id}
	systemctl start ceph-mon@{hostname}
	systemctl start ceph-mds@{hostname}

#### 查看状态

在任意node上直接键入`ceph`就可以进入交互界面：

	$ceph
	ceph> ？
	no valid command found; 10 closest matches:
	osd crush rule create-erasure <name> {<profile>}
	osd crush rule rm <name>
	osd crush show-tunables
	osd crush rule create-simple <name> <root> <type> {firstn|indep}
	osd crush set-tunable straw_calc_version <int>
	osd crush get-tunable straw_calc_version
	osd crush reweight-subtree <name> <float[0.0-]>
	osd crush tunables legacy|argonaut|bobtail|firefly|hammer|jewel|optimal|default
	osd crush reweight-all
	osd crush reweight <name> <float[0.0-]>
	Invalid command
	ceph> 

#### ceph health

在交付ceph cluster之前，确认集群是健康的：

	ceph> health
	HEALTH_WARN clock skew detected on mon.slave1; Monitor clock skew detected
	
	ceph> health detail
	HEALTH_WARN clock skew detected on mon.slave1; Monitor clock skew detected
	mon.slave1 addr 192.168.40.11:6789/0 clock skew 0.159472s > max 0.05s (latency 0.00194991s)

在node上配置[ntpd同步系统时间]({% post_url 2017-06-05-linux-tool-ntpd %})

如果时间同步精度难以达到，可以增加ceph的容忍度，在ceph.conf中:

	mon clock drift allowed = 0.2   #可以容忍0.2秒的时间抖动

#### ceph -w (观测集群事件)

	$ceph -w
	cluster 4aead7ee-d530-49f5-80b1-8f0c43f25146
	 health HEALTH_WARN
	        clock skew detected on mon.slave1
	        Monitor clock skew detected
	 monmap e3: 2 mons at {master=192.168.40.10:6789/0,slave1=192.168.40.11:6789/0}
	        election epoch 16, quorum 0,1 master,slave1
	    mgr active: master
	 osdmap e44: 3 osds: 2 up, 2 in
	        flags sortbitwise,require_jewel_osds,require_kraken_osds
	  pgmap v102: 64 pgs, 1 pools, 0 bytes data, 0 objects
	        69996 kB used, 14245 MB / 14313 MB avail
	              64 active+clean
	
	2017-06-05 07:50:59.435515 mon.0 [WRN] mon.1 192.168.40.11:6789/0 clock skew 0.250598s > max 0.2s

#### ceph df (查看存储容量)

	ceph> df
	GLOBAL:
	    SIZE       AVAIL      RAW USED     %RAW USED
	    14313M     14245M       69996k          0.48
	POOLS:
	    NAME     ID     USED     %USED     MAX AVAIL     OBJECTS
	    rbd      0         0         0         7122M           0

#### ceph status

	ceph> status
	    cluster 4aead7ee-d530-49f5-80b1-8f0c43f25146
	     health HEALTH_OK
	     monmap e3: 2 mons at {master=192.168.40.10:6789/0,slave1=192.168.40.11:6789/0}
	            election epoch 16, quorum 0,1 master,slave1
	        mgr active: master
	     osdmap e44: 3 osds: 2 up, 2 in
	            flags sortbitwise,require_jewel_osds,require_kraken_osds
	      pgmap v102: 64 pgs, 1 pools, 0 bytes data, 0 objects
	            69996 kB used, 14245 MB / 14313 MB avail
	                  64 active+clean

#### ceph osd stat/tree/dump

	ceph> osd stat
	     osdmap e44: 3 osds: 2 up, 2 in
	            flags sortbitwise,require_jewel_osds,require_kraken_osds
	
	ceph> osd tree
	ID WEIGHT  TYPE NAME       UP/DOWN REWEIGHT PRIMARY-AFFINITY
	-1 0.01358 root default
	-2 0.00679     host slave1
	 1 0.00679         osd.1        up  1.00000          1.00000
	-3 0.00679     host slave2
	 2 0.00679         osd.2        up  1.00000          1.00000
	 0       0 osd.0              down        0          1.00000
	
	ceph> osd dump
	epoch 44
	fsid 4aead7ee-d530-49f5-80b1-8f0c43f25146
	created 2017-06-02 02:48:32.656097
	modified 2017-06-05 07:44:33.548342
	flags sortbitwise,require_jewel_osds,require_kraken_osds
	pool 0 'rbd' replicated size 2 min_size 1 crush_ruleset 0 object_hash rjenkins pg_num 64 pgp_num 64 last_change 1 flags hashpspool stripe_width 0
	max_osd 3
	osd.0 down out weight 0 up_from 0 up_thru 0 down_at 0 last_clean_interval [0,0) - - - - exists,new efa6c6b3-69b0-4be3-a065-d9bced4ddd68
	osd.1 up   in  weight 1 up_from 35 up_thru 41 down_at 33 last_clean_interval [17,32) 192.168.40.11:6800/2609 192.168.40.11:6802/2609 192.168.40.11:6803/2609 192.168.40.11:6804/2609 exists,up eaa6ce60-2be7-49f2-a386-07f8683b3b64
	osd.2 up   in  weight 1 up_from 41 up_thru 41 down_at 38 last_clean_interval [29,37) 192.168.40.12:6800/6107 192.168.40.12:6801/6107 192.168.40.12:6802/6107 192.168.40.12:6803/6107 exists,up 7cfa3b17-5a4d-4759-9507-2c6448b6f04dV

#### ceph mon stat/dump

	ceph> mon stat
	e3: 2 mons at {master=192.168.40.10:6789/0,slave1=192.168.40.11:6789/0}, election epoch 16, quorum 0,1 master,slave1
	
	ceph> mon dump
	epoch 3
	fsid 4aead7ee-d530-49f5-80b1-8f0c43f25146
	last_changed 2017-06-02 08:13:15.477087
	created 2017-06-01 08:35:04.271086
	0: 192.168.40.10:6789/0 mon.master
	1: 192.168.40.11:6789/0 mon.slave1
	
	Status:
	 dumped monmap epoch 3
	
	ceph> quorum_status
	{"election_epoch":16,"quorum":[0,1],"quorum_names":["master","slave1"],"quorum_leader_name":"master","monmap":{"epoch":3,"fsid":"4aead7ee-d530-49f5-80b1-8f0c43f25146","modified":"2017-06-02 08:13:15.477087","created":"2017-06-01 08:35:04.271086","features":{"persistent":["kraken"],"optional":[]},"mons":[{"rank":0,"name":"master","addr":"192.168.40.10:6789\/0","public_addr":"192.168.40.10:6789\/0"},{"rank":1,"name":"slave1","addr":"192.168.40.11:6789\/0","public_addr":"192.168.40.11:6789\/0"}]}}

#### ceph mds stat

	ceph> mds stat
	e7:, 2 up:standby

#### ceph fs dump

	ceph> fs dump

#### ceph daemon

通过ceph daeon可以直接与`本地的daemon`通信，对指定的daemon进行操作。

	ceph daemon {daemon-name}
	或者
	ceph daemon {path-to-socket-file}

例如:

	ceph daemon osd.0 help
	ceph daemon /var/run/ceph/ceph-osd.0.asok help

通过ceph daemon，可以修改daemon的运行时参数，[ceph runtime config][19]。

#### ceph pg stat/dump/map/dump_stuck

`pg stat`查看pg的状态:

	ceph> pg stat
	v102: 64 pgs: 64 active+clean; 0 bytes data, 69996 kB used, 14245 MB / 14313 MB avail

64个pgs，64个位于active+clean状态。

`pg dump`会列出所有的PG。

	ceph> pg dump
	version 102
	stamp 2017-06-05 07:44:40.419080
	last_osdmap_epoch 44
	last_pg_scan 44
	full_ratio 0.95
	nearfull_ratio 0.85
	...

PG ID格式为： `{pool ID}.{PG ID in this pool}`，例如:

	0.1f

可以以json格式导出：

	ceph pg dump -o {filename} --format=json

`ceph pg  {PG ID} query`查询指定的PG:

	ceph pg 0.39 query

`pg map`查看指定PG的状态:

	ceph>pg map 0.39
	osdmap e44 pg 0.39 (0.39) -> up [2,1] acting [2,1]

`ceph pg dump_stuck`可以查看状态异常的PG:

	ceph pg dump_stuck [unclean|inactive|stale|undersized|degraded]

[pg states][29]中介绍了pg的状态含义:

	active:        pg可用
	clean:         数据同步完成
	degraded:      数据同步尚为完成，或者备份数不足
	recovering:    osd重新上线，数据同步中
	back filling:  新增的osd正在同步要承担的数据
	remapped:      正在选取新的Acting Set
	stale:         monitor没有收到primary osd的状态信息


#### user manage

##### 命名格式

用户名格式:

	{TYPE}.{ID}
	例如：  client.admin，client.user1，mds.master
	
	A Ceph Storage Cluster user is not the same as a Ceph Object Storage user or a Ceph Filesystem user.
	The Ceph Object Gateway uses a Ceph Storage Cluster user to communicate between the gateway daemon 
	and the storage cluster, but the gateway has its own user management functionality for end users. 
	The Ceph Filesystem uses POSIX semantics. The user space associated with the Ceph Filesystem is not 
	the same as a Ceph Storage Cluster user.

可以为用户分别设置对不同的daemon的权限:

	{daemon-type} 'allow {capability}'
	例如:
	mon 'allow rwx'
	mon 'allow profile osd'

daemon-type类型有: mon、mds、osd，[ceph user management][20]中列出了所有的权限选项。

访问ceph集群的时候，需要提交用户的key来完成身份认证，用户的key保存在本地的keystring中，ceph client会自动解读keystring文件。

keystring文件格式如下，可以包含多个用户的key：

	[client.admin]
	    key = AQBW0S9ZkAD+IBAAxriXLrP0MJ/Can8cr4D2CQ==
	    auid = 0
	    caps mds = "allow"
	    caps mon = "allow *"
	    caps osd = "allow *"

ceph client默认用户是client.admin，会按照下面的顺序寻找当前用户的keyring:

	/etc/ceph/$cluster.$name.keyring           //只包含名为name的用户的key
	/etc/ceph/$cluster.keyring
	/etc/ceph/keyring
	/etc/ceph/keyring.bin

也可以直接指定用户和keystring，例如：

	ceph -n client.admin --keyring=/etc/ceph/ceph.client.admin.keyring health

可以将一个keyring中的用户导入到另一个keyring:

	ceph-authtool /etc/ceph/ceph.keyring --import-keyring /etc/ceph/ceph.client.admin.keyring

##### 查看用户

查看所有用户:

	ceph> auth list
	mds.master
	    key: AQARFTFZR343BBAAEtNaherQSFvv2fbd1j3C0Q==
	    caps: [mds] allow
	    caps: [mon] allow profile mds
	    caps: [osd] allow rwx
	mds.slave1
	    key: AQD1ETFZELn9FRAAnpiui796EK7xtTYXJV3Yng==
	    caps: [mds] allow
	    caps: [mon] allow profile mds
	    caps: [osd] allow rwx
	osd.0
	    key: AQCn1zBZK/eKNxAA7UkgISF8/XJvqtSQpVOkGg==
	    caps: [mon] allow profile osd
	    caps: [osd] allow *
	...

查看一个用户:

	ceph> auth get client.admin
	[client.admin]
	    key = AQBW0S9ZkAD+IBAAxriXLrP0MJ/Can8cr4D2CQ==
	    auid = 0
	    caps mds = "allow"
	    caps mon = "allow *"
	    caps osd = "allow *"
	
	Status:
	 exported keyring for client.admin

##### 创建用户

直接创建用户，自动生成key:

	ceph auth add client.kube mon 'allow r' osd 'allow rw pool=kube'
	ceph auth get-or-create client.kube mon 'allow r' osd 'allow rw pool=kube'

除了直接创建用户，也可以通过`ceph auth import`将keystring中的用户导入。

	ceph auth import -i /tmp/keyring

如果用户已经存在，覆盖同名用户的原先配置。

##### keystring的管理

ceph-authtool用来管理keystring。

首先需要通过ceph auth获取已有用户的keystring:

	ceph auth get client.kube -o /tmp/keystring

或者直接创建一个keystring（这一步只是创建了keystring，不会创建user）:

	ceph-authtool --create-keyring /tmp/keyring --gen-key -n client.test --cap mon 'allow *' --cap osd 'allow *' --cap mds 'allow'

可以通过ceph-authool直接修改keystring中的内容:

	ceph-authtool -n client.test --cap osd 'allow rwx' --cap mon 'allow rwx' /tmp/keyring

将keystring中的用户导入系统，如果已经存在，覆盖同名用户的原先配置:

	ceph auth import -i /tmp/keyring

##### 删除用户

	ceph auth del {TYPE}.{ID}

##### 修改用户

打印用户key:

	ceph auth print-key {TYPE}.{ID}

修改用户权限:

	ceph auth caps USERTYPE.USERID {daemon} 'allow [r|w|x|*|...] [pool={pool-name}] [namespace={namespace-name}]' 

也可以通过修改keystring，然后重新导入的方式修改:

	ceph-authtool /etc/ceph/ceph.keyring -n client.ringo --cap osd 'allow rwx' --cap mon 'allow rwx'
	ceph auth import -i /etc/ceph/ceph.keyring

#### pools

[ceph pools operations][21]

#### 查看

	ceph osd lspools

##### 创建

	ceph osd pool create {pool-name} {pg-num} [{pgp-num}] [replicated] \
	     [crush-ruleset-name] [expected-num-objects]
	ceph osd pool create {pool-name} {pg-num}  {pgp-num}   erasure \
	     [erasure-code-profile] [crush-ruleset-name] [expected_num_objects]

可以选择`replicated`模式、`erasure`模式。

创建pool的时候需要指定`pg-num`和`pgp-num`，这两个数值需要特别注意，它们会影响到增添osd时的数据迁移数量。

[Ceph Placement Groups][31]中介绍了pg与osd的关系，简单概括就是pool中的obj映射到pg，pg再映射到osd。

![Ceph pool pg osd](http://docs.ceph.com/docs/master/_images/ditaa-1fde157d24b63e3b465d96eb6afea22078c85a90.png)

Ceph文档中，推荐pg_num下面的设置:

	Less than 5 OSDs set pg_num to 128
	Between 5 and 10 OSDs set pg_num to 512
	Between 10 and 50 OSDs set pg_num to 1024
	If you have more than 50 OSDs, you need to understand the tradeoffs and how to calculate the pg_num value by yourself
	For calculating pg_num value by yourself please take help of pgcalc tool

[Ceph pooll pgp][30]中介绍了pgp，简单概括就是pgp_num需要与pg_num相等，只有更新了pgp_num之后，才会开始数据重新分布。

引用一段来自《Learning Ceph》中关于PGP的介绍：

	PGP is Placement Group for Placement purpose, which should be kept equal to the total 
	number of placement groups (pg_num). For a Ceph pool, if you increase the number of 
	placement groups, that is, pg_num, you should also increase pgp_num to the same integer
	value as pg_num so that the cluster can start rebalancing. The undercover rebalancing 
	mechanism can be understood in the following way.The pg_num value defines the number of 
	placement groups, which are mapped to OSDs. When pg_num is increased for any pool, every 
	PG of this pool splits into half, but they all remain mapped to their parent OSD. Until 
	this time, Ceph does not start rebalancing. Now, when you increase the pgp_num value for 
	the same pool, PGs start to migrate from the parent to some other OSD, and cluster 
	rebalancing starts. In this way, PGP plays an important role in cluster rebalancing.

##### 设置

设置quota:

	ceph osd pool set-quota {pool-name} [max_objects {obj-count}] [max_bytes {bytes}]

删除:

	ceph osd pool delete {pool-name} [{pool-name} --yes-i-really-really-mean-it]

重命名:

	ceph osd pool rename {current-pool-name} {new-pool-name}

查看状态：

	rados df

做快照：

	ceph osd pool mksnap {pool-name} {snap-name}

删除快照:

	ceph osd pool rmsnap {pool-name} {snap-name}

配置:

	ceph osd pool set {pool-name} {key} {value}
	ceph osd pool get {pool-name} {key} {value}

[ceph pools][21]中列出pool的所有配置项.

#### erasure code

[erasure-code][22]

#### Cache Tiering (二级存储)

[cache tiering][23]是速度较快的存储用来做cache，客户端感知不到cache tiering的存在。

	#关联设置
	ceph osd tier add {storagepool} {cachepool}
	
	#设置cache模式，可以是writeback、read-proxy
	ceph osd tier cache-mode {cachepool} {cache-mode}
	
	#direct all client traffic from the storage pool to the cache pool
	ceph osd tier set-overlay {storagepool} {cachepool}

[cache tiering][23]中列出了cache tiering的所有配置项。

#### Placement Groups



#### crush map

[crush paper][24]中提出了CRUSH算法。

CRUSH maps contain:

	a list of OSDs
	a list of ‘buckets’ for aggregating the devices into physical locations
	a list of rules that tell CRUSH how it should replicate data in a Ceph cluster’s pools

OSD的位置在ceph中称为`crush location`，格式如下:

	root=default row=a rack=a2 chassis=a2a host=a2a1
	
	1. the order of the keys does not matter.
	2. The key name (left of =) must be a valid CRUSH type. By default these include:
	     root, datacenter, room, row, pod, pdu, rack, chassis and host
	   those types can be customized to be anything appropriate by modifying the CRUSH map.
	3. Not all keys need to be specified. For example, by default, Ceph automatically sets a ceph-osd 
	   daemon’s location to be root=default host=HOSTNAME (based on the output from hostname -s).

OSD的crush location是从ceph.conf中读取的：

	crush location = 

如果ceph.conf中没有配置，那么地址就是：

	root=default host=HOSTNAME

读取crush map:

	ceph osd getcrushmap -o /tmp/crush

解析成文本格式:

	crushtool -d  /tmp/crush  -o /tmp/crush.txt

重新压缩为二进制格式：

	crushtool -c {decompiled-crush-map-filename} -o {compiled-crush-map-filename}

设置crushmap:

	ceph osd setcrushmap -i  {compiled-crushmap-filename}

[crush map][25]中列出了crush-map的所有配置。

### ceph block device

Ceph的块设备Ceph’s RADOS Block Devices简称RBD，Client通过内核模块或者librdb与OSD交互。

Ceph block devices are [thin-provisioned][], resizable and store data striped over multiple OSDs in a Ceph cluster.

	rbd create --size {megabytes} {pool-name}/{image-name}
	
	$rbd create --size 100 rbd/blk1
	
	$rbd ls rbd
	blk1

	$rbd info rbd/blk1
	rbd image 'blk1':
	size 102400 kB in 25 objects
	order 22 (4096 kB objects)
	block_name_prefix: rbd_data.85fa2ae8944a
	format: 2
	features: layering, exclusive-lock, object-map, fast-diff, deep-flatten
	flags:

将block device映射到本地:

	$rbd map rbd/blk1 --id admin
	/dev/rbd0

如果提示：

	RBD image feature set mismatch. You can disable features unsupported by the kernel with "rbd feature disable".

可以关闭相关的特性:

	$rbd feature disable rbd/blk1 exclusive-lock object-map fast-diff deep-flatten

可以通过showmapped看到映射情况：

	$rbd showmapped
	id pool image snap device
	0  rbd  blk1  -    /dev/rbd0

映射完成后，就可以将/dev/rbd0当作一个块设备进行操作，譬如：

	mkfs.ext4 /dev/rbd0
	mount /mnt /dev/rbd0

取消映射:

	rbd unmap /dev/rbd/rbd/blk1

用df命令也可以看到rbd0：

	/dev/rbd0                         93M  1.6M   85M   2% /mnt

Ceph Block Device images are thin provisioned. They don’t actually use any physical storage 
until you begin saving data to them. However, they do have a maximum capacity that you set 
with the --size option. 

	rbd resize --size 2048 foo (to increase)
	rbd resize --size 2048 foo --allow-shrink (to decrease)

删除：

	rbd rm {image-name}

[ceph-block-device][15]中列出rbd相关的更多操作。

#### rbd扩容

可以在rbd被挂载的情况下进行扩容操作，操作之前先备份数据。

	# rbd showmapped
	id pool image snap device   
	0  rbd  foo   -    /dev/rbd0

将大小设置为20G，--size指定数值单位是MB。

	# rbd resize --size 20480 foo

对于ext4文件系统：

	# blockdev --getsize64 /dev/rbd0
	# resize2fs /dev/rbd0

对于xfs文件系统，/mnt是挂载点：

	xfs_growfs /mnt

这时候用df查看，可以看到磁盘空间大小已经为20G。

### ceph filesystem

[ceph-filesystem][16]

### ceph object gateway

[ceph-object-gateway][17]

### ceph manger deamon

[ceph-manger-daemon][18]

## 参考

1. [ceph-deploy][1]
2. [ceph-release][2]
3. [ceph-mirror][3]
4. [ceph monitor][4]
5. [ceph osd][5]
6. [ceph arch][6] 
7. [ceph config][7]
8. [monitor config][8]
9. [mon-bootstrap][9]
10. [mon-lookup-dns][10]
11. [cephx config][11]
12. [osd config][12]
13. [pool-pg-config][13]
14. [ceph-storage-cluster][14]
15. [ceph-block-device][15]
16. [ceph-filesystem][16]
17. [ceph-object-gateway][17]
18. [ceph-manger-daemon][18]
19. [ceph runtime config][19]
20. [ceph user management][20]
21. [ceph pool][21]
22. [erasure-code][22]
23. [cache-tiering][23]
24. [crush paper][24]
25. [cruhs-map][25]
26. [thin provisioning][26]
27. [RADOS: A Scalable, Reliable Storage Service for Petabyte-scale Storage Clusters][27]
28. [CRUSH: Controlled, Scalable, Decentralized Placement of Replicated Data][28]
29. [pg states][29]
30. [Ceph PG与PGP的关系][30]
31. [Ceph Placement Groups][31]

[1]: http://docs.ceph.com/docs/master/start/  "ceph-deploy" 
[2]: http://docs.ceph.com/docs/master/releases/ "ceph-release"
[3]: http://docs.ceph.com/docs/master/install/mirrors/ "ceph-mirror"
[4]: http://docs.ceph.com/docs/master/rados/operations/add-or-rm-mons/ "ceph monitor"
[5]: http://docs.ceph.com/docs/master/rados/operations/add-or-rm-osds/ "ceph osd"
[6]: http://docs.ceph.com/docs/master/architecture/ "ceph arch"
[7]: http://docs.ceph.com/docs/master/rados/configuration/ "ceph config"
[8]: http://docs.ceph.com/docs/master/rados/configuration/mon-config-ref/ "monitor config"
[9]: http://docs.ceph.com/docs/master/dev/mon-bootstrap/ "mon-bootstrap"
[10]: http://docs.ceph.com/docs/master/rados/configuration/mon-lookup-dns/ "mon-lookup-dns"
[11]: http://docs.ceph.com/docs/master/rados/configuration/auth-config-ref/ "cephx config"
[12]: http://docs.ceph.com/docs/master/rados/configuration/osd-config-ref/ "osd config"
[13]: http://docs.ceph.com/docs/master/rados/configuration/pool-pg-config-ref/ "pool-pg-config"
[14]: http://docs.ceph.com/docs/master/rados/ "ceph-storage-cluster"
[15]: http://docs.ceph.com/docs/master/rbd/rbd/ "ceph-block-device"
[16]: http://docs.ceph.com/docs/master/cephfs/ "ceph-filesystem"
[17]: http://docs.ceph.com/docs/master/radosgw/ "ceph-object-gateway"
[18]: http://docs.ceph.com/docs/master/mgr/ "ceph-manager-daemon"
[19]: http://docs.ceph.com/docs/master/rados/configuration/ceph-conf/#ceph-runtime-config "ceph rumtime config"
[20]: http://docs.ceph.com/docs/master/rados/operations/user-management/  "ceph user management"
[21]: http://docs.ceph.com/docs/master/rados/operations/pools/ "ceph pool"
[22]: http://docs.ceph.com/docs/master/rados/operations/erasure-code/ "erasure-code"
[23]: http://docs.ceph.com/docs/master/rados/operations/cache-tiering/ "cache-tiering"
[24]: http://ceph.com/papers/weil-crush-sc06.pdf "crush paper"
[25]: http://docs.ceph.com/docs/master/rados/operations/crush-map/ "crush-map"
[26]: https://en.wikipedia.org/wiki/Thin_provisioning "thin provisioning"
[27]: https://ceph.com/wp-content/uploads/2016/08/weil-rados-pdsw07.pdf "RADOS: A Scalable, Reliable Storage Service for Petabyte-scale Storage Clusters"
[28]: https://ceph.com/wp-content/uploads/2016/08/weil-crush-sc06.pdf "CRUSH: Controlled, Scalable, Decentralized Placement of Replicated Data"
[29]: http://docs.ceph.com/docs/master/rados/operations/monitoring-osd-pg/?highlight=active#monitoring-placement-group-states  "pg states"
[30]: http://www.99cloud.net/html/2016/jiuzhouyuanchuang_0929/233.html  "Ceph PG与PGP的关系"
[31]: http://docs.ceph.com/docs/master/rados/operations/placement-groups/  "Ceph Placement Groups"
