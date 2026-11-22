# 个人博客（Jekyll）

三列布局：左栏入口（简介 / 作品 / 文章 / 笔记）→ 中栏目录（工作经历 / 作品列表 / 文章列表 / 笔记目录）→ 右侧正文。中栏可拖拽调宽、一键收起。

每个 collection 是独立页面；作品为网格 + 详情页，文章 / 笔记首页为标签云 + 按年归档列表（可用 hash 深链，如 `#设计`）。

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
title: "作品名称"
tagline: "一句话定位"      # 列表卡用；详情页不展示
year: "2025"
type: "App"
role: "设计 & 开发"
status: "正在运营"
link: "https://..."        # 可选；有则详情 hero 右下角 CTA
link_label: "App Store 下载" # 可选
icon: "✦"
from: "#4f46e5"
to: "#7c3aed"
featured: true
date: 2025-03-01
tags: ["标签1", "标签2"]
```

## 部署

- **GitHub Pages**：推送仓库后在 Settings → Pages 选分支；把 `_config.yml` 的 `url` 改成实际地址。
- **其他静态托管**：`jekyll build`，上传 `_site/`。

## 结构一览

```
├── _config.yml
├── _data/experience.yml # 工作经历
├── _layouts/            # default / post / note / work
├── _includes/           # rail / catalog / collection-list / sidebar-ad …
├── _posts/              # 文章
├── _notes/              # 笔记
├── _works/              # 作品详情
├── pages/               # posts / notes / works / index
├── assets/css/main.scss
├── assets/js/main.js    # 标签云、related、目录拖拽/收起、联系我
└── index.md             # 简介首页
```
