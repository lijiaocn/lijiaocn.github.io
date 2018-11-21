---
layout: default
title:  API网关Kong使用教程（六）：Kong数据平面的事件、初始化与插件加载
author: 李佶澳
createdate: 2018/10/22 15:07:00
changedate: 2018/10/22 15:07:00
categories: 项目
tags: 视频教程 kong 
keywords: kong,apigateway,API网关
description:  在试验Kong的安全插件时，发现不起作用，需要分析一下Kong的数据平面的实现

---

* auto-gen TOC:
{:toc}

## 说明

这是[API网关Kong的系列教程](https://www.lijiaocn.com/tags/class.html)中的一篇，使用过程中遇到的问题和解决方法记录在[API网关Kong的使用过程中遇到的问题以及解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/09/30/kong-usage-problem-and-solution.html)。

在试验Kong的安全插件时，需要了解一下Kong的数据平面的实现。

Kong-Ingress-Controller的版本是0.2.0，Kong的版本是0.14.1，是用下面的方式部署的：

./kubectl.sh create -f https://raw.githubusercontent.com/introclass/kubernetes-yamls/master/all-in-one/kong-all-in-one.yaml

## kong-proxy容器的启动

### nginx启动前

数据平面的kong-proxy使用的镜像是`kong:0.14.1-centos`，镜像的Cmd是`kong docker-start`：

```bash
$ docker inspect kong:0.14.1-centos
...
        "Cmd": [
            "/bin/sh",
            "-c",
            "#(nop) ",
            "CMD [\"kong\" \"docker-start\"]"
...
```

entrypoint是：

```json
        "Entrypoint": [
            "/docker-entrypoint.sh"
        ],
```

在容器内找到`docker-entrypoint.sh`：

```bash
sh-4.2# cat docker-entrypoint.sh
#!/bin/sh
set -e

export KONG_NGINX_DAEMON=off

if [[ "$1" == "kong" ]]; then
  PREFIX=${KONG_PREFIX:=/usr/local/kong}
  mkdir -p $PREFIX

  if [[ "$2" == "docker-start" ]]; then
    kong prepare -p $PREFIX

    exec /usr/local/openresty/nginx/sbin/nginx \
      -p $PREFIX \
      -c nginx.conf
  fi
fi

exec "$@"
```

docker-entrypoint.sh中的`kong prepare -p /usr/local/kong`命令，会在/usr/local/kong目录中创建nginx.conf等nginx配置文件：

```bash
$ kong prepare -h
Usage: kong prepare [OPTIONS]

Prepare the Kong prefix in the configured prefix directory. This command can
be used to start Kong from the nginx binary without using the 'kong start'
command.
```

然后直接启动nginx，使用`kong prepare`创建的nginx.conf：

```bash
    exec /usr/local/openresty/nginx/sbin/nginx \
      -p $PREFIX \
      -c nginx.conf
```

`-p`是指定路径前缀：

	-p prefix     : set prefix path (default: /usr/local/openresty/nginx/)

替换掉变量后，命令如下：

	/usr/local/openresty/nginx/sbin/nginx -p /usr/local/kong -c nginx.conf

### nginx启动

nginx启动时加载的配置文件是`/usr/local/kong/nginx.conf`：

```bash
$ cat nginx.conf
worker_processes auto;
daemon off;

pid pids/nginx.pid;
error_log /dev/stderr notice;

worker_rlimit_nofile 65536;

events {
    worker_connections 16384;
    multi_accept on;
}

http {
    include 'nginx-kong.conf';
}
```

可以看到nginx.conf会继续加载配置文件`nginx-kong.conf`。

nginx-kong.conf包含多个lua_XXX、XXX_lua_block样式的指令，加载了名为kong的lua模块：

```lua
...
lua_package_path './?.lua;./?/init.lua;;;';
lua_package_cpath ';;';
lua_socket_pool_size 30;
lua_max_running_timers 4096;
lua_max_pending_timers 16384;
lua_shared_dict kong                5m;
lua_shared_dict kong_db_cache       128m;
lua_shared_dict kong_db_cache_miss 12m;
lua_shared_dict kong_locks          8m;
lua_shared_dict kong_process_events 5m;
lua_shared_dict kong_cluster_events 5m;
lua_shared_dict kong_healthchecks   5m;
lua_shared_dict kong_rate_limiting_counters 12m;
lua_socket_log_errors off;

# injected nginx_http_* directives
lua_shared_dict prometheus_metrics 5m;

...
init_by_lua_block {
    Kong = require 'kong'
    Kong.init()
}
init_worker_by_lua_block {
    Kong.init_worker()
}
```

并且在upstream、server、location等配置中直接调用kong模块中的方法：

```bash
upstream kong_upstream {
    server 0.0.0.1;
    balancer_by_lua_block {
        Kong.balancer()
    }
    ...
}
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
    location = /kong_error_handler {
        ...
        content_by_lua_block {
            Kong.handle_error()
        }
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
}
```

上面是只开启了kong的数据平面功能的时候生成的配置文件，如果开启了admin管理平面，还会多一个server：

```bash
server {
    server_name kong_admin;
    listen 0.0.0.0:8001;

    access_log /dev/stdout;
    error_log /dev/stderr notice;

    client_max_body_size 10m;
    client_body_buffer_size 10m;


    # injected nginx_admin_* directives

    location / {
        default_type application/json;
        content_by_lua_block {
            Kong.serve_admin_api()
        }
    }

    location /nginx_status {
        internal;
        access_log off;
        stub_status;
    }

    location /robots.txt {
        return 200 'User-agent: *\nDisallow: /';
    }
}
```


## kong的实现

要了解nginx-kong.conf中名为kong的lua模块的实现，必须先了解OpenResty：

```bash
...
init_by_lua_block {
    Kong = require 'kong'
    Kong.init()
}
init_worker_by_lua_block {
    Kong.init_worker()
}
```

OpenResty是一个Web应用开发平台，Kong是一个OpenResty应用，OpenResty的内容参考：[Web开发平台OpenResty（一)：学习资料与基本结构][2]

