---
layout: default
title: "Google 是如何实践 RESTful API 设计的？"
author: 李佶澳
date: "2022-11-24 16:52:28 +0800"
last_modified_at: "2024-04-22 11:26:14 +0800"
categories: 方法
cover:
tags: API设计
keywords: API Desigin,REST,Google API
description:  经手了几个应用层的项目，API设计的都不怎么理想，有的项目乱到一塌糊涂。在参考国外公司的 API 时，发现 Google 在 2017 年公布了 2014 年制定 API Design Guide，维护至今。这里提炼下要点。 
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

经手了几个应用层的项目，API设计的都不怎么理想，有的项目乱到一塌糊涂。在参考国外公司的 API 时，发现 Google 在 2017 年公布了 2014 年制定并使用至今的 [API Design Guide][2]，这里提炼下要点。 

后续：2021 年 Google API Design Guide 编写人之一 JJ Geewax 出版了一本《API Design Patterns》对 API 设计规范进行解释，还发起了 [API Improvement Proposals][15] 项目，收集 API 设计规范并提供了检查是否复合规范的 [Google API Linter][16]。

## 应用情况怎样？

Google 有的服务遵守了这份规范，比如 Google Cloud APIs、[Google Calendar API][4]，有的没有完全准守，比如 [Blogger API v3][5]。
采用了该规范的 Google Cloud API 是 Google 整个云服务的接口，具有接口数量多、类别多的特点。可以认为这份规范在谷歌内得到了较多支持，一些服务没有遵循规范可能是历史原因。

## 是否有实践案例？

Google 开放了一份 protobuf 格式的接口描述文件 [googleapis][6]，里面主要是 Google Cloud API 的接口，没有覆盖 google 所有产品的 API（Google 开放的所有 API 汇总在 [Google API Explorer][3] 中）。

```sh
git clone https://github.com/googleapis/googleapis.git 
```

googleapis 在文件组织上存在一些不理想的做法：

* 存放公用定义的目录比如 google/api/、google/rpc/ 和业务接口目录比如 google/cloud/、google/container/ 等平铺在一起，不方便区分以及查找
* 文件名的命名方式不统一，比如包含 service 定义的 proto 文件，有以下几种方式的命名：

```sh
google/firestore/v1/firestore.proto、
google/cloud/aiplatform/v1/{dataset_,endpoint_,feature_store,...}_service.proto
google/actions/sdk/v2/actions_sdk.proto
```

## API 设计的核心原则？

以名词描述的 Resource 为中心，Resource 按父子层级关系进行组织。
为 Resource 赋予统一的标准操作（LIST, GET, CREATE, UPDATE, DELETE），无法用标准操作表示的动作单独设计非标准操作。

## Resource URI 命名风格和 URL 风格？

Resource 通过 URI 锚定，URI 采用可多层嵌套 `collecionID/resourceId` 样式。

```bash
//      域名              /父类别         /资源ID              /子类别        /资源ID
//     domain name        /collectionID   /resourceID          /collecionID   /resourceID
//storage.googleapis.com  /buckets        /bucket-id           /objects       /object-id
//mail.googleapis.com     /users          /name@example.com    /settings      /customFrom
```

URI 体现接口版本号、路径参数，不体现标准的 LIST/GET/CREATE/UPDATE/DELETE 操作（通过 HTTP Method 区分），用后缀的方式体现非标准操作。

```sh
# 标准方法通过 HTTP Method 区分
https://service.name/v1/some/resource/name              
# 非标准方法通过 :custermVerb 后缀区分
https://service.name/v1/some/resource/name:customVerb
```

Package/Service/Method/Enum 的命名方式也有约定，详情见 [Naming conventions][10]。

## Resource 的唯一标识要如何设计？

最常见的做法用一个 int64 数值作为 Resource 的唯一标识，通常称为 Resource ID。Google 采用了另一种做法，用一个字符串类型的 name 作为 Resource 的唯一标识：
**Resource 的第一个 field 是 string 类型的 name，value 为用“/”分隔的 URI**。

```sh
//calendar.googleapis.com/users/john smith/events/123
```

这和常规做法很不相同，Google 认为这种格式的字符串才是最完整的表达，单个数值 id 表达不出 Parent ID/Child ID 的层次关系。
具体解释见 [Why not use resource IDs to identify a resource?][11]。

