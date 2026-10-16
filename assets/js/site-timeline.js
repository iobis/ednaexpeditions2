/*
 * Site page timeline.
 *
 * The server-rendered markup (from front matter, see _includes/site-timeline.html) is the fallback.
 * When the section has a data-api URL, the events are fetched from there and the list is rebuilt.
 *
 * Event -> step mapping (see timelineFromEvents):
 *   milestone / science_plan_made                 -> start date
 *   science_plan / sampling_event                 -> sampling (Test / Community / Sampling n)
 *   activity with type results_available          -> results
 *   activity with type interpretation             -> interpretation
 *   activity with type outcome (or "timeline")    -> outcome, text from description, optional value
 *   everything else (kits, planned_sampling, ...) -> ignored
 * Status comes from the dates (done / underway / planned), unless an event carries a status.
 */
(function () {
  var section = document.querySelector('.site-timeline');
  if (!section) return;

  var list = section.querySelector('.tl-list');
  var scroller = section.querySelector('.tl-scroll');
  var view = section.querySelector('.tl-viewport');
  var head = section.querySelector('.tl-arrows');
  var hint = section.querySelector('.tl-hint');
  var prev = head.querySelector('.tl-arrow--prev');
  var next = head.querySelector('.tl-arrow--next');

  /* ---------- scrolling ---------- */

  function update() {
    var max = scroller.scrollWidth - scroller.clientWidth;
    var scrollable = max > 2;
    head.hidden = hint.hidden = !scrollable;
    prev.disabled = scroller.scrollLeft <= 2;
    next.disabled = scroller.scrollLeft >= max - 2;
    view.classList.toggle('can-scroll-left', !prev.disabled);
    view.classList.toggle('can-scroll-right', !next.disabled);
  }

  function centreOnCurrent() {
    var focus = list.querySelector('.tl-item--underway');
    if (!focus) {
      var done = list.querySelectorAll('.tl-item--done');
      focus = done[done.length - 1];
    }
    if (focus && scroller.scrollWidth > scroller.clientWidth) {
      scroller.scrollLeft = focus.offsetLeft - (scroller.clientWidth - focus.offsetWidth) / 2;
    }
    update();
  }

  function step(dir) {
    scroller.scrollBy({ left: dir * scroller.clientWidth * 0.8, behavior: 'smooth' });
  }
  prev.addEventListener('click', function () { step(-1); });
  next.addEventListener('click', function () { step(1); });
  scroller.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);

  /* ---------- events -> steps ---------- */

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function parseDate(s) {
    if (!s) return null;
    var p = String(s).slice(0, 10).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function formatDate(s) {
    var d = parseDate(s);
    return d ? MONTHS[d.getMonth()] + ' ' + d.getFullYear() : '';
  }

  function activityType(ev) {
    var t = (ev.meta && ev.meta.activity_type) || ev.kind;
    return t === 'timeline' ? 'outcome' : t;
  }

  function timelineFromEvents(events) {
    var start = null;
    var steps = [];

    events.forEach(function (ev, i) {
      var meta = ev.meta || {};
      var step = { order: i, date: ev.date, end: ev.date_end || null, status: ev.status || meta.status || null };

      if (ev.source === 'milestone' && ev.kind === 'science_plan_made') {
        start = ev.date;
        return;
      }
      if (ev.source === 'science_plan' && ev.kind === 'sampling_event') {
        step.type = 'sampling';
        step.label = meta.is_test ? 'Test sampling'
          : meta.community_involved ? 'Community sampling'
          : 'Sampling' + (meta.index ? ' ' + meta.index : '');
      } else if (ev.source === 'activity') {
        var t = activityType(ev);
        if (t === 'results_available') {
          step.type = 'results';
        } else if (t === 'interpretation') {
          step.type = 'interpretation';
        } else if (t === 'outcome') {
          step.type = 'outcome';
          step.label = ev.description || ev.title;
          step.value = ev.value || meta.value || null;
        } else {
          return;
        }
        if (step.type !== 'outcome' && ev.description) step.label = ev.description;
      } else {
        return;
      }
      steps.push(step);
    });

    steps.sort(function (a, b) {
      return (parseDate(a.date) - parseDate(b.date)) || (a.order - b.order);
    });

    // a results step belongs to the sampling before it: "Sampling 1 results available"
    var lastSampling = null;
    steps.forEach(function (s) {
      if (s.type === 'sampling') lastSampling = s.label;
      if (s.type === 'results' && lastSampling) s.title = lastSampling + ' results available';
    });

    // dates -> status
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var inProgress = -1;
    steps.forEach(function (s, i) {
      var from = parseDate(s.date);
      var to = parseDate(s.end) || from;
      if (!s.status) s.status = to < today || (!s.end && from <= today) ? 'done' : 'planned';
      if (s.status !== 'done' && s.end && from <= today && today <= to && inProgress < 0) inProgress = i;
    });

    // underway: a sampling happening today, otherwise the first unfinished non-outcome step
    var underway = inProgress;
    if (underway < 0) {
      for (var i = 0; i < steps.length; i++) {
        if (steps[i].type !== 'outcome' && steps[i].status !== 'done') { underway = i; break; }
      }
    }
    steps.forEach(function (s, i) { if (i === underway) s.status = 'underway'; });

    return { start: start, steps: steps };
  }

  /* ---------- rendering (text via textContent: the data is not trusted) ---------- */

  var ICONS = { sampling: 'fa-droplet', results: 'fa-dna', interpretation: 'fa-chart-line', outcome: 'fa-lightbulb' };
  var TITLES = { sampling: null, results: 'Results available', interpretation: 'Interpretation', outcome: null };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function item(state, type, icon, title, opts) {
    var li = el('li', 'tl-item tl-item--' + state + (type ? ' tl-item--' + type : ''));
    var ic = el('span', 'tl-icon');
    ic.setAttribute('aria-hidden', 'true');
    ic.appendChild(el('i', 'fa-solid ' + icon));
    var text = el('span', 'tl-text');
    var b = el('b');
    if (opts.value) { b.appendChild(el('span', 'tl-value', opts.value)); b.appendChild(document.createTextNode(' ')); }
    b.appendChild(document.createTextNode(title));
    text.appendChild(b);
    if (opts.qualifier) text.appendChild(el('span', 'tl-qualifier', opts.qualifier));
    if (opts.date) text.appendChild(el('span', 'tl-date', opts.date));
    if (state === 'underway') text.appendChild(el('span', 'tl-badge', 'Underway'));
    li.appendChild(ic);
    li.appendChild(el('span', 'tl-dot'));
    li.appendChild(text);
    return li;
  }

  function render(tl) {
    var endDate = section.getAttribute('data-end') || 'Dec 2028';
    list.textContent = '';
    list.appendChild(item('done', 'start', 'fa-clipboard-check', 'Science plan done', { date: formatDate(tl.start) }));
    tl.steps.forEach(function (s) {
      var title = s.type === 'sampling' || s.type === 'outcome' ? s.label : (s.title || TITLES[s.type]);
      var qualifier = s.type === 'results' || s.type === 'interpretation' ? s.label : null;
      list.appendChild(item(s.status, s.type, ICONS[s.type], title, { value: s.value, qualifier: qualifier, date: formatDate(s.date) }));
    });
    list.appendChild(item('', 'end', 'fa-flag-checkered', 'Results implemented', { date: endDate }));
    list.lastChild.className = 'tl-item tl-item--end';
    section.hidden = false;
    centreOnCurrent();
  }

  /* ---------- go ---------- */

  centreOnCurrent();

  var api = section.getAttribute('data-api');
  if (api && window.fetch) {
    fetch(api, { headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) { render(timelineFromEvents(data.events || [])); })
      .catch(function (err) { if (window.console) console.warn('Timeline: using fallback', err); });
  }
}());
