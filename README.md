# 个人博客（Jekyll）

三列布局：左栏入口（简介 / 作品 / 文章 / 笔记）→ 中栏目录（工作经历 / 作品列表 / 文章列表 / 笔记目录）→ 右侧正文。中栏可拖拽调宽。

每个 collection 是独立页面；作品为网格 + 详情页，文章 / 笔记首页为标签云 + 按年归档列表（可用 hash 深链，如 `#设计`）。

> 另有一条**按需触发**的规则：只有明确说「投稿到 kecology.com」时，才走[投稿规则](#投稿到-kecologycom只在明确说到时触发)。没说这句话，文章只写在本仓库。

## 本地运行

```bash
bundle install
bundle exec jekyll serve
# 浏览器打开 http://localhost:4000
```

## 你要改的地方

| 想改什么 | 改哪里 |
| --- | --- |
| 姓名、邮箱、地点 | `_config.yml` → `author` |
| 左栏入口 | `_data/rail.yml`（`url` 或 `collection` + `label` / `icon`） |
| 左栏图标 | `_includes/icons/*.svg`（按图形语义命名，如 `icon: grid` → `grid.svg`） |
| 工作状态 / 自我评价 | `_data/experience.yml`（`self_evaluation`、`timeline`，`org` 为数组） |
| 作品 | `_works/` 下 Markdown（含 front matter） |
| 正式文章 | `_posts/` |
| 笔记 / 碎片 | `_notes/` |

文件名建议 `YYYY-MM-DD-标题.md`，front matter 参考现有文件。文章 / 笔记的标签写在 front matter 即可出现在标签云里：

```yaml
tags: ["设计", "产品", "方法论"]
```

### 页面入口

| 页面 | URL | 文件 |
| --- | --- | --- |
| 简介（首页） | `/` | `index.md` |
| 文章 | `/posts/` | `pages/posts.md` |
| 作品 | `/works/` | `pages/works.md` |
| 笔记 | `/notes/` | `pages/notes.md` |
文章 / 笔记列表由 `_includes/collection-list.html` 渲染；作品网格写在 `pages/works.md`；作品详情 layout 为 `_layouts/work.html`。

### 作品 front matter 要点

```yaml
title: "作品标题"            # 详情页文章标题
name: "产品名"              # 产品名；work-hero 主品牌
description: "一句话定位"   # slogan；列表卡与 work-hero
date: 2025-03-01
tags: ["标签1", "标签2"]
status: "正在运营"
link: "https://..."         # 可选
type: "App"
link_label: "App Store 下载" # 可选
palette: "mint"             # 可选：mint|coral|sky|sunset；不填则按列表顺序轮替
```

## 部署

- **GitHub Pages**：推送仓库后在 Settings → Pages 选分支；把 `_config.yml` 的 `url` 改成实际地址。
- **其他静态托管**：`jekyll build`，上传 `_site/`。

## 结构一览

```
├── _config.yml
├── _data/experience.yml # 工作经历
├── _layouts/            # default / post / note / work
├── _includes/           # rail / catalog / collection-list / ad-sidebar …
├── _posts/              # 文章
├── _notes/              # 笔记
├── _works/              # 作品详情
├── pages/               # posts / notes / works / index
├── assets/css/main.scss
├── assets/js/main.js    # 标签云、related、目录拖拽、联系我
└── index.md             # 简介首页
```

## 投稿到 kecology.com（只在明确说到时触发）

### 触发条件

只有用户**明确说出「投稿到 kecology.com」**（或「投到 kecology」）时才执行本节。没说这句话，任何文章都只写进本仓库 `_posts/`，不要动 kecology.com。

### 1. 文件落在这个目录

```
/Users/lijiao/WorkSpace/MyBlog/kecology.com
```

### 2. 按该站格式建两样东西

**① 文章页** `_posts/YYYY-MM-DD-english-slug.md`：

```yaml
---
layout: post
date: "2026-11-16 15:00:00 +0800"
categories: "blog"
permalink: /blog/english-slug
i18n: true
title: "English title"
description: "English description"
---

{% assign i18n_data = site.data.i18n['english-slug'][page.lang] %}
{% if i18n_data == nil %}
  {% assign i18n_data = site.data.i18n['english-slug']['en'] %}
{% endif %}

{% if i18n_data.body %}
{{ i18n_data.body | markdownify }}
{% endif %}
```

**② 正文** `_data/i18n/<english-slug>/<lang>.yml`，一个语言一个文件：

```yaml
title: "..."
description: "..."
body: |
  第一段

  第二段
```

- 语言清单以 `_config.yml` 的 `languages` 为准（当前 17 种：en、zh-CN、zh-TW、es、ar、id、pt、fr、ja、ru、de、ko、tr、th、vi、hi、it，默认 en）。**每种语言都要有 `title` / `description` / `body`**，缺一个，那个语种的页面就是空的。
- 封面图可选，放了按 `/assets/img/blog/<slug>/cover-<lang>.jpg` 命名。

### 3. 标题和内容要改写成「向海外读者介绍」，不是直译

kecology.com 是多语言站，读者是**不在中国生活的海外人群**。原文可以留着中国视角，投过去的版本必须换个写法：

- **标题**：用英文起，先回答「一个不在中国的人为什么要读这篇」。别用「XX 之后，我看懂了 XX」这种公众号式标题，把公司名、行业、结论说清楚，能自解释。
- **内容**：默认读者不知道美团、小象超市、前置仓、拼多多工厂店、社区团购是什么。第一次出现给一句解释，必要时用类比落地（比如「相当于中国的 DoorDash + Instacart」）。
- **降门槛**：人民币金额附美元大致换算；别用「三线城市」这类内部坐标，换成人均收入或具体城市；不出现只有国内读者懂的梗、缩写和平台黑话。
- **别稀释观点**：论证、判断、结论照旧，只换表达和补背景。不要为了「国际化」写成一碗行业综述。

### 4. 翻译不许有 AI 腔、翻译腔

每种语言都要像**母语者写的**，不是中文句子的逐句搬运：

- 先按目标语言重组句子，该拆的拆、该合的合。中文的短句节奏不能照搬——英文里连续一串 8 词短句读起来像诗，日文里会莫名生硬。
- 英文避开 AI 高频词：delve、foster、landscape、testament、crucial、seamless、navigate the complexities、"it's not just X, it's Y"、破折号成串、每段都用 Moreover / Furthermore 开头。
- 术语全文统一：小象超市 = Xiaoxiang Supermarket（首次出现补一句 Meituan's grocery chain）；前置仓 = front warehouse 或 dark store（选一个，不改）；即时零售 = instant retail。
- 交稿前自查三件事：有没有「中文语序 + 外语单词」的句子；有没有为凑字数加的形容词；读出来像不像当地媒体会写的句子。
