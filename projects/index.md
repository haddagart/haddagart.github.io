---
layout: default
title: Projects
description: "Projects by Abdelkader Haddag across software, design and curiosities: an aspiring polymath's workbench."
stub: true
sitemap: false
---
{%- assign everything = site.projects | sort: "date" | reverse -%}
<div class="wrap section section--research povw">
  <header class="povw__intro" data-reveal>
    <p class="eyebrow">Projects</p>
    <h1>An aspiring polymath's workbench</h1>
    <p class="lead">Software, design and whatever else keeps me curious. Pick an area, or browse everything in one place.</p>
  </header>

  <section aria-labelledby="areas">
    <h2 id="areas" class="sr-only">Areas</h2>
    <div class="povw__areas">
      {%- for d in site.data.disciplines -%}
      {%- assign n = site.projects | where: "discipline", d.key | size -%}
      <a class="hubcard lit" href="{{ '/projects/' | append: d.key | append: '/' | relative_url }}" data-reveal>
        <span class="hubcard__bg" aria-hidden="true">{% include icon.html name=d.icon %}</span>
        <h3>{{ d.title }}</h3>
        <p>{{ d.blurb }}</p>
        <span class="hubcard__count">{% if n > 0 %}<b>{{ n }}</b> {% if n == 1 %}project{% else %}projects{% endif %}{% else %}Coming soon{% endif %}</span>
        <span class="hubcard__go" aria-hidden="true">{% include icon.html name="arrow-right" %}</span>
      </a>
      {%- endfor -%}
    </div>
  </section>

  {%- if everything.size > 0 %}
  <section class="platest" aria-labelledby="latest-projects">
    <h2 id="latest-projects" class="platest__head"><span class="rlatest__live" aria-hidden="true"></span>Latest projects</h2>
    <ol class="rnews rnews--proj" data-rnews>
      {%- for p in everything limit: 3 -%}
      <li class="rnews__item">
        <a class="rnews__link" href="{{ p.url | relative_url }}">
          <span class="rnews__media"{% if p.accent %} style="--tint: {{ p.accent }}"{% endif %} aria-hidden="true"><span class="rnews__mark">{% if p.image %}<img src="{{ p.image | relative_url }}" alt="" width="96" height="96" loading="lazy">{% else %}<b>{{ p.title | slice: 0, 1 | upcase }}</b>{% endif %}</span></span>
          <span class="rnews__meta">{{ p.kind }}{% if p.kind and p.year %} · {% endif %}{{ p.year }}</span>
          <span class="rnews__title">{{ p.title }}</span>
          <span class="rnews__venue"><span>{{ p.summary }}</span></span>
          <span class="rnews__go" aria-hidden="true">{% include icon.html name="arrow-right" %}</span>
          <span class="rnews__bar" aria-hidden="true"><i></i></span>
        </a>
      </li>
      {%- endfor -%}
    </ol>
    <div class="platest__foot" data-rnews-foot>
      <a class="pub__btn" href="{{ '/projects/all/' | relative_url }}">See all {{ everything.size }}{% include icon.html name="arrow-right" %}</a>
    </div>
  </section>
  {%- endif %}

  {% include freelance-cta.html %}
</div>
