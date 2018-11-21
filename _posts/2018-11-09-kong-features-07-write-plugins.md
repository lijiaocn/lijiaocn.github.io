---
layout: default
title: "API网关Kong使用教程（十一）：自己动手写一个插件"
author: 李佶澳
createdate: "2018-11-09 16:22:33 +0800"
changedate: "2018-11-09 16:22:33 +0800"
categories: 项目
tags: 视频教程 kong 
keywords: kong,apigateway,API网关,plugin
description: 模仿kong中已经有的插件，自己动手写一个，熟悉插件的开发流程
---

* auto-gen TOC:
{:toc}

## 说明

这是[API网关Kong的系列教程](https://www.lijiaocn.com/tags/class.html)中的一篇，使用过程中遇到的问题和解决方法记录在[API网关Kong的使用过程中遇到的问题以及解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/09/30/kong-usage-problem-and-solution.html)。

这里模仿已经有的插件，写一个http-rewrite插件，这个插件的用途是改写uri。

这里使用的kong的版本是0.14.1，如果使用其它的版本，例如最新的[1.0.0rc2](https://discuss.konghq.com/t/kong-1-0rc2-available-for-testing/2142)，插件的开发过程可能会有不同。

插件开发过程中，一些常规操作的方法可以在[Web开发平台OpenResty（四）：项目开发中常用的操作][1]中找到，可以使用的Nginx变量都收录在[Nginx: Alphabetical index of variables][2]中，可以用的Lua API位于[Nginx API for Lua][3]中，Lua的标准库方法可以到[Lua 5.1 Reference Manual][5]中查看。

## 先分析ACL插件的实现

[API网关Kong（七）：Kong数据平面Plugin的调用与实现][4]中大概介绍了插件是如何被调用的，但没有分析插件的具体实现方法，这里先详细分析一下ACL插件的实现，搞清楚每个细节，然后再仿照写一个插件。

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

### 与数据库操作有关的代码

acl插件有自己的一张表，有的插件不需要自己的表，就没有定义数据库表的代码。

#### 数据库表创建：acl/migrations/postgres.lua

acl插件在数据库中创建了自己的一张表，表名为acl，kong/plugins/acl/migrations/postgres.lua中给出了表的创建和销毁方法：

```lua
-- kong/plugins/acl/migrations/postgres.lua
return {
  {
    name = "2015-08-25-841841_init_acl",
    up = [[
      CREATE TABLE IF NOT EXISTS acls(
        id uuid,
        consumer_id uuid REFERENCES consumers (id) ON DELETE CASCADE,
        "group" text,
        created_at timestamp without time zone default (CURRENT_TIMESTAMP(0) at time zone 'utc'),
        PRIMARY KEY (id)
      );

      DO $$
      BEGIN
        IF (SELECT to_regclass('acls_group')) IS NULL THEN
          CREATE INDEX acls_group ON acls("group");
        END IF;
        IF (SELECT to_regclass('acls_consumer_id')) IS NULL THEN
          CREATE INDEX acls_consumer_id ON acls(consumer_id);
        END IF;
      END$$;
    ]],
    down = [[
      DROP TABLE acls;
    ]]
  }
}
```

[API网关Kong（六）：Kong数据平面的实现分析: 数据库表的创建][6]中分析过，kong的数据库创建的时候会加载每个插件的migrations子目录中的模块文件，执行其中的SQL语句。

migrations子目录有两个lua文件，对应同名的数据库，kong现在(2018-11-13 15:28:46)只支持cassandra和postgres。

#### 数据库表结构：acl/daos.lua

除了在acl/migrations/postgres.lua中填写数据库表的创建删除方法，还需要在`acl/daos.lua`中给出表结构定义：

```lua
-- kong/plugins/acl/daos.lua
local singletons = require "kong.singletons"

local function check_unique(group, acl)
   ...
end
...
local SCHEMA = {
  primary_key = {"id"},
  table = "acls",
  cache_key = { "consumer_id" },
  fields = {
    id = { type = "id", dao_insert_value = true },
    created_at = { type = "timestamp", dao_insert_value = true },
    consumer_id = { type = "id", required = true, foreign = "consumers:id" },
    group = { type = "string", required = true, func = check_unique }
  },
}

return {acls = SCHEMA}
```

[API网关Kong（六）：Kong数据平面的实现分析: kong/dao: DAOFactory.new()][7]中分析过，kong/dao/在创建dao的时候，会加载每个插件中的daos.lua文件，生成一个对应的entity。

### 插件配置的定义：acl/schema.lua

kong中每个插件的配置存放在plugins表中的config字段，是一段json文本：

```bash
kong=# \d plugins
                                                Table "public.plugins"
   Column    |            Type             |                                 Modifiers
-------------+-----------------------------+---------------------------------------------------------------------------
 id          | uuid                        | not null
 name        | text                        | not null
 api_id      | uuid                        |
 consumer_id | uuid                        |
 config      | json                        | not null
 enabled     | boolean                     | not null
 created_at  | timestamp without time zone | default timezone('utc'::text, ('now'::text)::timestamp(0) with time zone)
 route_id    | uuid                        |
 service_id  | uuid                        |
 ```

schema.lua中给出插件的json配置文件的定义，

```lua
-- kong/plugins/acl/schema.lua
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

[API网关Kong（六）：Kong数据平面的实现分析: plugin的加载和初始化][8]中分析过，Kong.init()在加载插件的时候，会将插件目录中的schema.lua和handler.lua加载：

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

#### 插件功能的实现：acl/handler.lua

`acl/handler.lua`中实现了插件的功能，这个插件中定义的方法，会在处理请求和响应的时候被调用。
[API网关Kong（七）：Kong数据平面Plugin的调用与实现][9]分析过调用过程。

acl插件实现了`new()`和`access()`两个方法，只在access阶段发挥作用：

```lua
-- kong/plugins/acl/handler.lua
...
function ACLHandler:new()
  ACLHandler.super.new(self, "acl")
end

function ACLHandler:access(conf)
  ACLHandler.super.access(self)
...
```

[插件的调用过程：以Kong.ssl_certificate()为例][10]中分析了调用过程，这里传入的参数conf，就是当前请求对应的插件配置，从ctx.plugins_for_request中也可以获得当前请求对应的插件配置：

```lua
--kong/runloop/plugins_iterator.lua
local function get_next(self)
   ...
   ctx.plugins_for_request[plugin.name] = plugin_configuration
   ...
return plugin, plugins_for_request[plugin.name]
```

## 准备插件文件

在kong/plugins中创建插件目录：

	mkdir kong/plugins/http-rewrite

### 创建数据库表与数据库检查：migrations

在kong/plugins/http-rewrite/migrations中创建文件`postgres.lua`：

```lua
return {
    {
        name = "2018-11-09_multiple_orgins",
        up = function(db)
            local rows, err = db:query([[
        SELECT * FROM plugins WHERE name = 'http-rewrite'
      ]])
            if err then
                return err
            end
        end,
    }
}
```

如果插件有自己的数据库表，或者对数据库表或表中数据有要求，在插件目录中创建`migrations`目录：

	mkdir migrations/

如果使用的是postgres，创建`migrations/postgres.lua`，如果用cassandra，创建`migrations/cassandra.lua`。这里以postgres为例。

postgres.lua返回的是一个table，包含`name`、`up`、`down`三个成员，name是字符串，up和down可以是任意的SQL语句，也可以是lua函数。
例如acl插件中的up和down是两段SQL语句：

```lua
-- kong/plugins/acl/migrations/postgres.lua
return {
  {
    name = "2015-08-25-841841_init_acl",
    up = [[
      CREATE TABLE IF NOT EXISTS acls(
        id uuid,
        consumer_id uuid REFERENCES consumers (id) ON DELETE CASCADE,
        "group" text,
        created_at timestamp without time zone default (CURRENT_TIMESTAMP(0) at time zone 'utc'),
        PRIMARY KEY (id)
      );

      DO $$
      BEGIN
        IF (SELECT to_regclass('acls_group')) IS NULL THEN
          CREATE INDEX acls_group ON acls("group");
        END IF;
        IF (SELECT to_regclass('acls_consumer_id')) IS NULL THEN
          CREATE INDEX acls_consumer_id ON acls(consumer_id);
        END IF;
      END$$;
    ]],
    down = [[
      DROP TABLE acls;
    ]]
  }
}
```

而cors插件中，up是一个函数，down不存在：

```lua
-- kong/plugins/cors/migrations/postgres.lua
return {
  {
    name = "2017-03-14_multiple_orgins",
    up = function(db)
      local cjson = require "cjson"

      local rows, err = db:query([[
        SELECT * FROM plugins WHERE name = 'cors'
      ]])
      if err then
        return err
      end

      for _, row in ipairs(rows) do
        row.config.origins = { row.config.origin }
        row.config.origin = nil

        local _, err = db:query(string.format([[
          UPDATE plugins SET config = '%s' WHERE id = '%s'
        ]], cjson.encode(row.config), row.id))
        if err then
          return err
        end
      end
    end,
  }
}
```

因为up和down可以是lua函数，因此能够做更多的检查判断，如果不满足条件就返回err。

### 数据库表定义：daos.lua

如果插件有自己的数据库表，还需要在插件目录中创建daos.lua，返回数据库表定义，如果没有单独的数据库表，不需要创建这个文件。

### 插件配置定义：schema.lua

创建文件`schema.lua`，定义插件使用配置：

```lua
local Errors = require "kong.dao.errors"

return {
    no_consumer = true,
    fields = {
        regex = { type = "string" },
        replacement = { type = "string" },
        flag = {type = "string"},
    },
    self_check = function(schema, plugin_t, dao, is_update)
        -- TODO: add check
        return true
    end
}
```

### 插件功能实现：handler.lua

在kong/plugins/http-rewrite中创建文件`handler.lua`：

```lua
local BasePlugin = require "kong.plugins.base_plugin"

local RewriteHandler= BasePlugin:extend()


RewriteHandler.PRIORITY = 2000
RewriteHandler.VERSION = "0.1.0"

-- 传入参数conf是这个插件存放在数据库中配置
function RewriteHandler:access(conf)
    RewriteHandler.super.access(self)

    local host = ngx.var.host
    ngx.log(ngx.DEBUG, "http-rewrite plugin, host is: ", host, " ,uri is: ",
            ngx.var.request_uri, " ,config is: ", json.encode(conf))

    local replace,n,err  = ngx.re.sub(ngx.var.request_uri, conf.regex, conf.replacement)
    if replace and n == 0 then
        return
    end

    if err then
        ngx.log(ngx.ERR, "http-rewrite plugin, ngx.re.sub err: ",err, " ,host is: ", host, " ,uri is: ",
                ngx.var.request_uri, " ,config is: ", json.encode(conf))
        return
    end

    ngx.log(ngx.DEBUG, "http-rewrite plugin, replace is: ",replace)
    if conf.flag == "redirect" then
        ngx.redirect(replace,302)
    elseif conf.flag == "permanent" then
        ngx.redirect(replace,301)
    end
end

function RewriteHandler:new()
    RewriteHandler.super.new(self, "http-rewrite")
end

return RewriteHandler
```

## 插件的启用  

插件开发完成后，首先要在项目根目录中的`kong-0.14.1-0.rockspec`文件中，填写新开发的插件：

	["kong.plugins.http-rewrite.migrations.postgres"] = "kong/plugins/http-rewrite/migrations/postgres.lua",
	["kong.plugins.http-rewrite.handler"] = "kong/plugins/http-rewrite/handler.lua",
	["kong.plugins.http-rewrite.schema"] = "kong/plugins/http-rewrite/schema.lua",

否则luarocks不会将新添加的插件的代码安装到系统中，如果是lua5.1，默认安装到/usr/share/lua/5.1目录中（不同操作系统，同一个操作系统的不同版本的luarocks，安装路径可能不同）：

	$ ls /usr/share/lua/5.1/kong/plugins/http-rewrite/
	handler.lua  migrations  schema.lua

然后在kong.conf配置文件中添加新开发的插件：

	plugins = bundled,http-rewrite   # Comma-separated list of plugins this node
	                                 # should load. By default, only plugins
	                                 # bundled in official distributions are
	                                 # loaded via the `bundled` keyword.

在使用新插件之前，需要更新一下数据库：

	$ bash ./resty.sh kong/bin/kong  migrations up -c kong.conf
	migrating http-rewrite for database kong
	http-rewrite migrated up to: 2018-11-09_multiple_orgins
	1 migrations ran

否则会因为数据库不是最新的报出下面的错误：

	2018/11/13 16:54:57 [warn] 28677#28677: [lua] log.lua:63: log(): postgres database 'kong' is missing migration: (http-rewrite) 2018-11-09_multiple_orgins
	2018/11/13 16:54:57 [error] 28677#28677: init_by_lua error: /usr/share/lua/5.1/kong/init.lua:200: [postgres error] the current database schema does not match this version of Kong. Please run `kong migrations up` to update/initialize the database schema. Be aware that Kong migrations should only run from a single node, and that nodes running migrations concurrently will conflict with each other and might corrupt your database schema!
	stack traceback:
			[C]: in function 'assert'
			/usr/share/lua/5.1/kong/init.lua:200: in function 'init'
			init_by_lua:3: in main chunk

更新数据库之后，重新加载或者重启kong：

然后通过kong的管理接口查询，可以看到可用的插件中有新添加的`http-rewrite`：

	[root@localhost kong-proxy]# curl 127.0.0.1:8001/plugins/enabled 2>/dev/null |python -m json.tool
	{
	    "enabled_plugins": [
	        "response-transformer",
	        "http-rewrite",
	...

### 使用新添加的插件

在Kubernetes中创建下的crd，然后将其绑定到service、route或者consumer即可：

```yaml
	apiVersion: configuration.konghq.com/v1
	kind: KongPlugin
	metadata:
	  name: echo-http-rewrite
	  namespace: demo-echo
	disabled: false  # optional
	plugin: http-rewrite
	config:                            # 参照：http://nginx.org/en/docs/http/ngx_http_rewrite_module.html#rewrite
	  regex: "^/abc(.*)"               # nginx的正则表达式，匹配URI
	  replacement: "/redirect/$1"      # 可以使用捕获
	  flag: "permanent"                # 当前只支持permanent(301)和redirect(302)
```

## 参考

1. [Web开发平台OpenResty（四）：项目开发中常用的操作][1]
2. [Nginx: Alphabetical index of variables][2]
3. [Nginx API for Lua][3]
4. [API网关Kong（七）：Kong数据平面Plugin的调用与实现][4]
5. [Lua 5.1 Reference Manual][5]
6. [API网关Kong（六）：Kong数据平面的实现分析: 数据库表的创建][6]
7. [API网关Kong（六）：Kong数据平面的实现分析: kong/dao: DAOFactory.new()][7]
8. [API网关Kong（六）：Kong数据平面的实现分析: plugin的加载和初始化][8]
9. [API网关Kong（七）：Kong数据平面Plugin的调用与实现][9]
10. [API网关Kong（七）：Kong数据平面Plugin的调用与实现: 插件的调用过程：以Kong.ssl_certificate()为例][10]

[1]: https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/11/09/openresty-study-04-development.html "Web开发平台OpenResty（四）：项目开发中常用的操作"
[2]: http://nginx.org/en/docs/varindex.html "Nginx: Alphabetical index of variables"
[3]: https://github.com/openresty/lua-nginx-module#nginx-api-for-lua "Nginx API for Lua"
[4]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-04-plugins-implement.html "API网关Kong（七）：Kong数据平面Plugin的调用与实现"
[5]: https://www.lua.org/manual/5.1/ "Lua 5.1 Reference Manual "
[6]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-03-data-plane-implement.html#%E6%95%B0%E6%8D%AE%E5%BA%93%E8%A1%A8%E7%9A%84%E5%88%9B%E5%BB%BA "API网关Kong（六）：Kong数据平面的实现分析: 数据库表的创建"
[7]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-03-data-plane-implement.html#kongdao-daofactorynew "API网关Kong（六）：Kong数据平面的实现分析: kong/dao: DAOFactory.new()"
[8]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-03-data-plane-implement.html#plugin%E7%9A%84%E5%8A%A0%E8%BD%BD%E5%92%8C%E5%88%9D%E5%A7%8B%E5%8C%96 "API网关Kong（六）：Kong数据平面的实现分析: plugin的加载和初始化"
[9]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-04-plugins-implement.html "API网关Kong（七）：Kong数据平面Plugin的调用与实现"
[10]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-04-plugins-implement.html#%E6%8F%92%E4%BB%B6%E7%9A%84%E8%B0%83%E7%94%A8%E8%BF%87%E7%A8%8B%E4%BB%A5kongssl_certificate%E4%B8%BA%E4%BE%8B "API网关Kong（七）：Kong数据平面Plugin的调用与实现: 插件的调用过程：以Kong.ssl_certificate()为例"