OpenResty的应用开发使用的语言是Lua，因此还需要了解一下Lua，Lua的内容参考：[编程语言（一）：Lua介绍、入门学习资料、基本语法与项目管理工具][1]。

此外，Kong还可以用`kong`命令启动：

	./bin/kong start -c ./kong.conf

`kong`命令是一个用resty执行的脚本，内容如下：

```lua
#!/usr/bin/env resty

require "luarocks.loader"

package.path = "./?.lua;./?/init.lua;" .. package.path

require("kong.cmd.init")(arg)
```

## kong的事件机制

这里分析的源代码版本是0.14.1：

	git checkout 0.14.1

梳理清楚kong内部的事件处理过程，基本就搞清楚了它的整个运作过程。

Kong的事件处理有两套，分别是worker_events和cluster_events，在Kong.init_worker()中定义：

```lua
-- kong/kong/init.lua
function Kong.init_worker()
    kong_global.set_phase(kong, PHASES.init_worker)
    ...
    local worker_events = require "resty.worker.events"
    ...
    local cluster_events, err = kong_cluster_events.new {
      dao                     = kong.dao,
      poll_interval           = kong.configuration.db_update_frequency,
      poll_offset             = kong.configuration.db_update_propagation,
    }
```

### worker_events

worker_events使用的是resty的实现：

```lua
-- kong/kong/init.lua
function Kong.init_worker()
    kong_global.set_phase(kong, PHASES.init_worker)
    ...
    local worker_events = require "resty.worker.events"
```

它被记录到了cache、db、dao中：

```lua
-- kong/kong/init.lua
function Kong.init_worker()
    local cache, err = kong_cache.new {
      ...
      worker_events     = worker_events,
      ...
    
    singletons.worker_events  = worker_events
    kong.worker_events = worker_events
    kong.db:set_events_handler(worker_events)
    kong.dao:set_events_handler(worker_events)
...
```

#### worker_events的handler

在runloop.init_worker.before()中，向worker_events注册了事件的handler：

```lua
-- kong/kong/init.lua
function Kong.init_worker()
...
    runloop.init_worker.before()
...
```

注册的事件的mode和source如下：

```lua
-- kong/runloop/handler.lua
init_worker = {
    before = function()
      ...
      local worker_events  = singletons.worker_events
      ...
      worker_events.register(function(data)
      ...
      end, "dao:crud")               
      ...
      end, "crud", "apis") 
      ...
      end, "crud", "routes")
      ...
      end, "crud", "services")
      ...
      end, "crud", "snis")
      ...
      end, "crud", "certificates")
      ...
      end, "crud", "targets")
      ...
      end, "balancer", "targets")
      ...
      end, "crud", "upstreams")
      ...
      end, "balancer", "upstreams")
      ...
```

#### worker_event的事件来源1: "dao:crud"二次抛出

在init_worker.before()中，注册的"dao:crud"对应的handler，作用是根据data中的schema和operation，向"crud"的对应"source"抛出事件：

```lua
init_worker = {
    before = function()
      reports.init_worker()
      ...
      worker_events.register(function(data)
        ...
        local entity_channel           = data.schema.table or data.schema.name
        local entity_operation_channel = fmt("%s:%s", data.schema.table,
                                             data.operation)

        local _ , err = worker_events.post_local("crud", entity_channel, data)
        ...
        _ , err = worker_events.post_local("crud", entity_operation_channel, data)
        ...
```

接受抛出事件的"crud"模式中的handler，执行的操作大多都是清除cache：

```lua
      worker_events.register(function()
        log(DEBUG, "[events] Route updated, invalidating router")
        cache:invalidate("router:version")
      end, "crud", "routes")
```

"dao:crud"只是将收到的事件二次抛出，不是事件最开始的来源，事件最初来自于Dao。

#### worker_event的事件来源2：Dao产生的最初事件

Dao是对数据操作的封装，在`kong/db/`和`kong/dao`中实现，看代码中的意思，最开始用的是`kong/dao`，后来开发了`kong/db`，但是`kong/db`没有完全替换掉`kong/dao`，在0.14.1中，还是两者共存。

后面的“数据库操作封装”章节，分析了kong/db和kong/dao的实现，而用到kong/db和kong/dao的是kong的Admin API，在“管理API的启动”做了分析。