Resource Name 的这种设计使路径参数捕获方式也相应发生变化：

```proto
service LibraryService {
  rpc GetBook(GetBookRequest) returns (Book) {
    option (google.api.http) = {
      //注意看：{} 中的参数 name 匹配的是字符串 shelves/*/books/* ，而不是一个数值字段
      get: "/v1/{name=shelves/*/books/*}" 
    };
  };
  rpc CreateBook(CreateBookRequest) returns (Book) {
    option (google.api.http) = {
      post: "/v1/{parent=shelves/*}/books"
      body: "book"
    };
  };
}
```

上面的 name 从路径参数中捕获的 value 是一个有层次关系的字符串，这个字符串显然是不能整体作为作为数据库表的主键或者索引。
比较好奇 Google 是怎样写实现代码的，在代码中进行字符串分隔提取出各级 ID，返回时再将多级 ID 拼接成 name ?

## 是否复用 HTTP Method 的语义？

Google 的答案是：**`复用`**。

现实中有的项目全部都是 POST 方法，在 URI 中添加 GET/LIST 等动词区分不同的操作，这种做法浪费了 HTTP Method 的表达力，并且增加了 URI 长度。
Google API Design Guide 约定 Resource 上的常规操作 LIST/GET/CREATE/UPDATE/DELETE 分别用对应的 HTTP method 承接，这些操作的 URI 中不包含动词。

Resource 标准操作和 HTTP Method 的映射：

```sh
Standard    HTTP                         HTTP                 HTTP
Method      Mapping                      Request Body         Response Body
----------------------------------------------------------------------------------------
List        GET <collection URL>         N/A                  Resource* list
Get         GET <resource URL>           N/A                  Resource*
Create      POST <collection URL>        Resource             Resource*
Update      PUT or PATCH <resource URL>  Resource             Resource*
Delete      DELETE <resource URL>        N/A                  google.protobuf.Empty**
```

**非常规操作无法用 HTTP Method 映射，通过在 URI 中增加后缀动词区分，例如下面的 :customVerb。**

```sh
https://service.name/v1/some/resource/name:customVerb
```

这也是一个和平常所见不太相同的做法，比较常见的是下面的做法（/customVerb）。
Google 用`:customVerb` 的方式大概是为了避免 customVerb 和 ResourceName 冲突，比如 customVerb 同时是一个特殊的 Resource Name 的时候。

```sh
https://service.name/v1/some/resource/name/customVerb
```

## 是否使用路径参数？

Google 的答案是：**`使用`**。

严格遵循 URI 是资源定位符的定义，只通过 URI 就能定位目标资源。query parameter 和 request body 中的参数只影响 resource 的呈现（representation)。前面提到过，由于比较特殊的 Resource Name 设计，路径参数的捕获方式也比较特殊。

```proto
service LibraryService {
  rpc GetBook(GetBookRequest) returns (Book) {
    option (google.api.http) = {
      //注意看：参数 name 匹配的是字符串 shelves/*/books/* ，而不是一个数值字段
      get: "/v1/{name=shelves/*/books/*}"  
    };
  };
  rpc CreateBook(CreateBookRequest) returns (Book) {
    option (google.api.http) = {
      post: "/v1/{parent=shelves/*}/books"
      body: "book"
    };
  };
}
```

## 是否在 URI 中包含版本号？

Google 的答案是：**`包含`**。

主版本号作为 URI 的前缀，URI 中只包含主版本号，不体现小版本号。

Mark Masse 在 2011 年出版的《REST API Design Rulebook》中提到一个观点：URI 作为 Resource 的标识符号应该唯一的，包含 /V1 /V2 等版本信息会导致一个 Resoruce 有多个标识符，因此建议在 URI 中不包含版本信息。这个观点在实践中比较难采用。

API 一定会变化的，在路径中增加版本前缀带来的便利远远比 URI 唯一重要。
可以把 URI 中的版本前缀看作是 URI 的一部分，而不是 Resource Name 的一部分来保证 Resource Name 的唯一。
Google Design Guide 正是这么做的，下面是 Resource Name 和 URL 的区别：

```sh
# ResourceName 不包含版本号
//calendar.googleapis.com/users/john smith/events/123 
# URL 中包含版本号
https://calendar.googleapis.com/v3/users/john%20smith/events/123   
```

