'use strict';
/* ============================================================
   ARTICLE FX — 読み物専用の演出
   script.js の後に、読み物ページからのみ読み込む。
   script.js はプレーンスクリプトで、その isReduced / GSAP_OK は
   スクリプトスコープ（windowに載らない）ため、ここで再定義する。
============================================================ */
(function () {
  // 記事以外では何もしない
  if (!document.querySelector('.art-wrap')) return;
  // GSAP が読めていないときは何もしない（html.no-gsap が内容を可視化する）
  if (!window.gsap || !window.ScrollTrigger) return;

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    if (REDUCED) {
      // ピンは1つも作らない。全部そのまま読める状態にして終わり。
      document.documentElement.dataset.fx = 'reduced';
      return;
    }
    document.documentElement.dataset.fx = 'on';
    heroIntro();
    sceneQuote();     // is-scene を付ける。bodyReveal より先
    sceneChart();     // 同じ理由で bodyReveal より先
    sceneContrast();  // 同じ理由で bodyReveal より先
    scenePriceTable(); // 同じ理由で bodyReveal より先
    sceneComplaints(); // 同じ理由で bodyReveal より先
    sceneFunnel();     // 同じ理由で bodyReveal より先
    bodyReveal();
  }

  /* 書記素クラスタ単位でテキストを分割する。
     Array.from(text) はコードポイント単位（サロゲートペアまでは対応）だが、
     結合文字（例: "e" + 結合アクセント）や ZWJ 連結の絵文字（例: 家族の絵文字）を
     バラバラに壊してしまう。Intl.Segmenter の grapheme 単位ならこれらを1つに保てる。
     未対応環境（古いSafari等）では Array.from にフォールバックする。 */
  function splitGraphemes(text) {
    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
      const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(seg.segment(text), s => s.segment);
    }
    return Array.from(text);                          // フォールバック: コードポイント単位
  }

  /* テキストノードだけを書記素単位で span に割る。
     <br> や <em> の要素ノードは保ったまま再帰するので、
     em の青(.ph-h1 em の色指定)はそのまま効く。
     SplitText は GSAP 3.12.5 では有料なので使わない。
     再入ガード: 既に分解済みの root に対してもう一度呼ばれても、
     .ch が入れ子になって倍増しないよう、既存の .ch をそのまま返す。 */
  function splitChars(root) {
    if (root.dataset.chSplit === '1') {
      return Array.from(root.querySelectorAll('.ch'));
    }
    const out = [];
    (function walk(node) {
      const kids = Array.from(node.childNodes);
      for (const n of kids) {
        if (n.nodeType === 3) {                       // テキストノード
          const text = n.data;
          if (!text.trim()) continue;
          const frag = document.createDocumentFragment();
          for (const chArr of splitGraphemes(text)) {   // 書記素クラスタ単位
            const s = document.createElement('span');
            s.className = 'ch';
            s.textContent = chArr;
            frag.appendChild(s);
            out.push(s);
          }
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          walk(n);                                     // <em> などは中に入る
        }
      }
    })(root);
    root.dataset.chSplit = '1';
    return out;
  }

  function heroIntro() {
    const h1 = document.querySelector('.ph-h1');
    if (!h1) return;
    const chars = splitChars(h1);
    if (!chars.length) return;

    // em の中の文字は遅らせて、着地で青く発色させる
    const emChars = chars.filter(c => c.closest('em'));
    const plain   = chars.filter(c => !c.closest('em'));

    const tl = gsap.timeline({ delay: 0.15 });
    tl.from(plain, {
      yPercent: 110, opacity: 0, filter: 'blur(8px)',
      duration: 0.9, ease: 'power4.out', stagger: 0.02
    });
    if (emChars.length) {
      tl.from(emChars, {
        yPercent: 110, opacity: 0, filter: 'blur(8px)',
        duration: 0.9, ease: 'power4.out', stagger: 0.02
      }, '-=0.55')
      .from(emChars, {
        color: 'var(--ink)', duration: 0.5, ease: 'power2.out', stagger: 0.02
      }, '-=0.5');
    }

    // ラベルはタイプライタ
    const label = document.querySelector('.ph-label');
    if (label) {
      const lc = splitChars(label);
      tl.from(lc, { opacity: 0, duration: 0.25, stagger: 0.04, ease: 'none' }, 0);
    }
  }

  function bodyReveal() {
    const wrap = document.querySelector('.art-wrap');
    if (!wrap) return;

    // 本文は「静か」に。見せ場との対比を作るのが目的なので y は小さく。
    const targets = [...wrap.querySelectorAll('p, .art-box, .art-honest, .art-lead, .art-h3, ul, ol, table')]
      .filter(el => !el.closest('.is-scene'));
    // 先に隠す（JSで。CSSでは隠さない — GSAP未読込時はこの行自体が実行されず、
    // 本文は自然な opacity:1 のまま残るため no-gsap 環境で事故らない）
    gsap.set(targets, { opacity: 0, y: 8 });
    ScrollTrigger.batch(targets, {
      start: 'top 90%', once: true,
      onEnter: batch => gsap.to(batch, {
        opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.06
      })
    });

    // h2 は文字が出たあと、罫線が左から伸びる(--rule を CSS が受ける)
    wrap.querySelectorAll('.art-h2').forEach(h => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
      tl.from(h, { opacity: 0, y: 10, duration: 0.5, ease: 'power2.out' })
        .to(h, { '--rule': 1, duration: 0.7, ease: 'power3.inOut' }, '-=0.15');
    });
  }

  /* 見せ場A: Googleへの一問一答。
     .art-quote の <strong> は2つ。1つ目が問い、2つ目が答え。
     ただし答えの日本語訳「（端的に言えば、はい）」は <strong> の外（生テキスト）にある。
     <strong> 単体だけを隠すと、この訳文だけが「間」の瞬間に丸見えになり、
     答えが先に日本語で割れてしまう（演出崩壊）。
     → <br> を境に「問いの行」「答えの行」をそれぞれ丸ごと1つの <span> に
       実行時ラップし（生HTMLは一切変更しない）、行単位で隠す/出す。 */
  function sceneQuote() {
    const q = document.querySelector('.art-wrap .art-quote');
    if (!q) return;
    const strongs = q.querySelectorAll('strong');
    if (strongs.length < 2) return;      // 想定と違う記事では何もしない
    const cite = q.querySelector('cite');
    const br = q.querySelector('br');
    if (!br) return;                     // 問い/答えの行区切りが無い＝想定外の構造。何もしない

    const ans = strongs[1];              // 答えの英語部分（"In short, yes!"）。青く発色させる対象

    // 問いの行（<br> より前の全ノード）を1つの span にまとめる
    const qLine = document.createElement('span');
    qLine.className = 'qa-line qa-line--q';
    while (q.firstChild !== br) qLine.appendChild(q.firstChild);
    q.insertBefore(qLine, br);

    // 答えの行（<br> の次から <cite> の手前までの全ノード＝ "——" + <strong> + 日本語訳）を
    // 1つの span にまとめる。これで訳文だけが取り残されて可視化することが無くなる。
    const aLine = document.createElement('span');
    aLine.className = 'qa-line qa-line--a';
    let node = br.nextSibling;
    while (node && node !== cite) {
      const next = node.nextSibling;
      aLine.appendChild(node);
      node = next;
    }
    q.insertBefore(aLine, cite || null);  // cite が無ければ末尾に追加

    q.classList.add('is-scene');

    // 本文 reveal が同じ要素を掴まないよう、先に自分の初期状態を固定する
    gsap.set(qLine, { opacity: 0, y: 14 });
    gsap.set(aLine, { opacity: 0, scale: 0.9 });
    gsap.set(ans, { opacity: 0 });        // strong 自身にも明示しておく（行全体の隠れ状態と一致させる）
    if (cite) gsap.set(cite, { opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: q,
        start: 'center center',
        end: '+=180%',          // 約2画面分
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
      }
    });
    tl.to(qLine, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' })
      .to({}, { duration: 0.6 })                       // ← 一拍の間。ここが効く（答えの行が丸ごと隠れている）
      .to(aLine, { opacity: 1, scale: 1, duration: 1, ease: 'back.out(1.6)' })
      .to(ans, { opacity: 1, duration: 1, ease: 'back.out(1.6)' }, '<')
      .to(ans, { color: 'var(--accent)', duration: 0.4 }, '<')
      .to(cite || {}, { opacity: 1, duration: 0.6 });
  }

  /* 見せ場B: 生成AIの利用率・国際比較。
     元の <ul class="art-check">（数字＋出典）は消さず、その直前にグラフを挿す。
     グラフは aria-hidden="true"（数字と出典は元リストが担保するので読み上げ不要・重複回避）。
     数字と出典が消えるのは「出典をつける」方針への裏切りになるため、
     ここは記事固有のハードコード値でよいが、必ず元リストの数字と一致させること
     （日本26.7 / 日本の20代44.7 / ドイツ59.2 / 米国68.8 / 中国81.2）。
     色は dataviz スキルの「Emphasis（1つだけ強調、残りはグレー）」パターンに沿う：
     日本だけ --accent、他国は --dim。日本の20代は --accent を薄めた版。
     薄め方は JS に rgba(59,130,246,.45) 等の hex/rgb を書かず、CSS 側の
     .fx-bar.is-accent-faded { background:var(--accent); opacity:.45 } に寄せている
     （新しい hex を持ち込まない、既存変数のみ、のルールを守るため）。 */
  function sceneChart() {
    // 26.7% を含む art-check を探す（この記事固有）
    const list = [...document.querySelectorAll('.art-wrap .art-check')]
      .find(ul => ul.textContent.includes('26.7%'));
    if (!list) return;

    const DATA = [
      { name: '日本',       val: 26.7, cls: 'is-accent' },
      { name: '日本の20代', val: 44.7, cls: 'is-accent-faded' },
      { name: 'ドイツ',     val: 59.2, cls: 'is-dim' },
      { name: '米国',       val: 68.8, cls: 'is-dim' },
      { name: '中国',       val: 81.2, cls: 'is-dim' },
    ];
    const MAX = 100;

    const chart = document.createElement('div');
    chart.className = 'fx-chart';
    chart.setAttribute('aria-hidden', 'true');   // 数字は元リストが持つので読み上げ不要
    chart.innerHTML = DATA.map(d => `
      <div class="fx-row">
        <span class="fx-name">${d.name}</span>
        <span class="fx-track"><span class="fx-bar ${d.cls}" style="width:${(d.val / MAX * 100).toFixed(1)}%"></span></span>
        <span class="fx-val">0%</span>
      </div>`).join('');
    list.parentNode.insertBefore(chart, list);
    chart.classList.add('is-scene');

    const bars = chart.querySelectorAll('.fx-bar');
    const vals = chart.querySelectorAll('.fx-val');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: chart, start: 'center center', end: '+=180%',
        pin: true, scrub: 0.6, anticipatePin: 1,
      }
    });
    DATA.forEach((d, i) => {
      const counter = { v: 0 };
      tl.to(bars[i], { scaleX: 1, duration: 0.8, ease: 'power2.out' }, i * 0.35)
        .to(counter, {
          v: d.val, duration: 0.8, ease: 'power2.out',
          onUpdate() { vals[i].textContent = counter.v.toFixed(1) + '%'; }
        }, i * 0.35);
    });
  }

  /* 見せ場C: やること（積み上がる） / やらないこと（打ち消される）。
     .art-h3「やること」の直後は .art-ol--num（5項目）。
     .art-h3「やらないこと」の直後は説明文の <p>（「ここに載っているものです」と
     dontList を指す一文）があってから .art-check が続く
     （nextElementSibling を1回だけ辿ると <p> を掴んでしまい、li が0件になる）。
     この <p> を読み飛ばして dontList だけ移すと、ピン区間が終わった直後に
     「（リストは既に見せ終わった後）ここに載っているものです」という文だけが
     取り残されて浮く（実機で発覚）。読み飛ばした要素も between に集め、
     dontH3 と dontList の間に元の順序のまま一緒に運ぶ。 */
  function sceneContrast() {
    const h3s = [...document.querySelectorAll('.art-wrap .art-h3')];
    const doH3   = h3s.find(h => h.textContent.startsWith('やること'));
    const dontH3 = h3s.find(h => h.textContent.startsWith('やらないこと'));
    if (!doH3 || !dontH3) return;

    const doList = doH3.nextElementSibling;         // .art-ol--num
    const between = [];                              // dontH3〜dontList間の導入文など
    let dontList = dontH3.nextElementSibling;
    while (dontList && !dontList.classList.contains('art-check')) {
      between.push(dontList);
      dontList = dontList.nextElementSibling;
    }
    if (!doList || !dontList) return;

    const dontItems = [...dontList.querySelectorAll('li')];
    // 打ち消し線の下地は、各 li の中の <strong>（施策名）にだけ付ける。
    // li 全体は「<strong>施策名</strong> — 「Googleの引用文」」という2行構成のため、
    // li に付けると擬似要素の top:50% が1行目と2行目の"あいだ"を通ってしまい、
    // どちらの行も打ち消せない（実測: 高さ58px/行送り29px=2行）。
    // strong は施策名だけで短く1行に収まるので、線が文字の中央を通る。
    const dontStrikes = dontItems.map(li => li.querySelector('strong') || li);
    dontStrikes.forEach(el => el.classList.add('fx-strike'));

    const doItems = [...doList.querySelectorAll('li')];

    // doH3 だけを pin すると doH3 自身しか固定されず、doList / dontH3 / dontList は
    // 兄弟要素のため素通りしてしまう（対比が読めない）。実機スクショで確認済み。
    // → 6要素(between含む)をまとめて包む wrapper を実行時に生成し、それを trigger/pin にする
    //   （生HTMLは変更しない。DOM構造の入れ替えのみ）。
    const wrap = document.createElement('div');
    wrap.className = 'fx-contrast is-scene';
    doH3.parentNode.insertBefore(wrap, doH3);
    wrap.appendChild(doH3);
    wrap.appendChild(doList);
    wrap.appendChild(dontH3);
    between.forEach(el => wrap.appendChild(el));   // 元の順序のまま dontH3 と dontList の間に維持
    wrap.appendChild(dontList);

    doH3.classList.add('is-scene');
    dontH3.classList.add('is-scene');
    doList.classList.add('is-scene');
    dontList.classList.add('is-scene');

    gsap.set(doItems,   { opacity: 0, y: 18 });
    gsap.set(dontItems, { opacity: 1 });

    // 9項目ぶんのテキストがある wrapper は、狭い画面ほど折り返しで縦に伸びる。
    // 既定の 'top 20%' 起点のままだと wrapper 高が「画面高 - ヘッダー高 - 20%」を
    // 超えたとき、「やらないこと」側がピン中ずっと画面外になる（実機スクショで検出。
    // 本文追加でデスクトップでも再現した）。
    // → wrap の上端を「固定ヘッダーの直下」に置く位置(px)を最低ラインとし、
    //   既定の 'top 20%' で足りるならそのまま、足りなければヘッダー直下まで
    //   詰めて残り全部を高さに充てる（決め打ちのブレークポイント値にしない）。
    const headerH = document.querySelector('header')?.getBoundingClientRect().height || 0;
    const GAP = 12;                                    // ヘッダーとの間の余白
    const SAFE_MARGIN = 16;                             // 画面下端に残す余白
    const wrapH = wrap.getBoundingClientRect().height;
    const minTop = headerH + GAP;                       // これより上には置けない(ヘッダーに隠れる)
    const defaultTop = window.innerHeight * 0.2;         // 他の見せ場と揃える既定値
    const fitsAtDefault = defaultTop >= minTop && wrapH <= window.innerHeight - defaultTop - SAFE_MARGIN;
    const topPx = fitsAtDefault ? defaultTop : minTop;
    const start = `top ${(topPx / window.innerHeight * 100).toFixed(1)}%`;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrap, start, end: '+=180%',
        pin: true, pinSpacing: true, scrub: 0.6, anticipatePin: 1,
      }
    });
    tl.to(doItems, { opacity: 1, y: 0, duration: 0.6, stagger: 0.25, ease: 'power2.out' })
      .to(dontStrikes, { '--strike': 1, duration: 0.5, stagger: 0.2, ease: 'power2.inOut' }, '>0.3')
      .to(dontItems, { opacity: 0.4, duration: 0.4, stagger: 0.2 }, '<');
  }

  /* 見せ場D: 料金表「12ヶ月の総額」列のカウントアップ（insight-0yen.html 固有）。
     insight-erabikata.html にも同じ class="art-table" の別表（不満の理由/割合）が
     あるため、class名だけでは区別できない。この記事固有の実額
     （357,600 / 1,077,600）が含まれるかを手がかりに対象を確定する
     （sceneChart が26.7%を手がかりにするのと同じ考え方）。他記事・他ページでは
     この文字列がヒットしないため wrap が見つからず、即 return して何も起きない。

     本物の <strong>¥357,600</strong> 等は一切書き換えない（テキストは常に正しいまま）。
     カウントアップ表示は別に生成した aria-hidden の装飾要素(.fx-count)を
     絶対配置で重ねて、そちらだけを ¥0→実額へ動かす。理由:
     ① 本物のテキストを直接書き換える設計だと、アニメーション開始前（＝ページ読込直後
        〜スクロールでピンに入るまでの間）は "¥0" のままになる。opacity:0 で見た目は
        隠れていても、スクリーンリーダーは opacity:0 の要素を読み上げてしまうため、
        「総額を1円も偽らない」というこの記事の主張に反して、間違った額(¥0)を
        読み上げる瞬間ができてしまう。装飾要素だけを動かし本物を一切書き換えなければ、
        本物は常に正しい値のまま(不可視でも読み上げ内容は正しい)。
     ② 本物を隠す方法を display:none にすると、セルの内容が「¥0」始まりの
        装飾要素だけになり、カウントアップ中に文字幅が伸びて列がガタつく
        （fx-bar の <span>display:inline 事故と同じ「タグ/表示方式のズレ」に注意）。
        → 本物は opacity:0 のまま自然な幅で場所を確保させ、装飾を絶対配置で重ねる。
     ③ カウントの最終表示は「装飾要素の書式」ではなく、最後に本物の<strong>へ
        フェード戻すことで担保する。本物は生HTMLの文字列そのものなので、
        表記と1円/1桁でもズレることが構造的に起こり得ない。 */
  function scenePriceTable() {
    const wrap = [...document.querySelectorAll('.art-wrap .art-table-wrap')]
      .find(w => w.textContent.includes('357,600') && w.textContent.includes('1,077,600'));
    if (!wrap) return;                              // この記事の表でなければ何もしない
    const table = wrap.querySelector('table.art-table');
    if (!table) return;
    const rows = [...table.querySelectorAll('tbody tr')];
    if (rows.length !== 6) return;                  // 想定と違う行数なら何もしない

    // 各行の「12ヶ月の総額」セル(3列目の<strong>)から実額を読み取る。
    // 数値をJS側にハードコードせず生HTMLから読み取ることで、表記とアニメーションの
    // 最終値が食い違う余地を構造的に無くす。
    const totals = rows.map(tr => {
      const cell = tr.querySelector('td:last-child');
      const strong = cell && cell.querySelector('strong');
      if (!strong) return null;
      const n = parseInt(strong.textContent.replace(/[^\d]/g, ''), 10);
      if (!Number.isFinite(n)) return null;
      return { cell, strong, n };
    });
    if (totals.some(t => !t)) return;                // 想定外の構造なら何もしない

    wrap.classList.add('is-scene');

    // 各行の総額セルに、装飾カウンタ(aria-hidden)を絶対配置で重ねる。
    // 本物の<strong>はそのまま同じ場所に残し、opacityだけで隠す。
    totals.forEach(t => {
      const stack = document.createElement('span');
      stack.className = 'fx-count-stack';
      t.strong.parentNode.insertBefore(stack, t.strong);
      stack.appendChild(t.strong);

      const counter = document.createElement('span');
      counter.className = 'fx-count';
      counter.setAttribute('aria-hidden', 'true');   // 本物(strong)が正の読み上げ対象
      counter.textContent = '¥0';
      stack.appendChild(counter);
      t.counterEl = counter;
    });

    // 隠すのは JS(gsap.set)で。GSAPが読めていなければこの関数自体呼ばれないため無事。
    gsap.set(rows, { opacity: 0, y: 16 });
    gsap.set(totals.map(t => t.strong), { opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start: 'center center',
        end: '+=220%',
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
      }
    });

    const STEP = 0.32, DUR = 0.6;
    totals.forEach((t, i) => {
      const counter = { v: 0 };
      tl.to(rows[i], { opacity: 1, y: 0, duration: DUR, ease: 'power2.out' }, i * STEP)
        .to(counter, {
          v: t.n, duration: DUR, ease: 'power2.out',
          onUpdate() { t.counterEl.textContent = '¥' + Math.round(counter.v).toLocaleString('ja-JP'); }
        }, i * STEP);
    });

    // 数え終わったら、装飾を消して本物(常に正しい値)にフェードで戻す
    const lastEnd = (totals.length - 1) * STEP + DUR;
    tl.to(totals.map(t => t.counterEl), { opacity: 0, duration: 0.3 }, lastEnd)
      .to(totals.map(t => t.strong), { opacity: 1, duration: 0.3 }, lastEnd);
  }

  /* 見せ場E: 「不満の理由」ランキングの棒グラフ（insight-erabikata.html 固有）。
     insight-0yen.html にも同じ class="art-table" の別表（12ヶ月総額）があるため、
     class名だけでは対象を特定できない。この記事固有の実数字「46.2%」を手がかりに
     対象の .art-table-wrap を確定する（scenePriceTable が 357,600 を手がかりにする
     のと同じ考え方）。他記事・他ページではこの文字列がヒットしないため wrap が
     見つからず、即 return して何も起きない。

     数値はJSにハードコードせず、生HTMLの各行(td)から読み取る。表記とグラフの
     最終値が食い違う余地を構造的に無くすため（scenePriceTable と同じ理由）。

     元の <table class="art-table"> と出典 <p class="art-source"> は一切書き換えず、
     その手前に aria-hidden のグラフを挿入するだけ（sceneChart と同じ考え方）。
     この会社は「出典をつける」ことを売りにしているため、元の数字と出典は必ず残す。

     1位「ビジネスへの理解不足」46.2%だけ .fx-cmp-top（--accent）、他3つは既定の
     --dim のグレー（dataviz スキルの Emphasis: 1つだけ強調、他はグレー）。
     「デザインが下手」が不満の上位に入っていない＝発注者が困っているのは
     デザインではない、が一目で分かるようにするのが狙い。

     クラスは全て自分専用の fx-cmp- 接頭辞のみを新規に定義する
     （sceneChart 用の .fx-chart/.fx-row/.fx-name/.fx-track/.fx-bar/.fx-val とは
     完全に別立て。既存クラス・汎用名は一切再定義しない）。
     ただし .is-scene だけは例外＝bodyReveal がその存在を見て本文の一括reveal対象から
     除外するための、ファイル全体で共有されたJS駆動のマーカーなので、これは
     「再定義」ではなく既存の仕組みへの正しい参加として付与する。

     隠すのは CSS ではなく JS(gsap.set)で（過去の罠: CSSで隠すとGSAP不在時に
     内容が消える可能性があるため）。<span> は display:inline なので
     width/transform:scaleX() が無視される→ 棒要素は必ず display:block にする
     （fx-bar で踏んだ罠と同じ）。 */
  function sceneComplaints() {
    // 46.2% を含む art-table-wrap を探す（この記事固有）
    const wrap = [...document.querySelectorAll('.art-wrap .art-table-wrap')]
      .find(w => w.textContent.includes('46.2%'));
    if (!wrap) return;                               // この記事の表でなければ何もしない
    const table = wrap.querySelector('table.art-table');
    if (!table) return;
    const rows = [...table.querySelectorAll('tbody tr')];
    if (rows.length !== 4) return;                    // 想定と違う行数なら何もしない

    // 各行の「不満の理由」「割合」をtdから読み取る(ハードコードしない)
    const DATA = rows.map(tr => {
      const tds = tr.querySelectorAll('td');
      if (tds.length !== 2) return null;
      const name = tds[0].textContent.trim();
      const val = parseFloat(tds[1].textContent.replace(/[^\d.]/g, ''));
      if (!name || !Number.isFinite(val)) return null;
      return { name, val };
    });
    if (DATA.some(d => !d)) return;                    // 想定外の構造なら何もしない

    const MAX = 100;                                   // 割合(%)そのものを0-100スケールで見せる

    const chart = document.createElement('div');
    chart.className = 'fx-cmp-chart';
    chart.setAttribute('aria-hidden', 'true');          // 数字・出典は元の表が持つので読み上げ不要
    chart.innerHTML = DATA.map((d, i) => `
      <div class="fx-cmp-row">
        <span class="fx-cmp-name">${d.name}</span>
        <span class="fx-cmp-track"><span class="fx-cmp-bar${i === 0 ? ' fx-cmp-top' : ''}" style="width:${(d.val / MAX * 100).toFixed(1)}%"></span></span>
        <span class="fx-cmp-val">0%</span>
      </div>`).join('');
    wrap.parentNode.insertBefore(chart, wrap);           // 元の表(wrap)は動かさず、その手前に挿す
    chart.classList.add('is-scene');

    const bars = chart.querySelectorAll('.fx-cmp-bar');
    const vals = chart.querySelectorAll('.fx-cmp-val');

    // 隠すのはJS(gsap.set)で。GSAP不在ならこの関数自体呼ばれないため無事だが、
    // bodyReveal / scenePriceTable と同じ流儀に揃える。
    gsap.set(bars, { scaleX: 0, transformOrigin: 'left center' });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: chart, start: 'center center', end: '+=180%',
        pin: true, scrub: 0.6, anticipatePin: 1,
      }
    });
    DATA.forEach((d, i) => {
      const counter = { v: 0 };
      tl.to(bars[i], { scaleX: 1, duration: 0.8, ease: 'power2.out' }, i * 0.35)
        .to(counter, {
          v: d.val, duration: 0.8, ease: 'power2.out',
          onUpdate() { vals[i].textContent = counter.v.toFixed(1) + '%'; }
        }, i * 0.35);
    });
  }

  /* 見せ場F: 検索10件 → AIが選ぶのは1〜3件（insight-ai-search.html 固有）。
     本文の核心段落「AIが答えを返すとき、選ばれるのは1〜3件だけ」＋「存在しないのと
     同じ」を両方含む<p>を手がかりに対象記事を確定する（scenePriceTable が357,600を、
     sceneComplaints が46.2%を手がかりにするのと同じ考え方）。この2文字列を両方含む
     <p>は .art-wrap 内でこの記事にしか存在しないため、他記事・他ページでは wrap が
     見つからず即 return して何も起きない。

     これは抽象図（実在の検索結果ではない）。数字「10」「1〜3」は本文に根拠があるが、
     バーには店名・順位・数値を一切書かない。aria-hidden="true" を付け、本文の記述が
     正典であることを保つ。生HTMLは変更せず、この段落の直後に実行時生成した図を
     挿すだけ（sceneChart/sceneComplaints と同じ「元本文はそのまま、手前/直後に
     aria-hiddenの図を足す」流儀）。

     クラスは全て専用の fx-fn- 接頭辞のみを新規に定義する（既存の
     fx-chart/fx-row/fx-bar や fx-cmp-* とは完全に別立て。既存クラスは一切再定義しない）。

     .fx-fn-bar は <span>（既定 display:inline）なので、明示的に display:block を
     与えないと height/transform:scaleY() が丸ごと無視され、棒が高さ0で消える
     （fx-bar / fx-cmp-bar で踏んだ罠と同じ）。初期の非表示状態(scaleY(0))はCSSに
     書かず、JS側でgsap.setにより設定する（CSSで隠すとGSAP不在時に内容が消える
     経路を作ってしまうため。GSAP不在ならこの関数自体呼ばれないが、他sceneと
     流儀を揃える）。

     残す3本の発色は、sceneQuote() の `color: 'var(--accent)'` と同じ書き方
     （backgroundColor を CSS変数の文字列へ直接 to する）に倣う。新しい hex は
     JSにもCSSにも書かない。 */
  function sceneFunnel() {
    const wrap = document.querySelector('.art-wrap');
    if (!wrap) return;
    const target = [...wrap.querySelectorAll('p')].find(p =>
      p.textContent.includes('選ばれるのは1〜3件') && p.textContent.includes('存在しないのと同じ')
    );
    if (!target) return;                              // この記事の段落でなければ何もしない

    const scene = document.createElement('div');
    scene.className = 'fx-fn-wrap is-scene';
    scene.setAttribute('aria-hidden', 'true');         // 抽象図。本文の記述が正典
    scene.innerHTML =
      '<p class="fx-fn-label fx-fn-label--before">検索結果：10件、全部見てもらえた</p>' +
      '<div class="fx-fn-bars">' + '<span class="fx-fn-bar"></span>'.repeat(10) + '</div>' +
      '<p class="fx-fn-label fx-fn-label--after">AIが選ぶのは、1〜3件だけ</p>';
    target.parentNode.insertBefore(scene, target.nextSibling);

    const bars   = [...scene.querySelectorAll('.fx-fn-bar')];
    const before = scene.querySelector('.fx-fn-label--before');
    const after  = scene.querySelector('.fx-fn-label--after');
    const kept   = bars.slice(0, 3);                   // 残る3本（AIが選ぶ側）
    const faded  = bars.slice(3);                       // 消える7本

    gsap.set(bars,  { scaleY: 0, transformOrigin: 'bottom center' });
    gsap.set(after, { opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scene, start: 'center center', end: '+=200%',
        pin: true, scrub: 0.6, anticipatePin: 1,
      }
    });
    tl.to(bars, { scaleY: 1, duration: 0.8, ease: 'power2.out', stagger: 0.05 })
      .to({}, { duration: 0.4 })                        // 一拍。10本ぜんぶ見える状態を見せる
      .to(faded, { opacity: 0, duration: 0.7, ease: 'power2.inOut', stagger: 0.04 })
      .to(kept,  { backgroundColor: 'var(--accent)', duration: 0.5, ease: 'power2.out' }, '<')
      .to(before, { opacity: 0, duration: 0.4 }, '<')
      .to(after,  { opacity: 1, duration: 0.5 }, '<0.1');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
