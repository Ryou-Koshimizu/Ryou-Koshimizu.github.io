'use strict';

gsap.registerPlugin(ScrollTrigger);

const isTouchDevice = window.matchMedia('(hover: none)').matches;
const isReduced     = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   LOADING
   数字カウント(0→100) + バー塗り → パネルがスライドアップして消える
============================================================ */
(function () {
  const screen = document.getElementById('loading');
  const body   = document.body;

  /* 内部ページには #loading がない → 即座に initSite() を呼んで終了 */
  if (!screen) {
    initSite();
    return;
  }

  const bar   = document.getElementById('ldBar');
  const numEl = document.getElementById('ldNum');

  body.style.overflow = 'hidden';

  if (isReduced) {
    screen.style.display = 'none';
    body.style.overflow  = '';
    initSite();
    return;
  }

  const obj = { val: 0 };

  const ldTl = gsap.timeline({
    onComplete() {
      body.style.overflow  = '';
      screen.style.display = 'none';
      initSite();
    }
  });

  ldTl
    .to(obj, {
      val: 100,
      duration: 2.2,
      ease: 'power2.inOut',
      onUpdate() {
        const v = Math.floor(obj.val);
        if (numEl) numEl.textContent = String(v).padStart(3, '0');
        if (bar)   bar.style.transform = 'scaleX(' + (v / 100) + ')';
      }
    })
    .to(screen, {
      yPercent: -100,
      duration: 0.9,
      ease: 'power3.inOut',
    }, '+=0.15');
})();


/* ============================================================
   SITE INIT — ローディング完了後に呼ばれる
============================================================ */
function initSite() {
  setupCursor();
  setupHeader();
  setupHero();
  setupPageHero();
  setupProgressBar();
  setupServices();
  setupStats();
  setupReveal();
  setupFlow();
  setupFAQ();
  setupTabs();
  setupForm();
  setupPageTop();
  setupSmoothScroll();
  setupTilt();
  setupMagnetic();
  setupAnimationPause();
}


/* ============================================================
   OFFSCREEN ANIMATION PAUSE — 画面外の無限CSSアニメーションを一時停止
   （表示中の見た目は一切変えず、スクロール後の再描画・合成コストだけ削る）
============================================================ */
function setupAnimationPause() {
  if (typeof document.getAnimations !== 'function' || !('IntersectionObserver' in window)) return;

  const run = () => {
    const groups = new Map();   // 要素 → その要素(::before/::after含む)上の無限CSSアニメーション
    document.getAnimations().forEach(anim => {
      try {
        if (typeof CSSAnimation === 'undefined' || !(anim instanceof CSSAnimation)) return;
        const timing = anim.effect && anim.effect.getTiming && anim.effect.getTiming();
        if (!timing || timing.iterations !== Infinity) return;
        const el = anim.effect.target;
        if (!el || el.nodeType !== 1) return;
        if (!groups.has(el)) groups.set(el, []);
        groups.get(el).push(anim);
      } catch (e) { /* 古いブラウザは現状維持 */ }
    });
    if (!groups.size) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        const list = groups.get(en.target);
        if (!list) return;
        list.forEach(anim => {
          try { en.isIntersecting ? anim.play() : anim.pause(); } catch (e) {}
        });
      });
    }, { rootMargin: '80px' });
    groups.forEach((_, el) => io.observe(el));
  };

  // load後に走査（CSSアニメーションが出揃ってから）
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run, { once: true });
}


/* ============================================================
   CUSTOM CURSOR — 無効化（パフォーマンス改善）
============================================================ */
function setupCursor() { /* disabled */ }


/* ============================================================
   HEADER — スクロールでブラー背景 + オーバーレイナビ
============================================================ */
function setupHeader() {
  const header    = document.getElementById('header');
  const pageTop   = document.getElementById('page-top');
  const hamburger = document.getElementById('hamburger');
  const overlay   = document.getElementById('navOverlay');

  ScrollTrigger.create({
    start: 'top -40',
    onEnter:     () => header?.classList.add('scrolled'),
    onLeaveBack: () => header?.classList.remove('scrolled'),
  });

  ScrollTrigger.create({
    start: 'top -400',
    onEnter:     () => pageTop?.classList.add('visible'),
    onLeaveBack: () => pageTop?.classList.remove('visible'),
  });

  if (!hamburger || !overlay) return;

  let savedScrollY = 0;

  const openMenu = () => {
    savedScrollY = window.scrollY;
    // iOS対応スクロールロック: position:fixed + top で視覚位置を維持
    document.body.style.top = `-${savedScrollY}px`;
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    overlay.classList.add('open');
    overlay.removeAttribute('aria-hidden');
    document.body.classList.add('nav-open');
    gsap.fromTo('.nav-ov-cat',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.45, ease: 'power3.out' }
    );
    gsap.fromTo('.nav-ov-list li',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, stagger: 0.04, duration: 0.4, ease: 'power3.out', delay: 0.08 }
    );
  };

  const closeMenu = () => {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('nav-open');
    // スクロール位置を復元してから ScrollTrigger を再計算
    document.body.style.top = '';
    window.scrollTo(0, savedScrollY);
    requestAnimationFrame(() => ScrollTrigger.refresh());
  };

  hamburger.addEventListener('click', () => {
    overlay.classList.contains('open') ? closeMenu() : openMenu();
  });

  overlay.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeMenu();
  });
}


