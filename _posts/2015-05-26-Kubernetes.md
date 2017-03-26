---
layout: default
title: Kubernetes

---

# Kubernetes

创建时间: 2015/05/27 13:29:37  修改时间: 2017/01/05 22:23:27 作者:lijiao

----

## 摘要

## CentOS yum安装all in one

安装：

	yum install -y epel-release
	yum install -y etcd
	yum install -y kubernetes

查看安装的版本：

	$rpm -qa|grep kubernetes
	kubernetes-client-1.3.0-0.3.git86dc49a.el7.x86_64
	kubernetes-node-1.3.0-0.3.git86dc49a.el7.x86_64
	kubernetes-master-1.3.0-0.3.git86dc49a.el7.x86_64
	kubernetes-1.3.0-0.3.git86dc49a.el7.x86_64

启动：

	sudo systemctl start etcd            //localhost:2379
	sudo systemctl start kube-apiserver  //localhost:8080
	sudo systemctl start kube-controller-manager
	sudo systemctl start kube-scheduler
	sudo systemctl start kubelet

查看组件状态：

	$ kubectl  get  componentstatuses
	NAME                 STATUS    MESSAGE              ERROR
	scheduler            Healthy   ok
	controller-manager   Healthy   ok
	etcd-0               Healthy   {"health": "true"}

查看节点状态：

	$ kubectl  get  nodes
	NAME        STATUS    AGE
	127.0.0.1   Ready     33s

## Pkg说明

v1.0.0

	pkg/capabilities/    设置k8s、用户可用的系统权限
	pkg/cloudprovider/   第三方云服务的接口
	pkg/client/          api-server、kubelet的client
	                     helper.go: client的通用属性
	pkg/util/
	pkg/master/
	pkg/latest
	pkg/tools            etcd的使用封装,将会被移动etc util
	pkg/apiserver        rest.ful api service
	pkg/serviceaccount
	pkg/admission        准入控制插件
	pkg/auth             
	pkg/auth/authorizer  授权
	pkg/registry         实现api server的主要逻辑
	pkg/registry/generic/
	pkg/api              api objectes as represented in memory
	pkg/runtime

第三方pkg:

	github.com/coreos/go-etcd/etcd    

## 数据存储

k8s的数据存储在etcd中

/pods
/podtemplates
/events
/limitranges
/resourcequotas
/secrets
/serviceaccounts
/persistentvolumes
/persistentvolumeclaims
/namespaces
/services/endpoints
/minions

	m.storage = map[string]rest.Storage{
		"pods":             podStorage.Pod,
		"pods/status":      podStorage.Status,
		"pods/log":         podStorage.Log,
		"pods/exec":        podStorage.Exec,
		"pods/portforward": podStorage.PortForward,
		"pods/proxy":       podStorage.Proxy,
		"pods/binding":     podStorage.Binding,
		"bindings":         podStorage.Binding,

		"podTemplates": podTemplateStorage,

		"replicationControllers": controllerStorage,
		"services":               service.NewStorage(m.serviceRegistry, m.nodeRegistry, m.endpointRegistry, serviceClusterIPAllocator, serviceNodePortAllocator, c.ClusterName),
		"endpoints":              endpointsStorage,
		"minions":                nodeStorage,
		"minions/status":         nodeStatusStorage,
		"nodes":                  nodeStorage,
		"nodes/status":           nodeStatusStorage,
		"events":                 event.NewStorage(eventRegistry),

		"limitRanges":                   limitrange.NewStorage(limitRangeRegistry),
		"resourceQuotas":                resourceQuotaStorage,
		"resourceQuotas/status":         resourceQuotaStatusStorage,
		"namespaces":                    namespaceStorage,
		"namespaces/status":             namespaceStatusStorage,
		"namespaces/finalize":           namespaceFinalizeStorage,
		"secrets":                       secretStorage,
		"serviceAccounts":               serviceAccountStorage,
		"persistentVolumes":             persistentVolumeStorage,
		"persistentVolumes/status":      persistentVolumeStatusStorage,
		"persistentVolumeClaims":        persistentVolumeClaimStorage,
		"persistentVolumeClaims/status": persistentVolumeClaimStatusStorage,

		"componentStatuses": componentstatus.NewStorage(func() map[string]apiserver.Server { return m.getServersToValidate(c) }),
	}
	
## Rest API实现

pkg/api




## kube-apiserver

2015-07-22 22:48:08  release-1.0.0  cmd/kube-apiserver

kube-apiserver实现了K8s的API，是K8s不可缺的核心。

