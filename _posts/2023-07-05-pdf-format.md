---
layout: default
title: "PDF 文件格式简单了解"
author: 李佶澳
date: "2023-07-05 15:42:37 +0800"
last_modified_at: "2023-07-07 14:55:55 +0800"
categories: 编程
cover:
tags: pdf
keywords:
description: "PDF 文件由四部分组成：header 占据第一行的; body 包含 objects；cross-reference table 索引 objects，便于随机访问 objects；trailer 记录 cross-reference table 以及一些特殊 object 在文件中的位置，用于快速读取"
---

## 目录

* auto-gen TOC:
{:toc}

## File Structure

PDF 文件由四部分组成：

* header：占据第一行的 
* body：所有的 objects 
* cross-reference table：索引 objects 的位置，便于随机访问 objects
* trailer：提供 cross-reference table 以及一些特殊 object 在文件中的位置，用于快速读取

### cross-reference table 

1.5 版本后可以是 Cross-Reference Streams 格式。

```sh
xref                   //cross-reference 以 xref 开始
0 20                   //包含的 object 起始编号以及 object 数量，这里是 object0~object19
0000000000 65535 f     //第一列数字是在文件中的offset，第二列数字是版本号，第三列是标记是否使用（n为使用，f为free）
0000000384 00000 n 
0000003616 00000 n 
0000000022 00000 n 
0000000494 00000 n 
0000003302 00000 n 
0000003849 00000 n 
0000003807 00000 n
0000000590 00000 n 
0000003390 00000 n 
0000003337 00000 n 
0000003474 00000 n 
0000003545 00000 n 
0000003705 00000 n 
0000004409 00000 n 
0000004001 00000 n 
0000004619 00000 n 
0000004737 00000 n 
0000004995 00000 n 
0000007024 00000 n 
```

所有未使用的 objects 会被连接成 list，xref 中第一行 `0000000000 65535 f` 是空闲 object list 的启始。

### file trailer

软件读取 pdf 文件时，先从文件尾部读取 file trailer 获取文档 Root 以及 cross-reference table 的位置 

```sh
trailer
<< /Size 20 /Root 13 0 R /Info 19 0 R /ID [ <c3921cfa232b383089c7c8b35f8bc421>
<c3921cfa232b383089c7c8b35f8bc421> ] >>
startxref
7384
%%EOF   
```

* Size 20：一共有 20 个 object
* Root 13 0 R：文档结构位于 object 13
* Info 19 0 R：文档信息位于 object 19

## Document Structure（objects 的层级结构）

Body 中 objects 是平铺列出的，需要按照树形结构从 /Root 开始逐级解读。

从 trailer 获知 /Root 对应 Object13：

```sh
trailer
<< /Size 20 /Root 13 0 R /Info 19 0 R /ID [ <c3921cfa232b383089c7c8b35f8bc421>
<c3921cfa232b383089c7c8b35f8bc421> ] >>
startxref
7384
%%EOF   
```

Object13 是一个 /Catalog，得知 Pages 位于 Object2：

```sh
13 0 obj
<< /Type /Catalog /Pages 2 0 R /MarkInfo << /Marked true >> /StructTreeRoot                                             
10 0 R >>
endobj
```

Object2 表示只有 1 个页面，位于 Object1：

```sh
2 0 obj
<< /Type /Pages /MediaBox [0 0 595.28 841.89] /Count 1 /Kids [ 1 0 R ] >>
endobj
```

Object1 表示 Page 的 Resources 和 Contents 分别位于 Object4 和 Object3

```sh
1 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /Contents 3 0 R /MediaBox [0 0 595.28 841.89]
>>
endobj
```

Object3 内容：

```sh
3 0 obj
<< /Filter /FlateDecode /Length 290 >>
stream
x^A<95>PMkÃ0^L½çW¼ãv<98>#+¶cC|  ¬i^O;^TVfØe<97>6k^X#)ËÚÁ~þä~Ðv<8c>A1B<92>y<92>Þ{^Cæ^X@òl°<8a>=¼ÑÊ^G|®ð<8c>5òz£Ñl woÓ^Hî^@èeÀ^]<9b>.5Ù^])M!xkÐ|  ð¢}C<8b>ü^Q£^QòYý0<91>uU<85>ñ¤Þ<9d>·¬¼á e<8b>²:8^Oã¥
<86>Q²^T\<9a>ì^W¡Ä<98> <84>^FY<95>J^YvÊ^E^N2S²
E)Ä{<8c>#ô^A°O±Ïò:É<89>-FDÜ^PQAdZ"Ë^RAj¿ÿc'õRB0VK6^Uâ;¦QHçO^_<8b>u<96>äÜ7Û¯E^WWß[Ü¼<90>æÛ£²k<98><89>pG^A<94>Å^<?Ñ£âtr:«<91>âÜFþï<98>^X<92>lÈþ¶áüNãZ­<97>¯d^WNÔ[qcE~i/oÏ^?^@<9c>%y^]
endstream
endobj
```

## Object

* Boolean
* Number
* String
* Name
* Array
* Dictionary
* Stream
* Null

## Character Set

PDF 支持字符集分为三类：

* white-space 空白字符，有且仅有：0x00/Null 0x09/Tab 0x0A/LF 0x0C/FF 0x0D/CR 0x20/SP
* delimiter 分隔字符，有且仅有：( ) < > [ ] { } / %
* regular 常规字符，剩余字符为常规字符

## 参考

1. [李佶澳的博客][1]
2. [Portable document format — Part 1: PDF 1.7][2]
3. [PDF reference : Adobe portable document format version 1.4 / Adobe System][3]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.adobe.com/content/dam/acom/en/devnet/pdf/pdfs/PDF32000_2008.pdf "Portable document format — Part 1: PDF 1.7"
[3]: https://www.adobe.com/content/dam/acom/en/devnet/pdf/pdfs/pdf_reference_archives/PDFReference.pdf "PDF reference : Adobe portable document format version 1.4 / Adobe System"
