---
layout: default
title: kubernetes的Apiserver的工作过程
author: 李佶澳
createdate: 2017/05/04 16:28:23
last_modified_at: 2017/06/09 15:56:39
categories: 项目
tags: kubernetes
keywords: kubernetes,k8s,kubernetes的apiserver,请求处理
description: kubernetes的apiserver的实现挺复杂，理解了kubernetes-style的apiserver后, 原理就清晰了。

---

## 目录
* auto-gen TOC:
{:toc}

## kubernetes-style apiserver

不得不说，k8s的apiserver实现的还是有点复杂的，k8s自称为[kubernetes-style apiserver][1]。

从kubernetes主代码中剥离出来的工作还没有完成：

	apiserver is synced from:
		https://github.com/kubernetes/kubernetes/blob/master/staging/src/k8s.io/apiserver
	Code changes are made in that location, merged into k8s.io/kubernetes and later synced here.

	We have a goal to make this easier to use in 2017.

kubernetes-style apiserver的核心是`GenericAPIServer`，GenericAPIServer的`InstallAPIGroup()`方法，根据输入参数`APIGroupInfo`中的storage，自动生成url路由，和REST请求的Handler。

`GenericAPIServer`，

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/genericapiserver.go:
	-+GenericAPIServer : struct
	    [fields]
	   +ExternalAddress : string
	   +FallThroughHandler : *mux.PathRecorderMux
	   +Handler : http.Handler
	   +HandlerContainer : *genericmux.APIContainer
	   +LoopbackClientConfig : *restclient.Config
	   +SecureServingInfo : *SecureServingInfo
	   +Serializer : runtime.NegotiatedSerializer
	    [methods]
	   +AddAPIGroupForDiscovery(apiGroup metav1.APIGroup)
	   +DynamicApisDiscovery() : *restful.WebService
	   +EffectiveSecurePort() : int
	   +HealthzChecks() : []healthz.HealthzChecker
	   +InstallAPIGroup(apiGroupInfo *APIGroupInfo) : error
	   +InstallLegacyAPIGroup(apiPrefix string, apiGroupInfo *APIGroupInfo) : error
	   +ListedPaths() : []string
	   +MinRequestTimeout() : time.Duration
	   +PostStartHooks() : map[string]postStartHookEntry
	   +PrepareRun() : preparedGenericAPIServer
	   +RemoveAPIGroupForDiscovery(groupName string)
	   +RequestContextMapper() : apirequest.RequestContextMapper
	   +UnprotectedHandler() : http.Handler

`APIGroupInfo`：

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/genericapiserver.go: 
	-+APIGroupInfo : struct
	    [fields]
	   +GroupMeta : apimachinery.GroupMeta
	   +MetaGroupVersion : *schema.GroupVersion
	   +NegotiatedSerializer : runtime.NegotiatedSerializer
	   +OptionsExternalVersion : *schema.GroupVersion
	   +ParameterCodec : runtime.ParameterCodec
	   +Scheme : *runtime.Scheme
	   +SubresourceGroupVersionKind : map[string]schema.GroupVersionKind
	   +VersionedResourcesStorageMap : map[string]map[string]rest.Storage
	    [functions]
	   +NewDefaultAPIGroupInfo(group string, registry *registered.APIRegistrationManager, \
	        scheme *runtime.Scheme, parameterCodec runtime.ParameterCodec, codecs serializer.CodecFactory) : APIGroupInfo

