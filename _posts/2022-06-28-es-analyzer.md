---
layout: default
title: "ElasticSearch 零基础入门（4）: 分词器 Analyzer 和 Normalizers 等功能"
author: 李佶澳
date: "2022-06-28 16:07:49 +0800"
last_modified_at: "2022-07-04 11:40:24 +0800"
categories: 项目
cover:
tags: ElasticSearch
keywords: ElasticSearch,es
description: "Analyzer 必须有且只有一个 Tokenizer，可以有零个或任意多个 Character filters、Token filter"
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

笔记列表：[ElasticSearch](/tags/all.html#ElasticSearch)

## Analyzer

ES 分词器功能用于 text 类型的 field，分词效果和全文检索的结果相关。

ES 内置了多个分词器 [Built-in analyzer][4]，并且支持自定义分词起 [Create a custom analyzer][5]。

Analyzer 由三部分组成，分别负责前、中、后三个阶段的文本处理，[Anatomy of an analyzer][3]：

```sh
1. Character filter：字符过滤，用于移除不需要的字符（比如 html 标签）、字符转换等（比如印度语的数字转换成阿拉伯数字）
2. Tokenizer：断词，将连续的文本字符断开成多个独立的词，并记录每个词开头和结尾的位置
3. Token filter：词过滤，将 Tokenizer 的断词进行规整处理，比如全部转为消息、同义词合并、舍弃 the 等 stop word。过滤不改变 Tokenizer 记录的词的位置
```

Analyzer 必须有且只有一个 [Tokenizer][7]，可以有零个或任意多个 [Character filters][6]、[Token filter][8]。

### Analyzer 作用时机

Analyzer 的工作场合由两个：
1. 当文档被索引的时候，对应 text 类型的 field 进行分词处理，用到的 Analyzer 被称为 Index Analyzer；
2. 对 text 类型的 field 进行全文检索的时候，对输入的查询字符串进行分词，用到的 Analyzer 被称为 Search Analyzer 。

通常情况下，Index Analyzer 应当和 Search Analyzer 保持一致，但是 es 支持:

1、在搜索时指定不同的 Analyzer 

```sh
GET my-index-000001/_search
{
  "query": {
    "match": {
      "message": {
        "query": "Quick foxes",
        "analyzer": "stop"      <-- Query时指定 Search Analyzer
      }
    }
  }
}
```

2、在 mapping 中分别定义 field 的 Index Analyzer 和 Search Analyzer。
```sh
PUT my-index-000001
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "whitespace",     <-- Index Analyzer
        "search_analyzer": "simple"   <-- Search Analyzer
      }
    }
  }
}
```

3、在 setting 中分别定义默认的 Index Analyzer 和 Search Analyzer
```sh
PUT my-index-000001
{
  "settings": {
    "analysis": {
      "analyzer": {
        "default": {          <-- 默认的 Index Analyzer
          "type": "simple"
        },
        "default_search": {   <-- 默认的 Search Analyzer
          "type": "whitespace"
        }
      }
    }
  }
}
```

### Stemmer token filters

英文单词在不同的语境下会变形成不同的字符，譬如 walk、walking、walked 等。在 Index 以及 Search 的时候需要这些变形词转换成统一的根词（root form）。ES 把这个过程叫做 [Stemming][9]，相应的 filter 称为 [Stemmer token filter][10]。

### Token graphs 

[Token graphs][11] 详细解释了 Token 的记录方式，这里不展开。

## Analyzer 配置和使用

[Configure text analysis][12] 介绍了 Analyzer 的使用和配置方法

###  Analyze API 验证 Analyzer

ES 提供了 [Analyze API][13]，可以直接用它直接验证 ES 内置的分词器的效果，[Built-in analyzer reference][4]。不过，ES 内置的分词器都不适用于中文，比如 "standard" analyzer 将每个汉字认为是一个词，不符合中文语法。内置的 30 多个不同语种的 [Language analyzers][14] 中没有中文。对中文分词需要另外安装开源社区提供的中文分词插件。

下面是 ES 内置的常规分词器，执行后会发现对中文基本无效：

```sh
GET /_analyze
{
  "analyzer" : "standard",
  "text" : "那年冬天，祖母死了，父亲的差使也交卸了，正是祸不单行的日子。我从北京到徐州，打算跟着父亲奔丧回家。到徐州见着父亲，看见满院狼藉的东西，又想起祖母，不禁簌簌地流下眼泪。父亲说：“事已如此，不必难过，好在天无绝人之路！"
}

GET /_analyze
{
  "analyzer" : "simple",
  "text" : "那年冬天，祖母死了，父亲的差使也交卸了，正是祸不单行的日子。我从北京到徐州，打算跟着父亲奔丧回家。到徐州见着父亲，看见满院狼藉的东西，又想起祖母，不禁簌簌地流下眼泪。父亲说：“事已如此，不必难过，好在天无绝人之路！"
}

GET /_analyze
{
  "analyzer" : "whitespace",
  "text" : "那年冬天，祖母死了，父亲的差使也交卸了，正是祸不单行的日子。我从北京到徐州，打算跟着父亲奔丧回家。到徐州见着父亲，看见满院狼藉的东西，又想起祖母，不禁簌簌地流下眼泪。父亲说：“事已如此，不必难过，好在天无绝人之路！"
}

GET /_analyze
{
  "analyzer" : "stop",
  "text" : "那年冬天，祖母死了，父亲的差使也交卸了，正是祸不单行的日子。我从北京到徐州，打算跟着父亲奔丧回家。到徐州见着父亲，看见满院狼藉的东西，又想起祖母，不禁簌簌地流下眼泪。父亲说：“事已如此，不必难过，好在天无绝人之路！"
}

GET /_analyze
{
  "analyzer" : "keyword",
  "text" : "那年冬天，祖母死了，父亲的差使也交卸了，正是祸不单行的日子。我从北京到徐州，打算跟着父亲奔丧回家。到徐州见着父亲，看见满院狼藉的东西，又想起祖母，不禁簌簌地流下眼泪。父亲说：“事已如此，不必难过，好在天无绝人之路！"
}

GET /_analyze
{
  "analyzer" : "pattern",
  "text" : "那年冬天，祖母死了，父亲的差使也交卸了，正是祸不单行的日子。我从北京到徐州，打算跟着父亲奔丧回家。到徐州见着父亲，看见满院狼藉的东西，又想起祖母，不禁簌簌地流下眼泪。父亲说：“事已如此，不必难过，好在天无绝人之路！"
}

GET /_analyze
{
  "analyzer" : "fingerprint",
  "text" : "那年冬天，祖母死了，父亲的差使也交卸了，正是祸不单行的日子。我从北京到徐州，打算跟着父亲奔丧回家。到徐州见着父亲，看见满院狼藉的东西，又想起祖母，不禁簌簌地流下眼泪。父亲说：“事已如此，不必难过，好在天无绝人之路！"
}
```

### Analyzer 参数 

每个 Analyzer 有各自的可配置参数，可以通过这些参数影响 Analyzer 的分词行为，详情见各个 Analyzer 的文档 [Built-in analyzer reference][4]。

### Analyzer 自定义 

这里的自定义 Analyzer 是指在 Index 的 setting 中自行组合 charater fileter、tokenizer（有且只有一个） 和 token fileter 形成一个 Analyzer，[Create a custom analyzer][15]。

```sh
PUT my-index-000001
{
  "settings": {
    "analysis": {
      "analyzer": {
        "my_custom_analyzer": {    <-- 自定义的 Analyzer
          "type": "custom", 
          "tokenizer": "standard", <-- tokenizer
          "char_filter": [         <-- character  filter
            "html_strip"
          ],
          "filter": [              <-- token filter
            "lowercase",
            "asciifolding"
          ]
        }
      }
    }
  }
}
```

下面是可用于搭配  Analyzer 的组件的索引：

* [Character filters reference][6]
* [Tokenizer reference][7]
* [Token filter reference][8]

### Analyzer 的引用

前面已经讲过，Analyzer 用于 Index 和 Search 两个过程，分别可以 Search 参数、Index 的 mapping 和 Index 的 Setting 中引用。这里不赘述，见前面的内容或者阅读 [Specify an analyzer][16]。


## Normalizer

[Normalizers][17] 可以理解成不含 tokenizer 的 Analyzer，它的作用是将输入的文本加工成一个 token，只做字符处理不进行分词。

```sh
PUT index
{
  "settings": {
    "analysis": {
      "char_filter": {
        "quote": {
          "type": "mapping",
          "mappings": [
            "« => \"",
            "» => \""
          ]
        }
      },
      "normalizer": {      
        "my_normalizer": {  <-- 定义 normalizer
          "type": "custom",
          "char_filter": ["quote"],
          "filter": ["lowercase", "asciifolding"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "foo": {
        "type": "keyword",
        "normalizer": "my_normalizer"  <-- 引用 normalizer
      }
    }
  }
}
```

## 第三方插件

### ik 中文分词器

用 es 的 `elasticsearch-plugin` 命令安装，注意插件的版本需要和 es 的版本一致，否则暗转不上。比如 v7.9.2 的 es 安装对应 v7.9.2 版本的 ik 插件 [elasticsearch-analysis-ik](https://github.com/medcl/elasticsearch-analysis-ik)。

ik 分词器维护者[曾勇](https://medcl.com/about/)目前负责 es 在中国区的顾问资讯业务， ik 更新比较及时，[ik插件release下载](https://github.com/medcl/elasticsearch-analysis-ik/releases)。


```sh
./bin/elasticsearch-plugin -v install https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v7.9.2/elasticsearch-analysis-ik-7.9.2.zip
```

查看已安装插件：

```sh
./bin/elasticsearch-plugin  list
analysis-ik
```

插件安装完成后需要重启 es。

ik 提供了 `ik_max_word` 和 `ik_smart` 两种分词模式，前者分词时会组合出尽可能多的词，后者进行粗粒度的分词。

```sh
GET /_analyze
{
  "analyzer" : "ik_max_word",
  "text" : ["你这是画龙点睛"]
}
GET /_analyze
{
  "analyzer" : "ik_smart",
  "text" : ["你这是画龙点睛"]
}
```

### elasticsearch-thulac-plugin

清华大学自然语言处理与社会人文计算实验室开发的 [THULAC][20] 分词包也可以用于 es：[elasticsearch-thulac-plugin][19]。

这个插件的维护有点跟不上，es 版本已经到 8.2 ，thulac 的分词插件才更新到 7.9.1。

不过分词程序包可以从 [THULAC][20] 下载使用，主观感觉 thulac 的分词效果比 ik 要好，thulac 还能给出词性。

## 参考

1. [李佶澳的博客][1]
2. [ES Text Analysis][2]
3. [Anatomy of an analyzer][3]
4. [Built-in analyzer reference][4]
5. [Create a custom analyzer][5]
6. [Character filters reference][6]
7. [Tokenizer reference][7]
8. [Token filter reference][8]
9. [Stemming][9]
10. [Stemmer token filters][10]
11. [Token graphs][11]
12. [Configure text analysis][12]
13. [Analyze API][13]
14. [Language analyzers][14]
15. [Create a custom analyzer][15]
16. [Specify an analyzer][16]
17. [Normalizers][17]
18. [ik中文分词器][18]
19. [elasticsearch-thulac-plugin][19]
20. [THULAC：一个高效的中文词法分析工具包][20]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis.html  "ES Text Analysis"
[3]: https://www.elastic.co/guide/en/elasticsearch/reference/current/analyzer-anatomy.html  "Anatomy of an analyzer"
[4]: https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-analyzers.html "Built-in analyzer reference"
[5]: https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-custom-analyzer.html "Create a custom analyzer"
[6]: https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-charfilters.html "Character filters reference"
[7]: https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-tokenizers.html "Tokenizer reference"
[8]: https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-tokenfilters.html "Token filter reference"
[9]: https://www.elastic.co/guide/en/elasticsearch/reference/current/stemming.html "Stemming"
[10]: https://www.elastic.co/guide/en/elasticsearch/reference/current/stemming.html#stemmer-token-filters "Stemmer token filters"
[11]: https://www.elastic.co/guide/en/elasticsearch/reference/current/token-graphs.html "Token graphs"
[12]: https://www.elastic.co/guide/en/elasticsearch/reference/current/configure-text-analysis.html "Configure text analysis"
[13]: https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-analyze.html "Analyze API"
[14]: https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-lang-analyzer.html "Language analyzers"
[15]: https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-custom-analyzer.html "Create a custom analyzer"
[16]: https://www.elastic.co/guide/en/elasticsearch/reference/current/specify-analyzer.html "Specify an analyzer"
[17]: https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-normalizers.html "Normalizers"
[18]: https://segmentfault.com/a/1190000039854381 "ik中文分词器"
[19]: https://github.com/microbun/elasticsearch-thulac-plugin "elasticsearch-thulac-plugin"
[20]: http://thulac.thunlp.org/ "THULAC：一个高效的中文词法分析工具包"