程序的启动过程和K8s其它的程序一致, 主要逻辑全部在cmd/kube-apiserver/app/中。

main函数中调用APIServer的Run()方法，开始正式的工作。

命令行参数通过APISserver的AddFlags()方法解析。

kube-apiserver需要的所有的信息被打包到了结构体APIServer中:

	// APIServer runs a kubernetes api server.
	type APIServer struct {
		InsecureBindAddress        util.IP               //HTTP地址,   default 8080
		InsecurePort               int                   //HTTP端口,   default 127.0.0.1
		                                                 //Insecurebindaddress:InsecurePort
		BindAddress                util.IP               //HTTPS地址,  default 0.0.0.0
		                                                 //--read-only-port和--secure-port将绑定在
		                                                  这个地址上,该地址需要能够被其它节点访问
		AdvertiseAddress           util.IP               //default=BindAddress
			//公开服务地址
		SecurePort                 int                   //HTTPS端口,  default 6443
		                                                 //BindAddress:SecurePort
		ExternalHost               string                //对外的Hostname,通过这个Hostname访问
			//运行apiserver的云中实例的外部IP
		APIRate                    float32               //default 10.0
		APIBurst                   int                   //default 200
		TLSCertFile                string                //证书
		    //如果没有指定，自动生成CertDirectory/apiserver.crt
		TLSPrivateKeyFile          string                //私钥
		    //如果没有指定，自动生成CertDirectory/apiserver.key
		CertDirectory              string                //default "/var/run/kubernetes"
		                                                 //apiserver.crt
		                                                 //apiserver.key
		APIPrefix                  string                //default "/api"
		StorageVersion             string                //?the Version to store resources with
		CloudProvider              string                //第三方云服务, aws,fake,gce,mesos,openstack
		                                                 //ovirt,rackspace
		CloudConfigFile            string
		EventTTL                   time.Duration         //default 1 hour
		     //Amount of time to retain events. 事件留存时间
		BasicAuthFile              string                //basic-auth-file ??
		                                                 //request需要通过http basic authentication
		    //password file '%s' must have at least 3 columns (password, user name, user uid)
		ClientCAFile               string                //client-ca-file
		    //用来验证client端证书的根证书
		TokenAuthFile              string                //token authentication??
			//token file '%s' must have at least 3 columns (token, user name, user uid)
		ServiceAccountKeyFile      string                //用于验证token的key, 
		                                                 //默认等于TLSPrivateKeyFile
		ServiceAccountLookup       bool
			//If true, validate ServiceAccount tokens exist in etcd as part of authentication
		AuthorizationMode          string                //default "AlwaysAllow" "AlwaysDeny" "ABAC"
			                                             //授权模式
		AuthorizationPolicyFile    string
			//File with authorization policy in csv format
			//used with --authorization-mode=ABAC, on the secure port
			//{"user":"scheduler", "group":"", "readonly": true, "resource": "pods", "namespace":""}
		AdmissionControl           string                //default "AlwaysAdmit"
			//Ordered list of plug-ins to do admission control of resources into cluster.
		AdmissionControlConfigFile string                //AdmissionControl的配置文件
			//File with admission control configuration
		EtcdServerList             util.StringList
		EtcdConfigFile             string                //--etcd-servers or --etcd-config
		EtcdPathPrefix             string                //default "/registry"
		OldEtcdPathPrefix          string                //要被替代的EtcdPathPrefix
		CorsAllowedOriginList      util.StringList
			//List of allowed origins for CORS, comma separated.  
			//An allowed origin can be a regular expression to support subdomain matching.  
			//If this list is empty CORS will not be enabled.
		AllowPrivileged            bool
		ServiceClusterIPRange      util.IPNet            //必须设置, "--service-cluster-ip-range"
		ServiceNodePortRange       util.PortRange
			//A port range to reserve for services with NodePort visibility.  
			//Example: '30000-32767'.  Inclusive at both ends of the range.
		EnableLogsSupport          bool                  //default true
		MasterServiceNamespace     string                //default "default"
			//The namespace from which the kubernetes master services should be injected into pods
		RuntimeConfig              util.ConfigurationMap //default empty: map[string]string
			//"api/all":"false"     -- allow users to selectively enable specific api version
			//"api/legacy":"false"  -- allow users to disable legacy api versions
			//"api/v1beta3":"false" -- v1beta3 is disabled by default
			//"api/v1":"true|false" -- allow users to enable/disable v1 API
		                                                 //"api/legacy":
		KubeletConfig              client.KubeletConfig  //{Port:10250, EnableHttps:true, HTTPTimeout5s}
		ClusterName                string                //default "kubernetes"
		EnableProfiling            bool
			//Enable profiling via web interface host:port/debug/pprof/
		MaxRequestsInFlight        int                   //同时处理的请求的最大数目, default 400
		MinRequestTimeout          int
			//An optional field indicating the minimum number of seconds a handler 
			//must keep a request open before timing it out
		LongRunningRequestRE       string                //用正则表达式描述耗时长的请求
		             //"(/|^)((watch|proxy)(/|$)|(logs|portforward|exec)/?$)"

		SSHUser                    string
			//If non-empty, use secure SSH proxy to the nodes, using this user name
		SSHKeyfile                 string
			//If non-empty, use secure SSH proxy to the nodes, using this user keyfile
	}

