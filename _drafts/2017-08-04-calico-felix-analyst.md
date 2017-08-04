---
layout: default
title: calico的felix组件分析
author: lijiaocn
createdate: 2017/08/04 15:46:27
changedate: 2017/08/04 18:06:41
categories: 项目
tags: calico
keywords: felix,calico,源码分析,原理说明
description: felix是calico的关键组件，负责设置所在node上的calico网络。

---

* auto-gen TOC:
{:toc}

## 编译

知晓了编译构建过程，内心才会踏实。

	DOCKER_GO_BUILD := mkdir -p .go-pkg-cache && \
	                   docker run --rm \
	                              --net=host \
	                              $(EXTRA_DOCKER_ARGS) \
	                              -e LOCAL_USER_ID=$(MY_UID) \
	                              -v $${PWD}:/go/src/github.com/projectcalico/felix:rw \
	                              -v $${PWD}/.go-pkg-cache:/go/pkg:rw \
	                              -w /go/src/github.com/projectcalico/felix \
	                              $(GO_BUILD_CONTAINER)
	
	bin/calico-felix: $(FELIX_GO_FILES) vendor/.up-to-date
	    @echo Building felix...
	    mkdir -p bin
	    $(DOCKER_GO_BUILD) \
	        sh -c 'go build -v -i -o $@ -v $(LDFLAGS) "github.com/projectcalico/felix" && \
	               ( ldd bin/calico-felix 2>&1 | grep -q "Not a valid dynamic program" || \
	                 ( echo "Error: bin/calico-felix was not statically linked"; false ) )'

编译过程比较简单，就是将代码目录挂载到容器中，然后在容器中编译。

## 参考

1. [felix][1]

[1]: https://github.com/projectcalico/felix  "felix"