/* ============================================================
   HERO — GSAP 細かいアニメーション
   ① 背景写真: Ken Burns 入場 + スクロール parallax + マウス parallax
   ② テキスト: バッジ → H1マスクリビール → desc → actions → proof
   ③ オーバーレイ orbs: bg と逆方向マウス parallax で奥行き
============================================================ */
function setupHero() {
  const bgImg = document.getElementById('heroBgImg');

  if (isReduced) {
    gsap.set(['.hero-badge', '.h1-line', '.hero-desc', '.hero-actions',
              '.proof-card', '.hero-scroll-ind'], { opacity: 1, yPercent: 0, y: 0 });
    return;
  }

  /* ─ 初期状態 ─ */
  gsap.set('.h1-line',  { yPercent: 110 });
  gsap.set(['.hero-badge', '.hero-desc', '.hero-actions', '.hero-scroll-ind'],
           { opacity: 0, y: 28 });
  gsap.set('.proof-card', { opacity: 0, y: 40 });

  /* 背景写真: 少し拡大した状態からスタート (Ken Burns 準備) */
  if (bgImg) gsap.set(bgImg, { scale: 1.1, transformOrigin: 'center center' });

  /* ─ 入場タイムライン ─ */
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  /* 背景写真 Ken Burns: ゆっくり等倍へ縮小しながらフェードイン */
  if (bgImg) {
    tl.fromTo(bgImg,
      { opacity: 0, scale: 1.1 },
      { opacity: 1, scale: 1, duration: 2.2, ease: 'power2.out' },
      0);
  }

  tl
    /* バッジ */
    .fromTo('#heroBadge',
      { opacity: 0, y: 24, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.85 },
      0.3)

    /* H1 行マスクリビール */
    .to('.h1-line',
      { yPercent: 0, stagger: 0.22, duration: 1.3 },
      '-=0.45')

    /* 説明文 */
    .fromTo('#heroDesc',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1.0 },
      '-=0.7')

    /* CTAボタン */
    .fromTo('#heroActions',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.85 },
      '-=0.55')

    /* プルーフカード */
    .fromTo('.proof-card',
      { opacity: 0, y: 36 },
      { opacity: 1, y: 0, stagger: 0.12, duration: 0.9 },
      '-=0.5')

    /* スクロール矢印 */
    .fromTo('#heroScroll',
      { opacity: 0 },
      { opacity: 1, duration: 0.7 },
      '-=0.2');

  /* ─ スクロール parallax ─ */
  if (bgImg) {
    gsap.to(bgImg, {
      yPercent: 20,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.5,
      }
    });
  }

  /* ─ マウス parallax（デスクトップのみ） ─ */
  if (!isTouchDevice && bgImg) {
    window.addEventListener('mousemove', e => {
      const xN = e.clientX / window.innerWidth  - 0.5;
      const yN = e.clientY / window.innerHeight - 0.5;
      gsap.to(bgImg, {
        x: xN * 22, y: yN * 14,
        duration: 2.0, ease: 'power2.out', overwrite: 'auto',
      });
    }, { passive: true });
  }
}


/* ============================================================
   SCROLL PROGRESS BAR
============================================================ */
function setupProgressBar() {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;

  ScrollTrigger.create({
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: self => { bar.style.transform = 'scaleX(' + self.progress + ')'; }
  });
}


