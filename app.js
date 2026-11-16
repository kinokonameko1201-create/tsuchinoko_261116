/* =========================================================
   tsuchinoko プロトタイプ — 画面描画と操作
   ・ルーティング: location.hash（#/home, #/harvest など）
   ・操作: data-act（処理名）/ data-go（画面遷移先）をイベント委譲で処理
   ・データの読み書きは data.js の Store 経由のみ
   ========================================================= */
(function () {
  'use strict';

  const S = window.Store;
  const D = S.D;
  const TODAY = S.TODAY;

  const $ = (sel, el) => (el || document).querySelector(sel);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sum = arr => arr.reduce((a, b) => a + b, 0);

  const phone = $('#phone'), screenEl = $('#screen'), tabbarEl = $('#tabbar'), layerEl = $('#layer'), toastEl = $('#toast');

  /* ---------- アイコン ---------- */
  const P = {
    map: '<path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4z"/><path d="M9 4v13.5M15 6.5V20"/>',
    clip: '<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 4.5V3h6v1.5"/><path d="m9 13 2 2 4-4"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    cloud: '<path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 11.5 3.3 3.3 0 0 0 7 18z"/>',
    rain: '<path d="M7 15h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 8.5 3.3 3.3 0 0 0 7 15z"/><path d="m9 18-1 2.5M13 18l-1 2.5M17 18l-1 2.5"/>',
    expand: '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>',
    collapse: '<path d="M4 14h6v6M20 10h-6V4M10 14l-7 7M14 10l7-7"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    chevR: '<path d="m9 6 6 6-6 6"/>',
    chevL: '<path d="m15 6-6 6 6 6"/>',
    dl: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    print: '<path d="M7 9V4h10v5"/><rect x="3.5" y="9" width="17" height="8" rx="1.5"/><path d="M7 14h10v6H7z"/>',
    pdf: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/>',
    csv: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 4.5v15"/>',
    sprout: '<path d="M12 20v-8"/><path d="M12 12c0-3-2-5-6-5 0 3 2 5 6 5zM12 10c0-3 2-5 6-5 0 3-2 5-6 5z"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    T: '<path d="M5 6h14M12 6v13"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    pinch: '<path d="M7 17 3 21M17 7l4-4M4 14v3h3M20 10V7h-3"/>',
    swap: '<path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    drop: '<path d="M12 3.5s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  };
  const ic = (n, w = 20, sw = 1.7) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
  const wxIcon = (wx, w = 20) => ic(wx === '晴れ' ? 'sun' : wx === '雨' ? 'rain' : 'cloud', w, 1.6);

  /* 判定マーカー内の白いグリフ */
  const MG = {
    g: '<svg viewBox="0 0 14 14"><path d="m3 7.2 2.6 2.6L11 4.4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    o: '<svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="4.6" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M7 4.4V7l1.8 1.2" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>',
    b: '<svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="4" fill="none" stroke="#fff" stroke-width="1.8"/></svg>',
    r: '<svg viewBox="0 0 14 14"><path d="M7 3.2v4.6" stroke="#fff" stroke-width="2.1" stroke-linecap="round"/><circle cx="7" cy="10.6" r="1.2" fill="#fff"/></svg>',
  };
  const LBL = { g: '適期', o: '間近', b: '未熟', r: '過ぎ' };
  const ORDER = ['g', 'o', 'b', 'r'];
  const dot = (t, size = 12) => `<span class="dot ${t}" style="width:${size}px;height:${size}px">${MG[t]}</span>`;
  const chip = st => `<span class="chip ${st}">${dot(st, 14)}${LBL[st]}</span>`;
  const MEMO_TYPES = ['種まき', '間引き', '追肥', '水やり', '収穫', 'メモ'];
  const TYPE_ICON = { 種まき: 'sprout', 収穫: 'check', 水やり: 'drop' };
  const FS_LABEL = { s: '小', m: '中', l: '大' };

  /* ---------- 画面の状態（保存しないUI状態） ---------- */
  const ui = {
    filter: null,          // ホームの判定フィルター
    sel: null,             // 詳細シート: 'p:畝-番' or 'h:収穫ID'
    zoom: 1, fzoom: 1,     // マップ拡大率（ホーム / 全画面）
    htab: 0, sort: 'opt',  // 収穫記録タブ・並び順
    checked: new Set(),
    calMonth: TODAY.slice(0, 7), calDate: TODAY,
    exportOpen: false, period: 0,
    draft: null, bedDraft: null,
    pending: {}, lastRoute: null, layerKey: '', scrolledFor: null,
    resetArm: false,
  };

  /* ---------- ルーティング ---------- */
  const ROUTES = {
    home: { tab: 0 }, full: { push: 1, notab: 1 },
    harvest: { tab: 1 }, calendar: { tab: 2 }, memo: { push: 1, notab: 1 },
    settings: { tab: 3 }, bed: { push: 1, tab: 3 }, font: { push: 1, tab: 3 },
  };
  function parseHash() {
    const [name, arg] = location.hash.replace(/^#\/?/, '').split('/');
    return ROUTES[name] ? { name, arg } : { name: 'home', arg: undefined };
  }
  function go(path, pending) {
    ui.pending = pending || {};
    if (location.hash === '#/' + path) { ui.lastRoute = null; render(); }
    else location.hash = '/' + path;
  }
  window.addEventListener('hashchange', () => render());

  function onEnter(name, arg) {
    const pd = ui.pending; ui.pending = {};
    ui.sel = pd.sel || null;
    ui.exportOpen = !!pd.export;
    if (pd.htab != null) ui.htab = pd.htab;
    ui.resetArm = false;
    ui.scrolledFor = null;
    if (name === 'memo') {
      const r = arg && arg !== 'new' ? S.state.records.find(x => x.id === arg) : null;
      ui.draft = r ? Object.assign({ bed: null }, r) : { date: ui.calDate || TODAY, type: 'メモ', text: '', bed: null };
    }
    if (name === 'bed') {
      const i = Number(arg) - 1, b = S.state.beds[i];
      ui.bedDraft = b ? { no: i + 1, name: b.name, lines: b.lines, perRow: b.perRow, sow: b.sow } : null;
    }
  }

  /* ---------- 描画 ---------- */
  function render() {
    const { name, arg } = parseHash();
    const route = ROUTES[name];
    const key = name + '/' + (arg || '');
    const same = ui.lastRoute === key;
    const keep = {};
    if (same) screenEl.querySelectorAll('[data-keep]').forEach(el => { keep[el.dataset.keep] = [el.scrollTop, el.scrollLeft]; });
    const animate = !same && ui.lastRoute != null;
    if (!same) onEnter(name, arg);
    if (name === 'bed' && !ui.bedDraft) { go('settings'); return; }
    ui.lastRoute = key;

    // テーマ・文字サイズ
    const st = S.state.settings;
    phone.className = 'phone' + (st.dark ? ' dark' : '') + ' bg-' + st.bg + (route.notab ? ' notab' : '');
    document.documentElement.dataset.fs = st.fs;
    document.querySelector('meta[name="theme-color"]').setAttribute('content', st.dark ? '#2B2B23' : '#F7F3E8');

    screenEl.innerHTML = VIEWS[name](arg);
    const scr = screenEl.firstElementChild;
    if (animate && scr) scr.classList.add(route.push ? 'in-push' : 'in-fade');
    if (same) screenEl.querySelectorAll('[data-keep]').forEach(el => { const k = keep[el.dataset.keep]; if (k) { el.scrollTop = k[0]; el.scrollLeft = k[1]; } });

    tabbarEl.innerHTML = [['home', 'map', 'マップ'], ['harvest', 'clip', '収穫記録'], ['calendar', 'cal', 'カレンダー'], ['settings', 'gear', '設定']]
      .map(([r, i, l], k) => `<button class="tab ${k === route.tab ? 'on' : ''}" data-go="${r}" ${k === route.tab ? 'aria-current="page"' : ''}>${ic(i)}<span>${l}</span></button>`).join('');

    renderLayer();
    syncPanel();
    afterRender(name);
  }

  function afterRender(name) {
    // 詳細を開いたとき、選んだ大根がシートに隠れないようマップをスクロール
    if (name === 'home' && ui.sel && ui.sel[0] === 'p' && ui.scrolledFor !== ui.sel) {
      ui.scrolledFor = ui.sel;
      const m = $('.map'), mk = $('.mk.selring');
      if (m && mk) {
        const mr = m.getBoundingClientRect(), kr = mk.getBoundingClientRect();
        const left = kr.left < mr.left + 50 || kr.right > mr.right - 10 ? m.scrollLeft + kr.left - mr.left - mr.width / 2 : m.scrollLeft;
        m.scrollTo({ top: m.scrollTop + kr.top - mr.top - 30, left, behavior: 'smooth' });
      }
    }
  }

  function renderLayer() {
    let h = '', key = '';
    if (ui.sel) { const d = detailSheet(); if (d) { h += d; key = 'detail'; } }
    if (ui.exportOpen) { h += `<div class="scrim" data-act="closeExport"></div>` + exportSheet(); key = 'export'; }
    layerEl.innerHTML = h;
    if (key && key === ui.layerKey) layerEl.querySelectorAll('.sheet,.scrim').forEach(el => { el.classList.add('still'); el.style.animation = 'none'; });
    ui.layerKey = key;
  }

  function syncPanel() {
    const st = S.state.settings;
    document.querySelectorAll('#pTheme button').forEach(b => b.classList.toggle('on', (b.dataset.v === '1') === !!st.dark));
    document.querySelectorAll('#pBg button').forEach(b => b.classList.toggle('on', b.dataset.v === st.bg));
  }

  /* ---------- 共通部品 ---------- */
  function datebar() {
    const w = S.weather(TODAY);
    return `<div class="datebar"><span class="dt">${D.mdw(TODAY)}</span><span class="wx">${wxIcon(w.wx, 20)}${w.wx} ${w.hi}℃</span></div>`;
  }
  const lbl = (a, b) => `<div class="lbl"><div class="a">${a}</div><div class="b">${b}</div></div>`;
  const stepper = (act, v, u, min, max) => `<div class="stepper"><button data-act="${act}" data-v="-1" ${v <= min ? 'disabled' : ''} aria-label="減らす">−</button><span class="v">${v}<small>${u}</small></span><button data-act="${act}" data-v="1" ${v >= max ? 'disabled' : ''} aria-label="増やす">+</button></div>`;
  const ehdr = (cancel, title, save) => `<header class="ehdr"><button data-act="${cancel}">やめる</button><b>${title}</b><button class="save" data-act="${save}">保存</button></header>`;
  const dateField = (act, value) => `<span class="datef" data-act="pick" role="button" tabindex="0">${D.mdw(value)} ${ic('cal', 16, 1.7)}<input type="date" data-change="${act}" value="${value}" tabindex="-1"></span>`;

  function mapHTML({ z, filter, sel, big }) {
    const rows = S.state.beds.map((b, bi) => {
      let lines = '';
      for (let l = 0; l < b.lines; l++) {
        let cells = '';
        for (let k = 0; k < b.perRow; k++) {
          const pos = l * b.perRow + k, p = b.plants[pos];
          if (!p) continue;
          if (p.h) { cells += `<span class="mk done" title="${S.label(bi, pos)} 収穫済み"></span>`; continue; }
          const st = S.evalPlant(b, p).st, pid = bi + '-' + pos;
          cells += `<button class="mk ${st}${filter && filter !== st ? ' hide' : ''}${sel === pid ? ' selring' : ''}" data-act="mk" data-pid="${pid}" aria-label="${S.label(bi, pos)} ${LBL[st]}">${MG[st]}</button>`;
        }
        lines += `<div class="pline">${cells}</div>`;
      }
      return `<div class="mrow"><div class="rn">${bi + 1}</div><div class="pill">${lines}</div></div>`;
    }).join('');
    return `<div class="map" data-keep="map${big ? 'F' : ''}"><div class="mapin" style="--z:${z}"><div class="road"><i class="dia"></i>農道</div>${rows}</div></div>`;
  }

  /* =========================================================
     画面
     ========================================================= */
  const VIEWS = {};

  /* 01 マップ（ホーム） */
  VIEWS.home = () => {
    const c = S.counts(), f = ui.filter, w = S.weather(TODAY);
    const selPid = ui.sel && ui.sel[0] === 'p' ? ui.sel.slice(2) : null;
    return `<div class="scr home ${selPid ? 'compact' : ''}">
      <header class="hh"><div><div class="y">${TODAY.slice(0, 4)}年</div><div class="d">${D.mdw(TODAY)}</div></div>
        <div class="w"><div class="t">${wxIcon(w.wx, 22)}${w.wx}</div><div class="s">最高 ${w.hi}℃ ／ 最低 ${w.lo}℃</div></div></header>
      <section class="summary">
        <div class="sumh"><span>${f ? LBL[f] + 'のみ表示' : '判定サマリー'}</span><button class="all" data-act="filter" data-v="">すべて表示</button></div>
        <div class="cards">${ORDER.map(k => `<button class="card ${k}${f === k ? ' sel' : ''}${f && f !== k ? ' dim' : ''}" data-act="filter" data-v="${k}" aria-pressed="${f === k}"><span class="l">${dot(k, 12)}${LBL[k]}</span><span class="n">${c[k]}<small>本</small></span></button>`).join('')}</div>
      </section>
      <div class="legend"><span><i class="rk"></i>農道</span><span><i class="dia"></i>基準点</span><span><i class="dk"></i>収穫済み</span></div>
      <div class="mapwrap">
        ${mapHTML({ z: ui.zoom, filter: f, sel: selPid })}
        <button class="fsbtn" data-go="full">${ic('expand', 16, 1.9)}全画面</button>
        <div class="zoom"><button data-act="zoom" data-v="1" aria-label="拡大">+</button><button data-act="zoom" data-v="-1" aria-label="縮小">−</button></div>
      </div>
    </div>`;
  };

  /* 03 全画面マップ */
  VIEWS.full = () => {
    const c = S.counts();
    return `<div class="scr full">
      ${mapHTML({ z: 1.3 * ui.fzoom, filter: null, sel: null, big: true })}
      <button class="fsbtn" data-go="home">${ic('collapse', 16, 1.9)}戻る</button>
      <div class="tip">${ic('pinch', 12, 2)}2本指で広げて拡大・つまんで縮小</div>
      <div class="zoom"><button data-act="fzoom" data-v="1" aria-label="拡大">+</button><button data-act="fzoom" data-v="-1" aria-label="縮小">−</button></div>
      <div class="fsleg">${ORDER.map(k => `<span style="color:var(--${k})">${dot(k, 12)}${LBL[k]} ${c[k]}</span>`).join('')}</div>
    </div>`;
  };

  /* 02 大根の詳細（ボトムシート） */
  function detailSheet() {
    const kind = ui.sel[0], id = ui.sel.slice(2);
    const still = ui.layerKey === 'detail' ? ' still' : '';
    const scrim = parseHash().name === 'home' ? '' : `<div class="scrim" data-act="closeSheet"></div>`;
    if (kind === 'p') {
      const x = S.plant(id);
      if (!x || x.p.h) { ui.sel = null; return ''; }
      const e = x.e;
      const T = {
        g: ['収穫適期です', e.left > 0 ? `今が収穫どき。目安はあと${e.left}日` : '今日が適期の最終日です'],
        o: ['もうすぐ適期', `あと${e.left}日ほどで収穫適期に入ります`],
        b: ['まだ育ち途中です', `収穫適期まであと${e.left}日ほど`],
        r: ['適期を過ぎています', `適期から${e.left}日経過。早めに収穫しましょう`],
      }[e.st];
      return `${scrim}<div class="sheet${still}" role="dialog" aria-label="${S.label(x.bi, x.pos)}の大根">
        <div class="grab"></div>
        <div class="dt-h"><span>${S.label(x.bi, x.pos)}の大根</span><button data-act="closeSheet" aria-label="閉じる">${ic('x', 20, 1.8)}</button></div>
        <div class="stbox ${e.st}"><span class="ic">${MG[e.st]}</span><div><div class="big">${T[0]}</div><div class="sm">${T[1]}</div></div></div>
        <div class="wt"><span class="v">${e.weight.toFixed(2)}</span><span class="u">kg</span><span class="lb">推定重量</span></div>
        <div class="kv"><span>根の太さ</span><b>${e.dia.toFixed(1)} cm</b></div>
        <div class="kv"><span>種まき日</span><b>${D.md(x.bed.sow)}(${e.days}日目)</b></div>
        <div class="kv"><span>最終計測</span><b>今日 ${x.p.t}</b></div>
        <div class="sh-f"><button class="btn" data-act="harvestOne" data-pid="${id}">${ic('check', 18, 2.2)}収穫済みにする</button></div>
      </div>`;
    }
    const h = S.state.harvests.find(r => r.id === id);
    if (!h) { ui.sel = null; return ''; }
    const w = S.weather(h.date);
    return `${scrim}<div class="sheet${still}" role="dialog" aria-label="${S.label(h.bed, h.pos)}の大根">
      <div class="grab"></div>
      <div class="dt-h"><span>${S.label(h.bed, h.pos)}の大根</span><button data-act="closeSheet" aria-label="閉じる">${ic('x', 20, 1.8)}</button></div>
      <div class="stbox done"><span class="ic">${ic('check', 22, 2.8)}</span><div><div class="big">収穫済み</div><div class="sm">${D.mdw(h.date)}に収穫・${esc(h.name)}</div></div></div>
      <div class="wt"><span class="v">${h.weight.toFixed(2)}</span><span class="u">kg</span><span class="lb">収穫時の重量</span></div>
      <div class="kv"><span>根の太さ</span><b>${h.dia.toFixed(1)} cm</b></div>
      <div class="kv"><span>収穫日</span><b>${D.mdw(h.date)}</b></div>
      <div class="kv"><span>天気・気温</span><b style="display:flex;align-items:center;gap:6px">${wxIcon(w.wx, 18)}${w.wx} ${w.hi}℃ / ${w.lo}℃</b></div>
      <div class="sh-f"><button class="btn-o" data-act="unharvest" data-id="${h.id}">${ic('undo', 18, 1.8)}未収穫に戻す</button></div>
    </div>`;
  }

  /* 04 収穫記録 / 05 収穫データ */
  VIEWS.harvest = () => {
    const live = S.livePlants(), hs = S.state.harvests;
    const tabs = `<div class="htabs" role="tablist">${[`未収穫 ${live.length}`, `収穫済み ${hs.length}`].map((t, i) => `<button role="tab" class="${ui.htab === i ? 'on' : ''}" aria-selected="${ui.htab === i}" data-act="htab" data-v="${i}">${t}</button>`).join('')}</div>`;
    let body;
    if (ui.htab === 0) {
      const pr = { g: 0, r: 1, o: 2, b: 3 };
      const list = live.slice().sort(ui.sort === 'opt'
        ? (a, b) => pr[a.e.st] - pr[b.e.st] || (a.e.st === 'r' ? b.e.left - a.e.left : a.e.left - b.e.left) || a.bi - b.bi || a.pos - b.pos
        : (a, b) => a.bi - b.bi || a.pos - b.pos);
      ui.checked = new Set([...ui.checked].filter(id => live.some(x => x.pid === id)));
      const n = ui.checked.size, w = S.weather(TODAY);
      body = `<div class="hinfo"><span>収穫した大根にチェックを入れます</span><button data-act="sort">${ui.sort === 'opt' ? '適期順' : '畝順'}${ic('swap', 13, 1.8)}</button></div>
        <div class="scroll" data-keep="hlist">${list.length ? list.map(x => `<button class="hitem${ui.checked.has(x.pid) ? ' chk' : ''}" data-act="check" data-pid="${x.pid}" role="checkbox" aria-checked="${ui.checked.has(x.pid)}">
            <span class="cb">${ic('check', 20, 2.8)}</span>
            <span class="tx"><span class="nm">${S.label(x.bi, x.pos)}</span><span class="ds">${x.e.weight.toFixed(2)} kg・根の太さ ${x.e.dia.toFixed(1)} cm</span></span>${chip(x.e.st)}</button>`).join('') : '<div class="empty">未収穫の大根はありません</div>'}</div>
        <div class="hfoot"><div class="note">${wxIcon(w.wx, 14)}${D.mdw(TODAY)}・${w.wx}・${w.hi}℃ で記録します</div>
          <button class="btn" data-act="saveHarvest" ${n ? '' : 'disabled'}>${ic('check', 18, 2.2)}${n ? `${n}本を収穫済みとして保存` : '収穫した大根を選んでください'}</button></div>`;
    } else {
      const sorted = hs.slice().sort((a, b) => b.date.localeCompare(a.date) || a.bed - b.bed || a.pos - b.pos);
      const groups = [];
      sorted.forEach(h => { const g = groups[groups.length - 1]; if (g && g[0] === h.date) g[1].push(h); else groups.push([h.date, [h]]); });
      body = `<div class="hsum"><span>今シーズン ${hs.length}本・合計 ${sum(hs.map(h => h.weight)).toFixed(2)} kg</span><button class="btn-sm" data-act="export" ${hs.length ? '' : 'disabled'}>${ic('dl', 16, 1.8)}出力</button></div>
        <div class="scroll" data-keep="hdone">${groups.length ? groups.map(([d, arr]) => {
          const w = S.weather(d);
          return `<div class="gh"><span class="gd">${D.mdw(d)}<span class="gw">${wxIcon(w.wx, 15)}${w.wx} ${w.hi}℃</span></span><span class="gt">${arr.length}本・合計 ${sum(arr.map(h => h.weight)).toFixed(2)} kg</span></div>` +
            arr.map(h => `<button class="hrow" data-act="hrec" data-id="${h.id}"><span>${S.label(h.bed, h.pos)}</span><b>${h.weight.toFixed(2)} kg${ic('chevR', 16)}</b></button>`).join('');
        }).join('') : '<div class="empty">まだ収穫記録がありません</div>'}</div>`;
    }
    return `<div class="scr">${datebar()}${tabs}${body}</div>`;
  };

  const PERIODS = ['今シーズン（9月〜）', `今月（${Number(TODAY.slice(5, 7))}月）`, '今日'];
  function periodList() {
    const hs = S.state.harvests.slice().sort((a, b) => a.date.localeCompare(b.date) || a.bed - b.bed || a.pos - b.pos);
    if (ui.period === 1) return hs.filter(h => h.date.slice(0, 7) === TODAY.slice(0, 7));
    if (ui.period === 2) return hs.filter(h => h.date === TODAY);
    return hs;
  }
  function exportSheet() {
    const list = periodList(), still = ui.layerKey === 'export' ? ' still' : '';
    return `<div class="sheet${still}" role="dialog" aria-label="データを出力">
      <div class="grab"></div>
      <div class="sh-h"><div class="t">データを出力</div><div class="s">収穫済み ${list.length}本・日付／天気／気温／重さを含みます</div></div>
      <button class="erow period" data-act="period"><span>期間</span><b>${PERIODS[ui.period]}${ic('chevR', 16)}</b></button>
      ${[['print', '印刷する', 'そのままプリンターで印刷'], ['pdf', 'PDFで保存', '紙と同じ見た目で保存・共有'], ['csv', 'CSVで保存', 'Excelなどの表計算ソフトで開けます']]
        .map(([k, a, b]) => `<button class="erow" data-act="out" data-v="${k}" ${list.length ? '' : 'disabled'}>${ic(k, 24, 1.6)}<span class="tx"><span class="a">${a}</span><span class="b">${b}</span></span>${ic('chevR', 16)}</button>`).join('')}
      <div class="sh-f" style="padding-top:16px"><button class="btn-o" data-act="closeExport">閉じる</button></div>
    </div>`;
  }

  /* 06 カレンダー */
  VIEWS.calendar = () => {
    const [y, m] = ui.calMonth.split('-').map(Number);
    const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    const nd = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const rows = Math.ceil((first + nd) / 7);
    let g = '日月火水木金土'.split('').map(w => `<div class="wd">${w}</div>`).join('');
    for (let i = 0; i < first; i++) g += '<div></div>';
    for (let d = 1; d <= nd; d++) {
      const ds = `${y}-${pad(m)}-${pad(d)}`, mark = S.dayMark(ds);
      g += `<button class="dd${ds === ui.calDate ? ' sel' : ''}${ds === TODAY ? ' today' : ''}" data-act="calDay" data-v="${ds}" aria-label="${m}月${d}日"><span>${d}</span>${mark ? `<i class="${mark}"></i>` : ''}</button>`;
    }
    return `<div class="scr">${datebar()}
      <div class="calhead"><button data-act="calMove" data-v="-1" aria-label="前の月">${ic('chevL', 20)}</button><span>${y}年 ${m}月</span><button data-act="calMove" data-v="1" aria-label="次の月">${ic('chevR', 20)}</button></div>
      <div class="cal r${rows}">${g}</div>
      <div class="callegend"><span><i></i>記録あり</span><span><i class="o"></i>収穫見込み</span></div>
      <div class="scroll" data-keep="cal">${dayDetail(ui.calDate)}</div>
      <div class="calfoot"><button class="btn-o" data-act="newMemo">${ic('pen', 18, 1.6)}この日の作業やメモを書く</button></div>
    </div>`;
  };
  function dayDetail(ds) {
    const st = S.state, w = S.weather(ds);
    const item = (icon, html, attrs) => `<${attrs ? 'button' : 'div'} class="citem" ${attrs || ''}>${ic(icon, 18, 1.6)}<span>${html}</span>${attrs ? `<span class="go">${ic('chevR', 16)}</span>` : ''}</${attrs ? 'button' : 'div'}>`;
    let h = `<div class="cdate">${D.mdw(ds)}<span>${wxIcon(w.wx, 15)}${w.wx} ${w.hi}℃ / ${w.lo}℃</span></div>`;
    let any = false;

    // 作業記録・メモ
    st.records.filter(r => r.date === ds).forEach(r => {
      h += item(TYPE_ICON[r.type] || 'pen', `<span class="tag">${esc(r.type)}</span>${esc(r.text)}`, `data-act="editMemo" data-v="${r.id}"`);
      any = true;
    });
    // 収穫
    const hs = st.harvests.filter(x => x.date === ds);
    if (hs.length) {
      const beds = [...new Set(hs.map(x => x.bed + 1))].join('・');
      h += item('check', `収穫 ${hs.length}本（${beds}畝目）・${w.wx} ${w.hi}℃・合計 ${sum(hs.map(x => x.weight)).toFixed(2)} kg`, 'data-act="toHarvested"');
      any = true;
    }
    // 見込み
    if (ds === TODAY) {
      const n = S.counts().g;
      if (n) { h += item('clock', `今日の収穫適期：${n}本`); any = true; }
    } else if (ds > TODAY) {
      const n = S.predicted(ds);
      if (n) { h += item('clock', `収穫見込み：約${n}本が適期に入ります`); any = true; }
    }
    // 種まきからの日数（同じ日にまいた畝はまとめる）
    const bySow = {};
    st.beds.forEach((b, i) => { if (D.diff(ds, b.sow) > 0) (bySow[b.sow] = bySow[b.sow] || []).push(i + 1); });
    Object.keys(bySow).sort().forEach(sow => {
      h += item('sprout', `${bySow[sow].join('・')}畝目：種まきから${D.diff(ds, sow)}日目（${D.md(sow)}まき）`);
      any = true;
    });
    if (!any) h += '<div class="empty" style="padding:24px 22px">この日の記録はありません</div>';
    return h;
  }

  /* 07 記録を追加・編集 */
  VIEWS.memo = () => {
    const d = ui.draft;
    return `<div class="scr">${ehdr('memoCancel', d.id ? '記録を編集' : '記録を追加', 'memoSave')}
      <div class="scroll">
        <div class="srow"><span class="l1">日付</span>${dateField('memoDate', d.date)}</div>
        <div class="types" style="border-top:1px solid var(--line);padding-top:18px">${MEMO_TYPES.map(t => `<button class="pchip${d.type === t ? ' on' : ''}" data-act="memoType" data-v="${t}">${d.type === t ? ic('check', 16, 2.4) : ''}${t}</button>`).join('')}</div>
        ${d.type === '種まき' ? `<div class="fl" style="padding-top:4px">種をまいた畝</div><div class="types" style="padding-top:4px">${S.state.beds.map((b, i) => `<button class="pchip sm${d.bed === i ? ' on' : ''}" data-act="memoBed" data-v="${i}">${i + 1}畝目</button>`).join('')}</div>` : ''}
        <textarea class="ta" data-input="memoText" placeholder="作業の内容やメモを書きます（例：4畝目に2回目の種まき）">${esc(d.text)}</textarea>
        ${d.type === '種まき' ? `<div class="note">${ic('info', 13, 1.8)}<span>種まき日は収穫適期の予測に使われます${d.bed != null ? `（${d.bed + 1}畝目の種まき日を更新）` : ''}</span></div>` : ''}
        ${d.id ? `<button class="delbtn" data-act="memoDelete">この記録を削除</button>` : ''}
      </div></div>`;
  };

  /* 08 設定 */
  VIEWS.settings = () => {
    const st = S.state, s = st.settings;
    const total = sum(st.beds.map(b => b.lines * b.perRow));
    const SW = [['base', '#F5EEDC', '#E9DFC9', '生成り(標準)'], ['green', '#E4ECD5', '#D3E1BE', '緑'], ['black', '#2C2B24', '#3E3D34', '黒']];
    return `<div class="scr"><h1 class="stitle">設定</h1><div class="scroll" data-keep="set">
      <div class="srow">${lbl('畝の数', '畑全体の畝の本数')}${stepper('beds', st.beds.length, '本', 1, 12)}</div>
      <div class="sblock">${lbl('マップの背景色', '判定の色(緑・橙・青・赤)は共通です')}
        <div class="sw">${SW.map(([k, bg, pill, l]) => `<button class="opt" data-act="bg" data-v="${k}" aria-pressed="${s.bg === k}"><span class="box${s.bg === k ? ' sel' : ''}" style="background:${bg}">${[0, 1].map(() => `<span class="dots" style="background:${pill}"><i></i><i></i><i></i><i class="b"></i></span>`).join('')}${s.bg === k ? `<span class="badge">${ic('check', 11, 3)}</span>` : ''}</span><span>${l}</span></button>`).join('')}</div></div>
      <button class="srow" data-go="font"><span class="lk">${ic('T', 20, 1.8)}文字の大きさ</span><span class="val">${FS_LABEL[s.fs]}${ic('chevR', 16)}</span></button>
      <div class="srow"><span class="lk">${ic('moon', 20, 1.7)}画面の明るさ</span><span class="seg"><button class="${s.dark ? '' : 'on'}" data-act="dark" data-v="0">明るい</button><button class="${s.dark ? 'on' : ''}" data-act="dark" data-v="1">暗い</button></span></div>
      <div class="gap"></div>
      <div class="shead"><span>畝ごとの野菜と本数</span><b>合計 ${total}本</b></div>
      ${st.beds.map((b, i) => `<button class="bedrow" data-go="bed/${i + 1}"><span class="num">${i + 1}</span><span class="tx"><span class="nm">${esc(b.name)}</span><span class="ds">${b.lines}列 × ${b.perRow}本・${D.md(b.sow)}まき</span></span><b>${b.lines * b.perRow}本</b>${ic('chevR', 16)}</button>`).join('')}
      <div class="gap"></div>
      <button class="resetlink" data-act="reset">${ui.resetArm ? 'もう一度タップでリセットします' : 'デモデータを初期状態に戻す'}</button>
    </div></div>`;
  };

  /* 09 畝の設定 */
  VIEWS.bed = () => {
    const d = ui.bedDraft;
    const prev = Array.from({ length: d.lines }, () => `<div class="pl">${'<i></i>'.repeat(d.perRow)}</div>`).join('');
    return `<div class="scr">${ehdr('bedCancel', `${d.no}畝目`, 'bedSave')}
      <div class="scroll">
        <div class="fl">野菜の名前</div>
        <input class="input" data-input="bedName" value="${esc(d.name)}" maxlength="20" aria-label="野菜の名前">
        <div class="sugs">${['青首大根', '聖護院大根', '三浦大根', '紅芯大根'].map(t => `<button class="pchip${d.name === t ? ' on' : ''}" data-act="bedNameSet" data-v="${t}">${t}</button>`).join('')}</div>
        <div class="srow">${lbl('列の数', '畝の上に何列で植えたか')}${stepper('bedLines', d.lines, '列', 1, 4)}</div>
        <div class="srow">${lbl('1列あたりの本数', '1列に何本植えたか')}${stepper('bedPer', d.perRow, '本', 1, 20)}</div>
        <div class="fl" style="border-top:1px solid var(--line)">マップでの見え方</div>
        <div class="preview">${prev}</div>
        <div class="srow" style="margin-top:18px"><span class="l1">この畝の本数</span><span class="calc">${d.lines}列 × ${d.perRow}本 = <b>${d.lines * d.perRow}</b> 本</span></div>
        <div class="srow"><span class="l1">種まき日</span>${dateField('bedSow', d.sow)}</div>
      </div></div>`;
  };

  /* 12 文字の大きさ */
  VIEWS.font = () => {
    const fs = S.state.settings.fs;
    return `<div class="scr">
      <header class="bhdr"><button data-go="settings">${ic('chevL', 20)}<span>設定</span></button><b>文字の大きさ</b></header>
      <div class="scroll">
        <div class="sample"><div class="cap">見本</div><div class="s1">${D.mdw(TODAY)}</div><div class="s2">${dot('g', 26)}収穫適期です</div><div class="s3">1畝目・4番&nbsp; 0.86 kg</div><div class="s4">最終計測 今日 6:40</div></div>
        <div class="fsopts">${[['s', '小', 16], ['m', '中', 22], ['l', '大', 30]].map(([k, l, px]) => `<button class="${fs === k ? 'on' : ''}" data-act="fs" data-v="${k}" aria-pressed="${fs === k}"><span class="ch" style="font-size:${px}px">あ</span><span class="lb">${fs === k ? ic('check', 15, 2.4) : ''}${l}</span></button>`).join('')}</div>
        <div class="note fsnote">${ic('info', 13, 1.8)}アプリ内のすべての文字に反映されます</div>
      </div></div>`;
  };

  /* =========================================================
     操作
     ========================================================= */
  let toastTimer;
  function toast(msg) {
    toastEl.innerHTML = ic('check', 16, 2.4) + '<span>' + esc(msg) + '</span>';
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('on'), 2200);
  }
  const route = () => parseHash().name;

  const ACT = {
    /* ホーム・マップ */
    filter(el) { const v = el.dataset.v || null; ui.filter = v && ui.filter !== v ? v : null; render(); },
    mk(el) {
      const sel = 'p:' + el.dataset.pid;
      if (route() === 'full') { go('home', { sel }); return; }
      ui.sel = ui.sel === sel ? null : sel; render();
    },
    closeSheet() { ui.sel = null; render(); },
    zoom(el) { ui.zoom = clamp(ui.zoom * (el.dataset.v > 0 ? 1.25 : 0.8), 0.6, 2.4); render(); },
    fzoom(el) { ui.fzoom = clamp(ui.fzoom * (el.dataset.v > 0 ? 1.25 : 0.8), 0.5, 2); render(); },
    harvestOne(el) {
      const x = S.plant(el.dataset.pid);
      S.harvest([el.dataset.pid]); ui.sel = null; ui.checked.delete(el.dataset.pid);
      toast(`${S.label(x.bi, x.pos)}を収穫済みにしました`); render();
    },
    unharvest(el) { S.unharvest(el.dataset.id); ui.sel = null; toast('未収穫に戻しました'); render(); },

    /* 収穫記録 */
    htab(el) { ui.htab = Number(el.dataset.v); render(); },
    sort() { ui.sort = ui.sort === 'opt' ? 'bed' : 'opt'; render(); },
    check(el) { const id = el.dataset.pid; ui.checked.has(id) ? ui.checked.delete(id) : ui.checked.add(id); render(); },
    saveHarvest() {
      const ids = [...ui.checked]; if (!ids.length) return;
      S.harvest(ids); ui.checked.clear();
      toast(`${ids.length}本を収穫済みとして保存しました`); render();
    },
    hrec(el) { ui.sel = 'h:' + el.dataset.id; render(); },
    export() { ui.exportOpen = true; render(); },
    closeExport() { ui.exportOpen = false; render(); },
    period() { ui.period = (ui.period + 1) % PERIODS.length; render(); },
    out(el) {
      const list = periodList(); if (!list.length) return;
      if (el.dataset.v === 'csv') { downloadCSV(list); toast('CSVファイルを保存しました'); }
      else { printList(list); }
    },

    /* カレンダー */
    calMove(el) {
      const [y, m] = ui.calMonth.split('-').map(Number);
      const t = new Date(Date.UTC(y, m - 1 + Number(el.dataset.v), 1));
      ui.calMonth = t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1);
      ui.calDate = ui.calMonth === TODAY.slice(0, 7) ? TODAY : ui.calMonth + '-01';
      render();
    },
    calDay(el) { ui.calDate = el.dataset.v; render(); },
    newMemo() { go('memo/new'); },
    editMemo(el) { go('memo/' + el.dataset.v); },
    toHarvested() { go('harvest', { htab: 1 }); },

    /* 記録 */
    memoType(el) { ui.draft.type = el.dataset.v; if (ui.draft.type !== '種まき') ui.draft.bed = null; render(); },
    memoBed(el) { const v = Number(el.dataset.v); ui.draft.bed = ui.draft.bed === v ? null : v; render(); },
    memoCancel() { go('calendar'); },
    memoSave() {
      const d = ui.draft, text = (d.text || '').trim();
      if (!text && d.type === 'メモ') { toast('メモの内容を入力してください'); return; }
      if (d.type === '種まき' && d.bed != null && S.state.beds[d.bed]) S.state.beds[d.bed].sow = d.date;
      const rec = { id: d.id || S.uid('m'), date: d.date, type: d.type, text: text || (d.type === '種まき' && d.bed != null ? `${d.bed + 1}畝目に種まき` : d.type), bed: d.bed };
      S.upsertRecord(rec);
      ui.calDate = d.date; ui.calMonth = d.date.slice(0, 7);
      toast(d.id ? '記録を更新しました' : '記録を追加しました');
      go('calendar');
    },
    memoDelete() { S.deleteRecord(ui.draft.id); toast('記録を削除しました'); go('calendar'); },
    pick(el) {
      const inp = el.querySelector('input'); if (!inp) return;
      try { inp.showPicker(); } catch (e) { inp.style.pointerEvents = 'auto'; inp.focus(); inp.click(); }
    },

    /* 設定 */
    beds(el) {
      const n = clamp(S.state.beds.length + Number(el.dataset.v), 1, 12);
      S.setBedCount(n); toast(`畝の数を${n}本にしました`); render();
    },
    bg(el) { S.state.settings.bg = el.dataset.v; S.save(); render(); },
    dark(el) { S.state.settings.dark = el.dataset.v === '1'; S.save(); render(); },
    fs(el) { S.state.settings.fs = el.dataset.v; S.save(); render(); },
    reset() {
      if (!ui.resetArm) { ui.resetArm = true; render(); setTimeout(() => { if (ui.resetArm) { ui.resetArm = false; if (route() === 'settings') render(); } }, 3000); return; }
      ACT.resetNow();
    },
    resetNow() {
      S.reset(); ui.resetArm = false; ui.checked.clear(); ui.filter = null; ui.sel = null; ui.zoom = 1; ui.fzoom = 1;
      ui.calMonth = TODAY.slice(0, 7); ui.calDate = TODAY;
      toast('デモデータを初期状態に戻しました'); render();
    },

    /* 畝の設定 */
    bedNameSet(el) { ui.bedDraft.name = el.dataset.v; render(); },
    bedLines(el) { ui.bedDraft.lines = clamp(ui.bedDraft.lines + Number(el.dataset.v), 1, 4); render(); },
    bedPer(el) { ui.bedDraft.perRow = clamp(ui.bedDraft.perRow + Number(el.dataset.v), 1, 20); render(); },
    bedCancel() { go('settings'); },
    bedSave() { const d = ui.bedDraft; S.saveBed(d.no - 1, d); toast(`${d.no}畝目を保存しました`); go('settings'); },

    /* プロトタイプ操作パネル */
    demoDetail() {
      const live = S.livePlants();
      const x = live.find(p => p.e.st === 'g') || live[0];
      go('home', x ? { sel: 'p:' + x.pid } : {});
    },
    demoHarvest() { go('harvest', { htab: 0 }); },
    demoExport() { go('harvest', { htab: 1, export: true }); },
    demoLoading() { showLoading(); },
  };

  const INPUT = {
    memoText(el) { ui.draft.text = el.value; },
    bedName(el) {
      ui.bedDraft.name = el.value;
      document.querySelectorAll('.sugs .pchip').forEach(c => c.classList.toggle('on', c.dataset.v === el.value));
    },
  };
  const CHANGE = {
    memoDate(v) { ui.draft.date = v; },
    bedSow(v) { ui.bedDraft.sow = v; },
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act],[data-go]');
    if (!el || el.disabled) return;
    if (el.dataset.go) { go(el.dataset.go); return; }
    const fn = ACT[el.dataset.act];
    if (fn) fn(el, e);
  });
  document.addEventListener('input', e => {
    const el = e.target.closest('[data-input]');
    if (el && INPUT[el.dataset.input]) INPUT[el.dataset.input](el);
  });
  document.addEventListener('change', e => {
    const el = e.target.closest('[data-change]');
    if (el && CHANGE[el.dataset.change] && el.value) { CHANGE[el.dataset.change](el.value); render(); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && (ui.sel || ui.exportOpen)) { ui.sel = null; ui.exportOpen = false; render(); }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.datef')) { e.preventDefault(); ACT.pick(e.target); }
  });

  /* ---------- ピンチで拡大・縮小 ---------- */
  let pinch = null;
  const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  screenEl.addEventListener('touchstart', e => {
    if (e.touches.length !== 2) return;
    const m = e.target.closest('.map'); if (!m) return;
    const full = route() === 'full';
    pinch = { d: dist(e.touches), z: full ? ui.fzoom : ui.zoom, full, inner: m.querySelector('.mapin'), cur: null };
  }, { passive: true });
  screenEl.addEventListener('touchmove', e => {
    if (!pinch || e.touches.length !== 2) return;
    e.preventDefault();
    const z = clamp(pinch.z * dist(e.touches) / pinch.d, pinch.full ? 0.5 : 0.6, pinch.full ? 2 : 2.4);
    pinch.cur = z;
    pinch.inner.style.setProperty('--z', pinch.full ? 1.3 * z : z);
  }, { passive: false });
  screenEl.addEventListener('touchend', () => {
    if (!pinch) return;
    if (pinch.cur) { if (pinch.full) ui.fzoom = pinch.cur; else ui.zoom = pinch.cur; }
    pinch = null;
  });

  /* ---------- 出力 ---------- */
  function rowsFor(list) {
    return list.map(h => { const w = S.weather(h.date); return [h.date, w.wx, w.hi, w.lo, h.bed + 1, h.pos + 1, h.name, h.weight.toFixed(2), h.dia.toFixed(1)]; });
  }
  const HEAD = ['収穫日', '天気', '最高気温(℃)', '最低気温(℃)', '畝', '番号', '野菜', '重さ(kg)', '根の太さ(cm)'];
  function downloadCSV(list) {
    const q = v => /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
    const csv = '﻿' + [HEAD, ...rowsFor(list)].map(r => r.map(q).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `tsuchinoko_harvest_${TODAY}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function printList(list) {
    const total = sum(list.map(h => h.weight)).toFixed(2);
    $('#printArea').innerHTML = `<h1>収穫記録（${esc(PERIODS[ui.period])}）</h1><p>${list.length}本・合計 ${total} kg ／ 出力日 ${D.mdw(TODAY)}</p>
      <table><thead><tr>${HEAD.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rowsFor(list).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    window.print();
  }

  /* ---------- ローディング ---------- */
  const LOGO = `<svg width="190" height="165" viewBox="0 0 120 104" fill="none" aria-hidden="true">
    <path d="M14 72a46 46 0 0 1 92 0" stroke="#4D6B30" stroke-width="1.6"/><path d="M8 74h104" stroke="#C9BFA6" stroke-width="1.2"/>
    <ellipse cx="60" cy="74" rx="26" ry="10" fill="#EFE3C8"/>
    <path d="M60 30c-9 0-11 10-11 20 0 14 6 26 11 34 5-8 11-20 11-34 0-10-2-20-11-20z" fill="#FBF8F1" stroke="#4D6B30" stroke-width="1.6"/>
    <path d="M55 44h5M57 54h6M56 64h4" stroke="#C9BFA6" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M60 32C56 22 50 16 44 14c0 8 6 16 16 18z" fill="#8FA86A"/><path d="M60 32c0-12 3-20 8-26 3 8 0 20-8 26z" fill="#A8BC84"/>
    <path d="M60 32c6-8 14-12 22-12-2 8-12 13-22 12z" fill="#6E8A4A"/><path d="M60 32V18" stroke="#4D6B30" stroke-width="1.3"/>
    <g fill="#7D9A56"><ellipse cx="14" cy="60" rx="4.5" ry="2.4" transform="rotate(-40 14 60)"/><ellipse cx="18" cy="52" rx="4.5" ry="2.4" transform="rotate(-60 18 52)"/><ellipse cx="11" cy="68" rx="4.5" ry="2.4" transform="rotate(-20 11 68)"/>
    <ellipse cx="106" cy="60" rx="4.5" ry="2.4" transform="rotate(40 106 60)"/><ellipse cx="102" cy="52" rx="4.5" ry="2.4" transform="rotate(60 102 52)"/><ellipse cx="109" cy="68" rx="4.5" ry="2.4" transform="rotate(20 109 68)"/></g>
    <g fill="#D6A94A"><path d="M36 38l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z"/><path d="M84 36l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z"/><path d="M90 56l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/><path d="M30 56l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></g></svg>`;
  function showLoading() {
    const el = $('#loading');
    el.innerHTML = `${LOGO}<div class="brand">tsuchinoko</div><div class="msg">畑のデータを読み込んでいます</div><div class="bar"><i></i></div>`;
    el.classList.remove('out'); el.classList.add('on');
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.classList.remove('on', 'out'), 450); }, 1400);
  }

  /* ---------- 起動 ---------- */
  if (!location.hash) history.replaceState(null, '', '#/home');
  render();
  showLoading();
})();
