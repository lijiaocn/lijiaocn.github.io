---
layout: default
title: Kubernetes的第三方包的使用
author: lijiaocn
createdate: 2017/05/12 10:25:44
changedate: 2017/05/18 09:44:33
categories: 项目
tags: k8s
keywords: k8s,kubernetes,third party,第三方包
description: 不同的是，Kubernetes同时也会将项目中的部分代码以独立项目的形式再次发布出去。

---

* auto-gen TOC:
{:toc}

[Kubernetes][1]也和其它Go开发项目一样，会引用第三方包，不同的是，Kubernetes同时也会将项目中的部分代码以独立项目的形式再次发布出去。

## Godep

[Golang的依赖包管理][2]中介绍过Golang的依赖包管理方式。Kubernetes使用Godep管理第三方包。

第三方包的版本信息:

	▾ Godeps/
	    Godeps.json
	    LICENSES
	    Readme

Godeps.json:

	{
		"ImportPath": "k8s.io/kubernetes",
		"GoVersion": "go1.7",
		"GodepVersion": "v74",
		"Packages": [
			"github.com/ugorji/go/codec/codecgen",
			"github.com/onsi/ginkgo/ginkgo",
			"github.com/jteeuwen/go-bindata/go-bindata",
			"./..."
		],
		"Deps": [
			{
				"ImportPath": "bitbucket.org/bertimus9/systemstat",
				"Rev": "1468fd0db20598383c9393cccaa547de6ad99e5e"
			},
			{
				"ImportPath": "bitbucket.org/ww/goautoneg",
				"Comment": "null-5",
				"Rev": "75cd24fc2f2c2a2088577d12123ddee5f54e0675"
			},
	...

第三方代码:

	▾ vendor/
	  ▸ bitbucket.org/
	  ▸ cloud.google.com/
	  ▸ github.com/
	  ▸ go.pedge.io/
	  ▸ go4.org/
	  ▸ golang.org/
	  ▸ google.golang.org/
	  ▸ gopkg.in/
	  ▸ k8s.io/
	  ▸ vbom.ml/
	    BUILD

## 以第三方包方式引用的项目代码


Kubernetes项目中的一些代码会被自动导出了独立的repo，譬如[client-go][3]，

虽然代码就在repo中，但k8s用引用第三方包的方式引用这些代码，。

	▾ vendor/
	  ▸ bitbucket.org/
	  ▸ cloud.google.com/
	  ▸ github.com/
	  ▸ go.pedge.io/
	  ▸ go4.org/
	  ▸ golang.org/
	  ▸ google.golang.org/
	  ▸ gopkg.in/
	  ▾ k8s.io/
	    ▸ apimachinery/ -> /src/k8s.io/kubernetes/staging/src/k8s.io/apimachinery/
	    ▸ apiserver/ -> /src/k8s.io/kubernetes/staging/src/k8s.io/apiserver/
	    ▸ client-go/ -> /src/k8s.io/kubernetes/staging/src/k8s.io/client-go/
	    ▸ gengo/
	    ▸ heapster/
	    ▸ kube-aggregator/ -> /src/k8s.io/kubernetes/staging/src/k8s.io/kube-aggregator/
	    ▸ metrics/
	    ▸ sample-apiserver/ -> /src/k8s.io/kubernetes/staging/src/k8s.io/sample-apiserver/
	  ▸ vbom.ml/
	    BUILD

vendor/k8s.io目录中的符号链接，链接到了项目的staging目录下文件夹，因此虽然形式上引用的是第三方代码，实际上引用的自身项目中的代码。

这样做是有原因的，[staging/README.md][4]文件中解释到:

	The content will be periodically published to k8s.io/client-go repo
	
	The staged content is copied from the main repo, i.e., k8s.io/kubernetes, with directory rearrangement and necessary rewritings. 

也就是说，staging中的代码是要作为单独的repo发布的, 而这些repo与kubernetes结合的又很紧密，采用这种管理方式后，在开发过程中，就不需要频繁的在多个repo之间切换了，

只需要在kubernetes项目(一个repo)中完成开发，然后通过k8s项目中的脚本更新其它的repo即可。

### staging/copy.sh

在运行`make update`的时候，会引发脚本`hack/update-staging-client-go.sh`的执行, 继而引发`staging/copy.sh`的执行。

在执行copy.sh之前，会检查`godep restore`是否已经执行，否则需要首先执行godep，将godep中描述的依赖包安装到$GOPATH中。这个过程想要翻墙。

copy.sh的作用就是将client相关的代码，拷贝到一个临时目录中:
	
	# save everything for which the staging directory is the source of truth
	save "discovery"
	save "dynamic"
	save "rest"
	save "testing"
	save "tools"
	save "transport"
	save "third_party"
	save "plugin"
	save "util"
	save "examples"
	save "OWNERS"
	
	find "${MAIN_REPO}/pkg/version" -maxdepth 1 -type f | xargs -I{} cp {} "${CLIENT_REPO_TEMP}/pkg/version"
	# need to copy clientsets, though later we should copy APIs and later generate clientsets
	mkcp "pkg/client/clientset_generated/${CLIENTSET}" "pkg/client/clientset_generated"
	mkcp "pkg/client/informers/informers_generated/externalversions" "pkg/client/informers/informers_generated"

并在临时目录中通过godep命令，汇集client依赖的代码。

	GOPATH="${TMP_GOPATH}:${GOPATH}" godep save ./...

copy.sh同时会修改临时目录中的代码，将依赖包的路径改为client-go，修改完成后，临时目录就成了一个自治的repo的。

最后将临时目录中的代码复制到staing/src/k8s.io/client-go目录中。

	if [ "${DRY_RUN}" = false ]; then
	  ls "${CLIENT_REPO}" | { grep -v '_tmp' || true; } | xargs rm -rf
	  mv "${CLIENT_REPO_TEMP}"/* "${CLIENT_REPO}"
	fi

## 参考

1. [kubernetes][1]
2. [golang third party][2]
3. [client-go][3]
4. [staging][4]

[1]: https://github.com/kubernetes/kubernetes "kubernetes" 
[2]: http://www.lijiaocn.com/2016/01/14/Golang-third-party.html "Golang third party"
[3]: https://github.com/kubernetes/client-go "client-go"
[4]: https://github.com/kubernetes/kubernetes/tree/master/staging "staging"