### 请求处理

kube-apiserver会在两个地址上提供服务，一个是SecureAddress，一个是InsecureAddress。

SecureAddress的Handler:

	Handler: apiserver.MaxInFlightLimit(sem, longRunningRE, apiserver.RecoverPanics(m.Handler)),

Insecureaddress的Handler:

	Handler: apiserver.RecoverPanics(m.InsecureHandler),

可以看到两个handler(m.Handler和m.InsecureHandler)都是m的成员, m的定义在pkg/master中。

Master的定义:

	// Master contains state for a Kubernetes cluster master/api server.
	type Master struct {
		// "Inputs", Copied from Config
		serviceClusterIPRange *net.IPNet          //default: 10.0.0.0/24
		serviceNodePortRange  util.PortRange      //default: 30000-32768
		cacheTimeout          time.Duration       
			// Control the interval that pod, node IP, and node heath status caches  expire.
		minRequestTimeout     time.Duration
			// If specified, requests will be allocated a random timeout between this value, 
			// and twice this value.
			// Note that it is up to the request handlers to ignore or honor this timeout. 
			// In seconds.

		mux                   apiserver.Mux            //c.RestfulContainer.ServeMux
		muxHelper             *apiserver.MuxHelper
		handlerContainer      *restful.Container       //c.RestfulContainer
		rootWebService        *restful.WebService      //new(restful.WebService)
		enableCoreControllers bool
		enableLogsSupport     bool                     //true
		enableUISupport       bool
		enableSwaggerSupport  bool
		enableProfiling       bool                     //性能采样
			//Enable profiling via web interface host:port/debug/pprof/
		apiPrefix             string                   //api前缀, "/api"
		corsAllowedOriginList util.StringList          //跨域允许
		authenticator         authenticator.Request    //用户认证
		authorizer            authorizer.Authorizer    //授权检查
		admissionControl      admission.Interface      //访问控制
		masterCount           int                      //master的数量
		v1beta3               bool
		v1                    bool
		requestContextMapper  api.RequestContextMapper
			// Map requests to contexts. Exported so downstream consumers can provider their
			//own mappers.    api.NewRequestContextMapper()


		externalHost string
			// External host is the name that should be used in external (public internet) 
			//URLs for this master
		clusterIP            net.IP
			// clusterIP is the IP address of the master within the cluster.
		publicReadWritePort  int
		serviceReadWriteIP   net.IP
		serviceReadWritePort int
		masterServices       *util.Runner

		// storage contains the RESTful endpoints exposed by this master
		storage map[string]rest.Storage

		// registries are internal client APIs for accessing the storage layer
		// TODO: define the internal typed interface in a way that clients can
		// also be replaced
		nodeRegistry              minion.Registry
		namespaceRegistry         namespace.Registry
		serviceRegistry           service.Registry
		endpointRegistry          endpoint.Registry
		serviceClusterIPAllocator service.RangeRegistry
		serviceNodePortAllocator  service.RangeRegistry

		// "Outputs"
		Handler         http.Handler
		InsecureHandler http.Handler

		// Used for secure proxy
		dialer        apiserver.ProxyDialerFunc
		tunnels       *util.SSHTunnelList
		tunnelsLock   sync.Mutex
		installSSHKey InstallSSHKey
	}





## Kubernetes Scheduler 

### Kubernetes Scheduler Server分析

v0.18.0

源码路径:

	github.com/GoogleCloudPlatform/kubernetes/plugin/cmd/kube-scheduler

调度服务器默认使用的端口是10251

	github.com/GoogleCloudPlatform/kubernetes/pkg/master/ports/ports.go 

