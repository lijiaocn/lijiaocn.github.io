---
layout: default
title: Kubernets中的cloudprovider
author: lijiaocn
createdate: 2017/06/22 14:05:20
changedate: 2017/06/23 10:11:29
categories: 项目
tags: k8s
keywords:cloudprivider,kubernetes
description:  k8s自身定位为容器管理、编排系统，可以支持多个IaaS平台。

---

* auto-gen TOC:
{:toc}

K8S社区正在重构这部分的代码，将cloudprovider代码剥离，以二进制程序插件的形式提供。

## 组件

kubelet、apiserver、controller-manager、cloud-controller-manager都会在不同的场合使用到cloudprovider:

## 接口定义 

cloudprovider的接口定义和不同云平台的实现文件在pkg/cloudprovider目录中。

pkg/cloudprovider/cloud.go定义了插件的应当实现的接口:

	-+Interface : interface
	   [methods]
	   +Clusters() : Clusters, bool
	   +Instances() : Instances, bool
	   +LoadBalancer() : LoadBalancer, bool
	   +ProviderName() : string
	   +Routes() : Routes, bool
	   +ScrubDNS(nameservers, searches []string) : []string, []string
	   +Zones() : Zones, bool
	...

pkg/cloudprovider/plugins.go中统一管理所有的插件:

	- functions
	   +CloudProviders() : []string
	   +GetCloudProvider(name string, config io.Reader) : Interface, error
	   +InitCloudProvider(name string, configFilePath string) : Interface, error
	   +IsCloudProvider(name string) : bool
	   +IsExternal(name string) : bool
	   +RegisterCloudProvider(name string, cloud Factory)

每个插件初始化时，将自身注册，例如aws:

pkg/cloudprovider/providers/aws/aws.go:

	func init() {
		cloudprovider.RegisterCloudProvider(ProviderName, func(config io.Reader) (cloudprovider.Interface, error) {
			creds := credentials.NewChainCredentials(
				[]credentials.Provider{
					&credentials.EnvProvider{},
					&ec2rolecreds.EC2RoleProvider{
						Client: ec2metadata.New(session.New(&aws.Config{})),
					},
					&credentials.SharedCredentialsProvider{},
				})
			aws := newAWSSDKProvider(creds)
			return newAWSCloud(config, aws)
		})
	}

## apiserver