storage都存放在APIGroupInfo的名为`VersionedResourcesStorageMap`的成员变量中。

	// Info about an API group.
	type APIGroupInfo struct {
		GroupMeta apimachinery.GroupMeta
		// Info about the resources in this group. Its a map from version to resource to the storage.
		VersionedResourcesStorageMap map[string]map[string]rest.Storage
		...

## go-restful

kubernetes apiserver中最终使用`go-restful`处理HTTP请求，有必要先了解下go-restful。

	func main() {
		ws := new(restful.WebService)
		ws.Route(ws.GET("/hello").To(hello))
		restful.Add(ws)
		go func() {
			http.ListenAndServe(":8080", nil)
		}()

		container2 := restful.NewContainer()
		ws2 := new(restful.WebService)
		ws2.Route(ws2.GET("/hello").To(hello2))
		container2.Add(ws2)
		server := &http.Server{Addr: ":8081", Handler: container2}
		log.Fatal(server.ListenAndServe())
	}

	func hello(req *restful.Request, resp *restful.Response) {
		io.WriteString(resp, "default world")
	}

	func hello2(req *restful.Request, resp *restful.Response) {
		io.WriteString(resp, "second world")
	}

`kubeAPIServer.GenericAPIServer.HandlerContainer`就是一个restful container。在初始化过程多个WebService会被注册到这个container中。

## 启动

k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:

	func Run(runOptions *options.ServerRunOptions, stopCh <-chan struct{}) error {
		kubeAPIServerConfig, sharedInformers, insecureServingOptions, err := CreateKubeAPIServerConfig(runOptions)
		...
		kubeAPIServer, err := CreateKubeAPIServer(kubeAPIServerConfig, sharedInformers, stopCh)
		...
		// run the insecure server now, don't block.  It doesn't have any aggregator goodies since authentication wouldn't work
		if insecureServingOptions != nil {
			insecureHandlerChain := kubeserver.BuildInsecureHandlerChain(kubeAPIServer.GenericAPIServer.HandlerContainer.ServeMux, kubeAPIServerConfig.GenericConfig)
			if err := kubeserver.NonBlockingRun(insecureServingOptions, insecureHandlerChain, stopCh); err != nil {
				return err
			}
		}
		...
		
		kubeAPIServer.GenericAPIServer.PrepareRun()
		aggregatorConfig, err := createAggregatorConfig(*kubeAPIServerConfig.GenericConfig, runOptions)
		...
		aggregatorServer, err := createAggregatorServer(aggregatorConfig, kubeAPIServer.GenericAPIServer, sharedInformers, stopCh)
		...
		return aggregatorServer.GenericAPIServer.PrepareRun().Run(stopCh)
	}

主要就是创kuberApiServer，加密模式下，还需要基于kuberAPIServer再生成一个`aggregatorServer`。

## kubeApiServer的创建

k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:

	func CreateKubeAPIServer(kubeAPIServerConfig *master.Config, sharedInformers informers.SharedInformerFactory, stopCh <-chan struct{}) (*master.Master, error) {
		...
		kubeAPIServer, err := kubeAPIServerConfig.Complete().New()
		...

k8s.io/kubernetes/pkg/master/master.go，`kubeApiServerConfig.Complete().New()`:

	func (c completedConfig) New() (*Master, error) {
		...
		s, err := c.Config.GenericConfig.SkipComplete().New() // completion is done in Complete, no need for a second time
		
		...
		
		m := &Master{
			GenericAPIServer: s,
		}
		
		...
		
		m.InstallAPIs(c.Config.APIResourceConfigSource, c.Config.GenericConfig.RESTOptionsGetter, restStorageProviders...)
		
		...

首先创建了s(GenericAPIServer)，然后添加到m中，m又调用InstallAPIs转载WebService。

## GenericAPIServer创建

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/config.go:
	func (c completedConfig) New() (*GenericAPIServer, error) {
		s, err := c.constructServer()
		...
		return c.buildHandlers(s, nil)
	}

在constructServer中创建了container。

`c.constructServer()`：

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/config.go:
	func (c completedConfig) constructServer() (*GenericAPIServer, error) {
		...
		handlerContainer := mux.NewAPIContainer(http.NewServeMux(), c.Serializer, c.FallThroughHandler)

		s := &GenericAPIServer{
			discoveryAddresses:     c.DiscoveryAddresses,
			LoopbackClientConfig:   c.LoopbackClientConfig,
			legacyAPIGroupPrefixes: c.LegacyAPIGroupPrefixes,
			admissionControl:       c.AdmissionControl,
			requestContextMapper:   c.RequestContextMapper,
			Serializer:             c.Serializer,

			minRequestTimeout: time.Duration(c.MinRequestTimeout) * time.Second,

			SecureServingInfo: c.SecureServingInfo,
			ExternalAddress:   c.ExternalAddress,

			apiGroupsForDiscovery: map[string]metav1.APIGroup{},

			HandlerContainer:   handlerContainer,
			FallThroughHandler: c.FallThroughHandler,

			listedPathProvider: routes.ListedPathProviders{handlerContainer, c.FallThroughHandler},

			swaggerConfig: c.SwaggerConfig,
			openAPIConfig: c.OpenAPIConfig,

			postStartHooks: map[string]postStartHookEntry{},
			healthzChecks:  c.HealthzChecks,
		}

		return s, nil
	}

## handlerContainer的创建

`mux.NewAPIContainer()`:

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/mux/container.go,
	func NewAPIContainer(mux *http.ServeMux, s runtime.NegotiatedSerializer, defaultMux http.Handler) *APIContainer {
		c := APIContainer{
			Container: restful.NewContainer(),
		}
		c.Container.ServeMux = mux
		c.Container.Router(restful.CurlyRouter{}) // e.g. for proxy/{kind}/{name}/{*}
		c.Container.RecoverHandler(func(panicReason interface{}, httpWriter http.ResponseWriter) {
			logStackOnRecover(s, panicReason, httpWriter)
		})
		c.Container.ServiceErrorHandler(func(serviceErr restful.ServiceError, request *restful.Request, response *restful.Response) {
			serviceErrorHandler(s, serviceErr, request, response)
		})

		c.Container.Handle("/", defaultMux)

		return &c
	}

注意，这里hack了go-restful，将c.Container.ServeMux做了替换，在go-restful的实现中，所有的url路由最终都存放在这里ServeMux中。

这也是unsecure模式下，直接使用ServerMux的原因：

	//k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:
	if insecureServingOptions != nil {
		insecureHandlerChain := kubeserver.BuildInsecureHandlerChain(kubeAPIServer.GenericAPIServer.HandlerContainer.ServeMux, kubeAPIServerConfig.GenericConfig)
		if err := kubeserver.NonBlockingRun(insecureServingOptions, insecureHandlerChain, stopCh); err != nil {
			return err
		}
	}

## API的Install过程

API的install就是将url路由添加到前面创建的container中。

首先回顾一下container的创建过程:

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/mux/container.go:
	// NewAPIContainer constructs a new container for APIs
	func NewAPIContainer(mux *http.ServeMux, s runtime.NegotiatedSerializer, defaultMux http.Handler) *APIContainer {
		c := APIContainer{
			Container: restful.NewContainer(),
		}
		c.Container.ServeMux = mux
		c.Container.Router(restful.CurlyRouter{}) // e.g. for proxy/{kind}/{name}/{*}
		c.Container.RecoverHandler(func(panicReason interface{}, httpWriter http.ResponseWriter) {
			logStackOnRecover(s, panicReason, httpWriter)
		})
		c.Container.ServiceErrorHandler(func(serviceErr restful.ServiceError, request *restful.Request, response *restful.Response) {
			serviceErrorHandler(s, serviceErr, request, response)
		})
		
		c.Container.Handle("/", defaultMux)
		
		return &c
	}

`c.Container.Router()`restful.CurlyRouter，url格式为：

	proxy/{kind}/{name}/{*}

这里还有一个defaultMux，暂时不管，后面专门分析。

## 第一次装载

在`c.constructServer()`创建后，调用`c.buildHandlers()`进行第一次装载。

	func (c completedConfig) New() (*GenericAPIServer, error) {
		s, err := c.constructServer()
		if err != nil {
			return nil, err
		}
		
		return c.buildHandlers(s, nil)
	}

c.buildHandlers()：

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/config.go:
	func (c completedConfig) buildHandlers(s *GenericAPIServer, delegate http.Handler) (*GenericAPIServer, error) {
		if s.openAPIConfig != nil {
			if s.openAPIConfig.Info == nil {
				s.openAPIConfig.Info = &spec.Info{}
			}
			if s.openAPIConfig.Info.Version == "" {
				if c.Version != nil {
					s.openAPIConfig.Info.Version = strings.Split(c.Version.String(), "-")[0]
				} else {
					s.openAPIConfig.Info.Version = "unversioned"
				}
			}
		}
		
		installAPI(s, c.Config, delegate)
		
		s.Handler = c.BuildHandlerChainFunc(s.HandlerContainer.ServeMux, c.Config)
		
		return s, nil
	}

`installAPI()`：

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/config.go
	func installAPI(s *GenericAPIServer, c *Config, delegate http.Handler) {
		...
		switch {
		case c.EnableIndex:
			routes.Index{}.Install(s.listedPathProvider, c.FallThroughHandler, delegate)

		case delegate != nil:
			s.FallThroughHandler.UnlistedHandleFunc("/", delegate.ServeHTTP)
		}
		if c.SwaggerConfig != nil && c.EnableSwaggerUI {
			routes.SwaggerUI{}.Install(s.FallThroughHandler)
		}
		if c.EnableProfiling {
			routes.Profiling{}.Install(s.FallThroughHandler)
			if c.EnableContentionProfiling {
				goruntime.SetBlockProfileRate(1)
			}
		}
		if c.EnableMetrics {
			if c.EnableProfiling {
				routes.MetricsWithReset{}.Install(s.FallThroughHandler)
			} else {
				routes.DefaultMetrics{}.Install(s.FallThroughHandler)
			}
		}
		routes.Version{Version: c.Version}.Install(s.HandlerContainer)

		if c.EnableDiscovery {
			s.HandlerContainer.Add(s.DynamicApisDiscovery())
		}
	}

注意有的装载到s.FallThroughHandler, 有的装载到了s.HandlerContainer。s.FallThroughHandler是最后的handler。

## 第二次装载

前面只装载了"/"、"/swagger-ui"等基本、辅助性的路径路由，真正的功能性的路径路由还没有添加，回溯代码，可以找到第二次装载:

	//k8s.io/kubernetes/pkg/master/master.go:
	func (c completedConfig) New() (*Master, error) {
		
		...
		
		s, err := c.Config.GenericConfig.SkipComplete().New() // completion is done in Complete, no need for a second time
		
		...
		
		if c.EnableUISupport {
			routes.UIRedirect{}.Install(s.FallThroughHandler)
		}
		if c.EnableLogsSupport {
			routes.Logs{}.Install(s.HandlerContainer)
		}
		
		m := &Master{
			GenericAPIServer: s,
		}
		
		...
		
		m.InstallAPIs(c.Config.APIResourceConfigSource, c.Config.GenericConfig.RESTOptionsGetter, restStorageProviders...)
		
		...

可以看到在FallThroughHandler中又装载了"/ui/"、"/logs"，但功能性的、主要的api是在`m.InstallAPIs()`中装载的。

	//k8s.io/kubernetes/pkg/master/master.go:
	func (m *Master) InstallAPIs(apiResourceConfigSource serverstorage.APIResourceConfigSource, restOptionsGetter generic.RESTOptionsGetter, restStorageProviders ...RESTStorageProvider) {
		apiGroupsInfo := []genericapiserver.APIGroupInfo{}
		...
		for i := range apiGroupsInfo {
			if err := m.GenericAPIServer.InstallAPIGroup(&apiGroupsInfo[i]); err != nil {
				glog.Fatalf("Error in registering group versions: %v", err)
			}
		}
		...

可以看到InstallAPIs()的功能就是将所有的apiGroup装载到GenericAPIServer中。

### InstallAPIGroup()

InstallAPIGroup()是GenericAPIServer的方法，目的是将APIGroupInfo中的storage转换成handler，并装载到GenericAPIServer。

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/genericapiserver.go:
	func (s *GenericAPIServer) InstallAPIGroup(apiGroupInfo *APIGroupInfo) error {
		
		...
		
		if err := s.installAPIResources(APIGroupPrefix, apiGroupInfo); err != nil {
			return err
		}
		...
		
		s.AddAPIGroupForDiscovery(apiGroup)
		s.HandlerContainer.Add(genericapi.NewGroupWebService(s.Serializer, APIGroupPrefix+"/"+apiGroup.Name, apiGroup))
		
		return nil
	}

`installAPIResources()`：

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/genericapiserver.go:
	func (s *GenericAPIServer) installAPIResources(apiPrefix string, apiGroupInfo *APIGroupInfo) error {
		for _, groupVersion := range apiGroupInfo.GroupMeta.GroupVersions {
			if len(apiGroupInfo.VersionedResourcesStorageMap[groupVersion.Version]) == 0 {
				glog.Warningf("Skipping API %v because it has no resources.", groupVersion)
				continue
			}
			
			apiGroupVersion := s.getAPIGroupVersion(apiGroupInfo, groupVersion, apiPrefix)
			if apiGroupInfo.OptionsExternalVersion != nil {
				apiGroupVersion.OptionsExternalVersion = apiGroupInfo.OptionsExternalVersion
			}
			
			if err := apiGroupVersion.InstallREST(s.HandlerContainer.Container); err != nil {
				return fmt.Errorf("Unable to setup API %v: %v", apiGroupInfo, err)
			}
		}
		
		return nil
	}

InstallREST():

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/endpoints/groupversion.go:
	func (g *APIGroupVersion) InstallREST(container *restful.Container) error {
		installer := g.newInstaller()
		ws := installer.NewWebService()
		apiResources, registrationErrors := installer.Install(ws)
		lister := g.ResourceLister
		if lister == nil {
			lister = staticLister{apiResources}
		}
		AddSupportedResourcesWebService(g.Serializer, ws, g.GroupVersion, lister)
		container.Add(ws)
		return utilerrors.NewAggregate(registrationErrors)
	}

注意这里创建了ws，`NewWebService()`:

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/endpoints/installer.go
	func (a *APIInstaller) NewWebService() *restful.WebService {
		ws := new(restful.WebService)
		ws.Path(a.prefix)
		// a.prefix contains "prefix/group/version"
		ws.Doc("API at " + a.prefix)
		// Backwards compatibility, we accepted objects with empty content-type at V1.
		// If we stop using go-restful, we can default empty content-type to application/json on an
		// endpoint by endpoint basis
		ws.Consumes("*/*")
		mediaTypes, streamMediaTypes := negotiation.MediaTypesForSerializer(a.group.Serializer)
		ws.Produces(append(mediaTypes, streamMediaTypes...)...)
		ws.ApiVersion(a.group.GroupVersion.String())

		return ws
	}

在ws中装载REST，`installer.Install()`:

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/endpoints/installer.go
	func (a *APIInstaller) Install(ws *restful.WebService) (apiResources []metav1.APIResource, errors []error) {
		errors = make([]error, 0)
		
		proxyHandler := (&handlers.ProxyHandler{
			Prefix:     a.prefix + "/proxy/",
			Storage:    a.group.Storage,
			Serializer: a.group.Serializer,
			Mapper:     a.group.Context,
		})
		
		paths := make([]string, len(a.group.Storage))
		var i int = 0
		for path := range a.group.Storage {
			paths[i] = path
			i++
		}
		sort.Strings(paths)
		for _, path := range paths {
			apiResource, err := a.registerResourceHandlers(path, a.group.Storage[path], ws, proxyHandler)
			if err != nil {
				errors = append(errors, fmt.Errorf("error in registering resource: %s, %v", path, err))
			}
			if apiResource != nil {
				apiResources = append(apiResources, *apiResource)
			}
		}
		return apiResources, errors
	}

可以按到，在for循环中，将每个path对应的storage传入了registerResourceHandlers()。

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/endpoints/installer.go
	func (a *APIInstaller) registerResourceHandlers(path string, storage rest.Storage, ws *restful.WebService, proxyHandler http.Handler) (*metav1.APIResource, error) {
		admit := a.group.Admit
		
		...
		
		switch action.Verb {
		case "GET": // Get a resource.
			var handler restful.RouteFunction
			if isGetterWithOptions {
				handler = handlers.GetResourceWithOptions(getterWithOptions, reqScope)
			} else {
				handler = handlers.GetResource(getter, exporter, reqScope)
			}
			handler = metrics.InstrumentRouteFunc(action.Verb, resource, handler)
			doc := "read the specified " + kind
			if hasSubresource {
				doc = "read " + subresource + " of the specified " + kind
			}
			route := ws.GET(action.Path).To(handler).
				Doc(doc).
				Param(ws.QueryParameter("pretty", "If 'true', then the output is pretty printed.")).
				Operation("read"+namespaced+kind+strings.Title(subresource)+operationSuffix).
				Produces(append(storageMeta.ProducesMIMETypes(action.Verb), mediaTypes...)...).
				Returns(http.StatusOK, "OK", versionedObject).
				Writes(versionedObject)
			if isGetterWithOptions {
				if err := addObjectParams(ws, route, versionedGetOptions); err != nil {
					return nil, err
				}
			}
			if isExporter {
				if err := addObjectParams(ws, route, versionedExportOptions); err != nil {
					return nil, err
				}
			}
			addParams(route, action.Params)
			ws.Route(route)
		
		...

`registerResourceHandlers`的实现非常长！但是关键过程都在这里了，需要仔细读。特别注意，storage实现了哪些接口，就相应的生成哪些路由。

	func GetResource(r rest.Getter, e rest.Exporter, scope RequestScope) restful.RouteFunction {
		return getResourceHandler(scope,
			func(ctx request.Context, name string, req *restful.Request) (runtime.Object, error) {
				...
				options := metav1.GetOptions{}
				if values := req.Request.URL.Query(); len(values) > 0 {
					exports := metav1.ExportOptions{}
					if err := metainternalversion.ParameterCodec.DecodeParameters(values, scope.MetaGroupVersion, &exports); err != nil {
						return nil, err
					}
					if exports.Export {
						if e == nil {
							return nil, errors.NewBadRequest(fmt.Sprintf("export of %q is not supported", scope.Resource.Resource))
						}
						return e.Export(ctx, name, exports)
					}
					if err := metainternalversion.ParameterCodec.DecodeParameters(values, scope.MetaGroupVersion, &options); err != nil {
						return nil, err
					}
				}
				
				return r.Get(ctx, name, &options)
			})
	}

## unsecure模式

GenericAPIServer创建完成后，就可以启动了，kubernetes的apiserver提供了两个服务端口，一个是unsecure模式，没有认证授权等过程，另一个是secure模式。

### unsecure mode下的REST请求传递过程

unsecure模式比较简单，创建了REST的请求处理链之后，直接启动即可。

unsecure模式下，直接使用最终的ServeMux:

	//k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:
	...
	if insecureServingOptions != nil {
		insecureHandlerChain := kubeserver.BuildInsecureHandlerChain(kubeAPIServer.GenericAPIServer.HandlerContainer.ServeMux, kubeAPIServerConfig.GenericConfig)
		if err := kubeserver.NonBlockingRun(insecureServingOptions, insecureHandlerChain, stopCh); err != nil {
			return err
		}
	}
	...

REST处理链:

	//k8s.io/kubernetes/pkg/kubeapiserver/server/insecure_handler.go:
	func BuildInsecureHandlerChain(apiHandler http.Handler, c *server.Config) http.Handler {
		handler := genericapifilters.WithAudit(apiHandler, c.RequestContextMapper, c.AuditWriter)
		handler = genericfilters.WithCORS(handler, c.CorsAllowedOriginList, nil, nil, nil, "true")
		handler = genericfilters.WithPanicRecovery(handler, c.RequestContextMapper)
		handler = genericfilters.WithTimeoutForNonLongRunningRequests(handler, c.RequestContextMapper, c.LongRunningFunc)
		handler = genericfilters.WithMaxInFlightLimit(handler, c.MaxRequestsInFlight, c.MaxMutatingRequestsInFlight, c.RequestContextMapper, c.LongRunningFunc)
		handler = genericapifilters.WithRequestInfo(handler, server.NewRequestInfoResolver(c), c.RequestContextMapper)
		handler = apirequest.WithRequestContext(handler, c.RequestContextMapper)
		
		return handler
	}

#### REST请求处理链原理

例如添加审计过程,k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/endpoints/filters/audit.go:

	func WithAudit(handler http.Handler, requestContextMapper request.RequestContextMapper, out io.Writer) http.Handler {
		if out == nil {
			return handler
		}
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			ctx, ok := requestContextMapper.Get(req)
			if !ok {
		
		...
		
			respWriter := decorateResponseWriter(w, out, id)
			handler.ServeHTTP(respWriter, req)
		})
	}

可以看到，就是将传入的handler包裹了一下，返回一个新的handler。

### unsecure模式下服务启动

启动过程很简单，就是启动http server，insecureHandler传递给了NonBlockingRun。

	//k8s.io/kubernetes/pkg/kubeapiserver/server/insecure_handler.go:
	func NonBlockingRun(insecureServingInfo *InsecureServingInfo, insecureHandler http.Handler, stopCh <-chan struct{}) error {
		....
		if insecureServingInfo != nil && insecureHandler != nil {
			if err := serveInsecurely(insecureServingInfo, insecureHandler, internalStopCh); err != nil {
				close(internalStopCh)
				return err
			}
		}
		...
	}

	//k8s.io/kubernetes/pkg/kubeapiserver/server/insecure_handler.go:
	func serveInsecurely(insecureServingInfo *InsecureServingInfo, insecureHandler http.Handler, stopCh <-chan struct{}) error {
		insecureServer := &http.Server{
			Addr:           insecureServingInfo.BindAddress,
			Handler:        insecureHandler,
			MaxHeaderBytes: 1 << 20,
		}
		glog.Infof("Serving insecurely on %s", insecureServingInfo.BindAddress)
		var err error
		_, err = server.RunServer(insecureServer, insecureServingInfo.BindNetwork, stopCh)
		return err
	}

insecureHandler传递给了insecureServer。

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/serve.go:
	func RunServer(server *http.Server, network string, stopCh <-chan struct{}) (int, error) {
		if len(server.Addr) == 0 {
			return 0, errors.New("address cannot be empty")
		}
		
		if len(network) == 0 {
			network = "tcp"
		}
		
		// first listen is synchronous (fail early!)
		ln, err := net.Listen(network, server.Addr)
		if err != nil {
			return 0, fmt.Errorf("failed to listen on %v: %v", server.Addr, err)
		}
		
		// get port
		tcpAddr, ok := ln.Addr().(*net.TCPAddr)
		if !ok {
			ln.Close()
			return 0, fmt.Errorf("invalid listen address: %q", ln.Addr().String())
		}
		....

## secure模式

secure模式是在GenericAPIServer的基础上创建了一个aggregatorServer，在aggregatorServer的创建过程完成了REST的请求处理链。

### aggregator Server的创建

	//k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:
	aggregatorConfig, err := createAggregatorConfig(*kubeAPIServerConfig.GenericConfig, runOptions)
	if err != nil {
		return err
	}
	aggregatorServer, err := createAggregatorServer(aggregatorConfig, kubeAPIServer.GenericAPIServer, sharedInformers, stopCh)
	if err != nil {
		// we don't need special handling for innerStopCh because the aggregator server doesn't create any go routines
		return err
	}
	return aggregatorServer.GenericAPIServer.PrepareRun().Run(stopCh)

	//k8s.io/kubernetes/cmd/kube-apiserver/app/aggregator.go,createAggregatorServer():
	aggregatorServer, err := aggregatorConfig.Complete().NewWithDelegate(delegateAPIServer, stopCh)

	//k8s.io/kubernetes/staging/src/k8s.io/kube-aggregator/pkg/apiserver/apiserver.go:
	// New returns a new instance of APIAggregator from the given config.
	func (c completedConfig) NewWithDelegate(delegationTarget genericapiserver.DelegationTarget, stopCh <-chan struct{}) (*APIAggregator, error) {
		genericServer, err := c.Config.GenericConfig.SkipComplete().NewWithDelegate(delegationTarget) // completion is done in Complete, no need for a second time
		if err != nil {
			return nil, err
		}
	......

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/config.go:
	func (c completedConfig) NewWithDelegate(delegationTarget DelegationTarget) (*GenericAPIServer, error) {
		// some pieces of the delegationTarget take precendence.  Callers should already have ensured that these
		// were wired correctly.  Documenting them here.
		// c.RequestContextMapper = delegationTarget.RequestContextMapper()

		s, err := c.constructServer()
		if err != nil {
			return nil, err
		}

		for k, v := range delegationTarget.PostStartHooks() {
			s.postStartHooks[k] = v
		}

		for _, delegateCheck := range delegationTarget.HealthzChecks() {
			skip := false
			for _, existingCheck := range c.HealthzChecks {
				if existingCheck.Name() == delegateCheck.Name() {
					skip = true
					break
				}
			}
			if skip {
				continue
			}
			
			s.healthzChecks = append(s.healthzChecks, delegateCheck)
		}
		
		s.listedPathProvider = routes.ListedPathProviders{s.listedPathProvider, delegationTarget}
		
		// use the UnprotectedHandler from the delegation target to ensure that we don't attempt to double authenticator, authorize,
		// or some other part of the filter chain in delegation cases.
		return c.buildHandlers(s, delegationTarget.UnprotectedHandler())
	}

注意，这里使用的是NewWithDelegate，创建了一个新的GenericAPIServer，并装载了Handler。

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/config.go:
	// buildHandlers builds our handling chain
	func (c completedConfig) buildHandlers(s *GenericAPIServer, delegate http.Handler) (*GenericAPIServer, error) {
		if s.openAPIConfig != nil {
			if s.openAPIConfig.Info == nil {
				s.openAPIConfig.Info = &spec.Info{}
			}
			if s.openAPIConfig.Info.Version == "" {
				if c.Version != nil {
					s.openAPIConfig.Info.Version = strings.Split(c.Version.String(), "-")[0]
				} else {
					s.openAPIConfig.Info.Version = "unversioned"
				}
			}
		}
		
		installAPI(s, c.Config, delegate)
		
		s.Handler = c.BuildHandlerChainFunc(s.HandlerContainer.ServeMux, c.Config)
		
		return s, nil
	}

在BuildHandlerChainFunc中进行了创建REST请求的处理链。

### BuildHandlerChainFunc

	//k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:
	func CreateKubeAPIServerConfig(s *options.ServerRunOptions) (*master.Config, informers.SharedInformerFactory, *kubeserver.InsecureServingInfo, error) {
		...
		genericConfig, sharedInformers, insecureServingOptions, err := BuildGenericConfig(s)
		...

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/config.go:
	// BuildGenericConfig takes the master server options and produces the genericapiserver.Config associated with it
	func BuildGenericConfig(s *options.ServerRunOptions) (*genericapiserver.Config, informers.SharedInformerFactory, *kubeserver.InsecureServingInfo, error) {
		genericConfig := genericapiserver.NewConfig(api.Codecs)
		...

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/config.go:
	func NewConfig(codecs serializer.CodecFactory) *Config {
		return &Config{
			Serializer:                  codecs,
			ReadWritePort:               443,
			RequestContextMapper:        apirequest.NewRequestContextMapper(),
			BuildHandlerChainFunc:       DefaultBuildHandlerChain,
		...

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/config.go:
	func DefaultBuildHandlerChain(apiHandler http.Handler, c *Config) http.Handler {
		handler := genericapifilters.WithAuthorization(apiHandler, c.RequestContextMapper, c.Authorizer)
		handler = genericapifilters.WithImpersonation(handler, c.RequestContextMapper, c.Authorizer)
		handler = genericapifilters.WithAudit(handler, c.RequestContextMapper, c.AuditWriter)
		handler = genericapifilters.WithAuthentication(handler, c.RequestContextMapper, c.Authenticator, genericapifilters.Unauthorized(c.SupportsBasicAuth))
		handler = genericfilters.WithCORS(handler, c.CorsAllowedOriginList, nil, nil, nil, "true")
		handler = genericfilters.WithPanicRecovery(handler, c.RequestContextMapper)
		handler = genericfilters.WithTimeoutForNonLongRunningRequests(handler, c.RequestContextMapper, c.LongRunningFunc)
		handler = genericfilters.WithMaxInFlightLimit(handler, c.MaxRequestsInFlight, c.MaxMutatingRequestsInFlight, c.RequestContextMapper, c.LongRunningFunc)
		handler = genericapifilters.WithRequestInfo(handler, NewRequestInfoResolver(c), c.RequestContextMapper)
		handler = apirequest.WithRequestContext(handler, c.RequestContextMapper)
		return handler
	}

## 参考

1. [kubernetes-style apiserver][1]
2. [go-restful][2]

[1]: https://github.com/kubernetes/apiserver "kubernetes-style apiserver" 
[2]: https://github.com/emicklei/go-restful "go-restful"
