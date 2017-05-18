---
layout: default
title: Docker的基础使用
author: lijiaocn
createdate: 2017/03/29 11:11:53
changedate: 2017/05/17 10:27:15
categories: 项目
tags: docker
keywords: docker,使用手册,docker的使用手册
description: docker的使用手册，配置docker deamon运行参数等。

---

* auto-gen TOC:
{:toc}

## 摘要

## 资料

[Source](https://github.com/docker/docker)  源代码

[Master Binaries](https://master.dockerproject.com/)  可以下载编译好的docker

[Report Issues](https://github.com/docker/docker/issues) 问题汇报

[Report Security Issues](mail:security@docker.com)  安全问题汇报

[Pull Request](https://github.com/docker/docker/pulls?q=is%3Aopen+is%3Apr) 发起建议

[Dev Maillist](https://groups.google.com/forum/?fromgroups#!forum/docker-dev) 邮件组

>在贡献编码之前，先在邮件组中讨论开发计划。

Issues处理流程:

	创建Issues ->       如果是Proposal              -> 把docker的master fork到自己的github
	            开发之前到邮件组中进行设计讨论          创建名为XXXX-something的分支
	                                                    (XXXX是对应issues的编号)
	                                                                |
	                                                                v 
	在docker的项目中发布一个pull request(PR)            将改动push到自己的XXXX-something分支上
	1 只有发布了PR之后,其他成员才会留意到你的修改   <-  1 如果创建或修改特性，更新相关文档
	   并对你的代码进行审核                             2 commit之前，gofmt格式化代码       
	2 当你向你自己的分支进行push操作后, 需要到PR中      3 commit message必须有不多于50字符的简要说明       
	   进行留言，通知其他成员                           4 commit是sign your work: git commit -s       
	                                                    5 需要提交unit test代码       
	                                                    6 push前先做rebase                                 

## docker基础镜像的制作

[create baseimages](https://docs.docker.com/articles/baseimages/)

docker基础镜像制作的过程实质就是在一个新的目录中，安装基本的系统。然后将这个目录打包，使用docker import导入到docker中。

	#!/usr/bin/env bash
	#
	# Create a base CentOS Docker image.
	#
	# This script is useful on systems with yum installed (e.g., building
	# a CentOS image on CentOS).  See contrib/mkimage-rinse.sh for a way
	# to build CentOS images on other systems.

	usage() {
		cat <<EOOPTS
	$(basename $0) [OPTIONS] <name>
	OPTIONS:
	  -y <yumconf>  The path to the yum config to install packages from. The
					default is /etc/yum.conf.
	EOOPTS
		exit 1
	}

	# option defaults
	yum_config=/etc/yum.conf
	while getopts ":y:h" opt; do
		case $opt in
			y)
				yum_config=$OPTARG
				;;
			h)
				usage
				;;
			\?)
				echo "Invalid option: -$OPTARG"
				usage
				;;
		esac
	done
	shift $((OPTIND - 1))
	name=$1

	if [[ -z $name ]]; then
		usage
	fi

	#--------------------

	target=$(mktemp -d --tmpdir $(basename $0).XXXXXX)

	set -x

	# 创建系统的必须的设备文件
	mkdir -m 755 "$target"/dev 
	mknod -m 600 "$target"/dev/console c 5 1
	mknod -m 600 "$target"/dev/initctl p
	mknod -m 666 "$target"/dev/full c 1 7
	mknod -m 666 "$target"/dev/null c 1 3
	mknod -m 666 "$target"/dev/ptmx c 5 2
	mknod -m 666 "$target"/dev/random c 1 8
	mknod -m 666 "$target"/dev/tty c 5 0
	mknod -m 666 "$target"/dev/tty0 c 4 0
	mknod -m 666 "$target"/dev/urandom c 1 9
	mknod -m 666 "$target"/dev/zero c 1 5

	# 安装root文件系统
	yum -c "$yum_config" --installroot="$target" --releasever=/ --setopt=tsflags=nodocs \
		--setopt=group_package_types=mandatory -y groupinstall Core
	yum -c "$yum_config" --installroot="$target" -y clean all

	# 网络配置
	cat > "$target"/etc/sysconfig/network <<EOF
	NETWORKING=yes
	HOSTNAME=localhost.localdomain
	EOF

	# 删除不必要的文件
	# effectively: febootstrap-minimize --keep-zoneinfo --keep-rpmdb
	# --keep-services "$target".  Stolen from mkimage-rinse.sh
	#  locales
	rm -rf "$target"/usr/{lib,share}/locale,{lib,lib64}/gconv,bin/localedef,sbin/build-locale-archive}
	#  docs
	rm -rf "$target"/usr/share/{man,doc,info,gnome/help}
	#  cracklib
	rm -rf "$target"/usr/share/cracklib
	#  i18n
	rm -rf "$target"/usr/share/i18n
	#  sln
	rm -rf "$target"/sbin/sln
	#  ldconfig
	rm -rf "$target"/etc/ld.so.cache
	rm -rf "$target"/var/cache/ldconfig/*

	version=
	if [ -r "$target"/etc/redhat-release ]; then
		version="$(sed 's/^[^0-9\]*\([0-9.]\+\).*$/\1/' "$target"/etc/redhat-release)"
	fi

	if [ -z "$version" ]; then
		echo >&2 "warning: cannot autodetect OS version, using '$name' as tag"
		version=$name
	fi

	# 打包成镜像， 镜像名是$name, tag是$version
	tar --numeric-owner -c -C "$target" . | docker import - $name:$version

	# 运行新建立的镜像
	docker run -i -t $name:$version echo success

	rm -rf "$target"

## 在基础镜像上制作新镜像

docker自身的编译环境也是运行在docker容器中的, 这里以docker编译环境的dockerfile为例。

	# This file describes the standard way to build Docker, using docker
	#
	# Usage:
	#
	# # Assemble the full dev environment. This is slow the first time.
	# docker build -t docker .
	#
	# # Mount your source in an interactive container for quick testing:
	# docker run -v `pwd`:/go/src/github.com/docker/docker --privileged -i -t docker bash
	#
	# # Run the test suite:
	# docker run --privileged docker hack/make.sh test
	#
	# # Publish a release:
	# docker run --privileged \
	#  -e AWS_S3_BUCKET=baz \
	#  -e AWS_ACCESS_KEY=foo \
	#  -e AWS_SECRET_KEY=bar \
	#  -e GPG_PASSPHRASE=gloubiboulga \
	#  docker hack/release.sh
	#
	# Note: Apparmor used to mess with privileged mode, but this is no longer
	# the case. Therefore, you don't have to disable it anymore.
	#
	
	# 指定基础镜像
	FROM ubuntu:14.04
	# 新镜像的作者
	MAINTAINER Tianon Gravi <admwiggin@gmail.com> (@tianon)
	
	# 在新的镜像中进行操作
	# Packaged dependencies
	RUN apt-get update && apt-get install -y \
		apparmor \
		aufs-tools \
		automake \
		btrfs-tools \
		build-essential \
		curl \
		dpkg-sig \
		git \
		iptables \
		libapparmor-dev \
		libcap-dev \
		libsqlite3-dev \
		mercurial \
		parallel \
		python-mock \
		python-pip \
		python-websocket \
		reprepro \
		ruby1.9.1 \
		ruby1.9.1-dev \
		s3cmd=1.1.0* \
		--no-install-recommends
	
	# Get lvm2 source for compiling statically
	RUN git clone -b v2_02_103 https://git.fedorahosted.org/git/lvm2.git /usr/local/lvm2
	# see https://git.fedorahosted.org/cgit/lvm2.git/refs/tags for release tags
	
	# Compile and install lvm2
	RUN cd /usr/local/lvm2 \
		&& ./configure --enable-static_link \
		&& make device-mapper \
		&& make install_device-mapper
	# see https://git.fedorahosted.org/cgit/lvm2.git/tree/INSTALL
	
	# Install lxc
	ENV LXC_VERSION 1.0.7
	RUN mkdir -p /usr/src/lxc \
		&& curl -sSL https://linuxcontainers.org/downloads/lxc/lxc-${LXC_VERSION}.tar.gz | tar -v -C /usr/src/lxc/ -xz --strip-components=1
	RUN cd /usr/src/lxc \
		&& ./configure \
		&& make \
		&& make install \
		&& ldconfig
	
	# Install Go
	ENV GO_VERSION 1.4.1
	RUN curl -sSL https://golang.org/dl/go${GO_VERSION}.src.tar.gz | tar -v -C /usr/local -xz \
		&& mkdir -p /go/bin
	ENV PATH /go/bin:/usr/local/go/bin:$PATH
	ENV GOPATH /go:/go/src/github.com/docker/docker/vendor
	RUN cd /usr/local/go/src && ./make.bash --no-clean 2>&1
	
	# Compile Go for cross compilation
	ENV DOCKER_CROSSPLATFORMS \
		linux/386 linux/arm \
		darwin/amd64 darwin/386 \
		freebsd/amd64 freebsd/386 freebsd/arm
	
	# TODO when https://jenkins.dockerproject.com/job/Windows/ is green, add windows back to the list above
	#	windows/amd64 windows/386
	
	# (set an explicit GOARM of 5 for maximum compatibility)
	ENV GOARM 5
	RUN cd /usr/local/go/src \
		&& set -x \
		&& for platform in $DOCKER_CROSSPLATFORMS; do \
			GOOS=${platform%/*} \
			GOARCH=${platform##*/} \
				./make.bash --no-clean 2>&1; \
		done
	
	# We still support compiling with older Go, so need to grab older "gofmt"
	ENV GOFMT_VERSION 1.3.3
	RUN curl -sSL https://storage.googleapis.com/golang/go${GOFMT_VERSION}.$(go env GOOS)-$(go env GOARCH).tar.gz | tar -C /go/bin -xz --strip-components=2 go/bin/gofmt
	
	# Grab Go's cover tool for dead-simple code coverage testing
	RUN go get golang.org/x/tools/cmd/cover
	
	# TODO replace FPM with some very minimal debhelper stuff
	RUN gem install --no-rdoc --no-ri fpm --version 1.3.2
	
	# Get the "busybox" image source so we can build locally instead of pulling
	RUN git clone -b buildroot-2014.02 https://github.com/jpetazzo/docker-busybox.git /docker-busybox
	
	# Get the "cirros" image source so we can import it instead of fetching it during tests
	RUN curl -sSL -o /cirros.tar.gz https://github.com/ewindisch/docker-cirros/raw/1cded459668e8b9dbf4ef976c94c05add9bbd8e9/cirros-0.3.0-x86_64-lxc.tar.gz
	
	# Install registry
	ENV REGISTRY_COMMIT c448e0416925a9876d5576e412703c9b8b865e19
	RUN set -x \
		&& git clone https://github.com/docker/distribution.git /go/src/github.com/docker/distribution \
		&& (cd /go/src/github.com/docker/distribution && git checkout -q $REGISTRY_COMMIT) \
		&& GOPATH=/go/src/github.com/docker/distribution/Godeps/_workspace:/go \
			go build -o /go/bin/registry-v2 github.com/docker/distribution/cmd/registry
	
	# Get the "docker-py" source so we can run their integration tests
	ENV DOCKER_PY_COMMIT aa19d7b6609c6676e8258f6b900dea2eda1dbe95
	RUN git clone https://github.com/docker/docker-py.git /docker-py \
		&& cd /docker-py \
		&& git checkout -q $DOCKER_PY_COMMIT
	
	# Setup s3cmd config
	RUN { \
			echo '[default]'; \
			echo 'access_key=$AWS_ACCESS_KEY'; \
			echo 'secret_key=$AWS_SECRET_KEY'; \
		} > ~/.s3cfg
	
	# Set user.email so crosbymichael's in-container merge commits go smoothly
	RUN git config --global user.email 'docker-dummy@example.com'
	
	# Add an unprivileged user to be used for tests which need it
	RUN groupadd -r docker
	RUN useradd --create-home --gid docker unprivilegeduser
	
	VOLUME /var/lib/docker
	WORKDIR /go/src/github.com/docker/docker
	ENV DOCKER_BUILDTAGS apparmor selinux btrfs_noversion
	
	# Install man page generator
	COPY vendor /go/src/github.com/docker/docker/vendor
	# (copy vendor/ because go-md2man needs golang.org/x/net)
	RUN set -x \
		&& git clone -b v1 https://github.com/cpuguy83/go-md2man.git /go/src/github.com/cpuguy83/go-md2man \
		&& git clone -b v1.2 https://github.com/russross/blackfriday.git /go/src/github.com/russross/blackfriday \
		&& go install -v github.com/cpuguy83/go-md2man
	
	# Wrap all commands in the "docker-in-docker" script to allow nested containers
	ENTRYPOINT ["hack/dind"]
	
	# Upload docker source
	COPY . /go/src/github.com/docker/docker

## 镜像管理

### 查看本地所有的镜像

	[root@localhost ~]# docker images
	REPOSITORY      TAG         IMAGE ID    CREATED     VIRTUAL SIZE
	centos      7.0.1406    3afe3dc5ae15    17 minutes ago  250.1 MB
	<none>      <none>      9d6b25448c7c    3 hours ago     442.9 MB
	ubuntu      14.04       53bf7a53e890    2 days ago      199.8 MB
	ubuntu      latest      53bf7a53e890    2 days ago      199.8 MB

### 搜索镜像

	docker search

docker搜索其它registry中的镜像:

	docker search 192.168.1.104:5000/redis
	docker search 192.168.1.104:5000/*

### 下载镜像

	docker pull

### 提交镜像

在其它镜像的基础上制作镜像时，可以使用docker commit将容器提交为镜像:

	[root@localhost ~]# docker commit
	Usage: docker commit [OPTIONS] CONTAINER [REPOSITORY[:TAG]]
	Create a new image from a container's changes
	  -a, --author=""     Author (e.g., "John Hannibal Smith <hannibal@a-team.com>")
	  -m, --message=""    Commit message
	  -p, --pause=true    Pause container during commit

也可以通过Dockerfile的形式，使用docker build直接建立一个镜像

[Dockerfile指令](https://docs.docker.com/reference/builder)

### 设置镜像Tag

docker tag为容器设置tag

	$docker tag 5db5f8471261 ouruser/sinatra:devel

### 发布镜像

将image发布出去

	docker push 

### 导入导出

save/load

	docker save IMAGE -o xxx.tar    //将基本镜像一同导出
	docker load -i xxx.tar          //导入

### 镜像的本地存放

Where is images? 对于虚拟机来说, 虚拟机文件就在那里, 当时docker的image文件还真不好找...

查看了下/var/lib/docker下各个文件的大小:

	[root@localhost docker]# ls
	containers  devicemapper  execdriver  graph  init  linkgraph.db  repositories-devicemapper  tmp  volumes
	[root@localhost docker]# pwd 
	/var/lib/docker
	[root@localhost docker]# du -sh *
	144K    containers
	1.2G    devicemapper
	0       execdriver
	100K    graph
	13M     init
	8.0K    linkgraph.db
	4.0K    repositories-devicemapper
	0       tmp
	0       volumes

只能是在devicemapper中了

	[root@localhost devicemapper]# du -sh *
	1.2G    devicemapper
	96K     metadata
	4.0K    mnt
	[root@localhost devicemapper]# cd devicemapper/
	[root@localhost devicemapper]# ls -lh
	total 1.2G
	-rw-------. 1 root root 100G Sep 26 01:03 data
	-rw-------. 1 root root 2.0G Sep 26 01:24 metadata

从数据大小估计, 最原始的数据应当是存放/var/lib/docker/devicemapper/devicemapper中,docker自行管理数据的索引等.

这个数值和images的大小基本也是匹配的,如下:

	[root@localhost devicemapper]# docker images
	[info] GET /v1.14/images/json
	[fd4d53bd] +job images()
	[fd4d53bd] -job images() = OK (0)
	REPOSITORY          TAG                 IMAGE ID            CREATED             VIRTUAL SIZE
	centos              7.0.1406            3afe3dc5ae15        About an hour ago   250.1 MB
	<none>              <none>              9d6b25448c7c        5 hours ago         442.9 MB
	ubuntu              14.04               53bf7a53e890        2 days ago          199.8 MB
	ubuntu              latest              53bf7a53e890        2 days ago          199.8 MB

## 镜像使用

### 运行交互程序

	[root@localhost ~]# docker run -t -i  ubuntu:14.04  /bin/bash
	[info] POST /v1.14/containers/create
	root@89119a96cd58:/# 
	root@89119a96cd58:/# ip addr
	1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default 
		link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
		inet 127.0.0.1/8 scope host lo
		   valid_lft forever preferred_lft forever
		inet6 ::1/128 scope host 
		   valid_lft forever preferred_lft forever
	17: eth0: <BROADCAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
		link/ether 7e:a4:47:17:42:e4 brd ff:ff:ff:ff:ff:ff
		inet 172.17.0.8/16 scope global eth0
		   valid_lft forever preferred_lft forever
		inet6 fe80::7ca4:47ff:fe17:42e4/64 scope link 
		   valid_lft forever preferred_lft forever
	root@89119a96cd58:/# 

>注意: -t表示创建tty, -i表示交互运行, 可以在docker help run中查看选项。

### 后台运行

	[root@localhost ~]# docker run -d ubuntu:14.04 /bin/bash -c "while true;do echo hello world; sleep 1;done"
	2eecc150eda7af8226b29856468a5428e59664977663779f591cae59c1a217b5

>-d表示放入后台运行, 最下面显示字符串新建的docker的唯一id 

### 查看运行中的镜像

	[root@localhost ~]# docker ps
	CONTAINER ID    IMAGE           COMMAND                CREATED         STATUS         PORTS    NAMES
	2eecc150eda7    ubuntu:14.04    "/bin/bash -c 'while   2 minutes ago   Up 2 minutes            stupefied_carson    

>第一栏的ID数值是容器ID的简短形式, 最后一栏的NAMES是docker自动为容器的命的名。可以通过这个名字和这个容器进行交互

### 查看运行中的镜像的输出

可以通过docker logs查看后台运行的容器的输出, 目标容器可以通过id指定, 也可以通过Name指定:

	[root@localhost ~]# docker ps
	CONTAINER ID        IMAGE               COMMAND                CREATED             STATUS              PORTS               NAMES
	2eecc150eda7        ubuntu:14.04        "/bin/bash -c 'while   5 minutes ago       Up 5 minutes                            stupefied_carson    
	[root@localhost ~]# docker logs 2eecc150eda7  
	hello world
	hello world
	hello world

### 查看镜像中运行的进程

可以通过docker top 查看容器内运行的进程

	[root@jdo-test-210-111 ~]# docker top 675722d0ec53
	UID     PID     PPID    C STIME   TTY     TIME    CMD
	root    14221   14603   0 11:46   pts/4   00:00:00/bin/sh -c mkdir -p /dev/shm/nginx_temp/ && /etc/init.d/crond restart && /usr/sbin/sshd -D
	root    14248   14221   0 11:46   ? 00:00:00crond
	root    14250   14221   0 11:46   pts/4   00:00:00/usr/sbin/sshd -D

### 查看镜像详情 

可以通过docker insepect 查看容器的信息

	[root@localhost ~]# docker inspect ubuntu:14.04
	[{
		"Architecture": "amd64",
		"Author": "",
		"Comment": "",
		"Config": {
			"AttachStderr": false,
			"AttachStdin": false,
		...

###　停止镜像 

docker stop停止镜像的运行

	[root@localhost ~]# docker ps
	CONTAINER ID IMAGE         COMMAND                CREATED             STATUS              PORTS               NAMES
	2eecc150eda7 ubuntu:14.04  "/bin/bash -c 'while   7 minutes ago       Up 7 minutes                            stupefied_carson    
	[root@localhost ~]# docker stop stupefied_carson 
	[root@localhost ~]# docker ps
	CONTAINER ID     IMAGE         COMMAND             CREATED             STATUS              PORTS               NAMES
	[root@localhost ~]# 

发现将在后台运行的镜像STOP之后, 镜像依然是存在的, 可以通过docker ps -a查看所有的镜像。

	[root@localhost ~]# docker ps -a
	CONTAINER ID    IMAGE         COMMAND        CREATED       STATUS             PORTS         NAMES
	89119a96cd58    ubuntu:14.04    "/bin/bash"  About an hour ago   Exited (1) About an hour ago             agitated_mestorf  
	e7ebdbdd0cf0    ubuntu:14.04    "bash"       About an hour ago   Exited (0) About an hour ago             mad_sinoussi    
	68c792c83338    ubuntu:14.04    "echo hello" About an hour ago   Exited (0) About an hour ago             drunk_brown     

>从docker ps -a中可以看到, 每次docker run都是在创建一个新的镜像,  所以要搞清楚是要创建镜像还是启动镜像。

### 启动镜像

docker start启动镜像

### 查看活动的的镜像

docker attach附加到运行的镜像的1号进程(PID:1), 可以查看pid为1的进程的输出. 

如果该进程为交互式的, 也可以看到进程的所有交互过程，也可以直接与进程进行交互。

TODO: 文档上说是痛过ctrl-q ctrl-p可以detach, 并且镜像继续运行。通过ctrl-c, detach的同时关停镜像。

	但是没操作成功 ！

### 删除镜像

docker rm删除镜像:

	docker rm 2eecc150eda7  

### 端口映射 

在run的-P/-p的选项, 这个选项将镜像的端口映射到宿主机的端口, 这样就可以从外部使用镜像内的服务。

通过docker ps -l可以看到端口映射情况

	$ sudo docker ps -l
	CONTAINER ID  IMAGE                   COMMAND       CREATED        STATUS        PORTS                    NAMES
	bc533791f3f5  training/webapp:latest  python app.py 5 seconds ago  Up 2 seconds  0.0.0.0:49155->5000/tcp  nostalgic_morse

## 配置docker daemon运行参数

### 方式1，在服务配置文件中配置

如果是CentOS，可以在"/etc/sysconfig/docker"中添加启动参数：

	OPTIONS='--selinux-enabled --log-driver=journald --signature-verification=false"

这里配置的参数，将会作为docker daemon的启动参数，通过"ps |grep docker"可以看到：

	/usr/bin/dockerd-current --add-runtime docker-runc=/usr/libexec/docker/docker-runc-current --default-runtime=docker-runc --exec-opt native.cgroupdriver=systemd --userland-proxy-path=/usr/libexec/docker/docker-proxy-current --selinux-enabled --log-driver=journald --signature-verification=false --registry-mirror=https://pee6w651.mirror.aliyunc

### 方式2，在/etc/docker/daemon.json中配置

docker启动的时候会自动加载/etc/docker/deamon.json，读取其中的配置。通过这种方式配置的参数在"ps |grep docker"中看不到：

	$cat /etc/docker/daemon.json
	{
	    "live-restore": true,
	    "insecure-registries": ["docker-registry.i.bbtfax.com:5000"]
	}

注意同一个参数只能使用一种方式配置，如果既在配置文件中配置了，也在daemon.json中配置了，docker daemon将会启动失败。
## 其它

### boot2docker

一个boot2docker的发行版, 专门运行docker镜像的linux, 比较有意思, 以后闲暇时可以研究下。

### docker搜索其它registry中的镜像

默认搜索docker.io中的镜像，现在要搜索192.168.1.104中镜像:

	docker search 192.168.1.104:5000/redis
	docker search 192.168.1.104:5000/*

## docker的开发环境镜像

[官方手册](https://docs.docker.com/contributing/devenvironment/)

docker的开发环境也是一个docker，在docker源码的根目录下，有一个Dockerfile, 在make build时候会根据这个Dockerfile创建一个开发环境的image.

通过下面的操作, 将开发环境的镜像导出:

	1. 先安装一个docker, 并且启动docker server.
		$ wget https://get.docker.io/builds/Linux/x86_64/docker-latest -O docker
		$ chmod +x docker
		$ sudo ./docker -d &
	2. 下载一份docker的源码：
		$ git clone https://git@github.com/docker/docker
		$ cd docker
	3. make build    
		查看Makefile可以发现, 首先运行make build时使用docker build创建了一个image, 
		这个image就是docker的编译环境
			build: bundles
				docker build -t "$(DOCKER_IMAGE)" .

	   成功之后，会在docker images中看到一个名为 dockerXXX的镜像, 可以将其save到一个文件中,如下:
			docker save -o ubuntu_14.04.tar.gz ubuntu:14.04     //save
			docker load -i ubuntu_14.04.tar.gz                  //load

也可以根据Dockerfile中的描述，自行配置docker的开发环境。

源码的顶层目录结构如下, 其中docker目录是代码的入口:

	[root@localhost docker.git]# pwd
	/root/docker.git
	[root@localhost docker.git]# ls
	api           contrib          docs         integration-cli  opts       vendor
	archive       CONTRIBUTING.md  engine       LICENSE          pkg        VERSION
	AUTHORS       daemon           events       links            README.md  volumes
	builder       docker           graph        MAINTAINERS      reexec
	builtins      Dockerfile       hack         Makefile         registry
	bundles       dockerinit       image        nat              runconfig
	CHANGELOG.md  dockerversion    integration  NOTICE           utils


## API

Docker Server是一个后台进程(docker -d), 提供了一个类似rest的API

[api](http://docs.docker.com/reference/api/docker_remote_api_v1.16/)

## 源码剖析

### 编译过程

假设docker的编译镜像是docker:master:

	docker run docker:master hack/make.sh  [all|binary]

hack/make.sh的执行路径:

	/go/src/github.com/docker/docker   
	# make.sh中对路径进行了检查, 必须在该路径下执行
	# 这个路径中存放是docker的源码
	# Dockerfile通过WORKDIR设置了当前路径， 

hack/make.sh可以指定多个编译目标，"hack/make.sh binary"为例:

	1. 在/go/src/github.com/docker/docker中建立一个bundles目录，生成的目标文件将被放到这个目录中。
	2. hack/mash.sh中完成了一些准备工作，目标文件产生是由hack/make/目录下的同名的脚本完成的。

hack/make/binary:

	#!/bin/bash
	set -e
	 
	DEST=$1
	BINARY_NAME="docker-$VERSION"
	BINARY_EXTENSION="$(binary_extension)"
	BINARY_FULLNAME="$BINARY_NAME$BINARY_EXTENSION"
	 
	# Cygdrive paths don't play well with go build -o.
	if [[ "$(uname -s)" == CYGWIN* ]]; then
	   DEST=$(cygpath -mw $DEST)
	fi
	 
	# 这里是真正的编译命令,编译了docker源码的一级目录docker中的go文件, 这里也是docker代码的入口。
	go build \
	   -o "$DEST/$BINARY_FULLNAME" \
	   "${BUILDFLAGS[@]}" \
	   -ldflags "
	      $LDFLAGS
	      $LDFLAGS_STATIC_DOCKER
	   " \
	   ./docker
	echo "Created binary: $DEST/$BINARY_FULLNAME"
	ln -sf "$BINARY_FULLNAME" "$DEST/docker$BINARY_EXTENSION"
	hash_files "$DEST/$BINARY_FULLNAME"

hack/make.sh总共有以下目标:

	# List of bundles to create when no argument is passed
	DEFAULT_BUNDLES=(
	   validate-dco
	   validate-gofmt
	 
	   binary
	 
	   test-unit
	   test-integration-cli
	   test-docker-py
	 
	   dynbinary
	   test-integration
	 
	   cover
	   cross
	   tgz
	   ubuntu
	)

### 依赖的组件

[cgroup](http://blog.dotcloud.com/kernel-secrets-from-the-paas-garage-part-24-c)
[namespacing](http://blog.dotcloud.com/under-the-hood-linux-kernels-on-dotcloud-part)
[Go](http://golang.org)

介绍资料:  [Paas under the hood](http://www.dotcloud.com/ebook.html)

### 入口

虽然docker最终形态只是一个名为docker的可执行文件。这个文件中实际包含client和daemon两个部分。

	client部分是操作、管理工具, 用于向daemon发送指令, 接收daemon的回应。
	daemon是后台服务, 负责容器、image的管理等, 这才是docker的主要部分。

docker没有将这两部分拆成两个程序, 而是将他们合并在一个程序中。

docker程序的入口在docker.git/docker目录中:

  client.go        //docker client的入口
  daemon.go        //docker daemon的入口
  docker.go        //client与daemon的合并

daemon初始化:

	docker/daemon.go -- func mainDaemon(){...}


## 搭建Docker registry

[docker distribution](https://github.com/docker/distribution)

Docker Hub已经提供了一个Registry的容器

	NAME                                     DESCRIPTION                                     STARS     OFFICIAL   AUTOMATED
	registry                                 Containerized docker registry                   278       [OK]       

启动:

	docker pull reigstry

	docker run -p 5000:5000 -d  registry 

### 将本地镜像push到registry

假设本地镜像为redis:latest, registry服务地址为X.X.X.X:5000

	//在本地创建一个名为X.X.X.X:5000/redis:latest的镜像
	docker tag redis:latest   X.X.X.X:5000/redis:latest  

	//push成功后,会显示镜像的Url
	docker push X.X.X.X:5000/redis:latest

然后就可以在任意一个机器上使用X.X.X.X:5000中的镜像:

	docker  pull X.X.X.X:5000/redis:latest
