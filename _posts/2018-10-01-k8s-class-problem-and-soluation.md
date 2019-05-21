---
layout: default
title: "Kubernetes1.12从零开始（零）：遇到的问题与解决方法"
author: 李佶澳
createdate: 2018/10/21 12:06:00
changedate: 2018/11/11 18:41:21
categories: 问题
tags: 视频教程 kubernetes 
keywords: kubernetes,容器集群,docker
description: 这里记录Kubernetes1.12从零开始的过程中遇到的一些问题与解决方法。

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

本系列`所有文章`可以在**[系列教程汇总](https://www.lijiaocn.com/tags/class.html)**中找到，`演示和讲解视频`位于**[网易云课堂·IT技术快速入门学院 ](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)**，`课程说明`、`资料`和`QQ交流群`见 **[Kubernetes1.12从零开始（初）：课程介绍与官方文档汇总](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/01/k8s-class-kubernetes-intro.html#说明)**，探索过程遇到的问题记录在：[Kubernetes1.12从零开始（一）：遇到的问题与解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/10/01/k8s-class-problem-and-soluation.html)。

这里记录Kubernetes1.12从零开始的过程中遇到的一些问题与解决方法。

## 运行ansible脚本时，无法连接机器：fatal: [192.168.33.11]: UNREACHABLE!

	The ssh-ed25519 key fingerprint is 633978fd7f443a4605b43f860c8867d8.
	Are you sure you want to continue connecting (yes/no)?
	fatal: [192.168.33.11]: UNREACHABLE! => {"changed": false, "msg": "('Bad authentication type', [u'publickey', u'gssapi-keyex', u'gssapi-with-mic']) (allowed_types=[u'publickey', u'gssapi-keyex', u'gssapi-with-mic'])", "unreachable": true}

	fatal: [192.168.33.12]: UNREACHABLE! => {"changed": false, "msg": "('Bad authentication type', [u'publickey', u'gssapi-keyex', u'gssapi-with-mic']) (allowed_types=[u'publickey', u'gssapi-keyex', u'gssapi-with-mic'])", "unreachable": true}

这是因为目标机器上的sshd不允许密码登陆，更改`/etc/ssh/sshd_config`中配置：

	PasswordAuthentication yes

然后重启sshd服务：

	systemctl restart sshd

## 运行ansible脚本时，无法连接机器： fatal: [192.168.33.11]: UNREACHABLE!

	Are you sure you want to continue connecting (yes/no)?
	fatal: [192.168.33.11]: UNREACHABLE! => {"changed": false, "msg": "host key mismatch for 192.168.33.11", "unreachable": true}

这是因为本地的`~/.ssh/known_hosts`中有对应的IP记录，但是其中的指纹和现有的机器对应不上。将虚拟机销毁后重建，就会出现这种情况。

将`~/.ssh/known_hosts`中对应IP的记录直接删除即可。

## Mac上编译时，容器被杀死：/usr/local/go/pkg/tool/linux_amd64/link: signal: killed

在编译kubeneters的时候特别注意，如果是在Mac上编译，因为Mac上的Docker实际上是在一个虚拟机中运行的，虚拟机默认内存是2G，在编译kubernetes中的部署组件，例如kubelet的时候，可以会因为内存不足，用来编译的容器被杀死：

	+++ [1110 18:33:03] Building go targets for linux/amd64:
	    cmd/kubelet
	/usr/local/go/pkg/tool/linux_amd64/link: signal: killed
	!!! [1110 18:34:41] Call tree:
	!!! [1110 18:34:41]  1: /go/src/github.com/kubernetes/kubernetes/hack/lib/golang.sh:600 kube::golang::build_some_binaries(...)
	!!! [1110 18:34:41]  2: /go/src/github.com/kubernetes/kubernetes/hack/lib/golang.sh:735 kube::golang::build_binaries_for_platform(...)
	!!! [1110 18:34:42]  3: hack/make-rules/build.sh:27 kube::golang::build_binaries(...)
	!!! [1110 18:34:42] Call tree:
	!!! [1110 18:34:42]  1: hack/make-rules/build.sh:27 kube::golang::build_binaries(...)
	!!! [1110 18:34:42] Call tree:
	!!! [1110 18:34:42]  1: hack/make-rules/build.sh:27 kube::golang::build_binaries(...)
	make: *** [all] Error 1

修改Mac上的Docker使用的虚拟机的配置的方法： 点击Docker图标，选择“preference"->“advanced”。


## pip命令执行时：SSLError: [SSL: TLSV1_ALERT_PROTOCOL_VERSION] tlsv1 alert protocol version (_ssl.c:590)

	(env) lijiaos-mbp:kubefromscratch-ansible lijiao$ pip search a
	Exception:
	Traceback (most recent call last):
	  File "/Users/lijiao/Work/nodes/kubefromscratch-ansible/env/lib/python2.7/site-packages/pip/basecommand.py", line 209, in main
	    status = self.run(options, args)
	  File "/Users/lijiao/Work/nodes/kubefromscratch-ansible/env/lib/python2.7/site-packages/pip/commands/search.py", line 43, in run
	    pypi_hits = self.search(query, options)
	  File "/Users/lijiao/Work/nodes/kubefromscratch-ansible/env/lib/python2.7/site-packages/pip/commands/search.py", line 60, in search
	    hits = pypi.search({'name': query, 'summary': query}, 'or')
	  File "/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/xmlrpclib.py", line 1240, in __call__
	    return self.__send(self.__name, args)
	  File "/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/xmlrpclib.py", line 1599, in __request
	    verbose=self.__verbose
	  File "/Users/lijiao/Work/nodes/kubefromscratch-ansible/env/lib/python2.7/site-packages/pip/download.py", line 764, in request
	    headers=headers, stream=True)
	  File "/Users/lijiao/Work/nodes/kubefromscratch-ansible/env/lib/python2.7/site-packages/pip/_vendor/requests/sessions.py", line 511, in post
	    return self.request('POST', url, data=data, json=json, **kwargs)
	  File "/Users/lijiao/Work/nodes/kubefromscratch-ansible/env/lib/python2.7/site-packages/pip/download.py", line 378, in request
	    return super(PipSession, self).request(method, url, *args, **kwargs)
	  File "/Users/lijiao/Work/nodes/kubefromscratch-ansible/env/lib/python2.7/site-packages/pip/_vendor/requests/sessions.py", line 468, in request
	    resp = self.send(prep, **send_kwargs)
	  File "/Users/lijiao/Work/nodes/kubefromscratch-ansible/env/lib/python2.7/site-packages/pip/_vendor/requests/sessions.py", line 576, in send
	    r = adapter.send(request, **kwargs)
	  File "/Users/lijiao/Work/nodes/kubefromscratch-ansible/env/lib/python2.7/site-packages/pip/_vendor/cachecontrol/adapter.py", line 46, in send
	    resp = super(CacheControlAdapter, self).send(request, **kw)
	  File "/Users/lijiao/Work/nodes/kubefromscratch-ansible/env/lib/python2.7/site-packages/pip/_vendor/requests/adapters.py", line 447, in send
	    raise SSLError(e, request=request)
	SSLError: [SSL: TLSV1_ALERT_PROTOCOL_VERSION] tlsv1 alert protocol version (_ssl.c:590)

