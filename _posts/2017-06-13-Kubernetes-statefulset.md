---
layout: default
title: Kubernetes中部署有状态的复杂分布式系统
author: lijiaocn
crjiaob patch pod mongo-petset-0 -p '{"metadata":{"annotations":{"pod.alpha.kubernetes.io/initialized":"true"}}}'eatedate: 2017/06/13 17:02:14
changedate: 2017/06/21 13:14:53
categories: 项目
tags: k8s
keywords: kubernetes,petset,statefulset
description: 在kubernetes可以通过statefulset(1.4版本中是petset)部署有状态的复杂的分布式系统

---

* auto-gen TOC:
{:toc}

## 说明

在kubernetes1.3和1.4中使用的是[petset][1]，kubernetes1.5和以后的版本改名为[statefulset][2]。

	The StatefulSet feature assigns persistent DNS names to pods and allows us to re-attach the 
	needed storage volume to another machine where the pod migrated to, at any time.

## StatefulSet原理

StatefulSet由Service和volumeClaimTemplates组成。Service中的多个Pod将会被分别编号，并挂载volumeClaimTemplates中声明的PV。

	---
	apiVersion: v1
	kind: Service
	metadata:
	  name: nginx
	  labels:
	    app: nginx
	spec:
	  ports:
	  - port: 80
	    name: web
	  clusterIP: None
	  selector:
	    app: nginx
	---
	apiVersion: apps/v1beta1
	kind: StatefulSet
	metadata:
	  name: web
	spec:
	  serviceName: "nginx"
	  replicas: 3
	  template:
	    metadata:
	      labels:
	        app: nginx
	    spec:
	      terminationGracePeriodSeconds: 10
	      containers:
	      - name: nginx
	        image: gcr.io/google_containers/nginx-slim:0.8
	        ports:
	        - containerPort: 80
	          name: web
	        volumeMounts:
	        - name: www
	          mountPath: /usr/share/nginx/html
	  volumeClaimTemplates:
	  - metadata:
	      name: www
	      annotations:
	        volume.beta.kubernetes.io/storage-class: anything
	    spec:
	      accessModes: [ "ReadWriteOnce" ]
	      resources:
	        requests:
	          storage: 1Gi

StatefulSet名为web，包含的service名为nginx，三个pod将被命名为web-0、web-1、web-2，并被按照顺序启动。

假设StatefulSet部署在名为`foo`的namespace中，cluster domain为`cluster.local`，那么将会生成以下的域名:

	StatefulSet Domain:  nginx.foo.svc.cluster.local
	Pod DNS:  web-0.nginx.foo.svc.cluster.local
	Pod DNS:  web-1.nginx.foo.svc.cluster.local
	Pod DNS:  web-2.nginx.foo.svc.cluster.local

StatefulSet Domain将

	$ kubectl exec -it web-0 /bin/sh
	web-0 # apt-get update && apt-get install -y dnsutils
	...

	web-0 # nslookup -type=srv nginx.default
	Server:        10.0.0.10
	Address:    10.0.0.10#53

	nginx.default.svc.cluster.local    service = 10 50 0 web-1.ub.default.svc.cluster.local.
	nginx.default.svc.cluster.local    service = 10 50 0 web-0.ub.default.svc.cluster.local.

## mongodb集群

mongodb的集群原理比较简单，[mongodb replication][6]就是从多个mongo实例中选择一个作为primary，负责写入。

其它的mongo作为secondary，从primary中同步数据，对外提供读取服务。

当primary故障时，secondary发起选举，选出一个新的primary。

部署过程[mongodb replication deploy][7]也很简单:

	1. 所有的mongodb启动的时候使用同一个RS名称:
	    mongod --replSet "rs0"
	2. 登陆到第一个mongodb，初始化RS:
	    rs.initiate( {
	       _id : "rs0",
	       members: [ { _id : 0, host : "mongodb0.example.net:27017" } ]
	    })
	3. 将其它的mongdb加入到RS:
	    rs.add("mongodb1.example.net")
	    rs.add("mongodb2.example.net")
	4. 查看rs的状态:
	    rs.status()

## 使用petset部署mongodb集群

因为使用的k8s集群是1.4，所有这里使用的是petset。在[k8s-mongo-petset][11]中给出一个已经验证过的petset。

在[cvallance/mongo-k8s-sidecar][9]的基础上做了一些小的修改[lijiaocn/mongo-k8s-sidecar][10]。

### 创建Service

创建一个名为`mong-service`的没有设置ClusterIP的Service，这个Service用来做mongo的节点发现：

	apiVersion: v1
	kind: Service
	metadata:
	  name: mongo-service
	  labels:
	    name: mongo
	spec:
	  ports:
	  - port: 27017
	    targetPort: 27017
	  clusterIP: None
	  selector:
	    role: mongo-pod
	    petset: mongo-petset

通过petset创建的pod上需要被加上标签`role: mongo-pod`和`petset: mongo-petset`，从而将IP注册到mong-service的域名中。

### 创建petset 

通过`nslookup mongo-service.NAMESPACE.svc.CLUSTERDOAIM`，可以看到所有mongo节点的地址。