管理API收到请求之后，会调用Kong.db或者Kong.daos中dao对象的方法，完成对数据库的操作，而在dao实现的操作方法中，对数据库操作成功之后，都会抛出一个事件，例如：

```lua
--kong/db/dao/init.lua
function DAO:insert(entity, options)
  ...
  local entity_to_insert, err = self.schema:process_auto_fields(entity, "insert")
  ...
  local row, err_t = self.strategy:insert(entity_to_insert)
  ...
  row, err, err_t = self:row_to_entity(row, options)
  ...
    self:post_crud_event("create", row)
```

这个事件是最初的事件，它会被init_worker.before()中设置的handler接收，产生后续的事件。

worker_events是在kong/init.lua中传递给db和dao的：

```lua
--kong/init.lua
function Kong.init_worker()
  ...
  kong.db:set_events_handler(worker_events)
  kong.dao:set_events_handler(worker_events)
...
```

### cluster_event

cluster_event是被记录在数据库中、被所有的kong实例监控的事件。每个kong都监控数据表`cluster_events`中的记录，获得事件并处理：

```bash
kong=# \d public.cluster_events
          Table "public.cluster_events"
  Column   |           Type           | Modifiers
-----------+--------------------------+-----------
 id        | uuid                     | not null
 node_id   | uuid                     | not null
 at        | timestamp with time zone | not null
 nbf       | timestamp with time zone |
 expire_at | timestamp with time zone | not null
 channel   | text                     |
 data      | text                     |
Indexes:
    "cluster_events_pkey" PRIMARY KEY, btree (id)
    "idx_cluster_events_at" btree (at)
    "idx_cluster_events_channel" btree (channel)
Triggers:
    delete_expired_cluster_events_trigger AFTER INSERT ON cluster_events FOR EAC
H STATEMENT EXECUTE PROCEDURE delete_expired_cluster_events()
```

相当于实现了一个发布、订阅系统：

```lua
--kong/init.lua
function Kong.init_worker()
  ...
  local cluster_events, err = kong_cluster_events.new {
    dao                     = kong.dao,
    poll_interval           = kong.configuration.db_update_frequency,
    poll_offset             = kong.configuration.db_update_propagation,
  }

  local cache, err = kong_cache.new {
    cluster_events    = cluster_events,
  ...
  singletons.cluster_events = cluster_events
  ...
  kong.cluster_events = cluster_events
  ...
```

## plugin的加载和初始化

要加载的插件名单是从配置中读取的，默认配置文件是prefix目录中的`.kong_env`文件：

```lua
-- kong/init.lua
function Kong.init()
  ...
  local conf_loader = require "kong.conf_loader"
  ...
  local conf_path = pl_path.join(ngx.config.prefix(), ".kong_env")
  local config = assert(conf_loader(conf_path))
```

配置文件加载在`kong/conf_loader.lua`中实现的，plugins为`bundled`时，加载`constants.BUNDLED_PLUGINS`中的插件，和配置参数custom_plugins指定的插件：

```lua
-- kong/conf_loader.lua
local function load(path, custom_conf)
...
  do
    local plugins = {}
    if #conf.plugins > 0 and conf.plugins[1] ~= "off" then
      for i = 1, #conf.plugins do
          ...
          if plugin_name == "bundled" then
            plugins = tablex.merge(constants.BUNDLED_PLUGINS, plugins, true)
          else
            plugins[plugin_name] = true
      ...

    if conf.custom_plugins and #conf.custom_plugins > 0 then
      ...
      for i = 1, #conf.custom_plugins do
        local plugin_name = pl_stringx.strip(conf.custom_plugins[i])
        ...
        plugins[plugin_name] = true
      end
    end

    conf.loaded_plugins = setmetatable(plugins, {
      __tostring = function() return "" end,
    })
  end
```

插件在配置文件kong.conf中配置，可以用“,”间隔，指定多个：

```bash
#plugins = bundled               # Comma-separated list of plugins this node
                                 # should load. By default, only plugins
                                 # bundled in official distributions are
                                 # loaded via the `bundled` keyword.
```

bundled插件都有以下这些：

```lua
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

然后在kong/init.lua的Kong.init()中加载已经保存到config的loaded_plugins，并将dao一同传入(用来查询中数据库中已经使用的插件，如果插件在数据库存在，但kong没有启用， 报错)：

```lua
-- kong/init.lua
local loaded_plugins
...
function Kong.init() 
...
loaded_plugins = assert(load_plugins(config, dao)) 

插件的加载过程，就是加载每个插件中的handler和schema，并按照优先级排序：

--kong/conf_loader.lua
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
  -- sort plugins by order of execution
  table.sort(sorted_plugins, function(a, b)
    local priority_a = a.handler.PRIORITY or 0
    local priority_b = b.handler.PRIORITY or 0
    return priority_a > priority_b
  end)
   ...
return sorted_plugins
```

排序后的插件返回列表存放在`loaded_plugins`中;，在Kong.init_worker()中调用插件各自的handler:init_worker()完成初始化：

```lua
function Kong.init_worker()
  kong_global.set_phase(kong, PHASES.init_worker)
  ...
  for _ , plugin in ipairs(loaded_plugins) do
    kong_global.set_namespaced_log(kong, plugin.name)

    plugin.handler:init_worker()
  end
