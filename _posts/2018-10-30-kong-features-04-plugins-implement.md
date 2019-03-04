---
layout: default
title: "API网关Kong学习笔记（七）：Kong数据平面Plugin的调用与实现"
author: 李佶澳
createdate: 2018/11/01 14:18:00
changedate: 2018/11/01 14:18:00
categories: 项目
tags: 视频教程 kong 
keywords: kong,apigateway,API网关,plugins,kong插件
description: kong的数据平面插件(plugin)的调用过程，请求处理过程，调用插件进行检查的过程和插件的基本结构

---

* auto-gen TOC:
{:toc}

## 说明

这是[API网关Kong的学习笔记](https://www.lijiaocn.com/tags/class.html)中的一篇，使用过程中遇到的问题和解决方法记录在[API网关Kong的使用过程中遇到的问题以及解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/09/30/kong-usage-problem-and-solution.html)。

了解一下Kong的插件的工作过程。

Kong-Ingress-Controller的版本是0.2.0，Kong的版本是0.14.1，是用下面的方式部署的：

./kubectl.sh create -f https://raw.githubusercontent.com/introclass/kubernetes-yamls/master/all-in-one/kong-all-in-one.yaml

下面主要分析了插件的加载时机和插件被调用的时机，插件的实现在[API网关Kong（十一）：自己动手写一个插件][5]中作了详细分析，并仿照写了一个插件。

**相关笔记**，这些笔记是学习过程中做的记录，写的比较仓促，有疑惑的地方以Kong官方文档为准：

[《API网关Kong学习笔记（零）：使用过程中遇到的问题以及解决方法》](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/09/29/kong-usage-problem-and-solution.html)

[《API网关Kong学习笔记（一）：Nginx、OpenResty和Kong的基本概念与使用方法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html)

[《API网关Kong学习笔记（二）：Kong与Kubernetes集成的方法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/integrate-kubernetes-with-kong.html)

[《API网关Kong学习笔记（三）：功能梳理和插件使用-基本使用过程》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/kong-features-00-basic.html)

[《API网关Kong学习笔记（四）：功能梳理和插件使用-认证插件使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/kong-features-01-auth.html)

[《API网关Kong学习笔记（五）：功能梳理和插件使用-安全插件使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/kong-features-02-security.html)

[《API网关Kong学习笔记（六）：Kong数据平面的事件、初始化与插件加载》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-03-data-plane-implement.html)

[《API网关Kong学习笔记（七）：Kong数据平面Plugin的调用与实现》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-04-plugins-implement.html)

[《API网关Kong学习笔记（八）：Kong Ingress Controller的实现》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/02/kong-features-05-ingress-controller-analysis.html)

[《API网关Kong学习笔记（九）：Kong对WebSocket的支持》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/06/kong-features-06-websocket.html)

[《API网关Kong学习笔记（十）：Kong在生产环境中的部署与性能测试方法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/08/kong-features-06-production-and-benchmark.html)

[《API网关Kong学习笔记（十一）：自己动手写一个插件》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/09/kong-features-07-write-plugins.html)

[《API网关Kong学习笔记（十二）：插件的目录中schema分析》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/16/kong-features-08-plugin-schema.html)

[《API网关Kong学习笔记（十三）：向数据库中插入记录的过程分析》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/16/kong-features-09-database-insert.html)

[《API网关Kong学习笔记（十四）：Kong的Admin API概览和使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/19/kong-features-10-apis.html)

[《API网关Kong学习笔记（十五）：KongIngress的定义细节》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/20/kong-features-11-kong-ingress-definition.html)

[《API网关Kong学习笔记（十六）：Kong转发请求的工作过程》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/20/kong-features-16-work-process.html)

[《API网关Kong学习笔记（十七）：Kong Ingress Controller的使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/21/kong-features-17-kong-ingress-controller-run.html)

[《API网关Kong学习笔记（十八）：Kong Ingress Controller的CRD详细说明》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/30/kong-features-18-kong-ingress-controller-crd.html)

[《API网关Kong学习笔记（十九）：Kong的性能测试（与Nginx对比）》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/03/kong-features-19-kong-performance.html)

## 插件加载

插件的加载过程在[API网关Kong（六）：Kong数据平面的实现分析: Plugin的加载与初始化][1]中提过了，这里不再赘述。

需要记住的是，kong启动时加载的插件对象，有三个成员：name、handler、schema:

```lua
-- kong/init.lua
local function load_plugins(kong_conf, dao)
...
  for plugin in pairs(kong_conf.loaded_plugins) do
    ...
    local ok, handler = utils.load_module_if_exists("kong.plugins." .. plugin .. ".handler")
    local ok, schema = utils.load_module_if_exists("kong.plugins." .. plugin .. ".schema")
    ...
    sorted_plugins[#sorted_plugins+1] = {
      name = plugin,
      handler = handler(),
      schema = schema
    }
```

以及所有的插件都存放在全局变量`loaded_plugins`中：

```lua
-- kong/init.lua
function Kong.init()
  ...
  loaded_plugins = assert(load_plugins(config, dao))
  ...
```

在随后的初始化过程中，调用的是handler对象的`init_worker()`方法。

```lua
-- kong/init.lua function Kong.init_worker()
  ...
  for _, plugin in ipairs(loaded_plugins) do
    kong_global.set_namespaced_log(kong, plugin.name)
     ...
    plugin.handler:init_worker()
  end
```

## handler:init_worker()

以ACL插件为例，初始化时调用的`handelr:init_worker()`在kong/plugins/acl/handler.lua中实现：

```lua
-- kong/plugins/acl/handler.lua
local BasePlugin = require "kong.plugins.base_plugin"
...
local ACLHandler = BasePlugin:extend()
...
function ACLHandler:new()
  ACLHandler.super.new(self, "acl")
end
```

ACLHandler自己没有实现`init_worker()`方法，这个方法是从父类BasePlugin中继承的。

`BasePlugin:extend()`在kong/plugins/base_plugin.lua中实现：

```lua
--kong/plugins/base_plugin.lua

local Object = require "kong.vendor.classic"
local BasePlugin = Object:extend()

function BasePlugin:new(name)
  self._name = name
end
...
function BasePlugin:init_worker()
  ngx_log(DEBUG, "executing plugin \"", self._name, "\": init_worker")
end
```

可以看到对于ACL插件，init_worker()没有做什么事情。

有一些插件覆盖了父类的实现，例如kong/plugins/ip-restriction/handler.lua中：

```lua
--kong/plugins/ip-restriction/handler.lua:
...
function IpRestrictionHandler:init_worker()
  IpRestrictionHandler.super.init_worker(self)
  local ok, err = iputils.enable_lrucache()
  if not ok then
    ngx.log(ngx.ERR, "[ip-restriction] Could not enable lrucache: ", err)
  end
end
```

## 请求处理过程

[API网关Kong（六）：Kong数据平面的实现分析: nginx启动][2]中摘出了OpenResty定制的nginx启动使用的配置文件：

```bash
...
server {
...
    ssl_certificate_by_lua_block {
        Kong.ssl_certificate()
    }
    ...
    location / {
        ...
        rewrite_by_lua_block {
            Kong.rewrite()
        }

        access_by_lua_block {
            Kong.access()
        }
        ...
        header_filter_by_lua_block {
            Kong.header_filter()
        }

        body_filter_by_lua_block {
            Kong.body_filter()
        }

        log_by_lua_block {
            Kong.log()
        }
    }
...
}
```

根据 [Web开发平台OpenResty（二)：运行原理与工作过程: NginxLuaModule][3] ，数据平面收到的请求的处理路径是：

