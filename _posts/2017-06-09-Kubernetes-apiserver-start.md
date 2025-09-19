---
layout: default
title: kubernetes的apiserver的启动过程
author: 李佶澳
createdate: 2017/06/09 15:57:36
last_modified_at: 2017/06/13 11:20:42
categories: 项目
tags: kubernetes
keywords: kubernetes,apiserver
description: v1.6.4的版本对apiserver的启动过程的代码做了大量修改，结构更为清晰

---

## 目录
* auto-gen TOC:
{:toc}

v1.6.4的版本对apiserver的启动过程的代码做了大量修改，结构更为清晰。

## GenericAPIServer

k8s的apiserver实现的还是有点复杂的，k8s自称为[kubernetes-style apiserver][1]，核心是`GenericAPIServer`:

	调用GenericAPIServer的InstallAPIGroup()和InstallLegacyAPIGroup()方法
	这两个方法会自动根据传入参数APIGrupInfo中的storage信息，生成REST请求的Handler

### definitions 

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
	   +NewDefaultAPIGroupInfo(group string, registry *registered.APIRegistrationManager, \
	        scheme *runtime.Scheme, parameterCodec runtime.ParameterCodec, codecs serializer.CodecFactory) : APIGroupInfo

### InstallLegacyAPIGroup()

staging/src/k8s.io/apiserver/pkg/server/genericapiserver.go

	func (s *GenericAPIServer) InstallLegacyAPIGroup(apiPrefix string, apiGroupInfo *APIGroupInfo) error {
		...
		if err := s.installAPIResources(apiPrefix, apiGroupInfo); err != nil {
			return err
		}
		...
		return nil
	}

### APIGroupVersion

GenericAPIServer的`installAPIResources()`方法是通过APIGroupVersion完成装载的。

staging/src/k8s.io/apiserver/pkg/server/genericapiserver.go

	func (s *GenericAPIServer) installAPIResources(apiPrefix string, apiGroupInfo *APIGroupInfo) error {
		for _, groupVersion := range apiGroupInfo.GroupMeta.GroupVersions {
			apiGroupVersion := s.getAPIGroupVersion(apiGroupInfo, groupVersion, apiPrefix)
			...
			if err := apiGroupVersion.InstallREST(s.HandlerContainer.Container); err != nil {
				return fmt.Errorf("Unable to setup API %v: %v", apiGroupInfo, err)
			}
		}
		return nil
	}

APIGroupVersion是将APIGroupInfo中属于同一个API组的资源单独汇总。

	func (s *GenericAPIServer) getAPIGroupVersion(apiGroupInfo *APIGroupInfo, groupVersion schema.GroupVersion, apiPrefix string) *genericapi.APIGroupVersion {
		storage := make(map[string]rest.Storage)
		for k, v := range apiGroupInfo.VersionedResourcesStorageMap[groupVersion.Version] {
			storage[strings.ToLower(k)] = v
		}
		version := s.newAPIGroupVersion(apiGroupInfo, groupVersion)
		version.Root = apiPrefix
		version.Storage = storage
		return version
	}
	
	func (s *GenericAPIServer) newAPIGroupVersion(apiGroupInfo *APIGroupInfo, groupVersion schema.GroupVersion) *genericapi.APIGroupVersion {
		return &genericapi.APIGroupVersion{
			GroupVersion:     groupVersion,
			MetaGroupVersion: apiGroupInfo.MetaGroupVersion,
			
			ParameterCodec:  apiGroupInfo.ParameterCodec,
			Serializer:      apiGroupInfo.NegotiatedSerializer,
			Creater:         apiGroupInfo.Scheme,
			Convertor:       apiGroupInfo.Scheme,
			UnsafeConvertor: runtime.UnsafeObjectConvertor(apiGroupInfo.Scheme),
			Copier:          apiGroupInfo.Scheme,
			Defaulter:       apiGroupInfo.Scheme,
			Typer:           apiGroupInfo.Scheme,
			SubresourceGroupVersionKind: apiGroupInfo.SubresourceGroupVersionKind,
			Linker: apiGroupInfo.GroupMeta.SelfLinker,
			Mapper: apiGroupInfo.GroupMeta.RESTMapper,
			
			Admit:             s.admissionControl,
			Context:           s.RequestContextMapper(),
			MinRequestTimeout: s.minRequestTimeout,
		}
	}


可以看到apiGroupVersion直接在Container中注册了handler。

staging/src/k8s.io/apiserver/pkg/endpoints/groupversion.go

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

### APIInstaller

APIInstaller又封装了APIGroupVersion。

staging/src/k8s.io/apiserver/pkg/endpoints/groupversion.go

	func (g *APIGroupVersion) newInstaller() *APIInstaller {
		prefix := path.Join(g.Root, g.GroupVersion.Group, g.GroupVersion.Version)
		installer := &APIInstaller{
			group:             g,
			prefix:            prefix,
			minRequestTimeout: g.MinRequestTimeout,
		}
		return installer
	}

APIInstaller中创建了WebService:

staging/src/k8s.io/apiserver/pkg/endpoints/installer.go:

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

APIInstaller将Handler装载到WebService中:

staging/src/k8s.io/apiserver/pkg/endpoints/installer.go：

	func (a *APIInstaller) Install(ws *restful.WebService) (apiResources []metav1.APIResource, errors []error) {
		...
		paths := make([]string, len(a.group.Storage))
		var i int = 0
		for path := range a.group.Storage {
			paths[i] = path
			i++
		}
		sort.Strings(paths)
		for _, path := range paths {
			apiResource, err := a.registerResourceHandlers(path, a.group.Storage[path], ws, proxyHandler)
			...
			if apiResource != nil {
				apiResources = append(apiResources, *apiResource)
			}
		}
		return apiResources, errors
	}

staging/src/k8s.io/apiserver/pkg/endpoints/installer.go:

	func (a *APIInstaller) registerResourceHandlers(path string, storage rest.Storage, ws *restful.WebService, proxyHandler http.Handler) (*metav1.APIResource, error) {
		...
		mapping, err := a.restMapping(resource)
		...
		creater, isCreater := storage.(rest.Creater)
		namedCreater, isNamedCreater := storage.(rest.NamedCreater)
		lister, isLister := storage.(rest.Lister)
		connecter, isConnecter := storage.(rest.Connecter)
		...
		
		scope := mapping.Scope
		
		nameParam := ws.PathParameter("name", "name of the "+kind).DataType("string")
		pathParam := ws.PathParameter("path", "path to the resource").DataType("string")
		
		params := []*restful.Parameter{}
		actions := []action{}
		
		...
		var apiResource metav1.APIResource
		// Get the list of actions for the given scope.
		switch scope.Name() {
		case meta.RESTScopeNameRoot:
			// Handle non-namespace scoped resources like nodes.
			resourcePath := resource
			resourceParams := params
			itemPath := resourcePath + "/{name}"
			nameParams := append(params, nameParam)
			proxyParams := append(nameParams, pathParam)
			suffix := ""
			if hasSubresource {
				suffix = "/" + subresource
				itemPath = itemPath + suffix
				resourcePath = itemPath
				resourceParams = nameParams
			}
			apiResource.Name = path
			apiResource.Namespaced = false
			apiResource.Kind = resourceKind
			namer := rootScopeNaming{scope, a.group.Linker, gpath.Join(a.prefix, resourcePath, "/"), suffix}
			
			// Handler for standard REST verbs (GET, PUT, POST and DELETE).
			// Add actions at the resource path: /api/apiVersion/resource
			actions = appendIf(actions, action{"LIST", resourcePath, resourceParams, namer, false}, isLister)
			actions = appendIf(actions, action{"POST", resourcePath, resourceParams, namer, false}, isCreater)
			actions = appendIf(actions, action{"DELETECOLLECTION", resourcePath, resourceParams, namer, false}, isCollectionDeleter)
			...
			actions = appendIf(actions, action{"PUT", itemPath, nameParams, namer, false}, isUpdater)
			actions = appendIf(actions, action{"PATCH", itemPath, nameParams, namer, false}, isPatcher)
			actions = appendIf(actions, action{"DELETE", itemPath, nameParams, namer, false}, isDeleter)
			actions = appendIf(actions, action{"WATCH", "watch/" + itemPath, nameParams, namer, false}, isWatcher)
			...
		case meta.RESTScopeNameNamespace:
			...
		}
		...
		var ctxFn handlers.ContextFunc
		ctxFn = func(req *restful.Request) request.Context {
			if context == nil {
				return request.WithUserAgent(request.NewContext(), req.HeaderParameter("User-Agent"))
			}
			if ctx, ok := context.Get(req.Request); ok {
				return request.WithUserAgent(ctx, req.HeaderParameter("User-Agent"))
			}
			return request.WithUserAgent(request.NewContext(), req.HeaderParameter("User-Agent"))
		}
		...
		admit := a.group.Admit
		...
		resource, subresource, err := splitSubresource(path)
		...
		fqKindToRegister, err := a.getResourceKind(path, storage)
		...
		reqScope := handlers.RequestScope{
			ContextFunc:     ctxFn,
			Serializer:      a.group.Serializer,
			ParameterCodec:  a.group.ParameterCodec,
			Creater:         a.group.Creater,
			Convertor:       a.group.Convertor,
			Copier:          a.group.Copier,
			Defaulter:       a.group.Defaulter,
			Typer:           a.group.Typer,
			UnsafeConvertor: a.group.UnsafeConvertor,
			Resource:    a.group.GroupVersion.WithResource(resource),
			Subresource: subresource,
			Kind:        fqKindToRegister,
			MetaGroupVersion: metav1.SchemeGroupVersion,
		}
		...
		for _, action := range actions {
			...
			switch action.Verb {
			...
			case "POST": // Create a resource.
				var handler restful.RouteFunction
				if isNamedCreater {
					handler = handlers.CreateNamedResource(namedCreater, reqScope, a.group.Typer, admit)
				} else {
					handler = handlers.CreateResource(creater, reqScope, a.group.Typer, admit)
				}
				handler = metrics.InstrumentRouteFunc(action.Verb, resource, handler)
				article := getArticleForNoun(kind, " ")
				doc := "create" + article + kind
				if hasSubresource {
					doc = "create " + subresource + " of" + article + kind
				}
				route := ws.POST(action.Path).To(handler).
					Doc(doc).
					Param(ws.QueryParameter("pretty", "If 'true', then the output is pretty printed.")).
					Operation("create"+namespaced+kind+strings.Title(subresource)+operationSuffix).
					Produces(append(storageMeta.ProducesMIMETypes(action.Verb), mediaTypes...)...).
					Returns(http.StatusOK, "OK", versionedObject).
					Reads(versionedObject).
					Writes(versionedObject)
				addParams(route, action.Params)
				ws.Route(route)
				...
		}
		...
	}

从上面的代码可以看到如果传入的storage实现了接口`rest.Creater`，那么就是添加一个POST方法的Handler。

handlers.CreateResource()中传入的四个参数，除了creater，另外三个来自于：

	APIInstaller.group 即 APIGroupVersion 即 APIGroupInfo。

在前面`APIGroupVersion`的一节中，可以看到由APIGroupInfo传递到APIInstaller.group的过程。

### handlers.CreateResource()

staging/src/k8s.io/apiserver/pkg/endpoints/handlers/rest.go:

	func CreateResource(r rest.Creater, scope RequestScope, typer runtime.ObjectTyper, admit admission.Interface) restful.RouteFunction {
		return createHandler(&namedCreaterAdapter{r}, scope, typer, admit, false)
	}

staging/src/k8s.io/apiserver/pkg/endpoints/handlers/rest.go

	func createHandler(r rest.NamedCreater, scope RequestScope, typer runtime.ObjectTyper, admit admission.Interface, includeName bool) restful.RouteFunction {
		return func(req *restful.Request, res *restful.Response) {
			...
			w := res.ResponseWriter
			...
			if includeName {
				namespace, name, err = scope.Namer.Name(req)
			} else {
				namespace, err = scope.Namer.Namespace(req)
			}
			...
			ctx := scope.ContextFunc(req)
			ctx = request.WithNamespace(ctx, namespace)
			
			gv := scope.Kind.GroupVersion()
			s, err := negotiation.NegotiateInputSerializer(req.Request, scope.Serializer)
			...
			decoder := scope.Serializer.DecoderToVersion(s.Serializer, schema.GroupVersion{Group: gv.Group, Version: runtime.APIVersionInternal})
			
			body, err := readBody(req.Request)
			...
			defaultGVK := scope.Kind
			original := r.New()
			...
			obj, gvk, err := decoder.Decode(body, &defaultGVK, original)
			...
			result, err := finishRequest(timeout, func() (runtime.Object, error) {
				out, err := r.Create(ctx, name, obj)
				if status, ok := out.(*metav1.Status); ok && err == nil && status.Code == 0 {
					status.Code = http.StatusCreated
				}
				return out, err
			})
			...
			if err := setSelfLink(result, req, scope.Namer); err != nil {
				scope.err(err, res.ResponseWriter, req.Request)
				return
			}
			...
			responsewriters.WriteObject(http.StatusCreated, scope.Kind.GroupVersion(), scope.Serializer, result, w, req.Request)
		}
	}

可以看到传入参数r就是creater。

### handler中反序列化过程

在上面处理request等过程中国年，有一个关键变量scope，序列化等一些关键等函数都存放在scope中。

scope是在调用者`registerResourceHandlers()`中创建的：

staging/src/k8s.io/apiserver/pkg/endpoints/installer.go:

		reqScope := handlers.RequestScope{
			ContextFunc:     ctxFn,
			Serializer:      a.group.Serializer,
			ParameterCodec:  a.group.ParameterCodec,
			Creater:         a.group.Creater,
			Convertor:       a.group.Convertor,
			Copier:          a.group.Copier,
			Defaulter:       a.group.Defaulter,
			Typer:           a.group.Typer,
			UnsafeConvertor: a.group.UnsafeConvertor,
			Resource:    a.group.GroupVersion.WithResource(resource),
			Subresource: subresource,
			Kind:        fqKindToRegister,
			MetaGroupVersion: metav1.SchemeGroupVersion,
		}

其中，a是APIInstaller，a.group是APIGroupVersion，APIGroupVersion又源自APIGroupInfo，如下:

	func (s *GenericAPIServer) newAPIGroupVersion(apiGroupInfo *APIGroupInfo, groupVersion schema.GroupVersion) *genericapi.APIGroupVersion {
		return &genericapi.APIGroupVersion{
			GroupVersion:     groupVersion,
			MetaGroupVersion: apiGroupInfo.MetaGroupVersion,
			
			ParameterCodec:  apiGroupInfo.ParameterCodec,
			Serializer:      apiGroupInfo.NegotiatedSerializer,
			Creater:         apiGroupInfo.Scheme,
			Convertor:       apiGroupInfo.Scheme,
			UnsafeConvertor: runtime.UnsafeObjectConvertor(apiGroupInfo.Scheme),
			Copier:          apiGroupInfo.Scheme,
			Defaulter:       apiGroupInfo.Scheme,
			Typer:           apiGroupInfo.Scheme,
			SubresourceGroupVersionKind: apiGroupInfo.SubresourceGroupVersionKind,
			Linker: apiGroupInfo.GroupMeta.SelfLinker,
			Mapper: apiGroupInfo.GroupMeta.RESTMapper,
			
			Admit:             s.admissionControl,
			Context:           s.RequestContextMapper(),
			MinRequestTimeout: s.minRequestTimeout,
		}
	}

APIGroupInfo是在Master.InstallLegacyAPI()中通过generic.RESTOptionsGetter创建的：

pkg/master/master.go:

	func (m *Master) InstallLegacyAPI(c *Config, restOptionsGetter generic.RESTOptionsGetter, legacyRESTStorageProvider corerest.LegacyRESTStorageProvider) {
		legacyRESTStorage, apiGroupInfo, err := legacyRESTStorageProvider.NewLegacyRESTStorage(restOptionsGetter)
		...

pkg/registry/core/rest/storage_core.go:

	func (c LegacyRESTStorageProvider) NewLegacyRESTStorage(restOptionsGetter generic.RESTOptionsGetter) (LegacyRESTStorage, genericapiserver.APIGroupInfo, error) {
		apiGroupInfo := genericapiserver.APIGroupInfo{
			GroupMeta:                    *api.Registry.GroupOrDie(api.GroupName),
			VersionedResourcesStorageMap: map[string]map[string]rest.Storage{},
			Scheme:                      api.Scheme,
			ParameterCodec:              api.ParameterCodec,
			NegotiatedSerializer:        api.Codecs,
			SubresourceGroupVersionKind: map[string]schema.GroupVersionKind{},
		}
		
		podStorage := podstore.NewStorage(
			restOptionsGetter,
			nodeStorage.KubeletConnectionInfo,
			c.ProxyTransport,
			podDisruptionClient,
		)
		...
		endpointsStorage := endpointsstore.NewREST(restOptionsGetter)
		nodeStorage, err := nodestore.NewStorage(restOptionsGetter, c.KubeletClientConfig, c.ProxyTransport)
		...
		restStorageMap := map[string]rest.Storage{
			"pods":             podStorage.Pod,
			"pods/attach":      podStorage.Attach,
			"pods/status":      podStorage.Status,
			...
			"endpoints":        endpointsStorage,
			"nodes":            nodeStorage.Node,
			...
		apiGroupInfo.VersionedResourcesStorageMap["v1"] = restStorageMap
		...

可以看到这里使用了`"k8s.io/kubernetes/pkg/api"`中的定义:

	var Registry = registered.NewOrDie(os.Getenv("KUBE_API_VERSIONS"))
	var Scheme = runtime.NewScheme()
	var ParameterCodec = runtime.NewParameterCodec(Scheme)
	var Codecs = serializer.NewCodecFactory(Scheme)

可以看到ParameterCodec和Codecs都是在Scheme的基础上的。

staging/src/k8s.io/apimachinery/pkg/runtime/scheme.go:

	// Scheme defines methods for serializing and deserializing API objects, a type
	// registry for converting group, version, and kind information to and from Go
	// schemas, and mappings between Go schemas of different versions. A scheme is the
	// foundation for a versioned API and versioned configuration over time.
	//
	// In a Scheme, a Type is a particular Go struct, a Version is a point-in-time
	// identifier for a particular representation of that Type (typically backwards
	// compatible), a Kind is the unique name for that Type within the Version, and a
	// Group identifies a set of Versions, Kinds, and Types that evolve over time. An
	// Unversioned Type is one that is not yet formally bound to a type and is promised
	// to be backwards compatible (effectively a "v1" of a Type that does not expect
	// to break in the future).
	//
	// Schemes are not expected to change at runtime and are only threadsafe after
	// registration is complete.

Scheme是在apimachinery中定义的。apimachinery是一个独立的package，单独分析它的使用。

## apimachinery

apimachinery代码位于staging/src/k8s.io/apimachinery目录中，同时导出到了一个单独的[repo][1]中。

### Scheme

apimachinery的中心是`type Scheme struct`，Schem中记录了资源名称与类型的映射关系，以及转换、序列化函数。

staging/src/k8s.io/apimachinery/pkg/runtime/scheme.go:

	type Scheme struct {
		//资源名称映射到资源类型
		gvkToType map[schema.GroupVersionKind]reflect.Type
		
		//资源类型映射到资源名称
		typeToGVK map[reflect.Type][]schema.GroupVersionKind
		
		// unversionedTypes are transformed without conversion in ConvertToVersion.
		unversionedTypes map[reflect.Type]schema.GroupVersionKind
		
		// unversionedKinds are the names of kinds that can be created in the context of any group
		unversionedKinds map[string]reflect.Type
		
		fieldLabelConversionFuncs map[string]map[string]FieldLabelConversionFunc
		
		// defaulterFuncs is an array of interfaces to be called with an object to provide defaulting
		// the provided object must be a pointer.
		defaulterFuncs map[reflect.Type]func(interface{})
		
		//conversion函数
		converter *conversion.Converter
		
		//clone函数
		cloner *conversion.Cloner
	}

通过调用Scheme的方法相关函数的注册：

	-+Scheme : struct
	   [fields]
	   -cloner : *conversion.Cloner
	   -converter : *conversion.Converter
	   -defaulterFuncs : map[reflect.Type]func(interface{})
	   -fieldLabelConversionFuncs : map[string]map[string]FieldLabelConversionFunc
	   -gvkToType : map[schema.GroupVersionKind]reflect.Type
	   -typeToGVK : map[reflect.Type][]schema.GroupVersionKind
	   -unversionedKinds : map[string]reflect.Type
	   -unversionedTypes : map[reflect.Type]schema.GroupVersionKind
	   [methods]
	   +AddConversionFuncs(conversionFuncs ) : error
	   +AddDeepCopyFuncs(deepCopyFuncs ) : error
	   +AddDefaultingFuncs(defaultingFuncs ) : error
	   +AddFieldLabelConversionFunc(version, kind string, conversionFunc FieldLabelConversionFunc) : error
	   +AddGeneratedConversionFuncs(conversionFuncs ) : error
	   +AddGeneratedDeepCopyFuncs(deepCopyFuncs ) : error
	   ...

注册过程函数在每组api的install.go文件中被注册，以pkg/api为例:

pkg/api/install/install.go:

	func init() {
		Install(api.GroupFactoryRegistry, api.Registry, api.Scheme)
	}
	
	func Install(groupFactoryRegistry announced.APIGroupFactoryRegistry, registry *registered.APIRegistrationManager, scheme *runtime.Scheme) {
		if err := announced.NewGroupMetaFactory(
			&announced.GroupMetaFactoryArgs{
				GroupName:                  api.GroupName,
				VersionPreferenceOrder:     []string{v1.SchemeGroupVersion.Version},
				ImportPrefix:               "k8s.io/kubernetes/pkg/api",
				AddInternalObjectsToScheme: api.AddToScheme,
				RootScopedKinds: sets.NewString(
					"Node",
					"Namespace",
					"PersistentVolume",
					"ComponentStatus",
				),
				IgnoredKinds: sets.NewString(
					"ListOptions",
					"DeleteOptions",
					"Status",
					"PodLogOptions",
					...
				),
			},
			announced.VersionToSchemeFunc{
				v1.SchemeGroupVersion.Version: v1.AddToScheme,
			},
		).Announce(groupFactoryRegistry).RegisterAndEnable(registry, scheme); err != nil {
			panic(err)
		}
	}

这里的变量v1.AddToScheme在pkg/api/v1/register.go中定义:

	SchemeBuilder = runtime.NewSchemeBuilder(addKnownTypes, addDefaultingFuncs, addConversionFuncs, addFastPathConversionFuncs)
	AddToScheme   = SchemeBuilder.AddToScheme

SchemeBuilder中注册了函数`addKnownType()`，就是在addKnownType()中调用了Scheme的方法完成了注册：

pkg/api/register.go:

	func addKnownTypes(scheme *runtime.Scheme) error {
		scheme.AddKnownTypes(SchemeGroupVersion,
			&Pod{},
			&PodList{},
			&PodStatusResult{},
			&PodTemplate{},
			&PodTemplateList{},
			&ReplicationController{},
			...
		)
		scheme.AddKnownTypes(SchemeGroupVersion, &metav1.Status{})
		metav1.AddToGroupVersion(scheme, SchemeGroupVersion)
		return nil
	}

### NewGroupMetaFactory()

staging/src/k8s.io/apimachinery/pkg/apimachinery/announced/group_factory.go:

	func NewGroupMetaFactory(groupArgs *GroupMetaFactoryArgs, versions VersionToSchemeFunc) *GroupMetaFactory {
		gmf := &GroupMetaFactory{
			GroupArgs:   groupArgs,
			VersionArgs: map[string]*GroupVersionFactoryArgs{},
		}
		for v, f := range versions {
			gmf.VersionArgs[v] = &GroupVersionFactoryArgs{
				GroupName:   groupArgs.GroupName,
				VersionName: v,
				AddToScheme: f,
			}
		}
		return gmf
	}

### Announce()

Annouce()的过程就是将GroupMetaFactory添加到变量api.GroupFactoryRegistry中。

pkg/api/register.go

	var GroupFactoryRegistry = make(announced.APIGroupFactoryRegistry)

staging/src/k8s.io/apimachinery/pkg/apimachinery/announced/group_factory.go:

	func (gmf *GroupMetaFactory) Announce(groupFactoryRegistry APIGroupFactoryRegistry) *GroupMetaFactory {
		if err := groupFactoryRegistry.AnnouncePreconstructedFactory(gmf); err != nil {
			panic(err)
		}
		return gmf
	}

staging/src/k8s.io/apimachinery/pkg/apimachinery/announced/announced.go:

	func (gar APIGroupFactoryRegistry) AnnouncePreconstructedFactory(gmf *GroupMetaFactory) error {
		name := gmf.GroupArgs.GroupName
		if _, exists := gar[name]; exists {
			return fmt.Errorf("the group %q has already been announced.", name)
		}
		gar[name] = gmf
		return nil
	}

### RegisterAndEnable()

staging/src/k8s.io/apimachinery/pkg/apimachinery/announced/group_factory.go:

	func (gmf *GroupMetaFactory) RegisterAndEnable(registry *registered.APIRegistrationManager, scheme *runtime.Scheme) error {
		if err := gmf.Register(registry); err != nil {
			return err
		}
		if err := gmf.Enable(registry, scheme); err != nil {
			return err
		}
		return nil
	}

#### Register()

Register()函数的作用是将GroupVersion按照指定的优先级排序后，注册到传入参数m中：

	func (gmf *GroupMetaFactory) Register(m *registered.APIRegistrationManager) error {
		...
		pvSet := sets.NewString(gmf.GroupArgs.VersionPreferenceOrder...)
		if pvSet.Len() != len(gmf.GroupArgs.VersionPreferenceOrder) {
			return fmt.Errorf("preference order for group %v has duplicates: %v", gmf.GroupArgs.GroupName, gmf.GroupArgs.VersionPreferenceOrder)
		}
		prioritizedVersions := []schema.GroupVersion{}
		for _, v := range gmf.GroupArgs.VersionPreferenceOrder {
			prioritizedVersions = append(
				prioritizedVersions,
				schema.GroupVersion{
					Group:   gmf.GroupArgs.GroupName,
					Version: v,
				},
			)
		}
		unprioritizedVersions := []schema.GroupVersion{}
		for _, v := range gmf.VersionArgs {
			if v.GroupName != gmf.GroupArgs.GroupName {
				return fmt.Errorf("found %v/%v in group %v?", v.GroupName, v.VersionName, gmf.GroupArgs.GroupName)
			}
			if pvSet.Has(v.VersionName) {
				pvSet.Delete(v.VersionName)
				continue
			}
			unprioritizedVersions = append(unprioritizedVersions, schema.GroupVersion{Group: v.GroupName, Version: v.VersionName})
		}
		...
		prioritizedVersions = append(prioritizedVersions, unprioritizedVersions...)
		m.RegisterVersions(prioritizedVersions)
		gmf.prioritizedVersionList = prioritizedVersions
		return nil
	}

m的类型是APIRegistrationManager:

staging/src/k8s.io/apimachinery/pkg/apimachinery/registered/registered.go:

	func (m *APIRegistrationManager) RegisterVersions(availableVersions []schema.GroupVersion) { for _, v := range availableVersions {
			m.registeredVersions[v] = struct{}{}
		}
	}

传入的参数registry是api.Registry:

pkg/api/register.go:

	var Registry = registered.NewOrDie(os.Getenv("KUBE_API_VERSIONS"))

staging/src/k8s.io/apimachinery/pkg/apimachinery/registered/registered.go:

#### Enable()

Enable主要完成了两个工作，注册到参数m中，添加到scheme中。

	func (gmf *GroupMetaFactory) Enable(m *registered.APIRegistrationManager, scheme *runtime.Scheme) error {
		externalVersions := []schema.GroupVersion{}
		for _, v := range gmf.prioritizedVersionList {
			if !m.IsAllowedVersion(v) {
				continue
			}
			externalVersions = append(externalVersions, v)
			if err := m.EnableVersions(v); err != nil {
				return err
			}
			gmf.VersionArgs[v.Version].AddToScheme(scheme)
		}
		...
		if gmf.GroupArgs.AddInternalObjectsToScheme != nil {
			gmf.GroupArgs.AddInternalObjectsToScheme(scheme)
		}
		
		preferredExternalVersion := externalVersions[0]
		accessor := meta.NewAccessor()
		
		groupMeta := &apimachinery.GroupMeta{
			GroupVersion:  preferredExternalVersion,
			GroupVersions: externalVersions,
			SelfLinker:    runtime.SelfLinker(accessor),
		}
		for _, v := range externalVersions {
			gvf := gmf.VersionArgs[v.Version]
			if err := groupMeta.AddVersionInterfaces(
				schema.GroupVersion{Group: gvf.GroupName, Version: gvf.VersionName},
				&meta.VersionInterfaces{
					ObjectConvertor:  scheme,
					MetadataAccessor: accessor,
				},
			); err != nil {
				return err
			}
		}
		groupMeta.InterfacesFor = groupMeta.DefaultInterfacesFor
		groupMeta.RESTMapper = gmf.newRESTMapper(scheme, externalVersions, groupMeta)
		
		if err := m.RegisterGroup(*groupMeta); err != nil {
			return err
		}
		return nil
	}

传入的参数m是api.Registry:

	var Registry = registered.NewOrDie(os.Getenv("KUBE_API_VERSIONS"))

staging/src/k8s.io/apimachinery/pkg/apimachinery/registered/registered.go:

	func (m *APIRegistrationManager) RegisterGroup(groupMeta apimachinery.GroupMeta) error {
		groupName := groupMeta.GroupVersion.Group
		if _, found := m.groupMetaMap[groupName]; found {
			return fmt.Errorf("group %q is already registered in groupsMap: %v", groupName, m.groupMetaMap)
		}
		m.groupMetaMap[groupName] = &groupMeta
		return nil
	}

传入的参数scheme是:

	var Registry = registered.NewOrDie(os.Getenv("KUBE_API_VERSIONS"))

而上面的AddToScheme函数，是在创建GroupMetaFactory的时候传入的：

	func NewGroupMetaFactory(groupArgs *GroupMetaFactoryArgs, versions VersionToSchemeFunc) *GroupMetaFactory {
		gmf := &GroupMetaFactory{
			GroupArgs:   groupArgs,
			VersionArgs: map[string]*GroupVersionFactoryArgs{},
		}
		for v, f := range versions {
			gmf.VersionArgs[v] = &GroupVersionFactoryArgs{
				GroupName:   groupArgs.GroupName,
				VersionName: v,
				AddToScheme: f,
			}
		}
		return gmf
	}

参数versions是:

		announced.VersionToSchemeFunc{
			v1.SchemeGroupVersion.Version: v1.AddToScheme,
		},

## main()

cmd/kube-apiserver/apiserver.go:

	func main() {
		...
		s := options.NewServerRunOptions()
		s.AddFlags(pflag.CommandLine)
		...
		if err := app.Run(s); err != nil {
			fmt.Fprintf(os.Stderr, "%v\n", err)
			os.Exit(1)
		}
	}

## Run()

cmd/kube-apiserver/app/server.go:

	func Run(s *options.ServerRunOptions) error {
		config, sharedInformers, err := BuildMasterConfig(s)
		if err != nil {
			return err
		}
		return RunServer(config, sharedInformers, wait.NeverStop)
	}

BuildMasterConfig()完成了完成了大量初始化设置。

## RunServer()

	func RunServer(config *master.Config, sharedInformers informers.SharedInformerFactory, stopCh <-chan struct{}) error {
		m, err := config.Complete().New()
		if err != nil {
			return err
		}
		
		sharedInformers.Start(stopCh)
		return m.GenericAPIServer.PrepareRun().Run(stopCh)
	}

### GenericAPIServer

启动过程：

	 m.GenericAPIServer.PrepareRun().Run(stopCh)

`PrepareRun()`创建了一个preparedGenericAPIServer:

	func (s *GenericAPIServer) PrepareRun() preparedGenericAPIServer {
		if s.swaggerConfig != nil {
			routes.Swagger{Config: s.swaggerConfig}.Install(s.HandlerContainer)
		}
		if s.openAPIConfig != nil {
			routes.OpenAPI{
				Config: s.openAPIConfig,
			}.Install(s.HandlerContainer)
		}
		s.installHealthz()
		return preparedGenericAPIServer{s}
	}

preparedGenericAPIServer，在GenericAPIServer的基础上增加了两个方法:

	type preparedGenericAPIServer struct {
		*GenericAPIServer
	}

	--preparedGenericAPIServer : struct
	   [embedded]
	   -*GenericAPIServer : *GenericAPIServer
	   [methods]
	   +NonBlockingRun(stopCh chan ) : error
	   +Run(stopCh chan ) : error

preparedGenericAPIServer.Run():

	func (s preparedGenericAPIServer) Run(stopCh <-chan struct{}) error {
		err := s.NonBlockingRun(stopCh)
		if err != nil {
			return err
		}
		<-stopCh
		return nil
	}

preparedGenericAPIServer.NonBlockingRun():

	func (s preparedGenericAPIServer) NonBlockingRun(stopCh <-chan struct{}) error {
		...
		if s.SecureServingInfo != nil && s.Handler != nil {
			if err := s.serveSecurely(internalStopCh); err != nil {
				close(internalStopCh)
				return err
			}
		}
		
		if s.InsecureServingInfo != nil && s.InsecureHandler != nil {
			if err := s.serveInsecurely(internalStopCh); err != nil {
				close(internalStopCh)
				return err
			}
		}
		...
		s.RunPostStartHooks()
		...
		return nil
	}

serveSecurely是GenericAPIServer的方法，apiserver/pkg/server/serve.go:

	func (s *GenericAPIServer) serveSecurely(stopCh <-chan struct{}) error {
		secureServer := &http.Server{
			Addr:           s.SecureServingInfo.BindAddress,
			Handler:        s.Handler,
			MaxHeaderBytes: 1 << 20,
			TLSConfig: &tls.Config{
				NameToCertificate: s.SecureServingInfo.SNICerts,
				MinVersion: tls.VersionTLS12,
				NextProtos: []string{"h2", "http/1.1"},
			},
		}
		...
		s.effectiveSecurePort, err = runServer(secureServer, s.SecureServingInfo.BindNetwork, stopCh)
		return err
	}

runServer中建立监听端口开始提供服务，关键的处理过程都在s.Handler中。

### GenriceAPISerer.Handler

s是Master的成员，pkg/master/master.go：

	m := &Master{
		GenericAPIServer: s,
	}

在Master的创建过程中设置了s:

staging/src/k8s.io/apiserver/pkg/server/config.go:

	func (c completedConfig) New() (*Master, error) {
		...
		s, err := c.Config.GenericConfig.SkipComplete().New()
		m := &Master{
			GenericAPIServer: s,
		}

在`c.Config.GenericConfig.SkipComplete().New()`中:

	func (c completedConfig) New() (*GenericAPIServer, error) {
		...
		s := &GenericAPIServer{
			discoveryAddresses:     c.DiscoveryAddresses,
			LoopbackClientConfig:   c.LoopbackClientConfig,
			legacyAPIGroupPrefixes: c.LegacyAPIGroupPrefixes,
			healthzChecks: c.HealthzChecks,
			...
		}
		//这里创建了HandlerContainer
		s.HandlerContainer = mux.NewAPIContainer(http.NewServeMux(), c.Serializer)

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
		//注册了swagger等handler
		s.installAPI(c.Config)
		//为s.handlerContainer.ServeMux中的handler添加filter
		s.Handler, s.InsecureHandler = c.BuildHandlerChainsFunc(s.HandlerContainer.ServeMux, c.Config)
		
		return s, nil
	}

## Master

在RunServer()中，通过config.Complete().New()创建了Master。在创建Master过程中创建了GenericAPIServer，并绑定到Master，完成了Handler的注册。

### main progress

config.Complete().New()中补齐了相关配置后，创建了Master:

	func (c completedConfig) New() (*Master, error) {
		...
		//这里创建了GenericAPIServer
		s, err := c.Config.GenericConfig.SkipComplete().New() 
		...
		m := &Master{
			GenericAPIServer: s,
		}
		...
		//注册相关的storage，这部分内容在《Kubrentes的apiserver的storage的使用》做了介绍。
		if c.APIResourceConfigSource.AnyResourcesForVersionEnabled(apiv1.SchemeGroupVersion) {
			...
			m.InstallLegacyAPI(c.Config, c.Config.GenericConfig.RESTOptionsGetter, legacyRESTStorageProvider)
		}
		
		restStorageProviders := []RESTStorageProvider{
			authenticationrest.RESTStorageProvider{Authenticator: c.GenericConfig.Authenticator},
			...
		}
		m.InstallAPIs(c.Config.APIResourceConfigSource, c.Config.GenericConfig.RESTOptionsGetter, restStorageProviders...)
		if c.Tunneler != nil {
			m.installTunneler(c.Tunneler, corev1client.NewForConfigOrDie(c.GenericConfig.LoopbackClientConfig).Nodes())
		}
		
		if err := m.GenericAPIServer.AddPostStartHook("ca-registration", c.ClientCARegistrationHook.PostStartHook); err != nil {
			glog.Fatalf("Error registering PostStartHook %q: %v", "ca-registration", err)
		}
		return m, nil
	}

创建Master之后，将GenericAPIServer绑定到Master，并通过函数`InstallLegacyAPI()`和`InstallAPIs()`为其装载handler。

### create GenericAPIServer

	s, err := c.Config.GenericConfig.SkipComplete().New() 

GenericAPIServer是通过c.Config.GenericConfig创建的，GenericeAPIServer中部分内容赖在c.Config.GenericConfig。

staging/src/k8s.io/apiserver/pkg/server/config.go:

	func (c completedConfig) New() (*GenericAPIServer, error) {
		if c.Serializer == nil {
			return nil, fmt.Errorf("Genericapiserver.New() called with config.Serializer == nil")
		}
		if c.LoopbackClientConfig == nil {
			return nil, fmt.Errorf("Genericapiserver.New() called with config.LoopbackClientConfig == nil")
		}
		
		s := &GenericAPIServer{
			discoveryAddresses:     c.DiscoveryAddresses,
			LoopbackClientConfig:   c.LoopbackClientConfig,
			legacyAPIGroupPrefixes: c.LegacyAPIGroupPrefixes,
			admissionControl:       c.AdmissionControl,
			requestContextMapper:   c.RequestContextMapper,
			Serializer:             c.Serializer,
			
			minRequestTimeout: time.Duration(c.MinRequestTimeout) * time.Second,
			
			SecureServingInfo:   c.SecureServingInfo,
			InsecureServingInfo: c.InsecureServingInfo,
			ExternalAddress:     c.ExternalAddress,
			
			apiGroupsForDiscovery: map[string]metav1.APIGroup{},
			
			swaggerConfig: c.SwaggerConfig,
			openAPIConfig: c.OpenAPIConfig,
			
			postStartHooks:         map[string]postStartHookEntry{},
			disabledPostStartHooks: c.DisabledPostStartHooks,
			
			healthzChecks: c.HealthzChecks,
		}
		
		s.HandlerContainer = mux.NewAPIContainer(http.NewServeMux(), c.Serializer)
		
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
		
		s.installAPI(c.Config)
		
		s.Handler, s.InsecureHandler = c.BuildHandlerChainsFunc(s.HandlerContainer.ServeMux, c.Config)
		
		return s, nil
	}

### m.InstallLegacyAPI()

pkg/master/master.go:

	func (m *Master) InstallLegacyAPI(c *Config, restOptionsGetter generic.RESTOptionsGetter, legacyRESTStorageProvider corerest.LegacyRESTStorageProvider) {
		//APIGroupInfo的创建
		legacyRESTStorage, apiGroupInfo, err := legacyRESTStorageProvider.NewLegacyRESTStorage(restOptionsGetter)
		...
		//装载到GenericAPIServer
		if err := m.GenericAPIServer.InstallLegacyAPIGroup(genericapiserver.DefaultLegacyAPIPrefix, &apiGroupInfo); err != nil {
			glog.Fatalf("Error in registering group versions: %v", err)
		}
	}

`InstallLegacyAPIGroup()`是GenericAPIServer的方法，在GenericAPIServer中可以看到。

## 参考

1. [apimachinery][1]

[1]: https://github.com/kubernetes/apimachinery  "apimachinery" 
