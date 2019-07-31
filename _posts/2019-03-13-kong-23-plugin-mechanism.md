---
layout: default
title: "API网关Kong学习笔记（二十三）：Kong 1.0.3的plugin/插件机制的实现"
author: 李佶澳
createdate: "2019-03-13 18:08:46 +0800"
last_modified_at: "2019-05-20 14:50:00 +0800"
categories: 项目
tags: kong
keywords: kong,kong 1.0.3,代码学习
description: "学习一下kong 1.0.3的plugin，看一下plugin是怎样加载的，加载时作了哪些检查以及插件应该如何实现"
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

学习一下kong 1.0.3的plugin，看一下plugin是怎样加载的，加载时作了哪些检查以及插件应该如何实现"。[插件的加载、使用和实现][1]中有一些相关内容，这里在之前的基础上继续深入。

{% include kong_pages_list.md %}

## 引子

[插件的加载、使用和实现][1]中将要加载的插件名称保存在conf.loaded_plugins中，然后回到kong/init.lua中进行了如下操作：

```lua
-- kong/init.lua: 253
local config = assert(conf_loader(conf_path))
...
local db = assert(DB.new(config))
assert(db:init_connector())
...
assert(db:connect())
assert(db.plugins:check_db_against_config(config.loaded_plugins))
...
-- Load plugins as late as possible so that everything is set up
loaded_plugins = assert(db.plugins:load_plugin_schemas(config.loaded_plugins))
sort_plugins_for_execution(config, db, loaded_plugins)
```

插件的加载在数据库初始化之后，并且用的是db.plugins的方法load_plugin_schemas()，在[数据库的初始化][2]中分析过`db.plugins`实质是`db.daos[plugins]`，要了解db.plugins:load_plugin_schemas()的实现必须先去搞清楚DB的实例化过程，找到daos的实现。

后面绕了一大圈发现db.plugins:check_db_against_config()和db.plugins:load_plugin_schemas()的实现位于`kong/db/plugins.lua`中，db.daos[plugins]是表plugins的entity，这个表使用了dao的扩展模块`kong.db.dao.plugins`。

## DB实例化过程

要找的目标是db.daos[plugins]，它应当实现了`check_db_against_config()`和`load_plugin_schemas()`，借着这个寻找过程掌握kong中DB实例化过程。

在kong/db/init.lua中加载了一组`kong.db.schema.entities.*`，如下：

```lua
-- kong/db/init.lua: 23
local CORE_ENTITIES = {
  "consumers",
  "services",
  "routes",
  "certificates",
  "snis",
  "upstreams",
  "targets",
  "plugins",
  "cluster_ca",
}
-- kong/db/init.lua: 60
local schemas = {}

do
  for _, entity_name in ipairs(CORE_ENTITIES) do
    local entity_schema = require("kong.db.schema.entities." .. entity_name)

    local ok, err_t = MetaSchema:validate(entity_schema)
    if not ok then
      return nil, fmt("schema of entity '%s' is invalid: %s", entity_name,
                      tostring(errors:schema_violation(err_t)))
    end
    local entity, err = Entity.new(entity_schema)
    if not entity then
      return nil, fmt("schema of entity '%s' is invalid: %s", entity_name,
                      err)
    end
    schemas[entity_name] = entity
  end
end
```

在kong/db/init.lua中找到了db.daos的实例化代码，用到了上面加载的存放在schemas中的entity，`DAO.new()`的第二个参数schema就是：

```lua
-- kong/db/init.lua: 108
for _, schema in pairs(schemas) do
  local strategy = strategies[schema.name]
  if not strategy then
    return nil, fmt("no strategy found for schema '%s'", schema.name)
  end
  daos[schema.name] = DAO.new(self, schema, strategy, errors)
end
```

这时候就找到了目标db.daos[plugins]，它就是在上面的for循环中设置的。但还不够，还需要找到它的两个方法`check_db_against_config()`和`load_plugin_schemas()`，继续看下面的分析，你会发现这两个方法还真不好找...