## 是否复用 HTTP 错误状态码？

Google 的答案是：**`复用`**。

HTTP 的错误状态码的数量有限，覆盖不了数量众多的业务逻辑错误。为此，有的项目在实践中全部返回 200 OK，然后在 response body 中用定义一个 status 字段表示相应状态。个人认为这种做法不是很好，会影响到网络中的各种 HTTP 缓存设备的判断。

Google API Design Guide 以及 paypal、stripe 等公司的 REST API 接口设计都印证了这一点，正确的做法是：
**把业务的错误状态映射到有限的 HTTP 错误状态码，然后在 response body 中解释具体的业务错误码和错误详情**。
通用的 rpc 错误码和 HTTP 错误码映射见 [google/rpc/code.proto][9]，Response body 中的 Error Status 定义如下: 

```proto
package google.rpc;

// The `Status` type defines a logical error model that is suitable for
// different programming environments, including REST APIs and RPC APIs.
message Status {
  // A simple error code that can be easily handled by the client. The
  // actual error code is defined by `google.rpc.Code`.
  int32 code = 1;

  // A developer-facing human-readable error message in English. It should
  // both explain the error and offer an actionable resolution to it.
  string message = 2;

  // Additional error information that the client code can use to handle
  // the error, such as retry info or a help link.
  repeated google.protobuf.Any details = 3;
}
```

## 接口定义文件的组织方式?

Google API Design Guide 对接口文件的组织方式也做出要求（针对 protobuf）。

* **按照主版本号分目录，不同版本之间独立**

```sh
container
├── BUILD.bazel
├── README.md
├── v1
│   ├── BUILD.bazel
│   ├── cluster_service.proto
│   ├── container_gapic.yaml
│   ├── container_grpc_service_config.json
│   └── container_v1.yaml
├── v1alpha1
│   ├── BUILD.bazel
│   └── cluster_service.proto
└── v1beta1
    ├── BUILD.bazel
    ├── cluster_service.proto
    ├── container_gapic.yaml
    ├── container_grpc_service_config.json
    └── container_v1beta1.yaml
```

* **重要的内容放在前面，比如接口定义在前，message 定义在后**

```proto
// Manages workspaces.
service Workspaces {
  // List workspaces.
  rpc ListWorkspaces(ListWorkspacesRequest) returns (ListWorkspacesResponse) {
    option (google.api.http) = {
      get: "/v1/{parent=projects/*/locations/*}/workspaces"
    };
  }

  // Get information about a Workspace.
  rpc GetWorkspace(GetWorkspaceRequest) returns (Workspace) {
    option (google.api.http) = {
      get: "/v1/{name=projects/*/locations/*/workspaces/*}"
    };
  }
  ...省略...
}

// Presents a workspace
message Workspace {
  // The Workspace name in the format of "projects/*/locations/*/workspaces/*".
  string name = 1;
}

// Request message for listing Workspaces.
message ListWorkspacesRequest {
  // The parent used for listing. It should have the format of
  // `projects/{number}/locations/{location}`.
  string parent = 1;
  // The page size for list pagination.
  int32 page_size = 2;
  // The page token for list pagination.
  string page_token = 3;
}
...省略...
```

* **共用的 message 可以单独放在 XX_resource.proto/resource.proto 文件**

## 共用的定义怎样放置？

Design Guide 中没有明确说明，参考 [googleapis][6] 中的做法。

* 跨业务共用的定义：单独占用一个顶层目录，例如 googleapis 全局共用定义主要位于以下几个目录：

```sh
google/api  这里目录包含的文件不全是公用的，
            可以公用的主要是用来描述 api 到 rpc 映射关系的 annotation.proto 和 http.proto
google/rpc  response 中公用的 google.rpc.Status，任务状态的 XXInfo 和错误码
google/type 公用的类型定义，Color、Date、DateTime、TimeZone 等
google/geo  一个公用的用四点描述的地理平面空间 google.geo.type.Viewport
```

* 业务内共用的定义：在对应的业务目录下独占一个目录，例如： 

