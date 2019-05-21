---
layout: default
title: kubelet下载pod镜像时，docker口令文件的查找顺序
author: 李佶澳
createdate: 2017/12/19 11:34:51
changedate: 2017/12/19 14:23:35
categories: 项目
tags: kubernetes
keywords: kubernetes,kubelet,image,secret
description: kubelet下载pod的镜像时，按照下面的顺序查找Image Secret

---

## 目录
* auto-gen TOC:
{:toc}

## 说明 

kubernetes1.7.6中，kubelet拉取Pod的镜像时，首先使用Pod中指定的ImagePullSecrets。

如果没有指定，先依次到"--root-dir(默认是/var/lib/kubelet)"、"./"，"$HOME/.docker/"、"/.docker/"中查找`config.json`文件。

如果没有找到config.json，再按照同样的顺序查找`.dockercfg`文件。

## 拉取镜像的过程

在`pkg/kubelet/kubelet.go`中，Kubelet的syncPod方法中：

	1626   pullSecrets := kl.getPullSecretsForPod(pod)

`kl.getPullSecretsForPod()`读取pod中的ImagePullSecrets:

	func (kl *Kubelet) getPullSecretsForPod(pod *v1.Pod) []v1.Secret {
	    pullSecrets := []v1.Secret{}
	
	    for _, secretRef := range pod.Spec.ImagePullSecrets {
	        secret, err := kl.secretManager.GetSecret(pod.Namespace, secretRef.Name)
	        if err != nil {
	            glog.Warningf("Unable to retrieve pull secret %s/%s for %s/%s due to %v.  The 
	image pull may not succeed.", pod.Namespace, secretRef.Name, pod.Namespace, pod.Name, err)
	            continue
	        }
	
	        pullSecrets = append(pullSecrets, *secret)
	    }
	
	    return pullSecrets
	}

之后将pullSecrets传入SyncPod:

	1629    result := kl.containerRuntime.SyncPod(pod, apiPodStatus, podStatus, pullSecrets, kl.backOff)

SyncPod在`pkg/kubelet/kuberuntime/kuberuntime_manager.go`中实现：

	545 func (m *kubeGenericRuntimeManager) SyncPod(pod *v1.Pod, _ v1.PodStatus, 
			podStatus *kubecontainer.PodStatus, pullSecrets []v1.Secret, 
			backOff *flowcontrol.Backoff) (result kubecontainer.PodSyncResult) {
	}
		...
		if msg, err := m.startContainer(podSandboxID, podSandboxConfig, container, pod, podStatus, pullSecrets, podIP); err != nil {
		...

在startContainer()中，拉取了Pod的镜像:

	// * run the post start lifecycle hooks (if applicable)
	81  func (m *kubeGenericRuntimeManager) startContainer(podSandboxID string, podSandboxConfig *runtimeapi.PodSandboxConfig, container *v1.Container, pod *v1.Pod, podStatus *kubecontainer.PodStatus, pullSecrets []v1.Secret, podIP string) (string, error) {
		// Step 1: pull the image.
		imageRef, msg, err := m.imagePuller.EnsureImageExists(pod, container, pullSecrets)
		...

`EnsureImageExists()`在pkg/kubelet/images/image_manager.go中实现：

	86 func (m *imageManager) EnsureImageExists(pod *v1.Pod, container *v1.Container, pullSecrets []v1.Secret) (string, string, error) {
	...
	130 	m.puller.pullImage(spec, pullSecrets, pullChan)
	...

pkg/kubelet/images/puller.go：

	func (pip *parallelImagePuller) pullImage(spec kubecontainer.ImageSpec, pullSecrets []v1.Secret, pullChan chan<- pullResult) {
		go func() {
			imageRef, err := pip.imageService.PullImage(spec, pullSecrets)
			pullChan <- pullResult{
				imageRef: imageRef,
				err:      err,
			}
		}()
	}

最终调用的是imageService的PullImage，在`pkg/kubelet/kuberuntime/kuberuntime_image.go`中实现：

	func (m *kubeGenericRuntimeManager) PullImage(image kubecontainer.ImageSpec, pullSecrets []v1.Secret) (string, error) {
	...
	keyring, err := credentialprovider.MakeDockerKeyring(pullSecrets, m.keyring)
	...

`pkg/credentialprovider/keyring.go`实现的`MakeDockerKeyring()`中完成了imageSecrets的查找，注意这里传入的pullSecrets是从Pod中读取的，如果它是个空的，就返回m.keyring。

在`pkg/kubelet/kuberuntime/kuberuntime_image.go`中找到了kubeGenericRuntimeManager创建的地方:

	func NewKubeGenericRuntimeManager(
			....
		kubeRuntimeManager := &kubeGenericRuntimeManager{
			...
			keyring:             credentialprovider.NewDockerKeyring(),
		}

keyring是`credentialprovider.NewDockerKeyring()`的返回值：

	func NewDockerKeyring() DockerKeyring {
		keyring := &lazyDockerKeyring{
			Providers: make([]DockerConfigProvider, 0),
		}

		for name, provider := range providers {
			if provider.Enabled() {
				glog.V(4).Infof("Registering credential provider: %v", name)
				keyring.Providers = append(keyring.Providers, provider)
			}
		}

		return keyring
	}

## credentialprovider

pkg/credentialprovider目录中的代码用来管理image的访问凭证

其中pkg/credentialprovider/provider.go中注册了一个默认的provider:

	func init() {
		RegisterCredentialProvider(".dockercfg",
			&CachingDockerConfigProvider{
				Provider: &defaultDockerConfigProvider{},
				Lifetime: 5 * time.Minute,
			})
	}

名称为`.dockercfg`，Provider为`defaultDockerConfigProvider`，它的Provide()方法提供了dockerconfig：

	// Provide implements dockerConfigProvider
	func (d *defaultDockerConfigProvider) Provide() DockerConfig {
		// Read the standard Docker credentials from .dockercfg
		if cfg, err := ReadDockerConfigFile(); err == nil {
			return cfg
		} else if !os.IsNotExist(err) {
			glog.V(4).Infof("Unable to parse Docker config file: %v", err)
		}
		return DockerConfig{}
	}

pkg/credentialprovider/config.go:

	func ReadDockerConfigFile() (cfg DockerConfig, err error) {
		if cfg, err := ReadDockerConfigJSONFile(nil); err == nil {
			return cfg, nil
		}
		// Can't find latest config file so check for the old one
		return ReadDockercfgFile(nil)
	}

ReadDockerConfigJSONFile()读取config.json，ReadDockercfgFile()读取.dockercfg文件，这两个函数读取文件的过程类似。

	func ReadDockerConfigJSONFile(searchPaths []string) (cfg DockerConfig, err error) {
		if len(searchPaths) == 0 {
			searchPaths = DefaultDockerConfigJSONPaths()
		}
		...
	}
	
	func ReadDockercfgFile(searchPaths []string) (cfg DockerConfig, err error) {
		if len(searchPaths) == 0 {
			searchPaths = DefaultDockercfgPaths()
		}
		...
	}

默认的查找路径是：

	func DefaultDockerConfigJSONPaths() []string {
		return []string{GetPreferredDockercfgPath(), workingDirPath, homeJsonDirPath, rootJsonDirPath}

这四个路径分别是"/var/lib/kubelet"、"./"，"$HOME/.docker/"、"/.docker/":

	preferredPathLock sync.Mutex
	preferredPath     = ""
	workingDirPath    = ""
	homeDirPath       = os.Getenv("HOME")
	rootDirPath       = "/"
	homeJsonDirPath   = filepath.Join(homeDirPath, ".docker")
	rootJsonDirPath   = filepath.Join(rootDirPath, ".docker")

	configFileName     = ".dockercfg"
	configJsonFileName = "config.json"

其中GetPreferredDockercfgPath()获取kubelet启动设置路径：

	func GetPreferredDockercfgPath() string {
		preferredPathLock.Lock()
		defer preferredPathLock.Unlock()
		return preferredPath
	}
	
	func SetPreferredDockercfgPath(path string) {
		preferredPathLock.Lock()
		defer preferredPathLock.Unlock()
		preferredPath = path
	}

是在cmd/kubelet/app/server.go中设置的：

	credentialprovider.SetPreferredDockercfgPath(kubeCfg.RootDirectory)