出现这个错误的原因是python.org已经不支持TLSv1.0和TLSv1.1了。

[解决[SSL: TLSV1_ALERT_PROTOCOL_VERSION 问题](https://blog.csdn.net/meifannao789456/article/details/81198253)中给出的方法是重装pip,可以解决问题：

	curl https://bootstrap.pypa.io/get-pip.py | python

##  kubeadm init失败，kube-apiserver不停重启

>几周以后，使用最新版本的kubeadm，发现这个问题没有了 2018-10-21 20:27:11

`kubeadm init`时遇到了下面的问题：

	[init] waiting for the kubelet to boot up the control plane as Static Pods from directory "/etc/kubernetes/manifests" 
	[init] this might take a minute or longer if the control plane images have to be pulled
	
	                Unfortunately, an error has occurred:
	                        timed out waiting for the condition
	
	                This error is likely caused by:
	                        - The kubelet is not running
	                        - The kubelet is unhealthy due to a misconfiguration of the node in some way (required cgroups disabled)
	                        - No internet connection is available so the kubelet cannot pull or find the following control plane images:

观察发现其实apiserver已经启动，但是大概两分钟后自动推出，日志显示：

	E1006 09:45:23.046362       1 controller.go:173] no master IPs were listed in storage, refusing to erase all endpoints for the kubernetes service

东找西找，找到了这么一段[说明](https://deploy-preview-6695--kubernetes-io-master-staging.netlify.com/docs/admin/high-availability/#endpoint-reconciler):

	As mentioned in the previous section, the apiserver is exposed through a service called kubernetes. 
	The endpoints for this service correspond to the apiserver replicas that we just deployed.
	...
	there is special code in the apiserver to let it update its own endpoints directly. This code is called the “reconciler,” ..

这个和Apiserver高可用相关的，在kubernetes内部，apiserver被包装成一个名为`kubernetes`的服务，既然是服务，那么就要有后端的endpoints。对`kubernetes`服务来说，后端的endpoints
就是apiserver的地址，apiserver需要更新etcd中的endpoints记录。

另外从1.9以后，用参数`--endpoint-reconciler-type=lease`指定endpoint的更新方法，`lease`是默认值。

怀疑是1.12.1版本在apiserver高可用方面有bug，直接在`/etc/kubernetes/manifests/kube-apiserver.yaml`中，加了一行配置：

	 - --endpoint-reconciler-type=none
	 - --insecure-port=8080

然后apiserver就稳定运行不重启了，顺便把insecure-port设置为8080了。

github上两个issue[22609](https://github.com/kubernetes/kubernetes/issues/22609)、[1047](https://github.com/kubernetes/kubeadm/issues/1047)都很长时间没有可用的答案，让人感觉不太靠谱啊。。

这样更改之后，用`kubectl get cs`看到组件都正常：

	$ kubectl get cs
	NAME                 STATUS    MESSAGE              ERROR
	controller-manager   Healthy   ok
	scheduler            Healthy   ok
	etcd-0               Healthy   {"health": "true"}

虽然手动调整正常了，但是kubeadm init还是报错，没法获得添加node的命令

## Mac上CFSSL执行出错：Failed MSpanList_Insert 0xa0f000 0x19b27193a1671 0x0 0x0

下载的1.2版本的Mac版cfssl：

	curl -L https://pkg.cfssl.org/R1.2/cfssl_darwin-amd64 -o cfssl
	chmod +x cfssl

运行时直接报错：

	$ ./cfssl -h
	failed MSpanList_Insert 0xa0f000 0x19b27193a1671 0x0 0x0
	fatal error: MSpanList_Insert

	runtime stack:
	runtime.throw(0x6bbbe0, 0x10)
		/usr/local/go/src/runtime/panic.go:530 +0x90 fp=0x7ffeefbff3a0 sp=0x7ffeefbff388
	runtime.(*mSpanList).insert(0x9436e8, 0xa0f000)
		/usr/local/go/src/runtime/mheap.go:933 +0x293 fp=0x7ffeefbff3d0 sp=0x7ffeefbff3a0
	runtime.(*mheap).freeSpanLocked(0x942ee0, 0xa0f000, 0x100, 0x0)
	...

根据[runtime: fatal error: MSpanList_Insert on macOS 10.12 ](https://github.com/golang/go/issues/20888)中的说法，这应该是Go的版本不同造成的。我本地的Go版本是1.10.3，下载的cfssl文件，可能是用其它版本的Go编译的。

在[cfssl installation failed in OS X High Sierra](https://github.com/kelseyhightower/kubernetes-the-hard-way/issues/229)中，有人提出同样问题，看了一下回答，一种是建议用brew按照cfssl，一种是建议直接用go get，在本地重新编译。