```sh
# actions 业务共用 type 目录
google/actions
├── sdk
│   └── v2
└── type  # actions 中共用的定义
    ├── BUILD.bazel
    ├── date_range.proto
    ├── datetime_range.proto
    └── type_aog.yaml
# analytics 共用 data 目录
google/analytics
├── admin
│   ├── BUILD.bazel
│   ├── v1alpha
│   └── v1beta
└── data
    ├── BUILD.bazel
    ├── v1alpha  # 共用的定义也可以按照版本分目录
    └── v1beta
```

## 常见场景下的接口设计约定

Google API Design Guide 中针对一些比较具体的场景做了约定，有的约定和平常接触的一些做法不同。

* 常用的标准字段集：[Standard fields][12]
* 常见场景的解决方式，比如分页、排序等： [Common design patterns][13]。

### 空白响应 - Empty Responses

Delete 操作执行成功，返回空白响应 google.protobuf.Empty，如果是软删除，返回状态发生更新的 Resource。
其它操作即使没有需要返回的内容也返回 xxxResponse，为未来变化预留空间。

### 区间描述约定 - Representing Ranges

左闭右开：

```sh
[start_key, end_key)
[start_time, end_time)
```

### 用 Labels 描述动态属性 - Resource Labels

```proto
message Book {
  string name = 1;
  map<string, string> labels = 2;
}
```

### 分页设计 - List Pagination

Google API Design Guilde 用 page_token 表示第几页，next_page_token 表示下一页页码。我总感觉 page_num 更合适，英语表达方式的原因么？

```proto
rpc ListBooks(ListBooksRequest) returns (ListBooksResponse);

message ListBooksRequest {
  string parent = 1;
  int32 page_size = 2;
  string page_token = 3;
}

message ListBooksResponse {
  repeated Book books = 1;
  string next_page_token = 2;
  int32  total_size = 3;
}
```

### 异步接口设计 - Long Running Operations

需要较长时间才完成的操作，接口不等待执行结束，直接返回，同时设计一个获取任务状态的方法。如果是 Resource 创建操作，把立即返回的 Resource 标记为未就绪。

### 跨层级查询- List Sub-Collections/Get Unique Resource From Sub-Collection

比如在所有的shelves 中查询某个 book，用 `-` 泛指所有：

```sh
GET https://library.googleapis.com/v1/shelves/-/books?filter=xxx
```

同理，跨层级直接读取 Resource：

```sh
GET https://library.googleapis.com/v1/shelves/-/books/{id}
```
### 结果排序 - Sorting Order

用字段 order_by 描述排序方式，使用 SQL 的语法：

```proto
message ListAlertsRequest {
  ...省略...
  string order_by = 5;
  ...省略...
}
```

SQL 语法描述

```sh
foo desc,bar
foo,bar desc
```

### 仅校验入参，不执行操作 - Request Validation

用字段 validate_only 描述：

```sh
bool validate_only = ...;
```

### 重复请求检测 - Request Duplication

用 request_id 提供请求的唯一 ID：

```sh
string request_id = ...;
```

### 枚举从 0 开始定义，从 1 开始使用 - Enum Default Value
 
```proto
enum Isolation {
  // Not specified.
  ISOLATION_UNSPECIFIED = 0;
  // Reads from a snapshot. Collisions occur if all reads and writes cannot be
  // logically serialized with concurrent transactions.
  SERIALIZABLE = 1;
  // Reads from a snapshot. Collisions occur if concurrent transactions write
  // to the same rows.
  SNAPSHOT = 2;
  ...
}
```

### 避免使用 uint32 和 fixed32 - Integer Types

不同的语言对 uint32 和 fixed32 处理方式可能有区别。

### 只请求部分字段 - Partial Response 

用 fields 字段指定需要返回的字段。

```sh
GET https://library.googleapis.com/v1/shelves?$fields=shelves.name
GET https://library.googleapis.com/v1/shelves/123?$fields=name
```

### 同一资源多种视图 - Resource View

用一个枚举参数指明想要的视图格式，例如下面的 view：

```proto
package google.example.library.v1;

service Library {
  rpc ListBooks(ListBooksRequest) returns (ListBooksResponse) {
    option (google.api.http) = {
      get: "/v1/{name=shelves/*}/books"
    }
  };
}

enum BookView {
  // Not specified, equivalent to BASIC.
  BOOK_VIEW_UNSPECIFIED = 0;

  // Server responses only include author, title, ISBN and unique book ID.
  // The default value.
  BASIC = 1;

  // Full representation of the book is returned in server responses,
  // including contents of the book.
  FULL = 2;
}

message ListBooksRequest {
  string name = 1;

  // Specifies which parts of the book resource should be returned
  // in the response.
  BookView view = 2;
}
```

