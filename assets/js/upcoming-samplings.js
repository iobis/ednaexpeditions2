/*
 * Sites grid page: the sampling events scheduled over the next three months, all sites together.
 * Each site's events come from the same endpoint as the site page timeline (site.timeline_api).
 * Only sampling activities (test_sampling, standard_sampling, planned_sampling, ...) dated from today on are used.
 */
(function () {
  var section = document.querySelector('.upcoming');
  var sitesTag = document.getElementById('upcoming-sites');
  if (!section || !sitesTag || !window.fetch) return;

  var row = section.closest('.upcoming-row');
  var container = section.querySelector('.upcoming-months');
  var sites = JSON.parse(sitesTag.textContent || '[]');
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function parseDate(s) {
    var p = String(s).slice(0, 10).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var months = [0, 1, 2].map(function (i) {
    return { start: new Date(today.getFullYear(), today.getMonth() + i, 1), items: [] };
  });
  var windowEnd = new Date(today.getFullYear(), today.getMonth() + 3, 1);

  function fetchSite(site) {
    var url = section.getAttribute('data-api').replace('{site}', encodeURIComponent(site.code));
    return fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        (data.events || []).forEach(function (ev) {
          var type = (ev.meta && ev.meta.activity_type) || ev.kind;
          if (ev.source !== 'activity' || !/_sampling$/.test(type)) return;
          var d = parseDate(ev.date);
          if (d < today || d >= windowEnd) return;
          months.forEach(function (m, i) {
            var next = i < 2 ? months[i + 1].start : windowEnd;
            if (d >= m.start && d < next) m.items.push({ date: d, site: site });
          });
        });
      });
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function render() {
    var any = months.some(function (m) { return m.items.length; });
    if (!any) return; // nothing scheduled in the next three months: leave the block hidden

    months.forEach(function (m) {
      var block = el('div', 'upcoming-month');
      block.appendChild(el('h4', 'upcoming-month-name', MONTHS[m.start.getMonth()] + ' ' + m.start.getFullYear()));
      var list = el('ul', 'upcoming-list');
      if (!m.items.length) {
        list.appendChild(el('li', 'upcoming-empty', 'No sampling scheduled'));
      }
      m.items.sort(function (a, b) { return (a.date - b.date) || a.site.title.localeCompare(b.site.title); });
      m.items.forEach(function (it) {
        var li = el('li', 'upcoming-item');
        li.appendChild(el('span', 'upcoming-date', it.date.getDate() + ' ' + SHORT[it.date.getMonth()]));
        var a = el('a', 'upcoming-site', it.site.title);
        a.href = it.site.url;
        li.appendChild(a);
        list.appendChild(li);
      });
      block.appendChild(list);
      container.appendChild(block);
    });
    row.hidden = false;
  }

  Promise.allSettled(sites.map(fetchSite)).then(render);
}());