db.daos[plugins]对应的entity是以kong/db/schema/entities/plugins.lua为输入创建的，plugins.lua内容如下：

```lua
-- kong/db/schema/entities/plugins.lua
local typedefs = require "kong.db.schema.typedefs"
local null = ngx.null

return {
  name = "plugins",
  primary_key = { "id" },
  cache_key = { "name", "route", "service", "consumer" },
  dao = "kong.db.dao.plugins",

  subschema_key = "name",
  subschema_error = "plugin '%s' not enabled; add it to the 'plugins' configuration property",

  fields = {
    { id = typedefs.uuid, },
    { name = { type = "string", required = true, }, },
    { created_at = typedefs.auto_timestamp_s },
    { route = { type = "foreign", reference = "routes", default = null, on_delete = "cascade", }, },
    { service = { type = "foreign", reference = "services", default = null, on_delete = "cascade", }, },
    { consumer = { type = "foreign", reference = "consumers", default = null, on_delete = "cascade", }, },
    { config = { type = "record", abstract = true, }, },
    { run_on = typedefs.run_on },
    { enabled = { type = "boolean", default = true, }, },
  },
}
```

注意上面的代码中有这样一行`dao="kong.db.dao.plugins"`，明确指定了这个entity使用的`dao扩展`（这是一个特别重要的地方）。它的加载过程包含下面几步操作：

```lua
local entity_schema = require("kong.db.schema.entities." .. entity_name)
local ok, err_t = MetaSchema:validate(entity_schema)
local entity, err = Entity.new(entity_schema)
schemas["plugins"] = entity
```

`MetaSchema:validate()`位于是kong/db/schema/init.lua:1511，暂时不分析，现在只需知道有这么一个校验函数。`Entity.new()`位于kong/db/schema/entity.lua:26，这是一个关键实现，现在只需要知道`kong/db/schema/entity.lua`和它调用的`kong/db/schema/init.lua`会检查“kong/db/schema/entities/plugins.lua”中的fields等。

>如果要知道“kong/db/schema/entities/plugins.lua”这类文件中的内容格式，需要仔细阅读“kong/db/schema/entity.lua”和“kong/db/schema/init.lua”。

为了找到目标的两个方法，我们需要阅读`DAO.new()`的实现，它的第二个参数schema就是上面加载的entity：

```lua
daos[schema.name] = DAO.new(self, schema, strategy, errors)
```

DAO.new()在kong/db/dao/init.lua中实现：

```lua
-- db/dao/init.lua:533
function _M.new(db, schema, strategy, errors)
  local fk_methods = generate_foreign_key_methods(schema)
  local super      = setmetatable(fk_methods, DAO)

  local self = {
    db       = db,
    schema   = schema,
    strategy = strategy,
    errors   = errors,
    super    = super,
  }

  if schema.dao then
    local custom_dao = require(schema.dao)
    for name, method in pairs(custom_dao) do
      self[name] = method
    end
  end

  return setmetatable(self, { __index = super })
end
```

注意其中的`if schema.dao`：如果kong.db.schema.entities.XX中的变量dao不为空，将它指定的模块加载，并将模块中的所有成员添加到正在创建的dao对象中。

kong/db/schema/entities/plugins.lua中的dao不为空，是`dao="kong.db.dao.plugins"`，打开kong/db/dao/plugins.lua一看，目标的两个方法安然地位于其中：

```lua
-- kong/db/dao/plugins.lua: 29
function Plugins:check_db_against_config(plugin_set)
  local in_db_plugins = {}
  ngx_log(ngx_DEBUG, "Discovering used plugins")

  for row, err in self:each(1000) do
    if err then
      return nil, tostring(err)
    end
    in_db_plugins[row.name] = true
  end
  ...

-- kong/db/dao/plugins.lua: 209
function Plugins:load_plugin_schemas(plugin_set)
  local plugin_list = {}
  local db = self.db
  ...
```

