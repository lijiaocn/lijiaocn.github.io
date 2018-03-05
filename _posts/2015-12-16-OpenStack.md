---
layout: default
title: Openstack的代码走读记录
author: 李佶澳
createdate: 2015/12/16 10:40:29
changedate: 2017/10/28 11:23:27
categories: 项目
tags: openstack
keywords:
description: 需要参考复用OpenStack的一些组件，需要浏览她的代码

---

## 摘要

需要参考复用OpenStack的一些组件，需要浏览她的代码。这是代码走读笔记，留作以后速查。

## 概况

依赖组件:

	rabbitmq   
	mysql      

核心项目:

	keystone   
	nova       
	glance      
	neutron
	cinder      
	swift

控制台:

	horizon

高可用:

	haproxy   --> keepalived


无状态的服务(stateless service):

	keystone-api
	nova-api
	nova-conductor
	glance-api
	neutron-api
	nova-scheduler

有状态的服务(stateful service):

	database 
	message queue

## 基本操作

### Keystone

Keystone首次部署的时候，里面的没有任何的用户信息，需要使用AdminToken创建第一个用户。

AdminToken是配置文件中设置的字符串。

	admin_token=XXXX

然后将环境变量OS_TOKEN的值设置为admin_token

	export OS_TOKEN=XXXX

	export OS_URL=http://controller:35357/v3

	export OS_IDENTITY_API_VERSION=3

## 排查场景

### 通过instance id找到qrouter和qdhcp

#### 通过instance获得所有port信息

	$nova interface-list 28f9e8c8-566b-4034-ae32-4eff055d8bab
	 +------------+--------------------------------------+--------------------------------------+--------------+-------------------+
	 | Port State | Port ID                              | Net ID                               | IP addresses | MAC Addr          |
	 +------------+--------------------------------------+--------------------------------------+--------------+-------------------+
	 | ACTIVE     | 499b1061-7afb-4b67-ae77-a390ecf0f4f2 | 67f2ad06-fc53-4e98-ae35-d2a52f2cab8d | 192.168.1.4  | fa:16:3e:26:0a:62 |
	 +------------+--------------------------------------+--------------------------------------+--------------+-------------------+

#### 获得port所在的network中的所有port

	$neutron port-list --network_id 67f2ad06-fc53-4e98-ae35-d2a52f2cab8d
	+--------------------------------------+------------------------------------------+-------------------+-------------------------------------------------------------------------------------+
	| id                                   | name                                     | mac_address       | fixed_ips                                                                           |
	+--------------------------------------+------------------------------------------+-------------------+-------------------------------------------------------------------------------------+
	| 499b1061-7afb-4b67-ae77-a390ecf0f4f2 |                                          | fa:16:3e:26:0a:62 | {"subnet_id": "630e9df7-b7b9-4e24-99e9-ec04c5189bc9", "ip_address": "192.168.1.4"}  |
	| f4d45a16-a36f-4477-8fea-650ee4c1e0cd | vip-f82c2061-da4a-4311-8b2a-e3c386ec71d1 | fa:16:3e:34:52:60 | {"subnet_id": "630e9df7-b7b9-4e24-99e9-ec04c5189bc9", "ip_address": "192.168.1.25"} |
	| ec76c6e2-6af9-4371-8a30-2f0d57c1550f |                                          | fa:16:3e:34:b5:3e | {"subnet_id": "630e9df7-b7b9-4e24-99e9-ec04c5189bc9", "ip_address": "192.168.1.1"}  |
	| dc25a661-b32e-4859-8c65-41dc0fc87cae |                                          | fa:16:3e:45:db:c2 | {"subnet_id": "630e9df7-b7b9-4e24-99e9-ec04c5189bc9", "ip_address": "192.168.1.7"}  |
	| d4c221b6-d142-415f-ae97-a72eac667374 |                                          | fa:16:3e:58:19:9b | {"subnet_id": "630e9df7-b7b9-4e24-99e9-ec04c5189bc9", "ip_address": "192.168.1.27"} |
	| 64d1c614-4736-4f49-8d39-523e5672de3d |                                          | fa:16:3e:6c:4e:28 | {"subnet_id": "630e9df7-b7b9-4e24-99e9-ec04c5189bc9", "ip_address": "192.168.1.8"}  |
	| 2c9d6f5b-ad89-4c8f-830c-87b4772f624d | vip-1774c9fd-d2dc-4953-914b-10da16cc2576 | fa:16:3e:7a:c4:dd | {"subnet_id": "630e9df7-b7b9-4e24-99e9-ec04c5189bc9", "ip_address": "192.168.1.12"} |
	| 2bbccf1d-e653-4913-98a9-6328982ab91d |                                          | fa:16:3e:b5:c8:ba | {"subnet_id": "630e9df7-b7b9-4e24-99e9-ec04c5189bc9", "ip_address": "192.168.1.2"}  |
	| 5e88a938-bdfa-4504-8e2a-b86e4e371c95 |                                          | fa:16:3e:c2:ee:b9 | {"subnet_id": "630e9df7-b7b9-4e24-99e9-ec04c5189bc9", "ip_address": "192.168.1.23"} |
	| 5e28468d-e2b1-4f51-b919-22fb3178239f | vip-5d93adee-4a8e-4fbe-9495-e48dc8e96010 | fa:16:3e:c6:19:c8 | {"subnet_id": "630e9df7-b7b9-4e24-99e9-ec04c5189bc9", "ip_address": "192.168.1.19"} |
	+--------------------------------------+------------------------------------------+-------------------+-------------------------------------------------------------------------------------+