```bash
        ssl_certificate_by_lua_block {
            Kong.ssl_certificate()
        }
        rewrite_by_lua_block {
            Kong.rewrite()
        }
        access_by_lua_block {
            Kong.access()
        }
        access_by_lua_block {
            Kong.access()
        }
        ...
        header_filter_by_lua_block {
            Kong.header_filter()
        }

        body_filter_by_lua_block {
            Kong.body_filter()
        }

        log_by_lua_block {
            Kong.log()
        }
```

对Plugins的调用就分布在这些阶段中，这些方法都是在kong/init.lua中实现的。

## 插件的调用过程：以Kong.ssl_certificate()为例

插件的调用过程大体类似，`ssl_certificate()`的实现如下:：

```lua
-- kong/init.lua
function Kong.ssl_certificate()
  kong_global.set_phase(kong, PHASES.certificate)

  local ctx = ngx.ctx

  runloop.certificate.before(ctx)

  for plugin, plugin_conf in plugins_iterator(loaded_plugins, true) do
    kong_global.set_namespaced_log(kong, plugin.name)
    plugin.handler:certificate(plugin_conf)
    kong_global.reset_log(kong)
  end
end
```

可以看到通过`plugins_iterator()`遍历所有插件，然后调用每个插件的handler:certificate()方法。

