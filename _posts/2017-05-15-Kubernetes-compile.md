---
layout: default
title: Kubernetes的编译、打包、发布
author: lijiaocn
createdate: 2017/05/15 15:25:04
changedate: 2017/06/26 10:00:57
categories: 项目
tags: kubernetes
keywords: k8s,kubernetes,compile,编译
description: kubernetes编译有两种方式，直接编译和在docker中编译。

---

* auto-gen TOC:
{:toc}

## 快速开始

### 使用本地环境编译

直接编译:

	KUBE_BUILD_PLATFORMS=linux/amd64 make all 

### 用官方容器编译

在容器中编译，先在本地准备好docker镜像:

	gcr.io/google_containers/kube-cross:KUBE_BUILD_IMAGE_CROSS_TAG

TAG在文件build-image/cross/VERSION中:

	$cat build-image/cross/VERSION
	v1.7.5-2

因为gcr.io镜像需要翻墙获取，可以使用docker.io中他人上传的cross镜像，例如:

	docker pull tacylee/kube-cross:v1.7.5-2
	docker tag tacylee/kube-cross:v1.7.5-2  gcr.io/google_containers/kube-cross:v1.7.5-2

开始编译:

	KUBE_BUILD_PLATFORMS=linux/amd64 build/run.sh make all

打包:

	build/release.sh

现在releas.sh在执行的时候，还会进行编译，可以自行修改build/release.sh:

	kube::build::verify_prereqs
	kube::build::build_image
	kube::build::run_build_command make cross
	if [[ $KUBE_RELEASE_RUN_TESTS =~ ^[yY]$ ]]; then
	  kube::build::run_build_command make test
	  kube::build::run_build_command make test-integration
	fi
	kube::build::copy_output
	kube::release::package_tarballs
	kube::release::package_hyperkube

### Release（打包）

将编译后的得到的二进制文件打包、制作成docker镜像。

