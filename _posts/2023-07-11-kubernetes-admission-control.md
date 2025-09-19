---
layout: default
title: "kubernetes 准入：操作合法性检查（Admission Control）"
author: 李佶澳
date: "2023-07-11 11:19:08 +0800"
last_modified_at: "2023-07-11 17:21:31 +0800"
categories: 项目
cover:
tags: kubernetes
keywords:
description: kubernetes 内置了多个 admission controller 用于各种类型的操作检查，同时也提供了 webhook 接口用于用户自定义检查策略的接入。
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

可以在[认证][2]和[鉴权][3]通过后施加进一步的检查，拒绝不允许的操作或者对请求进行修改矫正。kubernetes 内置了多个 admission controller 用于不同方面的操作检查，同时也提供了 webhook 接口用于用户自定义策略的接入。

* [Admission Controllers Reference][4]
* [Dynamic Admission Control][5]

## kubernetes 内置 Admission Controllers

内置的 adminssion controller 编译在 kube-apiserver 中，通过 kube-apiserver 的 enable-admission-plugins 参数启用。可用的 admission controller 不停更新，最新列表见：

* [what-does-each-admission-controller-do][6]

部分 admission controllers 的用途：

```sh
AlwaysPullImages：                     强制将 image pull policy 设置为 Always
CertificateApproval：                  检查对 CSR 的 approve 操作
CertificateSigning：                   检查对 CSR status.certificate 的更新操作
CertificateSubjectRestriction：        检查 CSR 
DefaultIngressClass：                  检查 Ingress 的 IngressClass
DefaultTolerationSeconds：             设置 pod 对 taints 默认容忍时间
DenyServiceExternalIPs：               禁止 Service 的 externalIPs
DefaultStorageClass:                   为没有指定 StorageClass 的 PVC 设置默认的 StorageClass
DefaultTolerationSeconds:              node 被设置 NoExecute Taint 后，pod 的容忍时间，超过后被驱逐
EventRateLimit:                        事件限速
ExtendedResourceToleration:            自动为带有 extended resources（GPU/FPGA等）的 node 设置 taint
ImagePolicyWebhook:                    镜像访问控制的 webhook
LimitPodHardAntiAffinityTopology：     反亲和性
LimitRanger:                           为没有设置 cpu/memory 的 pod 设置默认数量
NamespaceAutoProvision:                自动创建 namespace
NamespaceExists:                       检查 namespace 是否存在
NamespaceLifecycle：                   namespace 删除期间，不接受相关请求
NodeRestriction：                      限制 kubelet 可以对 node 和 pod 做出的修改
OwnerReferencesPermissionEnforcement： 限制对 metadata.ownerReferences 的访问
PodNodeSelector:                       设置 namespace 的中的 pod 的选择 node 的条件
PersistentVolumeClaimResize:           pvc 扩容检查
PodPreset：                            自动在 Pod 创建时注入信息
PodSecurityPolicy:                     Pod 操作的细粒度权限控制
PodTolerationRestriction:              检查合并 Pod 和 Namespace 的 Toleration，并与 namespace 的 Toleration 白名单比对
Priority:                              Pod 的优先级设置 priorityClassName 
ResourceQuota:                         资源配额检查
RuntimeClass:                          自动为 Pod 设置 pod.Spec.Overhead（额外开销）
SecurityContextDeny:                   禁止 SecurityContext 权限提升
ServiceAccount:                        ServiceAccount 设置
StorageObjectInUseProtection:          为 PV 和 PVC 设置 Finalizers，防止正在使用时被删除，从而造成数据丢失
TaintNodesByCondition：                为新建的 Node 设置 NotReady 和 NoSchedule taint。
MutatingAdmissionWebhook:              顺序调用会修改 object 的 webhook
ValidatingAdmissionWebhook:            并发调用检验 object 的 webhook
```

## MutatingAdmissionWebhook 和 ValidatingAdmissionWebhook 

### 配置 webhook 的认证凭证

在 apiserver 启动时，通过参数 --admission-control-config-file 指定 admission control 的配置文件。

```yaml
apiVersion: apiserver.config.k8s.io/v1
kind: AdmissionConfiguration
plugins:
- name: ValidatingAdmissionWebhook
  configuration:
    apiVersion: apiserver.config.k8s.io/v1
    kind: WebhookAdmissionConfiguration
    kubeConfigFile: "<path-to-kubeconfig-file>"
- name: MutatingAdmissionWebhook
  configuration:
    apiVersion: apiserver.config.k8s.io/v1
    kind: WebhookAdmissionConfiguration
    kubeConfigFile: "<path-to-kubeconfig-file>"
```

其中 kubeConfigFile 中指定 Webhook 的地址和认证凭证（证书、密码等）：

```yaml
apiVersion: v1
kind: Config
users:
- name: 'webhook1.ns1.svc'
  user:
    client-certificate-data: "<pem encoded certificate>"
    client-key-data: "<pem encoded key>"
# The `name` supports using * to wildcard-match prefixing segments.
- name: '*.webhook-company.org'
  user:
    password: "<password>"
    username: "<name>"
# '*' is the default match.
- name: '*'
  user:
    token: "<token>"
```

### 配置 Webhook 规则

在 kubernetes 中创建 ValidatingWebhookConfiguration、MutatingWebhookConfiguration，配置需要经过 webhook 检查的操作。ValidatingWebhookConfiguration 配置方式如下：

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingWebhookConfiguration
metadata:
  name: "pod-policy.example.com"
webhooks:
- name: "pod-policy.example.com"
  rules:
  - apiGroups:   [""]
    apiVersions: ["v1"]
    operations:  ["CREATE"]
    resources:   ["pods"]
    scope:       "Namespaced"
  clientConfig:
    service:
      namespace: "example-namespace"
      name: "example-service"
    caBundle: <CA_BUNDLE>
  admissionReviewVersions: ["v1"]
  sideEffects: None
  timeoutSeconds: 5
```

### Webhook 的请求和响应格式

发送到 webhook 的是 AdmissionReview，可以在 webhook 配置中指定 AdmissionReview 的版本。

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingWebhookConfiguration
webhooks:
- name: my-webhook.example.com
  admissionReviewVersions: ["v1", "v1beta1"]
```

webhook 返回的内容如下：

```json
{
  "apiVersion": "admission.k8s.io/v1",
  "kind": "AdmissionReview",
  "response": {
    "uid": "<value from request.uid>",
    "allowed": true
  }
}
```

## 参考

1. [李佶澳的博客][1]
2. [kubernetes 认证：用户管理与身份认证][2]
3. [kubernetes 鉴权：用户操作权限鉴定][3]
4. [Admission Controllers Reference][4]
5. [Dynamic Admission Control][5]
6. [what-does-each-admission-controller-do][6]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: /项目/2023/07/07/k8s-auth.html "kubernetes 认证：用户管理与身份认证"
[3]: /项目/2023/07/10/kubernetes-authz.html "kubernetes 鉴权：用户操作权限鉴定"
[4]: https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/ "Admission Controllers Reference"
[5]: https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/ "Dynamic Admission Control"
[6]: https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/#what-does-each-admission-controller-do "what-does-each-admission-controller-do"