从github.com/GoogleCloudPlatform/kubernetes/plugin/cmd/kube-scheduler/scheduler.go开始:

	func main() {
		runtime.GOMAXPROCS(runtime.NumCPU())
		s := app.NewSchedulerServer()              <---- SchedulerServer in app/server.go
		s.AddFlags(pflag.CommandLine)

		util.InitFlags()
		util.InitLogs()
		defer util.FlushLogs()

		verflag.PrintAndExitIfRequested()

		s.Run(pflag.CommandLine.Args())            <---- The whole Job
	}

找到s.Run的实现

	github.com/GoogleCloudPlatform/kubernetes/plugin/cmd/kube-scheduler/app/server.go

	// Run runs the specified SchedulerServer.  This should never exit.
	func (s *SchedulerServer) Run(_ []string) error {
		
		...

		config, err := s.createConfig(configFactory)
		if err != nil {
			glog.Fatalf("Failed to create scheduler configuration: %v", err)
		}

		eventBroadcaster := record.NewBroadcaster()
		config.Recorder = eventBroadcaster.NewRecorder(api.EventSource{Component: "scheduler"})
		eventBroadcaster.StartRecordingToSink(kubeClient.Events(""))

		sched := scheduler.New(config)
		sched.Run()                                    <--- The Whole Job

		select {}
	}

可以看到真正的执行部分是sched.Run(),我们需要特别留意变量config,进入sched.Run()后会发现里面都是在调用config的方法

	github.com/GoogleCloudPlatform/kubernetes/plugin/pkg/scheduler/scheduler.go 


	// Run begins watching and scheduling. It starts a goroutine and returns immediately.
	func (s *Scheduler) Run() {
		go util.Until(s.scheduleOne, 0, s.config.StopEverything)
	}

通过查看util.Until的源码,可以知道Scheduler.Run()的工作就是不停的重复执行scheduleOne,直到这里才是真正的开始...

仔细观察下面的代码,s的操作全部是s.config.XXX的样式, 也就是这里代码只是个逻辑框,所以最后我们还回到创建的config的地方,去查明config.XX的作用...

	github.com/GoogleCloudPlatform/kubernetes/plugin/pkg/scheduler/scheduler.go 

	func (s *Scheduler) scheduleOne() {
		pod := s.config.NextPod()                                                          <--- 下一个等待分配的Pod
		if s.config.BindPodsRateLimiter != nil {
			s.config.BindPodsRateLimiter.Accept()
		}

		glog.V(3).Infof("Attempting to schedule: %v", pod)
		start := time.Now()
		defer func() {
			metrics.E2eSchedulingLatency.Observe(metrics.SinceInMicroseconds(start))
		}()
		dest, err := s.config.Algorithm.Schedule(pod, s.config.MinionLister)               <---- 选择Node
		metrics.SchedulingAlgorithmLatency.Observe(metrics.SinceInMicroseconds(start))
		if err != nil {
			glog.V(1).Infof("Failed to schedule: %v", pod)
			s.config.Recorder.Eventf(pod, "failedScheduling", "Error scheduling: %v", err)
			s.config.Error(pod, err)
			return
		}
		b := &api.Binding{
			ObjectMeta: api.ObjectMeta{Namespace: pod.Namespace, Name: pod.Name},
			Target: api.ObjectReference{
				Kind: "Node",
				Name: dest,
			},
		}

		// We want to add the pod to the model iff the bind succeeds, but we don't want to race
		// with any deletions, which happen asyncronously.
		s.config.Modeler.LockedAction(func() {                     <--Modeler.LockedAction就是顺序的执行传递进来的函数,执行加了锁
			bindingStart := time.Now()
			err := s.config.Binder.Bind(b)                         <--将调度结果反馈回去
			metrics.BindingLatency.Observe(metrics.SinceInMicroseconds(bindingStart))
			if err != nil {
				glog.V(1).Infof("Failed to bind pod: %v", err)
				s.config.Recorder.Eventf(pod, "failedScheduling", "Binding rejected: %v", err)
				s.config.Error(pod, err)
				return
			}
			s.config.Recorder.Eventf(pod, "scheduled", "Successfully assigned %v to %v", pod.Name, dest)
			// tell the model to assume that this binding took effect.
			assumed := *pod
			assumed.Spec.NodeName = dest
			s.config.Modeler.AssumePod(&assumed)
		})
	}


### 定义自己的调度策略

