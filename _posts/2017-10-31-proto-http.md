---
layout: default
title: HTTP协议要点记录
author: 李佶澳
createdate: 2017/10/31 11:33:09
changedate: 2017/11/02 16:44:08
categories: 编程
tags: protocol
keywords: HTTP协议,http,rfc
description: Http是最重要的应用层协议。

---

* auto-gen TOC:
{:toc}

## 说明

Http是最重要的应用层协议。

这里记录一些常用的要点，更多内容查看[HTTP协议的RFC文档][1]

## Response Status Codes

来自[RFC7231-HTTP-1.1-Semantics-and-Content][2]。lib库中一般都定义了这些Status Codes，例如[golang的net/http][3]。

	6. Response Status Codes ..........................................47
	      6.1. Overview of Status Codes ..................................48
	      6.2. Informational 1xx .........................................50
	           6.2.1. 100 Continue .......................................50
	           6.2.2. 101 Switching Protocols ............................50
	      6.3. Successful 2xx ............................................51
	           6.3.1. 200 OK .............................................51
	           6.3.2. 201 Created ........................................52
	           6.3.3. 202 Accepted .......................................52
	           6.3.4. 203 Non-Authoritative Information ..................52
	           6.3.5. 204 No Content .....................................53
	           6.3.6. 205 Reset Content ..................................53
	      6.4. Redirection 3xx ...........................................54
	           6.4.1. 300 Multiple Choices ...............................55
	           6.4.2. 301 Moved Permanently ..............................56
	           6.4.3. 302 Found ..........................................56
	           6.4.4. 303 See Other ......................................57
	           6.4.5. 305 Use Proxy ......................................58
	           6.4.6. 306 (Unused) .......................................58
	           6.4.7. 307 Temporary Redirect .............................58
	      6.5. Client Error 4xx ..........................................58
	           6.5.1. 400 Bad Request ....................................58
	           6.5.2. 402 Payment Required ...............................59
	           6.5.3. 403 Forbidden ......................................59
	           6.5.4. 404 Not Found ......................................59
	           6.5.5. 405 Method Not Allowed .............................59
	           6.5.6. 406 Not Acceptable .................................60
	           6.5.7. 408 Request Timeout ................................60
	           6.5.8. 409 Conflict .......................................60
	           6.5.9. 410 Gone ...........................................60
	           6.5.10. 411 Length Required ...............................61
	           6.5.11. 413 Payload Too Large .............................61
	           6.5.12. 414 URI Too Long ..................................61
	           6.5.13. 415 Unsupported Media Type ........................62
	           6.5.14. 417 Expectation Failed ............................62
	           6.5.15. 426 Upgrade Required ..............................62
	      6.6. Server Error 5xx ..........................................62
	           6.6.1. 500 Internal Server Error ..........................63
	           6.6.2. 501 Not Implemented ................................63
	           6.6.3. 502 Bad Gateway ....................................63
	           6.6.4. 503 Service Unavailable ............................63
	           6.6.5. 504 Gateway Timeout ................................63
	      6.6.6. 505 HTTP Version Not Supported .....................64

## 参考

1. [HTTP协议的RFC文档][1]
2. [RFC7231-HTTP-1.1-Semantics-and-Content][2]
3. [golang的net/http中status code][3]

[1]: https://github.com/lijiaocn/Material/tree/master/RFC  "HTTP协议的RFC文档" 
[2]: https://github.com/lijiaocn/Material/blob/master/RFC/rfc7231-HTTP-1.1-Semantics-and-Content.txt "RFC7231-HTTP-1.1-Semantics-and-Content"
[3]: http://golang.org/pkg/net/http/#pkg-constants "golang的net/http中status code"
