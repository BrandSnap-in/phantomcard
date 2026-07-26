(function () {
  "use strict";

  var NAVY = "#0B1F3A", GOLD = "#B8862B", SIGNAL = "#1F4FD8", CREAM = "#F5F0E6";

  /* ---------------- utilities ---------------- */
  function indianGroup(numStr) {
    var isNeg = numStr[0] === "-";
    if (isNeg) numStr = numStr.slice(1);
    var lastThree = numStr.slice(-3);
    var other = numStr.slice(0, -3);
    if (other !== "") {
      lastThree = "," + lastThree;
      other = other.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    }
    return (isNeg ? "-" : "") + other + lastThree;
  }

  function formatVal(val, decimals) {
    if (decimals > 0) {
      var fixed = val.toFixed(decimals);
      var parts = fixed.split(".");
      return indianGroup(parts[0]) + "." + parts[1];
    }
    return indianGroup(String(Math.round(val)));
  }

  function animateNumber(el, endValue, opts) {
    opts = opts || {};
    var prefix = opts.prefix !== undefined ? opts.prefix : (el.dataset.prefix || "");
    var suffix = opts.suffix !== undefined ? opts.suffix : (el.dataset.suffix || "");
    var decimals = opts.decimals !== undefined ? opts.decimals : parseInt(el.dataset.decimals || "0", 10);
    var duration = opts.duration || 800;
    var startValue = parseFloat(el.dataset.currentVal || "0") || 0;
    var t0 = performance.now();
    function tick(now) {
      var t = Math.min(1, (now - t0) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      var val = startValue + (endValue - startValue) * eased;
      el.textContent = prefix + formatVal(val, decimals) + suffix;
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        el.dataset.currentVal = endValue;
        el.textContent = prefix + formatVal(endValue, decimals) + suffix;
      }
    }
    requestAnimationFrame(tick);
  }

  /* ---------------- scroll reveal ---------------- */
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
          // trigger count-up numbers within this reveal block
          entry.target.querySelectorAll("[data-count-target]").forEach(function (el) {
            var target = parseFloat(el.dataset.countTarget);
            var decimals = parseInt(el.dataset.decimals || "0", 10);
            var suffix = el.dataset.suffix || "";
            var prefix = el.classList.contains("price") ? "₹" : "";
            animateNumber(el, target, { prefix: prefix, suffix: suffix, decimals: decimals, duration: 1100 });
          });
        }
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll(".reveal").forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ---------------- tilt cards ---------------- */
  function attachTilt(el, max) {
    max = max || 6;
    el.addEventListener("mousemove", function (e) {
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      var rx = (py - 0.5) * -max * 2;
      var ry = (px - 0.5) * max * 2;
      el.style.transform = "perspective(1000px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-6px)";
      el.style.setProperty("--gx", px * 100 + "%");
      el.style.setProperty("--gy", py * 100 + "%");
      el.style.setProperty("--gop", "1");
    });
    el.addEventListener("mouseleave", function () {
      el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)";
      el.style.setProperty("--gop", "0");
    });
  }
  document.querySelectorAll(".tilt").forEach(function (el) {
    attachTilt(el, 6);
  });

  /* ---------------- magnetic buttons ---------------- */
  function attachMagnetic(el) {
    var strength = parseFloat(el.dataset.strength || "0.3");
    el.addEventListener("mousemove", function (e) {
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * strength;
      var y = (e.clientY - r.top - r.height / 2) * (strength * 1.3);
      el.style.transform = "translate(" + x + "px," + y + "px)";
    });
    el.addEventListener("mouseleave", function () {
      el.style.transform = "translate(0px,0px)";
    });
  }
  document.querySelectorAll(".magnetic").forEach(attachMagnetic);

  /* ---------------- hero spotlight + card tilt ---------------- */
  var hero = document.getElementById("hero");
  var heroCard = document.getElementById("heroCard");
  if (hero) {
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", e.clientX - r.left + "px");
      hero.style.setProperty("--my", e.clientY - r.top + "px");
      if (heroCard) {
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        heroCard.style.transform = "perspective(1200px) rotateX(" + py * -8 + "deg) rotateY(" + px * 10 + "deg)";
      }
    });
  }

  /* ---------------- nav: scroll state, progress, indicator, routing ---------------- */
  var navEl = document.getElementById("nav");
  var scrollProgress = document.getElementById("scrollProgress");
  var navIndicator = document.getElementById("navIndicator");
  var navLinksWrap = document.getElementById("navLinks");
  var pageWrap = document.getElementById("pageWrap");
  var menuToggle = document.getElementById("menuToggle");
  var mobileMenu = document.getElementById("mobileMenu");

  function updateScrollFx() {
    navEl.classList.toggle("scrolled", window.scrollY > 8);
    var h = document.documentElement;
    var scrollTop = h.scrollTop || document.body.scrollTop;
    var scrollHeight = (h.scrollHeight || document.body.scrollHeight) - h.clientHeight;
    var pct = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
    scrollProgress.style.transform = "scaleX(" + Math.min(1, Math.max(0, pct)) + ")";
  }
  window.addEventListener("scroll", updateScrollFx, { passive: true });
  updateScrollFx();

  function updateNavIndicator(page) {
    var active = navLinksWrap.querySelector('.nav-link[data-page="' + page + '"]');
    if (!active) {
      navIndicator.style.opacity = 0;
      return;
    }
    navIndicator.style.left = active.offsetLeft + "px";
    navIndicator.style.width = active.offsetWidth + "px";
    navIndicator.style.opacity = 1;
  }

  var currentPage = "home";
  var transitioning = false;

  function goTo(page) {
    if (page === currentPage || transitioning) return;
    transitioning = true;
    pageWrap.classList.add("page-out");
    pageWrap.classList.remove("page-idle");
    window.setTimeout(function () {
      document.querySelectorAll(".page").forEach(function (p) {
        p.classList.toggle("active", p.dataset.page === page);
      });
      currentPage = page;
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.querySelectorAll(".nav-link").forEach(function (l) {
        l.classList.toggle("active", l.dataset.page === page);
      });
      updateNavIndicator(page);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          pageWrap.classList.remove("page-out");
          pageWrap.classList.add("page-idle");
          transitioning = false;
        });
      });
    }, 340);
  }

  document.querySelectorAll("[data-page]").forEach(function (el) {
    el.addEventListener("click", function () {
      goTo(el.dataset.page);
      if (mobileMenu.classList.contains("open")) mobileMenu.classList.remove("open");
    });
  });

  menuToggle.addEventListener("click", function () {
    mobileMenu.classList.toggle("open");
  });

  window.addEventListener("resize", function () {
    updateNavIndicator(currentPage);
  });
  window.setTimeout(function () {
    updateNavIndicator("home");
  }, 50);

  /* ---------------- compare page: expand toggle ---------------- */
  document.querySelectorAll(".expand-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tier = btn.dataset.tier;
      var panel = document.querySelector('.feature-collapse[data-tier-list="' + tier + '"]');
      var isOpen = btn.classList.contains("open");
      if (isOpen) {
        btn.classList.remove("open");
        panel.style.maxHeight = "0px";
        btn.childNodes[0].textContent = "See full feature list ";
      } else {
        btn.classList.add("open");
        panel.style.maxHeight = panel.scrollHeight + "px";
        btn.childNodes[0].textContent = "Hide feature list ";
      }
    });
  });

  /* ---------------- FAQ accordion ---------------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    var collapse = item.querySelector(".faq-collapse");
    q.addEventListener("click", function () {
      var isOpen = q.classList.contains("open");
      document.querySelectorAll(".faq-q.open").forEach(function (openQ) {
        if (openQ !== q) {
          openQ.classList.remove("open");
          openQ.parentElement.querySelector(".faq-collapse").style.maxHeight = "0px";
        }
      });
      if (isOpen) {
        q.classList.remove("open");
        collapse.style.maxHeight = "0px";
      } else {
        q.classList.add("open");
        collapse.style.maxHeight = collapse.scrollHeight + "px";
      }
    });
  });

  /* ---------------- Guardian AI live console ---------------- */
  var SIGNAL_NAMES = ["Location", "Travel status", "Battery", "Movement", "Calendar", "Weather", "Distance from phone", "Risk level", "Time", "Surroundings"];

  var SCENARIOS = {
    home: {
      label: "At home, Tuesday afternoon",
      risk: "Low", riskLabel: "Low risk", pct: 15, color: SIGNAL,
      action: "Silent — no alert needed",
      base: [12, 8, 20, 10, 15, 18, 5, 15, 22, 10],
    },
    night: {
      label: "Unfamiliar city, 11pm",
      risk: "Elevated", riskLabel: "Elevated risk", pct: 60, color: GOLD,
      action: "Heightened monitoring, faster alerts",
      base: [58, 65, 40, 55, 45, 50, 62, 60, 70, 66],
    },
    abroad: {
      label: "First day in a foreign country",
      risk: "High", riskLabel: "High risk", pct: 92, color: "#b0403f",
      action: "Decisive alert the moment you step away",
      base: [88, 82, 60, 78, 70, 75, 90, 92, 80, 95],
    },
  };

  var currentScenario = "home";
  var liveValues = SCENARIOS.home.base.slice();
  var signalListEl = document.getElementById("signalList");
  var gaugeRing = document.getElementById("gaugeRing");
  var gaugePct = document.getElementById("gaugePct");
  var gaugeLabel = document.getElementById("gaugeLabel");
  var gaugeCaption = document.getElementById("gaugeCaption");
  var flowContext = document.getElementById("flowContext");
  var flowRisk = document.getElementById("flowRisk");
  var flowRiskBar = document.getElementById("flowRiskBar");
  var flowAction = document.getElementById("flowAction");

  function buildSignalRows() {
    if (!signalListEl) return;
    signalListEl.innerHTML = "";
    SIGNAL_NAMES.forEach(function (name, i) {
      var row = document.createElement("div");
      row.className = "signal-row";
      row.innerHTML =
        '<span class="signal-name">' + name + '</span>' +
        '<div class="signal-bar-track"><div class="signal-bar-fill" data-idx="' + i + '" style="width:' + liveValues[i] + '%"></div></div>' +
        '<span class="signal-val mono" data-validx="' + i + '">' + Math.round(liveValues[i]) + '%</span>';
      signalListEl.appendChild(row);
    });
  }

  function renderGauge(sc) {
    var pct = sc.pct;
    gaugeRing.style.background = "conic-gradient(" + sc.color + " " + pct * 3.6 + "deg, #16294a 0deg)";
    gaugePct.textContent = pct + "%";
    gaugeLabel.textContent = sc.riskLabel;
    gaugeCaption.textContent = sc.action;
  }

  function renderFlow(sc) {
    flowContext.textContent = sc.label;
    flowRisk.textContent = sc.risk;
    flowRisk.style.color = sc.color;
    flowRiskBar.style.width = sc.pct + "%";
    flowRiskBar.style.background = sc.color;
    flowAction.textContent = sc.action;
  }

  function setScenario(key) {
    currentScenario = key;
    var sc = SCENARIOS[key];
    liveValues = sc.base.slice();
    document.querySelectorAll(".scenario-btn").forEach(function (b) {
      b.classList.toggle("active", b.dataset.scenario === key);
    });
    buildSignalRows();
    renderGauge(sc);
    renderFlow(sc);
  }

  document.querySelectorAll(".scenario-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setScenario(btn.dataset.scenario);
    });
  });

  // initial render
  if (signalListEl) {
    setScenario("home");

    // live telemetry jitter
    window.setInterval(function () {
      var base = SCENARIOS[currentScenario].base;
      liveValues = liveValues.map(function (v, i) {
        var jitter = (Math.random() - 0.5) * 12;
        var next = v + jitter;
        var min = Math.max(2, base[i] - 18);
        var max = Math.min(98, base[i] + 18);
        return Math.min(max, Math.max(min, next));
      });
      liveValues.forEach(function (v, i) {
        var bar = signalListEl.querySelector('.signal-bar-fill[data-idx="' + i + '"]');
        var val = signalListEl.querySelector('.signal-val[data-validx="' + i + '"]');
        if (bar) bar.style.width = v + "%";
        if (val) val.textContent = Math.round(v) + "%";
      });
    }, 1500);
  }

  // live clock
  var liveClock = document.getElementById("liveClock");
  if (liveClock) {
    function tickClock() {
      var d = new Date();
      var hh = String(d.getHours()).padStart(2, "0");
      var mm = String(d.getMinutes()).padStart(2, "0");
      var ss = String(d.getSeconds()).padStart(2, "0");
      liveClock.textContent = hh + ":" + mm + ":" + ss;
    }
    tickClock();
    window.setInterval(tickClock, 1000);
  }

  /* ---------------- Phantom+ toggle ---------------- */
  var toggleMonthly = document.getElementById("toggleMonthly");
  var toggleAnnual = document.getElementById("toggleAnnual");
  var togglePill = document.getElementById("togglePill");
  var plans = [
    { key: "Basic", monthly: 199 },
    { key: "Pro", monthly: 399 },
    { key: "Elite", monthly: 699 },
  ];

  function setBilling(annual) {
    togglePill.style.left = annual ? "calc(50% + 0px)" : "4px";
    toggleMonthly.classList.toggle("active", !annual);
    toggleAnnual.classList.toggle("active", annual);

    plans.forEach(function (p) {
      var priceEl = document.getElementById("price" + p.key);
      var periodEl = document.getElementById("period" + p.key);
      var billedEl = document.getElementById("billed" + p.key);
      var newVal = annual ? Math.round(p.monthly * 10) : p.monthly;
      var current = parseFloat((priceEl.textContent || "").replace(/[^\d.]/g, "")) || p.monthly;
      priceEl.dataset.currentVal = current;
      animateNumber(priceEl, newVal, { prefix: "₹", suffix: "", decimals: 0, duration: 600 });
      periodEl.textContent = annual ? "/yr" : "/mo";
      billedEl.textContent = annual ? "≈ ₹" + p.monthly + "/mo billed yearly" : "billed monthly";
    });
  }
  if (toggleMonthly && toggleAnnual) {
    toggleMonthly.addEventListener("click", function () { setBilling(false); });
    toggleAnnual.addEventListener("click", function () { setBilling(true); });
  }

  /* ---------------- Cart configurator ---------------- */
  var modelGrid = document.getElementById("modelGrid");
  var qtyMinus = document.getElementById("qtyMinus");
  var qtyPlus = document.getElementById("qtyPlus");
  var qtyValue = document.getElementById("qtyValue");
  var cartTotal = document.getElementById("cartTotal");
  var selectedModel = { name: "Air", price: 4999 };
  var qty = 1;

  function updateCartTotal() {
    var newTotal = selectedModel.price * qty;
    var current = parseFloat((cartTotal.textContent || "").replace(/[^\d.]/g, "")) || newTotal;
    cartTotal.dataset.currentVal = current;
    animateNumber(cartTotal, newTotal, { prefix: "₹", suffix: "", decimals: 0, duration: 500 });
  }

  if (modelGrid) {
    modelGrid.querySelectorAll(".model-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        modelGrid.querySelectorAll(".model-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        selectedModel = { name: btn.dataset.name, price: parseFloat(btn.dataset.price) };
        updateCartTotal();
      });
    });
  }
  if (qtyMinus && qtyPlus) {
    qtyMinus.addEventListener("click", function () {
      qty = Math.max(1, qty - 1);
      qtyValue.textContent = qty;
      updateCartTotal();
    });
    qtyPlus.addEventListener("click", function () {
      qty += 1;
      qtyValue.textContent = qty;
      updateCartTotal();
    });
  }

  /* ---------------- forms: prevent real submission ---------------- */
  var bizForm = document.getElementById("bizForm");
  if (bizForm) {
    bizForm.addEventListener("submit", function (e) {
      e.preventDefault();
    });
  }
})();
