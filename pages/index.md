---
layout: default
mid_panel: ad
permalink: /
---

<section class="page-hero page-hero--home">
  <h1 class="page-title">{{ site.title }}</h1>
  <div class="page-lead">
    <p>{{ site.description }}</p>
  </div>
</section>

<section class="block block--first">
  <div class="home-stats" aria-label="内容概览">
    <a class="home-stat" href="{{ site.baseurl }}/works/">
      <span class="home-stat-label">作品</span>
      <span class="home-stat-count">{{ site.works.size }}</span>
    </a>
    <a class="home-stat" href="{{ site.baseurl }}/posts/">
      <span class="home-stat-label">文章</span>
      <span class="home-stat-count">{{ site.posts.size }}</span>
    </a>
    <a class="home-stat" href="{{ site.baseurl }}/notes/">
      <span class="home-stat-label">笔记</span>
      <span class="home-stat-count">{{ site.notes.size }}</span>
    </a>
  </div>
</section>

<section class="home-split">
  <aside class="home-split-left">
    <div class="block-head block-head--start">
      <h2>工作状态</h2>
      <button type="button" class="contact-trigger" id="contact-trigger" aria-haspopup="dialog" aria-controls="contact-dialog" aria-label="联系我">💬</button>
    </div>
    {% include experience-timeline.html %}
  </aside>

  <div class="home-split-right">
    {% if site.data.experience.self_evaluation %}
    <section class="block block--nested home-self-eval">
      <div class="home-self-eval-body">
        {% for para in site.data.experience.self_evaluation %}
        <p>{{ para }}</p>
        {% endfor %}
      </div>
    </section>
    {% endif %}

    <div class="home-feed">
      <div class="block-head home-feed-head">
        <h2>最新动态</h2>
        <nav class="home-feed-links" aria-label="内容入口">
          <a href="{{ site.baseurl }}/works/">作品 <span class="home-feed-count">{{ site.works.size }}</span></a>
          <a href="{{ site.baseurl }}/posts/">文章 <span class="home-feed-count">{{ site.posts.size }}</span></a>
          <a href="{{ site.baseurl }}/notes/">笔记 <span class="home-feed-count">{{ site.notes.size }}</span></a>
        </nav>
      </div>

      {% assign works_list = site.works %}
      {% unless works_list %}{% assign works_list = "" | split: "," %}{% endunless %}
      {% assign works_limit = 2 %}
      <section class="block block--nested" aria-label="最新作品">
        <ul class="entry-list">
          {% assign latest_works = works_list | sort: "date" | reverse %}
          {% for work in latest_works limit: works_limit %}
          <li class="entry">
            <a class="entry-title" href="{{ site.baseurl }}{{ work.url }}">{{ work.title }}</a>
            <time class="entry-date">{% if work.date %}{{ work.date | date: "%Y.%m" }}{% else %}{{ work.year }}{% endif %}</time>
          </li>
          {% endfor %}
          <li class="entry entry--dir">
            <a class="entry-dir-link" href="{{ site.baseurl }}/works/" aria-label="全部作品">{% include icons/more.svg %}</a>
          </li>
        </ul>
      </section>

      {% assign posts_limit = 4 %}
      <section class="block block--nested" aria-label="最近文章">
        <ul class="entry-list">
          {% for post in site.posts limit: posts_limit %}
          <li class="entry">
            <a class="entry-title" href="{{ site.baseurl }}{{ post.url }}">{{ post.title }}</a>
            <time class="entry-date">{{ post.date | date: "%Y.%m" }}</time>
          </li>
          {% endfor %}
          <li class="entry entry--dir">
            <a class="entry-dir-link" href="{{ site.baseurl }}/posts/" aria-label="全部文章">{% include icons/more.svg %}</a>
          </li>
        </ul>
      </section>

      {% assign notes_limit = 2 %}
      <section class="block block--nested" aria-label="最新笔记">
        <ul class="entry-list">
          {% assign sorted_notes = site.notes | sort: "date" | reverse %}
          {% for note in sorted_notes limit: notes_limit %}
          <li class="entry">
            <a class="entry-title" href="{{ site.baseurl }}{{ note.url }}">{{ note.title }}</a>
            <time class="entry-date">{{ note.date | date: "%Y.%m" }}</time>
          </li>
          {% endfor %}
          <li class="entry entry--dir">
            <a class="entry-dir-link" href="{{ site.baseurl }}/notes/" aria-label="全部笔记">{% include icons/more.svg %}</a>
          </li>
        </ul>
      </section>
    </div>
  </div>
</section>

<section class="block home-contact" aria-label="联系方式">
  <div class="home-contact-bar">
    <dl class="home-contact-list">
      {% if site.data.contact.location %}
      <div class="home-contact-row">
        <dd aria-label="地点">{{ site.data.contact.location }}<span class="home-contact-note">（地点）</span></dd>
      </div>
      {% endif %}
      {% if site.data.contact.wechat %}
      <div class="home-contact-row">
        <dd aria-label="微信">{% include wechat-id.html uid="home" %}<span class="home-contact-note">（微信）</span></dd>
      </div>
      {% endif %}
      {% if site.data.contact.email %}
      <div class="home-contact-row">
        <dd aria-label="邮箱">{{ site.data.contact.email }}<span class="home-contact-note">（邮箱）</span></dd>
      </div>
      {% endif %}
    </dl>
  </div>
</section>

<dialog class="contact-dialog" id="contact-dialog" aria-labelledby="contact-dialog-title">
  <div class="contact-dialog-inner">
    <div class="contact-dialog-head">
      <h3 id="contact-dialog-title">联系方式</h3>
      <form method="dialog">
        <button type="submit" class="contact-dialog-close" aria-label="关闭">×</button>
      </form>
    </div>
    <dl class="contact-dialog-list">
      {% if site.data.contact.email %}
      <div class="contact-dialog-row">
        <dt>邮箱</dt>
        <dd>{{ site.data.contact.email }}</dd>
      </div>
      {% endif %}
      {% if site.data.contact.wechat %}
      <div class="contact-dialog-row">
        <dt>微信</dt>
        <dd>{% include wechat-id.html uid="dialog" %}</dd>
      </div>
      {% endif %}
      {% if site.data.contact.location %}
      <div class="contact-dialog-row">
        <dt>地点</dt>
        <dd>{{ site.data.contact.location }}</dd>
      </div>
      {% endif %}
    </dl>
  </div>
</dialog>
