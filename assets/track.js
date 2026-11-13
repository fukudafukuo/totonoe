/* GA4 click tracking for BOOTH / Gumroad links (delegated, no personal data). */
(function () {
  'use strict';
  function eventFor(href) {
    if (href.indexOf('booth.pm') !== -1) {
      if (href.indexOf('items/9143928') !== -1) return 'click_booth_resolve_buy';
      if (href.indexOf('items/9143931') !== -1) return 'click_booth_resolve_trial';
      if (href.indexOf('items/8663073') !== -1) return 'click_booth_buy';
      if (href.indexOf('items/8892910') !== -1) return 'click_booth_trial';
      if (href.indexOf('items/9047647') !== -1) return 'click_booth_win';
      return 'click_booth_shop';
    }
    if (href.indexOf('gumroad.com') !== -1) return 'click_gumroad';
    return null;
  }
  document.addEventListener('click', function (e) {
    try {
      if (typeof window.gtag !== 'function') return;
      var t = e.target;
      var a = t && t.closest ? t.closest('a[href]') : null;
      if (!a) return;
      var href = a.href || a.getAttribute('href') || '';
      var name = eventFor(href);
      if (!name) return;
      var sec = a.closest('section, header, footer');
      var loc = sec ? (sec.id || sec.tagName.toLowerCase()) : a.tagName.toLowerCase();
      window.gtag('event', name, {
        link_url: href,
        link_location: loc,
        page_lang: document.documentElement.lang || '',
        transport_type: 'beacon'
      });
    } catch (err) { /* never break navigation */ }
  }, true);
})();
