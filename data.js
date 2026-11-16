/* =========================================================
   tsuchinoko プロトタイプ — デモデータとストア
   ・データはすべて架空。本番ではこのファイルを API / センサー値の
     取得処理に差し替える想定（画面側は Store の関数だけを使う）
   ・状態は localStorage に保存（使えない環境ではメモリのみ）
   ========================================================= */
(function () {
  'use strict';

  const TODAY = '2026-11-15';           // デモの「今日」（固定）
  const KEY = 'tsuchinoko-proto-v1';

  /* ---------- 日付ユーティリティ（UTCで計算してズレを防ぐ） ---------- */
  const D = {
    parse(s) { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); },
    fmt(t) {
      const d = new Date(t);
      return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
    },
    add(s, n) { return D.fmt(D.parse(s) + n * 86400000); },
    diff(a, b) { return Math.round((D.parse(a) - D.parse(b)) / 86400000); }, // a - b（日）
    wd(s) { return '日月火水木金土'[new Date(D.parse(s)).getUTCDay()]; },
    md(s) { const [, m, d] = s.split('-').map(Number); return m + '月' + d + '日'; },
    mdw(s) { return D.md(s) + '(' + D.wd(s) + ')'; },
  };

  /* ---------- 疑似乱数（毎回同じデモデータになるように） ---------- */
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

  /* ---------- 天気（架空） ---------- */
  const WX_FIX = {
    '2026-11-15': { wx: '晴れ', hi: 14, lo: 6 },
    '2026-11-12': { wx: 'くもり', hi: 15, lo: 8 },
    '2026-11-08': { wx: '晴れ', hi: 17, lo: 9 },
  };
  function weather(date) {
    if (WX_FIX[date]) return WX_FIX[date];
    const r = rng(hash(date)); r();
    const doy = D.diff(date, '2026-09-01');
    const hi = Math.round(29 - doy * 0.165 + (r() * 4 - 2));
    const x = r();
    const wx = x < 0.5 ? '晴れ' : x < 0.8 ? 'くもり' : '雨';
    const lo = Math.round(hi - 6 - r() * 3);
    return { wx, hi, lo };
  }

  /* ---------- 生育モデル（架空の判定ロジック） ----------
     age = 種まきからの日数 + 個体差(j)
     ～47日: 未熟(b) / 48～54日: 間近(o) / 55～63日: 適期(g) / 64日～: 過ぎ(r) */
  const WIN_START = 55, WIN_END = 63;
  function evalPlant(bed, p, date) {
    date = date || TODAY;
    const days = D.diff(date, bed.sow);
    const age = days + p.j;
    const w = Math.max(0.01, 1.3 / (1 + Math.exp(-(age - 54) / 7)));
    let st, left;
    if (age < 48) { st = 'b'; left = WIN_START - age; }
    else if (age < WIN_START) { st = 'o'; left = WIN_START - age; }
    else if (age <= WIN_END) { st = 'g'; left = WIN_END - age; }
    else { st = 'r'; left = age - WIN_END; }
    return {
      days, age, st, left,
      weight: Math.round(w * 100) / 100,
      dia: Math.round((2.4 + 5.6 * Math.pow(w, 0.6)) * 10) / 10,
    };
  }

  function makePlant(r) {
    return { j: Math.round(r() * 16 - 8), t: '6:' + String(Math.floor(r() * 60)).padStart(2, '0') };
  }

  /* ---------- 初期データ ---------- */
  function seed() {
    const r = rng(20261115);
    const sows = ['2026-09-20', '2026-09-20', '2026-09-27', '2026-10-04', '2026-10-11', '2026-10-18'];
    const beds = sows.map(s => ({
      name: '青首大根', lines: 1, perRow: 9, sow: s,
      plants: Array.from({ length: 9 }, () => makePlant(r)),
    }));
    beds[0].plants[3].j = 9; // 1畝目・4番は「過ぎ」にしておく
    const st = { beds, harvests: [], records: [], settings: { bg: 'base', fs: 'm', dark: false }, seq: 1 };

    // 過去の収穫（育ちの早かった株を収穫した想定）
    [[0, 1, '2026-11-08', 8], [0, 6, '2026-11-12', 6], [0, 8, '2026-11-12', 8]].forEach(([bi, pos, d, j]) => {
      st.beds[bi].plants[pos].j = j;
      harvestRaw(st, bi, pos, d);
    });

    // 作業記録・メモ
    st.records = [
      ['2026-09-20', '種まき', '1・2畝目に青首大根を種まき', 0],
      ['2026-09-27', '種まき', '3畝目に青首大根を種まき', 2],
      ['2026-10-01', '間引き', '1・2畝目を2本立ちに間引き'],
      ['2026-10-04', '種まき', '4畝目に青首大根を種まき', 3],
      ['2026-10-11', '種まき', '5畝目に青首大根を種まき', 4],
      ['2026-10-12', '追肥', '1〜3畝目に追肥（化成肥料）'],
      ['2026-10-18', '種まき', '6畝目に青首大根を種まき', 5],
      ['2026-10-26', '水やり', '晴れが続いたので全体に水やり'],
      ['2026-11-03', 'メモ', '4畝目の葉に虫食いあり。様子を見る'],
      ['2026-11-15', 'メモ', '葉の色が濃くなってきた'],
    ].map(([date, type, text, bed]) => ({ id: 'm' + (st.seq++), date, type, text, bed: bed == null ? null : bed }));
    return st;
  }

  function harvestRaw(st, bi, pos, date) {
    const b = st.beds[bi], p = b && b.plants[pos];
    if (!p || p.h) return;
    const e = evalPlant(b, p, date);
    const id = 'h' + (st.seq++);
    st.harvests.push({ id, date, bed: bi, pos, name: b.name, weight: e.weight, dia: e.dia });
    p.h = id;
  }

  /* ---------- ストア ---------- */
  const Store = {
    TODAY, D, weather, evalPlant,
    state: null,

    load() {
      try { const s = localStorage.getItem(KEY); if (s) { this.state = JSON.parse(s); return; } } catch (e) { /* ignore */ }
      this.state = seed();
    },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch (e) { /* ignore */ } },
    reset() { this.state = seed(); this.save(); },
    uid(prefix) { return (prefix || 'x') + (this.state.seq++); },

    label(bi, pos) { return (bi + 1) + '畝目・' + (pos + 1) + '番'; },

    /** 未収穫の大根一覧 */
    livePlants() {
      const out = [];
      this.state.beds.forEach((bed, bi) => bed.plants.forEach((p, pos) => {
        if (!p.h) out.push({ pid: bi + '-' + pos, bi, pos, bed, p, e: evalPlant(bed, p) });
      }));
      return out;
    },
    plant(pid) {
      const [bi, pos] = pid.split('-').map(Number);
      const bed = this.state.beds[bi], p = bed && bed.plants[pos];
      return p ? { pid, bi, pos, bed, p, e: evalPlant(bed, p) } : null;
    },
    counts() {
      const c = { g: 0, o: 0, b: 0, r: 0 };
      this.livePlants().forEach(x => c[x.e.st]++);
      return c;
    },

    harvest(pids, date) {
      pids.forEach(pid => { const [bi, pos] = pid.split('-').map(Number); harvestRaw(this.state, bi, pos, date || TODAY); });
      this.save();
    },
    unharvest(hid) {
      const st = this.state, h = st.harvests.find(x => x.id === hid);
      if (!h) return;
      const p = st.beds[h.bed] && st.beds[h.bed].plants[h.pos];
      if (p && p.h === hid) delete p.h;
      st.harvests = st.harvests.filter(x => x.id !== hid);
      this.save();
    },

    /** その日に「適期に入る」見込みの本数 */
    predicted(date) {
      if (date < TODAY) return 0;
      return this.livePlants().filter(x => (x.e.st === 'o' || x.e.st === 'b') && D.add(TODAY, x.e.left) === date).length;
    },
    /** カレンダーの印: 'f' = 記録あり / 'o' = 収穫見込み / '' = なし */
    dayMark(date) {
      const st = this.state;
      if (st.records.some(r => r.date === date) || st.harvests.some(h => h.date === date)) return 'f';
      if (date >= TODAY && this.predicted(date) > 0) return 'o';
      return '';
    },

    setBedCount(n) {
      const beds = this.state.beds;
      while (beds.length < n) {
        const r = rng(hash('bed' + beds.length + Date.now()));
        beds.push({ name: '青首大根', lines: 1, perRow: 9, sow: TODAY, plants: Array.from({ length: 9 }, () => makePlant(r)) });
      }
      while (beds.length > n) beds.pop();
      this.save();
    },
    saveBed(bi, d) {
      const b = this.state.beds[bi];
      if (!b) return;
      b.name = d.name.trim() || '大根';
      b.lines = d.lines; b.perRow = d.perRow; b.sow = d.sow;
      const n = d.lines * d.perRow;
      const r = rng(hash('bed' + bi + Date.now()));
      while (b.plants.length < n) b.plants.push(makePlant(r));
      b.plants.length = n;
      this.save();
    },

    upsertRecord(rec) {
      const rs = this.state.records, i = rs.findIndex(x => x.id === rec.id);
      if (i >= 0) rs[i] = rec; else rs.push(rec);
      this.save();
    },
    deleteRecord(id) { this.state.records = this.state.records.filter(x => x.id !== id); this.save(); },
  };

  Store.load();
  window.Store = Store;
})();
