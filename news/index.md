---
layout: page
title: News
eyebrow: News
lead: "Short updates: papers, talks, courses and milestones."
description: "Short updates: papers, talks, courses and milestones."
wide: true
---
{% assign items = site.news | sort: "date" | reverse %}
{% if items.size > 0 %}
<ul class="entry-list">
{% for item in items %}
  <li><time datetime="{{ item.date | date_to_xmlschema }}">{{ item.date | date: "%-d %B %Y" }}</time><a href="{{ item.url | relative_url }}">{{ item.title }}</a></li>
{% endfor %}
</ul>
{% else %}
<div class="emptypage emptypage--sub">{% include empty-state.html icon="news" title="Nothing to report yet" text="Papers, talks, courses and milestones will be shared here." href="/research/" label="Explore my research" href2="/blog/" label2="Read the blog" %}</div>
{% endif %}
