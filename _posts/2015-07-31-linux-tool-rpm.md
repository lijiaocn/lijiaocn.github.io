---
layout: default
title: rpm与rpm软件包的构建使用
author: lijiaocn
createdate: 2015/07/31 10:31:03
changedate: 2017/09/21 19:30:03
categories: 技巧
tags: linuxtool centos
keywords: rpm,centos,linux
description:  rpm软件包的构建方法

---

* auto-gen TOC:
{:toc}

## RPM

RPM包使用rpmbuild构建, rpmbuild工作过程就是读取.spec文件, 将.spec中不同section中的脚本按照约定的顺序执行。

构建rpm的时候会用/usr/lib/rpm中的脚本, 这些脚本中设置了约定的变量, 协助rpmbuild. 例如usr/lib/rpm/macros中:

	macros:%_topdir          %{getenv:HOME}/rpmbuild

除了.spec文件中的描述，rpmbuild还要有一些其它的约定, 例如默认路径、默认目录结构以及一些约定变量。

rpmbuild默认的工作路径在在/usr/lib/rpm/macros中定义的~/rpmbuild，可以在~/.rpmmacros中重新定义topdir:

	%_topdir    $HOME/myrpmbuildenv

rpmbuild约定的目录:

	make BUILD RPMS SOURCES  SPECS  SRPMS  BUILDROOT

	macros:%_builddir        %{_topdir}/BUILD             //编译RPM包的临时目录
	macros:%_rpmdir          %{_topdir}/RPMS              //生成的RPM存放路径
	macros:%_sourcedir       %{_topdir}/SOURCES           //源代码和补丁存放路径
	macros:%_specdir         %{_topdir}/SPECS             //SPEC存放路径
	macros:%_srcrpmdir       %{_topdir}/SRPMS             //生成的srcRPM
	macros:%_buildrootdir    %{_topdir}/BUILDROOT         //需要打包到RPM中的文件

rpmbuild制作RPM包时的基本流程:

	%prep     将%_sourcedir中的源码解压到%_builddir中
	%build    在%_builddir中编译源码
	%install  将需要打入rpm中文件从%_builddir拷贝到%_buildrootdir中
	%file     说明哪些文件需要打包到RPM中
	%clean    清理工作

### SPEC文件

.spec由两部分组成，第一部分是Tags，设置约定的Tag的值，第二部分是shell指令，这些指令被划分成多个section，rpmbuild按照约定顺序执行这些section。

#### Tags

Tags是在SPEC文件开始处, 用":"间隔的变量, 不区分大小写。

	Name:
	Version: 
	Release:
	Summary:
	License:              //Copyright已经废弃
	Distribution:
	Icon:
	Vendor:
	Url:
	Group:
	Packager:
	Provides:
	Requires:
	Conflicts:
	Serial:
	AutoReqProv:
	ExcludeArch:
	ExclusiveArch:
	ExcludeOs:
	ExclusiveOS:
	Prefix:
	BuildRoot:
	Source:
	NoSource:
	Patch:
	NoPatch:
	%description

#### Section

Section使用direction标记, .spec中的direction可以分为两类, 一类是诸如%prep、%build等，用于标记section。
另一类是%setup、%patch等, 实现了一些常用的功能。

	%prep                <--build之前的准备
		%setup 
		%patch
	%build               <--build
	%install             <--install
	%clean               <--clean
	%pre                 <--before install
	%post                <--after install
	%preun               <--before uninstall
	%postun              <--after uninstall
	%verifyscript        <--rpm进行验证时
	%files               <--需要打包进rpm中的文件
		%doc
		%config
		%attr
		%verify
		%docdir
		%dir
	%changelog
	
	-------------------------------------
	
	%ifarch/%ifnarch/%ifos  <-- 条件判断
	%else
	%endif
	
	------------------------------------
	
	%package            <-用于在一个.spec中生成多个rpm

section中的脚本可以使用下面约定的变量:

	RPM_SOURCE_DIR
	RPM_BUILD_DIR
	RPM_DOC_DIR
	RPM_OPT_FLAGS
	RPM_ARCH
	RPM_OS
	RPM_BUILD_ROOT
	RPM_PACKAGE_NAME
	RPM_PACKAGE_VERSION
	RPM_PACKAGE_RELEASE
	RPM_INSTALL_PREFIX

### 示例

[docker-rpm](https://github.com/lijiaocn/Material/tree/master/RPMBuild/docker-rpm)

## 文献

[1]: http://www.rpm.org/max-rpm/  "Maximum RPM"
