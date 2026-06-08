# eDNA Expeditions – sites pages implementation guide

## 1. collections setup

In `_config.yml`:

```yaml
collections:
  participating_sites:
    output: true
    permalink: /participating-sites/:name/
```

---

## 2. site page structure

Each site is a file in:

```text
_participating_sites/
```

Example:

```yaml
---
layout: site-page
lang: en

site_title: Wonderful participating site
listing_teaser: A short teaser for the overview page.

map_lat: 43.6
map_lon: 2.3
map_zoom: 5

region: Pacific
country_type: SIDS
site_type: Island site

objectives:
  - Biodiversity knowledge
  - Invasive species

ecosystem_type:
  - Coral reef
  - Coastal area
---
```

---

## 3. site page layout

File:

```text
_layouts/site-page.html
```

### key components

* title + subtitle
* 16:9 hero image
* stats panel
* 2-column layout (content + sidebar)
* Leaflet map
* team + contact block

---

## 4. leaflet map (single site)

### HTML

```html
<div id="site-map"></div>
```

### JS

```html
<script>
  const siteMap = L.map('site-map').setView(
    [{{ page.map_lat }}, {{ page.map_lon }}],
    {{ page.map_zoom | default: 5 }}
  );

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(siteMap);

  L.marker([{{ page.map_lat }}, {{ page.map_lon }}]).addTo(siteMap);
</script>
```

### CSS

```css
#site-map {
    width: 100%;
    aspect-ratio: 1 / 1;
}
```

---

## 5. global sites page

File:

```text
participating-sites/index.html
```

### structure

1. intro
2. filters
3. map
4. grid of site cards

---

## 6. leaflet world map

### container

```html
<div id="sites-map"></div>
```

### CSS

```css
#sites-map {
    width: 100%;
    height: 520px;
}
```

---

## 7. filters (checkbox system)

### data source

```text
_data/site-filters.yml
```

```yaml
regions:
  - Pacific
  - Africa

country_types:
  - SIDS
  - LMIC

site_types:
  - Island site

objectives:
  - Biodiversity knowledge
  - Invasive species

ecosystem_types:
  - Coral reef
  - Mangrove
```

---

### HTML (example)

```liquid
<fieldset class="sites-filter-group">
  <legend class="sites-filter-title">Region</legend>
  {% for item in site.data.site-filters.regions %}
    <label class="sites-filter-option">
      <input type="checkbox" name="region" value="{{ item }}">
      <span>{{ item }}</span>
    </label>
  {% endfor %}
</fieldset>
```

---

### CSS

```css
.sites-map-panel {
    background: #ffffff;
    padding: 1rem;
}

.sites-filters {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    column-gap: 1rem;
    row-gap: 1rem;
}

.sites-filter-group {
    padding: 0;
}

.sites-filter-option {
    display: flex;
    gap: 0.4rem;
    font-size: 0.8rem;
}
```

---

## 8. filtering logic (map)

```html
<script>
  const sitesData = [
    {% for site_item in site.participating_sites %}
    {
      title: {{ site_item.site_title | jsonify }},
      url: {{ site_item.url | jsonify }},
      lat: {{ site_item.map_lat | jsonify }},
      lon: {{ site_item.map_lon | jsonify }},
      region: {{ site_item.region | jsonify }},
      country_type: {{ site_item.country_type | jsonify }},
      site_type: {{ site_item.site_type | jsonify }},
      objectives: {{ site_item.objectives | jsonify }},
      ecosystem_type: {{ site_item.ecosystem_type | jsonify }}
    }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  ];

  const map = L.map('sites-map').setView([20, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  const markers = [];

  function getCheckedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
      .map(i => i.value);
  }

  function matchesArray(values, selected) {
    if (selected.length === 0) return true;
    if (!values) return false;
    return selected.some(v => values.includes(v));
  }

  function matches(site) {
    return (
      matchesArray([site.region], getCheckedValues('region')) &&
      matchesArray([site.country_type], getCheckedValues('country_type')) &&
      matchesArray([site.site_type], getCheckedValues('site_type')) &&
      matchesArray(site.objectives, getCheckedValues('objectives')) &&
      matchesArray(site.ecosystem_type, getCheckedValues('ecosystem_type'))
    );
  }

  function renderMarkers() {
    markers.forEach(m => map.removeLayer(m));
    markers.length = 0;

    sitesData.forEach(site => {
      if (site.lat && site.lon && matches(site)) {
        const m = L.marker([site.lat, site.lon]).addTo(map);
        m.bindPopup(`<a href="${site.url}">${site.title}</a>`);
        markers.push(m);
      }
    });
  }

  document.querySelectorAll('.sites-filters input').forEach(i =>
    i.addEventListener('change', renderMarkers)
  );

  renderMarkers();
</script>
```

---

## 9. grid of site cards

```liquid
{% assign sorted_sites = site.participating_sites | sort: "site_title" %}
{% for site_item in sorted_sites %}
  <article class="site-card">
    <a href="{{ site_item.url }}">
      <img src="{{ site_item.hero_image }}">
      <h3>{{ site_item.site_title }}</h3>
      <p>{{ site_item.listing_teaser }}</p>
      <span>Read more ➜</span>
    </a>
  </article>
{% endfor %}
```

---

## 10. navbar integration

In `_layouts/default.html`:

```html
<li class="nav-item">
  <a class="nav-link" href="{{ lang_prefix }}/participating-sites">
    Sites
  </a>
</li>
```

---

## 11. homepage logo fix

### problem

`href=""` when `lang_prefix` is empty

### solution

```liquid
{% assign current_lang = page.lang | default: 'en' %}

{% assign home_url = '' %}
{% if current_lang == 'fr' %}
  {% assign home_url = '/fr' %}
{% elsif current_lang == 'es' %}
  {% assign home_url = '/es' %}
{% endif %}
```

```html
<a href="{{ home_url | append: '/' | relative_url }}">
```

---

## 12. key principles

* use `_data` for taxonomy
* use collections for scalability
* keep filters decoupled from content
* Leaflet for map consistency
* grid + gap for layout, not padding
* avoid hardcoded URLs

---

## status

You now have:

* dynamic site pages
* global map with filters
* scalable taxonomy
* reusable system
* clean navigation

This is a fully extensible architecture.