/* ============================================================
   SERVICES — ピン + スクラブ横スクロール (デスクトップのみ)
   スマホは CSS でグリッド表示
============================================================ */
function setupServices() {
  const section = document.getElementById('services');
  const inner   = document.getElementById('svcInner');
  const fill    = document.getElementById('svcProgressFill');
  const currEl  = document.getElementById('svcCurr');
  if (!section || !inner) return;

  if (window.innerWidth <= 960) return;

  // 始端・終端でカードを止めておくスクロール量(px)
  const BUFFER = 700;
  const getScrollDist = () => inner.scrollWidth - window.innerWidth;
  const setX = gsap.quickSetter(inner, 'x', 'px');

  const proxy = { val: 0 };

  gsap.to(proxy, {
    val: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      pin: true,
      scrub: 1.5,
      start: 'top top',
      end: () => '+=' + (getScrollDist() + BUFFER * 2),
      invalidateOnRefresh: true,
    },
    onUpdate() {
      const dist    = getScrollDist();
      const bufFrac = BUFFER / (dist + BUFFER * 2);
      let p = proxy.val;

      // 両端をバッファゾーンとして x を固定
      if (p <= bufFrac) {
        p = 0;
      } else if (p >= 1 - bufFrac) {
        p = 1;
      } else {
        p = (p - bufFrac) / (1 - bufFrac * 2);
      }

      setX(-p * dist);
      if (fill)   fill.style.transform = 'scaleX(' + p + ')';
      if (currEl) currEl.textContent = String(Math.min(Math.ceil(p * 8), 8) || 1).padStart(2, '0');
    },
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 220);
  }, { passive: true });
}


/* ============================================================
   STATS — GSAP count-up (scrub)
============================================================ */
function setupStats() {
  document.querySelectorAll('.gsap-count').forEach(el => {
    const to  = parseFloat(el.dataset.to);
    const dec = parseInt(el.dataset.dec || '0');
    const sfx = el.dataset.sfx || '';
    const obj = { val: 0 };

    // suffix span を先に追加してからアニメーション開始
    let sfxEl = null;
    if (sfx) {
      sfxEl = document.createElement('span');
      sfxEl.className = 'stat-sfx';
      sfxEl.textContent = sfx;
      el.parentNode.appendChild(sfxEl);
    }

    gsap.to(obj, {
      val: to,
      duration: 2.4,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
      onUpdate() {
        el.textContent = dec ? obj.val.toFixed(dec) : Math.floor(obj.val);
      },
      onComplete() {
        el.textContent = dec ? to.toFixed(dec) : String(to);
      }
    });
  });
}


/* ============================================================
   SECTION REVEAL — ScrollTrigger batch (stagger)
============================================================ */
function setupReveal() {
  if (isReduced) {
    document.querySelectorAll('.reveal').forEach(el => {
      el.style.opacity = '1'; el.style.transform = 'none';
    });
    return;
  }

  // 個別 reveal
  ScrollTrigger.batch('.reveal', {
    onEnter: batch => gsap.fromTo(batch,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 1.0, ease: 'power3.out' }
    ),
    start: 'top 88%',
    once: true,
  });

  /* .case-card と .svc-card は .reveal クラスで既に処理されるため
     ここでは重複アニメーションを起こさないよう省略 */
}


/* ============================================================
   FLOW CONNECTOR — scrub でラインが描かれる
============================================================ */
function setupFlow() {
  const connectors = document.querySelectorAll('.flow-connector');
  if (!connectors.length) return;

  connectors.forEach((el, i) => {
    gsap.to(el, {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: el.closest('.flow-item'),
        start: 'top 70%',
        end: 'bottom 50%',
        scrub: 0.8,
      }
    });
  });

  // フロー番号にグロー pulse
  document.querySelectorAll('.flow-num-wrap').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 75%',
      onEnter() {
        gsap.fromTo(el,
          { borderColor: 'rgba(79,143,255,0.15)', boxShadow: '0 0 0 0 rgba(79,143,255,0)' },
          { borderColor: 'rgba(79,143,255,0.5)', boxShadow: '0 0 18px 2px rgba(79,143,255,0.22)', duration: 0.8, ease: 'power2.out' }
        );
      },
      once: true,
    });
  });
}


/* ============================================================
   FAQ ACCORDION
============================================================ */
function setupFAQ() {
  document.querySelectorAll('.faq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

/* ============================================================
   DROPDOWN NAV（多ページ共通）
============================================================ */
function setupDropdown() {
  document.querySelectorAll('.has-dd').forEach(item => {
    const trigger = item.querySelector('.dd-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.has-dd.open').forEach(el => el.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.has-dd.open').forEach(el => el.classList.remove('open'));
  });
}

/* ============================================================
   TAB SYSTEM（FAQ等）
============================================================ */
function setupTabs() {
  document.querySelectorAll('.tab-nav').forEach(nav => {
    const btns   = [...nav.querySelectorAll('.tab-btn')];
    const parent = nav.closest('.tab-section') || nav.parentElement;
    const panes  = [...(parent.querySelectorAll('.tab-pane'))];
    btns.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        if (panes[i]) panes[i].classList.add('active');
      });
    });
    if (btns[0]) btns[0].classList.add('active');
    if (panes[0]) panes[0].classList.add('active');
  });
}

