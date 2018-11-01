---
layout: default
title:  API网关Kong（六）：Kong数据平面的实现分析
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

	$ docker inspect kong:0.14.1-centos
	...
	        "Cmd": [
	            "/bin/sh",
	            "-c",
	            "#(nop) ",
	            "CMD [\"kong\" \"docker-start\"]"
	...

entrypoint是：

	        "Entrypoint": [
	            "/docker-entrypoint.sh"
	        ],

在容器内找到`docker-entrypoint.sh`：

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

docker-entrypoint.sh中的`kong prepare -p /usr/local/kong`命令，会在/usr/local/kong目录中创建nginx.conf等nginx配置文件：

	$ kong prepare -h
	Usage: kong prepare [OPTIONS]

	Prepare the Kong prefix in the configured prefix directory. This command can
	be used to start Kong from the nginx binary without using the 'kong start'
	command.

然后直接启动nginx，使用`kong prepare`创建的nginx.conf：

	    exec /usr/local/openresty/nginx/sbin/nginx \
	      -p $PREFIX \
	      -c nginx.conf

`-p`是指定路径前缀：

	-p prefix     : set prefix path (default: /usr/local/openresty/nginx/)

替换掉变量后，命令如下：

	/usr/local/openresty/nginx/sbin/nginx -p /usr/local/kong -c nginx.conf

### nginx启动

nginx启动时加载的配置文件是`/usr/local/kong/nginx.conf`：

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

可以看到nginx.conf会继续加载配置文件`nginx-kong.conf`。

nginx-kong.conf包含多个lua_XXX、XXX_lua_block样式的指令，加载了名为kong的lua模块：

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

并且在upstream、server、location等配置中直接调用kong模块中的方法：

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

上面是只开启了kong的数据平面功能的时候生成的配置文件，如果开启了admin管理平面，还会多一个server：

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


## kong的实现

要了解nginx-kong.conf中名为kong的lua模块的实现，必须先了解OpenResty：

	...
	init_by_lua_block {
	    Kong = require 'kong'
	    Kong.init()
	}
	init_worker_by_lua_block {
	    Kong.init_worker()
	}

OpenResty是一个Web应用开发平台，Kong是一个OpenResty应用，OpenResty的内容参考：[Web开发平台OpenResty（一)：学习资料与基本结构][2]

OpenResty的应用开发使用的语言是Lua，因此还需要了解一下Lua，Lua的内容参考：[编程语言（一）：Lua介绍、入门学习资料、基本语法与项目管理工具][1]。

此外，Kong还可以用`kong`命令启动：

	./bin/kong start -c ./kong.conf

`kong`命令是一个用resty执行的脚本，内容如下：

	#!/usr/bin/env resty
	
	require "luarocks.loader"
	
	package.path = "./?.lua;./?/init.lua;" .. package.path
	
	require("kong.cmd.init")(arg)

## kong的事件机制

这里分析的源代码版本是0.14.1：

	git checkout 0.14.1

梳理清楚kong内部的事件处理过程，基本就搞清楚了它的整个运作过程。

Kong的事件处理有两套，分别是worker_events和cluster_events，在Kong.init_worker()中定义：

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

### worker_events

worker_events使用的是resty的实现：

	-- kong/kong/init.lua
	function Kong.init_worker()
	    kong_global.set_phase(kong, PHASES.init_worker)
	    ...
	    local worker_events = require "resty.worker.events"

它被记录到了cache、db、dao中：

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

#### worker_events的handler

在runloop.init_worker.before()中，向worker_events注册了事件的handler：

	-- kong/kong/init.lua
	function Kong.init_worker()
	...
	    runloop.init_worker.before()
	...

注册的事件的mode和source如下：

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

#### worker_event的事件来源1: "dao:crud"二次抛出

