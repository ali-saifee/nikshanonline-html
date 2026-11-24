/* Nikshan Online: plain JavaScript (no framework).
   Handles the hero slider, menus, product sections, cart drawer, shop filters and checkout. */
(function () {
  "use strict";

  const D = window.NIKSHAN;
  const P = D.products;

  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const inr = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
  const icons = () => window.lucide && window.lucide.createIcons();
  const catHref = (name) => `shop.html?category=${encodeURIComponent(name)}`;
  const discountOf = (p) => p.discount ?? Math.round(((p.mrp - p.price) / p.mrp) * 100);
  const bySlug = Object.fromEntries(P.map((p) => [p.slug, p]));

  function query({ category, brand, tag, search, sort = "popular", limit = 60 } = {}) {
    const s = (search || "").toLowerCase();
    let r = P.filter((p) =>
      (!category || p.category === category) &&
      (!brand || p.brand === brand.toUpperCase()) &&
      (!tag || (p.tags || []).includes(tag)) &&
      (!s || [p.name, p.brand, p.category].some((x) => x.toLowerCase().includes(s))));
    const [key, dir] = { price_asc: ["price", 1], price_desc: ["price", -1], discount: ["discount", -1], popular: ["reviews", -1] }[sort] || ["reviews", -1];
    r = [...r].sort((a, b) => (a[key] - b[key]) * dir);
    return r.slice(0, limit);
  }

  function toast(msg) {
    const box = $("#toast");
    if (!box) return;
    const el = document.createElement("div");
    el.className = "animate-fade-up flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg";
    el.innerHTML = `<i data-lucide="circle-check" class="h-4 w-4"></i>${esc(msg)}`;
    box.appendChild(el);
    icons();
    setTimeout(() => el.remove(), 2600);
  }

  /* ---------- cart (saved in the browser) ---------- */
  const CART_KEY = "nikshan_cart";
  const Cart = {
    items() {
      try { return (JSON.parse(localStorage.getItem(CART_KEY)) || []).filter((i) => bySlug[i.slug]); } catch (e) { return []; }
    },
    save(items) { localStorage.setItem(CART_KEY, JSON.stringify(items)); renderCart(); },
    add(slug, qty = 1) {
      const items = this.items();
      const found = items.find((i) => i.slug === slug);
      if (found) found.qty = Math.min(20, found.qty + qty); else items.push({ slug, qty });
      this.save(items);
    },
    update(slug, qty) {
      const items = this.items();
      const next = qty > 0 ? items.map((i) => (i.slug === slug ? { slug, qty: Math.min(20, qty) } : i)) : items.filter((i) => i.slug !== slug);
      this.save(next);
    },
    remove(slug) { this.save(this.items().filter((i) => i.slug !== slug)); },
    summary() {
      const lines = this.items().map((i) => { const p = bySlug[i.slug]; return { ...p, qty: i.qty, line: p.price * i.qty }; });
      return { lines, subtotal: lines.reduce((a, l) => a + l.line, 0), count: lines.reduce((a, l) => a + l.qty, 0) };
    },
  };

  function renderCart() {
    const { lines, subtotal, count } = Cart.summary();
    const badge = $("#cart-count");
    if (badge) { badge.textContent = count; badge.classList.toggle("hidden", count === 0); }
    const title = $("#cart-title-count");
    if (title) title.textContent = `(${count} items)`;
    const body = $("#cart-body");
    if (!body) return;

    if (!lines.length) {
      body.innerHTML = `
        <div class="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
          <i data-lucide="shopping-bag" class="h-12 w-12 text-slate-200"></i>
          <p class="text-slate-500">Your cart is empty.</p>
          <button data-action="close-cart" class="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-600">Continue shopping</button>
        </div>`;
    } else {
      body.innerHTML = `
        <div class="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          ${lines.map((l) => `
          <div class="flex gap-3" data-testid="cart-item-${esc(l.slug)}">
            <div class="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-slate-50 p-1.5"><img src="${esc(l.image)}" alt="${esc(l.name)}" class="h-full w-full object-contain"></div>
            <div class="flex flex-1 flex-col">
              <p class="line-clamp-2 text-sm font-semibold text-slate-800">${esc(l.name)}</p>
              <p class="text-xs text-slate-400">${esc(l.brand)}</p>
              <div class="mt-auto flex items-center justify-between">
                <div class="flex items-center gap-1 rounded-full border border-gray-200">
                  <button data-action="dec" data-slug="${esc(l.slug)}" aria-label="Decrease" class="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"><i data-lucide="minus" class="h-3.5 w-3.5"></i></button>
                  <span class="w-6 text-center text-sm font-semibold">${l.qty}</span>
                  <button data-action="inc" data-slug="${esc(l.slug)}" aria-label="Increase" class="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"><i data-lucide="plus" class="h-3.5 w-3.5"></i></button>
                </div>
                <span class="text-sm font-extrabold text-slate-900">${inr(l.line)}</span>
              </div>
            </div>
            <button data-action="remove" data-slug="${esc(l.slug)}" aria-label="Remove" class="self-start text-slate-300 hover:text-rose-600"><i data-lucide="trash-2" class="h-4 w-4"></i></button>
          </div>`).join("")}
        </div>
        <div class="border-t border-gray-100 p-5">
          <div class="mb-3 flex items-center justify-between">
            <span class="text-slate-500">Subtotal</span>
            <span data-testid="cart-subtotal" class="font-display text-2xl font-extrabold text-slate-900">${inr(subtotal)}</span>
          </div>
          <p class="mb-3 text-xs text-slate-400">Taxes &amp; free shipping calculated at secure checkout.</p>
          <button data-action="checkout" data-testid="checkout-button" class="flex w-full items-center justify-center gap-2 rounded-full bg-rose-600 py-3.5 text-sm font-bold text-white transition-[transform,background-color] hover:bg-rose-700 hover:scale-[1.01] active:scale-95 disabled:opacity-60">Proceed to Checkout</button>
        </div>`;
    }
    icons();
  }

  function openCart() {
    $("#cart-overlay").classList.remove("hidden");
    $("#cart-drawer").classList.remove("translate-x-full");
    $("#cart-drawer").setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeCart() {
    $("#cart-overlay").classList.add("hidden");
    $("#cart-drawer").classList.add("translate-x-full");
    $("#cart-drawer").setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function checkout(btn) {
    const { lines, subtotal } = Cart.summary();
    if (!lines.length) return;
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-circle" class="h-4 w-4 animate-spin"></i> Redirecting…`;
    icons();
    // DEMO checkout: records the order in the browser and shows the confirmation page.
    const id = "demo_" + Date.now().toString(36);
    const orders = JSON.parse(localStorage.getItem("nikshan_orders") || "{}");
    orders[id] = { id, amount: subtotal, items: lines.map((l) => ({ slug: l.slug, qty: l.qty, price: l.price })), created: new Date().toISOString() };
    localStorage.setItem("nikshan_orders", JSON.stringify(orders));
    localStorage.removeItem(CART_KEY);
    setTimeout(() => { window.location.href = `success.html?session_id=${id}`; }, 700);
  }

  /* ---------- product card ---------- */
  function productCard(p, index = 0) {
    const d = discountOf(p);
    return `
    <div data-testid="product-card-${esc(p.slug)}" class="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgb(15,23,42,0.10)]" style="animation: fade-up 0.5s ease-out ${index * 0.04}s both">
      ${d > 0 ? `<span class="absolute left-3 top-3 z-10 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white">-${d}%</span>` : ""}
      <div class="relative aspect-square overflow-hidden bg-slate-50 p-5">
        <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" class="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-105">
      </div>
      <div class="flex flex-1 flex-col gap-2 p-4 pt-3">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">${esc(p.brand)}</span>
          <span class="flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700"><i data-lucide="star" class="h-3 w-3 fill-emerald-600 text-emerald-600"></i> ${p.rating}</span>
        </div>
        <h3 class="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-slate-900">${esc(p.name)}</h3>
        <p class="line-clamp-1 text-xs text-slate-500">${esc(p.tagline)}</p>
        <div class="mt-auto flex items-end justify-between pt-2">
          <div class="flex flex-col">
            <div class="flex items-baseline gap-2">
              <span class="font-display text-lg font-extrabold text-slate-900">${inr(p.price)}</span>
              ${p.mrp > p.price ? `<span class="text-xs text-slate-400 price-strike">${inr(p.mrp)}</span>` : ""}
            </div>
            <span class="text-[11px] font-medium text-slate-500">No Cost EMI available</span>
          </div>
          <button data-add="${esc(p.slug)}" data-testid="add-to-cart-${esc(p.slug)}" aria-label="Add ${esc(p.name)} to cart" class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition-[transform,background-color] duration-200 hover:scale-105 hover:bg-rose-600 active:scale-95"><i data-lucide="plus" class="h-5 w-5"></i></button>
        </div>
      </div>
    </div>`;
  }

  /* ---------- category intro banners (one colour scheme per category) ---------- */
  const BANNERS = {
    deals: { eyebrow: "Lowest prices", title: "Top Deals of the Season", intro: "Handpicked price drops across TVs, appliances, audio and more — grab them while they last.", image: "https://images.unsplash.com/photo-1589003077984-894e133dabab", brands: ["HAIER", "BOSCH", "BOAT", "SUJATA"], to: "shop.html?sort=discount", dark: true, bg: "bg-rose-700", accent: "text-rose-200", glow: "bg-rose-400/30", q: { sort: "discount", limit: 8 } },
    mobiles: { eyebrow: "Latest launches", title: "Newest Mobiles & Gadgets", intro: "The newest flagships from Apple, Samsung and Vivo — pro cameras, all-day batteries, No Cost EMI.", image: "https://customer-assets-jt897jd0.emergentagent.net/job_nikshan-deals--554odrie/artifacts/d719c157e9879487_Screenshot%202026-11-21%20at%208.14.57%E2%80%AFPM.png", brands: ["APPLE", "SAMSUNG", "VIVO"], to: catHref("Mobiles & Gadgets"), dark: true, bg: "bg-blue-950", accent: "text-sky-300", glow: "bg-sky-400/25", contain: true, q: { category: "Mobiles & Gadgets", limit: 4 } },
    laptops: { eyebrow: "Work & play", title: "Laptops — MacBook, Gaming & More", intro: "From the MacBook Pro M4 to RTX gaming rigs — power for work, study and play.", image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2", brands: ["APPLE", "ASUS", "HP", "DELL", "ACER"], to: catHref("Laptops & Accessories"), dark: true, bg: "bg-zinc-900", accent: "text-cyan-300", glow: "bg-cyan-400/20", q: { category: "Laptops & Accessories", limit: 4 } },
    tvs: { eyebrow: "Big screen", title: "TV & Home Entertainment", intro: "4K QLED and Mini LED Google TVs with Dolby Vision & Atmos — the cinema, in your living room.", image: "https://images.unsplash.com/photo-1593784991251-92ded75ea290", brands: ["SONY", "LG", "VU", "HAIER"], to: catHref("TV & Home Entertainment"), dark: true, bg: "bg-neutral-950", accent: "text-amber-300", glow: "bg-amber-400/20", q: { category: "TV & Home Entertainment", limit: 4 } },
    speakers: { eyebrow: "Turn it up", title: "Latest Speakers — JBL, boAt & More", intro: "Portable party speakers and everyday earphones with big, bold sound.", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1", brands: ["JBL", "BOAT", "MARSHALL"], to: catHref("Audio & Speakers"), dark: true, bg: "bg-teal-950", accent: "text-lime-300", glow: "bg-lime-400/20", q: { category: "Audio & Speakers", limit: 4 } },
    appliances: { eyebrow: "For every home", title: "Washing Machines & Home Appliances", intro: "Fully-automatic washers, dishwashers and Dyson cleaning — smarter chores for the whole family.", image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1", brands: ["LG", "SAMSUNG", "BOSCH", "DYSON", "IFB"], to: catHref("Home Appliances"), dark: false, bg: "bg-stone-100", accent: "text-amber-700", glow: "bg-amber-300/40", q: { category: "Home Appliances", limit: 4 } },
    personal: { eyebrow: "Look & feel great", title: "Personal Care", intro: "Salon-grade hair dryers, straighteners and shavers from Dyson, Philips, Braun and Panasonic.", image: "https://images.unsplash.com/photo-1727755868077-22f0d2ff8353", brands: ["DYSON", "PHILIPS", "BRAUN", "PANASONIC"], to: catHref("Personal Care"), dark: false, bg: "bg-rose-50", accent: "text-rose-600", glow: "bg-rose-300/40", q: { category: "Personal Care", limit: 4 } },
  };

  function categoryBanner(id) {
    const b = BANNERS[id];
    const text = b.dark ? "text-white" : "text-slate-900";
    const sub = b.dark ? "text-white/75" : "text-slate-600";
    const chip = b.dark ? "border-white/15 bg-white/10 text-white" : "border-slate-900/10 bg-white text-slate-800";
    const btn = b.dark ? "bg-white text-slate-900 hover:bg-rose-600 hover:text-white" : "bg-slate-900 text-white hover:bg-rose-600";
    return `
    <div data-testid="category-banner-${id}" class="relative mb-6 grid overflow-hidden rounded-[2rem] ${b.bg} lg:h-[340px] lg:grid-cols-[1.15fr_1fr]">
      <div class="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full blur-3xl ${b.glow}"></div>
      <div class="relative flex flex-col justify-center gap-4 px-7 py-9 sm:px-10">
        <span class="text-xs font-bold uppercase tracking-[0.25em] ${b.accent}">${esc(b.eyebrow)}</span>
        <h2 class="font-display text-3xl font-black leading-tight tracking-tight sm:text-4xl ${text}">${esc(b.title)}</h2>
        <p class="max-w-lg text-sm sm:text-base ${sub}">${esc(b.intro)}</p>
        <div class="flex flex-wrap gap-2">${b.brands.map((br) => `<span class="rounded-full border px-3 py-1 text-[11px] font-bold tracking-widest ${chip}">${br}</span>`).join("")}</div>
        <a href="${b.to}" data-testid="category-banner-cta-${id}" class="group mt-1 inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-[transform,background-color] hover:scale-[1.02] active:scale-95 ${btn}">Explore all <i data-lucide="arrow-right" class="h-4 w-4 transition-transform group-hover:translate-x-1"></i></a>
      </div>
      <div class="relative h-56 overflow-hidden lg:h-full ${b.contain ? "bg-[#f2f2f4]" : ""}">
        <img src="${esc(b.image)}" alt="${esc(b.title)}" loading="lazy" class="h-full w-full transition-transform duration-700 hover:scale-105 ${b.contain ? "object-contain p-6" : "object-cover"}">
      </div>
    </div>`;
  }

  const grid = (items) => `<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">${items.map(productCard).join("")}</div>`;

  /* ---------- home page ---------- */
  function initHome() {
    $("#category-grid").innerHTML = D.categories.map((c, i) => `
      <a href="${catHref(c.name)}" data-testid="category-tile-${c.slug}" class="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-slate-50 transition-colors hover:bg-slate-100" style="animation: fade-up 0.5s ease-out ${i * 0.05}s both">
        <div class="aspect-[4/3] overflow-hidden"><img src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy" class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"></div>
        <div class="flex items-center justify-between p-4"><span class="text-sm font-semibold text-slate-800">${esc(c.name)}</span><span class="text-rose-600 opacity-0 transition-opacity group-hover:opacity-100">→</span></div>
      </a>`).join("");

    $$("[data-section]").forEach((el) => {
      const id = el.dataset.section;
      const items = query(BANNERS[id].q);
      el.innerHTML = items.length ? categoryBanner(id) + grid(items) : "";
    });

    const brands = [...D.brands, ...D.brands];
    $("#brand-track").innerHTML = brands.map((b) => `<a href="shop.html?brand=${encodeURIComponent(b)}" class="mx-6 flex shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white px-8 py-4 font-display text-xl font-black tracking-tight text-slate-400 transition-colors hover:text-slate-900">${esc(b)}</a>`).join("");

    $("#hero-steals").innerHTML = query({ tag: "under299", sort: "price_asc", limit: 4 }).map((p) => `
      <a href="shop.html?tag=under299" data-testid="hero-steal-${esc(p.slug)}" class="group flex flex-col overflow-hidden rounded-2xl bg-white p-2 shadow-lg transition-transform hover:-translate-y-1">
        <div class="aspect-square overflow-hidden rounded-xl bg-slate-50"><img src="${esc(p.image)}" alt="${esc(p.name)}" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"></div>
        <p class="mt-2 line-clamp-1 px-1 text-xs font-semibold text-slate-800">${esc(p.name)}</p>
        <p class="px-1 pb-1 font-display text-base font-black text-rose-600">${inr(p.price)}</p>
      </a>`).join("");

    initSlider();
  }

  function initSlider() {
    const slides = $$("[data-slide]");
    const dots = $$("[data-dot]");
    let i = 0, timer = null;
    const show = (n) => {
      i = ((n % slides.length) + slides.length) % slides.length;
      slides.forEach((s, k) => {
        s.classList.toggle("hidden", k !== i);
        if (k === i) { s.classList.remove("animate-fade-up"); void s.offsetWidth; s.classList.add("animate-fade-up"); }
      });
      dots.forEach((d, k) => { d.className = "h-2 rounded-full transition-all " + (k === i ? "w-7 bg-rose-600" : "w-2.5 bg-slate-300 hover:bg-slate-400"); });
    };
    const start = () => { clearInterval(timer); timer = setInterval(() => show(i + 1), 6000); };
    const go = (n) => { show(n); start(); };
    $("#hero-prev").addEventListener("click", () => go(i - 1));
    $("#hero-next").addEventListener("click", () => go(i + 1));
    dots.forEach((d) => d.addEventListener("click", () => go(Number(d.dataset.dot))));
    start();
  }

  /* ---------- header menus ---------- */
  function setTrigger(btn, open) {
    const on = btn.dataset.openClass.split(" "), off = btn.dataset.closedClass.split(" ");
    btn.classList.remove(...(open ? off : on));
    btn.classList.add(...(open ? on : off));
    const chev = btn.querySelector("svg:last-child");
    if (chev) chev.classList.toggle("rotate-180", open);
  }
  const POPS = [["#allcat-trigger", "#allcat-panel"], ["#more-trigger", "#more-panel"]];
  function closePops() {
    POPS.forEach(([t, p]) => { const tr = $(t), pa = $(p); if (tr && pa) { pa.classList.add("hidden"); setTrigger(tr, false); } });
  }

  function initMenus() {
    POPS.forEach(([t, p]) => {
      const tr = $(t), pa = $(p);
      if (!tr) return;
      tr.addEventListener("click", (e) => {
        e.stopPropagation();
        const willOpen = pa.classList.contains("hidden");
        closePops();
        if (willOpen) { pa.classList.remove("hidden"); pa.classList.remove("pop-in"); void pa.offsetWidth; pa.classList.add("pop-in"); setTrigger(tr, true); }
      });
    });

    // All Categories mega-menu content
    const info = {};
    P.forEach((p) => {
      const c = (info[p.category] = info[p.category] || { count: 0, brands: [], top: [] });
      c.count += 1;
      if (!c.brands.includes(p.brand)) c.brands.push(p.brand);
      if (c.top.length < 3) c.top.push(p);
    });
    const list = $("#allcat-list"), detail = $("#allcat-detail");
    if (!list) return;
    let active = 0;
    const renderList = () => {
      list.innerHTML = D.categories.map((c, idx) => `
        <li><a href="${catHref(c.name)}" data-idx="${idx}" aria-current="${idx === active}" data-testid="menu-cat-${c.slug}" class="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${idx === active ? "bg-white font-bold text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}">
          <span class="flex items-center gap-3"><img src="${esc(c.image)}" alt="" class="h-8 w-8 rounded-lg object-cover">${esc(c.name)}</span>
          <span class="text-xs text-slate-400">${info[c.name]?.count || 0}</span>
        </a></li>`).join("");
    };
    const renderDetail = () => {
      const c = D.categories[active], ci = info[c.name];
      detail.innerHTML = `
        <div class="relative h-36 overflow-hidden rounded-2xl">
          <img src="${esc(c.image)}" alt="${esc(c.name)}" class="h-full w-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-r from-slate-950/80 to-transparent"></div>
          <div class="absolute bottom-4 left-5 text-white">
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-rose-300">${ci?.count || 0} products</p>
            <p class="font-display text-2xl font-black">${esc(c.name)}</p>
          </div>
        </div>
        ${ci ? `
        <p class="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Brands</p>
        <div class="mt-2 flex flex-wrap gap-2">${ci.brands.map((b) => `<a href="shop.html?brand=${encodeURIComponent(b)}" class="rounded-full border border-gray-200 px-3 py-1 text-[11px] font-bold tracking-widest text-slate-700 transition-colors hover:border-slate-900 hover:bg-slate-900 hover:text-white">${esc(b)}</a>`).join("")}</div>
        <p class="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Popular picks</p>
        <div class="mt-2 grid grid-cols-3 gap-3">${ci.top.map((p) => `
          <a href="${catHref(c.name)}" class="group rounded-xl border border-gray-100 p-2 transition-shadow hover:shadow-md">
            <div class="aspect-square overflow-hidden rounded-lg bg-slate-50"><img src="${esc(p.image)}" alt="${esc(p.name)}" class="h-full w-full object-contain transition-transform group-hover:scale-105"></div>
            <p class="mt-1.5 line-clamp-1 text-xs font-semibold text-slate-800">${esc(p.name)}</p>
          </a>`).join("")}</div>` : ""}
        <a href="${catHref(c.name)}" data-testid="menu-cat-view-all" class="group mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-600">Shop ${esc(c.name)} <i data-lucide="arrow-right" class="h-4 w-4 transition-transform group-hover:translate-x-1"></i></a>`;
      icons();
    };
    const selectCategory = (a) => {
      if (!a || Number(a.dataset.idx) === active) return;
      active = Number(a.dataset.idx);
      $$("[data-idx]", list).forEach((el) => {
        const on = Number(el.dataset.idx) === active;
        el.setAttribute("aria-current", String(on));
        el.className = "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors " + (on ? "bg-white font-bold text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900");
      });
      renderDetail();
      detail.scrollTop = 0;
    };
    list.addEventListener("mouseover", (e) => {
      if (!list.closest("dialog")) selectCategory(e.target.closest("[data-idx]"));
    });
    list.addEventListener("click", (e) => {
      const link = e.target.closest("[data-idx]");
      if (link && list.closest("dialog")) {
        e.preventDefault();
        selectCategory(link);
      }
    });
    renderList();
    renderDetail();
  }

  /* ---------- shop page ---------- */
  function initShop() {
    const render = () => {
      const params = new URLSearchParams(location.search);
      const f = { category: params.get("category") || "", brand: params.get("brand") || "", tag: params.get("tag") || "", search: params.get("search") || "", sort: params.get("sort") || "popular" };
      const items = query({ ...f, limit: 200 });
      const title = f.search ? `Results for "${f.search}"` : f.category || f.brand || ({ premium: "Premium Picks", featured: "Top Deals", under299: "Under ₹299" }[f.tag] || (f.sort === "discount" ? "Top Deals" : "All Products"));
      $("#shop-title").textContent = title;
      document.title = `${title} | Nikshan Online`;
      $("#shop-count").textContent = `${items.length} products`;
      $("#sort-select").value = f.sort;
      $$("input[name=search]").forEach((inp) => { inp.value = f.search; });

      const btn = (label, value, testid) => {
        const on = (f.category || "") === value;
        return `<li><button data-cat="${esc(value)}" data-testid="${testid}" class="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${on ? "bg-slate-900 font-semibold text-white" : "text-slate-600 hover:bg-slate-100"}">${esc(label)}</button></li>`;
      };
      $("#shop-cats").innerHTML = btn("All Categories", "", "filter-cat-all") + D.categories.map((c) => btn(c.name, c.name, `filter-cat-${c.slug}`)).join("");

      $("#shop-grid").innerHTML = items.length
        ? `<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">${items.map(productCard).join("")}</div>`
        : `<div class="rounded-2xl border border-dashed border-gray-200 py-24 text-center text-slate-500">No products found. Try a different filter.</div>`;
      icons();
    };
    const setParam = (k, v) => {
      const params = new URLSearchParams(location.search);
      if (v) params.set(k, v); else params.delete(k);
      try {
        history.pushState(null, "", `${location.pathname}?${params}`);
      } catch (e) {
        // some browsers block history updates for files opened from disk: reload with the new filters
        location.search = params.toString();
        return;
      }
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    $("#sort-select").addEventListener("change", (e) => setParam("sort", e.target.value));
    $("#shop-cats").addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (b) setParam("category", b.dataset.cat); });
    window.addEventListener("popstate", render);
    render();
  }

  /* ---------- order confirmation page ---------- */
  function initSuccess() {
    const id = new URLSearchParams(location.search).get("session_id");
    const order = id && JSON.parse(localStorage.getItem("nikshan_orders") || "{}")[id];
    setTimeout(() => {
      $("#state-checking").classList.add("hidden");
      if (order) {
        $("#paid-text").textContent = `Thank you for shopping with Nikshan Online. We've received ${inr(order.amount)}.`;
        $("#state-paid").classList.remove("hidden");
      } else {
        $("#state-failed").classList.remove("hidden");
      }
    }, 900);
  }

  /* ---------- global events ---------- */
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) {
      const p = bySlug[add.dataset.add];
      Cart.add(p.slug);
      openCart();
      toast(`${p.name.slice(0, 40)} added to cart`);
      return;
    }
    const act = e.target.closest("[data-action]");
    if (act) {
      const a = act.dataset.action, slug = act.dataset.slug;
      const cur = Cart.items().find((i) => i.slug === slug);
      if (a === "inc") Cart.update(slug, cur.qty + 1);
      if (a === "dec") Cart.update(slug, cur.qty - 1);
      if (a === "remove") Cart.remove(slug);
      if (a === "close-cart") closeCart();
      if (a === "checkout") checkout(act);
      return;
    }
    if (!e.target.closest("[data-pop]")) closePops();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closePops(); closeCart(); } });

  document.addEventListener("DOMContentLoaded", () => {
    $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
    $("#cart-button").addEventListener("click", openCart);
    $("#cart-close").addEventListener("click", closeCart);
    $("#cart-overlay").addEventListener("click", closeCart);
    initMenus();
    if ($("#home")) initHome();
    if ($("#shop")) initShop();
    if ($("#success")) initSuccess();
    renderCart();
    icons();
  });
})();