回到创建变量config的地方

	github.com/GoogleCloudPlatform/kubernetes/plugin/cmd/kube-scheduler/app/server.go

	configFactory := factory.NewConfigFactory(kubeClient)
	config, err := s.createConfig(configFactory)
	if err != nil {
		glog.Fatalf("Failed to create scheduler configuration: %v", err)
	}

	eventBroadcaster := record.NewBroadcaster()
	config.Recorder = eventBroadcaster.NewRecorder(api.EventSource{Component: "scheduler"})
	eventBroadcaster.StartRecordingToSink(kubeClient.Events(""))

	sched := scheduler.New(config)

config中的内容主要在s.createConfig中完成。

	github.com/GoogleCloudPlatform/kubernetes/plugin/cmd/kube-scheduler/app/server.go

	func (s *SchedulerServer) createConfig(configFactory *factory.ConfigFactory) (*scheduler.Config, error) {
		var policy schedulerapi.Policy
		var configData []byte

		if _, err := os.Stat(s.PolicyConfigFile); err == nil {
			configData, err = ioutil.ReadFile(s.PolicyConfigFile)
			if err != nil {
				return nil, fmt.Errorf("Unable to read policy config: %v", err)
			}
			err = latestschedulerapi.Codec.DecodeInto(configData, &policy)
			if err != nil {
				return nil, fmt.Errorf("Invalid configuration: %v", err)
			}

			return configFactory.CreateFromConfig(policy)
		}

		// if the config file isn't provided, use the specified (or default) provider
		// check of algorithm provider is registered and fail fast
		_, err := factory.GetAlgorithmProvider(s.AlgorithmProvider)
		if err != nil {
			return nil, err
		}

		return configFactory.CreateFromProvider(s.AlgorithmProvider)
	}

先找到config的类型定义

	github.com/GoogleCloudPlatform/kubernetes/plugin/pkg/scheduler/scheduler.go

	// Scheduler watches for new unscheduled pods. It attempts to find
	// minions that they fit on and writes bindings back to the api server.
	type Scheduler struct {
		config *Config
	}

	type Config struct {
		// It is expected that changes made via modeler will be observed
		// by MinionLister and Algorithm.
		Modeler      SystemModeler
		MinionLister algorithm.MinionLister
		Algorithm    algorithm.ScheduleAlgorithm
		Binder       Binder

		// Rate at which we can create pods
		BindPodsRateLimiter util.RateLimiter

		// NextPod should be a function that blocks until the next pod
		// is available. We don't use a channel for this, because scheduling
		// a pod may take some amount of time and we don't want pods to get
		// stale while they sit in a channel.
		NextPod func() *api.Pod

		// Error is called if there is an error. It is passed the pod in
		// question, and the error
		Error func(*api.Pod, error)

		// Recorder is the EventRecorder to use
		Recorder record.EventRecorder

		// Close this to shut down the scheduler.
		StopEverything chan struct{}
	}

继续追踪代码,结合上一节调度过程的代码,主要使用了config中的Modeler、MinionLister、Algorithm、Binder、NextPod。而其中只有Algorithm是受到配置文件的影响的,也就是这是唯一可以调整的地方。

	github.com/GoogleCloudPlatform/kubernetes/plugin/pkg/scheduler/factory/factory.go

	func (f *ConfigFactory) CreateFromKeys(predicateKeys, priorityKeys util.StringSet) (*scheduler.Config, error) {
		glog.V(2).Infof("creating scheduler with fit predicates '%v' and priority functions '%v", predicateKeys, priorityKeys)
		pluginArgs := PluginFactoryArgs{
			PodLister:     f.PodLister,
			ServiceLister: f.ServiceLister,
			// All fit predicates only need to consider schedulable nodes.
			NodeLister: f.NodeLister.NodeCondition(api.NodeReady, api.ConditionTrue),
			NodeInfo:   f.NodeLister,
		}
		predicateFuncs, err := getFitPredicateFunctions(predicateKeys, pluginArgs)
		if err != nil {
			return nil, err
		}

		priorityConfigs, err := getPriorityFunctionConfigs(priorityKeys, pluginArgs)
		if err != nil {
			return nil, err
		}

		// Watch and queue pods that need scheduling.
		cache.NewReflector(f.createUnassignedPodLW(), &api.Pod{}, f.PodQueue, 0).RunUntil(f.StopEverything)

		// Begin populating scheduled pods.
		go f.scheduledPodPopulator.Run(f.StopEverything)

		// Watch minions.
		// Minions may be listed frequently, so provide a local up-to-date cache.
		cache.NewReflector(f.createMinionLW(), &api.Node{}, f.NodeLister.Store, 0).RunUntil(f.StopEverything)

		// Watch and cache all service objects. Scheduler needs to find all pods
		// created by the same service, so that it can spread them correctly.
		// Cache this locally.
		cache.NewReflector(f.createServiceLW(), &api.Service{}, f.ServiceLister.Store, 0).RunUntil(f.StopEverything)

		r := rand.New(rand.NewSource(time.Now().UnixNano()))

		algo := scheduler.NewGenericScheduler(predicateFuncs, priorityConfigs, f.PodLister, r)

		podBackoff := podBackoff{
			perPodBackoff: map[string]*backoffEntry{},
			clock:         realClock{},

			defaultDuration: 1 * time.Second,
			maxDuration:     60 * time.Second,
		}

		return &scheduler.Config{
			Modeler: f.modeler,
			// The scheduler only needs to consider schedulable nodes.
			MinionLister: f.NodeLister.NodeCondition(api.NodeReady, api.ConditionTrue),
			Algorithm:    algo,
			Binder:       &binder{f.Client},
			NextPod: func() *api.Pod {
				pod := f.PodQueue.Pop().(*api.Pod)
				glog.V(2).Infof("About to try and schedule pod %v", pod.Name)
				return pod
			},
			Error:               f.makeDefaultErrorFunc(&podBackoff, f.PodQueue),
			BindPodsRateLimiter: f.BindPodsRateLimiter,
			StopEverything:      f.StopEverything,
		}, nil
	}


