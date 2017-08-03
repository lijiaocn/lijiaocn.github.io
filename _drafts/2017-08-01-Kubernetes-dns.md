---
layout: default
title: Kubernetes的DNS服务
author: lijiaocn
createdate: 2017/08/01 09:40:12
changedate: 2017/08/01 15:43:26
categories: 项目
tags: kubernetes,dns
keywords: kubernetes,dns
description: Kubernetes的DNS服务的原理与代码走读

---

* auto-gen TOC:
{:toc}

## kube-dns

使用kubeadm部署的k8s集群中，会部署一个名为kube-dns的deployment，做为集群的dns。

在kubernetes/cmd/kubeadm/app/phases/addons/manifests.go包含了kube-dns的deployment和service的yaml文件。

kube-dns deployment由三个容器组成:

	kube-dns:  基于skydns提供k8s集群中的域名的解析服务,服务端口10053
	dnsmasq:   集群内的容器直接使用的dns服务器
	sidecar:   监测kube-dn和dnsmasq的工作状态

## dnsmasq

dnsmasq是常用的dns服务器，使用了下面的运行参数：

	-v=2
	-logtostderr
	-configDir=/etc/k8s/dns/dnsmasq-nanny
	-restartDnsmasq=true
	--
	-k
	--cache-size=1000
	--log-facility=-
	--server=/{{ .DNSDomain }}/127.0.0.1#10053
	--server=/in-addr.arpa/127.0.0.1#10053
	--server=/ip6.arpa/127.0.0.1#10053

其中--server是用于解析指定域名的dns上游服务器。

