---
layout: default
title: Kubernetes的volumes
author: lijiaocn
createdate: 2017/06/07 10:00:24
changedate: 2017/06/13 13:08:07
categories: 项目
tags: kubernetes 
keywords: k8s
description: kubernetes支持多种块存储，可以给容器挂载云硬盘。

---

* auto-gen TOC:
{:toc}

## 概要

k8s支持多种类型的volume:

	emptyDir
	hostPath
	gcePersistentDisk
	awsElasticBlockStore
	nfs
	iscsi
	fc (fibre channel)
	flocker
	glusterfs
	rbd
	cephfs
	gitRepo
	secret
	persistentVolumeClaim
	downwardAPI
	projected
	azureFileVolume
	azureDisk
	vsphereVolume
	Quobyte
	PortworxVolume
	ScaleIO

k8s在host将volume挂载到host目录后，再将host目录挂载到容器中。

例如:

	apiVersion: v1
	kind: Pod
	metadata:
	  name: test-pd
	spec:
	  containers:
	  - image: gcr.io/google_containers/test-webserver
	    name: test-container
	    volumeMounts:
	    - mountPath: /cache
	      name: cache-volume
	  volumes:
	  - name: cache-volume
	    emptyDir: {}

[k8s volumes][1]列出了每一种volume的特点和使用方式。

k8s支持直接挂载volume，但是使用persistentVolumeClaim是一种更好的方式，

persistentVolumeClaim是用来挂载[persistentVolume][3]的，而persistentVolume是在k8s中创建的volume。

## persistentVolumeClaim

[persistent-volumes][3]中详细介绍了PV和PVC的使用。

	PVs are resources in the cluster. 
	PVCs are requests for those resources and also act as claim checks to the resource.

### PersistentVolume

PV是系统中已经创建好的volume，它是一个抽象的volume，底层可以是多种存储类型。

	apiVersion: v1
	  kind: PersistentVolume
	  metadata:
	    name: pv0003
	  spec:
	    capacity:
	      storage: 5Gi
	    accessModes:
	      - ReadWriteOnce
	    persistentVolumeReclaimPolicy: Recycle
	    storageClassName: slow
	    nfs:
	      path: /tmp
	      server: 172.17.0.2

### PersistentVolumeClaims

PVC一个Volume声明，声明了对Volume的需求，k8s会将满足条件的PV绑定到PVC。

	kind: PersistentVolumeClaim
	apiVersion: v1
	metadata:
	  name: myclaim
	spec:
	  accessModes:
	    - ReadWriteOnce
	  resources:
	    requests:
	      storage: 8Gi
	  storageClassName: slow
	  selector:
	    matchLabels:
	      release: "stable"
	    matchExpressions:
	      - {key: environment, operator: In, values: [dev]}

如果指定了sotargeClassName，当没有PV满足条件时，会自动创建PV。

### Claims As Volumes

Pod直接将PVC当作volume挂载。

	kind: Pod
	apiVersion: v1
	metadata:
	  name: mypod
	spec:
	  containers:
	    - name: myfrontend
	      image: dockerfile/nginx
	      volumeMounts:
	      - mountPath: "/var/www/html"
	        name: mypd
	  volumes:
	    - name: mypd
	      persistentVolumeClaim:
	        claimName: myclaim

### StorageClass

StorageClass保存访问后端存储的地址，以及需要的参数，不同类型的后端存储，需要设置不同的参数。

StorageClass for Ceph RBD:

	apiVersion: storage.k8s.io/v1
	 kind: StorageClass
	 metadata:
	   name: fast
	 provisioner: kubernetes.io/rbd        //存储系统类别
	 parameters:                           //不同类型的存储有不同的参数
	   monitors: 10.16.153.105:6789
	   adminId: kube
	   adminSecretName: ceph-secret
	   adminSecretNamespace: kube-system
	   pool: kube
	   userId: kube
	   userSecretName: ceph-secret-user

[persistent-volumes][3]中给出了支持的存储列表:

	AWS
	GCE
	Glusterfs
	OpenStack Cinder
	vSphere
	Ceph RBD
	Quobyte
	Azure Disk
	Portworx Volume
	ScaleIO

### Example

#### CephRBD

##### 创建ceph用户和pool

在ceph中创建用户`client.kube`和名为`kube`的pool, k8s将使用这个用户访问ceph。

	ceph osd pool create kube 333 333 replicated
	ceph auth get-or-create client.kube mon 'allow r' osd 'allow rwx pool=kube'
	ceph auth export client.kube -o /etc/ceph/ceph.client.kube.keyring

注意需要将`/etc/ceph/ceph.client.kube.keyring`复制到每一个kubelet节点上。

##### 创建ceph-secret

在k8s中创建两个secret，一个是ceph.client.admin的key，一个是ceph.client.kube的key。

ceph-secret-admin只需要在一个namespace中创建，StorageClass中会要求指定所在的namespace：

	apiVersion: v1
	kind: Secret
	metadata:
	  name: ceph-secret-admin
	  namespace: kube-system
	type: "kubernetes.io/rbd"
	data:
	  key: QVFCVzBTOVprQUQrSUJBQXhyaVhMclAwTUovQ2FuOGNyNEQyQ1E9PQ==

key通过下面的命令获取：

	grep key /etc/ceph/ceph.client.admin.keyring |awk '{printf "%s", $NF}'|base64