注意上面代码中有一行`self:each(1000)`，这个each()函数是`kong/db/dao/init.lua`中的`function DAO:each(size, options)`。kong.db.dao.plugins中的方法被复制到了dao对象中，通过dao对象调用，因此方法中的self是dao对象。

至此，DB对象实例化过程的脉络就清楚了，顺便掌握了扩展dao的方法：在kong/db/schema/entities/XX.lua中定义一个dao变量，指定dao的扩展模块的路径。

接下来就是分析两个方法的实现，在开始之前先做个小总结，加深记忆：

1. kong/db/init.lua的变量CORE_ENTITIES中是要加载的entity的名称，即数据库中的表名，每个数据库表对应的代码是“kong/db/schema/entities/表名.lua”。这些表是kong的核心表，是不可缺少的。

2. 在kong/init.lua中，“db.表名”就是对应表的dao对象，可以用来操作对应表中的记录。

3. 有一些表扩展了默认的dao对象(kong/db/dao/init.lua)，为dao对象添加了额外的方法，例如plugins表。扩展dao的代码在kong/db/schema/entities/XX.lua中用dao变量指定，核心表的dao扩展代码都位于kong/db/dao中。

## 插件的加载过程

db.plugins以及它的两个方法找到了，接下来分析插件加载的过程，也就是db.plugins的两个方法的实现。

```lua
-- kong/init.lua: 253
local config = assert(conf_loader(conf_path))
...
assert(db.plugins:check_db_against_config(config.loaded_plugins))
...
loaded_plugins = assert(db.plugins:load_plugin_schemas(config.loaded_plugins))
sort_plugins_for_execution(config, db, loaded_plugins)
```

参数config.loaded_plugins在[插件的加载、使用和实现][1] 中分析过，它的值是`kong/constans.lua`中plugins变量里存放的插件名称：

```lua
-- kong/constans.lua
local plugins = {
  "jwt",
  "acl",
  "correlation-id",
  "cors",
  "oauth2",
  "tcp-log",
  "udp-log",
  "file-log",
  "http-log",
  "key-auth",
  "hmac-auth",
  "basic-auth",
  "ip-restriction",
  "request-transformer",
  "response-transformer",
  "request-size-limiting",
  "rate-limiting",
  "response-ratelimiting",
  "syslog",
  "loggly",
  "datadog",
  "ldap-auth",
  "statsd",
  "bot-detection",
  "aws-lambda",
  "request-termination",
  -- external plugins
  "azure-functions",
  "zipkin",
  "pre-function",
  "post-function",
  "prometheus",
}
```

plugins的扩展的dao方法check_db_against_config()和load_plugin_schemas()是如何处理这些插件的？

### check_db_against_config(): 检查插件是否齐备

check_db_against_config()把plugins中的所有记录读取出来，看一下要加载的插件是否能覆盖plugins表的插件记录，如果不能，说明有一个插件已经被使用（在数据库中有相关记录），但是正在启动的kong没有加载这个插件，这时候要报错（kong启动失败）。

```lua
-- kong/db/dao/plugins.lua：29 

function Plugins:check_db_against_config(plugin_set)
  local in_db_plugins = {}
  ngx_log(ngx_DEBUG, "Discovering used plugins")

  for row, err in self:each(1000) do
    ...
    in_db_plugins[row.name] = true
  end

  -- check all plugins in DB are enabled/installed
  for plugin in pairs(in_db_plugins) do
    if not plugin_set[plugin] then
      return nil, plugin .. " plugin is in use but not enabled"
    end
  end

  return true
end
```

### load_plugin_schemas(): 加载插件

load_plugin_schemas()才是重点，一个for循环逐个插件加载：

