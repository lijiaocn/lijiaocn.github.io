---
layout: default
title: "API网关Kong学习笔记（十三）：向数据库中插入记录的过程分析"
author: 李佶澳
createdate: "2018-11-16 18:00:46 +0800"
changedate: "2019-03-04 14:35:45 +0800"
categories: 项目
tags: 视频教程 kong 
keywords: kong,apigateway,API网关,plugin
description: 向数据库中插入记录的时候，会进行插入校验，校验过程会用到schema中定义的类型以及校验函数
---

* auto-gen TOC:
{:toc}

## 说明

这是[API网关Kong的学习笔记](https://www.lijiaocn.com/tags/class.html)中的一篇，使用过程中遇到的问题和解决方法记录在[API网关Kong的使用过程中遇到的问题以及解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/09/30/kong-usage-problem-and-solution.html)。

向数据库中插入记录的时候，会进行插入校验，校验过程会用到schema中定义的类型以及校验函数。这里在[数据库操作封装](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-03-data-plane-implement.html#%E6%95%B0%E6%8D%AE%E5%BA%93%E6%93%8D%E4%BD%9C%E5%B0%81%E8%A3%85)的基础之上，分析`kong/dao/dao.lua`中`DAO:insert()`的实现。

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

## 插入校验

DAO:insert()中写入之前的操作的是校验：

```lua
-- kong/dao/dao.lua
function DAO:insert(tbl, options)
  options = options or {}
  check_arg(tbl, 1, "table")
  check_arg(options, 2, "table")

  local model = self.model_mt(tbl)    
  local ok, err = model:validate {dao = self}   -- 校验 ---
  if not ok then
    return ret_error(self.db.name, nil, err)
  end
  ...
```

校验使用的model是用`self.model_mt()`方法创建的，要去找到model_mt()的方法。

存放了大部分dao对象的DAO是用`kong/dao/factory.lua`中的`function _M.new(kong_config, new_db)`创建的。

```lua
-- kong/dao/factory.lua
function _M.new(kong_config, new_db)
...
  load_daos(self, schemas, constraints)
...
```

在`load_daos()`中创建了一个个具体的dao：

```lua
-- kong/dao/factory.lua
...
local ModelFactory = require "kong.dao.model_factory"
...
local function load_daos(self, schemas, constraints)
  ...
  for m_name, schema in pairs(schemas) do
    self.daos[m_name] = DAO(self.db, ModelFactory(schema), schema,
                            constraints[m_name])
  end
  ...
```

需要注意第二个参数`ModelFactory(schema)`，它就是要找的model_mt()：

```lua
-- kong/dao/dao.lua
-- @param model_mt The related model metatable. Such metatables contain, among other things, validation methods.
function DAO:new(db, model_mt, schema, constraints)
  self.db = db
  self.model_mt = model_mt
  self.schema = schema
  self.table = schema.table
  self.constraints = constraints
end
```

`ModelFactory()`使用传入的schema构建了一个table，并为这个table的设置了包含`validate(opts)`方法的元表：
```lua
-- kong/dao/model_factory.lua
local validate = schemas_validation.validate_entity
return setmetatable({}, {
  __call = function(_, schema)
    local Model_mt = {}
    Model_mt.__meta = {
      __schema = schema,
      __name = schema.name,
      __table = schema.table
    }
    ...
    function Model_mt:validate(opts)
      local ok, errors, self_check_err = validate(self, self.__schema, opts)
      if errors ~= nil then
        return nil, Errors.schema(errors)
      elseif self_check_err ~= nil then
        -- TODO: merge errors and self_check_err now that our errors handle this
        return nil, Errors.schema(self_check_err)
      end
      return ok
    end
    ...
    return setmetatable({}, {
      __call = function(_, tbl)
        local m = {}
        for k,v in pairs(tbl) do
          m[k] = v
        end
        return setmetatable(m, Model_mt)
      end
    })
  end
})

```

`Model_mt:validate()`使用的`validate()`方法在`kong/dao/schemas_validatio.lua`中实现，用schema中定义的每个filed对输入的数据进行校验：

```lua
--kong/dao/schemas_validatio.lua
function _M.validate_entity(tbl, schema, options)
  ...
  for tk, t in pairs(key_values) do
      ...
      for column, v in pairs(schema.fields) do
        if t[column] ~= nil and t[column] ~= ngx.null and v.type ~= nil then
          local is_valid_type
          -- ALIASES: number, timestamp, boolean and array can be passed as strings and will be converted
          if type(t[column]) == "string" then
            if schema.fields[column].trim_whitespace ~= false then
              t[column] = utils.strip(t[column])
            end
            if v.type == "boolean" then
              local bool = t[column]:lower()
              is_valid_type = bool == "true" or bool == "false"
              t[column] = bool == "true"
            elseif v.type == "array" then
              is_valid_type = validate_array(v, t, column)
            elseif v.type == "number" or v.type == "timestamp" then
              t[column] = tonumber(t[column])
              is_valid_type = validate_type(v.type, t[column])
            else -- if string
              is_valid_type = validate_type(v.type, t[column])
            end
          else
            is_valid_type = validate_type(v.type, t[column])
          end

          if not is_valid_type and POSSIBLE_TYPES[v.type] then
            errors = utils.add_error(errors, error_prefix .. column,
                    string.format("%s is not %s %s", column, v.type == "array" and "an" or "a", v.type))
            goto continue
          end
        end
   ...      
```

可以看到支持的类型有`string`、 `boolean`、`array`、`number`、`timestamp`。

field的成员都有：

```lua
v.type
v.default
v.immutable 
v.enum
v.regex 
v.schema
v.required
v.dao_insert_value
v.func
```

`Model_mt:validate()`还会调用schema的`self_check()`进行检查：

```lua
--kong/dao/schemas_validatio.lua
function _M.validate_entity(tbl, schema, options)
  ...
  for tk, t in pairs(key_values) do
      ...
      if errors == nil and type(schema.self_check) == "function" then
        local nil_c = {}
        for column in pairs(schema.fields) do
          if t[column] == ngx.null then
            t[column] = nil
            table.insert(nil_c, column)
          end
        end
        local ok, err = schema.self_check(schema, t, options.dao, options.update)
        if ok == false then
          return false, nil, err
        end
        ...
      end
```

kong/dao/schemas中有的schema实现了`self_check()`，例如`kong/dao/schemas/plugins.lua`：

```lua
--kong/dao/schemas/plugins.lua
return {
  table = "plugins",
  primary_key = {"id", "name"},
  cache_key = { "name", "route_id", "service_id", "consumer_id", "api_id" },
  fields = {
    ...
    config = {
      type = "table",
      schema = load_config_schema,
      default = {}
    },
    ...
  },
  self_check = function(self, plugin_t, dao, is_update)
    if plugin_t.api_id and (plugin_t.route_id or plugin_t.service_id) then
      return false, Errors.schema("cannot configure plugin with api_id " ..
                                  "and one of route_id or service_id")
    end

    -- Load the config schema
    local config_schema, err = self.fields.config.schema(plugin_t)
    ...   
    if config_schema.self_check and type(config_schema.self_check) == "function" then
      local ok, err = config_schema.self_check(config_schema, plugin_t.config and plugin_t.config or {}, dao, is_update)
     ...
  end
}
```

需要注意的是用`self.fields.confg.schema()`创建的`config_schema`也可能实现了`self_check`。self.fields.confg.schema是函数`load_config_schema()`，它加载了插件目录中的schema。

```lua
-- kong/dao/schemas/plugins.lua
local function load_config_schema(plugin_t)
    ...
    local loaded, plugin_schema = utils.load_module_if_exists("kong.plugins."
                                    .. plugin_name .. ".schema")
    if loaded then
      return plugin_schema
    ...
```

## 插入记录

校验通过之后，使用db的insert方法插入数据：

```lua
-- kong/dao/dao.lua
function DAO:insert(tbl, options)
  ...
  local res, err = self.db:insert(self.table, self.schema, model, self.constraints, options)
  if not err and not options.quiet then
    if self.events then
      local _, err = self.events.post_local("dao:crud", "create", {
        schema    = self.schema,
        operation = "create",
        entity    = res,
      })
      if err then
        ngx.log(ngx.ERR, "could not propagate CRUD operation: ", err)
      end
    end
  end
  return ret_error(self.db.name, res, err)
```

需要注意的是，如果dao对象中有`events`，插入之后要向`dao:crud`频道中发出一个`create`事件。
