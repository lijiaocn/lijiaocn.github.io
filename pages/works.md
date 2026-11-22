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
    <a class="work-tile" href="{{ site.baseurl }}{{ work.url }}" data-tags="{{ work.tags | join: '|' }}">
      <div class="work-tile-cover">
        {% if work.type %}<span class="work-tile-type">{{ work.type }}</span>{% endif %}
      </div>
      <div class="work-tile-body">
        <div class="work-tile-top">
          <h3 class="work-tile-title">{{ work.title }}</h3>
          {% if work.date %}<time class="work-tile-year" datetime="{{ work.date | date: '%Y-%m-%d' }}">{{ work.date | date: "%Y" }}</time>{% endif %}
        </div>
        {% if work.description %}<p class="work-tile-tagline">{{ work.description }}</p>{% endif %}
        {% if work.status %}
        <div class="work-tile-foot">
          <span class="work-tile-status"><span class="status-dot"></span>{{ work.status }}</span>
        </div>
        {% endif %}
      </div>
    </a>
    {% endfor %}
  </div>
</section>
