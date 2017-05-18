---
layout: default
title: Kubernetes的项目构建编译
author: lijiaocn
createdate: 2017/05/15 15:25:04
changedate: 2017/05/18 14:53:13
categories: 项目
tags: k8s
keywords: k8s,kubernetes,compile,编译
description: kubernetes编译有两种方式，直接编译和在docker中编译。

---

* auto-gen TOC:
{:toc}

kubernetes编译有两种方式，直接编译和在docker中编译。

如果是在MAC上操作，因为MAC的shell命令是BSD风格的，因此需要安装[GNU command tools][3]。

	brew install coreutils
	brew install gnu-tar

## 直接编译 

[Development Guide][1]中给出了直接编译的方法。

构建过程，用make管理:

	make all

## 在容器中编译

[Building Kubernetes][2]中给出了在容器中编译的方法。

如下所示，make命令将在容器中运行。

	build/run.sh make all

build/run.sh运行时会构建编译使用的容器镜像。

	▾ build/
	  ▾ build-image/
	    ▸ cross/
	      Dockerfile  <-- 用于构建镜像的Dockerfile
	      rsyncd.sh*
	      VERSION

makefile的工作过程在《Kubernetes的makefile的工作原理》中说明。

### build/run.sh

在容器中编译时，会有data、rsync、build三个容器参与。

run.sh运行时，会以`gcr.io/google_containers/kube-cross:KUBE_BUILD_IMAGE_CROSS_TAG`为基础镜像，创建一个kube-build镜像。

然后创建一个名为`${KUBE_DATA_CONTAINER_NAME}`的data容器:

src/k8s.io/kubernetes/build/common.sh

	function kube::build::ensure_data_container() {
	..
	  --volume "${REMOTE_ROOT}"   # white-out the whole output dir
	  --volume /usr/local/go/pkg/linux_386_cgo
	  --volume /usr/local/go/pkg/linux_amd64_cgo
	  --volume /usr/local/go/pkg/linux_arm_cgo
	  --volume /usr/local/go/pkg/linux_arm64_cgo
	  ...

data容器中准备了好volume，rsync和build容器都会通过`--volume-from`共享data容器的所有volume。

之后，启动rsync容器，将KUBE_ROOT中的文件同步到rysnc容器的HOME目录:

src/k8s.io/kubernetes/build/common.sh

	function kube::build::sync_to_container() {
	  kube::log::status "Syncing sources to container"
	  ...
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

k8s.io/kubernetes/build/build-image/Dockerfile:

	ENV HOME /go/src/k8s.io/kubernetes
	WORKDIR ${HOME}

同步完成之后，启动build容器，在buid容器的HOME目录下执行编译命令。执行完成后，再将buid容器中的文件同步到本地。

	# Copy all build results back out.
	function kube::build::copy_output() {
	  kube::log::status "Syncing out of container"
	...

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

具体的目标有:

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

## 参考

1. [k8s development Guide][1]
2. [Building Kubernetes][2]
3. [Install and Use GNU Command Line Tools on macOS/OS X][3] 
4. [gengo][4]
5. [k8s的第三方包的使用][5]

[1]: https://github.com/kubernetes/community/blob/master/contributors/devel/development.md "k8s development"
[2]: https://github.com/kubernetes/kubernetes/blob/885ddcc1389bf744f00e7a5f96fbff5515423022/build/README.md "Building Kubernetes"
[3]: https://www.topbug.net/blog/2013/04/14/install-and-use-gnu-command-line-tools-in-mac-os-x/ "Install and Use GNU Command Line Tools on macOS/OS X"
[4]: https://github.com/kubernetes/gengo "gengo" 
[5]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/05/12/Kubernetes-third-party.html "k8s third party"