提前准备好镜像，build/common.sh中指定了一个作为base的docker镜像:

	kube::build::get_docker_wrapped_binaries() {
	  debian_iptables_version=v7
		...
		 kube-proxy,gcr.io/google-containers/debian-iptables-amd64:${debian_iptables_version}

可以从docker.io上获取他人上传的镜像:

	docker pull googlecontainer/debian-iptables-amd64:v7
	docker tag googlecontainer/debian-iptables-amd64:v7  gcr.io/google-containers/debian-iptables-amd64:v7
	
	docker pull googlecontainer/debian-iptables-arm:v7
	docker tag googlecontainer/debian-iptables-arm:v7  gcr.io/google-containers/debian-iptables-arm:v7
	
	docker pull googlecontainer/debian-iptables-arm64:v7
	docker tag googlecontainer/debian-iptables-arm64:v7  gcr.io/google-containers/debian-iptables-arm64:v7
	
	docker pull googlecontainer/debian-iptables-ppc64le:v7
	docker tag googlecontainer/debian-iptables-ppc64le:v7  gcr.io/google-containers/debian-iptables-ppc64le:v7
	
	docker pull googlecontainer/debian-iptables-s390x:v7
	docker tag googlecontainer/debian-iptables-s390x:v7  gcr.io/google-containers/debian-iptables-s390x:v7

并且把build/lib/release.sh中的：

	 "${DOCKER[@]}" build --pull -q -t "${docker_image_tag}" ${docker_build_path} >/dev/null

修改为：

	 "${DOCKER[@]}" build  -q -t "${docker_image_tag}" ${docker_build_path} >/dev/null

开始打包：

	make release

现在release.sh会调用编译过程进行编译，并且会编译所有的平台。如果不想编译，可以注释掉release.sh中的代码。

服务端的程序以镜像的形式发布在:

	$cd ./_output/
	$find ./release-stage/ -name "*.tar"
	./release-stage/server/linux-amd64/kubernetes/server/bin/kube-aggregator.tar
	./release-stage/server/linux-amd64/kubernetes/server/bin/kube-apiserver.tar
	./release-stage/server/linux-amd64/kubernetes/server/bin/kube-controller-manager.tar
	./release-stage/server/linux-amd64/kubernetes/server/bin/kube-proxy.tar
	./release-stage/server/linux-amd64/kubernetes/server/bin/kube-scheduler.tar
	./release-stage/server/linux-arm/kubernetes/server/bin/kube-aggregator.tar
	./release-stage/server/linux-arm/kubernetes/server/bin/kube-apiserver.tar
	./release-stage/server/linux-arm/kubernetes/server/bin/kube-controller-manager.tar
	./release-stage/server/linux-arm/kubernetes/server/bin/kube-proxy.tar
	./release-stage/server/linux-arm/kubernetes/server/bin/kube-scheduler.tar
	./release-stage/server/linux-arm64/kubernetes/server/bin/kube-aggregator.tar
	./release-stage/server/linux-arm64/kubernetes/server/bin/kube-apiserver.tar
	./release-stage/server/linux-arm64/kubernetes/server/bin/kube-controller-manager.tar
	./release-stage/server/linux-arm64/kubernetes/server/bin/kube-proxy.tar
	./release-stage/server/linux-arm64/kubernetes/server/bin/kube-scheduler.tar
	./release-stage/server/linux-ppc64le/kubernetes/server/bin/kube-aggregator.tar
	./release-stage/server/linux-ppc64le/kubernetes/server/bin/kube-apiserver.tar
	./release-stage/server/linux-ppc64le/kubernetes/server/bin/kube-controller-manager.tar
	./release-stage/server/linux-ppc64le/kubernetes/server/bin/kube-proxy.tar
	./release-stage/server/linux-ppc64le/kubernetes/server/bin/kube-scheduler.tar
	./release-stage/server/linux-s390x/kubernetes/server/bin/kube-aggregator.tar
	./release-stage/server/linux-s390x/kubernetes/server/bin/kube-apiserver.tar
	./release-stage/server/linux-s390x/kubernetes/server/bin/kube-controller-manager.tar
	./release-stage/server/linux-s390x/kubernetes/server/bin/kube-proxy.tar
	./release-stage/server/linux-s390x/kubernetes/server/bin/kube-scheduler.tar

客户端以压缩包的形式发布在:

	$ls release-tars/
	kubernetes-client-darwin-386.tar.gz    kubernetes-client-windows-386.tar.gz
	kubernetes-client-darwin-amd64.tar.gz  kubernetes-client-windows-amd64.tar.gz
	kubernetes-client-linux-386.tar.gz     kubernetes-manifests.tar.gz
	kubernetes-client-linux-amd64.tar.gz   kubernetes-node-linux-amd64.tar.gz
	kubernetes-client-linux-arm.tar.gz     kubernetes-node-linux-arm.tar.gz
	kubernetes-client-linux-arm64.tar.gz   kubernetes-salt.tar.gz
	kubernetes-client-linux-ppc64le.tar.gz kubernetes-server-linux-amd64.tar.gz
	kubernetes-client-linux-s390x.tar.gz   kubernetes-src.tar.gz

## 说明

[k8s release binary][8]中可以直接下载已经变好的二进制文件。

kubernetes编译有两种方式，直接编译和在docker中编译。

如果是在MAC上操作，因为MAC的shell命令是BSD风格的，因此需要安装[GNU command tools][3]。

	brew install coreutils
	brew install gnu-tar

## 常用变量

以`KUBE_`开头的变量经常在后面的脚本中使用到，这些变量一般都是通过`hack/lib/init.sh`引入的。

### KUBE_CLIENT_TARGETS 与 KUBE_CLIENT_BINARIES

在`hack/lib/golang.sh`中定义，client程序:

	readonly KUBE_CLIENT_TARGETS=(
	  cmd/kubectl
	  federation/cmd/kubefed
	)
	
	readonly KUBE_CLIENT_BINARIES=("${KUBE_CLIENT_TARGETS[@]##*/}")

release的时候，被打包到client包里的程序。

### KUBE_NODE_TARGETS 与 KUBE_NODE_BINARIES

在`hack/lib/golang.sh`中定义，node中的程序:

	kube::golang::node_targets() {
	  local targets=(
	    cmd/kube-proxy
	    cmd/kubelet
	  )
	  echo "${targets[@]}"
	}
	
	readonly KUBE_NODE_TARGETS=($(kube::golang::node_targets))
	readonly KUBE_NODE_BINARIES=("${KUBE_NODE_TARGETS[@]##*/}")

## 编译的目标

直接用`WHAT`指定编译目标，通过GOFLAGS和GOGCFLAGS传入编译时参数:

	KUBE_BUILD_PLATFORMS=linux/amd64 make all WHAT=cmd/kubelet GOFLAGS=-v GOGCFLAGS="-N -l"

如果不指定WHAT，则编译全部。`KUBE_BUILD_PLATFORMS`指定目标平台。

### 目标平台

通过环境变量KUBE_BUILD_PLATFORMS指定目标平台，格式为`GOOS/GOARCH`:

	KUBE_BUILD_PLATFORMS=linux/amd64 

GOOS选项:

	linux, darwin, windows, netbsd

GOARCH选项:

	amd64, 386, arm, ppc64

### 目标列表

编译目标在src/k8s.io/kubernetes/hack/lib/golang.sh中定义：

	readonly KUBE_ALL_TARGETS=(
	  "${KUBE_SERVER_TARGETS[@]}"
	  "${KUBE_CLIENT_TARGETS[@]}"
	  "${KUBE_TEST_TARGETS[@]}"
	  "${KUBE_TEST_SERVER_TARGETS[@]}"
	  cmd/gke-certificates-controller
	)
	...
	if [[ ${#targets[@]} -eq 0 ]]; then
	  targets=("${KUBE_ALL_TARGETS[@]}")
	fi

相关变量也在hack/lib/golang.sh中定义：

	KUBE_SERVER_TARGETS:
		cmd/kube-proxy
		cmd/kube-apiserver
		cmd/kube-controller-manager
		cmd/cloud-controller-manager
		cmd/kubelet
		cmd/kubeadm
		cmd/hyperkube
		vendor/k8s.io/kube-aggregator
		vendor/k8s.io/kube-apiextensions-server
		plugin/cmd/kube-scheduler
	
	KUBE_CLIENT_TARGETS
		cmd/kubectl
		federation/cmd/kubefed
	
	KUBE_TEST_TARGETS
		cmd/gendocs
		cmd/genkubedocs
		cmd/genman
		cmd/genyaml
		cmd/mungedocs
		cmd/genswaggertypedocs
		cmd/linkcheck
		federation/cmd/genfeddocs
		vendor/github.com/onsi/ginkgo/ginkgo
		test/e2e/e2e.test
	
	KUBE_TEST_SERVER_TARGETS
		cmd/kubemark
		vendor/github.com/onsi/ginkgo/ginkgo
	
	cmd/gke-certificates-controller

### 在容器中编译

[Building Kubernetes][2]中给出了在容器中编译的方法。

如下所示，make命令将在容器中运行。

	build/run.sh make all

build/run.sh运行时会构建编译时使用的容器镜像。

	▾ build/
	  ▾ build-image/
	    ▸ cross/
	      Dockerfile  <-- 用于构建镜像的Dockerfile
	      rsyncd.sh*
	      VERSION

#### build/run.sh

在容器中编译时，会有data、rsync、build三个容器参与。

build/run.sh:

	...
	kube::build::verify_prereqs
	kube::build::build_image
	kube::build::run_build_command "$@"
	...

#### 构建镜像

kube::build::build_image在build/common.sh中实现:

	function kube::build::build_image() {
	  ...
	  cp /etc/localtime "${LOCAL_OUTPUT_BUILD_CONTEXT}/"
	  cp build/build-image/Dockerfile "${LOCAL_OUTPUT_BUILD_CONTEXT}/Dockerfile"
	  cp build/build-image/rsyncd.sh "${LOCAL_OUTPUT_BUILD_CONTEXT}/"
	  dd if=/dev/urandom bs=512 count=1 2>/dev/null | LC_ALL=C tr -dc 'A-Za-z0-9' | dd bs=32 count=1 2>/dev/null > "${LOCAL_OUTPUT_BUILD_CONTEXT}/rsyncd.password"
	  chmod go= "${LOCAL_OUTPUT_BUILD_CONTEXT}/rsyncd.password"
	  kube::build::update_dockerfile
	  kube::build::docker_build "${KUBE_BUILD_IMAGE}" "${LOCAL_OUTPUT_BUILD_CONTEXT}" 'false'
	  ...

构建的镜像名称为:

	${KUBE_BUILD_IMAGE}
	==>  ${KUBE_BUILD_IMAGE_REPO}:${KUBE_BUILD_IMAGE_TAG}
	==>  kube-build:${KUBE_BUILD_IMAGE_TAG_BASE}-${KUBE_BUILD_IMAGE_VERSION}
	==>  kube-build:build-${KUBE_ROOT_HASH}-${KUBE_BUILD_IMAGE_VERSION_BASE}-${KUBE_BUILD_IMAGE_CROSS_TAG}

KUBE_ROOT_HASH是根据HOSTNAME和KUBE_ROOT生成的。

KUBE_BUILD_IMAGE_VERSION_BASE在build/build-image/VERSION中定义。

KUBE_BUILD_IMAGE_CROSS_TAG在build/build-image/cross/VERSION中定义。

Dockerfile在build/build-image中:

	FROM gcr.io/google_containers/kube-cross:KUBE_BUILD_IMAGE_CROSS_TAG
	...

可以看到是以`gcr.io/google_containers/kube-cross:KUBE_BUILD_IMAGE_CROSS_TAG`为基础镜像。

编译时需要翻墙获取的就是这个镜像。

#### 启动data容器

镜像构建完成后，会调用kube::build::ensure_data_container，创建一个data容器。

	function kube::build::build_image() {
	  ...
	  kube::build::ensure_data_container
	  kube::build::sync_to_container
	  ...

创建一个名为`${KUBE_DATA_CONTAINER_NAME}`的data容器:

src/k8s.io/kubernetes/build/common.sh

	function kube::build::ensure_data_container() {
	...
	local -ra docker_cmd=(
	  "${DOCKER[@]}" run
	  --volume "${REMOTE_ROOT}"   # white-out the whole output dir
	  --volume /usr/local/go/pkg/linux_386_cgo
	  --volume /usr/local/go/pkg/linux_amd64_cgo
	  --volume /usr/local/go/pkg/linux_arm_cgo
	  --volume /usr/local/go/pkg/linux_arm64_cgo
	  --volume /usr/local/go/pkg/linux_ppc64le_cgo
	  --volume /usr/local/go/pkg/darwin_amd64_cgo
	  --volume /usr/local/go/pkg/darwin_386_cgo
	  --volume /usr/local/go/pkg/windows_amd64_cgo
	  --volume /usr/local/go/pkg/windows_386_cgo
	  --name "${KUBE_DATA_CONTAINER_NAME}"
	  --hostname "${HOSTNAME}"
	  "${KUBE_BUILD_IMAGE}"
	  chown -R ${USER_ID}:${GROUP_ID}
	    "${REMOTE_ROOT}"
	    /usr/local/go/pkg/
	)
	"${docker_cmd[@]}"

其中：

	REMOTE_ROOT="/go/src/${KUBE_GO_PACKAGE}"
	
	KUBE_DATA_CONTAINER_NAME
	==>${KUBE_DATA_CONTAINER_NAME_BASE}-${KUBE_BUILD_IMAGE_VERSION}
	==>kube-build-data-${KUBE_ROOT_HASH}-${KUBE_BUILD_IMAGE_VERSION}

在上面启动的data容器中准备了好volume，将来的rsync和build容器会通过`--volume-from`使用data容器的volume。

#### 启动rsync容器

启动rsync容器，将KUBE_ROOT中的文件同步到rysnc容器的HOME目录:

src/k8s.io/kubernetes/build/common.sh

	function kube::build::sync_to_container() {
	  kube::log::status "Syncing sources to container"
	  ...
	  kube::build::start_rsyncd_container
	  kube::build::rsync \
		--delete \
		--filter='+ /staging/**' \
		--filter='- /.git/' \
		--filter='- /.make/' \
		--filter='- /_tmp/' \
		--filter='- /_output/' \
		--filter='- /' \
		--filter='- zz_generated.*' \
		--filter='- generated.proto' \
		"${KUBE_ROOT}/" "rsync://k8s@${KUBE_RSYNC_ADDR}/k8s/"

rsync容器启动的时候会挂载data容器的volume:

	function kube::build::run_build_command_ex() {
		...
		local -a docker_run_opts=(
			"--name=${container_name}"
			"--user=$(id -u):$(id -g)"
			"--hostname=${HOSTNAME}"
			"${DOCKER_MOUNT_ARGS[@]}"
		)
		...

变量DOCKER_MOUNT_ARGS:

	DOCKER_MOUNT_ARGS=(--volumes-from "${KUBE_DATA_CONTAINER_NAME}")

#### 执行编译命令

同步完成之后，启动build容器，在buid容器的HOME目录下执行编译命令。执行完成后，再将buid容器中的文件同步到本地。

	function kube::build::run_build_command() {
	  kube::log::status "Running build command..."
	  kube::build::run_build_command_ex "${KUBE_BUILD_CONTAINER_NAME}" -- "$@"
	}

	function kube::build::copy_output() {
	  kube::log::status "Syncing out of container"
	...

### 直接编译 

[Development Guide][1]中给出了直接编译的方法。

构建过程，用make管理:

	make all

编译指定目标，以及指定编译时选项:

	make all WHAT=cmd/kubelet GOFLAGS=-v
	makn all GOGCFLAGS="-N -l"

编译要求:

	Kubernetes        requires Go
	1.0 - 1.2         1.4.2
	1.3, 1.4          1.6
	1.5 and higher    1.7 - 1.7.5
	                  1.8 not verified as of Feb 2017

## 顶层Makefile

	# Build code.
	#
	# Args:
	#   WHAT: Directory names to build.  If any of these directories has a 'main'
	#     package, the build will produce executable files under $(OUT_DIR)/go/bin.
	#     If not specified, "everything" will be built.
	#   GOFLAGS: Extra flags to pass to 'go' when building.
	#   GOLDFLAGS: Extra linking flags passed to 'go' when building.
	#   GOGCFLAGS: Additional go compile flags passed to 'go' when building.
	#
	# Example:
	#   make
	#   make all
	#   make all WHAT=cmd/kubelet GOFLAGS=-v
	#   make all GOGCFLAGS="-N -l"
	#     Note: Use the -N -l options to disable compiler optimizations an inlining.
	#           Using these build options allows you to subsequently use source
	#           debugging tools like delve.

## make all

src/k8s.io/kubernetes/Makefile:

	.PHONY: all
	ifeq ($(PRINT_HELP),y)
	all:
		@echo "$$ALL_HELP_INFO"
	else
	all: generated_files
		hack/make-rules/build.sh $(WHAT)
	endif

hack/make-rules/build.sh开始构建, $(WHAT)是要构建的目标。

### generated_files

	.PHONY: generated_files
	ifeq ($(PRINT_HELP),y)
	generated_files:
		@echo "$$GENERATED_FILES_HELP_INFO"
	else
	generated_files:
		$(MAKE) -f Makefile.generated_files $@ CALLED_FROM_MAIN_MAKEFILE=1
	endif

generated_files是在另一个Makefile中完成的：src/k8s.io/kubernetes/Makefile.generated_files

### Makefile.generated_files

`Makefile.generated_files`正如其名，定义了用于进行代码的自动生成的Target。

	.PHONY: generated_files
	generated_files: gen_deepcopy gen_defaulter gen_conversion gen_openapi

generated_files依赖的四项的工作模式相同，都是用同名的程序，对在代码注释中打了标记的文件就行处理，自动生成对应的方法。生成器代码位于名为[gengo][4]的repo中。

#### gen_deepcopy

	.PHONY: gen_deepcopy
	gen_deepcopy: $(DEEPCOPY_FILES) $(DEEPCOPY_GEN)
		$(RUN_GEN_DEEPCOPY)

执行的命令:

	RUN_GEN_DEEPCOPY =                                                          \
	    function run_gen_deepcopy() {                                           \
	        if [[ -f $(META_DIR)/$(DEEPCOPY_GEN).todo ]]; then                  \
	            ./hack/run-in-gopath.sh $(DEEPCOPY_GEN)                         \
	                --v $(KUBE_VERBOSE)                                         \
	                --logtostderr                                               \
	                -i $$(cat $(META_DIR)/$(DEEPCOPY_GEN).todo | paste -sd, -)  \
	                --bounding-dirs $(PRJ_SRC_PATH)                             \
	                -O $(DEEPCOPY_BASENAME)                                     \
	                "$$@";                                                      \
	        fi                                                                  \
	    };                                                                      \
	    run_gen_deepcopy

DEEPCOPY_GEN是一个可执行程序:

	# The tool used to generate deep copies.
	DEEPCOPY_GEN := $(BIN_DIR)/deepcopy-gen

run-in-gopaht.sh的作用是设置好GOPATH等变量，并在这个环境下运行传入的命令：

	set -o errexit
	set -o nounset
	set -o pipefail

	KUBE_ROOT=$(dirname "${BASH_SOURCE}")/..
	source "${KUBE_ROOT}/hack/lib/init.sh"

	# This sets up a clean GOPATH and makes sure we are currently in it.
	kube::golang::setup_env

	# Run the user-provided command.
	"${@}"

问题就是deepcopy-gen做了什么事情了，到依赖项中看一下deepcopy-gen是怎样生成的。

	$(DEEPCOPY_FILES): $(DEEPCOPY_GEN)
		mkdir -p $$(dirname $(META_DIR)/$(DEEPCOPY_GEN))
		echo $(PRJ_SRC_PATH)/$(@D) >> $(META_DIR)/$(DEEPCOPY_GEN).todo

	$(DEEPCOPY_GEN):
		hack/make-rules/build.sh cmd/libs/go2idl/deepcopy-gen
		touch $@

k8s.io/kubernetes/cmd/libs/go2idl/deepcopy-gen/main.go:

	// deepcopy-gen is a tool for auto-generating DeepCopy functions.
	//
	// Given a list of input directories, it will generate functions that
	// efficiently perform a full deep-copy of each type.  For any type that
	// offers a `.DeepCopy()` method, it will simply call that.  Otherwise it will
	// use standard value assignment whenever possible.  If that is not possible it
	// will try to call its own generated copy function for the type, if the type is
	// within the allowed root packages.  Failing that, it will fall back on
	// `conversion.Cloner.DeepCopy(val)` to make the copy.  The resulting file will
	// be stored in the same directory as the processed source package.

#####  标记为需要deep-copy

$(DEEPCOPY_FILES)生成了输入参数中的.todo文件，在其中写入需要deep-copy处理的目录。

如果文件中包含注释`// +k8s:deepcopy-gen`，表示这个文件需要进行deep-copy处理。

k8s.io/kubernetes/Makefile.generated_files:

	# Deep-copy generation
	#
	# Any package that wants deep-copy functions generated must include a
	# comment-tag in column 0 of one file of the form:
	#     // +k8s:deepcopy-gen=<VALUE>
	#
	# The <VALUE> may be one of:
	#     generate: generate deep-copy functions into the package
	#     register: generate deep-copy functions and register them with a
	#               scheme

#### gen_defaulter

	# Defaulter generation
	#
	# Any package that wants defaulter functions generated must include a
	# comment-tag in column 0 of one file of the form:
	#     // +k8s:defaulter-gen=<VALUE>
	#
	# The <VALUE> depends on context:
	#     on types:
	#       true:  always generate a defaulter for this type
	#       false: never generate a defaulter for this type
	#     on functions:
	#       covers: if the function name matches SetDefault_NAME, instructs
	#               the generator not to recurse
	#     on packages:
	#       FIELDNAME: any object with a field of this name is a candidate
	#                  for having a defaulter generated

#### gen_conversion

	# Conversion generation
	#
	# Any package that wants conversion functions generated must include one or
	# more comment-tags in any .go file, in column 0, of the form:
	#     // +k8s:conversion-gen=<CONVERSION_TARGET_DIR>
	#
	# The CONVERSION_TARGET_DIR is a project-local path to another directory which
	# should be considered when evaluating peer types for conversions.  Types which
	# are found in the source package (where conversions are being generated)
	# but do not have a peer in one of the target directories will not have
	# conversions generated.

#### gen_openapi

	# Open-api generation
	#
	# Any package that wants open-api functions generated must include a
	# comment-tag in column 0 of one file of the form:
	#     // +k8s:openapi-gen=true
	## hack/make-rules/build.sh

### hack/make-rules/build.sh

build.sh用来编译具体的目标。

#### 构建目标

	set -o errexit
	set -o nounset
	set -o pipefail
	
	KUBE_ROOT=$(dirname "${BASH_SOURCE}")/../..
	KUBE_VERBOSE="${KUBE_VERBOSE:-1}"
	source "${KUBE_ROOT}/hack/lib/init.sh"
	
	kube::golang::build_binaries "$@"
	kube::golang::place_bins

如果没有传入构建目标，默认构建所有目标。

函数kube::golang::build_binaries()，接收构建目标，进行构建。

#### 设置编译环境

设置环境变量: kube::golang::setup_env() 

编译时的GOPATH为: \_output/local/go

	KUBE_OUTPUT_SUBPATH="${KUBE_OUTPUT_SUBPATH:-_output/local}"
	KUBE_OUTPUT="${KUBE_ROOT}/${KUBE_OUTPUT_SUBPATH}"
	KUBE_GOPATH="${KUBE_OUTPUT}/go"
	GOPATH=${KUBE_GOPATH}
	GOPATH="${GOPATH}:${KUBE_EXTRA_GOPATH}"
	
	可以通过设置环境变量KUBE_EXTRA_GOPATH，增加GOPATH中的路径

编译时源码路径: \_out/local/go/src/k8s.io/kubernetes

	KUBE_GO_PACKAGE=k8s.io/kubernetes
	${KUBE_GOPATH}/src/${KUBE_GO_PACKAGE}

编译时选项:

	goflags=(${KUBE_GOFLAGS:-})
	gogcflags="${KUBE_GOGCFLAGS:-}"
	goldflags="${KUBE_GOLDFLAGS:-} $(kube::version::ldflags)"

链接时选项，就是通过`-X`，修改`pkg/version/`和`vendor/k8s.io/client-go/pkg/version`中的变量：

	kube::version::ldflag() {
	  local key=${1}
	  local val=${2}
	
	  echo "-X ${KUBE_GO_PACKAGE}/pkg/version.${key}=${val}"
	  echo "-X ${KUBE_GO_PACKAGE}/vendor/k8s.io/client-go/pkg/version.${key}=${val}"
	}
	
	# Prints the value that needs to be passed to the -ldflags parameter of go build
	# in order to set the Kubernetes based on the git tree status.
	kube::version::ldflags() {
	  kube::version::get_version_vars
	
	  local -a ldflags=($(kube::version::ldflag "buildDate" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')"))
	  if [[ -n ${KUBE_GIT_COMMIT-} ]]; then
	    ldflags+=($(kube::version::ldflag "gitCommit" "${KUBE_GIT_COMMIT}"))
	    ldflags+=($(kube::version::ldflag "gitTreeState" "${KUBE_GIT_TREE_STATE}"))
	  fi
	
	  if [[ -n ${KUBE_GIT_VERSION-} ]]; then
	    ldflags+=($(kube::version::ldflag "gitVersion" "${KUBE_GIT_VERSION}"))
	  fi
	
	  if [[ -n ${KUBE_GIT_MAJOR-} && -n ${KUBE_GIT_MINOR-} ]]; then
	    ldflags+=(
	      $(kube::version::ldflag "gitMajor" "${KUBE_GIT_MAJOR}")
	      $(kube::version::ldflag "gitMinor" "${KUBE_GIT_MINOR}")
	    )
	  fi
	
	  # The -ldflags parameter takes a single string, so join the output.
	  echo "${ldflags[*]-}"
	}

运行时，传入的以`-`开始的参数，被认为是新增的goflags:

	for arg; do
	  if [[ "${arg}" == "--use_go_build" ]]; then
	    use_go_build=true
	  elif [[ "${arg}" == -* ]]; then
	    # Assume arguments starting with a dash are flags to pass to go.
	    goflags+=("${arg}")
	  else
	    targets+=("${arg}")
	  fi
	done

#### 准备工具链

准备编译时工具链: kube::golang::build_kube_toolchain() 

	kube::golang::build_kube_toolchain() {
	  local targets=(
	    hack/cmd/teststale
	    vendor/github.com/jteeuwen/go-bindata/go-bindata
	  )
	
	  local binaries
	  binaries=($(kube::golang::binaries_from_targets "${targets[@]}"))
	
	  kube::log::status "Building the toolchain targets:" "${binaries[@]}"
	  go install "${goflags[@]:+${goflags[@]}}" \
	        -gcflags "${gogcflags}" \
	        -ldflags "${goldflags}" \
	        "${binaries[@]:+${binaries[@]}}"
	}

go-bindata用于将任意文件编译到go源码文件中。

#### 源码预处理

`go generate`生成bindata

	readonly KUBE_BINDATAS=(
	  test/e2e/generated/gobindata_util.go
	)
	...
	for bindata in ${KUBE_BINDATAS[@]}; do
	  if [[ -f "${KUBE_ROOT}/${bindata}" ]]; then
	    go generate "${goflags[@]:+${goflags[@]}}" "${KUBE_ROOT}/${bindata}"
	  fi
	done

go generate会运行目标.go文件中以`//go:generate`开始的注释行中的指令。

在test/e2e/generated/gobindata_util.go中，运行generate-bindata.sh:

	//go:generate ../../../hack/generate-bindata.sh

generate-bindata.sh将一下二进制文件打包到对应的源码中:

	# These are files for e2e tests.
	BINDATA_OUTPUT="test/e2e/generated/bindata.go"
	go-bindata -nometadata -o "${BINDATA_OUTPUT}.tmp" -pkg generated \
		-ignore .jpg -ignore .png -ignore .md \
		"examples/..." \
		"test/e2e/testing-manifests/..." \
		"test/images/..." \
		"test/fixtures/..."

	BINDATA_OUTPUT="pkg/generated/bindata.go"
	go-bindata -nometadata -nocompress -o "${BINDATA_OUTPUT}.tmp" -pkg generated \
		-ignore .jpg -ignore .png -ignore .md \
		"translations/..."

#### 设置目标平台

设置目标平台，kube::golang::set_platform_envs()

	export GOOS=${platform%/*}
	export GOARCH=${platform##*/}

通过环境变量KUBE_BUILD_PLATFORMS指定目标平台，格式为`OS/ARCH`

	local -a platforms=(${KUBE_BUILD_PLATFORMS:-})
	if [[ ${#platforms[@]} -eq 0 ]]; then
	  platforms=("${host_platform}")
	fi

例如：

	darwin/amd64

GOARCH: 

	目标CPU结构，amd64, 386, arm, ppc64

GOOS:

	目标操作系统，linux, darwin, windows, netbsd

#### 开始编译

开始编译，kube::golang::build_binaries_for_platform()。

编译时将目标分为静态链接、动态链接、测试三组。

	//binary就是上面列出的构建目标
	for binary in "${binaries[@]}"; do
		if [[ "${binary}" =~ ".test"$ ]]; then
		  tests+=($binary)
		elif kube::golang::is_statically_linked_library "${binary}"; then
		  statics+=($binary)
		else
		  nonstatics+=($binary)
		fi
	done

以.test结尾的为测试用，除了下面指定为静态链接的，其它为动态链接：

	readonly KUBE_STATIC_LIBRARIES=(
	  cloud-controller-manager
	  kube-apiserver
	  kube-controller-manager
	  kube-scheduler
	  kube-proxy
	  kube-aggregator
	  kubeadm
	  kubectl
	)

静态链接目标的编译：

	CGO_ENABLED=0 go build -o "${outfile}" \
	"${goflags[@]:+${goflags[@]}}" \
	-gcflags "${gogcflags}" \
	-ldflags "${goldflags}" \
	"${binary}"

非静态目标的编译：

	go build -o "${outfile}" \
	"${goflags[@]:+${goflags[@]}}" \
	-gcflags "${gogcflags}" \
	-ldflags "${goldflags}" \
	"${binary}"

## make update

	.PHONY: update
	ifeq ($(PRINT_HELP),y)
	update:
		@echo "$$UPDATE_HELP_INFO"
	else
	update:
		hack/update-all.sh
	endif

### hack/update-all.sh

update-all.sh会依次执行hack/XXX.sh，完成更新操作。

	BASH_TARGETS="
		update-generated-protobuf
		update-codegen
		update-codecgen
		update-generated-docs
		update-generated-swagger-docs
		update-swagger-spec
		update-openapi-spec
		update-api-reference-docs
		update-federation-openapi-spec
		update-staging-client-go
		update-staging-godeps
		update-bazel"

####  hack/update-staging-client-go.sh

update-staging-client-go.sh目的是更新staging/src/k8s.io/client-go/中的文件。

首先会检查是否已经执行`go restore`，确保kubernetes的依赖包已经安装在$GOPATH中。

之后运行staging/copy.sh，copy.sh的作用是更新staging/src/k8s.io/client-go，具体过程见：[k8s的第三方包的使用][5]

## make release

make release直接执行build/releash.sh脚本：

	release:
		build/release.sh

如果变量KUBE_FASTBUILD为“true”，只发布linux/amd64，否则发布所有平台。

hack/lib/golang.sh:

	if [[ "${KUBE_FASTBUILD:-}" == "true" ]]; then
	  readonly KUBE_SERVER_PLATFORMS=(linux/amd64)
	  readonly KUBE_NODE_PLATFORMS=(linux/amd64)
	  if [[ "${KUBE_BUILDER_OS:-}" == "darwin"* ]]; then
	    readonly KUBE_TEST_PLATFORMS=(
	      darwin/amd64
	      linux/amd64
	    )
	    readonly KUBE_CLIENT_PLATFORMS=(
	      darwin/amd64
	      linux/amd64
	    )
	...

### build/release.sh

release.sh首先在容器中进行编译，然后进行打包：

src/k8s.io/kubernetes/build/release.sh:

	kube::build::verify_prereqs
	kube::build::build_image
	kube::build::run_build_command make cross
	
	if [[ $KUBE_RELEASE_RUN_TESTS =~ ^[yY]$ ]]; then
	  kube::build::run_build_command make test
	  kube::build::run_build_command make test-integration
	fi
	
	kube::build::copy_output
	
	kube::release::package_tarballs
	kube::release::package_hyperkube

#### kube::release::package_tarballs

	function kube::release::package_tarballs() {
	  # Clean out any old releases
	  rm -rf "${RELEASE_DIR}"
	  mkdir -p "${RELEASE_DIR}"
	  #源代码打包
	  kube::release::package_src_tarball &
	  #client端程序打包
	  kube::release::package_client_tarballs &
	  kube::release::package_salt_tarball &
	  kube::release::package_kube_manifests_tarball &
	  kube::util::wait-for-jobs || { kube::log::error "previous tarball phase failed"; return 1; }
	
	  # _node and _server tarballs depend on _src tarball
	  kube::release::package_node_tarballs &
	  kube::release::package_server_tarballs &
	  kube::util::wait-for-jobs || { kube::log::error "previous tarball phase failed"; return 1; }
	
	  kube::release::package_final_tarball & # _final depends on some of the previous phases
	  kube::release::package_test_tarball & # _test doesn't depend on anything
	  kube::util::wait-for-jobs || { kube::log::error "previous tarball phase failed"; return 1; }
	}

##### kube::release::package_src_tarball() 

	# Package the source code we built, for compliance/licensing/audit/yadda.
	function kube::release::package_src_tarball() {
	  kube::log::status "Building tarball: src"
	  local source_files=(
	    $(cd "${KUBE_ROOT}" && find . -mindepth 1 -maxdepth 1 \
	      -not \( \
	        \( -path ./_\*        -o \
	           -path ./.git\*     -o \
	           -path ./.config\* -o \
	           -path ./.gsutil\*    \
	        \) -prune \
	      \))
	  )
	  "${TAR}" czf "${RELEASE_DIR}/kubernetes-src.tar.gz" -C "${KUBE_ROOT}" "${source_files[@]}"
	}

##### kube::release::package_client_tarballs

将变量KUBE_CLIENT_BINARIES中的程序打包:

	.:
	kubernetes
	
	./kubernetes:
	client
	
	./kubernetes/client:
	bin
	
	./kubernetes/client/bin:
	kubectl  kubefed

##### kube::release::package_salt_tarball

将`cluster/saltbase/`目录打包, 这是一套用saltstack部署k8s集群的脚本。

##### kube::release::package_kube_manifests_tarball

	# This will pack kube-system manifests files for distros without using salt
	# such as GCI and Ubuntu Trusty. We directly copy manifests from
	# cluster/addons and cluster/saltbase/salt. The script of cluster initialization
	# will remove the salt configuration and evaluate the variables in the manifests.

##### kube::release::package_node_tarballs

将变量`KUBE_NODE_BINARIES`中列出的程序打包:

	.:
	kubernetes
	
	./kubernetes:
	kubernetes-src.tar.gz  LICENSES  node
	
	./kubernetes/node:
	bin
	
	./kubernetes/node/bin:
	kubectl  kubefed  kubelet  kube-proxy

##### kube::release::package_server_tarballs

将变量`KUBE_NODE_BINARIES`和变量`KUBE_SERVER_BINARIES`中列出的程序打包:

	.:
	kubernetes
	
	./kubernetes:
	addons  kubernetes-src.tar.gz  LICENSES  server
	
	./kubernetes/addons:
	
	./kubernetes/server:
	bin
	
	./kubernetes/server/bin:
	cloud-controller-manager  kube-aggregator          kubectl  kube-proxy
	hyperkube                 kube-apiserver           kubefed  kube-scheduler
	kubeadm                   kube-controller-manager  kubelet

并为server端的程序创建docker image:

    kube::release::create_docker_images_for_server "${release_stage}/server/bin" "${arch}"

###### kube::release::create_docker_images_for_server 

在`lib/release.sh`中定义，分别将这些程序打包到各自的docker image中:

    local binaries=($(kube::build::get_docker_wrapped_binaries ${arch}))

get_docker_wrapped_binaries在build/common.sh中定义:

	kube::build::get_docker_wrapped_binaries() {
	  debian_tables_version=v7
	  case $1 in
	    "amd64")
	        local targets=(
	          kube-apiserver,busybox
	          kube-controller-manager,busybox
	          kube-scheduler,busybox
	          kube-aggregator,busybox
	          kube-proxy,gcr.io/google-containers/debian-iptables-amd64:${debian_iptables_version}
	        );;
	    "arm")
	        local targets=(
	          kube-apiserver,armel/busybox
	          kube-controller-manager,armel/busybox
	          kube-scheduler,armel/busybox
	          kube-aggregator,armel/busybox
	          kube-proxy,gcr.io/google-containers/debian-iptables-arm:${debian_iptables_version}
	        );;
	    ......
	  esac
	
	echo "${targets[@]}"
	}

每个target的`,`之前是要打包进容器的程序名binary_name，`,`之后是base_image。

Dockerfile:

	printf " FROM ${base_image} \n ADD ${binary_name} /usr/local/bin/${binary_name}\n" > ${docker_file_path}

最终镜像保存在:

	"${DOCKER[@]}" save ${docker_image_tag} > ${binary_dir}/${binary_name}.tar

	./_output/elease-stage/server/linux-amd64/kubernetes/server/bin/kube-controller-manager.tar
	./_output/elease-stage/server/linux-amd64/kubernetes/server/bin/kube-scheduler.tar
	./_output/elease-stage/server/linux-amd64/kubernetes/server/bin/kube-proxy.tar
	./_output/elease-stage/server/linux-amd64/kubernetes/server/bin/kube-apiserver.tar
	./_output/elease-stage/server/linux-amd64/kubernetes/server/bin/kube-aggregator.tar

##### kube::release::package_final_tarball 

	# This is all the platform-independent stuff you need to run/install kubernetes.
	# Arch-specific binaries will need to be downloaded separately (possibly by
	# using the bundled cluster/get-kube-binaries.sh script).
	# Included in this tarball:
	#   - Cluster spin up/down scripts and configs for various cloud providers
	#   - Tarballs for salt configs that are ready to be uploaded
	#     to master by whatever means appropriate.
	#   - Examples (which may or may not still work)
	#   - The remnants of the docs/ directory

##### kube::release::package_test_tarball() {

	# This is the stuff you need to run tests from the binary distribution.

### 如果不是在容器中编译的

`make release`执行的是build/releash.sh，默认在在容器中编译，并对编译的后内容打包。

如果要打包宿主机编译的内容，可以使用[k8s build local][6]。

## release

release已经被作为一个单独项目发布[k8s release][7]发布。

### 制作rpm

	cd rpm
	./docker-build.sh

## 附录

make all的输出：

	+++ [0518 15:19:14] Building the toolchain targets:
	    k8s.io/kubernetes/hack/cmd/teststale
	    k8s.io/kubernetes/vendor/github.com/jteeuwen/go-bindata/go-bindata
	+++ [0518 15:19:14] Generating bindata:
	    test/e2e/generated/gobindata_util.go
	~/Work/Docker/GOPATH/src/k8s.io/kubernetes ~/Work/Docker/GOPATH/src/k8s.io/kubernetes/test/e2e/generated
	~/Work/Docker/GOPATH/src/k8s.io/kubernetes/test/e2e/generated
	+++ [0518 15:19:14] Building go targets for darwin/amd64:
	    cmd/libs/go2idl/deepcopy-gen
	+++ [0518 15:19:18] Building the toolchain targets:
	    k8s.io/kubernetes/hack/cmd/teststale
	    k8s.io/kubernetes/vendor/github.com/jteeuwen/go-bindata/go-bindata
	+++ [0518 15:19:18] Generating bindata:
	    test/e2e/generated/gobindata_util.go
	~/Work/Docker/GOPATH/src/k8s.io/kubernetes ~/Work/Docker/GOPATH/src/k8s.io/kubernetes/test/e2e/generated
	~/Work/Docker/GOPATH/src/k8s.io/kubernetes/test/e2e/generated
	+++ [0518 15:19:19] Building go targets for darwin/amd64:
	    cmd/libs/go2idl/defaulter-gen
	+++ [0518 15:19:23] Building the toolchain targets:
	    k8s.io/kubernetes/hack/cmd/teststale
	    k8s.io/kubernetes/vendor/github.com/jteeuwen/go-bindata/go-bindata
	+++ [0518 15:19:23] Generating bindata:
	    test/e2e/generated/gobindata_util.go
	~/Work/Docker/GOPATH/src/k8s.io/kubernetes ~/Work/Docker/GOPATH/src/k8s.io/kubernetes/test/e2e/generated
	~/Work/Docker/GOPATH/src/k8s.io/kubernetes/test/e2e/generated
	+++ [0518 15:19:23] Building go targets for darwin/amd64:
	    cmd/libs/go2idl/conversion-gen
	+++ [0518 15:19:27] Building the toolchain targets:
	    k8s.io/kubernetes/hack/cmd/teststale
	    k8s.io/kubernetes/vendor/github.com/jteeuwen/go-bindata/go-bindata
	+++ [0518 15:19:27] Generating bindata:
	    test/e2e/generated/gobindata_util.go
	~/Work/Docker/GOPATH/src/k8s.io/kubernetes ~/Work/Docker/GOPATH/src/k8s.io/kubernetes/test/e2e/generated
	~/Work/Docker/GOPATH/src/k8s.io/kubernetes/test/e2e/generated
	+++ [0518 15:19:28] Building go targets for darwin/amd64:
	    cmd/libs/go2idl/openapi-gen
	+++ [0518 15:19:33] Building the toolchain targets:
	    k8s.io/kubernetes/hack/cmd/teststale
	    k8s.io/kubernetes/vendor/github.com/jteeuwen/go-bindata/go-bindata
	+++ [0518 15:19:33] Generating bindata:
	    test/e2e/generated/gobindata_util.go
	~/Work/Docker/GOPATH/src/k8s.io/kubernetes ~/Work/Docker/GOPATH/src/k8s.io/kubernetes/test/e2e/generated
	~/Work/Docker/GOPATH/src/k8s.io/kubernetes/test/e2e/generated
	+++ [0518 15:19:34] Building go targets for darwin/amd64:
	    cmd/kube-proxy
	    cmd/kube-apiserver
	    cmd/kube-controller-manager
	    cmd/cloud-controller-manager
	    cmd/kubelet
	    cmd/kubeadm
	    cmd/hyperkube
	    vendor/k8s.io/kube-aggregator
	    plugin/cmd/kube-scheduler
	    cmd/kubectl
	    federation/cmd/kubefed
	    cmd/gendocs
	    cmd/genkubedocs
	    cmd/genman
	    cmd/genyaml
	    cmd/mungedocs
	    cmd/genswaggertypedocs
	    cmd/linkcheck
	    examples/k8petstore/web-server/src
	    federation/cmd/genfeddocs
	    vendor/github.com/onsi/ginkgo/ginkgo
	    test/e2e/e2e.test
	    cmd/kubemark
	    vendor/github.com/onsi/ginkgo/ginkgo
	    test/e2e_node/e2e_node.test
	    cmd/gke-certificates-controller

## 参考

1. [k8s development Guide][1]
2. [Building Kubernetes][2]
3. [Install and Use GNU Command Line Tools on macOS/OS X][3] 
4. [gengo][4]
5. [k8s的第三方包的使用][5]
6. [k8s build local][6]
7. [k8s release][7]
8. [k8s release binary][8]
9. [k8s build local][9]
10. [k8s build in docker][10]

[1]: https://github.com/kubernetes/community/blob/master/contributors/devel/development.md "k8s development"
[2]: https://github.com/kubernetes/kubernetes/blob/885ddcc1389bf744f00e7a5f96fbff5515423022/build/README.md "Building Kubernetes"
[3]: https://www.topbug.net/blog/2013/04/14/install-and-use-gnu-command-line-tools-in-mac-os-x/ "Install and Use GNU Command Line Tools on macOS/OS X"
[4]: https://github.com/kubernetes/gengo "gengo" 
[5]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/05/12/Kubernetes-third-party.html "k8s third party"
[6]: https://github.com/lijiaocn/k8s-build-local "k8s build local"
[7]: https://github.com/kubernetes/release "k8s release"
[8]: https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG.md  "k8s release binay"
[9]: https://github.com/lijiaocn/k8s-build-local "k8s build local"
[10]: https://github.com/kubernetes/kubernetes/blob/475f175e687154ae25cfc21de478e880d1abab5f/build/README.md "k8s build in docker"