```lua
-- kong/db/dao/plugins.lua: 209
function Plugins:load_plugin_schemas(plugin_set)
  local plugin_list = {}
  local db = self.db

  -- load installed plugins
  for plugin in pairs(plugin_set) do
     ...
     -- 插件的handler模块:  kong/plugins/插件名称/handler.lua
     local plugin_handler = "kong.plugins." .. plugin .. ".handler"
     local ok, handler = utils.load_module_if_exists(plugin_handler)
     ...
     -- 插件的schema模块:   kong/plugins/插件名称/schema.lua
     local plugin_schema = "kong.plugins." .. plugin .. ".schema"
     ok, schema = utils.load_module_if_exists(plugin_schema)
     ...
  end
```

handler这条线比较简单，保存一下就返回了，在kong/init.lua中被使用:

```lua
-- kong/db/dao/plugins.lua: 269
  ...  
  plugin_list[#plugin_list+1] = {
    name = plugin,
    handler = handler(),
  }
  ..
return plugin_list
```

schema这条线比较折腾，下面去掉了所有err处理代码：

```lua
-- kong/db/dao/plugins.lua: 227
local schema
local plugin_schema = "kong.plugins." .. plugin .. ".schema"
ok, schema = utils.load_module_if_exists(plugin_schema)
...

if schema.name then
  ok, err_t = MetaSchema.MetaSubSchema:validate(schema)
  ...
else
  schema, err = convert_legacy_schema(plugin, schema)
  ...
end

ok, err = Entity.new_subschema(self.schema, plugin, schema)
...

if schema.fields.consumer and schema.fields.consumer.eq == null then
  plugin.no_consumer = true
end
if schema.fields.route and schema.fields.route.eq == null then
  plugin.no_route = true
end
if schema.fields.service and schema.fields.service.eq == null then
  plugin.no_service = true
end
```

每个插件各自的表(schema)作为一个subschema挂载到plugin表的schema中: Entity.new_subschema(self.schema, plugin, schema)。


```lua
-- kong/db/schema/entity.lua: 61
function Entity.new_subschema(schema, key, definition)
  make_records_required(definition)
  definition.required = nil
  return Schema.new_subschema(schema, key, definition)
end

-- kong/db/schema/init.lua: 1817
function Schema.new_subschema(self, key, definition)
  assert(type(key) == "string", "key must be a string")
  assert(type(definition) == "table", "definition must be a table")

  if not self.subschema_key then
    return nil, validation_errors.SUBSCHEMA_BAD_PARENT:format(self.name)
  end

  local subschema, err = Schema.new(definition, true)
  if not subschema then
    return nil, err
  end

  if not self.subschemas then
    self.subschemas = {}
  end
  self.subschemas[key] = subschema

  return true
end
```

要搞清楚每个插件的`schema.lua`怎样写，折腾这部分代码就可以了。

插件也可以扩展默认的daos，扩展代码就在插件目录中以`daos.lua`命名，加载过程又是一个比较繁琐的实现，有需要的时候再看：

```lua
-- kong/db/dao/plugins.lua: 275
local has_daos, daos_schemas = utils.load_module_if_exists("kong.plugins." .. plugin .. ".daos")
...
```

需要单独创建表的插件，要在插件目录中准备一个migrations目录，存放创建数据库表和更改数据库表的语句。

总结一下：

1. 默认加载的插件名单在kong/constans.lua中plugins变量里，kong的配置文件中包含`bundled`时，例如“plugins = bundled”，加载这个名单里的所有插件，解读配置的代码位于kong/conf_loader.lua:783中。

2. 插件代码必须在kong/plugins目录中，并且每个插件占用一个同名目录。

3. 插件的入口是插件中的handler.lua，插件自己的表对应的entity是插件中的schema.lua，插件的daos扩展是插件中的daos.lua，插件自己的数据库表的创建和更新文件位于插件中的migrations目录中。

## 实现一个插件

在kong/plugins中创建与插件同名的目录`http-redirect`。

在schema.lua中定义插件的配置项：

```lua
-- kong/plugins/http-redirect/schema.lua
local typedefs = require "kong.db.schema.typedefs"

return {
    name = "http-redirect",
    fields = {
      { consumer = typedefs.no_consumer },
      { run_on = typedefs.run_on_first },
      { config = {
          type = "record",
          fields = {
            { regex   = { type = "string",required = true  },},
            { replace = { type = "string",required = true  },},
            { flag = {type="string", default="redirect", required =true},},
          }
        }
      }
    },
}
```