### kube-dns deployment

	apiVersion: extensions/v1beta1
	kind: Deployment
	metadata:
	  name: kube-dns
	  namespace: kube-system
	  labels:
	    k8s-app: kube-dns
	spec:
	  # replicas: not specified here:
	  # 1. In order to make Addon Manager do not reconcile this replicas parameter.
	  # 2. Default is 1.
	  # 3. Will be tuned in real time if DNS horizontal auto-scaling is turned on.
	  strategy:
	    rollingUpdate:
	      maxSurge: 10%
	      maxUnavailable: 0
	  selector:
	    matchLabels:
	      k8s-app: kube-dns
	  template:
	    metadata:
	      labels:
	        k8s-app: kube-dns
	      annotations:
	        scheduler.alpha.kubernetes.io/critical-pod: ''
	    spec:
	      volumes:
	      - name: kube-dns-config
	        configMap:
	          name: kube-dns
	          optional: true
	      containers:
	      - name: kubedns
	        image: {{ .ImageRepository }}/k8s-dns-kube-dns-{{ .Arch }}:{{ .Version }}
	        imagePullPolicy: IfNotPresent
	        resources:
	          # TODO: Set memory limits when we've profiled the container for large
	          # clusters, then set request = limit to keep this container in
	          # guaranteed class. Currently, this container falls into the
	          # "burstable" category so the kubelet doesn't backoff from restarting it.
	          limits:
	            memory: 170Mi
	          requests:
	            cpu: 100m
	            memory: 70Mi
	        livenessProbe:
	          httpGet:
	            path: /healthcheck/kubedns
	            port: 10054
	            scheme: HTTP
	          initialDelaySeconds: 60
	          timeoutSeconds: 5
	          successThreshold: 1
	          failureThreshold: 5
	        readinessProbe:
	          httpGet:
	            path: /readiness
	            port: 8081
	            scheme: HTTP
	          # we poll on pod startup for the Kubernetes master service and
	          # only setup the /readiness HTTP server once that's available.
	          initialDelaySeconds: 3
	          timeoutSeconds: 5
	        args:
	        - --domain={{ .DNSDomain }}.
	        - --dns-port=10053
	        - --config-dir=/kube-dns-config
	        - --v=2
	        # Do we need to set __PILLAR__FEDERATIONS__DOMAIN__MAP__ here?
	        env:
	        - name: PROMETHEUS_PORT
	          value: "10055"
	        ports:
	        - containerPort: 10053
	          name: dns-local
	          protocol: UDP
	        - containerPort: 10053
	          name: dns-tcp-local
	          protocol: TCP
	        - containerPort: 10055
	          name: metrics
	          protocol: TCP
	        volumeMounts:
	        - name: kube-dns-config
	          mountPath: /kube-dns-config
	      - name: dnsmasq
	        image: {{ .ImageRepository }}/k8s-dns-dnsmasq-nanny-{{ .Arch }}:{{ .Version }}
	        imagePullPolicy: IfNotPresent
	        livenessProbe:
	          httpGet:
	            path: /healthcheck/dnsmasq
	            port: 10054
	            scheme: HTTP
	          initialDelaySeconds: 60
	          timeoutSeconds: 5
	          successThreshold: 1
	          failureThreshold: 5
	        args:
	        - -v=2
	        - -logtostderr
	        - -configDir=/etc/k8s/dns/dnsmasq-nanny
	        - -restartDnsmasq=true
	        - --
	        - -k
	        - --cache-size=1000
	        - --log-facility=-
	        - --server=/{{ .DNSDomain }}/127.0.0.1#10053
	        - --server=/in-addr.arpa/127.0.0.1#10053
	        - --server=/ip6.arpa/127.0.0.1#10053
	        ports:
	        - containerPort: 53
	          name: dns
	          protocol: UDP
	        - containerPort: 53
	          name: dns-tcp
	          protocol: TCP
	        # see: https://github.com/kubernetes/kubernetes/issues/29055 for details
	        resources:
	          requests:
	            cpu: 150m
	            memory: 20Mi
	        volumeMounts:
	        - name: kube-dns-config
	          mountPath: /etc/k8s/dns/dnsmasq-nanny
	      - name: sidecar
	        image: {{ .ImageRepository }}/k8s-dns-sidecar-{{ .Arch }}:{{ .Version }}
	        imagePullPolicy: IfNotPresent
	        livenessProbe:
	          httpGet:
	            path: /metrics
	            port: 10054
	            scheme: HTTP
	          initialDelaySeconds: 60
	          timeoutSeconds: 5
	          successThreshold: 1
	          failureThreshold: 5
	        args:
	        - --v=2
	        - --logtostderr
	        - --probe=kubedns,127.0.0.1:10053,kubernetes.default.svc.{{ .DNSDomain }},5,A
	        - --probe=dnsmasq,127.0.0.1:53,kubernetes.default.svc.{{ .DNSDomain }},5,A
	        ports:
	        - containerPort: 10054
	          name: metrics
	          protocol: TCP
	        resources:
	          requests:
	            memory: 20Mi
	            cpu: 10m
	      dnsPolicy: Default  # Don't use cluster DNS.
	      serviceAccountName: kube-dns
	      # TODO: Why doesn't the Decoder recognize this new field and decode it properly? Right now it's ignored
	      # tolerations:
	      # - key: CriticalAddonsOnly
	      #   operator: Exists
	      # - key: {{ .MasterTaintKey }}
	      #   effect: NoSchedule
	      # TODO: Remove this affinity field as soon as we are using manifest lists
	      affinity:
	        nodeAffinity:
	          requiredDuringSchedulingIgnoredDuringExecution:
	            nodeSelectorTerms:
	            - matchExpressions:
	              - key: beta.kubernetes.io/arch
	                operator: In
	                values:
	                - {{ .Arch }}

### KubeDNS Service

	apiVersion: v1
	kind: Service
	metadata:
	  labels:
	    k8s-app: kube-dns
	    kubernetes.io/cluster-service: "true"
	    kubernetes.io/name: "KubeDNS"
	  name: kube-dns
	  namespace: kube-system
	spec:
	  clusterIP: {{ .DNSIP }}
	  ports:
	  - name: dns
	    port: 53
	    protocol: UDP
	    targetPort: 53
	  - name: dns-tcp
	    port: 53
	    protocol: TCP
	    targetPort: 53
	  selector:
	    k8s-app: kube-dns

## 参考

1. [kube-dns][1]
2. [dnsmasq][2]

[1]: https://github.com/kubernetes/dns  "kube-dns" 
[2]: http://www.thekelleys.org.uk/dnsmasq/doc.html "dnsmasq"