### ETags

遵循 ETags 定义即可。

### 标记由服务端赋值的字段 - Output Fields

Google 用 google.api.field_behavior 来标记字段是输入赋值还是输出赋值:

```proto
import "google/api/field_behavior.proto";

message Book {
  string name = 1;
  Timestamp create_time = 2 [(google.api.field_behavior) = OUTPUT_ONLY];
}
```

### 默认存在的资源 - Singleton Resources

默认存在的 Singleton Resources 不需要 Create 和 Delete 方法，它们更像是 parent 的可配置的属性。

```proto
rpc GetSettings(GetSettingsRequest) returns (Settings) {
  option (google.api.http) = {
    get: "/v1/{name=users/*/settings}"
  };
}

rpc UpdateSettings(UpdateSettingsRequest) returns (Settings) {
  option (google.api.http) = {
    patch: "/v1/{settings.name=users/*/settings}"
    body: "settings"
  };
}

[...]

message Settings {
  string name = 1;
  // Settings fields omitted.
}

message GetSettingsRequest {
  string name = 1;
}

message UpdateSettingsRequest {
  Settings settings = 1;
  // Field mask to support partial updates.
  FieldMask update_mask = 2;
}
```

### 客户端主动断开 -  Streaming Half-Close

双向数据的通信连接或者 client 发起的长连接，连接断开时由客户端主动发起 half-close，不需要专门定义一个关闭连接的 message。


### 用带有域名的 Resource Name 避免跨组织合作时命名冲突 - Domain-scoped names

定义的 Resourcce 时带上所在组织的域名。Domain-scoped names are widely used among Google APIs and Kubernetes APIs, such as:

* The Protobuf Any type representation: type.googleapis.com/google.protobuf.Any
* Stackdriver metric types: compute.googleapis.com/instance/cpu/utilization
* Label keys: cloud.googleapis.com/location
* Kubernetes API versions: networking.k8s.io/v1
* The kind field in the x-kubernetes-group-version-kind OpenAPI extension.

### 多值参数怎么选类型？ Bool、Enum 还是 String ？

* Using bool type if we want to have a fixed design and intentionally don't want to extend the functionality. For example, bool enable_tracing or bool enable_pretty_print.
* Using an enum type if we want to have a flexible design but don't expect the design will change often. The rule of thumb is the enum definition will only change once a year or less often. For example, enum TlsVersion or enum HttpVersion.
* Using string type if we have an open ended design or the design can be changed frequently by an external standard. The supported values must be clearly documented. For example:

string region_code as defined by Unicode regions.

string language_code as defined by Unicode locales.

### 被删数据的保留期限 - Data Retention

被删除的资源需要根据情况保留 30 天, 7 天，1天。

* For user metadata, user settings, and other important information, there should be 30-day data retention. For example, monitoring metrics, project metadata, and service definitions.
* For large-volume user content, there should be 7-day data retention. For example, binary blobs and database tables.
* For transient state or expensive storage, there should be 1-day data retention if feasible. For example, memcache instances and Redis servers.

### Payloads 上限 - Large Payloads

Request body 和 Response body 不超过 32 MB。32MB is a commonly used limit in many systems.

如果数据量超过 10MB，考虑是否要写入对象存储，通过连接传递数据。

### 区分 empty value 和 unset value - Optional Primitive Fields

用 protobuf 3 中 optional 字段。

## 其它便捷操作

### 怎么避免用两套文件分别描述 API 接口和 RPC 接口？

Google 通过自身平台的 [Transcoding HTTP/JSON to gRPC][14] 能力，能够用一套 protobuf 文件同时描述 API 接口和 RPC 接口。
Google 的 Extensible Service Proxy 能够识别 protobuf 文件中用 option 描述的 API 接口和 RPC 接口的映射关系，自动将收到的 HTTP 请求转换为 RPC 请求，不需要再单独定义 API 接口。

如果不使用 google cloud，需要自行寻找解决方法。
[Transcoding HTTP/JSON to gRPC][14] 和 [google/api/http.proto][7] 介绍了 Google 采用的映射描述方法，样式如下：

