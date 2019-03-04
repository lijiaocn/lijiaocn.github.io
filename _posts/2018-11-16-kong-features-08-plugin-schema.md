---
layout: default
title: "API网关Kong学习笔记（十二）：插件的目录中schema分析"
author: 李佶澳
createdate: 2018/11/16 14:33:00
changedate: 2018/11/16 14:33:00
categories: 项目
tags: 视频教程 kong 
keywords: kong,apigateway,API网关,plugin
description: 模仿kong中已经有的插件，自己动手写一个，熟悉插件的开发流程

---

* auto-gen TOC:
{:toc}

## 说明

这是[API网关Kong的学习笔记](https://www.lijiaocn.com/tags/class.html)中的一篇，使用过程中遇到的问题和解决方法记录在[API网关Kong的使用过程中遇到的问题以及解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/09/30/kong-usage-problem-and-solution.html)。

这篇是[API网关Kong（十一）：自己动手写一个插件](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/09/kong-features-07-write-plugins.html)的继续，找到调用插件的schema的地方，确定可以在schema中定义的类型和函数。

**相关笔记**，这些笔记是学习过程做的记录，写的比较仓促，有疑惑的地方以Kong官方文档为准：

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

## 不同插件的schema实现

查看了多个插件各自目录下的schema.lua文件，发现以下几种样式：

```lua
--kong/plugins/acl/schema.lua

local Errors = require "kong.dao.errors"

return {
  no_consumer = true,
  fields = {
    whitelist = { type = "array" },
    blacklist = { type = "array" },
    hide_groups_header = { type = "boolean", default = false },
  },
  self_check = function(schema, plugin_t, dao, is_update)
    if next(plugin_t.whitelist or {}) and next(plugin_t.blacklist or {}) then
      return false, Errors.schema "You cannot set both a whitelist and a blacklist"
    elseif not (next(plugin_t.whitelist or {}) or next(plugin_t.blacklist or {})) then
      return false, Errors.schema "You must set at least a whitelist or blacklist"
    end
    return true
  end
}
```

```lua
--kong/plugins/aws-lambda/schema.lua
local function check_status(status)
  if status and (status < 100 or status > 999) then
    return false, "unhandled_status must be within 100 - 999."
  end

  return true
end

return {
  fields = {
    timeout = {
      type = "number",
      default = 60000,
      required = true,
    },
    -- ...省略... --
    aws_key = {
      type = "string",
      required = true,
    },
    -- ...省略... --
    aws_region = {
      type = "string",
      required = true,
      enum = {
        "us-east-1",
        "us-east-2",
        "us-west-1",
        "us-west-2",
        "us-gov-west-1",
        "ap-northeast-1",
        "ap-northeast-2",
        "ap-southeast-1",
        "ap-southeast-2",
        "ap-south-1",
        "ca-central-1",
        "eu-central-1",
        "eu-west-1",
        "eu-west-2",
        "sa-east-1",
      },
    },
    -- ...省略... --
    qualifier = {
      type = "string",
    },
    invocation_type = {
      type = "string",
      required = true,
      default = "RequestResponse",
      enum = {
        "RequestResponse",
        "Event",
        "DryRun",
      }
    },
    log_type = {
      type = "string",
      required = true,
      default = "Tail",
      enum = {
        "Tail",
        "None",
      }
    },
    port = {
      type = "number",
      default = 443,
    },
    unhandled_status = {
      type = "number",
      func = check_status,
    },
    -- ...省略... --
  },
}
```

可以看到field的样式是比较多样的，需要找到使用它们的地方，看看具体是怎样使用的。

## 直接给结论

插件目录中的schema的使用，最终在[API网关Kong（十三）：向数据库中插入记录的过程分析](https://wwww.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/16/kong-features-09-database-insert.html)中找到了答案。

field的成员都有以下这些：

```lua
v.type
v.default
v.immutable 
v.enum
v.regex                : 如果类型是字符串，检查是否匹配正则
v.schema
v.required
v.dao_insert_value
v.func
```

field的类型（v.type）可以是`string`、 `boolean`、`array`、`number`、`timestamp` 。

schema中实现的`self_check()`方法，在插入校验时也会被调用，self_check()的传入参数分别是：schema本身、对应的插件配置、dao、是否是更新：

```lua
--kong/dao/schemas_validatio.lua
function _M.validate_entity(tbl, schema, options)
  ...
  for tk, t in pairs(key_values) do
        ...
        local ok, err = schema.self_check(schema, t, options.dao, options.update)
        ...
```

例如kong/plugins/acl/schema.lua中实现的self_check()：

```lua
--kong/plugins/acl/schema.lua
local Errors = require "kong.dao.errors"
return {
  no_consumer = true,
  fields = {
    whitelist = { type = "array" },
    blacklist = { type = "array" },
    hide_groups_header = { type = "boolean", default = false },
  },
  self_check = function(schema, plugin_t, dao, is_update)
    if next(plugin_t.whitelist or {}) and next(plugin_t.blacklist or {}) then
      return false, Errors.schema "You cannot set both a whitelist and a blacklist"
    elseif not (next(plugin_t.whitelist or {}) or next(plugin_t.blacklist or {})) then
      return false, Errors.schema "You must set at least a whitelist or blacklist"
    end
    return true
  end
}
```

插件目录中的schema是在向数据库写记录的时候被使用的，[API网关Kong（十三）：向数据库中插入记录的过程分析](https://wwww.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/16/kong-features-09-database-insert.html)中有分析。

后面的内容是几次失败的查找过程，有一定价值，暂时保留。

## 插件schema的加载

在[API网关Kong（十一）：自己动手写一个插件--插件配置的定义：acl/schema.lua](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/09/kong-features-07-write-plugins.html#%E6%8F%92%E4%BB%B6%E9%85%8D%E7%BD%AE%E7%9A%84%E5%AE%9A%E4%B9%89aclschemalua)提到过，插件的schema是在Kong.init()中被加载的：

```lua
--kong/init.lua
local function load_plugins(kong_conf, dao)
...

    local ok, handler = utils.load_module_if_exists("kong.plugins." .. plugin .. ".handler")
    ...
    local ok, schema = utils.load_module_if_exists("kong.plugins." .. plugin .. ".schema")
    ...
    sorted_plugins[#sorted_plugins+1] = {
      name = plugin,
      handler = handler(),
      schema = schema
    }
 ...
```

可以看到，schema是直接被存放在`sotred_plugins`中的。

## 插件调用时对schema的引用

[插件的调用过程：以Kong.ssl_certificate()为例](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-04-plugins-implement.html#%E6%8F%92%E4%BB%B6%E7%9A%84%E8%B0%83%E7%94%A8%E8%BF%87%E7%A8%8B%E4%BB%A5kongssl_certificate%E4%B8%BA%E4%BE%8B)中分析过，插件是各个处理阶段被调用的。

是通过`plugins_iterator()`遍历所有插件，然后调用每个插件的handler:certificate()方法。

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

其中与schema相关的应当是`load_plugin_configuration()`，这个函数是用来读取插件的配置的。

```lua
--kong/runloop/plugins_iterator.lua

local function load_plugin_configuration(route_id,
                                         service_id,
                                         consumer_id,
                                         plugin_name,
                                         api_id)
  local plugin_cache_key = kong.dao.plugins:cache_key(plugin_name,
                                                            route_id,
                                                            service_id,
                                                            consumer_id,
                                                            api_id)

  local plugin, err = kong.cache:get(plugin_cache_key,
                                     nil,
                                     load_plugin_into_memory,   -- 这个参数是个函数 --
                                     route_id,
                                     service_id,
                                     consumer_id,
                                     plugin_name,
                                     api_id)
  if err then
    ngx.ctx.delay_response = false
    return responses.send_HTTP_INTERNAL_SERVER_ERROR(err)
  end

  if plugin ~= nil and plugin.enabled then
    local cfg       = plugin.config or {}
    cfg.api_id      = plugin.api_id
    cfg.route_id    = plugin.route_id
    cfg.service_id  = plugin.service_id
    cfg.consumer_id = plugin.consumer_id

    return cfg
  end
end
```

其中关键函数是`kong.cache:get()`，它读取了插件的配置，它的第二个参数`load_plugins_into_memory`是个函数，当缓存中没有插件配置的时候，这个函数被调用从数据库中读取插件配置。`kong.cache`是一个缓存在`kong/cache.lua`中实现，存放在其中的内容有效期。

`load_plugins_into_memory()`实现如下，直接用kong.dao.plugins从数据库查找：

```lua
--kong/runloop/plugins_iterator.lua
local function load_plugin_into_memory(route_id,
                                       service_id,
                                       consumer_id,
                                       plugin_name,
                                       api_id)
  local rows, err = kong.dao.plugins:find_all {
             name = plugin_name,
         route_id = route_id,
       service_id = service_id,
      consumer_id = consumer_id,
           api_id = api_id,
  }
  if err then
    return nil, tostring(err)
  end

  if #rows > 0 then
    for _, row in ipairs(rows) do
      if    route_id == row.route_id    and
          service_id == row.service_id  and
         consumer_id == row.consumer_id and
              api_id == row.api_id      then
        return row
      end
    end
  end
end
```

一直到现在插件schema都没有出场，去看一下`kong.dao.plugins:find_all()`的实现，看看有没有用到schema。

## 数据库的使用过程

[API网关Kong（六）：Kong数据平面的事件、初始化与插件加载](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-03-data-plane-implement.html)中分析过数据库的使用。

在kong/dao/dao.lua中找到`find_all()`的实现：

```lua
-- kong/dao/dao.lua
function DAO:find_all(tbl)
  if tbl ~= nil then
    check_arg(tbl, 1, "table")
    check_utf8(tbl, 1)
    check_not_empty(tbl, 1)

    local ok, err = schemas_validation.is_schema_subset(tbl, self.schema)
    if not ok then
      return ret_error(self.db.name, nil, Errors.schema(err))
    end
  end

  return ret_error(self.db.name, self.db:find_all(self.table, tbl, self.schema))
end
```

这里判断传入的tbl是否是对应表的子集的时候，用到self.schema，但是这个schema不是插件的schema，而是数据库中表的schema。这条线索断了。

既然读取插件配置的时候没有用到插件的schema，那么会不会是在创建插件配置的时候用到的？

## 数据库的写入过程

数据库的写入过程分析见：[API网关Kong（十三）：向数据库中插入记录的过程分析](https://wwww.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/16/kong-features-09-database-insert.html)
