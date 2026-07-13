/* ============================================================
   LUMEN — Analytics (GA4)
   使い方: 下の GA_ID に測定ID（G-XXXXXXXXXX）を入れるだけで全ページ有効化。
           未設定の間は外部スクリプトを一切読み込まず、追跡も行いません。
   コンバージョン計測: 電話タップ / LINEクリック / フォーム送信 を自動でイベント化。
   ============================================================ */
(function () {
  'use strict';

  var GA_ID = ''; /* ← ここに 'G-XXXXXXXXXX' を設定すると計測開始（空のままなら無効） */

  if (!GA_ID) return;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);

  /* --- コンバージョン計測 --- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : null;
    if (!t) return;
    var tel = t.closest('a[href^="tel:"]');
    if (tel) gtag('event', 'tel_click', { link_url: tel.getAttribute('href') });
    var line = t.closest('a[href*="line.me"], a[href*="lin.ee"]');
    if (line) gtag('event', 'line_click');
  }, true);

  document.addEventListener('submit', function (e) {
    if (e.target && e.target.id === 'contactForm') {
      gtag('event', 'generate_lead', { form_id: 'contactForm' });
    }
  }, true);
})();