ceph.client.kube的key需要在每个namespace中创建，这里使用的namespace是first：

	apiVersion: v1
	kind: Secret
	metadata:
	  name: ceph-secret-kube
	  namespace: first
	type: "kubernetes.io/rbd"
	data:
	  key: QVFBVjNUaFovcWw3SWhBQWNXdDk0U2dENjNrelJtcksrMk5qOUE9PQ==

key通过下面的命令获取：

	grep key /etc/ceph/ceph.client.kube.keyring |awk '{printf "%s", $NF}'|base64

##### 创建StorageClass

StorageClass在所有的ns中都是可见的。

	apiVersion: storage.k8s.io/v1beta1
	kind: StorageClass
	metadata:
	  name: fast
	  namespace: kube-system
	provisioner: kubernetes.io/rbd
	parameters:
	  monitors: 192.168.40.10:6789,192.168.40.11:6789,192.168.40.12:6789
	  adminId: admin
	  adminSecretName: ceph-secret-admin
	  adminSecretNamespace: kube-system
	  pool: kube
	  userId: kube
	  userSecretName: ceph-secret-kube

Pod在挂载PVC绑定的PV时，kubelet使用userId和当前namespace中的userSecret将RBD挂载到host。

这也是需要将ceph-secret-kube在每个namespace中创建的原因。

##### 创建PVC

PVC是namespace内可见的。

1.6.0之前的版本通过annotations指定sotarge-class:

	kind: PersistentVolumeClaim
	apiVersion: v1
	metadata:
	  name: claim.50mb
	  namespace: first
	  annotations:
	    volume.beta.kubernetes.io/storage-class: fast
	spec:
	  accessModes:
	    - ReadWriteOnce
	  resources:
	    requests:
	      storage: 50Mi

1.6.0以及以后的版本可以使用属性storageClassName:

	kind: PersistentVolumeClaim
	apiVersion: v1
	metadata:
	  name: claim.50mb
	  namespace: first
	spec:
	  accessModes:
	    - ReadWriteOnce
	  resources:
	    requests:
	      storage: 50Mi
	  storageClassName: fast

查看pvc：

	$kubectl get pvc -n first
	NAME         STATUS    VOLUME                                     CAPACITY   ACCESSMODES   AGE
	claim.50mb   Bound     pvc-0cfa6d7a-4c14-11e7-8c71-525400bd971e   50Mi       RWO           2m

pv是全局可见的：

	$kubectl get pv
	NAME                                       CAPACITY   ACCESSMODES   RECLAIMPOLICY   STATUS    CLAIM              REASON    AGE
	pvc-c7cce9ef-4c14-11e7-8c71-525400bd971e   50Mi       RWO           Delete          Bound     first/claim.50mb             1m

##### 挂载pvc

	kind: Pod
	apiVersion: v1
	metadata:
	  name: sshproxy.mnt
	  namespace: first
	spec:
	  containers:
	    - name: sshproxy
	      image: 192.168.40.10:5000/sshproxy:1.0
	      volumeMounts:
	      - mountPath: "/mnt"
	        name: disk-50mb
	  volumes:
	    - name: disk-50mb
	      persistentVolumeClaim:
	        claimName: claim.50mb

进入容器中可以看到/mnt目录挂载了rbd:

	/dev/rbd0      45478    1039     40855   3% /mnt

## 非PVC的方式

### rbd

rbd是ceph的块设备(Rados Block Device)，[rbd usage][2]给出了一个使用示例。

k8s的node上需要安装有ceph-common:

	yum install -y ceph-common

要在k8s中创建一个secret，保存ceph的keyring:

	apiVersion: v1
	kind: Secret
	metadata:
	  name: ceph-secret
	type: "kubernetes.io/rbd"  
	data:
	key: QVFCMTZWMVZvRjVtRXhBQTVrQ1FzN2JCajhWVUxSdzI2Qzg0SEE9PQ==

key通过这条命令获取:

	grep key /etc/ceph/ceph.client.kube.keyring |awk '{printf "%s", $NF}'|base64

创建一个挂载volume的容器:

	{
	    "apiVersion": "v1",
	    "kind": "Pod",
	    "metadata": {
	        "name": "rbd2"
	    },
	    "spec": {
	        "containers": [
	        {
	            "name": "rbd-rw",
	            "image": "kubernetes/pause",
	            "volumeMounts": [
	            {
	                "mountPath": "/mnt/rbd",
	                "name": "rbdpd"
	            }
	            ]
	        }
	        ],
	            "volumes": [
	            {
	                "name": "rbdpd",
	                "rbd": {
	                    "monitors": [
	                        "10.16.154.78:6789",
	                        "10.16.154.82:6789",
	                        "10.16.154.83:6789"
	                        ],
	                    "pool": "kube",
	                    "image": "foo",
	                    "user": "admin",
	                    "secretRef": {
	                        "name": "ceph-secret"
	                    },
	                    "fsType": "ext4",
	                    "readOnly": true
	                }
	            }
	        ]
	    }
	}

## 源码


## 参考

1. [k8s volumes][1]
2. [rbd usage][2]
3. [persistent-volumes][3]

[1]: https://kubernetes.io/docs/concepts/storage/volumes/  "k8s volumes" 
[2]: https://github.com/kubernetes/kubernetes/tree/master/examples/volumes/rbd "rbd usage"
[3]: https://kubernetes.io/docs/concepts/storage/persistent-volumes/ "persistent-volumes"