#### 获得instance的port

	# neutron port-show 499b1061-7afb-4b67-ae77-a390ecf0f4f2
	+-----------------------+-----------------------------------------------------------------------------------------------------------+
	| Field                 | Value                                                                                                     |
	+-----------------------+-----------------------------------------------------------------------------------------------------------+
	| admin_state_up        | True                                                                                                      |
	| allowed_address_pairs |                                                                                                           |
	| binding:host_id       | ip-171-63                                                                                                 |
	| binding:profile       | {}                                                                                                        |
	| binding:vif_details   | {"port_filter": true, "ovs_hybrid_plug": true}                                                            |
	| binding:vif_type      | ovs                                                                                                       |
	| binding:vnic_type     | normal                                                                                                    |
	| created_at            |                                                                                                           |
	| device_id             | 28f9e8c8-566b-4034-ae32-4eff055d8bab                                                                      |
	| device_owner          | compute:nova                                                                                              |
	| dns_assignment        | {"hostname": "host-192-168-1-4", "ip_address": "192.168.1.4", "fqdn": "host-192-168-1-4.openstacklocal."} |
	| dns_name              |                                                                                                           |
	| extra_dhcp_opts       |                                                                                                           |
	| fixed_ips             | {"subnet_id": "630e9df7-b7b9-4e24-99e9-ec04c5189bc9", "ip_address": "192.168.1.4"}                        |
	| id                    | 499b1061-7afb-4b67-ae77-a390ecf0f4f2                                                                      |
	| mac_address           | fa:16:3e:26:0a:62                                                                                         |
	| name                  |                                                                                                           |
	| network_id            | 67f2ad06-fc53-4e98-ae35-d2a52f2cab8d                                                                      |
	| security_groups       | 4cdeb922-cad5-418e-88c4-4f32e11b4afe                                                                      |
	| status                | ACTIVE                                                                                                    |
	| tenant_id             | edced051e5094269ad9b08549729397d                                                                          |
	| updated_at            |                                                                                                           |
	+-----------------------+-----------------------------------------------------------------------------------------------------------+