`plugins_iterator()`在kong/runloop/plugins_iterator.lua中实现，遍历方法如下：

```lua
--kong/runloop/plugins_iterator.lua
local function get_next(self)
  ... 
  local plugin = self.loaded_plugins[i]
  repeat
        if route_id and service_id and consumer_id then
          plugin_configuration = load_plugin_configuration(route_id, service_id, consumer_id, plugin_name, nil)
           ...
  end

  -- return the plugin configuration
  local plugins_for_request = ctx.plugins_for_request
  if plugins_for_request[plugin.name] then
    return plugin, plugins_for_request[plugin.name]
  end

 return plugin, plugins_for_request[plugin.name]
```

第一个返回值是全局变量`loaded_plugins`中的plugin，第二个返回值是存储在数据库中对应的插件配置。

读取数据库中插件配置的时候，是有顺序的，查询条件依次放松（在上面的代码的repeat和end之间）：

```lua
plugin_configuration = load_plugin_configuration(route_id, service_id, consumer_id, plugin_name, nil)
plugin_configuration = load_plugin_configuration(route_id, nil, consumer_id, plugin_name, nil)
plugin_configuration = load_plugin_configuration(nil, service_id, consumer_id, plugin_name, nil)
plugin_configuration = load_plugin_configuration(nil, nil, consumer_id, plugin_name, api_id)
plugin_configuration = load_plugin_configuration(route_id, service_id, nil, plugin_name, nil)
plugin_configuration = load_plugin_configuration(nil, nil, consumer_id, plugin_name, nil)
plugin_configuration = load_plugin_configuration(route_id, nil, nil, plugin_name, nil)
plugin_configuration = load_plugin_configuration(nil, service_id, nil, plugin_name, nil)
plugin_configuration = load_plugin_configuration(nil, nil, nil, plugin_name, api_id)
plugin_configuration = load_plugin_configuration(nil, nil, nil, plugin_name, nil)
```

因为只要读取一个插件配置，就停止后续查找，所以这个顺序就是同一个插件多个配置的优先级顺序，和[API网关Kong（三）：功能梳理和插件使用-基本使用过程: 先了解下插件的作用范围和设置方法][4]对插件的说明相对应。

全局变量`loaded_plugins`中的插件是按照插件自己的优先级排好序的，[API网关Kong（六）：Kong数据平面的实现分析: Plugin的加载与初始化][1]中提到过。

下面是Kong.rewrite()的实现，代码结构基本相同，这回调用的是每个插件的`handler:rewrite()`方法：

```lua
-- kong/init.lua
function Kong.rewrite()
  ...
  runloop.rewrite.before(ctx)
  for plugin, plugin_conf in plugins_iterator(loaded_plugins, true) do
    kong_global.set_named_ctx(kong, "plugin", plugin_conf)
    kong_global.set_namespaced_log(kong, plugin.name)

    plugin.handler:rewrite(plugin_conf)

    kong_global.reset_log(kong)
  end

  runloop.rewrite.after(ctx)
  ...
```