找到algo的类型定义, 找到筛选机器的过程Schedule的实现,其中分别用predicates和prioritizers进行了过滤和按优先级选取。

	github.com/GoogleCloudPlatform/kubernetes/plugin/pkg/scheduler/generic_scheduler.go 

	type genericScheduler struct {
		predicates   map[string]algorithm.FitPredicate
		prioritizers []algorithm.PriorityConfig
		pods         algorithm.PodLister
		random       *rand.Rand
		randomLock   sync.Mutex
	}

	func (g *genericScheduler) Schedule(pod *api.Pod, minionLister algorithm.MinionLister) (string, error) {
		minions, err := minionLister.List()
		if err != nil {
			return "", err
		}
		if len(minions.Items) == 0 {
			return "", ErrNoNodesAvailable
		}

		filteredNodes, failedPredicateMap, err := findNodesThatFit(pod, g.pods, g.predicates, minions)
		if err != nil {
			return "", err
		}

		priorityList, err := prioritizeNodes(pod, g.pods, g.prioritizers, algorithm.FakeMinionLister(filteredNodes))
		if err != nil {
			return "", err
		}
		if len(priorityList) == 0 {
			return "", &FitError{
				Pod:              pod,
				FailedPredicates: failedPredicateMap,
			}
		}

		return g.selectHost(priorityList)
	}


查看findNodesThatFit是如何筛选Nodes

	github.com/GoogleCloudPlatform/kubernetes/plugin/pkg/scheduler/generic_scheduler.go 

	func findNodesThatFit(pod *api.Pod, podLister algorithm.PodLister, predicateFuncs map[string]algorithm.FitPredicate, nodes api.NodeList) (api.NodeList, FailedPredicateMap, error) {
		filtered := []api.Node{}
		machineToPods, err := predicates.MapPodsToMachines(podLister)
		failedPredicateMap := FailedPredicateMap{}
		if err != nil {
			return api.NodeList{}, FailedPredicateMap{}, err
		}
		for _, node := range nodes.Items {
			fits := true
			for name, predicate := range predicateFuncs {
				fit, err := predicate(pod, machineToPods[node.Name], node.Name)
				if err != nil {
					return api.NodeList{}, FailedPredicateMap{}, err
				}
				if !fit {
					fits = false
					if _, found := failedPredicateMap[node.Name]; !found {
						failedPredicateMap[node.Name] = util.StringSet{}
					}
					failedPredicateMap[node.Name].Insert(name)
					break
				}
			}
			if fits {
				filtered = append(filtered, node)
			}
		}
		return api.NodeList{Items: filtered}, failedPredicateMap, nil
	}