#### 获得网关port

	 $neutron port-show ec76c6e2-6af9-4371-8a30-2f0d57c1550f    <-- 192.168.1.1对应的port
	 +-----------------------+-----------------------------------------------------------------------------------------------------------+
	 | Field                 | Value                                                                                                     |
	 +-----------------------+-----------------------------------------------------------------------------------------------------------+
	 | admin_state_up        | True                                                                                                      |
	 | allowed_address_pairs |                                                                                                           |
	 | binding:host_id       | ip-171-71                                                                                                 |
	 | binding:profile       | {}                                                                                                        |
	 | binding:vif_details   | {"port_filter": true, "ovs_hybrid_plug": true}                                                            |
	 | binding:vif_type      | ovs                                                                                                       |
	 | binding:vnic_type     | normal                                                                                                    |
	 | created_at            |                                                                                                           |
	 | device_id             | 8a8ba67c-976f-4a89-8976-35cf79a61272                                                                      |
	 | device_owner          | network:router_interface                                                                                  |
	 | dns_assignment        | {"hostname": "host-192-168-1-1", "ip_address": "192.168.1.1", "fqdn": "host-192-168-1-1.openstacklocal."} |
	 | dns_name              |                                                                                                           |
	 | extra_dhcp_opts       |                                                                                                           |
	 | fixed_ips             | {"subnet_id": "630e9df7-b7b9-4e24-99e9-ec04c5189bc9", "ip_address": "192.168.1.1"}                        |
	 | id                    | ec76c6e2-6af9-4371-8a30-2f0d57c1550f                                                                      |
	 | mac_address           | fa:16:3e:34:b5:3e                                                                                         |
	 | name                  |                                                                                                           |
	 | network_id            | 67f2ad06-fc53-4e98-ae35-d2a52f2cab8d                                                                      |
	 | security_groups       |                                                                                                           |
	 | status                | ACTIVE                                                                                                    |
	 | tenant_id             | 68b0723641ee4ba3ad072bb77f0721b4                                                                          |
	 | updated_at            |                                                                                                           |
	 +-----------------------+-----------------------------------------------------------------------------------------------------------+

qrouter位于机器ip-171-71上，namespace为qrouter-{Net ID}

#### 获得dhcp port

	$neutron port-show 2bbccf1d-e653-4913-98a9-6328982ab91d   <-- 192.168.1.2对应的port
	+-----------------------+-----------------------------------------------------------------------------------------------------------+
	| Field                 | Value                                                                                                     |
	+-----------------------+-----------------------------------------------------------------------------------------------------------+
	| admin_state_up        | True                                                                                                      |
	| allowed_address_pairs |                                                                                                           |
	| binding:host_id       | ip-171-71                                                                                                 |
	| binding:profile       | {}                                                                                                        |
	| binding:vif_details   | {"port_filter": true, "ovs_hybrid_plug": true}                                                            |
	| binding:vif_type      | ovs                                                                                                       |
	| binding:vnic_type     | normal                                                                                                    |
	| created_at            |                                                                                                           |
	| device_id             | dhcpeabb1ac3-bb63-5bad-bf2c-4a2197041966-67f2ad06-fc53-4e98-ae35-d2a52f2cab8d                             |
	| device_owner          | network:dhcp                                                                                              |
	| dns_assignment        | {"hostname": "host-192-168-1-2", "ip_address": "192.168.1.2", "fqdn": "host-192-168-1-2.openstacklocal."} |
	| dns_name              |                                                                                                           |
	| extra_dhcp_opts       |                                                                                                           |
	| fixed_ips             | {"subnet_id": "630e9df7-b7b9-4e24-99e9-ec04c5189bc9", "ip_address": "192.168.1.2"}                        |
	| id                    | 2bbccf1d-e653-4913-98a9-6328982ab91d                                                                      |
	| mac_address           | fa:16:3e:b5:c8:ba                                                                                         |
	| name                  |                                                                                                           |
	| network_id            | 67f2ad06-fc53-4e98-ae35-d2a52f2cab8d                                                                      |
	| security_groups       |                                                                                                           |
	| status                | ACTIVE                                                                                                    |
	| tenant_id             | 68b0723641ee4ba3ad072bb77f0721b4                                                                          |
	| updated_at            |                                                                                                           |
	+-----------------------+-----------------------------------------------------------------------------------------------------------+

qdhcp位于机器ip-171-71上，namespace为qdhcp-{Net ID}

	#ip netns list |grep 67f2ad06-fc53-4e98-ae35-d2a52f2cab8d    <-- 使用Net ID
	qdhcp-67f2ad06-fc53-4e98-ae35-d2a52f2cab8d

## 源码走读

### Keystone

