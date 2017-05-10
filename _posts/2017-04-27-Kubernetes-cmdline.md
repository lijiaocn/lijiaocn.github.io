---
layout: default
title: Kuberntes的Cmdline实现
author: lijiaocn
createdate: 2017/04/27 14:39:12
changedate: 2017/05/10 11:19:35
categories:
tags:  k8s
keywords: kubernetes命令行的实现
description: 了解kubernetes命令行的实现，是打开kuberntes源码大门的第一步。

---

* auto-gen TOC:
{:toc}

## 概述

Kuberntes的命令行是用[cobra][1]实现的。这里以kubectl的为例。

## main()

k8s.io/kubernetes/cmd/kubectl/kubectl.go:

	func main() {
	    if err := app.run(); err != nil {
	        os.exit(1)
	    }
	    os.exit(0)
	}

## app.run()

`app.run()`在k8s.io/kubernetes/cmd/kubectl/app/kubectl.go:

	cmd := cmd.NewKubectlCommand(cmdutil.NewFactory(nil), os.Stdin, os.Stdout, os.Stderr)
	return cmd.Execute()

## cmd的初始化

在k8s.io/kubernetes/pkg/kubectl/cmd/cmd.go可以看到cmd.Newkubectlcommand()的实现:

	func NewKubectlCommand(f cmdutil.Factory, in io.Reader, out, err io.Writer) *cobra.Command {

cmd就是cobra.Command。

cobra的命令设置就是三步:

	创建command，设置执行函数
	设置command的flag (即命令行参数）
	设置子命令、以及自命令的命令行参数

### 创建command

在k8s.io/kubernetes/pkg/kubectl/cmd/cmd.go继续看cmd.Newkubectlcommand()的实现:

	cmds := &cobra.Command{
	    Use:   "kubectl",
	    Short: i18n.T("kubectl controls the Kubernetes cluster manager"),
	    Long: templates.LongDesc(`
	kubectl controls the Kubernetes cluster manager.
	
	Find more information at https://github.com/kubernetes/kubernetes.`),
	    Run: runHelp,
	    BashCompletionFunction: bash_completion_func,
	}

### 命令行行参数

在k8s.io/kubernetes/pkg/kubectl/cmd/cmd.go继续看cmd.Newkubectlcommand()的实现:

	f.BindFlags(cmds.PersistentFlags())
	f.BindExternalFlags(cmds.PersistentFlags())

f是传入参数，类型为`cmdutil.Factory`。

从cmd.go回溯到app.go，追踪输入参数f的创建

#### 输入参数f

在k8s.io/kubernetes/pkg/kubectl/cmd/util/factory.go可以看到：

	func NewFactory(optionalClientConfig clientcmd.ClientConfig) Factory {
	    clientAccessFactory := NewClientAccessFactory(optionalClientConfig)
	    objectMappingFactory := NewObjectMappingFactory(clientAccessFactory)
	    builderFactory := NewBuilderFactory(clientAccessFactory, objectMappingFactory)
	
	    return &factory{
	        ClientAccessFactory:  clientAccessFactory,
	        ObjectMappingFactory: objectMappingFactory,
	        BuilderFactory:       builderFactory,
	    }
	}

分别进入factory的三个成员变量，可以发现BindFlags()和BindExternalFlags()是interface`ClientAccessFactory`中的方法:

	// BindFlags adds any flags that are common to all kubectl sub commands.
	BindFlags(flags *pflag.FlagSet)

	// BindExternalFlags adds any flags defined by external projects (not part of pflags)
	BindExternalFlags(flags *pflag.FlagSet)

所以追踪变量`clientAccessFactory`的创建，找到BindFlags和BindExternalFlags的实现。

#### 变量clientAccessFactory

在k8s.io/kubernetes/pkg/kubectl/cmd/util/factory_client_access.go中:

	func NewClientAccessFactory(optionalClientConfig clientcmd.ClientConfig) ClientAccessFactory {
	    flags := pflag.NewFlagSet("", pflag.ContinueOnError)
	
	    clientConfig := optionalClientConfig
	    if optionalClientConfig == nil {
	        clientConfig = DefaultClientConfig(flags)
	    }
	
	    return NewClientAccessFactoryFromDiscovery(flags, clientConfig, &discoveryFactory{clientConfig: clientConfig})
	}

在`NewClientAccessFactoryFromDiscovery()`中找到了方法的实现

	    f := &ring0Factory{
	        flags:            flags,
	        clientConfig:     clientConfig,
	        discoveryFactory: discoveryFactory,
	        clientCache:      clientCache,
	    }

#### ring0Factory

k8s.io/kubernetes/pkg/kubectl/cmd/util/factory_client_access.go：

	func (f *ring0Factory) BindFlags(flags *pflag.FlagSet) {

	    flags.AddFlagSet(f.flags)
	    flags.BoolVar(&f.clientCache.matchVersion, FlagMatchBinaryVersion, false, "Require server version to match client version")
	    flags.SetNormalizeFunc(utilflag.WordSepNormalizeFunc)
	}
	
	func (f *ring0Factory) BindExternalFlags(flags *pflag.FlagSet) {
	    flags.AddGoFlagSet(flag.CommandLine)
	}

可以看到主要是BindFlags中将f.flags加入了参数`flags`中，通过回溯，可以知道这个`flags`就是`cmds.Persistentflags`。

#### f.flags

继续回退，寻找为f.flags的赋值的地方。

在k8s.io/kubernetes/pkg/kubectl/cmd/util/factory_client_access.go中:

	func NewClientAccessFactory(optionalClientConfig clientcmd.ClientConfig) ClientAccessFactory {
	    flags := pflag.NewFlagSet("", pflag.ContinueOnError)
	
	    clientConfig := optionalClientConfig
	    if optionalClientConfig == nil {
	        clientConfig = DefaultClientConfig(flags)
	    }
	
	    return NewClientAccessFactoryFromDiscovery(flags, clientConfig, &discoveryFactory{clientConfig: clientConfig})
	}

通过回退可以发现optionalClientConfig是nil，所以flags是在`DefaultClientConfig()`设置的。

#### DefaultClientConfig()

k8s.io/kubernetes/pkg/kubectl/cmd/util/factory_client_access.go:

	flags.StringVar(&loadingRules.ExplicitPath, "kubeconfig", "", "Path to the kubeconfig file to use for CLI requests.")
	...
	clientcmd.BindOverrideFlags(overrides, flags, flagNames)

#### BindOverrideFlags()

k8s.io/kubernetes/staging/src/k8s.io/client-go/tools/clientcmd/overrides.go:

	func BindOverrideFlags(overrides *ConfigOverrides, flags *pflag.FlagSet, flagNames ConfigOverrideFlags) {
	    BindAuthInfoFlags(&overrides.AuthInfo, flags, flagNames.AuthOverrideFlags)
	    BindClusterFlags(&overrides.ClusterInfo, flags, flagNames.ClusterOverrideFlags)
	    BindContextFlags(&overrides.Context, flags, flagNames.ContextOverrideFlags)
	    flagNames.CurrentContext.BindStringFlag(flags, &overrides.CurrentContext)
	    flagNames.Timeout.BindStringFlag(flags, &overrides.Timeout)
	}

只追踪一条线BindAuthInfoFlags

#### BindAuthInfoFlags()

	// BindAuthInfoFlags is a convenience method to bind the specified flags to their associated variables
	func BindAuthInfoFlags(authInfo *clientcmdapi.AuthInfo, flags *pflag.FlagSet, flagNames AuthOverrideFlags) {
	    flagNames.ClientCertificate.BindStringFlag(flags, &authInfo.ClientCertificate).AddSecretAnnotation(flags)
	    flagNames.ClientKey.BindStringFlag(flags, &authInfo.ClientKey).AddSecretAnnotation(flags)
	    flagNames.Token.BindStringFlag(flags, &authInfo.Token).AddSecretAnnotation(flags)
	    flagNames.Impersonate.BindStringFlag(flags, &authInfo.Impersonate).AddSecretAnnotation(flags)
	    flagNames.Username.BindStringFlag(flags, &authInfo.Username).AddSecretAnnotation(flags)
	    flagNames.Password.BindStringFlag(flags, &authInfo.Password).AddSecretAnnotation(flags)
	}

回退，找flagNames

#### flagName

k8s.io/kubernetes/pkg/kubectl/cmd/util/factory_client_access.go:

	flagNames := clientcmd.RecommendedConfigOverrideFlags("")
	// short flagnames are disabled by default.  These are here for compatibility with existing scripts
	flagNames.ClusterOverrideFlags.APIServer.ShortName = "s"

#### RecommendedConfigOverrideFlags()

k8s.io/kubernetes/pkg/kubectl/cmd/util/factory_client_access.go:

	func RecommendedConfigOverrideFlags(prefix string) ConfigOverrideFlags {
	    return ConfigOverrideFlags{
	        AuthOverrideFlags:    RecommendedAuthOverrideFlags(prefix),
	        ClusterOverrideFlags: RecommendedClusterOverrideFlags(prefix),
	        ContextOverrideFlags: RecommendedContextOverrideFlags(prefix),
	
	        CurrentContext: FlagInfo{prefix + FlagContext, "", "", "The name of the kubeconfig context to use"},
	        Timeout:        FlagInfo{prefix + FlagTimeout, "", "0", "The length of time to wait before giving up on a single server request. Non-zero values should contain a corresponding time unit (e.g. 1s, 2m, 3h). A value of zero means don't timeout requests."},
	    }
	}

#### Final

最后终于在RecommendedAuthOverrideFlags中找到了

	func RecommendedAuthOverrideFlags(prefix string) AuthOverrideFlags {
	    return AuthOverrideFlags{
	        ClientCertificate: FlagInfo{prefix + FlagCertFile, "", "", "Path to a client certificate file for TLS"},
	        ClientKey:         FlagInfo{prefix + FlagKeyFile, "", "", "Path to a client key file for TLS"},
	        Token:             FlagInfo{prefix + FlagBearerToken, "", "", "Bearer token for authentication to the API server"},
	        Impersonate:       FlagInfo{prefix + FlagImpersonate, "", "", "Username to impersonate for the operation"},
	        Username:          FlagInfo{prefix + FlagUsername, "", "", "Username for basic authentication to the API server"},
	        Password:          FlagInfo{prefix + FlagPassword, "", "", "Password for basic authentication to the API server"},
	    }
	}

	FlagClusterName  = "cluster"
	FlagAuthInfoName = "user"
	FlagContext      = "context"
	FlagNamespace    = "namespace"
	FlagAPIServer    = "server"
	FlagAPIVersion   = "api-version"
	FlagInsecure     = "insecure-skip-tls-verify"
	FlagCertFile     = "client-certificate"
	FlagKeyFile      = "client-key"
	FlagCAFile       = "certificate-authority"
	FlagEmbedCerts   = "embed-certs"
	FlagBearerToken  = "token"
	FlagImpersonate  = "as"
	FlagUsername     = "username"
	FlagPassword     = "password"
	FlagTimeout      = "request-timeout"

和`kubectl -h`中看到的参数是一一对应的.

####  FlagInfo绑定变量

上面看到ClientCertificate等的类型都是FlagInfo。

回忆之前看到的，k8s.io/kubernetes/pkg/kubectl/cmd/util/factory_client_access.go：

	overrides := &clientcmd.ConfigOverrides{ClusterDefaults: clientcmd.ClusterDefaults}
	clientcmd.BindOverrideFlags(overrides, flags, flagNames)
	clientConfig := clientcmd.NewInteractiveDeferredLoadingClientConfig(loadingRules, overrides, os.Stdin)
	return clientConfig

可以知道flagNames中的flag绑定到了overrides中对应的变量，而overrides最终放在clientconfig中被一同返回:

它的调用者就可以通过接口`ClientConfig`中的方法，读取配置了。

	type ClientConfig interface {
	    // RawConfig returns the merged result of all overrides
	    RawConfig() (clientcmdapi.Config, error)
	    // ClientConfig returns a complete client config
	    ClientConfig() (*restclient.Config, error)
	    // Namespace returns the namespace resulting from the merged
	    // result of all overrides and a boolean indicating if it was
	    // overridden
	    Namespace() (string, bool, error)
	    // ConfigAccess returns the rules for loading/persisting the config.
	    ConfigAccess() ConfigAccess
	}

clientConfig最后放在类型为ring0factory的变量中，来支持ring0factory实现接口，其中就包括将flags设置到cmds中。

但是！就是一个命令行参数设置！有必要搞得这么复杂吗！！！！！

## 子命令

子命令相对简单一些

k8s.io/kubernetes/pkg/kubectl/cmd/cmd.go:

	groups := templates.CommandGroups{
	    {
	        Message: "Basic Commands (Beginner):",
	        Commands: []*cobra.Command{
	            NewCmdCreate(f, out, err),
	            NewCmdExposeService(f, out),
	            NewCmdRun(f, in, out, err),
	            set.NewCmdSet(f, out, err),
	        },
	    },
	...
	groups.Add(cmds)

## 子命令RunCreate

k8s.io/kubernetes/pkg/kubectl/cmd/create.go:

	func RunCreate(f cmdutil.Factory, cmd *cobra.Command, out, errOut io.Writer, options *CreateOptions) error {

注意第一个参数，是用来读取各种配置、命令行参数的，需要仔细分析。

### cmdutil.Factory

cmdutil.Factory是一个接口。

k8s.io/kubernetes/pkg/kubectl/cmd/util/factory.go:

	type Factory interface {
		ClientAccessFactory
		ObjectMappingFactory
		BuilderFactory
	}

## 参考

1. [cobra-github][1]

[1]: https://github.com/spf13/cobra "https://github.com/spf13/cobra"