```proto
// Get information about a Workspace.
rpc GetWorkspace(GetWorkspaceRequest) returns (Workspace) {
  option (google.api.http) = {
    get: "/v1/{name=projects/*/locations/*/workspaces/*}"
  };
}

// Create a Workspace.
rpc CreateWorkspace(CreateWorkspaceRequest) returns (Workspace) {
  option (google.api.http) = {
    post: "/v1/{parent=projects/*/locations/*}/workspaces"
    body: "workspace"
  };
}

// Updates a Workspace.
rpc UpdateWorkspace(UpdateWorkspaceRequest) returns (Workspace) {
  option (google.api.http) = {
    patch: "/v1/{name=projects/*/locations/*/Workspaces/*}"
    body: "workspace"
  };
}

// Deletes a Workspace.
rpc DeleteWorkspace(DeleteWorkspaceRequest) returns (google.protobuf.Empty) {
  option (google.api.http) = {
    delete: "/v1/{name=projects/*/locations/*/workspaces/*}"
  };
}
```

### 怎样自动生成 API 接口的代码文件？

不同的 http 框架的代码不同，没有统一的解决方案，目标框架应当提供相应的代码生成工具，或者利用 protoc 的 `--plugin=` 功能自我实现。目标框架的代码生成工具如果能够识别 [Transcoding HTTP/JSON to gRPC][14] 使用的 option 注解，可以避免再写一份 API 接口描述文件。

### 怎样导入 API 网关？


Google 是借助于 glcoud 平台的 Service Management API 来实现 HTTP API 的转换。[google/example/endpointsapis][8] 是一个演示 demo。

用 protoc 生成文件 service.descriptors:

```sh
cd googleapis/google/example/endpointsapis
protoc --proto_path=`pwd`/../../../ --include_imports --descriptor_set_out=service.descriptors google/example/endpointsapis/v1/workspace.proto
```

然后和配置文件 endpointsapis.yaml 一起上传：

```sh
gcloud endpoints services deploy service.descriptors endpointsapis.yaml
```


## 参考

1. [李佶澳的博客][1]
2. [Google API Design Guide][2]
3. [Google API Explorer][3]
4. [Google Calendar API][4]
5. [Blogger API v3][5]
6. [Google APIs][6]
7. [googleapis/google/api/http.proto][7]
8. [google/example/endpointsapis][8]
9. [google/rpc/code.proto][9]
10. [Naming conventions][10]
11. [Why not use resource IDs to identify a resource?][11]
12. [Standard fields][12]
13. [Common design patterns][13]
14. [Transcoding HTTP/JSON to gRPC][14]
15. [Google: API Improvement Proposals][15]
16. [Google API Linter][16]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://cloud.google.com/apis/design?hl=en "Google API Design Guide"
[3]: https://developers.google.com/apis-explorer "Google API Explorer"
[4]: https://developers.google.com/calendar/v3/reference/ "Google Calendar API"
[5]: https://developers.google.com/blogger/docs/3.0/reference/ "Blogger API v3"
[6]: https://github.com/googleapis/googleapis "Google APIs"
[7]: https://github.com/googleapis/googleapis/blob/master/google/api/http.proto#L44 "googleapis/google/api/http.proto"
[8]: https://github.com/googleapis/googleapis/tree/master/google/example/endpointsapis "google/example/endpointsapis"
[9]: https://github.com/googleapis/googleapis/blob/master/google/rpc/code.proto "google/rpc/code.proto"
[10]: https://cloud.google.com/apis/design/naming_convention?hl=en "Naming conventions"
[11]: https://cloud.google.com/apis/design/resource_names?hl=en#q_why_not_use_resource_ids_to_identify_a_resource "Why not use resource IDs to identify a resource?"
[12]: https://cloud.google.com/apis/design/standard_fields?hl=en "Standard fields"
[13]: https://cloud.google.com/apis/design/design_patterns?hl=en "Common design patterns"
[14]: https://cloud.google.com/endpoints/docs/grpc/transcoding?hl=en "Transcoding HTTP/JSON to gRPC"
[15]: https://google.aip.dev/ "Google: API Improvement Proposals"
[16]: https://linter.aip.dev/ "Google API Linter"
