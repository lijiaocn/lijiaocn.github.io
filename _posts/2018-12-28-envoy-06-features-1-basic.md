---
layout: default
title: "Envoy Proxy使用介绍教程（六）：envoy一些简单功能/基础配置的使用方法"
author: 李佶澳
createdate: "2018-12-28 11:26:10 +0800"
changedate: "2019-02-12 16:13:52 +0800"
categories: 项目
tags: envoy
keywords: envoy使用,envoy监控数据采集,runtime,watchdog,filter
description: envoy的一些简单功能，例如管理接口、运行参数、看门狗、runtime等简单功能的使用方法
---

* auto-gen TOC:
{:toc}

## 说明

**TODO:**

- [X] admin接口
- [X] file system flags
- [X] runtime使用
- [X] 看门狗设置
- [X] 监控数据采集
- [ ] cds
- [ ] lds
- [ ] rds
- [ ] eds
- [ ] sds
- [ ] hds
- [ ] ads
- [ ] listenerfilter使用
- [ ] filter使用
- [ ] http_filter使用
- [ ] rate limit service 对接
- [ ] zipkin对接
- [ ] cluster manager 用途研究

动态配置的使用，即xDS的用法，见[Envoy Proxy使用介绍教程（七）：envoy动态配置xDS的使用方法](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/29/envoy-07-features-2-dynamic-discovery.html)

