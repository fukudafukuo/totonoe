/* ============================================================
 * 価格・セール・Windows版の期間設定
 * 日付は日本時間(Asia/Tokyo)で判定する。from / to は両端を含む。
 * 比較価格(REGULAR_PRICE)は実際に販売している通常価格のみ。
 * 動作確認用に、URLへ ?date=2026-11-20 を付けるとその日付として表示する。
 * ============================================================ */
var REGULAR_PRICE = 9800;
var PERIODS = [
  { id: 'regular-beta',  from: '0000-01-01', to: '2026-11-15', price: 9800, sale: null,
    win: 'beta' },
  { id: 'win-launch',    from: '2026-11-16', to: '2026-11-26', price: 7800, sale: 'Windows版発売記念', until: '11月26日',
    win: 'official' },
  { id: 'blackfriday',   from: '2026-11-27', to: '2026-12-01', price: 6800, sale: 'ブラックフライデー', until: '12月1日',
    win: 'official' },
  { id: 'regular-after', from: '2026-12-02', to: '9999-12-31', price: 9800, sale: null,
    win: 'official' }
];

(function () {
  'use strict';

  /* ---------- 日付と期間 ---------- */
  function todayJst() {
    try {
      var q = new URLSearchParams(location.search).get('date');
      if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return q;
    } catch (e) {}
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(new Date());
    } catch (e) {
      var d = new Date(Date.now() + 9 * 3600 * 1000);
      return d.toISOString().slice(0, 10);
    }
  }
  function currentPeriod(day) {
    for (var i = 0; i < PERIODS.length; i++) {
      if (day >= PERIODS[i].from && day <= PERIODS[i].to) return PERIODS[i];
    }
    return PERIODS[PERIODS.length - 1];
  }
  function yen(n) { return '¥' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  function applyPeriod() {
    var p = currentPeriod(todayJst());
    var onSale = p.price < REGULAR_PRICE;
    document.documentElement.setAttribute('data-period', p.id);

    // 価格表示
    var prices = document.querySelectorAll('.js-price');
    for (var i = 0; i < prices.length; i++) {
      var el = prices[i];
      if (onSale) {
        el.innerHTML =
          '<span class="sr-only">通常価格 </span><s class="price-was">' + yen(REGULAR_PRICE) + '</s>' +
          '<span class="sr-only">セール価格 </span><span class="price-now">' + yen(p.price) + '</span>' +
          '<span class="sale-tag">' + p.sale + '</span>';
      } else {
        el.innerHTML = '<span class="price-now">' + yen(REGULAR_PRICE) + '</span>';
      }
    }
    var untils = document.querySelectorAll('.js-until');
    for (var j = 0; j < untils.length; j++) {
      untils[j].textContent = onSale ? 'セールは' + p.until + 'まで（日本時間）' : '';
      untils[j].hidden = !onSale;
    }

    // Windows版の文言
    var betas = document.querySelectorAll('[data-win-beta]');
    var offs = document.querySelectorAll('[data-win-official]');
    for (var b = 0; b < betas.length; b++) betas[b].hidden = (p.win !== 'beta');
    for (var o = 0; o < offs.length; o++) offs[o].hidden = (p.win !== 'official');

    // バナー
    var banner = document.getElementById('banner');
    if (banner) {
      var html = '';
      if (onSale) {
        html = '<strong>' + p.sale + 'セール中</strong>　' + yen(REGULAR_PRICE) + ' から ' + yen(p.price) +
          '（' + p.until + 'まで）　<a href="#pricing">価格を見る</a>';
      } else if (p.win === 'beta') {
        html = 'Windows版の無料ベータを公開中です（2026年11月15日まで）　<a href="#windows">Windows版について</a>';
      }
      if (html) { banner.innerHTML = html; banner.hidden = false; } else { banner.hidden = true; }
    }
  }

  /* ---------- Before/After 比較スライダー ---------- */
  function initSlider(root) {
    var handle = root.querySelector('.cmp-handle');
    var pos = 50;
    function set(v, announce) {
      pos = Math.max(0, Math.min(100, v));
      root.style.setProperty('--pos', pos + '%');
      handle.setAttribute('aria-valuenow', String(Math.round(pos)));
      handle.setAttribute('aria-valuetext', '左側がBefore、右側がAfter。境界は左から' + Math.round(pos) + '%の位置');
    }
    function fromEvent(e) {
      var r = root.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100);
    }
    var dragging = false;
    root.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button > 0) return;
      dragging = true;
      try { root.setPointerCapture(e.pointerId); } catch (err) {}
      fromEvent(e);
    });
    root.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
    function end() { dragging = false; }
    root.addEventListener('pointerup', end);
    root.addEventListener('pointercancel', end);
    root.addEventListener('lostpointercapture', end);
    handle.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 10 : 2, handled = true;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') set(pos - step);
      else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') set(pos + step);
      else if (e.key === 'PageDown') set(pos - 10);
      else if (e.key === 'PageUp') set(pos + 10);
      else if (e.key === 'Home') set(0);
      else if (e.key === 'End') set(100);
      else handled = false;
      if (handled) e.preventDefault();
    });
    set(50);
  }

  /* ---------- 細部の比較タブ(JSなしでは全て縦に並ぶ) ---------- */
  function initTabs(root) {
    var figs = Array.prototype.slice.call(root.querySelectorAll('.fig'));
    if (figs.length < 2) return;
    root.classList.add('is-tabs');
    var nav = document.createElement('div');
    nav.className = 'tabs-nav';
    nav.setAttribute('role', 'tablist');
    nav.setAttribute('aria-label', '細部の比較');
    var btns = [];
    function select(i, focus) {
      figs.forEach(function (f, k) {
        f.hidden = (k !== i);
        btns[k].setAttribute('aria-selected', k === i ? 'true' : 'false');
        btns[k].tabIndex = (k === i) ? 0 : -1;
      });
      if (focus) btns[i].focus();
    }
    figs.forEach(function (f, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tab-btn';
      b.setAttribute('role', 'tab');
      b.id = 'tab-' + i;
      b.setAttribute('aria-controls', f.id);
      b.textContent = f.getAttribute('data-tab-label');
      f.setAttribute('role', 'tabpanel');
      f.setAttribute('aria-labelledby', b.id);
      b.addEventListener('click', function () { select(i); });
      b.addEventListener('keydown', function (e) {
        var n = figs.length, t = null;
        if (e.key === 'ArrowRight') t = (i + 1) % n;
        else if (e.key === 'ArrowLeft') t = (i - 1 + n) % n;
        else if (e.key === 'Home') t = 0;
        else if (e.key === 'End') t = n - 1;
        if (t !== null) { e.preventDefault(); select(t, true); }
      });
      nav.appendChild(b);
      btns.push(b);
    });
    root.insertBefore(nav, root.firstChild);
    select(0);
  }

  /* ---------- Vimeo(クリックで読み込む軽量埋め込み) ---------- */
  function initVideo(a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      var id = a.getAttribute('data-vimeo');
      var f = document.createElement('iframe');
      f.src = 'https://player.vimeo.com/video/' + id + '?autoplay=1&dnt=1';
      f.title = 'Totonoe Skin Retouch デモ動画';
      f.allow = 'autoplay; fullscreen; picture-in-picture';
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      a.appendChild(f);
      f.focus();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyPeriod();
    var cmp = document.querySelectorAll('.cmp');
    for (var i = 0; i < cmp.length; i++) initSlider(cmp[i]);
    var tabs = document.querySelector('[data-tabs]');
    if (tabs) initTabs(tabs);
    var v = document.querySelector('[data-vimeo]');
    if (v) initVideo(v);
  });
})();
