---
layout: default
title: "API网关Kong学习笔记（二十五）：重温 kong ingress controller"
author: 李佶澳
createdate: "2019-03-21 11:02:23 +0800"
changedate: "2019-03-21 18:42:47 +0800"
categories: 项目
tags: kong 视频教程
keywords: kong,kong 1.0.3,代码学习
description: 更全面的收集一下kong ingress controller相关的内容，编译过程、运行参数、注解和CRD等
---

* auto-gen TOC:
{:toc}

## 说明

之前简单分析过Kong ingress controller的[实现](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/02/kong-features-05-ingress-controller-analysis.html#%E4%BB%A3%E7%A0%81%E7%BC%96%E8%AF%91)、[使用](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/21/kong-features-17-kong-ingress-controller-run.html)、[CRD](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/30/kong-features-18-kong-ingress-controller-crd.html)。这里稍微规整一下。

{% include kong_pages_list.md %}

## kubernetes-ingress-controller

Kong ingress controller项目名是[kubernetes-ingress-controller](https://github.com/Kong/kubernetes-ingress-controller)，是一个独立于kong的项目。最新release版本是0.3.0，适配kong 1.0.x。项目中提供了部署[yaml](https://github.com/Kong/kubernetes-ingress-controller/tree/master/deploy/single)。

## 编译过程

编译命令如下：

	make deps       //需要翻Q
	make build
	make container  //打包镜像

默认生成的是ELF格式的Linux可执行文件，如果要生成其它格式的可执行文件，用GOOS指定系统类型：

	make build GOOS=darwin

### 下载依赖代码

依赖包用[dep](https://www.lijiaocn.com/programming/chapter-go/chapter04/01-dependency.html#dep)命令管理，项目代码需要在GOPATH/src目录下，如果不愿把代码在src目录中，可以在src目录中做一个符号链接，连接到位于其它位置的代码目录。如果项目不在GOPATH/src中，会报下面的错误：

```sh
$ make deps
dep ensure -v -vendor-only
/Users/lijiao/Work/kong-ingress-controller is not within a known GOPATH/src
make: *** [deps] Error 1
```

可以建一个符号链接解决：

```
ln -s `pwd`/kong-ingress-controller  $GOPATH/src/github.com/Kong/kubernetes-ingress-controller
cd  $GOPATH/src/github.com/Kong/kubernetes-ingress-controller
make deps
```

`make deps`依赖的一些代码在Q内不能访问，需要翻qiang，否则可能会爆下面的错误：

```sh
grouped write of manifest, lock and vendor: error while writing out vendor tree: failed to write dep tree:
failed to export cloud.google.com/go: unable to deduce repository and source type for "cloud.google.com/go":
unable to read metadata: unable to fetch raw metadata: failed HTTP request to URL "http://cloud.google.com/go?go-get=1":
Get http://cloud.google.com/go?go-get=1: dial tcp 172.217.160.110:80: i/o timeout
make: *** [deps] Error 1
```

`make deps`在安装Go deps的时候如果出现下面的错误，可能是因为系统上有多个不同版本的go命令，用到的go命令与GOROOT指定的路径不匹配：

```sh
go get github.com/golang/dep/cmd/dep
# errors
# errors
compile: version "go1.12.1" does not match go tool version "go1.12"
# internal/race
compile: version "go1.12.1" does not match go tool version "go1.12"
# unicode/utf8
compile: version "go1.12.1" does not match go tool version "go1.12"
...
```

### 编译成可执行文件

`make build`将编译得到的文件存放在`/var/folders/c_.....`目录中：

```sh
$ make build
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -installsuffix cgo \
    -ldflags "-s -w -X github.com/kong/kubernetes-ingress-controller/version.RELEASE=0.3.0 -X github.com/kong/kubernetes-ingress-controller/version.COMMIT=git-020ae33 -X github.com/kong/kubernetes-ingress-controller/version.REPO=http://gitlab.puhuitech.cn/infrastructure/kong-ingress-controller.git" -gcflags=-trimpath=/Users/lijiao/Work-Finup/Bin/gopath/src/github.com/Kong/kubernetes-ingress-controller -asmflags=-trimpath=/Users/lijiao/Work-Finup/Bin/gopath/src/github.com/Kong/kubernetes-ingress-controller \
    -o /var/folders/c_/q1wyxzx14l713h58k4hkff180000gp/T/tmp.LKqTFGXr/rootfs/kong-ingress-controller github.com/kong/kubernetes-ingress-controller/cli/ingress-controller
```

生成的kong-ingress-controller默认是ELF格式的。

### 制作镜像

`make all`生成镜像，通过修改Makefile中变量，来调整镜像名称：

```Make
TAG?=0.3.0
REGISTRY?=kong-docker-kubernetes-ingress-controller.bintray.io
GOOS?=linux
DOCKER?=docker
SED_I?=sed -i
GOHOSTOS ?= $(shell go env GOHOSTOS)
...
IMGNAME = kong-ingress-controller
IMAGE = $(REGISTRY)/$(IMGNAME)
MULTI_ARCH_IMG = $(IMAGE)-$(ARCH)
```

## 工作原理

不记录走读笔记了，可以参考以前的：[API网关Kong学习笔记（八）：Kong Ingress Controller的实现](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/02/kong-features-05-ingress-controller-analysis.html)。

## 运行参数

kong-ingress-controller需要访问kubernetes的apiserver，监听kubernetes集群中的资源，如果被部署在kubernetes中，它会自动读取pod中的serviceAccount信息，不需要指定访问凭证。

在kubernetes集群外部运行，用`--kubeconfig`指定访问kubernetes集群使用的kubeconfig文件。

`--ingress-class`指定要处理ingress类型，该参数的值对应的是ingress中名为`kubernetes.io/ingress.class`的annotations。

`--election-id`指定Leader选举组，这个参数的目的是防止同一个集群中`多套`kong-ingress-controller互相干扰，每套kong-ingress-controller都用不同的--election-id，属于同一套的kong-ingress-controller使用相同的--election-id。

`--kong-url`指定对接的kong admin。

`--watch-namespace`指定监听的namespace，默认是全部。

`--publish-service`指定部署在kubernetes中的kong-proxy服务，kong-ingress-controller会取出这个service的IP，并将其更新到每个ingress的status字段中。

如果service的类型是`LoadBalancer`，则取出其中配置的IP，如果是其它类型取出对应的Pod所在的Node的IP。

`--publish-status-address`，如果使用了参数，忽略--publish-service，使用这个参数指定的IP。

`--update-status`和`--update-status-on-shutdown`是ingress状态更新开关，默认都是true，即更改ingress的status。

`--default-backend-service`指定kubernetes中的一个服务，用于提供404页面的服务，当uri不存在的时候转发到该服务， 选用服务的第一个node port地址。

	--publish-service和--default-backend-service都是指定kubernetes集群中的service，不支持IP。
	
	应该改进一下

`--sync-period`和`--sync-rate-limit`限制刷新频率、刷新速率。

另外还有一些日志参数，这里不列出了。

**--update-status的IP获取过程**：

```go
// internal/ingress/status/status.go: 257
func (s *statusSync) runningAddresses() ([]string, error) {
    addrs := []string{}
    if s.PublishStatusAddress != "" {
        addrs = append(addrs, s.PublishStatusAddress)
        return addrs, nil
    }
    ns, name, _ := k8s.ParseNameNS(s.PublishService)
    svc, err := s.Client.CoreV1().Services(ns).Get(name, metav1.GetOptions{})
    if err != nil {
        return nil, err
    }
    switch svc.Spec.Type {
    case apiv1.ServiceTypeLoadBalancer:
        for _, ip := range svc.Status.LoadBalancer.Ingress {
            if ip.IP == "" {
                addrs = append(addrs, ip.Hostname)
            } else {
                addrs = append(addrs, ip.IP)
            }
        }
        addrs = append(addrs, svc.Spec.ExternalIPs...)
        return addrs, nil
    default:
        pods, err := s.Client.CoreV1().Pods(s.pod.Namespace).List(metav1.ListOptions{
            LabelSelector: labels.SelectorFromSet(s.pod.Labels).String(),
        })
        if err != nil {
            return nil, err
        }
        for _, pod := range pods.Items {
            // only Running pods are valid
            if pod.Status.Phase != apiv1.PodRunning {
                continue
            }
            name := k8s.GetNodeIPOrName(s.Client, pod.Spec.NodeName)
            if !sliceutils.StringInSlice(name, addrs) {
                addrs = append(addrs, name)
            }
        }
        return addrs, nil
    }
}
```

## 可以识别的annotations

kong ingress controller支持的[annotations](https://github.com/Kong/kubernetes-ingress-controller/blob/cc8ccdbdafbb1fb6f0918d0944b6180b7dfc3a3d/docs/annotations.md)，
这些annotations都是在ingress中设置。

### kubernetes.io/ingress.class  

ingress的类型，与参数`--ingress-class`对应：

```yaml
metadata:
  name: foo
  annotations:
    kubernetes.io/ingress.class: "gce"
```

```yaml
metadata:
  name: foo
  annotations:
    kubernetes.io/ingress.class: "kong"
```

### plugins.konghq.com

为ingress设置插件，插件是同一个namespace中的局部KongPlugin，或者任意namespace中的全局KongPlugin：

```yaml
metadata:
  name: foo
  annotations:
    plugins.konghq.com: high-rate-limit, docs-site-cors
```

### configuration.konghq.com

为ingress设置KongIngress，默认是同一个namespace中与ingress同名的KongIngress。

## CRD格式

kong ingress controller可以识别[4个CRD](https://github.com/Kong/kubernetes-ingress-controller/blob/cc8ccdbdafbb1fb6f0918d0944b6180b7dfc3a3d/docs/custom-resources.md)，分别是KongPluign、KongIngress、KongConsumer、KongCredential。[docs/custom-resources.md](https://github.com/Kong/kubernetes-ingress-controller/blob/cc8ccdbdafbb1fb6f0918d0944b6180b7dfc3a3d/docs/custom-resources.md)里有很详细的介绍，不复制了。
