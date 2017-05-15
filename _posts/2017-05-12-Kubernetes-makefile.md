---
layout: default
title: Kubernetes的makefile的工作过程
author: lijiaocn
createdate: 2017/05/12 16:56:24
changedate: 2017/05/15 15:00:00
categories: 项目
tags: k8s
keywords: k8s,makefile,kubernetes,k8s的构建
description: Kubernetes使用Makefile管理项目的构建，顶层Makefile中包含多个Target。

---

* auto-gen TOC:
{:toc}

Kubernetes使用Makefile管理项目的构建，顶层Makefile中包含多个Target。

Kubernetes项目中的Makefile比较简单，由`顶层Makefile`和`Makefile.generated_files`组成。

主要的构建、编译过程是在hack/make-rules目录中的shell文件中定义的。

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

### all

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

generated_files依赖的四项的工作模式相同，都是用同名的程序，对在代码注释中打了标记的文件就行处理，自动生成对应的方法。生成器代码位于名为[gengo][1]的repo中。

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

## hack/make-rules/build.sh

build.sh用来编译具体的目标。

	set -o errexit
	set -o nounset
	set -o pipefail
	
	KUBE_ROOT=$(dirname "${BASH_SOURCE}")/../..
	KUBE_VERBOSE="${KUBE_VERBOSE:-1}"
	source "${KUBE_ROOT}/hack/lib/init.sh"
	
	kube::golang::build_binaries "$@"
	kube::golang::place_bins

kube::golang::build_binaries():

## 参考

1. [gengo][1]

[1]: https://github.com/kubernetes/gengo "gengo" 