```

插件工作过程单独开个页面记录一下，这里略过不表。

## 数据库表的创建

在`kong/cmd/start.lua`中实现，创建了一个db和一个dao，如果使用参数`migrations`，调用dao的方法创建数据库：

```lua
-- kong/cmd/start.lua
local DB = require "kong.db"
local DAOFactory = require "kong.dao.factory"
...
local function execute(args)
  local db = assert(DB.new(conf))
  assert(db:init_connector())
  local dao = assert(DAOFactory.new(conf, db))
  local ok, err_t = dao:init()
  ...
  -- 调用dao的方法创建数据库
    if args.run_migrations then
      assert(dao:run_migrations())
    end
  ...
```

db和dao是kong中操作数据库的基本方式，它们的创建过程中，加载数据库表的信息和操作方法，在另一个入口Kong.init()中也有创建，后面章节分析。

`run_migrations()`在`kong/dao/factory.lua`中实现:

```lua
-- kong/dao/factory.lua
function _M:run_migrations(on_migrate, on_success)
  ...
  local migrations_modules, err = self:migrations_modules()
  ...
  local ok, err, migrations_ran = migrate(self, "core", migrations_modules, cur_migrations, on_migrate, on_success)
  ...
  for identifier in pairs(migrations_modules) do
    if identifier ~= "core" then
      local ok, err, n_ran = migrate(self, identifier, migrations_modules, cur_migrations, on_migrate, on_success)
        ...  
        migrations_ran = migrations_ran + n_ran
  ...
```

函数migrations_modules()返回的migrations_modules，一部分来自`kong/dao/migrations/`目录，一部分来自于每个插件的`migrations`目录：

```lua
-- kong/dao/factory.lua
function _M:migrations_modules()
  ...
  local migrations = {
    core = require("kong.dao.migrations." .. self.db_type)
  }
  ...
  for plugin_name in pairs(self.plugin_names) do
    local ok, plugin_mig = utils.load_module_if_exists("kong.plugins." .. plugin_name .. ".migrations." .. self.db_type)
    if ok then
      migrations[plugin_name] = plugin_mig
  ...