prioritizeNodes中计算了每个Node的权重取值,从下面的代码中可以看到计算权重的函数可以有很多个,一个Node最终的权重值是多个权重函数计算结果的加权和。

	github.com/GoogleCloudPlatform/kubernetes/plugin/pkg/scheduler/generic_scheduler.go 

	func prioritizeNodes(pod *api.Pod, podLister algorithm.PodLister, priorityConfigs []algorithm.PriorityConfig, minionLister algorithm.MinionLister) (algorithm.HostPriorityList, error) { result := algorithm.HostPriorityList{}

		// If no priority configs are provided, then the EqualPriority function is applied
		// This is required to generate the priority list in the required format
		if len(priorityConfigs) == 0 {
			return EqualPriority(pod, podLister, minionLister)
		}

		combinedScores := map[string]int{}
		for _, priorityConfig := range priorityConfigs {
			weight := priorityConfig.Weight
			// skip the priority function if the weight is specified as 0
			if weight == 0 {
				continue
			}
			priorityFunc := priorityConfig.Function
			prioritizedList, err := priorityFunc(pod, podLister, minionLister)  <--权重函数
			if err != nil {
				return algorithm.HostPriorityList{}, err
			}
			for _, hostEntry := range prioritizedList {
				combinedScores[hostEntry.Host] += hostEntry.Score * weight
			}
		}
		for host, score := range combinedScores {
			result = append(result, algorithm.HostPriority{Host: host, Score: score})
		}
		return result, nil
	}

可以看到Node筛选函数predicate的三个输入参数: 

	pod:  等待分配的pod
	machineToPods[node.Name]: 当前被考察的node上已经有的pod列表
	node.Name: 当前被考察的node

	>predicate遍历每台node,并给出选择结果.

Node的权重函数priorityFunc的三个输入参数: 

	pod:  等待被分配的pod
	podLister: 所有的pod
	minionlister:  等待被计算权重的Node列表

到这里已经弄清除了Node的筛选函数和权重函数的用法,再次回到CreateFromKeys()中,要继续搞清楚这两个函数是什么时候赋的值

	github.com/GoogleCloudPlatform/kubernetes/plugin/pkg/scheduler/factory/factory.go

	func (f *ConfigFactory) CreateFromKeys(predicateKeys, priorityKeys util.StringSet) (*scheduler.Config, error) {
		glog.V(2).Infof("creating scheduler with fit predicates '%v' and priority functions '%v", predicateKeys, priorityKeys)
		pluginArgs := PluginFactoryArgs{
			PodLister:     f.PodLister,
			ServiceLister: f.ServiceLister,
			// All fit predicates only need to consider schedulable nodes.
			NodeLister: f.NodeLister.NodeCondition(api.NodeReady, api.ConditionTrue),
			NodeInfo:   f.NodeLister,
		}
		predicateFuncs, err := getFitPredicateFunctions(predicateKeys, pluginArgs)
		if err != nil {
			return nil, err
		}

		priorityConfigs, err := getPriorityFunctionConfigs(priorityKeys, pluginArgs)
		if err != nil {
			return nil, err
		}
	
		...

	}

查看这个两个getXXX的实现:

	github.com/GoogleCloudPlatform/kubernetes/plugin/pkg/scheduler/factory/plugins.go

	func getFitPredicateFunctions(names util.StringSet, args PluginFactoryArgs) (map[string]algorithm.FitPredicate, error) {
		schedulerFactoryMutex.Lock()
		defer schedulerFactoryMutex.Unlock()

		predicates := map[string]algorithm.FitPredicate{}
		for _, name := range names.List() {
			factory, ok := fitPredicateMap[name]
			if !ok {
				return nil, fmt.Errorf("Invalid predicate name %q specified - no corresponding function found", name)
			}
			predicates[name] = factory(args)
		}
		return predicates, nil
	}

	func getPriorityFunctionConfigs(names util.StringSet, args PluginFactoryArgs) ([]algorithm.PriorityConfig, error) {
		schedulerFactoryMutex.Lock()
		defer schedulerFactoryMutex.Unlock()

		configs := []algorithm.PriorityConfig{}
		for _, name := range names.List() {
			factory, ok := priorityFunctionMap[name]
			if !ok {
				return nil, fmt.Errorf("Invalid priority name %s specified - no corresponding function found", name)
			}
			configs = append(configs, algorithm.PriorityConfig{
				Function: factory.Function(args),
				Weight:   factory.Weight,
			})
		}
		return configs, nil
	}

可以看到func是从下面的两个Map中获得的:

	fitPredicateMap      = make(map[string]FitPredicateFactory)
	priorityFunctionMap  = make(map[string]PriorityConfigFactory)

继续寻找为两个Map赋值的地方:

	github.com/GoogleCloudPlatform/kubernetes/plugin/pkg/scheduler/factory/plugins.go

	func RegisterFitPredicateFactory(name string, predicateFactory FitPredicateFactory) string {
		schedulerFactoryMutex.Lock()
		defer schedulerFactoryMutex.Unlock()
		validateAlgorithmNameOrDie(name)
		fitPredicateMap[name] = predicateFactory     <----
		return name
	}

	func RegisterPriorityConfigFactory(name string, pcf PriorityConfigFactory) string {
		schedulerFactoryMutex.Lock()
		defer schedulerFactoryMutex.Unlock()
		validateAlgorithmNameOrDie(name)
		priorityFunctionMap[name] = pcf               <----
		return name
	}


