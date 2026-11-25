/* Gentle Vet Animal Hospital — site behaviour (no dependencies) */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  var TZ = "America/Chicago";
  // Hours in minutes after midnight, indexed by day (0 = Sunday)
  var HOURS = [null, [450, 1080], [450, 1080], [450, 1080], [450, 1080], [450, 1050], null];
  // Dates the clinic is closed (YYYY-MM-DD, clinic local time)
  var CLOSED_DATES = { "2026-11-26": "Thanksgiving" };

  function clinicNow() {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, weekday: "short", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return {
      day: days.indexOf(o.weekday),
      mins: parseInt(o.hour, 10) * 60 + parseInt(o.minute, 10),
      date: o.year + "-" + o.month + "-" + o.day
    };
  }

  function fmt(mins) {
    var h = Math.floor(mins / 60), m = mins % 60, ap = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return h + (m ? ":" + String(m).padStart(2, "0") : "") + ap;
  }

  /* ---- Open / closed status ---- */
  function updateStatus() {
    var now = clinicNow();
    var today = HOURS[now.day];
    var holiday = CLOSED_DATES[now.date];
    var open = !holiday && today && now.mins >= today[0] && now.mins < today[1];
    var text;
    if (open) {
      text = "Open now · until " + fmt(today[1]);
    } else if (!holiday && today && now.mins < today[0]) {
      text = "Closed · opens today at " + fmt(today[0]);
    } else {
      var d = now.day, label = "tomorrow";
      for (var i = 1; i <= 7; i++) {
        var nd = (now.day + i) % 7;
        if (HOURS[nd] && !(i === 1 && CLOSED_DATES[addDays(now.date, 1)])) { d = nd; label = i === 1 ? "tomorrow" : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][nd]; break; }
      }
      text = (holiday ? "Closed for " + holiday : "Closed now") + " · opens " + label + " at " + fmt(HOURS[d][0]);
    }
    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.classList.toggle("is-open", !!open);
      var t = el.querySelector("[data-status-text]");
      if (t) t.textContent = text;
    });
    document.querySelectorAll(".hours tr[data-day]").forEach(function (tr) {
      var days = tr.getAttribute("data-day").split(",").map(Number);
      tr.classList.toggle("is-today", days.indexOf(now.day) !== -1);
    });
  }
  function addDays(iso, n) {
    var d = new Date(iso + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ---- Notice bar (auto-expires, dismissible) ---- */
  var notice = document.querySelector("[data-notice]");
  if (notice) {
    var key = "gv-notice-" + notice.getAttribute("data-notice");
    var expires = notice.getAttribute("data-expires");
    var dismissed = false;
    try { dismissed = localStorage.getItem(key) === "1"; } catch (e) {}
    if (dismissed || (expires && clinicNow().date > expires)) {
      notice.hidden = true;
    }
    var close = notice.querySelector(".notice__close");
    if (close) close.addEventListener("click", function () {
      notice.hidden = true;
      try { localStorage.setItem(key, "1"); } catch (e) {}
    });
  }

  /* ---- Header ---- */
  var header = document.querySelector(".site-header");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("site-nav");
  function setNav(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () { setNav(toggle.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setNav(false); });
    window.addEventListener("resize", function () { if (window.innerWidth > 920) setNav(false); });
  }

  /* ---- Reveal on scroll ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---- Team filter ---- */
  var filter = document.querySelector("[data-team-filter]");
  if (filter) {
    filter.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var group = btn.getAttribute("data-group");
      filter.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      document.querySelectorAll("[data-member]").forEach(function (m) {
        m.hidden = group !== "all" && m.getAttribute("data-member") !== group;
      });
    });
  }

  /* ---- Pricing tabs + search ---- */
  var tabs = document.querySelectorAll('[role="tab"]');
  var search = document.getElementById("price-search");
  function activePanel() { return document.querySelector(".price-panel:not([hidden])"); }
  function applySearch() {
    var panel = activePanel();
    if (!panel || !search) return;
    var q = search.value.trim().toLowerCase();
    var shown = 0;
    panel.querySelectorAll(".price-list li").forEach(function (li) {
      var match = !q || li.textContent.toLowerCase().indexOf(q) !== -1;
      li.hidden = !match;
      if (match) shown++;
    });
    panel.querySelectorAll(".price-list").forEach(function (ul) {
      var any = Array.prototype.some.call(ul.children, function (li) { return !li.hidden; });
      var sub = ul.previousElementSibling;
      ul.hidden = !any;
      if (sub && sub.classList.contains("price-sub")) sub.hidden = !any;
    });
    panel.querySelectorAll(".price-group").forEach(function (g) {
      g.hidden = !g.querySelector(".price-list:not([hidden])");
    });
    var none = panel.querySelector(".no-results");
    if (none) none.hidden = shown !== 0;
  }
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
    var id = tab.getAttribute("aria-controls").replace("panel-", "");
    if (history.replaceState) history.replaceState(null, "", "#" + id);
    applySearch();
  }
  if (tabs.length) {
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { selectTab(t); });
      t.addEventListener("keydown", function (e) {
        var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (dir) { e.preventDefault(); selectTab(tabs[(i + dir + tabs.length) % tabs.length], true); }
      });
    });
    var hash = location.hash.replace("#", "");
    var initial = document.getElementById("tab-" + hash);
    if (initial) selectTab(initial);
    if (search) search.addEventListener("input", applySearch);
  }

  /* ---- Contact form (opens the visitor's email app) ---- */
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (input) {
        var field = input.closest(".field");
        var valid = input.checkValidity() && input.value.trim() !== "";
        field.classList.toggle("has-error", !valid);
        input.setAttribute("aria-invalid", String(!valid));
        if (!valid && ok) { input.focus(); ok = false; }
      });
      if (!ok) return;
      var d = new FormData(form);
      var body = [
        "Name: " + d.get("name"),
        "Phone: " + (d.get("phone") || "—"),
        "Email: " + d.get("email"),
        "Pet: " + (d.get("pet") || "—"),
        "",
        d.get("message")
      ].join("\n");
      var subject = "Website message from " + d.get("name");
      window.location.href = "mailto:petcare@thegentlevets.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      var status = document.getElementById("form-status");
      if (status) status.hidden = false;
    });
    form.addEventListener("input", function (e) {
      var field = e.target.closest(".field");
      if (field && field.classList.contains("has-error") && e.target.checkValidity()) {
        field.classList.remove("has-error");
        e.target.setAttribute("aria-invalid", "false");
      }
    });
  }

  /* ---- Year ---- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