pkg/kubeapiserver/options/cloudprovider.go:45:

	fs.StringVar(&s.CloudProvider, "cloud-provider", s.CloudProvider,

apiserver主要是在代理请求的时候，会通过cloudprovider在所有的instances上安装证书:

k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:

	func BuildMasterConfig(s *options.ServerRunOptions) (*master.Config, informers.SharedInformerFactory, error) {
		...
		if len(s.SSHUser) > 0 {
			// Get ssh key distribution func, if supported
			var installSSHKey tunneler.InstallSSHKey
			cloud, err := cloudprovider.InitCloudProvider(s.CloudProvider.CloudProvider, s.CloudProvider.CloudConfigFile)
			if err != nil {
				return nil, nil, fmt.Errorf("cloud provider could not be initialized: %v", err)
			}
			if cloud != nil {
				if instances, supported := cloud.Instances(); supported {
					installSSHKey = instances.AddSSHKeyToAllInstances
				}
			}
		...
	
## kubelet

cmd/kubelet/app/options/options.go:185:

	fs.StringVar(&s.CloudProvider, "cloud-provider", s.CloudProvider, "The provider for cloud services. \
	    By default, kubelet will attempt to auto-detect the cloud provider. Specify empty string for running with no cloud provider. [default=auto-detect]")

cmd/kubelet/app/server.go:

	func run(s *options.KubeletServer, kubeDeps *kubelet.KubeletDeps) (err error) {
		if !cloudprovider.IsExternal(s.CloudProvider) && s.CloudProvider != componentconfigv1alpha1.AutoDetectCloudProvider {
			cloud, err = cloudprovider.InitCloudProvider(s.CloudProvider, s.CloudConfigFile)
		...
		nodeName, err := getNodeName(cloud, nodeutil.GetHostname(s.HostnameOverride))
		kubeDeps.Cloud = cloud

## kube-controller-manager

cmd/kube-controller-manager/app/options/options.go:124:

	fs.StringVar(&s.CloudProvider, "cloud-provider", s.CloudProvider, "The provider for cloud services.  Empty string for no provider.")

kube-controller-manager在创建部分controller的时候会传入cloud插件。

cmd/kube-controller-manager/app/controllermanager.go:

	func StartControllers(s *options.CMServer, kubeconfig *restclient.Config, \
			rootClientBuilder, clientBuilder controller.ControllerClientBuilder, \
			stop <-chan struct{}, recorder record.EventRecorder) error {
		...
		cloud, err := cloudprovider.InitCloudProvider(s.CloudProvider, s.CloudConfigFile)
		...
		nodeController, err := nodecontroller.NewNodeController(
			sharedInformers.Pods(), sharedInformers.Nodes(), sharedInformers.DaemonSets(),
			cloud, client("node-controller"),
			s.PodEvictionTimeout.Duration, s.NodeEvictionRate, s.SecondaryNodeEvictionRate, s.LargeClusterSizeThreshold, s.UnhealthyZoneThreshold, s.NodeMonitorGracePeriod.Duration,
			s.NodeStartupGracePeriod.Duration, s.NodeMonitorPeriod.Duration, clusterCIDR, serviceCIDR,
			int(s.NodeCIDRMaskSize), s.AllocateNodeCIDRs)
		...
		serviceController, err := servicecontroller.New(cloud, client("service-controller"), s.ClusterName)
		...
		routeController := routecontroller.New(routes, client("route-controller"), s.ClusterName, clusterCIDR)
		routeController.Run(s.RouteReconciliationPeriod.Duration)
		...
		alphaProvisioner, err := NewAlphaVolumeProvisioner(cloud, s.VolumeConfiguration)
		params := persistentvolumecontroller.ControllerParameters{
			KubeClient:                client("persistent-volume-binder"),
			SyncPeriod:                s.PVClaimBinderSyncPeriod.Duration,
			AlphaProvisioner:          alphaProvisioner,
			VolumePlugins:             ProbeControllerVolumePlugins(cloud, s.VolumeConfiguration),
			Cloud:                     cloud,
			ClusterName:               s.ClusterName,
			EnableDynamicProvisioning: s.VolumeConfiguration.EnableDynamicProvisioning,
		}
		volumeController := persistentvolumecontroller.NewController(params)
		attachDetachController, attachDetachControllerErr :=
			attachdetach.NewAttachDetachController(
				client("attachdetach-controller"),
				sharedInformers.Pods().Informer(),
				sharedInformers.Nodes().Informer(),
				sharedInformers.PersistentVolumeClaims().Informer(),
				sharedInformers.PersistentVolumes().Informer(),
				cloud,
				ProbeAttachableVolumePlugins(s.VolumeConfiguration),
				recorder,
				s.DisableAttachDetachReconcilerSync,
				s.ReconcilerSyncLoopPeriod.Duration,
			)
		...

## cloud-controller-manager

cmd/cloud-controller-manager/app/options/options.go:

	func (s *CloudControllerManagerServer) AddFlags(fs *pflag.FlagSet) {
		...
		fs.StringVar(&s.CloudProvider, "cloud-provider", s.CloudProvider, "The provider of cloud services. Empty for no provider.")
		fs.StringVar(&s.CloudConfigFile, "cloud-config", s.CloudConfigFile, "The path to the cloud provider configuration file.  Empty string for no configuration file.")
		...

cmd/cloud-controller-manager/controller-manager.go:

	func main() {
		...
		cloud, err := cloudprovider.InitCloudProvider(s.CloudProvider, s.CloudConfigFile)
		...
		if err := app.Run(s, cloud); err != nil {
		...

cloud-controller-manager/app/controllermanager.go:

	func StartControllers(s *options.CloudControllerManagerServer, kubeconfig *restclient.Config,\
			rootClientBuilder, clientBuilder controller.ControllerClientBuilder, stop <-chan struct{}, \
			recorder record.EventRecorder, cloud cloudprovider.Interface) error {
		...
		nodeController, err := nodecontroller.NewCloudNodeController(
			sharedInformers.Core().V1().Nodes(),
			client("cloud-node-controller"), cloud,
			s.NodeMonitorPeriod.Duration)
		serviceController, err := servicecontroller.New(
			cloud,
			client("service-controller"),
			sharedInformers.Core().V1().Services(),
			sharedInformers.Core().V1().Nodes(),
			s.ClusterName,
		)
		...

## 参考

1. [文献1][1]
2. [文献2][2]

[1]: 1.com  "文献1" 
[2]: 2.com  "文献1" 
