---
layout: default
title: Kubernetes-Apiserver的工作过程
author: lijiaocn
createdate: 2017/05/04 16:28:23
changedate: 2017/05/05 17:35:14
categories:
tags: k8s
keywords: Kubernetes,k8s,Kubernetes的apiserver,请求处理
description: kubernetes的apiserver的实现挺复杂，理解了kubernetes-style的apiserver后, 原理就清晰了。

---

* auto-gen TOC:
{:toc}

## kubernetes-style apiserver

不得不说，k8s的apiserver实现的还是有点复杂的，他们美其名约[kubernetes-style apiserver][1]。

从kubernetes主代码中剥离出来的工作还没有完成：

	apiserver is synced from:
		https://github.com/kubernetes/kubernetes/blob/master/staging/src/k8s.io/apiserver
	Code changes are made in that location, merged into k8s.io/kubernetes and later synced here.

	We have a goal to make this easier to use in 2017.

kubernetes-style apiserver的核心是`GenericAPIServer`

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/genericapiserver.go:

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

`GenericAPIServer`接收`APIGroupInfo`，可以自动为将APIGroupInfo中的storage生成REST风格的handler。

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/genericapiserver.go:

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
	   +NewDefaultAPIGroupInfo(group string, registry *registered.APIRegistrationManager, scheme *runtime.Scheme, parameterCodec runtime.ParameterCodec, codecs serializer.CodecFactory) : APIGroupInfo