然后回退到createConfig()中:

	func (s *SchedulerServer) createConfig(configFactory *factory.ConfigFactory) (*scheduler.Config, error) {
		var policy schedulerapi.Policy
		var configData []byte

		if _, err := os.Stat(s.PolicyConfigFile); err == nil {
			configData, err = ioutil.ReadFile(s.PolicyConfigFile)
			if err != nil {
				return nil, fmt.Errorf("Unable to read policy config: %v", err)
			}
			err = latestschedulerapi.Codec.DecodeInto(configData, &policy)
			if err != nil {
				return nil, fmt.Errorf("Invalid configuration: %v", err)
			}

			return configFactory.CreateFromConfig(policy)
		}

		// if the config file isn't provided, use the specified (or default) provider
		// check of algorithm provider is registered and fail fast
		_, err := factory.GetAlgorithmProvider(s.AlgorithmProvider)  <-- default
		if err != nil {
			return nil, err
		}

		return configFactory.CreateFromProvider(s.AlgorithmProvider)  <--default
	}

可以发现默认s.AlgorithmProvider是default,在下面的代码注册:

	github.com/GoogleCloudPlatform/kubernetes/plugin/pkg/scheduler/algorithmprovider/defaults/defaults.go

	func init() {
		factory.RegisterAlgorithmProvider(factory.DefaultProvider, defaultPredicates(), defaultPriorities())
		// EqualPriority is a prioritizer function that gives an equal weight of one to all minions
		// Register the priority function so that its available
		// but do not include it as part of the default priorities
		factory.RegisterPriorityFunction("EqualPriority", scheduler.EqualPriority, 1)
	}

defaultPredicates()和defaultPriorities()也在这个文件一并找到,可以看到里面注册默认使用的函数集:


	func defaultPredicates() util.StringSet {
		return util.NewStringSet(
			// Fit is defined based on the absence of port conflicts.
			factory.RegisterFitPredicate("PodFitsPorts", predicates.PodFitsPorts),
			// Fit is determined by resource availability.
			factory.RegisterFitPredicateFactory(
				"PodFitsResources",
				func(args factory.PluginFactoryArgs) algorithm.FitPredicate {
					return predicates.NewResourceFitPredicate(args.NodeInfo)
				},
			),
			// Fit is determined by non-conflicting disk volumes.
			factory.RegisterFitPredicate("NoDiskConflict", predicates.NoDiskConflict),
			// Fit is determined by node selector query.
			factory.RegisterFitPredicateFactory(
				"MatchNodeSelector",
				func(args factory.PluginFactoryArgs) algorithm.FitPredicate {
					return predicates.NewSelectorMatchPredicate(args.NodeInfo)
				},
			),
			// Fit is determined by the presence of the Host parameter and a string match
			factory.RegisterFitPredicate("HostName", predicates.PodFitsHost),
		)
	}

	func defaultPriorities() util.StringSet {
		return util.NewStringSet(
			// Prioritize nodes by least requested utilization.
			factory.RegisterPriorityFunction("LeastRequestedPriority", priorities.LeastRequestedPriority, 1),
			// Prioritizes nodes to help achieve balanced resource usage
			factory.RegisterPriorityFunction("BalancedResourceAllocation", priorities.BalancedResourceAllocation, 1),
			// spreads pods by minimizing the number of pods (belonging to the same service) on the same minion.
			factory.RegisterPriorityConfigFactory(
				"ServiceSpreadingPriority",
				factory.PriorityConfigFactory{
					Function: func(args factory.PluginFactoryArgs) algorithm.PriorityFunction {
						return priorities.NewServiceSpreadPriority(args.ServiceLister)
					},
					Weight: 1,
				},
			),
		)
	}


Policy中的ServiceAffinity表示,如果一个node上的和该pod隶属通过一个Service的同一个Namespace的Pod的标签坐落在, 隶属的同一个Service的同一个Namespace的Pod的标签彼此共享。

Policy中的NodeLabel要求

## 最小操作单位Pod

Pod是用户可以操作的最小单位,Kubernetes对Pod的状态负责,如果Pod中有容器宕掉,Kuberletes负责重启

## 文献
1. http://xxx  "Name"