[Git Resp](https://git.openstack.org/openstack/keystone.git)

Tag: 8.0.0

keystone-all启动时根据paste.ini，创建了composite:admin和composite:main两个服务(keystone.server.eventlet.run)。

而每个app在各自的XXX_factory中, 完成路由设置, url路径和controller的对应。(每个app的XXX_factory在setup.cfg中)

完成路由设置后, 每个request到达wsgi处理函数的时候，就可以从req.environ['wsgiorg.routing_args']中获得相关信息。(routes的功能)

[Porting Routes to a WSGI Web Framework](http://routes.readthedocs.org/en/latest/porting.html)

#### 入口

按照官方手册，keystone的源码安装方式:

	python ./setup.py install

启动命令:

	keystone-all

首先要找到这个命令的源码, 在代码中没有搜到名为keytone-all文件, 后来发现这是用setuptools中的entry_point实现的。

在setup.cfg中可以找到:

	[entry_points]
	console_scripts =
	    keystone-all = keystone.cmd.all:main         //keystone-all命令的入口函数: keystonel.cmd.all:main
	    keystone-manage = keystone.cmd.manage:main

setuptools是Python的Package，用来进行项目的管理，只需要在setup.py中进行配置即可。
本来entry_point需要在setup.py中进行配置, 但是OpenStack开发pbr来扩充setup.cfg配置文件, 将配置集中到了setup.cfg中。

[python pbr](https://pypi.python.org/pypi/pbr/)

>关于setup.py以及entry_point的是用参考本站中名为《Python》的文章。

[entry_point使用示例](https://github.com/lijiaocn/Study-Python/tree/master/study/entry_point)

#### class关系

![class](.././pics/2015-12-06-OpenStack/keystone_service_v3.png)

#### wsgi结构

Keystone启动后是作为一个服务存在, 向外提供REST接口, 本质是个Server。
每个请求的处理流程是在etc/keystone-paste.ini中编排的。

	[filter:url_normalize]
	use = egg:keystone#url_normalize
	
	[filter:sizelimit]
	use = egg:keystone#sizelimit
	
	[app:public_service]
	use = egg:keystone#public_service
	
	[app:service_v3]
	use = egg:keystone#service_v3]
	
	[pipeline:admin_version_api]
	pipeline = sizelimit url_normalize admin_version_service
	
	[composite:main]
	use = egg:Paste#urlmap
	/v2.0 = public_api
	/v3 = api_v3
	/ = public_version_api
	
	[composite:admin]
	use = egg:Paste#urlmap
	/v2.0 = admin_api
	/v3 = api_v3
	/ = admin_version_api

需要特别注意的是filter和app中使用方法名是entry point中的名字。而entry point与源码的对应关系是在setup.cfg中描述的:

	paste.filter_factory =
	    admin_token_auth = keystone.middleware:AdminTokenAuthMiddleware.factory
	    build_auth_context = keystone.middleware:AuthContextMiddleware.factory
	    crud_extension = keystone.contrib.admin_crud:CrudExtension.factory
	    debug = keystone.common.wsgi:Debug.factory
	    endpoint_filter_extension = keystone.contrib.endpoint_filter.routers:EndpointFilterExtension.factory
	    ec2_extension = keystone.contrib.ec2:Ec2Extension.factory
	    ec2_extension_v3 = keystone.contrib.ec2:Ec2ExtensionV3.factory
	    federation_extension = keystone.contrib.federation.routers:FederationExtension.factory
	    json_body = keystone.middleware:JsonBodyMiddleware.factory
	    oauth1_extension = keystone.contrib.oauth1.routers:OAuth1Extension.factory
	    request_id = oslo_middleware:RequestId.factory
	    revoke_extension = keystone.contrib.revoke.routers:RevokeExtension.factory
	    s3_extension = keystone.contrib.s3:S3Extension.factory
	    simple_cert_extension = keystone.contrib.simple_cert:SimpleCertExtension.factory
	    sizelimit = oslo_middleware.sizelimit:RequestBodySizeLimiter.factory
	    token_auth = keystone.middleware:TokenAuthMiddleware.factory
	    url_normalize = keystone.middleware:NormalizingFilter.factory
	    user_crud_extension = keystone.contrib.user_crud:CrudExtension.factory
	
	paste.app_factory =
	    admin_service = keystone.service:admin_app_factory
	    admin_version_service = keystone.service:admin_version_app_factory
	    public_service = keystone.service:public_app_factory
	    public_version_service = keystone.service:public_version_app_factory
	    service_v3 = keystone.service:v3_app_factory

关于Python Paste可以参看本站中名为《Python》的文章。

[Python Paste](http://pythonpaste.org/)

[Python Paste Deploy](http://pythonpaste.org/deploy/)

[Python Paste Script](http://pythonpaste.org/script/)

[Python Paste 使用示例](https://github.com/lijiaocn/Study-Python/tree/master/study/test_wsgi)

#### Router

Keystone使用routes包进行路由选择, 这里只分析v3版本的api。

从etc/keystone-paste.ini中找到下面的workflow:

	[composite:main]
	use = egg:Paste#urlmap
	/v2.0 = public_api
	/v3 = api_v3             --> 到pipeline: api_v3
	/ = public_version_api
	
	[pipeline:api_v3]        --> 经过多个filter, 最后到达service_v3
	pipeline = sizelimit url_normalize request_id build_auth_context token_auth admin_token_auth json_body \
	           ec2_extension_v3 s3_extension simple_cert_extension revoke_extension federation_extension \
	           oauth1_extension endpoint_filter_extension service_v3
	
	[app:service_v3]
	use = egg:keystone#service_v3

从setup.cfg中找到service_v3对应到函数:

	paste.app_factory =
	    admin_service = keystone.service:admin_app_factory
	    admin_version_service = keystone.service:admin_version_app_factory
	    public_service = keystone.service:public_app_factory
	    public_version_service = keystone.service:public_version_app_factory
	    service_v3 = keystone.service:v3_app_factory

最后在keystone/service.py中找到v3_app_factory。

从v3_app_factory的实现，可以得知Keystone v3的REST接口主要分布在以下package中:

	auth
	assignment
	catalog
	credential
	identity
	policy
	resource
	trust
	endpoint_policy
	routers_instance

每个模块通过下面的方式注册路由:

	for module in router_modules:      # module就是上面列出package的名字
	    routers_instance = module.routers.Routers()
	    _routers.append(routers_instance)
	    routers_instance.append_v3_routers(mapper, sub_routers)
	
最后注册到wsgi：

	controllers.register_version('v3')
	sub_routers.append(routers.VersionV3('public', _routers))
	return wsgi.ComposingRouter(mapper, sub_routers)

每个sub_routers对应的package结构基本如下:

	▾ auth/
	  ▸ plugins/           #各个插件实现
	    __init__.py
	    controllers.py     #REST处理函数
	    core.py
	    routers.py         #Sub Router

#### Auth

在auth.routes中注册了最终的route:

	self._add_resource(
	    mapper, auth_controller,
	    path='/auth/tokens',                   ##uri
	    get_action='validate_token',           ##Get的处理函数
	    head_action='check_token',             ##Head的处理函数
	    post_action='authenticate_for_token',  ##Post的处理函数
	    delete_action='revoke_token',          ##Delete的处理函数
	    rel=json_home.build_v3_resource_relation('auth_tokens'))

处理函数在auth.controllers中实现(class Auth), 例如:

	@controller.protected()
	def check_token(self, context):
	    token_id = context.get('subject_token_id')
	    token_data = self.token_provider_api.validate_v3_token(
	        token_id)
	    ## NOTE(morganfainberg): The code in
	    ## ``keystone.common.wsgi.render_response`` will remove the content
	    ## body.
	    return render_token_data_response(token_id, token_data)

#### WorkFlow

这里只分析/v3 = api_v3的workflow，从etc/keystone-paste.ini中可以知道workflow如下：

	sizelimit
	url_normalize
	request_id                       分配request id
	build_auth_context               根据token或者其它凭证设置auth_context(如果已经认证)
	                                 request.environ['KEYSTONE_AUTH_CONTEXT']
	token_auth                       设置会话上下文
	                                 request.environ['openstack.context']=context
	                                    context['token_id']
	                                    context['subject_token_id']
	admin_token_auth                 在会话上下文中设置'is_admin'（依据配置文件的中admin_token）
	                                    context['is_admin']
	json_body                        设置从json中解析到的参数
	                                 request.environ['openstack.params'] 
	ec2_extension_v3                 
	    [POST]         /ec2tokens
	    [GET][POST]    /users/{user_id}/credentials/OS-EC2
	    [GET][DELETE]  /users/{user_id}/credentials/OS-EC2/{credential_id}
	                               
	s3_extension                     
	    [POST]         /s3tokens
	simple_cert_extension
	    [GET]          /OS-SIMPLE-CERT/ca
	    [GET]          /OS-SIMPLE-CERT/certificates
	revoke_extension
	    [GET]          /OS-REVOKE/events
	federation_extension
	                   /OS-FEDERATION/*
	oauth1_extension
	                   /OS-OAUTH/*
	endpoint_filter_extension   
	                  /OS-EP-FILTER/*
	service_v3

keystone.common.authorization:  

	auth_context
	
	    * ``token``: Token from the request
	    * ``user_id``: user ID of the principal
	    * ``project_id`` (optional): project ID of the scoped project if auth is
	                                 project-scoped
	    * ``domain_id`` (optional): domain ID of the scoped domain if auth is
	                                domain-scoped
	    * ``domain_name`` (optional): domain name of the scoped domain if auth is
	                                  domain-scoped
	    * ``is_delegated_auth``: True if this is delegated (via trust or oauth)
	    * ``trust_id``: Trust ID if trust-scoped, or None
	    * ``trustor_id``: Trustor ID if trust-scoped, or None
	    * ``trustee_id``: Trustee ID if trust-scoped, or None
	    * ``consumer_id``: OAuth consumer ID, or None
	    * ``access_token_id``: OAuth access token ID, or None
	    * ``roles`` (optional): list of role names for the given scope
	    * ``group_ids`` (optional): list of group IDs for which the API user has
	                                membership if token was for a federated user

#### 依赖Package

[Using Libraries](http://docs.openstack.org/developer/openstack-projects.html)

[oslo](https://wiki.openstack.org/wiki/Oslo)是OpenStack的多个子项目共用的Package。

[routes](http://routes.readthedocs.org/en/latest/)

[webob](http://docs.webob.org/en/latest/)

#### 使用

[identity-v3](http://developer.openstack.org/api-ref-identity-v3.html)

keystone的api的v3版本变化比较大, 比v2更清晰合理。这里只使用v3的版本。

keystone第一次部署安装后，里面没有任何用户，这时候的操作通过admin_token进行。

admin_token是keystone.conf中的一个配置项目, 携带这个token的请求将被认为是"is_admin", policy.json文件
中允许"is_admin"进行任何操作。

##### 准备 

准备四个脚本用于简化下面的操作：

	get.sh: 
	    ##!/bin/bash
	    HOST="http://127.0.0.1:35357"
	    TOKEN="ADMIN"
	    curl -s -H "X-Auth-Token: ${TOKEN}" "$HOST/$1" | python -m json.tool
	
	post.sh
	    ##!/bin/bash
	    HOST="http://127.0.0.1:35357"
	    TOKEN="ADMIN"
	    curl -s -X POST -H "Content-Type: application/json" -H "X-Auth-Token: ${TOKEN}"  -d @$2 "$HOST/$1" | python -m json.tool
	
	patch.sh
	    ##!/bin/bash
	    HOST="http://127.0.0.1:35357"
	    TOKEN="ADMIN"
	    curl -s -X PATCH -H "Content-Type: application/json" -H "X-Auth-Token: ${TOKEN}"  -d @$2 "$HOST/$1" | python -m json.tool
	
	
	delte.sh
	    ##!/bin/bash
	    HOST="http://127.0.0.1:35357"
	    TOKEN="ADMIN"
	    curl -s -X DELETE -H "X-Auth-Token: ${TOKEN}" "$HOST/$1" | python -m json.tool

首先查看下，刚启动都keystone中由哪些内容。

查询domains, 可以看到默认有一个id为“default”的domain，v2的下的用户和租户都将默认属于default:

	$ ./get.sh v3/domains
	{
	    "domains": [
	        {
	            "description": "Owns users and tenants (i.e. projects) available on Identity API v2.",
	            "enabled": true,
	            "id": "default",
	            "links": {
	                "self": "http://127.0.0.1:35357/v3/domains/default"
	            },
	            "name": "Default"
	        }
	    ],
	    "links": {
	    "next": null,
	    "previous": null,
	    "self": "http://127.0.0.1:35357/v3/domains"
	}

查询其它的内容，基本都为空:

	$ ./get.sh v3/users
	{
	    "links": {
	        "next": null,
	        "previous": null,
	        "self": "http://127.0.0.1:35357/v3/users"
	    },
	    "users": []
	}

##### 创建Domain

创建Domain: cloud_admin，这个domain中的用户将具有管理云的权限:

	$cat json/domain_cloud_admin.json
	    {
	        "domain": {
	            "description": "Domain: cloud_admin",
	                "enabled": true,
	                "name": "cloud_admin"
	        }
	    }
	
	$ ./post.sh v3/domains json/domain_cloud_admin.json
	{
	    "domain": {
	        "description": "Domain: cloud_admin",
	            "enabled": true,
	            "id": "0e2844e47a8e4970b21663c29520a1e7",
	            "links": {
	                "self": "http://127.0.0.1:35357/v3/domains/0e2844e47a8e4970b21663c29520a1e7"
	            },
	            "name": "cloud_admin"
	    }
	}

在keystone的policy文件中设置cloud_admin，这里使用的是policy.v3cloudsample.json:

	将:
	
	    "cloud_admin": "rule:admin_required and domain_id:admin_domain_id",
	
	修改为:
	
	    "cloud_admin": "rule:admin_required and domain_id:0e2844e47a8e4970b21663c29520a1e7",
	
	0e....1e7是上面创建的domain的id, 如果要立即生效, 可能需要重启keystone。

##### 创建角色

创建角色admin和service:

	$cat json/role_admin.json
	{
	    "role": {
	           "name": "admin"
	    }
	}
	
	$ ./post.sh v3/roles json/role_admin.json
	{
	    "role": {
	        "id": "8e051a29221b45db98ff47a89f53dd6e",
	        "links": {
	            "self": "http://127.0.0.1:35357/v3/roles/8e051a29221b45db98ff47a89f53dd6e"
	        },
	        "name": "admin"
	    }
	}
	
	$cat json/role_service.json
	{
	    "role": {
	        "name": "admin"
	    }
	}
	
	$ ./post.sh v3/roles json/role_service.json
	{
	    "role": {
	        "id": "7db058f7e6d748aab076fc6c0fca527b",
	            "links": {
	                "self": "http://127.0.0.1:35357/v3/roles/7db058f7e6d748aab076fc6c0fca527b"
	            },
	            "name": "service"
	    }
	}
	
	$ ./get.sh v3/roles
	{
	    "links": {
	        "next": null,
	            "previous": null,
	            "self": "http://127.0.0.1:35357/v3/roles"
	    },
	        "roles": [
	        {
	            "id": "8e051a29221b45db98ff47a89f53dd6e",
	            "links": {
	                "self": "http://127.0.0.1:35357/v3/roles/8e051a29221b45db98ff47a89f53dd6e"
	            },
	            "name": "admin"
	        },
	        {
	            "id": "7db058f7e6d748aab076fc6c0fca527b",
	            "links": {
	                "self": "http://127.0.0.1:35357/v3/roles/7db058f7e6d748aab076fc6c0fca527b"
	            },
	            "name": "service"
	        }
	    ]
	}

##### 创建云管理员

	$ cat json/user_admin.json
	{
	    "user": {
	        "description": "admin@jd.com",
	            "domain_id": "0e2844e47a8e4970b21663c29520a1e7",
	            "email": "admin@jd.com",
	            "enabled": true,
	            "name": "admin@jd.com",
	            "password": "123456"
	    }
	}
	
	$ ./post.sh v3/users json/user_admin.json
	{
	    "user": {
	        "description": "admin@jd.com",
	            "domain_id": "0e2844e47a8e4970b21663c29520a1e7",
	            "email": "admin@jd.com",
	            "enabled": true,
	            "id": "d3bc43812502465983d0b5c438665df1",
	            "links": {
	                "self": "http://127.0.0.1:35357/v3/users/d3bc43812502465983d0b5c438665df1"
	            vagrant@vagrant-ubuntu-trusty-64:/vagrant/scripts},
	            "name": "admin@jd.com"
	    }
	}

>policy.json文件中已经设置了规则: 位于Domain: cloud_admin中的用户都是管理员

##### 管理员登陆获取token

尝试用新建用户登陆，获取token:

	$ cat json/auth_admin.json
	{
	    "auth": {
	        "identity": {
	            "methods": [
	                "password"
	            ],
	            "password": {
	                "user": {
	                    "name": "admin@jd.com",
	                    "domain": {
	                        "name": "cloud_admin"
	                    },
	                    "password": "123456"
	                }
	            }
	        }
	    }
	}
	
	//注意, token的id在返回的http头中，操作之前, 修改post.sh中"curl -s"为"curl -v"
	$ ./post.sh v3/auth/tokens json/auth_admin.json
	.....(省略).....
	< HTTP/1.1 201 Created
	< X-Subject-Token: ee29b9e3db124ef88b4e5fc343efcffa
	< Vary: X-Auth-Token
	< Content-Type: application/json
	< Content-Length: 333
	< X-Openstack-Request-Id: req-6c29ec21-7183-4135-b96e-dbc76a5239c8
	< Date: Wed, 23 Dec 2015 11:51:57 GMT
	
	token详细信息:
	{
	    "token": {
	        "audit_ids": [
	            "-wOrdio9TkyShQSNzSm7Sg"
	            ],
	            "expires_at": "2015-12-23T12:46:56.647140Z",
	            "extras": {},
	            "issued_at": "2015-12-23T11:46:56.647173Z",
	            "methods": [
	                "password"
	                ],
	            "user": {
	                "domain": {
	                    "id": "0e2844e47a8e4970b21663c29520a1e7",
	                    "name": "cloud_admin"
	                },
	                "id": "d3bc43812502465983d0b5c438665df1",
	                "name": "admin@jd.com"
	            }
	    }
	}

##### 验证token

验证获得的token, 新增一个名为verify.sh的脚本，专门用来验证token:

	verify.sh
	    ##!/bin/bash
	    HOST="http://127.0.0.1:35357"
	    TOKEN="ADMIN"
	    curl -s -X HEAD  -H "X-Auth-Token: ${TOKEN}" -H "X-Subject-Token: $2" $HOST/$1" | python -m json.tool

验证结果如下:

	 $ ./verify.sh v3/auth/tokens  ee29b9e3db124ef88b4e5fc343efcffa
	 {
	     "token": {
	         "audit_ids": [
	             "-cx8yDjwQNqc5BGYQgpqlA"
	             ],
	             "expires_at": "2015-12-23T12:51:57.049122Z",
	             "extras": {},
	             "issued_at": "2015-12-23T11:51:57.049155Z",
	             "methods": [
	                 "password"
	                 ],
	             "user": {
	                 "domain": {
	                     "id": "0e2844e47a8e4970b21663c29520a1e7",
	                     "name": "cloud_admin"
	                 },
	                 "id": "d3bc43812502465983d0b5c438665df1",
	                 "name": "admin@jd.com"
	             }
	     }
	 }

验证OK，云管理员创建成功。

>云管理员创建成功以后，就应该关闭admin_token，后续操作都由云管理员进行。

>删除admin_token的方法: 从paste.ini中删除AdminTokenAuthMiddleware即可。

### Neutron

Neutron是OpenStack中提供网络服务的部分。

[Neutron API 手册](http://developer.openstack.org/api-ref-networking-v2.html)

要了解Neutron最关键的是要有网络方面的知识:

[neturon layer3](http://docs.openstack.org/developer/neutron/devref/layer3.html)

[neturon layer2](http://docs.openstack.org/developer/neutron/devref/l2_agents.html)

Neutron同样是通过paste.ini设置workflow:

	[composite:neutron]
	use = egg:Paste##urlmap
	/: neutronversions
	/v2.0: neutronapi_v2_0
	
	[composite:neutronapi_v2_0]
	use = call:neutron.auth:pipeline_factory
	noauth = request_id catch_errors extensions neutronapiapp_v2_0
	keystone = request_id catch_errors authtoken keystonecontext extensions neutronapiapp_v2_0]
	.....（省略）.....

不同与keystone的地方是, 它设置了两个workflow，可以依据配置项auth_strategy(etc/neutron.conf)进行指定:

	auth_strategy = keystone

"keystone"表示使用[composite:neutronapi_v2_0]中的keystone工作流, "noauth"使用noauth描述的workflow。

代码实现在neutron.auth:pipline_factory中。其中cfg.CONF.auth_strategy的value是通过oslo.conf中的cfg设置的。

[oslo.config中的cfg的使用说明](http://docs.openstack.org/developer/oslo.config/cfg.html)

#### 依赖包

[oslo.config](http://docs.openstack.org/developer/oslo.config/)