在handler.lua中实现插件的功能：

```lua
-- kong/plugins/http-redirect/handler.lua
local BasePlugin = require "kong.plugins.base_plugin"

local RedirectHandler= BasePlugin:extend()
local json = require "json"


RedirectHandler.PRIORITY = 2000
RedirectHandler.VERSION = "0.1.0"

-- conf is plugin's conf, stored in db
function RedirectHandler:access(conf)
    RedirectHandler.super.access(self)

    local host = ngx.var.host
    ngx.log(ngx.DEBUG, "http-redirect plugin, host is: ", host, " ,uri is: ",
            ngx.var.request_uri, " ,config is: ", json.encode(conf))

    local replace,n,err  = ngx.re.sub(ngx.var.request_uri, conf.regex, conf.replacement)
    if replace and n == 0 then
        return
    end

    if err then
        ngx.log(ngx.ERR, "http-redirect plugin, ngx.re.sub err: ",err, " ,host is: ", host, " ,uri is: ",
                ngx.var.request_uri, " ,config is: ", json.encode(conf))
        return
    end

    ngx.log(ngx.DEBUG, "http-redirect plugin, replace is: ",replace)
    if conf.flag == "redirect" then
        ngx.redirect(replace,302)
    elseif conf.flag == "permanent" then
        ngx.redirect(replace,301)
    end
end

function RedirectHandler:new()
    RedirectHandler.super.new(self, "http-redirect")
end

return RedirectHandler

```

插件开发完成之后，在`kong/kong-1.0.3-0.rockspec`中设置modules：

	["kong.plugins.http-redirect.handler"] = "kong/plugins/http-redirect/handler.lua",
	["kong.plugins.http-redirect.schema"] = "kong/plugins/http-redirect/schema.lua",

如果插件代码中引入了第三方的lua包，记得把新增加的依赖添加到kong/kong-1.0.3-0.rockspec文件的`dependencies`字段中，例如： 

	-- add rely
	"luajson==1.3.4-1",

然后就可以在kong.conf中配置新增加的插件了：

	plugins = bundled,http-redirect

如果想把新开发的插件作为bundled插件，在kong/constans.lua中plugins变量中添加新插件的名称。

插件对应的KongPlugin示例：

```yaml
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: echo-http-redirect
  namespace: demo-echo
disabled: false  # optional
plugin: http-redirect
config:                            # 参照：http://nginx.org/en/docs/http/ngx_http_redirect_module.html#redirect
  regex: "^/abc(.*)"               # nginx的正则表达式，匹配URI
  replace: "/redirect/$1"          # 可以使用捕获
  flag: "permanent"                # 当前只支持permanent(301)和redirect(302)
```

引用插件的方法，在ingress中设置annotation：

```yaml
annotations:
  plugins.konghq.com: echo-http-redirect
```

## 参考

1. [API网关Kong学习笔记（二十二）：Kong 1.0.3源代码快速走读：插件的加载、使用和实现][1]
2. [API网关Kong学习笔记（二十二）：Kong 1.0.3源代码快速走读：数据库的初始化][2]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2019/03/12/kong-22-1-0-3-codes.html#%E6%8F%92%E4%BB%B6%E7%9A%84%E5%8A%A0%E8%BD%BD%E5%92%8C%E4%BD%BF%E7%94%A8 "API网关Kong学习笔记（二十二）：Kong 1.0.3源代码快速走读：数据库的初始化"
[2]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2019/03/12/kong-22-1-0-3-codes.html#%E6%95%B0%E6%8D%AE%E5%BA%93%E7%9A%84%E5%88%9D%E5%A7%8B%E5%8C%96 "API网关Kong学习笔记（二十二）：Kong 1.0.3源代码快速走读：数据库的初始化"