该系列所有笔记可以在[系列教程汇总](https://www.lijiaocn.com/tags/class.html)中找到。

[《Envoy Proxy使用介绍教程（一）：新型L3~L7层访问代理软件Envoy的使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/12/envoy-01-usage.html)

[《Envoy Proxy使用介绍教程（二）：envoy源代码阅读、集成开发环境(IDE)》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/17/envoy-02-ide.html)

[《Envoy Proxy使用介绍教程（三）：envoy设计思路、配置文件和功能特性概览》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/20/envoy-03-arch.html)

[《Envoy Proxy使用介绍教程（四）：envoy源代码走读&启动过程分析》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/24/envoy-04-codes.html)

[《Envoy Proxy使用介绍教程（五）：envoy的配置文件完全展开介绍》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/27/envoy-05-configfile.html)

[《Envoy Proxy使用介绍教程（六）：envoy一些简单功能/基础配置的使用方法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/28/envoy-06-features-1-basic.html)

[《Envoy Proxy使用介绍教程（七）：envoy动态配置xDS的使用方法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/29/envoy-07-features-2-dynamic-discovery.html)

[《Envoy Proxy使用介绍教程（八）：envoy动态配置-聚合发现ADS的使用方法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2019/01/07/envoy-08-features-3-dynamic-discovery-ads.html)

[《Envoy Proxy使用介绍教程（九）：envoy的应用方法与使用约束》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2019/01/07/envoy-09-usage-rules.html)

都是边学习边记录的，时间比较紧，难免有些地方记录的比较粗糙，[查看更多相关内容](https://www.lijiaocn.com/tags/class.html)。

## admin接口

admin配置的完整定义见：[admin – 管理接口](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/27/envoy-05-configfile.html#admin---%E7%AE%A1%E7%90%86%E6%8E%A5%E5%8F%A3)

下面是一个yaml格式的例子：

```yaml
admin:
  access_log_path: /tmp/admin_access.log
  profile_path: /var/log/envoy/envoy.prof
  address:
    socket_address:
      protocol: TCP
      address: 0.0.0.0
      port_value: 9901
```

打开http://127.0.0.1:9901，就可以看到envoy的当前状态。

## File system flags

Envoy支持[File system flags](https://www.envoyproxy.io/docs/envoy/latest/operations/fs_flags.html?highlight=flags_path)，这个功能使envoy启动前后的一些参数不变。

[File system flags](https://www.envoyproxy.io/docs/envoy/latest/operations/fs_flags.html?highlight=flags_path)中目前只有`drain`，文档介绍说如果这个文件存在，Envoy就以`HC failing mode`的模式启动。

我对这个功能的理解是，它类似内核参数，内核参数可以通过/proc目录下的文件进行修改，envoy似乎也在学习这种方式，现在只有`drain`一个文件可用（2019-01-24 23:27:32）。

[flags_path](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/27/envoy-05-configfile.html#flags_path---%E5%8F%82%E6%95%B0)指定参数目录，例如：

```yaml
flags_path: /etc/envoy/flags/
```

Envoy启动的时候会显示这样一条日志：

```bash
[2018-12-28 14:12:33.663][8980][info][main] source/server/server.cc:377] server flags path: /etc/envoy/flags/
```

在`/etc/envoy/flags`目录中创建drain文件：

```bash
mkdir -p  /etc/envoy/flags/
touch /etc/envoy/flags/drain
```

重启envoy的时候会多出一条日志，`in drain mode`：

```bash
[2018-12-28 14:17:18.293][9032][info][main] source/server/server.cc:377] server flags path: /etc/envoy/flags/
[2018-12-28 14:17:18.293][9032][info][main] source/server/server.cc:379] starting server in drain mode
```

## runtime

>目前还不清楚，runtime中的数据和envoy的工作过程有什么关系。2018-12-28 17:35:29

[runtime](https://www.envoyproxy.io/docs/envoy/latest/configuration/runtime#config-runtime)将指定目录中所有文件的内容加载，通过admin的[/runtime](https://www.envoyproxy.io/docs/envoy/latest/operations/admin#operations-admin-interface-runtime)接口暴露出来，并且可以通过[runtime_modify](https://www.envoyproxy.io/docs/envoy/latest/operations/admin#operations-admin-interface-runtime-modify)修改。

文件目录一般按照版本命名：

```bash
mkdir v1 v2
```

用符号链接指向当前正在用的目录：

```bash
ln -s `pwd`/v1 /srv/runtime/current
```

在envoy中的配置如下：

```yaml
runtime:
  symlink_root: /srv/runtime/current
  subdirectory: envoy
  override_subdirectory: envoy_override
```

`subdirectory`指定要加载的子目录。`override_subdirectory`指定的目录中与`--service-cluster`指定的cluster同名的子目录中的文件内容，会覆盖在其它流程中的读取的数值。（是不是很拗口？最近折腾了几周kubernetes，回头看到这句话，我也很蒙.... 2019-01-24 23:33:57）

```bash
mkdir v1/envoy
mkdir v1/envoy_override
mkdir v1/envoy/health_check/
echo "10" > v1/envoy/health_check/min_interval
```

然后在`ENVOY_IP:9901/runtime`中会看到下面的内容：

```json
{
  "layers": [
      "root",
      "admin"
  ],
  "entries": {
      "health_check.min_interval": {
          "layer_values": [
              "10",
              ""
          ],
          "final_value": "10"
      }
  }
}
```

`health_check.min_interval`的值就是`envoy/health_check/min_interval`文件的内容。

可以用下面的方式修改值：

```
curl -X POST "10.10.64.58:9901/runtime_modify?health_check.min_interval=20"
```

注意修改后，文件的内容`不会被修改`， 而在runtime中看到的是多了一层：

```json
{
  "layers": [
      "root",
      "admin"
  ],
  "entries": {
      "health_check.min_interval": {
          "layer_values": [
              "10",
              "20"
          ],
          "final_value": "20"
      }
  }
}
```

通过runtime_modify修改的数值只记录在envoy中，覆盖了envoy从文件中读取的数值，文件的内容是不变的。

## 设置看门狗（watchdog）

Watchdog的作用是：在envoy僵死时，自动将envoy进程杀死，[watchdog – 看门狗设置](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/27/envoy-05-configfile.html#watchdog---%E7%9C%8B%E9%97%A8%E7%8B%97%E8%AE%BE%E7%BD%AE)。

```yaml
watchdog:
  miss_timeout: 0.2s
  megamiss_timeout: 1s
  kill_timeout: 0s
  multikill_timeout: 0s
```

`*kill_timeout`的值为0，表示不杀死envoy继承。

## 状态数据输出

通过envoy admin的`/stats/prometheus`接口，可以获得prometheus格式的状态数据，感觉有这个功能就足够了。`stats_sinks`或许是为了支持prometheus之外的监控系统。

状态数据有多种输出方式，在[stats_sinks](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/27/envoy-05-configfile.html#stats_sinks---%E7%8A%B6%E6%80%81%E9%87%87%E9%9B%86%E6%8F%92%E4%BB%B6)中配置。

[stats_flush_interval](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/27/envoy-05-configfile.html#stats_flush_interval---%E7%8A%B6%E6%80%81%E5%88%B7%E6%96%B0%E6%97%B6%E9%97%B4)配置状态数据输出的频率。

[stats_config](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/27/envoy-05-configfile.html#stats_config---%E7%8A%B6%E6%80%81%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE)是状态数据相关的配置。

### 输出到hystrix-dashboard

>hystrix-dashboard中没有展示出数据，原因不明。2018-12-28 16:13:13

```bash
docker run -d -p 8080:9002 --name hystrix-dashboard mlabouardy/hystrix-dashboard:latest
```

Web的地址是`http://127.0.0.1:8080/hystrix`。

配置envoy：

```yaml
stats_sinks:
  name: envoy.stat_sinks.hystrix
  config:
    num_buckets: 10
```

将envoy重启后，将`http://ENVOY_IP:9901/hystrix_event_stream`填入到hystric的页面中，即可查看envoy 的状态。

### 输出到statsd

>未完成 2018-12-28 16:13:27

[statsd](https://github.com/etsy/statsd)安装方法：

```bash
yum install -y nodejs
git clone https://github.com/etsy/statsd.git
cd statsd
node stats.js exampleConfig.js
```

## 参考

1. [envoy v2 API reference][1]

[1]: https://www.envoyproxy.io/docs/envoy/latest/api-v2/api "envoy v2 API reference"