## runloop.X.before 和 runloop.after()

有一些处理阶段，调用插件之前，会先执行XXX.before()方法，调用插件之后会执行XXX.after()方法，例如：

```lua
-- kong/init.lua
...
local runloop = require "kong.runloop.handler"
...
function Kong.rewrite()
  ...
  runloop.rewrite.before(ctx)
    ...
    plugin.handler:rewrite(plugin_conf)
    ...
  runloop.rewrite.after(ctx)
  ...
```

这些方法在kong/runloop/handler.lua中实现。

## ACL插件的Handler

ACL插件的目录结构如下：

```bash
$ tree kong/plugins/acl
kong/plugins/acl
├── api.lua
├── daos.lua
├── groups.lua
├── handler.lua
├── migrations
│   ├── cassandra.lua
│   └── postgres.lua
└── schema.lua
```

插件的父类是BasePlugin:extend()，并且需要设置优先级、版本，和名称：

```lua
-- kong/plugins/acl/handler.lua
local ACLHandler = BasePlugin:extend()

ACLHandler.PRIORITY = 950
ACLHandler.VERSION = "0.1.1"

function ACLHandler:new()
  ACLHandler.super.new(self, "acl")
end
...
```

它的handler.lua中只实现了`access()`方法：

```lua
-- kong/plugins/acl/handler.lua
function ACLHandler:access(conf)
  ...
```

即该插件只在access_by_lua_block阶段生效：

```bash
        access_by_lua_block {
            Kong.access()
        }
```

插件如果实现了多个方法，则会在多个阶段被调用。


## bot-detection插件的实现

[bot-detection](https://docs.konghq.com/hub/kong-inc/bot-detection/)是用来识别机器人插件：

```bash
$ tree kong/plugins/bot-detection
kong/plugins/bot-detection
├── handler.lua
├── rules.lua
└── schema.lua
```

它的handler也只实现了access方法：

```lua
function BotDetectionHandler:access(conf)
	...
	local user_agent, err = get_user_agent()
	...
```

它的用途是检查http请求中的user agent，如果user agent在黑名单中，或者被判定为机器人，则拒绝请求。

## 参考

1. [API网关Kong（六）：Kong数据平面的实现分析: Plugin的加载与初始化][1]
2. [API网关Kong（六）：Kong数据平面的实现分析: nginx启动][2]
3. [Web开发平台OpenResty（二)：运行原理与工作过程: NginxLuaModule][3]
4. [API网关Kong（三）：功能梳理和插件使用-基本使用过程: 先了解下插件的作用范围和设置方法][4]
5. [API网关Kong（十一）：自己动手写一个插件][5]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-03-data-plane-implement.html#plugin%E7%9A%84%E5%8A%A0%E8%BD%BD%E4%B8%8E%E5%88%9D%E5%A7%8B%E5%8C%96  "API网关Kong（六）：Kong数据平面的实现分析: Plugin的加载与初始化" 
[2]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-03-data-plane-implement.html#nginx%E5%90%AF%E5%8A%A8  "API网关Kong（六）：Kong数据平面的实现分析: nginx启动" 
[3]: https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/10/25/openresty-study-02-process.html#nginxluamodule "Web开发平台OpenResty（二)：运行原理与工作过程: NginxLuaModule"
[4]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/kong-features-00-basic.html#%E5%85%88%E4%BA%86%E8%A7%A3%E4%B8%8B%E6%8F%92%E4%BB%B6%E7%9A%84%E4%BD%9C%E7%94%A8%E8%8C%83%E5%9B%B4%E5%92%8C%E8%AE%BE%E7%BD%AE%E6%96%B9%E6%B3%95 "API网关Kong（三）：功能梳理和插件使用-基本使用过程: 先了解下插件的作用范围和设置方法"
[5]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/09/kong-features-07-write-plugins.html "API网关Kong（十一）：自己动手写一个插件"