```

migrations_modules中记录了每个数据表的创建方式、销毁方式，以及一些设置操作，`kong/dao/migrations`目录中modules和插件目录中的modules格式相同。

例如`kong/dao/migrations/postgres.lua`:

```lua
-- kong/dao/migrations/postgres.lua:
local utils = require "kong.tools.utils"
return {
  {
    name = "2015-01-12-175310_skeleton",
    up = function(db, properties)
      return db:queries [[
        CREATE TABLE IF NOT EXISTS schema_migrations(
          id text PRIMARY KEY,
          migrations varchar(100)[]
        );
      ]]
    end,
    down = [[
      DROP TABLE schema_migrations;
    ]]
  },
  ...
```

和插件`kong/plugins/acl/migrations/postgres.lua`中的内容，结构是一致的：

```lua
--kong/plugins/acl/migrations/postgres.lua中
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

## 数据库操作封装

和数据库相关的模块有两个`kong/db`和`kong/dao`。

```lua
function Kong.init()
  ...
  -- 创建DB，初始化连接
  local db = assert(DB.new(config))
  assert(db:init_connector())
  ...
  -- 通过前面创建的DB，创建DAO
  local dao = assert(DAOFactory.new(config, db)) -- instantiate long-lived DAO
  ...
  -- DAO初始化
  local ok, err_t = dao:init()
  ...
  assert(dao:are_migrations_uptodate())
  ...
  -- DB和DAO保存到全局变量中
  kong.dao = dao
  kong.db = db
  ...
```

kong/db中有一个目录也叫dao：`kong/db/dao`。怀疑kong/dao是早先的实现，kong/db/dao是最新的实现。

通过kong/db创建的db对象会被保存到通过kong/dao创建的dao对象的db.new_db成员中，根据名字判断，通过kong/db创建的db对于通过kong/dao创建的dao对象来说，是一个新的db。

### kong/db：DB.new()

`kong/db`用来初始化数据库连接器(connector)，strategy是数据库类型，并生成核心Schema的DAO：

```lua
-- kong/db/init.lua
function DB.new(kong_config, strategy)
  ...
  local schemas = {}
  ...
  -- 加载schemas，后面说明
  ...
  -- 连接数据库
  local connector, strategies, err = Strategies.new(kong_config, strategy, schemas, errors)
  ...
  local daos = {}
  -- 连接器保存在这里
  local self   = {
    daos       = daos,       -- each of those has the connector singleton
    strategies = strategies,
    connector  = connector,
    strategy   = strategy,
  }
  ...
  do
    for _ , schema in pairs(schemas) do
      local strategy = strategies[schema.name]
      ...
      daos[schema.name] = DAO.new(self, schema, strategy, errors)
    end
  end
```

schemas中记录的是entity，创建DB的时候加载的entity记录在变量CORE_ENTITIES中：

```lua
-- kong/db/init.lua
function DB.new(kong_config, strategy)
  ...
  local schemas = {}
  ...
   do
    for _ , entity_name in ipairs(CORE_ENTITIES) do
      local entity_schema = require("kong.db.schema.entities." .. entity_name)
      ...
      schemas[entity_name] = Entity.new(entity_schema)
      end
   end
```

CORE_ENTITIES中包括以下Entity，它们都位于`kong/db/schema/entities`目录中：

```lua
local CORE_ENTITIES = {
  "consumers",
  "routes",
  "services",
  "certificates",
  "snis",
}
```

`Entity.New()`里面保存的是数据库表的完整定义, 创建entity的过程略复杂，下一节会专门分析。

这里创建的这些entity，被用来创建dao：

```lua
-- kong/db/init.lua
function DB.new(kong_config, strategy)
  ...
  local self   = {
    daos       = daos,       -- each of those has the connector singleton
    ...
  }
  do
    for _ , schema in pairs(schemas) do
      local strategy = strategies[schema.name]
      ...
      daos[schema.name] = DAO.new(self, schema, strategy, errors)
    end
  end
  ...
```

通过schemas中的entity创建的dao，都保存在DB对象的daos中（self.daos），key就是每个entity的名字，也就是每个表的名字。

使用数据库的时候，比如说要操作数据库中的plugins表，是用`db.plugins`的样式获取表的。

db自定义了元方法，在用db.plugins的方式引用名为plugins的变量时，如果db中没有plugins成员，就使用daos中的plugins。

DAO的对象的创建过程，后面单独分析。

#### kong/db中Entity的加载：Entity.New()

Entity是用kong/db/schema/entity.lua中的`Entity.new()`创建的，参数entity_schema是从`kong/db/schema/entities`中加载的Entity：

```lua
-- kong/db/init.lua
function DB.new(kong_config, strategy)
   ...
   local Entity       = require "kong.db.schema.entity"
      ...
   do
    for _ , entity_name in ipairs(CORE_ENTITIES) do
      -- 加载目录下同名模块
      local entity_schema = require("kong.db.schema.entities." .. entity_name)
      ...
      schemas[entity_name] = Entity.new(entity_schema)
      end
   end
```

kong/db/schema/entities中一共有下面几个entity：

```bash
$ tree kong/db/schema/entities
kong/db/schema/entities
├── certificates.lua
├── consumers.lua
├── routes.lua
├── services.lua
└── snis.lua
```


`Entity.new()`在kong/db/schema/entity.lua中定义，它调用kong/db/schema/init.lua中的`Schema.new()`创建schema对象，参数definition是继续传递下来的Entity：

```lua
-- kong/db/schema/entity.lua
...
local Schema = require("kong.db.schema")
...
function Entity.new(definition)
...
  -- definition是kong/db/schema/entities/中的模块返回的entity
  local self, err = Schema.new(definition)
```

`Schema.new()`的加载过程就是把传递下来的entity复制一份，并且给复制到自身的fileds中的成员，添加了名称索引：

```lua
-- kong/db/schema/init.lua
...
function Schema.new(definition)
  ...
  -- definition是kong/db/schema/entities/中的模块返回的entity
  local self = copy(definition)
  ...
  -- 将
  for key, field in self:each_field() do
    self.fields[key] = field
    if field.type == "foreign" then
      local err
      field.schema, err = get_foreign_schema_for_field(field)
      if not field.schema then
        return nil, err
      end
    end
  end
...
function Schema:each_field()
  local i = 1
  return function()
    local item = self.fields[i]
    if not self.fields[i] then
      return nil
    end
    local key = next(item)
    local field = item[key]
    i = i + 1
    return key, field
  end
end
```

以kong/db/schema/entities/router.lua为例，该模块返回的table如下：

```lua
--kong/db/schema/entities/router.lua
...
return {
  name        = "routes",
  primary_key = { "id" },

  fields = {
    { id             = typedefs.uuid, },
    { created_at     = { type = "integer", timestamp = true, auto = true }, },
    { updated_at     = { type = "integer", timestamp = true, auto = true }, },
    { protocols      = { type     = "set",
                         len_min  = 1,
                         required = true,
                         elements = typedefs.protocol,
                         default  = { "http", "https" },
                       }, },
  ...
  },

  entity_checks = {
    { at_least_one_of = {"methods", "hosts", "paths"} },
  },
}
```

可以看到每个fileds对应的就是数据库表中的一列。

因此Entity中存放的就是一个数据库表的元数据，它的fileds成员中存放的是数据库表的列定义，可以以列名为key读取。

如果是外键，在为filed生成名称索引时，还会加载外键对应的entity，保存在这个filed的schema成员中

```lua
-- kong/db/schema/init.lua
...
function Schema.new(definition)
  ...
  -- Also give access to fields by name
  for key, field in self:each_field() do
    self.fields[key] = field
    //如果是外键，加载外键对应的entity，保存在这个filed的schema成员中
    if field.type == "foreign" then
      local err
      field.schema, err = get_foreign_schema_for_field(field)
      if not field.schema then
        return nil, err
      end
    end
  end
```

Entity中保存了完整的数据表定义。

#### Entity的实现

Entity都在`kong/db/schema/entities`目录中实现，下面是consumers的实现，类似于数据表的定义：

```lua
local typedefs = require "kong.db.schema.typedefs"

return {
  name         = "consumers",
  primary_key  = { "id" },
  endpoint_key = "username",
  dao          = "kong.db.dao.consumers",

  fields = {
    { id             = typedefs.uuid, },
    { created_at     = { type = "integer", timestamp = true, auto = true }, },
    { username       = { type = "string",  unique = true }, },
    { custom_id      = { type = "string",  unique = true }, },
  },

  entity_checks = {
    { at_least_one_of = { "custom_id", "username" } },
  },
}
```

特别要注意的是，每个Entity的table中都有一个"dao"，它记录了Entity绑定的`kong/db/dao`中的模块：

```lua
-- kong/db/schema/entities/consumers.lua
  dao          = "kong.db.dao.consumers",
```

而`kong/db/dao`中的模块则实现了对数据库的操作。


#### kong/db中DAO对象的创建

kong/db在创建db的时候，会使用`kong/db/dao`为每个schema生成一个DAO：

```lua
-- kong/db/init.lua
function DB.new(kong_config, strategy)
  ...
  local schemas = {}
  ...
  local connector, strategies, err = Strategies.new(kong_config, strategy, schemas, errors)
  ...
  do
    for _ , schema in pairs(schemas) do
      local strategy = strategies[schema.name]
      ...
      -- 这里传入的schema就是前面创建的包含完整表定义的entity
      daos[schema.name] = DAO.new(self, schema, strategy, errors)
    end
  end
```

传给DAO.new()的schema是kong/db/schema/entities中的模块，每个entity的中都有一个"dao"成员，记录entity绑定的`kong/db/dao`中的模块，例如consumers绑定的dao是`kong.db.dao.consumers`：

```lua
-- kong/db/schema/entities/consumers.lua
...
return {
  name         = "consumers",
  primary_key  = { "id" },
  endpoint_key = "username",
  -- 关联的dao模块
  dao          = "kong.db.dao.consumers",

  fields = {
    { id             = typedefs.uuid, },
...
```

`kong/db/dao`中的`DAO.new()`在kong/db/dao/init.lua，首先将文件`kong/db/dao/init.lua`中DAO加到元表中：

```lua
-- kong/db/dao/init.lua
local DAO   = {}
DAO.__index = DAO
...
function _M.new(db, schema, strategy, errors)
  local fk_methods = generate_foreign_key_methods(schema)
  -- 设置元表DAO
  local super      = setmetatable(fk_methods, DAO)
  ...
  local self = {
    db       = db,
    schema   = schema,
    strategy = strategy,
    errors   = errors,
    super    = super,
  }
  ...
  -- 将包含了DAO的super设置为 __index
  return setmetatable(self, { __index = super })
end
```

DAO实现常用的数据操作：

```lua
-- kong/db/dao/init.lua
function DAO:truncate()
  return self.strategy:truncate()
end
function DAO:select(primary_key, options)
  ...
  return self:row_to_entity(row, options)
end
function DAO:insert(entity, options)
  ...
  self:post_crud_event("create", row)
  return row
end
...
```

这些方法可以直接通过DAO对象调用，

此外`kong/db/dao`中的`DAO.new()`，还将传入的entity中指定的`kong/db/dao`模块，和模块中的方法，以方法名为key导入到DAO对象中。

```lua
-- kong/db/dao/init.lua
function _M.new(db, schema, strategy, errors)
  ...
  local self = {
    db       = db,
    schema   = schema,
    strategy = strategy,
    errors   = errors,
    super    = super,
  }
  ...
  -- schema.dao是entity模块中指定的dao模块
  if schema.dao then
    local custom_dao = require(schema.dao)
    for name, method in pairs(custom_dao) do
      -- key是方法名
      self[name] = method
    end
  end

  return setmetatable(self, { __index = super })
end
```


因此，DAO对象中包含entity绑定的dao模块中的方法，也kong/db/dao/init.lua中实现的Dao方法，前者的优先级高于后者。

kong/db/schema/entities/consumers.lua绑定的kong/db/dao/consumers.lua中实现了下面这些方法：

```lua
-- kong/db/dao/consumers.lua
...
local _Consumers = {}
...
local function delete_cascade(self, table_name, fk)
...
local function delete_cascade_all(self, consumer_id)
...
function _Consumers:delete(primary_key)
...
```

#### kong/db/dao/init.lua操作数据库时抛出事件

`kong/db/dao/init.lua`中实现的、加载到DAO对象中的方法，在对数据库进行操作之后，会抛出事件：

```lua
--kong/db/dao/init.lua
function DAO:insert(entity, options)
  ...
  local entity_to_insert, err = self.schema:process_auto_fields(entity, "insert")
  ...
  local row, err_t = self.strategy:insert(entity_to_insert)
  ...
  row, err, err_t = self:row_to_entity(row, options)
  ...
    self:post_crud_event("create", row)
```

### kong/dao: DAOFactory.new()

`Kong.init()`函数中，除了创建db，还单独调用`DAOFactory.new()`创建Dao，并将创建的db作为参数传入：

```lua
-- kong/init.lua
local DAOFactory = require "kong.dao.factory"
...
function Kong.init()
  ...
  local db = assert(DB.new(config))
  assert(db:init_connector())
  -- 单独创建dao，传入的刚创建的db
  local dao = assert(DAOFactory.new(config, db)) -- instantiate long-lived DAO
  local ok, err_t = dao:init()
  ...
  assert(dao:are_migrations_uptodate())
  db.old_dao = dao
  -- 这里面加载插件相关内容，后面要单独分析
  loaded_plugins = assert(load_plugins(config, dao))
```

`DAOFactory.new()`中再次创建了一个db，而传入的db被保存到新建的db的new_db成员中。

```lua
-- kong/dao/factory.lua
local CORE_MODELS = {
  "apis",
  "plugins",
  "upstreams",
  "targets",
}

function _M.new(kong_config, new_db)
  ...
  local DB = require("kong.dao.db." .. self.db_type)
  local db, err = DB.new(kong_config)
  db.new_db = new_db
  self.db = db
  ...
```

然后又加载了一批entity：

```lua
-- kong/dao/factory.lua
local CORE_MODELS = {
  "apis",
  "plugins",
  "upstreams",
  "targets",
}
...
function _M.new(kong_config, new_db)
  ...
  for _ , m_name in ipairs(CORE_MODELS) do
    schemas[m_name] = require("kong.dao.schemas." .. m_name)
  end
  ...
```

和前面kong/db中加载的entity不同，dao加载的是kong/dao/schemas中的entity。 

除了CORE_MODELS，kong/dao还会加载每个插件中的daos.lua，将插件中的entity导入：

```lua
-- kong/dao/factory.lua
function _M.new(kong_config, new_db)
  ...
  for plugin_name in pairs(self.plugin_names) do
    -- 加载插件目录中的daos.lua
    local has_schema, plugin_schemas = utils.load_module_if_exists("kong.plugins." .. plugin_name .. ".daos")
    if has_schema then
      if plugin_schemas.tables then
        for _ , v in ipairs(plugin_schemas.tables) do
          -- 插件目录中daos.lua中的tables被导入到self.additional_tables
          table.insert(self.additional_tables, v)
        end
      else
        -- 如果没有tables，保存entity
        for k, v in pairs(plugin_schemas) do
          schemas[k] = v
        end
      end
    end
  end
  ...
```

这时候schemas中包含了kong/dao/schemas中的entity，和插件目录中daos.lua中的entity。

最后用load_daos()将为这些entity生成对应的DAO对象：

```lua
-- kong/dao/factory.lua
function _M.new(kong_config, new_db)
  ...
  load_daos(self, schemas, constraints)
  create_legacy_wrappers(self, constraints)
  ...
```

`load_daos()`中，用kong/dao/dao.lua创建每个entity的DAO对象：

```lua
-- kong/dao/factory.lua
...
local DAO = require "kong.dao.dao"
...
local function load_daos(self, schemas, constraints)
  ...
  for m_name, schema in pairs(schemas) do
    self.daos[m_name] = DAO(self.db, ModelFactory(schema), schema,
                            constraints[m_name])
  end
```

`kong/dao/dao.lua`中的`DAO:new()`比较简单，就是生成一个dao对象: 

```lua
-- kong/dao/dao.lua
function DAO:new(db, model_mt, schema, constraints)
  self.db = db
  self.model_mt = model_mt
  self.schema = schema
  self.table = schema.table
  self.constraints = constraints
end
```

关键是kong/dao/dao.lua中，还实现了DAO的很多方法，例如：

```lua
-- kong/dao/dao.lua
function DAO:insert(tbl, options)
...
function DAO:entity_cache_key(entity)
...
function DAO:find(tbl)
...
```

这里创建DAO对象时，传入的第二个参数`ModelFactory(schema)`，ModelFactory是在`kong/dao/model_factory.lua`中实现的，它的作用是设置元表。

```lua
-- kong/dao/model_factory.lua
...
return setmetatable({}, {
  __call = function(_, schema)
    local Model_mt = {}
    Model_mt.__meta = {
      __schema = schema,
      __name = schema.name,
      __table = schema.table
    }
...
```

总结一下，Kong.init()的时候，用kong/db中的方法创建了一个db，然后将这个db传给/kong/dao中DAOFactory.new()，创建了一个dao。在创建这个dao的过程中，又创建了一个db，传入的db被保存为new_db。dao的创建过程中，还加载了kong/dao/schemas目录中entity，和插件目录中的daos.lua。最后加载的所有entity生成了对应的DAO对象，这些DAO对象拥有find、insert等方法。

### kong/dao中dao的init()方法

Kong.init()中创建了dao之后，首先调用了它的init()方法：

```lua
-- kong/init.lua
local DAOFactory = require "kong.dao.factory"
...
function Kong.init()
  ...
  local dao = assert(DAOFactory.new(config, db)) -- instantiate long-lived DAO
  -- 调用dao:init()
  local ok, err_t = dao:init()
```

`dao:init()`调用`db.init()`，这个db是创建dao时，用kong/dao/db中的方法创建的db，和kong/db不同。

```lua
-- kong/dao/factory.lua
function _M:init()
  local ok, err = self.db:init()
...
```

db来自于`kong.dao.db.数据库类型`，下面是创建db时的代码：

```lua
-- kong/dao/factory.lua
function _M.new(kong_config, new_db)
  ...
  local DB = require("kong.dao.db." .. self.db_type)
  local db, err = DB.new(kong_config)
  if not db then
    return ret_error_string(self.db_type, nil, err)
  end

  db.new_db = new_db
  self.db = db
```

`kong/dao/db/`是支持的多种数据库，它们分别实现了自己的init()，进行一些初始化，以postgres为例：

```lua
-- kong/dao/db/postgres.lua
function _M:init()
  local res, err = self:query("SHOW server_version;")
  ...
  if #res < 1 or not res[1].server_version then
    return nil, Errors.db("could not retrieve server_version")
  end
  ...
```

## 管理API的启动

如果只是开启了admin管理平面，nginx-kong.conf中还会多一个server：

```bash
server {
    server_name kong_admin;
    listen 0.0.0.0:8001;

    access_log /dev/stdout;
    error_log /dev/stderr notice;

    client_max_body_size 10m;
    client_body_buffer_size 10m;


    # injected nginx_admin_ * directives

    location / {
        default_type application/json;
        content_by_lua_block {
            Kong.serve_admin_api()
        }
    }

    location /nginx_status {
        internal;
        access_log off;
        stub_status;
    }

    location /robots.txt {
        return 200 'User-agent: *\nDisallow: /';
    }
}
```

`Kong.serve_admin_api()`在`kong/init.lua`中实现：

```lua
function Kong.serve_admin_api(options)
  options = options or {}

  header["Access-Control-Allow-Origin"] = options.allow_origin or "*"

  if ngx.req.get_method() == "OPTIONS" then
    header["Access-Control-Allow-Methods"] = "GET, HEAD, PUT, PATCH, POST, DELETE"
    header["Access-Control-Allow-Headers"] = "Content-Type"

    return ngx.exit(204)
  end

  return lapis.serve("kong.api")
end
```

kong的admin api使用了[kong/lapis][3]框架。`kong/api/init.lua`中创建了应用，绑定了`kong/api/routes`目录中的路由：

```lua
local app = lapis.Application()
...
-- Load core routes
for _ , v in ipairs({"kong", "apis", "consumers", "plugins", "cache", "upstreams"}) do
  local routes = require("kong.api.routes." .. v)
  attach_routes(routes)
end
...
do
  local routes = {}

  for _ , dao in pairs(singletons.db.daos) do
    routes = Endpoints.new(dao.schema, routes)
  end
  ...
  for _ , dao in pairs(singletons.db.daos) do
    local schema = dao.schema
    local ok, custom_endpoints = utils.load_module_if_exists("kong.api.routes." .. schema.name)
    ...
       for route_pattern, verbs in pairs(custom_endpoints) do
          ...
          routes[route_pattern]["methods"][verb] = function(self, db, helpers)
          ...
 attach_new_db_routes(routes)
```

在`attach_routers()`和`attach_new_db_routes()`中，分别将`Kong.init()`中创建的`dao`和`db`传给处理请求的方法：

```lua
local function attach_routes(routes)
        ...   
        return method_handler(self, singletons.dao, handler_helpers)
        ...

local function attach_new_db_routes(routes)
        ...
        return method_handler(self, singletons.db, handler_helpers)
        ...
```

### API Handler 以及数据库操作

以`kong/api/routes/consumers.lua`为例，一个handler如下：

```lua
  ["/consumers/:consumers/plugins"] = {
    before = function(self, dao_factory, helpers)
      self.params.username_or_id = ngx.unescape_uri(self.params.consumers)
      self.params.consumers = nil
      crud.find_consumer_by_username_or_id(self, dao_factory, helpers)
      self.params.consumer_id = self.consumer.id
    end,

    GET = function(self, dao_factory)
      crud.paginated_set(self, dao_factory.plugins)
    end,

    POST = function(self, dao_factory)
      crud.post(self.params, dao_factory.plugins)
    end,

    PUT = function(self, dao_factory)
      crud.put(self.params, dao_factory.plugins)
    end
  },
```


`POST`方法是创建指定用户的指定插件，使用`kong/api/crud_helpers.lua`中的post()方法：

```lua
function _M.post(params, dao_collection, post_process)
...
  local data, err = dao_collection:insert(params)
...
```

consumer是在`kong/db/`中实现的，这里dao_collection:update应该是`db.plugins.:update`

在`db/init.lua`中，设置了`__index`，plugins会从db.daos中获取：

```lua
local DB = {}
DB.__index = function(self, k)
  return DB[k] or rawget(self, "daos")[k]
end
```

rawget (table, index)，是lua的内置函数：

	Gets the real value of table[index], without invoking the __index metamethod. table must be a table; index may be any value

因此前面调用的`dao_collection:update()`是名为plugins的dao对象中的函数。

## 参考

1. [编程语言（一）：Lua介绍、入门学习资料、基本语法与项目管理工具][1]
2. [Web开发平台OpenResty（一)：学习资料与基本结构][2]
3. [kong/lapis][3]

[1]: https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/10/22/language-lua-study.html "编程语言（一）：Lua介绍、入门学习资料、基本语法与项目管理工具"
[2]: https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/10/25/platform-openresty-study.html "Web开发平台OpenResty（一)：学习资料与基本结构"
[3]: https://github.com/Kong/lapis "kong/lapis"