在init_worker.before()中，注册的"dao:crud"对应的handler，作用是根据data中的schema和operation，向"crud"的对应"source"抛出事件：

	init_worker = {
	    before = function()
	      reports.init_worker()
	      ...
	      worker_events.register(function(data)
	        ...
	        local entity_channel           = data.schema.table or data.schema.name
	        local entity_operation_channel = fmt("%s:%s", data.schema.table,
	                                             data.operation)
	
	        local _, err = worker_events.post_local("crud", entity_channel, data)
	        ...
	        _, err = worker_events.post_local("crud", entity_operation_channel, data)
	        ...

接受抛出事件的"crud"模式中的handler，执行的操作大多都是清除cache：

	      worker_events.register(function()
	        log(DEBUG, "[events] Route updated, invalidating router")
	        cache:invalidate("router:version")
	      end, "crud", "routes")

"dao:crud"只是将收到的事件二次抛出，不是事件最开始的来源，事件最初来自于Dao。

#### worker_event的事件来源2：Dao产生的最初事件

Dao是对数据操作的封装，在`kong/db/`和`kong/dao`中实现，看代码中的意思，最开始用的是`kong/dao`，后来开发了`kong/db`，但是`kong/db`没有完全替换掉`kong/dao`，在0.14.1中，还是两者共存。

后面的“数据库操作封装”章节，分析了kong/db和kong/dao的实现，而用到kong/db和kong/dao的是kong的Admin API，在“管理API的启动”做了分析。

管理API收到请求之后，会调用Kong.db或者Kong.daos中dao对象的方法，完成对数据库的操作，而在dao实现的操作方法中，对数据库操作成功之后，都会抛出一个事件，例如：

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

这个事件是最初的事件，它会被init_worker.before()中设置的handler接收，产生后续的事件。

worker_events是在kong/init.lua中传递给db和dao的：

	--kong/init.lua
	function Kong.init_worker()
	  ...
	  kong.db:set_events_handler(worker_events)
	  kong.dao:set_events_handler(worker_events)
	...

### cluster_event

cluster_event是被记录在数据库中、被所有的kong实例监控的事件。每个kong都监控数据表`cluster_events`中的记录，获得事件并处理：

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

相当于实现了一个发布、订阅系统：

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

## Plugin的加载与初始化

要加载的插件名单是从配置中读取的，默认配置文件是prefix目录中的`.kong_env`文件：

	-- kong/init.lua
	function Kong.init()
	  ...
	  local conf_loader = require "kong.conf_loader"
	  ...
	  local conf_path = pl_path.join(ngx.config.prefix(), ".kong_env")
	  local config = assert(conf_loader(conf_path))

配置文件加载在kong/conf_loader.lua中实现的，plugins为`bundled`时，加载`constants.BUNDLED_PLUGINS`中的插件，和配置参数custom_plugins指定的插件：

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

bundled插件都有以下这些：

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

然后在kong/init.lua的Kong.init()中加载已经保存到config的loaded_plugins，并将dao一同传入(用来查询中数据库中已经使用的插件，如果插件在数据库存在，但kong没有启用， 报错)：

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

排序后的插件返回列表存放在`loaded_plugins`中;，在Kong.init_worker()中调用插件各自的handler:init_worker()完成初始化：

	function Kong.init_worker()
	  kong_global.set_phase(kong, PHASES.init_worker)
	  ...
	  for _, plugin in ipairs(loaded_plugins) do
	    kong_global.set_namespaced_log(kong, plugin.name)
	
	    plugin.handler:init_worker()
	  end

插件工作过程比较重要，单独开个页面记录一下，这里略过不表。

## 数据库的操作封装

和数据库相关的模块有两个`kong/db`和`kong/dao`。

	function Kong.init()
	  ...
	  local db = assert(DB.new(config))
	  assert(db:init_connector())
	  ...
	  local dao = assert(DAOFactory.new(config, db)) -- instantiate long-lived DAO
	  ...
	  local ok, err_t = dao:init()
	  ...
	  assert(dao:are_migrations_uptodate())
	  ...
	  kong.dao = dao
	  kong.db = db
	  ...

### kong/db

`kong/db`用来初始化数据库连接器(connector)，strategy是数据库类型，并生成核心Schema的DAO：

	function DB.new(kong_config, strategy)
	  ...
	  local schemas = {}
	  ...
	  local connector, strategies, err = Strategies.new(kong_config, strategy, schemas, errors)
	  ...
	  local daos = {}
	  local self   = {
	    daos       = daos,       -- each of those has the connector singleton
	    strategies = strategies,
	    connector  = connector,
	    strategy   = strategy,
	  }
	  ...
	  do
	    for _, schema in pairs(schemas) do
	      local strategy = strategies[schema.name]
	      ...
	      daos[schema.name] = DAO.new(self, schema, strategy, errors)
	    end
	  end

需要特别注意的是通过schema创建的Dao对象都保存在DB对象的daos中（self.daos），以schema.name命名。

使用数据库的时候，例如`db.plugins`，如果db中没有plugins，就会使用daos中的plugins，而daos中的plugins对应的就是同名的数据库表，相关的方法就是操作数据库的方法。

Schema是数据库视图，比实体表（Entity）更高一层，通过CORE_ENTITIES中的Entity创建：

	-- kong/db/init.lua
	function DB.new(kong_config, strategy)
	  ...
	  local schemas = {}
	  ...
	   do
	    for _, entity_name in ipairs(CORE_ENTITIES) do
	      local entity_schema = require("kong.db.schema.entities." .. entity_name)
	      ...
	      schemas[entity_name] = Entity.new(entity_schema)
	      end
	   end

CORE_ENTITIES中包括以下Entity，它们都位于`kong/db/schema/entities`目录中：

	local CORE_ENTITIES = {
	  "consumers",
	  "routes",
	  "services",
	  "certificates",
	  "snis",
	}

### Schema的加载：Entity.New()

Schema是用kong/db/schema/entity.lua中的`Entity.new()`创建的，参数entity_schema是从`kong/db/schema/entities`中加载的Entity：

	-- kong/db/init.lua
	function DB.new(kong_config, strategy)
	    ...
	    local Entity       = require "kong.db.schema.entity"
	    ...
	      local entity_schema = require("kong.db.schema.entities." .. entity_name)
	      ...
	      schemas[entity_name] = Entity.new(entity_schema)
	    ...

`Entity.new()`中调用kong/db/schema/init.lua中的`Schema.new()`创建schema对象，参数definition是继续传递下来的Entity：

	-- kong/db/schema/entity.lua
	...
	local Schema = require("kong.db.schema")
	...
	function Entity.new(definition)
	...
	  local self, err = Schema.new(definition)

`Schema.new()`的加载过程就是把传递下来的Entity复制一份，并将它的field添加到schema中：

	-- kong/db/schema/init.lua
	...
	function Schema.new(definition)
	  ...
	  local self = copy(definition)
	  ...
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

最后得到的schema中存放的就是Entity和Entity的fields，如果field是外键，会在field.schema中保存外键对应的schema。

正如前面说的，这里的到的schema会被用来和其他参数一起创建dao对象。

### Entity的实现

Entity都在`kong/db/schema/entities`目录中实现，下面是consumers的实现，类似于数据表的定义：

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

特别要注意的是，每个Entity的table中都有一个"dao"，它记录了Entity绑定的`kong/db/dao`中的模块：

	-- kong/db/schema/entities/consumers.lua
	  dao          = "kong.db.dao.consumers",

而`kong/db/dao`中的模块则实现了对数据库的操作。

### DAO

有两个目录都叫dao，一个是`kong/db/dao`，另一个是`kong/dao`。

怀疑kong/dao是早先的实现，kong/db/dao是最新的实现。

通过kong/db创建的db会被保存到kong/dao创建的dao的db.new_db。

#### kong/db/dao

kong/db在创建db的时候，会使用`kong/db/dao`为每个schema生成一个DAO：

	function DB.new(kong_config, strategy)
	  ...
	  local schemas = {}
	  ...
	  local connector, strategies, err = Strategies.new(kong_config, strategy, schemas, errors)
	  ...
	  do
	    for _, schema in pairs(schemas) do
	      local strategy = strategies[schema.name]
	      ...
	      daos[schema.name] = DAO.new(self, schema, strategy, errors)
	    end
	  end

`kong/db/dao`中的`DAO.new()`，将schemas中的Entity中指定的`kong/db/dao`模块中的方法加载。

每个Entity的中都有一个"dao"，它记录了Entity绑定的`kong/db/dao`中的模块，例如：

	-- kong/db/schema/entities/consumers.lua
	  dao          = "kong.db.dao.consumers",

它会在`DAO.new()`中被加载，并将其中的方法一同加载：

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
	  if schema.dao then
	    local custom_dao = require(schema.dao)
	    for name, method in pairs(custom_dao) do
	      self[name] = method
	    end
	  end
	
	  return setmetatable(self, { __index = super })
	end

同时将`kong/db/dao/init.lua`中`DAO:XX`方法加载到dao对象中：

	function _M.new(db, schema, strategy, errors)
	  local fk_methods = generate_foreign_key_methods(schema)
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
	  return setmetatable(self, { __index = super })
	end

最后得到的dao对象中包含db、schema、strategy和多个方法，调用dao中的方法就可以操作数据库中的数据。。

#### kong/db/dao/init.lua中的数据库操作

重点是对数据库进行操作之后，最后会抛出事件：

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

#### kong/dao 

`Kong.init()`函数中，调用`DAOFactory.new()`创建Dao，并传入前面创建的`db`：

	local DAOFactory = require "kong.dao.factory"
	...
	function Kong.init()
	  ...
	  local db = assert(DB.new(config))
	  assert(db:init_connector())
	
	  local dao = assert(DAOFactory.new(config, db)) -- instantiate long-lived DAO
	  local ok, err_t = dao:init()
	  if not ok then
	    error(tostring(err_t))
	  end
	
	  assert(dao:are_migrations_uptodate())
	
	  db.old_dao = dao
	
	  loaded_plugins = assert(load_plugins(config, dao))

`DAOFactory.new()`中调用`kong/dao/db/XXX`创建了一个db，将传入的db保存到db.new_db，加载`kong.dao.schemas`目录中的schema，和`kong/plugins/XXX/.daos`（如果不存在就不加载）：
	
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
	  for _, m_name in ipairs(CORE_MODELS) do
	    schemas[m_name] = require("kong.dao.schemas." .. m_name)
	  end
	  ...
	  for plugin_name in pairs(self.plugin_names) do
	    local has_schema, plugin_schemas = utils.load_module_if_exists("kong.plugins." .. plugin_name .. ".daos")
	    if has_schema then
	      if plugin_schemas.tables then
	        for _, v in ipairs(plugin_schemas.tables) do
	          table.insert(self.additional_tables, v)
	        end
	      else
	        for k, v in pairs(plugin_schemas) do
	          schemas[k] = v
	        end
	      end
	    end
	  end
	  ...
	  load_daos(self, schemas, constraints)

`load_daos()`中，又通过`kong/dao/dao.lua`创建了self.daos中的成员：

	local function load_daos(self, schemas, constraints)
	  for m_name, schema in pairs(schemas) do
	    self.daos[m_name] = DAO(self.db, ModelFactory(schema), schema,
	                            constraints[m_name])
	  end

`kong/dao/dao.lua`中的`DAO:new()`比较简单，就是生成一个dao对象，

	function DAO:new(db, model_mt, schema, constraints)
	  self.db = db
	  self.model_mt = model_mt
	  self.schema = schema
	  self.table = schema.table
	  self.constraints = constraints
	end

其中需要注意的第二个参数`ModelFactory(schema)`，这个函数在`kong/dao/model_factory.lua`中实现。

#### dao初始化

	  local ok, err_t = dao:init()

`dao:init()`调用`db.init()`， 

	function _M:init()
	  local ok, err = self.db:init()
	...

db来自于`kong.dao.db.数据库类型`：

	function _M.new(kong_config, new_db)
	  ...
	  local DB = require("kong.dao.db." .. self.db_type)
	  local db, err = DB.new(kong_config)
	  if not db then
	    return ret_error_string(self.db_type, nil, err)
	  end
	
	  db.new_db = new_db
	  self.db = db

`kong/dao/db/XX.lua`中每种类型的数据库会在各自的init()中连接数据库。

### 数据库的初始化

在`kong/cmd/start.lua`中实现：
	
	local function execute(args)
	  local db = assert(DB.new(conf))
	  assert(db:init_connector())
	  local dao = assert(DAOFactory.new(conf, db))
	  local ok, err_t = dao:init()
	  ...
	    if args.run_migrations then
	      assert(dao:run_migrations())
	    end
	  ...

`kong/dao/factory.lua`中实现了`run_migrations()`

	function _M:run_migrations(on_migrate, on_success)
	  local migrations_modules, err = self:migrations_modules()
	  ...

初始化操作一部分来自`kong/dao/migrations/`，一部分来自于每个插件的`migrations`目录：

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
	    end
	  end

## 管理API的启动

如果只是开启了admin管理平面，nginx-kong.conf中还会多一个server：

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

`Kong.serve_admin_api()`在`kong/init.lua`中实现：

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

kong的admin api使用了[kong/lapis][3]框架。`kong/api/init.lua`中创建了应用，绑定了`kong/api/routes`目录中的路由：

	local app = lapis.Application()
	...
	-- Load core routes
	for _, v in ipairs({"kong", "apis", "consumers", "plugins", "cache", "upstreams"}) do
	  local routes = require("kong.api.routes." .. v)
	  attach_routes(routes)
	end
	...
	do
	  local routes = {}
	
	  for _, dao in pairs(singletons.db.daos) do
	    routes = Endpoints.new(dao.schema, routes)
	  end
	  ...
	  for _, dao in pairs(singletons.db.daos) do
	    local schema = dao.schema
	    local ok, custom_endpoints = utils.load_module_if_exists("kong.api.routes." .. schema.name)
	    ...
	       for route_pattern, verbs in pairs(custom_endpoints) do
	          ...
	          routes[route_pattern]["methods"][verb] = function(self, db, helpers)
	          ...
	 attach_new_db_routes(routes)

在`attach_routers()`和`attach_new_db_routes()`中，分别将`Kong.init()`中创建的`dao`和`db`传给处理请求的方法：

	local function attach_routes(routes)
	        ...   
	        return method_handler(self, singletons.dao, handler_helpers)
	        ...
	
	local function attach_new_db_routes(routes)
	        ...
	        return method_handler(self, singletons.db, handler_helpers)
	        ...

### API Handler 以及数据库操作

以`kong/api/routes/consumers.lua`为例，一个handler如下：

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


`POST`方法是创建指定用户的指定插件，使用`kong/api/crud_helpers.lua`中的post()方法：

	function _M.post(params, dao_collection, post_process)
	...
	  local data, err = dao_collection:insert(params)
	...

consumer是在`kong/db/`中实现的，这里dao_collection:update应该是`db.plugins.:update`

在`db/init.lua`中，设置了`__index`，plugins会从db.daos中获取：

	local DB = {}
	DB.__index = function(self, k)
	  return DB[k] or rawget(self, "daos")[k]
	end

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
