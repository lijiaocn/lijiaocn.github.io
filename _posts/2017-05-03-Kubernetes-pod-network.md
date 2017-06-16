---
layout: default
title: Kubernetes的Pod网络设置
author: lijiaocn
createdate: 2017/05/03 09:30:33
changedate: 2017/06/13 11:27:23
categories: 项目
tags: k8s
keywords: kuberntes,pod,network
description: kubernetes的pod网络设置过程分析,pod的网络由kubelet负责在pod创建时设置。

---

* auto-gen TOC:
{:toc}

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

## 网络插件加载

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

## 读取cni配置文件，设置默认网络

k8s.io/kubernetes/pkg/kubelet/network/cni/cni.go:

	func (plugin *cniNetworkPlugin) syncNetworkConfig() {
		network, err := getDefaultCNINetwork(plugin.pluginDir, plugin.binDir, plugin.vendorCNIDirPrefix)
		if err != nil {
			glog.Warningf("Unable to update cni config: %s", err)
			return
		}
		plugin.setDefaultNetwork(network)
	}

k8s.io/kubernetes/pkg/kubelet/network/cni/cni.go, getDefaultCNINetwork():

	//从pluginDir目录中读取所有.conf文件
	files, err := libcni.ConfFiles(pluginDir)
	...
	for _, confFile := range files {
		conf, err := libcni.ConfFromFile(confFile)
		if err != nil {
			glog.Warningf("Error loading CNI config file %s: %v", confFile, err)
			continue
		}
		// Search for vendor-specific plugins as well as default plugins in the CNI codebase.
		vendorDir := vendorCNIDir(vendorCNIDirPrefix, conf.Network.Type)
		cninet := &libcni.CNIConfig{
			Path: []string{binDir, vendorDir},
		}
		network := &cniNetwork{name: conf.Network.Name, NetworkConfig: conf, CNIConfig: cninet}
		return network, nil
	}
	...

配置文件的格式为:

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

	chosenPlugin := pluginMap[networkPluginName]
	if chosenPlugin != nil {
		err := chosenPlugin.Init(host, hairpinMode, nonMasqueradeCIDR, mtu)

直接调用的`cniNetworkPlugin`的Init()函数:

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

## 网络插件的使用

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
		glog.V(4).Infof("Creating pod infra container for %q", format.Pod(pod))
		startContainerResult := kubecontainer.NewSyncResult(kubecontainer.StartContainer, PodInfraContainerName)
		result.AddSyncResult(startContainerResult)
		var msg string
		podInfraContainerID, err, msg = dm.createPodInfraContainer(pod)
		if err != nil {
			startContainerResult.Fail(err, msg)
			glog.Errorf("Failed to create pod infra container: %v; Skipping pod %q: %s", err, format.Pod(pod), msg)
			return
		}

		setupNetworkResult := kubecontainer.NewSyncResult(kubecontainer.SetupNetwork, kubecontainer.GetPodFullName(pod))
		result.AddSyncResult(setupNetworkResult)
		if !kubecontainer.IsHostNetworkPod(pod) {
			if err := dm.network.SetUpPod(pod.Namespace, pod.Name, podInfraContainerID.ContainerID(), pod.Annotations); err != nil {
				setupNetworkResult.Fail(kubecontainer.ErrSetupNetwork, err.Error())
				glog.Error(err)

				// Delete infra container
	......

所以在SetUpPod中设置好podInfraContainerID的网络即可。

## 将容器加入指定网络的实现

每个plugin都有一个类型为`defaultNetwork`的成员cniNetwork,k8s.io/kubernetes/pkg/kubelet/network/cni/cni.go:

	defaultNetwork *cniNetwork

加入、推出网络都是调用defaultNetwork的成员函数，k8s.io/kubernetes/pkg/kubelet/network/cni/cni.go

	func (plugin *cniNetworkPlugin) SetUpPod(namespace string, name string, id kubecontainer.ContainerID, annotations map[string]string) error {
		if err := plugin.checkInitialized(); err != nil {
			return err
		}
		netnsPath, err := plugin.host.GetNetNS(id.ID)
		if err != nil {
			return fmt.Errorf("CNI failed to retrieve network namespace path: %v", err)
		}

		_, err = plugin.loNetwork.addToNetwork(name, namespace, id, netnsPath)
		if err != nil {
			glog.Errorf("Error while adding to cni lo network: %s", err)
			return err
		}

		_, err = plugin.getDefaultNetwork().addToNetwork(name, namespace, id, netnsPath)
		if err != nil {
			glog.Errorf("Error while adding to cni network: %s", err)
			return err
		}

		return err
	}

k8s.io/kubernetes/pkg/kubelet/network/cni/cni.go，addToNetwork:

	netconf, cninet := network.NetworkConfig, network.CNIConfig
	glog.V(4).Infof("About to run with conf.Network.Type=%v", netconf.Network.Type)
	res, err := cninet.AddNetwork(netconf, rt)

可以看到最终使用的是成员CNIConfig的AddNetwork()完成的。

`defaultNetwork`在k8s.io/kubernetes/pkg/kubelet/network/cni/cni.go，getDefaultCNINetwork()中创建:

		vendorDir := vendorCNIDir(vendorCNIDirPrefix, conf.Network.Type)
		cninet := &libcni.CNIConfig{
			Path: []string{binDir, vendorDir},
		}
		network := &cniNetwork{name: conf.Network.Name, NetworkConfig: conf, CNIConfig: cninet}
		return network, nil

cninet的类型是libcni.CNIConfig:

## libcni.CNIConfig

k8s.io/kubernetes/vendor/github.com/containernetworking/cni/libcni/api.go:

	func (c *CNIConfig) AddNetwork(net *NetworkConfig, rt *RuntimeConf) (*types.Result, error) {
		pluginPath, err := invoke.FindInPath(net.Network.Type, c.Path)
		if err != nil {
			return nil, err
		}
		
		return invoke.ExecPluginWithResult(pluginPath, net.Bytes, c.args("ADD", rt))
	}

invoke.FindInPath在c.Path目录下寻找名为net.Network.Type的文件，返回文件的完整路径pluginPath

最后，直接使用plugin的子命令`ADD`，将容器添加到指定网络中。
