---
layout: default
title: Calico的felix组件的工作过程
author: lijiaocn
createdate: 2017/09/13 12:10:54
changedate: 2017/09/14 20:05:21
categories: 项目
tags: calico
keywords: felix,calico,工作过程
description: felix是calico的核心组件，负责设置iptables、路由表等

---

* auto-gen TOC:
{:toc}

## 说明

[felix][1]是calico的核心组件，负责设置iptables、路由表等，这里分析的版本是v2.5.1。

## 流程概括

felix的主流程比较清晰，代码中的注释里写的很详细。

felix启动后首先加载配置，配置加载后即连接配置中指定的datastore。

然后用datastore中的信息更新配置，并重新连接datastore。

felix/felix.go:

	func main() {
		...
		for {
			...
			configParams = config.New()
			envConfig := config.LoadConfigFromEnvironment(os.Environ())
			...
			datastoreConfig := configParams.DatastoreConfig()
			datastore, err = backend.NewClient(datastoreConfig)
			...
			globalConfig, hostConfig := loadConfigFromDatastore(datastore,
				configParams.FelixHostname)
			configParams.UpdateFrom(globalConfig, config.DatastoreGlobal)
			configParams.UpdateFrom(hostConfig, config.DatastorePerHost)
			configParams.Validate()
			...
			datastoreConfig = configParams.DatastoreConfig()
			datastore, err = backend.NewClient(datastoreConfig)
			...
		}
		...

datastore连接成功之后，再去加载dataplaneDriver。dataplaneDriver是负责iptables等数据面设置的。可以直接使用fleix中实现的driver，也可以使用外部的driver。

	...
	var dpDriver dataplaneDriver
	var dpDriverCmd *exec.Cmd
	if configParams.UseInternalDataplaneDriver {
		...
		dpConfig := intdataplane.Config{
			...
		}
		intDP := intdataplane.NewIntDataplaneDriver(dpConfig)
		intDP.Start()
		dpDriver = intDP
	}
	...

dpDriver设置完成后，开始连接datastore与dpDriver。

首先一个`Syncer`协程负责监听datastore中的更新，并将更新的内容通过channel发送给`Validator`协程。Validator完成校验后，将其发送给`Calc graph`协程。Calc graph完成计算后，将需要进行的数据面设置操作发送给dataplane协程。最后dataplane完成数据面设置。

	...
	dpConnector := newConnector(configParams, datastore, dpDriver, failureReportChan)
	...
	syncerToValidator := calc.NewSyncerCallbacksDecoupler()
	...
	syncer = datastore.Syncer(syncerToValidator)
	...
	asyncCalcGraph := calc.NewAsyncCalcGraph(configParams, dpConnector.ToDataplane, healthAggregator)
	...
	validator := calc.NewValidationFilter(asyncCalcGraph)
	...
	syncer.Start()
	go syncerToValidator.SendTo(validator)
	asyncCalcGraph.Start()
	dpConnector.Start()
	...
	dpConnector.ToDataplane <- &proto.ConfigUpdate{
		Config: configParams.RawValues(),
	}
	...

最终系统中的协程关系如下：

	Syncer -chan-> Validator -chan-> Calc graph -chan->   dataplane
	       KVPair            KVPair             protobufs

最后监听所有协程的运行状态:

	monitorAndManageShutdown(failureReportChan, dpDriverCmd, stopSignalChans)

## Syncer协程监听datastore中的更新

在felix.go的main函数中，可以看到:

	...
	datastore, err = backend.NewClient(datastoreConfig)
	...
	syncer = datastore.Syncer(syncerToValidator)
	...
	syncer.Start()

datastore的创建，libcalico-go/lib/backend/client.go：

	func NewClient(config api.CalicoAPIConfig) (c bapi.Client, err error) {
		...
		switch config.Spec.DatastoreType {
		case api.EtcdV2:
			c, err = etcd.NewEtcdClient(&config.Spec.EtcdConfig)
		case api.Kubernetes:
			c, err = k8s.NewKubeClient(&config.Spec.KubeConfig)
		if c != nil {
			...
			c = compat.NewAdaptor(c)
		}
		...

注意最后一行代码，最后得到的dataplane的类型是`ModelAdaptor`：

	-+ModelAdaptor : struct
	   [fields]
	   -client : api.Client
	   [methods]
	   +Apply(d *model.KVPair) : *model.KVPair, error
	   +Create(d *model.KVPair) : *model.KVPair, error
	   +Delete(d *model.KVPair) : error
	   +EnsureCalicoNodeInitialized(node string) : error
	   +EnsureInitialized() : error
	   +Get(k model.Key) : *model.KVPair, error
	   +List(l model.ListInterface) : []*model.KVPair, error
	   +Syncer(callbacks api.SyncerCallbacks) : api.Syncer
	   +Update(d *model.KVPair) : *model.KVPair, error
	   -applyOrDeleteSubcomponents(components []*model.KVPair) : error
	   -getBlock(k model.Key) : *model.KVPair, error
	   -getNode(nk model.NodeKey) : *model.KVPair, error
	   -getNodeSubcomponents(nk model.NodeKey, nv *model.Node) : error
	   -getProfile(k model.Key) : *model.KVPair, error
	   -listBlock(l model.BlockListOptions) : []*model.KVPair, error
	   -listNodes(l model.NodeListOptions) : []*model.KVPair, error
	   [functions]
	   +NewAdaptor(c api.Client) : *ModelAdaptor

ModelAdapter.Syncer()直接调用了EtcdClient或者KubeClient的Syncer方法：

	func (c *ModelAdaptor) Syncer(callbacks api.SyncerCallbacks) api.Syncer {
		return c.client.Syncer(callbacks)
	}
	
	func (c *EtcdClient) Syncer(callbacks api.SyncerCallbacks) api.Syncer {
		return newSyncer(c.etcdKeysAPI, callbacks)
	}
	
	func (c *KubeClient) Syncer(callbacks api.SyncerCallbacks) api.Syncer {
		return newSyncer(*c, callbacks)
	}

EtcdClient的Sync的启动，libcalico-go/lib/backend/etcd/syncer.go:

	func (syn *etcdSyncer) Start() {
		watcherUpdateC := make(chan interface{}, 20000)
		snapshotUpdateC := make(chan interface{})
		snapshotRequestC := make(chan snapshotRequest)
		
		if !syn.OneShot {
			go syn.watchEtcd(watcherUpdateC)
			go syn.pollClusterID(clusterIDPollInterval)
		}
		go syn.readSnapshotsFromEtcd(snapshotUpdateC, snapshotRequestC)
		go syn.mergeUpdates(snapshotUpdateC, watcherUpdateC, snapshotRequestC)
	}

`syn.watchEtcd()`将监听到的变动通过`watcherUpdateC`传递到`syn.mergeUpdates()`，syn.mergeUpdates()调用传送的callback:

libcalico-go/lib/backend/etcd/syncer.go:

	func (syn *etcdSyncer) mergeUpdates(
		snapshotUpdateC <-chan interface{},
		watcherUpdateC <-chan interface{},
		snapshotRequestC chan<- snapshotRequest,
	) {
		...
		syn.callbacks.OnStatusUpdated(api.WaitForDatastore)
		for {
			var event interface{}
			select {
			case event = <-snapshotUpdateC:
				log.WithField("event", event).Debug("Snapshot update")
			case event = <-watcherUpdateC:
				log.WithField("event", event).Debug("Watcher update")
					...
					syn.callbacks.OnStatusUpdated(api.InSync)
				syn.callbacks.OnStatusUpdated(api.ResyncInProgress)
				...
			}

这里的callbacks就是就是syncer创建是传入的参数`syncerToValidator`。

	syncerToValidator := calc.NewSyncerCallbacksDecoupler()

## syncerToValidator将更新传递给validator

syncerToValidator一端作为回调，收到更新的数据，另一端将收到的内容转发出去。

	syncerToValidator := calc.NewSyncerCallbacksDecoupler()
	...
	syncer = datastore.Syncer(syncerToValidator)
	...
	go syncerToValidator.SendTo(validator)
	...

felix/calc/async_decoupler.go:

	-+SyncerCallbacksDecoupler : struct
	   [fields]
	   -c : chan interface{}
	   [methods]
	   +OnStatusUpdated(status api.SyncStatus)
	   +OnUpdates(updates []api.Update)
	   +SendTo(sink api.SyncerCallbacks)

在回调中调用的`syncerToValidator.OnStatusUpdated()`，只更新写入channel，calc/async_decoupler.go：

	func (a *SyncerCallbacksDecoupler) OnStatusUpdated(status api.SyncStatus) {
		a.c <- status
	}
	
	func (a *SyncerCallbacksDecoupler) OnUpdates(updates []api.Update) {
		a.c <- updates
	}

`syncerToValidator.SendTo()`单独在一个协程内运行，将收到的更新转发，calc/async_decoupler.go:

	func (a *SyncerCallbacksDecoupler) SendTo(sink api.SyncerCallbacks) {
		for obj := range a.c {
			switch obj := obj.(type) {
			case api.SyncStatus:
				sink.OnStatusUpdated(obj)
			case []api.Update:
				sink.OnUpdates(obj)
			}
		}
	}

更新发送到给了`validator`

	validator := calc.NewValidationFilter(asyncCalcGraph)
	...
	go syncerToValidator.SendTo(validator)

calc/async_decoupler.go:

	func (a *SyncerCallbacksDecoupler) SendTo(sink api.SyncerCallbacks) {
		for obj := range a.c {
			switch obj := obj.(type) {
			case api.SyncStatus:
				sink.OnStatusUpdated(obj)
			case []api.Update:
				sink.OnUpdates(obj)
			}
		}
	}

可以看到然后又调用`validate.OnStatusUpdated()`等。

## validator检查后传送给asyncCalcGraph

	...
	asyncCalcGraph := calc.NewAsyncCalcGraph(configParams, dpConnector.ToDataplane, healthAggregator)
	...
	validator := calc.NewValidationFilter(asyncCalcGraph)

validator类型为`ValidationFilter`，calc/validation_filter.go:

	-+ValidationFilter : struct
		[fields]
	   -sink : api.SyncerCallbacks
		[methods]
	   +OnStatusUpdated(status api.SyncStatus)
	   +OnUpdates(updates []api.Update)

validator中完成检查后，回调`asyncCalcGraph.OnUpdates`，calc/validation_filter.go：

	func (v *ValidationFilter) OnUpdates(updates []api.Update) {
		filteredUpdates := make([]api.Update, len(updates))
		...
		v.sink.OnUpdates(filteredUpdates)
	}

## asyncCalcGraph分析更新，以protobuf的形式传递给dataplane

asyncCalcGraph类型为`AsyncCalcGraph`。

	...
	asyncCalcGraph := calc.NewAsyncCalcGraph(configParams, dpConnector.ToDataplane, healthAggregator)
	asyncCalcGraph.Start()
	...

calc/async_calc_graph.go:

	-+AsyncCalcGraph : struct
		[fields]
	   +Dispatcher : *dispatcher.Dispatcher
	   -beenInSync : bool
	   -dirty : bool
	   -eventBuffer : *EventSequencer
	   -flushLeakyBucket : int
	   -flushTicks : chan time.Time
	   -healthAggregator : *health.HealthAggregator
	   -inputEvents : chan interface{}
	   -needToSendInSync : bool
	   -outputEvents : chan interface{}
	   -syncStatusNow : api.SyncStatus
		[methods]
	   +OnStatusUpdated(status api.SyncStatus)
	   +OnUpdates(updates []api.Update)
	   +Start()
	   -loop()
	   -maybeFlush()
	   -onEvent(event interface{})
	   -reportHealth()

validator调用asynccalcgraph的`OnUpdates()`将更新传递给asynccalcgraph。

	func (acg *AsyncCalcGraph) OnUpdates(updates []api.Update) {
		...
		acg.inputEvents <- updates
	}

`asynccalcgraph.Start()`开启协程中，不间断的处理收到的更新：

	func (acg *AsyncCalcGraph) Start() {
		...
		go acg.loop()
	}
	
	func (acg *AsyncCalcGraph) loop() {
		...
		for {
			select {
			case update := <-acg.inputEvents:
				switch update := update.(type) {
				case []api.Update:
					...
					acg.Dispatcher.OnUpdates(update)
					...
				case api.SyncStatus:
					...
					acg.Dispatcher.OnStatusUpdated(update)
					...
				default:
					...
				}
				acg.dirty = true
			...
			acg.maybeFlush()
		}
	}

可以看到处理任务又被分派给了`asynccalcgraph.Dispatcher`。

Dispatcher是asynccalcgraph创建时设置的。

felix.go:

	asyncCalcGraph := calc.NewAsyncCalcGraph(configParams, dpConnector.ToDataplane, healthAggregator)
	...，

calc/async_calc_graph.go:

	func NewAsyncCalcGraph(conf *config.Config, outputEvents chan<- interface{}, \
		healthAggregator *health.HealthAggregator) *AsyncCalcGraph {
		
		eventBuffer := NewEventBuffer(conf)
		disp := NewCalculationGraph(eventBuffer, conf.FelixHostname)
		g := &AsyncCalcGraph{
			inputEvents:      make(chan interface{}, 10),
			outputEvents:     outputEvents,
			Dispatcher:       disp,
			eventBuffer:      eventBuffer,
			healthAggregator: healthAggregator,
		}
		...

### Dispatcher

Dispathcer中注册了多种类型资源的处理函数，将收到的更新交由对应的函数处理。

dispatcher/dispatcher.go:

	-+Dispatcher : struct
	    [fields]
	   -statusHandlers : []StatusHandler
	   -typeToHandler : map[reflect.Type]updateHandlers
	    [methods]
	   +OnDatamodelStatus(status api.SyncStatus)
	   +OnStatusUpdated(status api.SyncStatus)
	   +OnUpdate(update api.Update) : bool
	   +OnUpdates(updates []api.Update)
	   +Register(keyExample model.Key, receiver UpdateHandler)
	   +RegisterStatusHandler(handler StatusHandler)
	    [functions]
	   +NewDispatcher() : *Dispatcher

收到更新后，找到对应的处理函数：

	func (d *Dispatcher) OnUpdate(update api.Update) (filterOut bool) {
		...
		keyType := reflect.TypeOf(update.Key)
		...
		typeSpecificHandlers := d.typeToHandler[keyType]
		...
		typeSpecificHandlers.DispatchToAll(update)
		return
	}

处理函数在Dispathcer创建时设置，calc/calc_graph.go:

	func NewCalculationGraph(callbacks PipelineCallbacks, hostname string) (allUpdDispatcher *dispatcher.Dispatcher) {
		...
		allUpdDispatcher = dispatcher.NewDispatcher()
		...

在这里完成所有的handler的注册。

### Dispatcher中的handlers

allUpdDispatcher除了handler之外，还注册了localEndpointDispatcher，用来做二次分发。

`allUpdDispatcher`中注册的handler:

	localEndpointDispatcher:   WorkloadEndpointKey
	                           HostEndpointKey
	
	activeRulesCalc:           PolicyKey
	                           ProfileRulesKey
	                           ProfileLabelsKey
	                           ProfileTagsKey
	
	activeSelectorIndex:       ProfileTagsKey
	                           ProfileLabelsKey
	                           WorkloadEndpointKey
	                           HostEndpointKey
	
	memberCalc:                WorkloadEndpointKey
	                           HostEndpointKey
	
	polResolver:               PolicyKey
	
	hostIPPassthru:            HostIPKey
	                           IPPoolKey
	
	configBatcher:             GlobalConfigKey
	                           HostConfigKey
	                           ReadyFlagKey

`localEndpointDispatcher`中注册的handler:

	localEndpointFilter:       WorkloadEndpointKey
	                           HostEndpointKey
	
	activeRulesCalc:           WorkloadEndpointKey
	                           HostEndpointKey
	
	polResolver:               WorkloadEndpointKey
	                           HostEndpointKey

可以看到WorkloadEndpint和HostEndpoint的更新，由localEndpointDispatcher中的handler处理。

#### activeRulesCalc

calc/calc_graph.go:

	activeRulesCalc := NewActiveRulesCalculator()
	activeRulesCalc.RegisterWith(localEndpointDispatcher, allUpdDispatcher)

activeRulesCalc类型为ActiveRulesCalculator，calc/active_rules_calculator.go：

	func (arc *ActiveRulesCalculator) OnUpdate(update api.Update) (_ bool) {
		switch key := update.Key.(type) {
		case model.WorkloadEndpointKey:
			...
				arc.updateEndpointProfileIDs(key, profileIDs)
			...
			arc.labelIndex.OnUpdate(update)
		case model.HostEndpointKey:
			...
				arc.updateEndpointProfileIDs(key, profileIDs)
			...
			arc.labelIndex.OnUpdate(update)
		case model.ProfileLabelsKey:
			arc.labelIndex.OnUpdate(update)
		case model.ProfileTagsKey:
			arc.labelIndex.OnUpdate(update)
		case model.ProfileRulesKey:
			...
				rules := update.Value.(*model.ProfileRules)
				arc.allProfileRules[key.Name] = rules
				if arc.profileIDToEndpointKeys.ContainsKey(key.Name) {
					...
					arc.sendProfileUpdate(key.Name)
			...
		case model.PolicyKey:
			...
				policy := update.Value.(*model.Policy)
				arc.allPolicies[key] = policy
				sel, err := selector.Parse(policy.Selector)
				...
				arc.labelIndex.UpdateSelector(key, sel)
				
				if arc.policyIDToEndpointKeys.ContainsKey(key) {
					...
					arc.sendPolicyUpdate(key)
				}
	...

##### arc.updateEndpointProfileIDs()

输入参数为endpoint的key，与endpoint绑定的profiles。

	...
	arc.updateEndpointProfileIDs(key, profileIDs)
	...

更新arc中记录的Endpoint与profiles关联关系。

	arc.endpointKeyToProfileIDs   记录endpoint关联的profiles
	arc.profileIDToEndpointKeys   记录profile关联的endpoints

更新过程如下，calc/active_rules_calculator.go:

	func (arc *ActiveRulesCalculator) updateEndpointProfileIDs(key model.Key, profileIDs []string) {
		...
		removedIDs, addedIDs := arc.endpointKeyToProfileIDs.Update(key, profileIDs)
		
		for id := range addedIDs {
			wasActive := arc.profileIDToEndpointKeys.ContainsKey(id)
			arc.profileIDToEndpointKeys.Put(id, key)
			if !wasActive {
				arc.sendProfileUpdate(id)
			}
		}
		
		for id := range removedIDs {
			arc.profileIDToEndpointKeys.Discard(id, key)
			if !arc.profileIDToEndpointKeys.ContainsKey(id) {
				arc.sendProfileUpdate(id)
			}
		}
	}

注意如果profile不存在，调用`arc.sendProfileUpdate()`。

##### arc.sendProfileUpdate()

arc中存有每个profile的所有规则。

	arc.profileIDToEndpointKeys     所有的profiles以及每个profile作用的endpoint
	arc.allProfileRules             每个profiles的规则

calc/active_rules_calculator.go:

	func (arc *ActiveRulesCalculator) sendProfileUpdate(profileID string) {
		active := arc.profileIDToEndpointKeys.ContainsKey(profileID)
		rules, known := arc.allProfileRules[profileID]
		...
		if active {
			arc.RuleScanner.OnProfileActive(key, rules)
		} else {
			arc.RuleScanner.OnProfileInactive(key)
		}
	}

调用arc.RuleScanner处理profile的规则。

#### arc.sendPolicyUpdate()

arc中存放有所有的policy。

	arc.allPolicies

calc/active_rules_calculator.go:

	func (arc *ActiveRulesCalculator) sendPolicyUpdate(policyKey model.PolicyKey) {
		policy, known := arc.allPolicies[policyKey]
		active := arc.policyIDToEndpointKeys.ContainsKey(policyKey)
		if active {
			...
			arc.RuleScanner.OnPolicyActive(policyKey, policy)
		} else {
			arc.RuleScanner.OnPolicyInactive(policyKey)
		}
	}

调用arc.RuleScanner处理policy。

#### arc.RuleScanner

calc/calc_graph.go:

	func NewCalculationGraph(callbacks PipelineCallbacks, hostname string) (allUpdDispatcher *dispatcher.Dispatcher) {
		...
		ruleScanner := NewRuleScanner()
		activeRulesCalc.RuleScanner = ruleScanner
		ruleScanner.RulesUpdateCallbacks = callbacks
		...

calc/rule_scanner.go:

	-+RuleScanner : struct
	    [fields]
	   +OnSelectorActive : func(selector selector.Selector)
	   +OnSelectorInactive : func(selector selector.Selector)
	   +RulesUpdateCallbacks : rulesUpdateCallbacks
	   -rulesIDToUIDs : multidict.IfaceToString
	   -selectorsByUID : map[string]selector.Selector
	   -uidsToRulesIDs : multidict.StringToIface
	    [methods]
	   +OnPolicyActive(key model.PolicyKey, policy *model.Policy)
	   +OnPolicyInactive(key model.PolicyKey)
	   +OnProfileActive(key model.ProfileRulesKey, profile *model.ProfileRules)
	   +OnProfileInactive(key model.ProfileRulesKey)
	   -updateRules(key interface{}, inbound, outbound []model.Rule, untracked, preDNAT bool) : *ParsedRules

RuleScanner对profile和policy做了处理之后，使用回调`rs.RulesUpdateCallbacks`。

	func (rs *RuleScanner) OnProfileActive(key model.ProfileRulesKey, profile *model.ProfileRules) {
		parsedRules := rs.updateRules(key, profile.InboundRules, profile.OutboundRules, false, false)
		rs.RulesUpdateCallbacks.OnProfileActive(key, parsedRules)
	}

	func (rs *RuleScanner) OnPolicyActive(key model.PolicyKey, policy *model.Policy) {
		parsedRules := rs.updateRules(key, policy.InboundRules, policy.OutboundRules, policy.DoNotTrack, policy.PreDNAT)
		rs.RulesUpdateCallbacks.OnPolicyActive(key, parsedRules)
	}

#### localEndpointFilter

localEndpointFilter是用来过滤，只有与其中的hostname匹配的更新才会被`localEndpointDispatcher`中的handler继续处理：

calc/calc_graph.go:

	...
	localEndpointFilter := &endpointHostnameFilter{hostname: hostname}
	...
	func (f *endpointHostnameFilter) OnUpdate(update api.Update) (filterOut bool) {
		switch key := update.Key.(type) {
		case model.WorkloadEndpointKey:
			if key.Hostname != f.hostname {
				filterOut = true
			}
		case model.HostEndpointKey:
			if key.Hostname != f.hostname {
				filterOut = true
			}
		}
		...
		return
	}

### Dispatcher的callback——eventBuffer

calc/async_calc_graph.go:

	func NewAsyncCalcGraph(conf *config.Config, outputEvents chan<- interface{}, healthAggregator *health.HealthAggregator) *AsyncCalcGraph {
		eventBuffer := NewEventBuffer(conf)
		disp := NewCalculationGraph(eventBuffer, conf.FelixHostname)
		g := &AsyncCalcGraph{
			...
			Dispatcher:       disp,
			eventBuffer:      eventBuffer,
			healthAggregator: healthAggregator,
		}
		eventBuffer.Callback = g.onEvent
		...
		return g
	}

	func NewCalculationGraph(callbacks PipelineCallbacks, hostname string) (allUpdDispatcher *dispatcher.Dispatcher) {
		...

eventBuffer是Dispatcher中被RuleScanner等使用的callback。

eventBuffer缓存被回调时传入的更新，当调用eventBuffer.Flush()时，在将这些更新发送给它的callback。

calc/event_sequencer.go:

	type EventSequencer struct {
		config configInterface
		pendingAddedIPSets         set.Set
		pendingRemovedIPSets       set.Set
		pendingAddedIPs            multidict.StringToIface
		pendingRemovedIPs          multidict.StringToIface
		...
	
	func (buf *EventSequencer) OnPolicyActive(key model.PolicyKey, rules *ParsedRules) {
		buf.pendingPolicyDeletes.Discard(key)
		buf.pendingPolicyUpdates[key] = rules
	}
	
	func (buf *EventSequencer) Flush() {
		buf.flushReadyFlag()
		buf.flushConfigUpdate()
		...
	}
	
回调时传入的参数是proto/felixbackend.proto中定义的：

	func (buf *EventSequencer) flushPolicyUpdates() {
		for key, rulesOrNil := range buf.pendingPolicyUpdates {
			buf.Callback(&proto.ActivePolicyUpdate{
				Id: &proto.PolicyID{
					Tier: "default",
					Name: key.Name,
				},
		...

Flush()的刷新顺序：

	func (buf *EventSequencer) Flush() {
		buf.flushReadyFlag()
		buf.flushConfigUpdate()
		
		buf.flushAddedIPSets()
		buf.flushIPSetDeltas()
		buf.flushPolicyUpdates()
		buf.flushProfileUpdates()
		buf.flushEndpointTierUpdates()
		
		buf.flushEndpointTierDeletes()
		buf.flushProfileDeletes()
		buf.flushPolicyDeletes()
		buf.flushRemovedIPSets()
		
		buf.flushHostIPDeletes()
		buf.flushHostIPUpdates()
		buf.flushIPPoolDeletes()
		buf.flushIPPoolUpdates()
	}

### eventBuffer的callback——asynccalcgraph.onEvent()

eventBuffer的callback是g.onEvent():

calc/event_sequencer.go:

	func NewAsyncCalcGraph(conf *config.Config, outputEvents chan<- interface{}, healthAggregator *health.HealthAggregator) *AsyncCalcGraph {
		...
		g := &AsyncCalcGraph{
			...
			outputEvents:     outputEvents,
			Dispatcher:       disp,
			eventBuffer:      eventBuffer,
			healthAggregator: healthAggregator,
		}
		eventBuffer.Callback = g.onEvent
		...

g.onEvent()将传入的参数直接写入channel `outputEvents`：

	func (acg *AsyncCalcGraph) onEvent(event interface{}) {
		log.Debug("Sending output event on channel")
		acg.outputEvents <- event
		countOutputEvents.Inc()
		log.Debug("Sent output event on channel")
	}

而outputEvents就是最开始在felix.go中创建的`dpConnector.ToDataplane`:

	asyncCalcGraph := calc.NewAsyncCalcGraph(configParams, dpConnector.ToDataplane, healthAggregator)

asyncCalcGraph将收到的更新处理、转换后，以protobuf定义的格式发送给了dpConnector.ToDataplane。

控制面的工作至此结束。

## dpConnector的启动

	...
	dpConnector := newConnector(configParams, datastore, dpDriver, failureReportChan)
	...
	func newConnector(configParams *config.Config,
		datastore bapi.Client,
		dataplane dataplaneDriver,
		failureReportChan chan<- string) *DataplaneConnector {
		felixConn := &DataplaneConnector{
			config:                     configParams,
			datastore:                  datastore,
			ToDataplane:                make(chan interface{}),
			StatusUpdatesFromDataplane: make(chan interface{}),
			InSync:            make(chan bool, 1),
			failureReportChan: failureReportChan,
			dataplane:         dataplane,
		}
		return felixConn
	}
	...
	dpConnector.Start()
	...
	dpConnector.ToDataplane <- &proto.ConfigUpdate{
		Config: configParams.RawValues(),
	}
	...

dpConnector中启动两个协程，一个负责写入，一个负责读取。

	func (fc *DataplaneConnector) Start() {
		go fc.sendMessagesToDataplaneDriver()
		go fc.readMessagesFromDataplane()
	}

发送到dataplane：

	func (fc *DataplaneConnector) sendMessagesToDataplaneDriver() {
		defer func() {
			fc.shutDownProcess("Failed to send messages to dataplane")
		}()
		
		var config map[string]string
		for {
			msg := <-fc.ToDataplane
			...
			if err := fc.dataplane.SendMessage(msg); err != nil {
				...
			}

fc.dataplane是dpconnector创建是传入的dpDriver:

	var dpDriver dataplaneDriver
	...
	intDP := intdataplane.NewIntDataplaneDriver(dpConfig)
	intDP.Start()
	dpDriver = intDP
	...
	dpConnector := newConnector(configParams, datastore, dpDriver, failureReportChan)

## dataplane的工作

dataplane的Start()中启动了四个协程，第一个负责完成一些设置，后三个是一直工作的协程。

	func (d *InternalDataplane) Start() {
		d.doStaticDataplaneConfig()
		
		go d.loopUpdatingDataplane()
		go d.loopReportingStatus()
		go d.ifaceMonitor.MonitorInterfaces()
	}

### d.loopUpdatingDataplane

`d.loopUpdatingDataplane()`是主要处理过程，intdataplane/int_dataplane.go:

	for {
		select {
		case msg := <-d.toDataplane:
			processMsgFromCalcGraph(msg)
		msgLoop1:
			for i := 0; i < msgPeekLimit; i++ {
				select {
				case msg := <-d.toDataplane:
					processMsgFromCalcGraph(msg)
					batchSize++
				...
			}
			d.dataplaneNeedsSync = true
			...
		case ifaceUpdate := <-d.ifaceUpdates:
			...
			processIfaceUpdate(ifaceUpdate)
		msgLoop2:
			for i := 0; i < msgPeekLimit; i++ {
				select {
				case ifaceUpdate := <-d.ifaceUpdates:
					processIfaceUpdate(ifaceUpdate)
				...
			}
			d.dataplaneNeedsSync = true
		case ifaceAddrsUpdate := <-d.ifaceAddrUpdates:
			...
			processAddrsUpdate(ifaceAddrsUpdate)
		msgLoop3:
			for i := 0; i < msgPeekLimit; i++ {
				select {
				case ifaceAddrsUpdate := <-d.ifaceAddrUpdates:
					processAddrsUpdate(ifaceAddrsUpdate)
				...
			}
			d.dataplaneNeedsSync = true
		case <-ipSetsRefreshC:
		...
		}
		
		if datastoreInSync && d.dataplaneNeedsSync {
			if d.applyThrottle.Admit() {
				...
				d.apply()
		...

可以看到，分别从channel`d.toDataplane`、`d.ifaceUpdate`和`ifaceAddrUpdates`中接收进行处理。

虽然是三个不同的处理函数，但是操作过程是类似的，intdataplane/int_dataplane.go:

	processMsgFromCalcGraph := func(msg interface{}) {
		...
		for _, mgr := range d.allManagers {
			mgr.OnUpdate(msg)
		}
		...
	}

	processIfaceUpdate := func(ifaceUpdate *ifaceUpdate) {
		for _, mgr := range d.allManagers {
			mgr.OnUpdate(ifaceUpdate)
		}
		for _, routeTable := range d.routeTables {
			routeTable.OnIfaceStateChanged(ifaceUpdate.Name, ifaceUpdate.State)
		}
	}
	
	processAddrsUpdate := func(ifaceAddrsUpdate *ifaceAddrsUpdate) {
		for _, mgr := range d.allManagers {
			mgr.OnUpdate(ifaceAddrsUpdate)
		}
	}

可以看到除了processIfaceUpdate还会操作routeTable外，都是调用`d.allManagers`成员的`OnUpdate()`来处理收到的消息。

### d.allManagers

dataplane中的managers是在初始化的时候注册的，intdataplane/int_dataplane.go

	func NewIntDataplaneDriver(config Config) *InternalDataplane {
		log.WithField("config", config).Info("Creating internal dataplane driver.")
		ruleRenderer := config.RuleRendererOverride
		if ruleRenderer == nil {
			ruleRenderer = rules.NewRenderer(config.RulesConfig)
		}
		dp := &InternalDataplane{
		...
		dp.ifaceMonitor.Callback = dp.onIfaceStateChange
		dp.ifaceMonitor.AddrCallback = dp.onIfaceAddrsChange
		...
		dp.RegisterManager(newIPSetsManager(ipSetsV4, config.MaxIPSetSize))
		dp.RegisterManager(newPolicyManager(rawTableV4, mangleTableV4, filterTableV4, ruleRenderer, 4))
		dp.RegisterManager(newEndpointManager(
			rawTableV4,
			mangleTableV4,
			filterTableV4,
			ruleRenderer,
			routeTableV4,
			4,
			config.RulesConfig.WorkloadIfacePrefixes,
			dp.endpointStatusCombiner.OnEndpointStatusUpdate))
		dp.RegisterManager(newFloatingIPManager(natTableV4, ruleRenderer, 4))
		dp.RegisterManager(newMasqManager(ipSetsV4, natTableV4, ruleRenderer, config.MaxIPSetSize, 4))
		if config.RulesConfig.IPIPEnabled {
			dp.ipipManager = newIPIPManager(ipSetsV4, config.MaxIPSetSize)
			dp.RegisterManager(dp.ipipManager) // IPv4-only
		}
		...
		for _, t := range dp.iptablesMangleTables {
			dp.allIptablesTables = append(dp.allIptablesTables, t)
		}
		for _, t := range dp.iptablesNATTables {
			dp.allIptablesTables = append(dp.allIptablesTables, t)
		}
		for _, t := range dp.iptablesFilterTables {
			dp.allIptablesTables = append(dp.allIptablesTables, t)
		}
		for _, t := range dp.iptablesRawTables {
			dp.allIptablesTables = append(dp.allIptablesTables, t)
		}
		...

## 参考

1. [felix][1]

[1]: https://github.com/projectcalico/felix  "felix" 