/* ============================================================
   PAGE HERO REVEAL（内部ページ用、シンプル版）
============================================================ */
function setupPageHero() {
  const ph = document.querySelector('.page-hero');
  if (!ph || isReduced) return;
  const els = ph.querySelectorAll('.ph-label, .ph-h1, .ph-sub, .breadcrumb');
  gsap.fromTo(els,
    { opacity: 0, y: 28 },
    { opacity: 1, y: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out', delay: 0.1 }
  );
}


/* ============================================================
   CONTACT FORM
============================================================ */
function setupForm() {
  const form   = document.getElementById('contactForm');
  const thanks = document.getElementById('formThanks');
  if (!form || !thanks) return;

  /* ※公開前に必ず設定: フォーム送信先エンドポイント
     例) Formspree: 'https://formspree.io/f/xxxxxxxx'
         SSGform:   'https://ssgform.com/s/xxxxxxxx'
     未設定の間は「準備中」の案内を表示します（送信完了を偽装しません） */
  const FORM_ENDPOINT = '';

  const showMessage = (msg, isError) => {
    thanks.textContent = msg;
    thanks.classList.toggle('error', !!isError);
    thanks.classList.add('show');
    setTimeout(() => thanks.classList.remove('show'), 9000);
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    let valid = true;
    form.querySelectorAll('[required]').forEach(f => {
      f.style.borderColor = '';
      if (!f.value.trim()) { f.style.borderColor = '#ef4444'; valid = false; }
    });
    if (!valid) return;

    const honeypot = form.querySelector('[name="_gotcha"]');
    if (honeypot && honeypot.value) return;   // スパムbot対策

    if (!FORM_ENDPOINT) {
      showMessage('フォームは現在準備中です。お手数ですが、メールまたは公式LINEより直接ご連絡ください。', true);
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = '送信中...'; btn.disabled = true;

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method:  'POST',
        body:    new FormData(form),
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      form.querySelectorAll('input, select, textarea').forEach(f => { f.value = ''; });
      showMessage('お問い合わせありがとうございます。1営業日以内にメールまたはLINEにてご連絡いたします。', false);
    } catch (err) {
      showMessage('送信に失敗しました。お手数ですが、時間をおいて再度お試しいただくか、メールまたは公式LINEよりご連絡ください。', true);
    } finally {
      btn.textContent = '送信する →'; btn.disabled = false;
    }
  });

  form.querySelectorAll('[required]').forEach(f => {
    f.addEventListener('input', () => { f.style.borderColor = ''; });
  });
}


/* ============================================================
   CARD 3D TILT — マウス追従で奥行き感
============================================================ */
function setupTilt() {
  if (isTouchDevice) return;

  // rotateY（横）を強調、rotateX（縦）は控えめに分離設定
  const configs = [
    { sel: '.proof-card',         rotY: 16, rotX: 5, lift: -6 },
    { sel: '.svc-card',           rotY: 14, rotX: 4, lift: -8 },
    { sel: '.opt-card',           rotY: 12, rotX: 4, lift: -6 },
    { sel: '.plan-card--popular', rotY: 10, rotX: 3, lift: -8 },
    { sel: '.case-card-v2',       rotY: 12, rotX: 4, lift: -6 },
  ];

  configs.forEach(({ sel, rotY, rotX, lift }) => {
    document.querySelectorAll(sel).forEach(card => {

      if (lift !== 0) {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, { y: lift, duration: 0.35, ease: 'power2.out' });
        });
      }

      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        gsap.to(card, {
          rotateY: x * rotY,
          rotateX: -y * rotX,
          transformPerspective: 700,
          ease: 'power1.out',
          duration: 0.35,
          overwrite: 'auto',
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          y: 0, rotateY: 0, rotateX: 0,
          duration: 0.65, ease: 'power3.out',
          overwrite: 'auto',
        });
      });
    });
  });
}


/* ============================================================
   MAGNETIC BUTTONS — CTA がカーソルに引き寄せられる
============================================================ */
function setupMagnetic() {
  if (isTouchDevice) return;
  // .nav-cta は fixed ヘッダー内のため除外（position:fixed 要素に transform を重ねると位置がずれる）
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r  = btn.getBoundingClientRect();
      const mx = (e.clientX - r.left - r.width  / 2) * 0.22;
      const my = (e.clientY - r.top  - r.height / 2) * 0.22;
      gsap.to(btn, { x: mx, y: my, duration: 0.4, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      // elastic → power3 に変更（ビジネスサイトに適した落ち着いた戻り）
      gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'power3.out' });
    });
  });
}


/* ============================================================
   PAGE TOP BUTTON
============================================================ */
function setupPageTop() {
  const btn = document.getElementById('page-top');
  if (!btn) return;
  btn.addEventListener('click', e => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


/* ============================================================
   SMOOTH ANCHOR SCROLL
============================================================ */
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'));
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}