创建名为`mongo-petset`的petset：

	apiVersion: apps/v1alpha1
	kind: PetSet
	metadata:
	  name: mongo-petset
	spec:
	  replicas: 3
	  serviceName: mongo-service   #<-- 需要指定绑定的service
	  template:
	    metadata:
	      annotations:
	        pod.alpha.kubernetes.io/initialized: "true"
	      labels:                  #<--- 注意这里的标签需要与service中的selector中的标签一致
	        role: mongo-pod
	        petset: mongo-petset
	    spec:
	      terminationGracePeriodSeconds: 0
	      containers:
	        - name: mongo
	          image: mongo:latest
	          command:
	            - mongod
	            - "--replSet"
	            - rs0
	            - "--smallfiles"
	            - "--noprealloc"
	          ports:
	            - containerPort: 27017
	          volumeMounts:
	            - name: mongo-empty-storage
	              mountPath: /data/db
	        - name: mongo-sidecar
	          image: mongo-k8s-sidecar:latest
	          env:
	            - name: MONGO_SIDECAR_POD_LABELS
	              value: "role=mongo-pod,petset=mongo-petset"
	            - name: KUBERNETES_MONGO_SERVICE_NAME
	              value: "mongo-service"
	            - name: KUBE_NAMESPACE
	              value: "lijiaocn"
	            - name: KUBERNETES_CLUSTER_DOMAIN
	              value: "cluster.local"
	      volumes:
	        - name: mongo-empty-storage
	          emptyDir: {}

注意petset中的`pod.alpha.kubernetes.io/initialized: "true"`，如果为true，k8s将会按照顺序启动petset中指定数量的副本。

如果为false, k8s在启动了第一个副本后，不会启动下一个副本，需要将已经启动的pod的该字段设置为true，才会启动下一个：

	kubect -n lijiaocn patch pod mongo-petset-0 -p '{"metadata":{"annotations":{"pod.alpha.kubernetes.io/initialized":"true"}}}'

这个功能可以用来调试petset。另外这里为了简便，volumes使用的是emptyDir。

### sidecar说明

cavallance提供的[cvallance/mongo-k8s-sidecar][9]是通过调用k8s的api来获取pod的，如果禁止了pod的serviceaccount对k8s的访问，就无法工作。

[lijiaocn/mongo-k8s-sidecar][10]增加了通过DNS发现pod的功能。

### 扩容缩容

	kubectl patch petset mongo-service -p '{"spec":{"replicas":5}}'

或者：

	kubectl scale petset mongo-service --replicas=5

注意mongdb集群默认配置最多7个，否则会提示：

	Replica set configuration contains 10 voting members, but must be at least 1 and no more than 7

## 源码走读

cmd/kube-controller-manager/app/controllermanager.go:

	func Run(s *options.CMServer) error {
		...
		err := StartControllers(newControllerInitializers(), s, rootClientBuilder, clientBuilder, stop)
		...

StatefulSet是众多controller中的一个：

cmd/kube-controller-manager/app/controllermanager.go:

	func newControllerInitializers() map[string]InitFunc {
		controllers := map[string]InitFunc{}
		...
		controllers["statefuleset"] = startStatefulSetController
		...
		return controllers
	}

cmd/kube-controller-manager/app/apps.go:

	func startStatefulSetController(ctx ControllerContext) (bool, error) {
		if !ctx.AvailableResources[schema.GroupVersionResource{Group: "apps", Version: "v1beta1", Resource: "statefulsets"}] {
			return false, nil
		}
		go statefulset.NewStatefulSetController(
			ctx.InformerFactory.Core().V1().Pods(),
			ctx.InformerFactory.Apps().V1beta1().StatefulSets(),
			ctx.InformerFactory.Core().V1().PersistentVolumeClaims(),
			ctx.ClientBuilder.ClientOrDie("statefulset-controller"),
		).Run(1, ctx.Stop)
		return true, nil
	}

pkg/controller/statefulset/stateful_set.go:

	func NewStatefulSetController(
		podInformer coreinformers.PodInformer,
		setInformer appsinformers.StatefulSetInformer,
		pvcInformer coreinformers.PersistentVolumeClaimInformer,
		kubeClient clientset.Interface,
	) *StatefulSetController {
		...

StatuefulSet的实现代码结构很清晰，阅读`pkg/controller/statefulset/stateful_set.go`即可。
## 参考

1. [petset][1]
2. [statefulset][2]
3. [Run a MongoDb Replica Set on Kubernetes][3]
4. [Running MongoDB on Kubernetes with StatefulSets][4]
5. [mongodb introduction][5]
6. [mongodb replication][6]
7. [mongodb replication deploy][7]
8. [PetSet not launching more than one pod][8]
9. [cvallance/mongo-k8s-sidecar][9]
10. [lijiaocn/mongo-k8s-sidecar][10]

[1]: https://kubernetes.io/docs/concepts/workloads/controllers/petset/ "petset"
[2]: https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/  "statefulset" 
[3]: https://www.linkedin.com/pulse/how-run-mongodb-replica-set-kubernetes-petset-oleg-chunikhin "Run a MongoDb Replica Set on Kubernetes"
[4]: http://blog.kubernetes.io/2017/01/running-mongodb-on-kubernetes-with-statefulsets.html "Running MongoDB on Kubernetes with StatefulSets"
[5]: https://docs.mongodb.com/manual/introduction/ "mongodb introduction"
[6]: https://docs.mongodb.com/manual/replication/ "mongodb replication"
[7]: https://docs.mongodb.com/manual/administration/replica-sets/ "mongodb replication deploy"
[8]: https://github.com/kubernetes/kubernetes/issues/25618 "PetSet not launching more than one pod"
[9]: https://github.com/cvallance/mongo-k8s-sidecar "cvallance/mongo-k8s-sidecar"
[10]: https://github.com/lijiaocn/mongo-k8s-sidecar "lijiaocn/mongo-k8s-sidecar"
[11]: https://github.com/lijiaocn/k8s-mongo-petset "k8s-mongo-petset"
