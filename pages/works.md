---
layout: default
title: "作品"
permalink: /works/
mid_panel: tags
---

<section class="page-hero">
  <h1 class="page-title">做的东西</h1>
  <p class="page-lead">从 App 到网站，从独立产品到小工具。每一个都认真做过。</p>
</section>

<section class="page-body">
  {% assign works_list = site.works %}
  {% unless works_list %}{% assign works_list = "" | split: "," %}{% endunless %}
  {% assign works = works_list | sort: "date" | reverse %}
  <div class="work-grid" id="content-list" data-collection="works">
    {% for work in works %}
    {% include work-cover-palette.html work=work %}
    <a class="work-tile" href="{{ site.baseurl }}{{ work.url }}" data-tags="{{ work.tags | join: '|' }}">
      <div class="work-tile-cover work-tile-cover--{{ cover_palette }}">
        <div class="work-tile-cover-main">
          {% if work.name %}
          <p class="work-tile-name">{{ work.name }}</p>
          {% elsif work.title %}
          <p class="work-tile-name">{{ work.title }}</p>
          {% endif %}
          {% if work.description %}<p class="work-tile-slogan">{{ work.description }}</p>{% endif %}
        </div>
        {% if work.type %}<span class="work-tile-type">{{ work.type }}</span>{% endif %}
      </div>
      <div class="work-tile-body">
        <h3 class="work-tile-title">{{ work.title }}</h3>
        {% if work.status %}
        <div class="work-tile-meta">
          <span class="work-tile-status"><span class="status-dot"></span>{{ work.status }}</span>
        </div>
        {% endif %}
      </div>
    </a>
    {% endfor %}
  </div>
</section>
