---
layout: default
title:  calico的在kubernetes中安装方式以及编译构建过程
author: lijiaocn
createdate: 2017/09/25 13:42:38
last_modified_at: 2017/09/28 09:59:39
categories: 项目
tags: calico
keywords: calico,deploy,kubernetes,compile
description: 

---

* auto-gen TOC:
{:toc}

## 说明

[building calico components][1]中详细介绍了Calico的编译过程。

[calico releases][2]中列出每个release版本中的各组件的版本号。

[calico release notes][3]中给出了每个release版本的说明，并提供已经编译好的文件下载。

calico/node中需要：felix、confd、calico-bgp-daemon、bird、libnetwork-plugin。

## 在k8s中的安装过程

这里使用的v2.4.1，从[calico-release-v2.4.1][4]下载后，将其解压:

	$ tree .
	.
	|-- bin
	|   |-- calicoctl
	|   |-- calicoctl-darwin-amd64
	|   `-- calicoctl-windows-amd64.exe
	|-- images
	|   |-- calico-cni.tar
	|   |-- calico-kube-policy-controller.tar
	|   |-- calico-node.tar
	|   `-- calico-typha.tar
	|-- k8s-manifests
	|   |-- hosted
	|   |   |-- calicoctl.yaml
	|   |   |-- calico.yaml
	|   |   |-- kubeadm
	|   |   |   |-- 1.5
	|   |   |   |   `-- calico.yaml
	|   |   |   `-- 1.6
	|   |   |       `-- calico.yaml
	|   |   |-- kubernetes-datastore
	|   |   |   |-- calicoctl.yaml
	|   |   |   |-- calico-networking
	|   |   |   |   |-- 1.5
	|   |   |   |   |   `-- calico.yaml
	|   |   |   |   `-- 1.6
	|   |   |   |       `-- calico.yaml
	|   |   |   `-- policy-only
	|   |   |       |-- 1.5
	|   |   |       |   `-- calico.yaml
	|   |   |       `-- 1.6
	|   |   |           `-- calico.yaml
	|   |   `-- rbac-kdd.yaml
	|   |-- policy-controller.yaml
	|   `-- rbac.yaml
	`-- README

`bin`目录中是命令行calicoctl，`images`目录中是已经做好的docker镜像，`k8s-mainfests`中用来部署calico的yaml文件。
其中，kubeadm中是用kubeadm部署时使用的yaml文件，kubernetes-datastore中是用kubernetes存储calico信息使用的yaml。

不使用kubeadm，在已经有etcd集群的情况下，部署过程如下：

	$ kubectl -n kube-system create -f k8s-manifests/hosted/calico.yaml
	$ kubectl -n kube-system create -f k8s-manifests/hosted/rbac-kdd.yaml
	$ kubectl -n kube-system create -f k8s-mainfests/policy-controller.yaml
	$ kubectl -n kube-system create -f k8s-mainfests/rbac.yaml

### k8s-manifests/hosted/calico.yaml

`k8s-manifests/hosted/calico.yaml`在每个node上部署cni和calico的服务。这一步完成之后，calico自身就已经完成了部署。

首先在calico.yaml中在名为`calico-config`的ConfigMap中填入目标环境的信息:

	kind: ConfigMap
	apiVersion: v1
	metadata:
	  name: calico-config
	  namespace: kube-system
	data:
	  # Configure this with the location of your etcd cluster.
	  etcd_endpoints: "http://127.0.0.1:2379"
	
	  # Configure the Calico backend to use.
	  calico_backend: "bird"
	...
	  etcd_ca: ""   # "/calico-secrets/etcd-ca"
	  etcd_cert: "" # "/calico-secrets/etcd-cert"
	  etcd_key: ""  # "/calico-secrets/etcd-key"

主要就是填入etcd的地址，如果etcd启用了TLS，填入相关的证书。

以Daemonset的方式将calico部署到带有`k8s-app: calico-node`标签的node上。

一个容器使用`calico/cni`镜像，将容器中的插件程序拷贝到node的目录中。

另一个容器使用`calico/node`镜像，运行calico的服务，并监听配置信息变化。

## 编译felix


## 参考

1. [Building Calico components][1]
2. [calico releases][2]
3. [calico release notes][3]
4. [calico-release-v2.4.1][4]

[1]: https://github.com/projectcalico/calico/blob/master/BUILDING_CALICO.md  "Building Calico components" 
[2]: https://docs.projectcalico.org/v2.5/releases/ "calico releases"
[3]: https://github.com/projectcalico/calico/releases "calico release notes"
[4]: https://github.com/projectcalico/calico/releases/download/v2.4.1/release-v2.4.1.tgz  "calico-release-v2.4.1"