注意APIGroupInfo的成员VersionedResourcesStorageMap，storage都存放在这里。

	// Info about an API group.
	type APIGroupInfo struct {
		GroupMeta apimachinery.GroupMeta
		// Info about the resources in this group. Its a map from version to resource to the storage.
		VersionedResourcesStorageMap map[string]map[string]rest.Storage
		...

## go-restful

kubernetes apiserver中最终使用go-restful提供restapi的，有必要先了解下go-restful。

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

kubeAPIServer.GenericAPIServer.HandlerContainer就是一个restful container。在初始化过程多个WebService会被注册到container中。

## 启动

k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:

	// Run runs the specified APIServer.  This should never exit.
	func Run(runOptions *options.ServerRunOptions, stopCh <-chan struct{}) error {
		kubeAPIServerConfig, sharedInformers, insecureServingOptions, err := CreateKubeAPIServerConfig(runOptions)
		if err != nil {
			return err
		}
		kubeAPIServer, err := CreateKubeAPIServer(kubeAPIServerConfig, sharedInformers, stopCh)
		if err != nil {
			return err
		}
		
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
		if err != nil {
			return err
		}
		aggregatorServer, err := createAggregatorServer(aggregatorConfig, kubeAPIServer.GenericAPIServer, sharedInformers, stopCh)
		if err != nil {
			// we don't need special handling for innerStopCh because the aggregator server doesn't create any go routines
			return err
		}
		return aggregatorServer.GenericAPIServer.PrepareRun().Run(stopCh)
	}

主要就是创kuberApiServer，加密模式下，还需要对kuberAPIServer在封装一次。

## kubeApiServer的创建

k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:

	// CreateKubeAPIServer creates and wires a workable kube-apiserver
	func CreateKubeAPIServer(kubeAPIServerConfig *master.Config, sharedInformers informers.SharedInformerFactory, stopCh <-chan struct{}) (*master.Master, error) {
		kubeAPIServer, err := kubeAPIServerConfig.Complete().New()
		if err != nil {
			return nil, err
		}
		...

k8s.io/kubernetes/pkg/master/master.go:

	func (c completedConfig) New() (*Master, error) {
		if reflect.DeepEqual(c.KubeletClientConfig, kubeletclient.KubeletClientConfig{}) {
			return nil, fmt.Errorf("Master.New() called with empty config.KubeletClientConfig")
		}
		
		s, err := c.Config.GenericConfig.SkipComplete().New() // completion is done in Complete, no need for a second time
		if err != nil {
			return nil, err
		}
		
		...
		
		m := &Master{
			GenericAPIServer: s,
		}
		
		...
		
		m.InstallAPIs(c.Config.APIResourceConfigSource, c.Config.GenericConfig.RESTOptionsGetter, restStorageProviders...)
		
		...

注意这里首先创建了s，然后添加到m中，m又调用InstallAPIs进行WebService装载。

## GenericAPIServer创建

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/config.go:

	func (c completedConfig) New() (*GenericAPIServer, error) {
		s, err := c.constructServer()
		if err != nil {
			return nil, err
		}
		
		return c.buildHandlers(s, nil)
	}

在constructServer中创建了container。

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/config.go:

	func (c completedConfig) constructServer() (*GenericAPIServer, error) {
		if c.Serializer == nil {
			return nil, fmt.Errorf("Genericapiserver.New() called with config.Serializer == nil")
		}
		if c.LoopbackClientConfig == nil {
			return nil, fmt.Errorf("Genericapiserver.New() called with config.LoopbackClientConfig == nil")
		}

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

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/mux/container.go:

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

		// register the defaultHandler for everything.  This will allow an unhandled request to fall through to another handler instead of
		// ending up with a forced 404
		c.Container.Handle("/", defaultMux)

		return &c
	}

注意，这里hack里go-restful，将c.Container.ServeMux做了替换，go-restful的实现中，所有的url路由最终都存放在这里。

这也是unsecure模式下，直接使用ServerMux的原因：

k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:

	// run the insecure server now, don't block.  It doesn't have any aggregator goodies since authentication wouldn't work
	if insecureServingOptions != nil {
		insecureHandlerChain := kubeserver.BuildInsecureHandlerChain(kubeAPIServer.GenericAPIServer.HandlerContainer.ServeMux, kubeAPIServerConfig.GenericConfig)
		if err := kubeserver.NonBlockingRun(insecureServingOptions, insecureHandlerChain, stopCh); err != nil {
			return err
		}
	}

unsecure模式下直接使用kubeAPIServer.GenericAPIServer.HandlerContainer.ServeMux。

## API的Install过程

API的install就是将url路由添加到前面创建的container中。

首先回顾一下container的创建过程:

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/mux/container.go:

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
		
		// register the defaultHandler for everything.  This will allow an unhandled request to fall through to another handler instead of
		// ending up with a forced 404
		c.Container.Handle("/", defaultMux)
		
		return &c
	}

注意，c.Container.Router()中使用的路由是restful.CurlyRouter，url格式为：

	proxy/{kind}/{name}/{*}

这里还有一个defaultMux，暂时不管，后面专门分析。而在NewAPIContainer()的调用者constructServer()的调用者中:

	func (c completedConfig) New() (*GenericAPIServer, error) {
		s, err := c.constructServer()
		if err != nil {
			return nil, err
		}
		
		return c.buildHandlers(s, nil)
	}

## 第一次装载

在`c.constructServer()`创建后，调用`c.buildHandlers()`进行第一次装载。

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/config.go:

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

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/config.go:

	func installAPI(s *GenericAPIServer, c *Config, delegate http.Handler) {
		switch {
		case c.EnableIndex:
			routes.Index{}.Install(s.listedPathProvider, c.FallThroughHandler, delegate)

		case delegate != nil:
			// if we have a delegate, allow it to handle everything that's unmatched even if
			// the index is disabled.
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

注意有的装载到s.FallThroughHandler, 有的装载到了s.HandlerContainer。正如名字所示，s.FallThroughHandler是最后的handler。

## 第二次装载

前面只装载了"/"、"/swagger-ui"等基本、辅助性的路径，真正的功能性的路径还没有添加，回溯代码，可以找到第二次装载:

k8s.io/kubernetes/pkg/master/master.go:

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

k8s.io/kubernetes/pkg/master/master.go:

	// InstallAPIs will install the APIs for the restStorageProviders if they are enabled.
	func (m *Master) InstallAPIs(apiResourceConfigSource serverstorage.APIResourceConfigSource, restOptionsGetter generic.RESTOptionsGetter, restStorageProviders ...RESTStorageProvider) {
		apiGroupsInfo := []genericapiserver.APIGroupInfo{}
		
		...
		
		for i := range apiGroupsInfo {
			if err := m.GenericAPIServer.InstallAPIGroup(&apiGroupsInfo[i]); err != nil {
				glog.Fatalf("Error in registering group versions: %v", err)
			}
		}
		
		...

可以看到InstallAPIs就是将所有的apiGroup转载到GenericAPIServer中。

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/genericapiserver.go:

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

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/genericapiserver.go:

	// installAPIResources is a private method for installing the REST storage backing each api groupversionresource
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

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/endpoints/groupversion.go:

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

ws的创建，k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/endpoints/installer.go:

	// NewWebService creates a new restful webservice with the api installer's prefix and version.
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

在ws中装载REST，k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/endpoints/installer.go:

	// Installs handlers for API resources.
	func (a *APIInstaller) Install(ws *restful.WebService) (apiResources []metav1.APIResource, errors []error) {
		errors = make([]error, 0)
		
		proxyHandler := (&handlers.ProxyHandler{
			Prefix:     a.prefix + "/proxy/",
			Storage:    a.group.Storage,
			Serializer: a.group.Serializer,
			Mapper:     a.group.Context,
		})
		
		// Register the paths in a deterministic (sorted) order to get a deterministic swagger spec.
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

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/endpoints/installer.go:

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

handler的生成，即直接访问storage：

	// GetResource returns a function that handles retrieving a single resource from a rest.Storage object.
	func GetResource(r rest.Getter, e rest.Exporter, scope RequestScope) restful.RouteFunction {
		return getResourceHandler(scope,
			func(ctx request.Context, name string, req *restful.Request) (runtime.Object, error) {
				// For performance tracking purposes.
				trace := utiltrace.New("Get " + req.Request.URL.Path)
				defer trace.LogIfLong(500 * time.Millisecond)

				// check for export
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

## 参考

1. [kubernetes-style apiserver][1]
2. [go-restful][2]

[1]: https://github.com/kubernetes/apiserver "kubernetes-style apiserver" 
[2]: https://github.com/emicklei/go-restful "go-restful"
