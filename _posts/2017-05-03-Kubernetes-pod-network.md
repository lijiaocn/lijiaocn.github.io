---
layout: default
title: kubernetes的CNI插件初始化与Pod网络设置
author: 李佶澳
createdate: 2017/05/03 09:30:33
last_modified_at: 2017/09/12 14:46:40
categories: 项目
tags: kubernetes
keywords: kuberntes,pod,network
description: kubernetes的pod网络设置过程分析,pod的网络由kubelet负责在pod创建时设置。

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

CNI插件的加载是由kubelet完成的。

kubelet默认在`/etc/cni/net.d`目录寻找配置文件，在`/opt/bin/`目录中寻找二进制程序文件。

	kubelet \
		...
		--network-plugin=cni 
		--cni-conf-dir=/etc/cni/net.d 
		--cni-bin-dir=/opt/cni/bin 
		...

通过`--network-plugin`指定要使用的网络插件类型。

kubelet在启动容器的时候调用CNI插件，完成容器网络的设置。

## 网络插件加载前

k8s.io/kubernetes/cmd/kubelet/kubelet.go:

	if err := app.Run(s, nil); err != nil {

k8s.io/kubernetes/cmd/kubelet/app/server.go:

	if err := run(s, kubeDeps); err != nil {

k8s.io/kubernetes/cmd/kubelet/app/server.go, run():

	kubeDeps, err = UnsecuredKubeletDeps(s)

k8s.io/kubernetes/cmd/kubelet/app/server.go, UnsecuredKubeletDeps():

	NetworkPlugins:     ProbeNetworkPlugins(s.NetworkPluginDir, s.CNIConfDir, s.CNIBinDir),

k8s.io/kubernetes/cmd/kubelet/app/plugins.go:

	// ProbeNetworkPlugins collects all compiled-in plugins
	func ProbeNetworkPlugins(pluginDir, cniConfDir, cniBinDir string) []network.NetworkPlugin {
	    allPlugins := []network.NetworkPlugin{}
	
	    // for backwards-compat, allow pluginDir as a source of CNI config files
	    if cniConfDir == "" {
	        cniConfDir = pluginDir
	    }
	    // for each existing plugin, add to the list
	    allPlugins = append(allPlugins, cni.ProbeNetworkPlugins(cniConfDir, cniBinDir)...)
	    allPlugins = append(allPlugins, kubenet.NewPlugin(pluginDir))
	
	    return allPlugins
	}

这里将所有的插件都存放在了`NetworkPlugin`中。

第一个插件是`cni.ProbeNetworkPlugins()`创建的`cniNetworkPlugin`，pkg/kubelet/network/cni/cni.go:

	func probeNetworkPluginsWithVendorCNIDirPrefix(pluginDir, binDir, vendorCNIDirPrefix string) []network.NetworkPlugin {
		...
		plugin := &cniNetworkPlugin{
			defaultNetwork:     nil,
			loNetwork:          getLoNetwork(binDir, vendorCNIDirPrefix),
			execer:             utilexec.New(),
			pluginDir:          pluginDir,
			binDir:             binDir,
			vendorCNIDirPrefix: vendorCNIDirPrefix,
		}

		plugin.syncNetworkConfig()
		return []network.NetworkPlugin{plugin}
	}

第二个是`kubenet.NewPlugin()`创建的`kubenetNetworkPlugin`，pkg/kubelet/network/kubenet/kubenet_unsupported.go：

	func NewPlugin(networkPluginDir string) network.NetworkPlugin {
		return &kubenetNetworkPlugin{}
	}

这里主要分析第一个插件，也就是CNI插件加载和使用，记住它的类型是`cniNetworkPlugin`。

## CNI网络插件的加载

k8s.io/kubernetes/pkg/kubelet/network/cni/cni.go:

	func ProbeNetworkPlugins(pluginDir, binDir string) []network.NetworkPlugin {
		return probeNetworkPluginsWithVendorCNIDirPrefix(pluginDir, binDir, "")
	}

k8s.io/kubernetes/pkg/kubelet/network/cni/cni.go，probeNetworkPluginsWithVendorCNIDirPrefix():

	func probeNetworkPluginsWithVendorCNIDirPrefix(pluginDir, binDir, vendorCNIDirPrefix string) []network.NetworkPlugin {
		if binDir == "" {
			binDir = DefaultCNIDir
		}
		plugin := &cniNetworkPlugin{
			defaultNetwork:     nil,
			loNetwork:          getLoNetwork(binDir, vendorCNIDirPrefix),
			execer:             utilexec.New(),
			pluginDir:          pluginDir,
			binDir:             binDir,
			vendorCNIDirPrefix: vendorCNIDirPrefix,
		}
		// sync NetworkConfig in best effort during probing.
		plugin.syncNetworkConfig()
		return []network.NetworkPlugin{plugin}
	}

## 加载CNI插件的配置

k8s.io/kubernetes/pkg/kubelet/network/cni/cni.go:

	func (plugin *cniNetworkPlugin) syncNetworkConfig() {
		network, err := getDefaultCNINetwork(plugin.pluginDir, plugin.binDir, plugin.vendorCNIDirPrefix)
		if err != nil {
			glog.Warningf("Unable to update cni config: %s", err)
			return
		}
		plugin.setDefaultNetwork(network)
	}

加载配置文件，k8s.io/kubernetes/pkg/kubelet/network/cni/cni.go:

	func getDefaultCNINetwork(pluginDir, binDir, vendorCNIDirPrefix string) (*cniNetwork, error) {
		...
		//从pluginDir目录中读取所有.conf文件
		files, err := libcni.ConfFiles(pluginDir)
		...
		for _, confFile := range files {
			conf, err := libcni.ConfFromFile(confFile)
			if err != nil {
				glog.Warningf("Error loading CNI config file %s: %v", confFile, err)
				continue
			}
			vendorDir := vendorCNIDir(vendorCNIDirPrefix, conf.Network.Type)
			cninet := &libcni.CNIConfig{
				Path: []string{binDir, vendorDir},
			}
			network := &cniNetwork{name: conf.Network.Name, NetworkConfig: conf, CNIConfig: cninet}
			return network, nil
		}
		...

注意上面的for循环中，找到一个可用的插件即返回，`vendorDir`指定了插件程序的路径。

	VendorCNIDirTemplate = "%s/opt/%s/bin"   //第一个%s是前缀，第二个%s是conf.Network.Type

得到的插件的类型是`cniNetwork`，pkg/kubelet/network/cni/cni.go

	type cniNetwork struct {
		name          string
		NetworkConfig *libcni.NetworkConfig
		CNIConfig     libcni.CNI
	}

## CNI的配置文件

Bytes是配置文件的原始内容，Network是从配置文件中解读出的，vendor/github.com/containernetworking/cni/libcni/api.go：

	type NetworkConfig struct {
		Network *types.NetConf
		Bytes   []byte
	}
	
	type NetConf struct {
		Name string `json:"name,omitempty"`
		Type string `json:"type,omitempty"`
		IPAM struct {
			Type string `json:"type,omitempty"`
		} `json:"ipam,omitempty"`
		DNS DNS `json:"dns"`
	}

	type DNS struct {
		Nameservers []string `json:"nameservers,omitempty"`
		Domain      string   `json:"domain,omitempty"`
		Search      []string `json:"search,omitempty"`
		Options     []string `json:"options,omitempty"`
	}

这是在[cni][1]项目中定义的，配置文件的内容保存在Bytes中，因此具体的CNI插件可能会再次解读配置文件。

## 网络插件初始化

前面的过程结束后，kubeDeps.NetworkPlugins中就设置好了指定的插件。

在k8s.io/kubernetes/pkg/kubelet/kubelet.go，NewMainKubelet()中:

	if plug, err := network.InitNetworkPlugin(kubeDeps.NetworkPlugins, 
	        kubeCfg.NetworkPluginName, 
	        &criNetworkHost{&networkHost{klet}, &network.NoopPortMappingGetter{}}, 
	        klet.hairpinMode, 
	        klet.nonMasqueradeCIDR, 
	        int(kubeCfg.NetworkPluginMTU)); err != nil {

k8s.io/kubernetes/pkg/kubelet/network/plugins.go, InitNetworkPlugin()

	func InitNetworkPlugin(plugins []NetworkPlugin, networkPluginName string, host Host, hairpinMode componentconfig.HairpinMode, nonMasqueradeCIDR string, mtu int) (NetworkPlugin, error) {
		...
		chosenPlugin := pluginMap[networkPluginName]
		if chosenPlugin != nil {
			err := chosenPlugin.Init(host, hairpinMode, nonMasqueradeCIDR, mtu)
		...

这里的`networkPluginName`，也就是`kubeCfg.NetworkPluginName`，是kubelet的配置参数中指定的，`cniNetworkPlugin`的name是`cni`，pkg/kubelet/network/cni/cni.go:

	...
	CNIPluginName        = "cni"
	...
	
	func (plugin *cniNetworkPlugin) Name() string {
		return CNIPluginName
	}

这里只分析cni插件，`chosenPlugin.Init()`实际上是`cniNetworkPlugin.Init()`，pkg/kubelet/network/cni/cni.go：

	func (plugin *cniNetworkPlugin) Init(host network.Host, hairpinMode componentconfig.HairpinMode, nonMasqueradeCIDR string, mtu int) error {
		var err error
		plugin.nsenterPath, err = plugin.execer.LookPath("nsenter")
		if err != nil {
			return err
		}
		plugin.host = host

		plugin.syncNetworkConfig()
		return nil
	}

这里设置了命令`nsenter`的路径和host，最后执行的`plugin.syncNetworkConfig()`其实在前面创建插件的时候已经调用过一次，应当是可以去掉的。

## CNI网络插件的使用

cniNetworkPlugin的定义:

	--cniNetworkPlugin : struct
	    [fields]
	   -binDir : string
	   -defaultNetwork : *cniNetwork
	   -execer : utilexec.Interface
	   -host : network.Host
	   -loNetwork : *cniNetwork
	   -nsenterPath : string        //二进制文件nsenter的路径
	   -pluginDir : string
	   -vendorCNIDirPrefix : string
	    [embedded]
	   +network.NoopNetworkPlugin : network.NoopNetworkPlugin
	   +sync.RWMutex : sync.RWMutex
	    [methods]
	   +GetPodNetworkStatus(namespace string, name string, id kubecontainer.ContainerID) : *network.PodNetworkStatus, error
	   +Init(host network.Host, hairpinMode componentconfig.HairpinMode, nonMasqueradeCIDR string, mtu int) : error
	   +Name() : string
	   +SetUpPod(namespace string, name string, id kubecontainer.ContainerID, annotations map[string]string) : error
	   +Status() : error
	   +TearDownPod(namespace string, name string, id kubecontainer.ContainerID) : error
	   -checkInitialized() : error
	   -getDefaultNetwork() : *cniNetwork
	   -setDefaultNetwork(n *cniNetwork)
	   -syncNetworkConfig()

`Init()`用于初始化，`setUpPod`用于设置容器的网络，重点关注setUpPod。

### SetUpPod()

SetUpPod()的参数分别是namespace,容器的name, pause容器的ID，注解。

这里必须要说明一下，k8s中的pod至少是包含两个容器的，其中一个容器作为infra容器，同一个pod中的其它容器和infra容器共享一个网络ns。

创建pod的时候，kubelet首先创建infra容器，得到infra容器的ID，然后创建其它容器。

k8s.io/kubernetes/pkg/kubelet/dockertools/docker_manager.go:

	// If we should create infra container then we do it first.
	podInfraContainerID := containerChanges.InfraContainerId
	if containerChanges.StartInfraContainer && (len(containerChanges.ContainersToStart) > 0) {
		...
		podInfraContainerID, err, msg = dm.createPodInfraContainer(pod)
		...
		if !kubecontainer.IsHostNetworkPod(pod) {
			if err := dm.network.SetUpPod(pod.Namespace, pod.Name, podInfraContainerID.ContainerID(), pod.Annotations); err != nil {
				setupNetworkResult.Fail(kubecontainer.ErrSetupNetwork, err.Error())
				glog.Error(err)

				// Delete infra container
	...

在SetUpPod中为podInfraContainerID设置网络。

## 将容器加入指定网络

每个plugin都有一个类型为`defaultNetwork`的成员cniNetwork, pkg/kubelet/network/cni/cni.go:

	defaultNetwork *cniNetwork

这个类型为`cniNetwork`的`defaultNetwork`，就是前面在加载CNI配置文件时候创建的。

容器网络的设置的工作，是由`plugin.getDefaultNetwork()`得到的`defaultNetwork`完成的，pkg/kubelet/network/cni/cni.go

	func (plugin *cniNetworkPlugin) SetUpPod(namespace string, name string, id kubecontainer.ContainerID, annotations map[string]string) error {
		...
		netnsPath, err := plugin.host.GetNetNS(id.ID)
		...
		_, err = plugin.loNetwork.addToNetwork(name, namespace, id, netnsPath)
		...
		_, err = plugin.getDefaultNetwork().addToNetwork(name, namespace, id, netnsPath)
		...
		return err
	}

pkg/kubelet/network/cni/cni.go，addToNetwork():

	func (network *cniNetwork) addToNetwork(podName string, podNamespace string, \
	podInfraContainerID kubecontainer.ContainerID, podNetnsPath string) (*cnitypes.Result, error) {
	...
	netconf, cninet := network.NetworkConfig, network.CNIConfig
	glog.V(4).Infof("About to run with conf.Network.Type=%v", netconf.Network.Type)
	res, err := cninet.AddNetwork(netconf, rt)
	...

可以看到使用的是成员`cniNetwork.CNIConfig.AddNetwork()`。

回顾一下前面cniNetwork的创建过程：

`defaultNetwork`在pkg/kubelet/network/cni/cni.go，getDefaultCNINetwork()中创建:

		vendorDir := vendorCNIDir(vendorCNIDirPrefix, conf.Network.Type)
		cninet := &libcni.CNIConfig{
			Path: []string{binDir, vendorDir},
		}
		network := &cniNetwork{name: conf.Network.Name, NetworkConfig: conf, CNIConfig: cninet}
		return network, nil

可以看到成员CNIConfig类型为`libcni.CNIConfig`，并且包括两个路径`binDir`和`vendorDir`。

在下面可以看到，`Addnetwork()`回到路径下寻找与网络类型同名的二进制程序，并用来完成最后的操作。

## libcni.CNIConfig

vendor/github.com/containernetworking/cni/libcni/api.go:

	func (c *CNIConfig) AddNetwork(net *NetworkConfig, rt *RuntimeConf) (*types.Result, error) {
		pluginPath, err := invoke.FindInPath(net.Network.Type, c.Path)
		...
		return invoke.ExecPluginWithResult(pluginPath, net.Bytes, c.args("ADD", rt))
	}

invoke.FindInPath在c.Path目录下寻找名为net.Network.Type的二进制文件，返回文件的完整路径pluginPath。

最后，直接运行程序文件，运行时参数为`ADD XXX`。

## CNI支持的网络

[cni][1]中列出了支持的网络类型:

	Project Calico - a layer 3 virtual network
	Weave - a multi-host Docker network
	Contiv Networking - policy networking for various use cases
	SR-IOV
	Cilium - BPF & XDP for containers
	Infoblox - enterprise IP address management for containers
	Multus - a Multi plugin
	Romana - Layer 3 CNI plugin supporting network policy for kubernetes
	CNI-Genie - generic CNI network plugin
	Nuage CNI - Nuage Networks SDN plugin for network policy kubernetes support
	Silk - a CNI plugin designed for Cloud Foundry
	Linen - a CNI plugin designed for overlay networks with Open vSwitch and fit 
            in SDN/OpenFlow network environment

## 参考

1. [cni][1]

[1]: cni "https://github.com/containernetworking/cni/blob/master/pkg/types/types.go#L7"
