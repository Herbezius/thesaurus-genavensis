/* Thesaurus Genavensis — jeu élève (chasse au trésor + malédictions entre groupes) */
(() => {
const { QUIZ, SPHINX, CURSES, PROTECTIONS, BOONS, SCENES, FINALE } = window.TG;
const scene = id => SCENES.find(x => x.id === id);
const ZONES = ['cour', '113', '114', '115', '0203', '408'];
const N = 8, DUR = 300, H1 = 90, H2 = 180, H3 = 270, LOCK = 15, SYNC_MS = 3000;
const KEY = 'thesaurus-netlify-v1';
const STOP = new Set(['le','la','les','l','un','une','des','de','du','d','au','aux','sa','son','ses','par','en','avec','et','c','est','il','elle','tient','a','sur','dans']);
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); return true } catch (e) { return v === undefined ? null : false } }
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a };
const quiz = id => QUIZ.find(q => q.id === id);

let S = ls(KEY) || { screen: 'join' };
let B = { groups: [], meta: null, ok: true };
const PH = {}, VID = {};
const save = () => ls(KEY, S);

function loadPhotos() { for (let i = 0; i <= N; i++) { const p = ls(KEY + '-ph-' + i); if (p) PH[i] = p } }
loadPhotos();

/* ---------- réseau ---------- */
async function api(route, body) {
  const r = await fetch('/api/' + route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  let data = {}; try { data = await r.json() } catch (e) {}
  if (!r.ok) { const err = new Error(data.error || 'Erreur réseau'); err.status = r.status; throw err }
  return data;
}
const ident = () => ({ code: S.code, gid: S.gid, token: S.token });
let syncing = false;
async function sync() {
  if (!S.gid || syncing) return; syncing = true;
  try {
    const st = cur();
    const res = await api('sync', { ...ident(), since: S.since || '', state: {
      idx: S.i, found: S.found, sesterces: S.sesterces, gloire: S.gloire || 0, status: S.screen === 'end' ? 'end' : S.screen,
      qStart: S.screen === 'q' && st ? st.t0 : null, done: S.screen === 'end', protections: S.prot, log: S.log.slice(-40),
      qid: st ? st.id : 0, pending: Object.keys(S.pending || {}), final: S.fin || null } });
    const wasStarted = !!(B.meta && B.meta.started !== false), known = !!B.meta;
    B = { ...res, ok: true, skew: res.now - Date.now() };
    if (wasStarted !== res.meta.started && S.screen === 'ready') { if (known && res.meta.started) { buzz([200, 100, 200]); toast('C\'est parti ! La chasse est ouverte.') } render() }
    for (const c of res.inbox) { if (S.applied.includes(c.id)) continue; S.applied.push(c.id); if (!S.since || c.id > S.since) S.since = c.id; incoming(c) }
    for (const a of res.adj) { if (S.adjApplied.includes(a.id)) continue; S.adjApplied.push(a.id); const unit = a.kind === 'gloire' ? 'gloire' : 'sesterces'; if (unit === 'gloire') S.gloire = Math.max(0, (S.gloire || 0) + a.amount); else S.sesterces = Math.max(0, S.sesterces + a.amount); addLog('adj', `${a.amount > 0 ? '+' : ''}${a.amount} ${unit} : ${a.reason}`); toast(`${a.amount > 0 ? '+' : ''}${a.amount} ${unit} — ${a.reason}`) }
    save();
  } catch (e) {
    B.ok = false;
    if (e.status === 403 || e.status === 404) { B.gone = e.message }
  } finally { syncing = false; drawBoard(); if (!$('#temple').hidden) drawTemple(true) }
}
setInterval(sync, SYNC_MS);

/* ---------- vidéos ---------- */
async function probe(url) { if (!url || url in VID) return; VID[url] = null; try { const r = await fetch(url, { method: 'HEAD' }); VID[url] = r.ok && /video/.test(r.headers.get('content-type') || 'video') } catch (e) { VID[url] = false } }
QUIZ.forEach(q => probe(q.video)); Object.values(CURSES).forEach(c => probe(c.video)); SCENES.forEach(x => probe(x.video));

/* ---------- correction des réponses libres ---------- */
function toks(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’'`-]/g, ' ').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(t => t && !STOP.has(t)).map(t => t.length > 3 && /[sx]$/.test(t) && !/^[ivxlc]+$/.test(t) ? t.slice(0, -1) : t) }
function lev(a, b) { const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n] }
function near(a, b) { if (a === b) return true; if (/^\d+$/.test(a) || /^\d+$/.test(b) || /^[ivxlc]+$/.test(b)) return false; const L = Math.max(a.length, b.length); return L >= 7 ? lev(a, b) <= 2 : L >= 4 ? lev(a, b) <= 1 : false }
function check(input, q) {
  const t = toks(input); if (!t.length) return false;
  const accT = q.acc.map(toks), accWords = new Set(accT.flat());
  const bad = new Set(q.fausses.flatMap(toks).filter(w => !accWords.has(w)));
  if (t.some(w => [...bad].some(b => near(w, b)))) return false;
  if (t.length > 3) return false;
  if (accT.some(a => a.join(' ') === t.join(' '))) return true;
  return accT.filter(a => a.length === 1).some(a => t.some(w => near(w, a[0])));
}

/* ---------- partie ---------- */
const cur = () => S.qs && S.qs[S.i];
const elapsed = () => Math.min(DUR, (Date.now() - cur().t0) / 1000);
const cap = el => el < H1 ? 10 : el < H2 ? 8 : el < H3 ? 6 : 2;
const nErr = st => st.wrong.length + st.qwrong.length;
function addLog(kind, text) { S.log.push({ t: Date.now(), kind, text }); if (S.log.length > 60) S.log.shift() }

async function join(code, name, players) {
  const res = await api('game/join', { code, name, players });
  B = { groups: [], meta: res.meta, ok: true };
  for (let i = 0; i <= N; i++) { ls(KEY + '-ph-' + i, null); delete PH[i] }
  const start = Math.floor(Math.random() * ZONES.length), order = ZONES.slice(start).concat(ZONES.slice(0, start));
  const pick = shuffle(QUIZ.filter(q => q.id !== FINALE.qid)).slice(0, N).sort((a, b) => order.indexOf(a.zone) - order.indexOf(b.zone));
  S = { screen: 'ready', code: res.code, gid: res.gid, token: res.token, name, players, i: 0, sesterces: 10, gloire: 0, found: 0,
    prot: { egide: 0, miroir: 0 }, pending: {}, since: '', applied: [], adjApplied: [], log: [], queue: [],
    qs: pick.map(q => ({ id: q.id, opts: shuffle([q.bonne, ...q.fausses]), wrong: [], qwrong: [], pts: null, t0: null, lockUntil: 0, elapsed: null, nophoto: false, via: null, fx: {} })) };
  save(); render(); sync();
}
function begin() {
  if (!B.meta || B.meta.started === false) return;
  const st = cur(); st.t0 = Date.now();
  st.fx = { dedaleUntil: S.pending.dedale ? Date.now() + 60000 : 0, noSalle: !!S.pending.brouillard, noJoker: !!S.pending.tantale, apollon: !!S.pending.apollon };
  S.pending = {}; S.screen = 'q'; save(); render(); sync();
}
function win(via) {
  const st = cur(), el = elapsed(); st.pts = Math.max(1, cap(el) - 2 * nErr(st)); st.elapsed = Math.round(el); st.via = via;
  S.sesterces += st.pts; S.gloire = (S.gloire || 0) + st.pts; S.found++; S.screen = 'res'; buzz([60, 40, 60]); save(); render(); sync();
}
function fail() { const st = cur(); if (st.pts !== null) return; st.pts = 0; st.elapsed = DUR; S.screen = 'res'; buzz([300, 100, 300]); save(); render(); sync() }
function miss() { cur().lockUntil = Date.now() + LOCK * 1000; buzz([200]); save(); updateQ(true) }
function submitFree() {
  const st = cur(), q = quiz(st.id), inp = $('#ans'); if (!inp || Date.now() < st.lockUntil) return;
  const v = inp.value.trim(); if (!v) return; if (elapsed() >= DUR) return fail();
  if (check(v, q)) return win('libre');
  st.wrong.push(v.slice(0, 40)); inp.value = ''; miss();
}
function pickOpt(o) { const st = cur(), q = quiz(st.id); if (Date.now() < st.lockUntil) return; if (elapsed() >= DUR) return fail(); if (o === q.bonne) return win('joker'); st.qwrong.push(o); miss() }
function next() { S.i++; if (S.i >= N) { S.screen = 'final'; S.fin = S.fin || { step: 0, answers: [], score: 0, text: '', sent: false } } else S.screen = 'ready'; save(); render(); sync() }
function buzz(p) { try { navigator.vibrate && navigator.vibrate(p) } catch (e) {} }
function role(i) { const p = S.players.filter(Boolean), r = ['lit l\'énigme', 'tient le téléphone et prend la photo', 'guette les cartels', 'surveille le chrono et le Temple']; return p.map((n, k) => `<b>${esc(n)}</b> ${r[(k + i) % p.length] || ''}`).join(' · ') }
let toastT;
function toast(msg, curse) { const t = $('#toast'); t.textContent = msg; t.className = 'toast' + (curse ? ' c' : ''); t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 4500) }

/* ---------- malédictions reçues ---------- */
function incoming(c) {
  if (c.type === 'note') { addLog('note', c.text); toast(c.text, true); return }
  if (c.kind === 'boon') { applyBoon(c); return }
  const nom = (c.zeus ? 'Foudre de Zeus : ' : '') + (CURSES[c.type]?.nom || c.type);
  const from = c.zeus ? 'envoyée par Zeus en personne' : c.reflected ? `renvoyée par le Miroir de ${c.fromName}` : `lancée par ${c.fromName}`;
  if (S.screen === 'end') { addLog('recv', `${nom} (${from}) — sans effet, chasse terminée`); return }
  if (c.zeus) { addLog('recv', `${nom} (${from})${c.reason ? ' — motif : ' + c.reason : ''}`); toast(`Zeus vous foudroie ! ${CURSES[c.type].nom}.${c.reason ? ' Motif : ' + c.reason + '.' : ''}`, true); applyCurse(c.type, 'Zeus', c.reason, c.scene); return }
  if (S.prot.egide) {
    S.prot.egide = 0; addLog('blocked', `${nom} ${from} : bloquée par l'Égide`);
    toast(`L'Égide d'Athéna bloque ${nom} de ${c.fromName} !`);
    api('curse', { ...ident(), type: 'note', target: c.from, text: `${S.name} a bloqué votre ${nom} avec l'Égide d'Athéna.` }).catch(() => {});
    return;
  }
  if (S.prot.miroir && !c.reflected) {
    S.prot.miroir = 0; addLog('reflect', `${nom} de ${c.fromName} renvoyée par le Miroir`);
    toast(`Le Miroir de Persée renvoie ${nom} à ${c.fromName} !`);
    api('curse', { ...ident(), type: c.type, target: c.from, reflect: true }).catch(() => {});
    return;
  }
  addLog('recv', `${nom} (${from})`);
  applyCurse(c.type, c.fromName);
}
function applyBoon(c) {
  const who = c.zeus ? 'Zeus' : c.fromName, st = cur(), inQ = S.screen === 'q' && st && st.t0;
  let msg;
  if (c.type === 'don5' || c.type === 'don10') { const n = c.type === 'don5' ? 5 : 10; S.sesterces += n; msg = `${who} vous offre ${n} sesterces !` }
  else if (c.type === 'egide' || c.type === 'miroir') {
    const p = PROTECTIONS[c.type];
    if (S.prot[c.type]) { S.sesterces += p.prix; msg = `${who} vous offre ${p.nom}. Vous l'aviez déjà : elle est convertie en ${p.prix} sesterces.` }
    else { S.prot[c.type] = 1; msg = `${who} vous offre ${p.nom} !` }
  } else if (c.type === 'apollon') {
    if (inQ) { st.fx.apollon = true; msg = `${who} vous accorde la Faveur d'Apollon : la salle de votre énigme est révélée !` }
    else { S.pending.apollon = true; msg = `${who} vous accorde la Faveur d'Apollon pour votre prochaine énigme.` }
  } else return;
  if (c.reason) msg += ` Motif : ${c.reason}.`;
  addLog('boon', msg); toast(msg); buzz([60, 40, 60]); save();
  if (S.screen === 'q') updateQ(true); else if (S.screen !== 'end') render();
}
function pickScene() {
  const pool = SCENES.filter(x => x.id !== 'meduse'), seen = S.seenScenes || [];
  const fresh = pool.filter(x => !seen.includes(x.id)), list = fresh.length ? fresh : pool;
  return list[Math.floor(Math.random() * list.length)].id;
}
function applyCurse(type, fromName, reason, sceneId) {
  const st = cur(), inQ = S.screen === 'q' && st && st.t0;
  const nom = CURSES[type].nom;
  if (type === 'pandore') {
    const r = Math.random();
    let result;
    if (r < 0.15) { S.sesterces += 8; result = { gift: 'Un trésor ! +8 sesterces.' } }
    else if (r < 0.3) { if (!S.prot.egide) { S.prot.egide = 1; result = { gift: 'Un cadeau des dieux : vous recevez une Égide d\'Athéna !' } } else { S.sesterces += 8; result = { gift: 'Un trésor ! +8 sesterces.' } } }
    else result = { curse: shuffle(['meduse', 'colere', 'sphinx', 'dedale', 'brouillard', 'tantale'])[0] };
    S.queue.push({ kind: 'pandore', from: fromName, result, reason });
    if (result.gift) addLog('gift', 'Boîte de Pandore : ' + result.gift);
    save(); showOverlay(); return;
  }
  if (type === 'meduse' || type === 'colere') {
    const id = type === 'meduse' ? 'meduse' : (sceneId && scene(sceneId) ? sceneId : pickScene());
    S.seenScenes = (S.seenScenes || []).concat(id).slice(-20);
    S.queue.push({ kind: 'scene', scene: id, from: fromName, reason, phase: 'play' }); save(); showOverlay(); return;
  }
  if (type === 'sphinx') {
    const item = { kind: type, from: fromName, reason };
    if (type === 'sphinx') { const sq = SPHINX[Math.floor(Math.random() * SPHINX.length)]; item.q = SPHINX.indexOf(sq); item.opts = shuffle([sq.ok, ...sq.bad]); item.wrong = []; item.lockUntil = 0 }
    S.queue.push(item); save(); showOverlay(); return;
  }
  if (S.screen === 'final' && ['dedale', 'brouillard', 'tantale'].includes(type)) { addLog('recv', `${nom} (${fromName}) — sans effet pendant l'épreuve finale`); save(); return }
  if (type === 'dedale') { if (inQ) st.fx.dedaleUntil = Date.now() + 60000; else S.pending.dedale = true }
  if (type === 'brouillard') { if (inQ && elapsed() < H1) st.fx.noSalle = true; else S.pending.brouillard = true }
  if (type === 'tantale') { if (inQ && elapsed() < H3) st.fx.noJoker = true; else S.pending.tantale = true }
  toast(`${nom} ! Lancée par ${fromName}. ${CURSES[type].court}${inQ ? '' : ' à la prochaine énigme'}.${reason ? ' Motif : ' + reason + '.' : ''}`, true);
  buzz([100, 50, 100, 50, 100]); save(); if (S.screen === 'q') updateQ(true); else render();
}

/* ---------- superpositions (Méduse, Sphinx, Pandore) ---------- */
function showOverlay() {
  const ov = $('#ov'), it = (S.queue || [])[0];
  if (!it) { ov.hidden = true; ov.innerHTML = ''; return }
  ov.hidden = false;
  if (it.kind === 'scene') {
    const sc = scene(it.scene) || SCENES[0];
    if (!it.started) { it.started = Date.now(); save(); buzz([400, 100, 400]) }
    const el = (Date.now() - it.started) / 1000;
    if (it.phase === 'play' && el >= sc.dur) { it.phase = 'fact'; save() }
    if (it.phase === 'play') {
      const hasV = VID[sc.video];
      ov.innerHTML = `<div class="overlay"><div class="ov">
        <h2>${esc(sc.nom)}</h2><p>${it.from === 'Zeus' ? 'Zeus en personne vous retient !' : `Envoyé par ${esc(it.from)}.`}${it.reason ? ` <span style="color:#ffd27a">Motif : ${esc(it.reason)}</span>` : ''}</p>
        ${sc.obole && !it.paid && el < sc.payAt ? `<button class="btn gold" id="scpay" ${S.sesterces < sc.obole ? 'disabled' : ''}>Payer l'obole : ${sc.obole} sesterces pour traverser tout de suite</button><p class="small" id="scpoor" style="color:#ffb4ab;margin:0" hidden></p>` : ''}
        ${hasV ? `<video class="sc-video" id="scv" src="${sc.video}" autoplay muted playsinline></video>` : window.TGScenes.html(sc.id, el)}
        <div class="sc-cap" id="sccap" aria-live="polite"></div>
        <div class="sc-meta"><span>${sc.obole ? 'Payez ou attendez : votre chrono continue.' : 'Impossible de passer : votre chrono continue.'}</span><span class="cd" id="ovcd"></span></div>
        ${hasV ? '<button class="btn ghost sm" id="scsound" style="color:#f0c9e6;border-color:#f0c9e6">Activer le son (écouteurs)</button>' : ''}
      </div></div>`;
      if (it.paid) { const r = $('#ov .sc'); if (r) r.classList.add('paid') }
      const pay = $('#scpay'); if (pay) pay.onclick = () => { const now = (Date.now() - it.started) / 1000; if (it.paid || S.sesterces < sc.obole || now >= sc.payAt) return;
        S.sesterces -= sc.obole; it.paid = true; it.started = Date.now() - sc.payAt * 1000; addLog('spend', `Obole payée à Charon : −${sc.obole} sesterces`); save(); sync(); showOverlay() };
      const v = $('#scv'); if (v) { try { v.currentTime = Math.min(el, sc.dur - .5) } catch (e) {} }
      const sb = $('#scsound'); if (sb) sb.onclick = () => { v.muted = false; v.play().catch(() => {}); sb.hidden = true };
      tickScene(it, sc);
    } else {
      const f = sc.flash, opts = it.opts || (it.opts = shuffle([f.ok, ...f.bad]));
      ov.innerHTML = `<div class="overlay"><div class="ov">
        <h2>${esc(sc.nom)}</h2>
        <div class="fact"><h3>Le savais-tu ?</h3><p>${esc(sc.fact)}</p>${sc.voir ? `<p class="voir">À voir au musée : ${esc(sc.voir)}.</p>` : ''}</div>
        <div class="fact"><h3>Question flash</h3><p>${esc(f.q)}</p><p class="small" style="color:#d9c8e6">Bonne réponse du premier coup : +2 gloire et +2 sesterces.</p>
          <div class="opts">${opts.map((o, k) => `<button class="opt${o === f.ok ? ' good' : ''}" data-k="${k}" ${it.answer != null ? 'disabled' : ''} ${it.answer != null && o === f.ok ? 'style="border-color:#6cc58f;background:#173326"' : ''}>${esc(o)}</button>`).join('')}</div>
          ${it.answer != null ? `<p style="color:${it.answer ? '#6cc58f' : '#ffb4ab'}">${it.answer ? 'Bravo ! +2 gloire et +2 sesterces.' : `Raté : c'était « ${esc(f.ok)} ».`}</p>` : ''}</div>
        <button class="btn gold" id="scdone" ${it.answer == null ? 'disabled' : ''}>Reprendre la chasse</button>
      </div></div>`;
      ov.querySelector('.opts').onclick = e => { const b = e.target.closest('.opt'); if (!b || it.answer != null) return; const ok = opts[+b.dataset.k] === f.ok; it.answer = ok; if (ok) { S.sesterces += 2; S.gloire = (S.gloire || 0) + 2; addLog('boon', `Question flash réussie (${sc.nom}) : +2 gloire et +2 sesterces`) } save(); showOverlay() };
      $('#scdone').onclick = () => { S.queue.shift(); save(); render(); showOverlay() };
    }
  } else if (it.kind === 'sphinx') {
    const sq = SPHINX[it.q], v = CURSES.sphinx.video;
    ov.innerHTML = `<div class="overlay"><div class="ov"><h2>Énigme du Sphinx</h2><p>${esc(it.from)} a envoyé le Sphinx. Répondez juste pour passer !</p>${it.reason ? `<p style="color:#ffd27a">Motif : ${esc(it.reason)}</p>` : ''}
      ${VID[v] ? `<video src="${v}" autoplay muted playsinline loop style="max-height:30vh"></video>` : ''}
      <p style="font-size:20px">${esc(sq.q)}</p>
      <div class="opts">${it.opts.map((o, k) => `<button class="opt" data-k="${k}" ${it.wrong.includes(o) ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
      <p class="lock" id="ovlock" hidden></p></div></div>`;
    ov.querySelector('.opts').onclick = e => { const b = e.target.closest('.opt'); if (!b || b.disabled || Date.now() < it.lockUntil) return; const o = it.opts[+b.dataset.k];
      if (o === sq.ok) { addLog('recv', 'Sphinx vaincu'); S.queue.shift(); save(); toast('Bonne réponse : le Sphinx vous laisse passer.'); showOverlay(); return }
      it.wrong.push(o); it.lockUntil = Date.now() + 10000; buzz([200]); save(); showOverlay() };
  } else if (it.kind === 'pandore') {
    if (!it.opened) { it.opened = Date.now(); save() }
    const v = CURSES.pandore.video, reveal = Date.now() - it.opened > 3500;
    const r = it.result, txt = r.gift ? r.gift : `Il en sort… ${CURSES[r.curse].nom} !`;
    ov.innerHTML = `<div class="overlay"><div class="ov"><h2>Boîte de Pandore</h2><p>${esc(it.from)} vous a envoyé une boîte mystérieuse…</p>${it.reason ? `<p style="color:#ffd27a">Motif : ${esc(it.reason)}</p>` : ''}
      ${VID[v] ? `<video src="${v}" autoplay muted playsinline style="max-height:40vh"></video>` : ''}
      ${reveal ? `<p style="font-size:22px">${esc(txt)}</p><button class="btn gold" id="ovok">Continuer</button>` : `<div class="cd">…</div>`}</div></div>`;
    if (reveal) $('#ovok').onclick = () => { S.queue.shift(); save(); if (r.curse) applyCurse(r.curse, it.from + ' (Pandore)', it.reason); else { render(); showOverlay() } };
  }
}
function tickOverlay() {
  const it = S.queue && S.queue[0]; if (!it) return;
  if ($('#ov').hidden) showOverlay();
  if (it.kind === 'scene' && it.phase === 'play') { const sc = scene(it.scene) || SCENES[0]; if ((Date.now() - it.started) / 1000 >= sc.dur) { it.phase = 'fact'; save(); showOverlay() } else tickScene(it, sc) }
  if (it.kind === 'sphinx') { const l = $('#ovlock'), rem = Math.ceil((it.lockUntil - Date.now()) / 1000); if (l) { l.hidden = rem <= 0; l.textContent = `Faux ! Le Sphinx vous bloque encore ${rem} s.` } }
  if (it.kind === 'pandore' && !$('#ovok') && Date.now() - it.opened > 3500) showOverlay();
}

function tickScene(it, sc) {
  const el = (Date.now() - it.started) / 1000, cap = $('#sccap'), cd = $('#ovcd');
  if (cd) cd.textContent = Math.max(0, Math.ceil(sc.dur - el)) + ' s';
  if (cap) { let t = ''; for (const [s, txt] of sc.captions) if (el >= s) t = txt; if (it.paid && sc.paidCaption) t = sc.paidCaption; if (cap.textContent !== t) cap.textContent = t }
  const pay = $('#scpay'); if (pay) { if (el >= sc.payAt) { pay.remove(); const n = $('#scpoor'); if (n) n.remove() } else { const poor = S.sesterces < sc.obole; pay.disabled = poor; const n = $('#scpoor'); if (n) { n.hidden = !poor; n.textContent = `Il vous faut ${sc.obole} sesterces : vous n'en avez que ${S.sesterces}. Sinon, vous attendrez.` } } }
  window.TGScenes.tick(sc.id, el, document.querySelector('#ov .sc'));
}

/* ---------- épreuve finale commune ---------- */
function finalHtml() {
  const F = FINALE, f = S.fin, head = `<div class="top"><span class="pill v">Épreuve finale</span><span class="pill">${S.gloire || 0} gloire</span><span class="pill">${S.sesterces} S</span></div><div id="boardwrap">${boardHtml()}</div>`;
  if (f.step === 0) return `${head}
<section class="card">
 <div class="eyebrow">9e trésor · commun à tous les groupes</div>
 <h2>${esc(F.titre)}</h2><p class="muted">${esc(F.artiste)} · ${esc(F.salle)}</p>
 <p>${esc(F.intro)}</p>
 <p class="hint">${esc(F.regarder)}</p>
 <p class="small muted">Pendant l'épreuve finale, aucune malédiction ne peut vous atteindre.</p>
 ${PH[N] ? `<div class="thumbrow"><img src="${PH[N]}" alt="Votre photo du tableau"><button class="link" id="fphoto">Reprendre la photo</button></div>` : `<button class="btn" id="fphoto">Photographier le tableau</button>`}
</section>
<button class="btn gold" id="fgo" ${PH[N] || f.nophoto ? '' : 'disabled'}>Nous sommes devant le tableau</button>
${PH[N] || f.nophoto ? '' : `<button class="link" id="fnoph">Continuer sans photo</button>`}`;
  if (f.step >= 1 && f.step <= F.mcq.length) {
    const i = f.step - 1, m = F.mcq[i], opts = (f.opts = f.opts || [])[i] || (f.opts[i] = shuffle([m.ok, ...m.bad])), a = f.answers[i];
    return `${head}
<section class="card fin">
 <div class="eyebrow">Comprendre · question ${f.step} sur ${F.mcq.length}</div>
 <p style="font-size:19px;font-weight:600">${esc(m.q)}</p>
 <div class="opts">${opts.map((o, k) => `<button class="opt" data-f="${k}" ${a != null ? 'disabled' : ''} ${a != null && o === m.ok ? 'style="border-color:var(--verd);background:rgba(108,197,143,.15);opacity:1"' : ''}${a === o && o !== m.ok ? ' style="border-color:var(--curse);opacity:1"' : ''}>${esc(o)}</button>`).join('')}</div>
 ${a != null ? `<p style="font-weight:700;color:${a === m.ok ? 'var(--verd)' : 'var(--curse)'}">${a === m.ok ? `Juste : +${F.ptsQcm} gloire.` : 'Pas tout à fait.'}</p><p>${esc(m.expl)}</p>` : ''}
</section>
${a != null ? `<button class="btn" id="fnext">${f.step < F.mcq.length ? 'Question suivante' : 'Dernière étape : réfléchir'}</button>` : ''}`;
  }
  if (f.step === F.mcq.length + 1) {
    const M = F.missions.find(m => m.id === f.mission);
    if (!M) return `${head}
<section class="card">
 <div class="eyebrow">Créer · dernière mission</div>
 <h2>À vous de faire parler le tableau</h2>
 <p>Choisissez votre mission. Zeus lira les créations à voix haute devant le tableau, à la fin de la visite.</p>
 <div class="opts">${F.missions.map(m => `<button class="opt" data-mis="${m.id}"><b>${esc(m.titre)}</b> · ${esc(m.court)}</button>`).join('')}</div>
</section>`;
    return `${head}
<section class="card">
 <div class="eyebrow">Créer · ${esc(M.titre)}</div>
 <p style="font-size:17px">${esc(M.consigne)}</p>
 <p class="small muted">${esc(M.aide)}</p>
 <textarea id="ftxt" rows="6" maxlength="900" style="width:100%;font:inherit;padding:10px;border-radius:10px" placeholder="${esc(M.placeholder.replace('{nom}', S.name))}">${esc(f.text)}</textarea>
 <p class="small muted" id="fcount"></p>
 <button class="link" id="fswap">Changer de mission</button>
</section>
<button class="btn gold" id="fsend" disabled>Envoyer à Zeus</button>`;
  }
  return `${head}
<section class="card">
 <div class="eyebrow">Épreuve finale accomplie</div>
 <h2>Le chant continue</h2>
 <p>Votre ${f.mission === 'chant' ? 'chant est parti' : 'bulle est partie'} vers l'Olympe : Zeus ${f.mission === 'chant' ? 'le' : 'la'} lira à voix haute devant le tableau, et peut ${f.mission === 'chant' ? 'le' : 'la'} récompenser. Vous gagnez le 9e trésor.</p>
 <p class="small muted">Questions justes : ${f.score / FINALE.ptsQcm} sur ${FINALE.mcq.length} · création envoyée : +${FINALE.ptsTexte} gloire.</p>
</section>
<button class="btn" id="fend">Voir le classement</button>`;
}
function bindFinal() {
  const F = FINALE, f = S.fin, go = (fn) => () => { fn(); save(); render(); sync() };
  const ph = $('#fphoto'); if (ph) ph.onclick = takePhoto;
  const np = $('#fnoph'); if (np) np.onclick = () => { if (!np.dataset.c) { np.dataset.c = '1'; np.textContent = 'Confirmer : continuer sans photo (signalé à l\'enseignant·e)'; return } f.nophoto = true; save(); render() };
  const g = $('#fgo'); if (g) g.onclick = go(() => { f.step = 1 });
  document.querySelectorAll('[data-f]').forEach(b => b.onclick = go(() => { const i = f.step - 1, m = F.mcq[i]; if (f.answers[i] != null) return; const o = f.opts[i][+b.dataset.f]; f.answers[i] = o; if (o === m.ok) { f.score += F.ptsQcm; S.gloire = (S.gloire || 0) + F.ptsQcm } }));
  const n = $('#fnext'); if (n) n.onclick = go(() => { f.step++ });
  document.querySelectorAll('[data-mis]').forEach(b => b.onclick = go(() => { f.mission = b.dataset.mis }));
  const sw = $('#fswap'); if (sw) sw.onclick = go(() => { f.mission = null });
  const t = $('#ftxt'), c = $('#fcount'), send = $('#fsend');
  if (t) { const upd = () => { const L = t.value.trim().length; c.textContent = L < F.minChars ? `Encore ${F.minChars - L} caractères au minimum.` : 'Prêt à partir pour l\'Olympe.'; send.disabled = L < F.minChars; f.text = t.value; save() }; t.oninput = upd; upd() }
  if (send) send.onclick = go(() => { if (f.sent || f.text.trim().length < F.minChars) return; f.text = f.text.trim(); f.sent = true; f.step = F.mcq.length + 2; S.gloire = (S.gloire || 0) + F.ptsTexte; S.found++; addLog('boon', `Épreuve finale accomplie (${(F.missions.find(m => m.id === f.mission) || {}).titre || ''}) : +${F.ptsTexte} gloire et 9e trésor`) });
  const e = $('#fend'); if (e) e.onclick = go(() => { S.screen = 'end' });
}

/* ---------- Temple ---------- */
let T = { sel: null, target: null, msg: '' };
function openTemple() { T = { sel: null, target: null, msg: '' }; $('#temple').hidden = false; drawTemple() }
function closeTemple() { $('#temple').hidden = true; $('#temple').innerHTML = '' }
function curseBlock(g) {
  const now = Date.now() + (B.skew || 0), sec = t => { const n = Math.ceil((t - now) / 1000); return n >= 60 ? `${Math.floor(n / 60)} min ${String(n % 60).padStart(2, '0')}` : `${n} s` };
  if (g.done) return 'fini'; if (g.status === 'final') return 'épreuve finale';
  if (S.lt === g.gid) return 'maudit en dernier';
  if (g.immUntil && g.immUntil > now) return 'protégé encore ' + sec(g.immUntil);
  if (g.graceUntil && g.graceUntil > now) return 'libre dans ' + sec(g.graceUntil);
  return '';
}
function drawTemple(soft) {
  const el = $('#temple'); if (el.hidden) return;
  if (soft && el.querySelector(':focus')) return;
  const meta = B.meta || { cursesOn: true, disabled: [] };
  const others = (B.groups || []).filter(g => g.gid !== S.gid);
  const allowed = k => meta.cursesOn && !meta.disabled.includes(k);
  el.innerHTML = `<div class="overlay" style="background:rgba(10,14,13,.88);color:inherit"><div class="ov" style="text-align:left">
   <section class="card">
    <div class="top"><h2>Le Temple</h2><span class="pill">${S.sesterces} sesterces</span></div>
    ${meta.cursesOn ? '' : '<p class="err">Les malédictions sont suspendues par votre enseignant·e.</p>'}
    <div class="eyebrow">Malédictions</div>
    <div class="shop">${Object.entries(CURSES).filter(([k]) => !meta.disabled.includes(k)).map(([k, c]) => `
      <button class="item" data-c="${k}" aria-pressed="${T.sel === k}" ${!allowed(k) || c.prix > S.sesterces ? 'disabled' : ''}>
       <span class="n">${esc(c.nom)}</span><span class="p">${c.prix} S</span><span class="d">${esc(c.desc)}</span></button>`).join('')}</div>
    ${T.sel && !T.sel.startsWith('b:') ? `<div class="eyebrow">Cible</div>
     <div class="targets">${others.length ? others.map(g => { const why = curseBlock(g); return `<button data-t="${g.gid}" aria-pressed="${T.target === g.gid}" ${why ? 'disabled' : ''}>${esc(g.name)}${why ? ` <span class="small">(${why})</span>` : ''}</button>` }).join('') : '<p class="muted small">Aucun autre groupe pour l\'instant.</p>'}</div>
     <button class="btn curse" id="cast" ${T.target ? '' : 'disabled'}>Lancer ${esc(CURSES[T.sel].nom)}</button>` : ''}
    ${T.msg ? `<p class="err">${esc(T.msg)}</p>` : ''}
    ${meta.boonsOn !== false ? `<div class="eyebrow">Bienfaits pour un autre groupe</div>
    <div class="shop">${Object.entries(BOONS).map(([k, c]) => `
      <button class="item" data-b="${k}" aria-pressed="${T.sel === 'b:' + k}" ${c.prix > S.sesterces ? 'disabled' : ''}>
       <span class="n">${esc(c.nom)}</span><span class="p">${c.prix} S</span><span class="d">${esc(c.desc)}</span></button>`).join('')}</div>` : ''}
    ${T.sel && T.sel.startsWith('b:') ? `<div class="eyebrow">Groupe à aider</div>
     <div class="targets">${others.length ? others.map(g => `<button data-t="${g.gid}" aria-pressed="${T.target === g.gid}" ${g.done ? 'disabled' : ''}>${esc(g.name)}${g.done ? ' (fini)' : ''}</button>`).join('') : '<p class="muted small">Aucun autre groupe pour l\'instant.</p>'}</div>
     <button class="btn" id="give" ${T.target ? '' : 'disabled'}>Offrir : ${esc(BOONS[T.sel.slice(2)].nom)}</button>` : ''}
    <div class="eyebrow">Protections</div>
    <div class="shop">${Object.entries(PROTECTIONS).filter(([k]) => k !== 'miroir' || !meta.disabled.includes('miroir')).map(([k, p]) => `
      <button class="item" data-p="${k}" ${S.prot[k] || p.prix > S.sesterces ? 'disabled' : ''}>
       <span class="n">${esc(p.nom)}${S.prot[k] ? ' · active' : ''}</span><span class="p">${p.prix} S</span><span class="d">${esc(p.desc)}</span></button>`).join('')}</div>
    <button class="btn ghost" id="tclose">Retour à la chasse</button>
   </section></div></div>`;
  el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { T.sel = b.dataset.c; T.msg = ''; drawTemple() });
  el.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { T.sel = 'b:' + b.dataset.b; T.msg = ''; drawTemple() });
  const give = $('#give'); if (give) give.onclick = async () => {
    const k = T.sel.slice(2), c = BOONS[k]; if (S.sesterces < c.prix) return; give.disabled = true; give.textContent = 'Envoi…';
    try {
      await api('boon', { ...ident(), type: k, target: T.target });
      const tn = (B.groups.find(g => g.gid === T.target) || {}).name || '?';
      S.sesterces -= c.prix; addLog('gave', `${c.nom} offerte à ${tn}`); save();
      closeTemple(); toast(`${c.nom} offerte à ${tn}.`); render(); sync();
    } catch (e) { T.msg = e.message; drawTemple() }
  };
  el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { T.target = b.dataset.t; T.msg = ''; drawTemple() });
  el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const p = PROTECTIONS[b.dataset.p]; if (S.prot[b.dataset.p] || S.sesterces < p.prix) return; S.sesterces -= p.prix; S.prot[b.dataset.p] = 1; addLog('buy', `Achat : ${p.nom}`); save(); toast(`${p.nom} active.`); drawTemple(); drawBoard(); sync() });
  const cast = $('#cast'); if (cast) cast.onclick = async () => {
    const c = CURSES[T.sel]; if (S.sesterces < c.prix) return; cast.disabled = true; cast.textContent = 'Envoi…';
    try {
      await api('curse', { ...ident(), type: T.sel, target: T.target });
      const tn = (B.groups.find(g => g.gid === T.target) || {}).name || '?';
      S.sesterces -= c.prix; S.lt = T.target; addLog('sent', `${c.nom} lancée sur ${tn}`); save();
      closeTemple(); toast(`${c.nom} lancée sur ${tn} !`, true); render(); sync();
    } catch (e) { T.msg = e.message; drawTemple() }
  };
  $('#tclose').onclick = closeTemple;
}

/* ---------- photo ---------- */
function takePhoto() { const c = $('#cam'); c.value = ''; c.click() }
$('#cam').addEventListener('change', e => {
  const f = e.target.files && e.target.files[0]; if (!f || !['q', 'final'].includes(S.screen)) return; const slot = S.screen === 'final' ? N : S.i;
  const url = URL.createObjectURL(f), img = new Image();
  img.onload = () => { const M = 640, r = Math.min(1, M / Math.max(img.width, img.height)), cv = document.createElement('canvas'); cv.width = Math.round(img.width * r); cv.height = Math.round(img.height * r); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); const d = cv.toDataURL('image/jpeg', .6); URL.revokeObjectURL(url); PH[slot] = d; if (slot === N) S.fin.photo = true; else cur().nophoto = false; ls(KEY + '-ph-' + slot, d); save(); render() };
  img.onerror = () => { URL.revokeObjectURL(url); toast('Photo illisible, recommencez.') };
  img.src = url;
});
function noPhoto(b) { if (!b.dataset.c) { b.dataset.c = '1'; b.textContent = 'Confirmer : continuer sans photo (signalé à l\'enseignant·e)'; return } cur().nophoto = true; save(); render() }
const hasProof = () => !!PH[S.i] || cur().nophoto;

/* ---------- bandeau ---------- */
function boardHtml() {
  const gs = (B.groups || []).slice().sort((a, b) => (b.gloire || 0) - (a.gloire || 0) || b.found - a.found);
  return `<div class="board" id="board">${gs.map(g => `<div class="chip ${g.gid === S.gid ? 'me' : ''} ${g.online || g.gid === S.gid ? '' : 'off'}">
    <b>${esc(g.name)}${g.gid === S.gid ? ' (vous)' : ''}</b>
    <span class="st">${g.done ? 'Terminé' : `Énigme ${Math.min(g.idx + 1, g.total)}/${g.total}`} · ${g.found} trésor${g.found > 1 ? 's' : ''}</span>
    <span class="st">${g.gloire || 0} gloire · ${g.sesterces} S${g.online || g.gid === S.gid ? '' : ' · hors ligne'}</span>
    ${g.protections && (g.protections.egide || g.protections.miroir) ? `<span class="sh">${[g.protections.egide ? 'Égide' : '', g.protections.miroir ? 'Miroir' : ''].filter(Boolean).join(' · ')}</span>` : ''}
  </div>`).join('')}</div>${B.ok ? '' : '<p class="net">Réseau perdu : le jeu continue, synchronisation dès le retour du réseau.</p>'}`;
}
function drawBoard() { const el = $('#boardwrap'); if (el) el.innerHTML = boardHtml(); const tb = $('#tbtn'); if (tb) tb.textContent = `Temple · ${S.sesterces} S`; const gl = $('#glo'); if (gl) gl.textContent = `${S.gloire || 0} gloire` }
const topBar = () => `<div class="top"><span class="pill v">Énigme ${Math.min(S.i + 1, N)} / ${N}</span><span class="pill" id="glo">${S.gloire || 0} gloire</span><button class="btn curse sm" id="tbtn">Temple · ${S.sesterces} S</button></div><div id="boardwrap">${boardHtml()}</div>
${S.prot.egide || S.prot.miroir ? `<div class="prot">${S.prot.egide ? '<span class="badge">Égide d\'Athéna active</span>' : ''}${S.prot.miroir ? '<span class="badge">Miroir de Persée actif</span>' : ''}</div>` : ''}
${Object.keys(S.pending || {}).filter(k => CURSES[k]).length ? `<p class="small" style="color:var(--curse)">Malédiction en attente pour la prochaine énigme : ${Object.keys(S.pending).filter(k => CURSES[k]).map(k => CURSES[k].nom).join(', ')}</p>` : ''}
${S.pending && S.pending.apollon ? '<p class="small" style="color:var(--verd)">Faveur d\'Apollon en attente : la salle de votre prochaine énigme sera révélée d\'emblée.</p>' : ''}`;

/* ---------- écrans ---------- */
function render() {
  const a = $('#app'); lastLv = null; lastDed = null;
  if (B.gone && S.gid) { a.innerHTML = `<section class="card"><h2>Partie fermée</h2><p>${esc(B.gone)}</p><button class="btn ghost" id="leave">Revenir à l'accueil</button></section>`; $('#leave').onclick = () => { S = { screen: 'join' }; B = { groups: [], ok: true }; save(); render() }; return }
  a.innerHTML = S.screen === 'join' ? joinHtml() : S.screen === 'ready' ? readyHtml() : S.screen === 'q' ? qHtml() : S.screen === 'res' ? resHtml() : S.screen === 'final' ? finalHtml() : endHtml();
  bind(); if (S.screen === 'final') bindFinal(); if (S.screen === 'q') updateQ(true);
  window.scrollTo({ top: 0 });
}
function joinHtml() {
  const pre = new URLSearchParams(location.search).get('code') || '';
  return `<header style="display:grid;gap:6px;padding:4px 0">
 <div class="eyebrow">Musée d'art et d'histoire · Genève</div>
 <h1>Thesaurus Genavensis</h1>
 <p class="muted">Chasse au trésor et guerre des malédictions. Huit objets à retrouver, des sesterces à dépenser au Temple pour ralentir les autres groupes.</p>
</header>
<section class="card">
 <h2>Rejoindre la partie</h2>
 <label for="code">Code de la partie<input type="text" id="code" maxlength="8" value="${esc(pre)}" autocomplete="off" autocapitalize="characters" style="font-family:var(--mono);text-transform:uppercase;letter-spacing:.15em"></label>
 <label for="g">Nom du groupe<input type="text" id="g" maxlength="30" placeholder="Ex. : Legio XIII Gemina" autocomplete="off"></label>
 <label for="p1">Joueur 1<input type="text" id="p1" maxlength="20" autocomplete="off"></label>
 <label for="p2">Joueur 2<input type="text" id="p2" maxlength="20" autocomplete="off"></label>
 <label for="p3">Joueur 3 (facultatif)<input type="text" id="p3" maxlength="20" autocomplete="off"></label>
 <label for="p4">Joueur 4 (facultatif)<input type="text" id="p4" maxlength="20" autocomplete="off"></label>
 <button class="btn" id="go" disabled>Entrer dans la partie</button>
 <p class="err" id="jerr" hidden></p>
</section>
<section class="card">
 <h2>Règles</h2>
 <ul class="rules">
  <li><b>But :</b> gagner le plus de <b>gloire</b>. La gloire fait le classement et ne se dépense jamais. Les <b>sesterces</b>, eux, sont votre monnaie pour le Temple.</li>
  <li>Chaque énigme (un texte ou une vidéo) désigne une œuvre. Trouvez-la, <b>photographiez-la</b> (sans flash, personne dans le cadre), puis répondez à la question : la réponse se lit ou se compte devant l'œuvre.</li>
  <li><b>5 minutes</b> par énigme. Indices à 1 min 30 (la salle) et à 3 min (l'objet). Joker à choix multiples à 4 min 30.</li>
  <li>Chaque objet trouvé rapporte autant de gloire que de sesterces : 10 sans indice, puis 8, 6 ou 2. Chaque erreur fait perdre 2 et bloque 15 secondes.</li>
  <li>Au <b>Temple</b>, dépensez vos sesterces en malédictions contre les autres groupes, en protections, ou en bienfaits pour aider un groupe allié.</li>
  <li><b>Zeus</b> (votre enseignant·e) surveille tout depuis l'Olympe : sa foudre ignore toutes les protections.</li>
  <li>Un groupe maudit est protégé un moment par les dieux : 3 minutes au début de la chasse, de moins en moins à mesure qu'il avance, 1 minute seulement à la fin. Un groupe qui vient d'ouvrir une énigme est aussi épargné quelques secondes. On ne maudit pas deux fois de suite le même groupe. Le Temple indique qui est protégé, et pour combien de temps.</li>
  <li>Après la 8e énigme, tous les groupes se retrouvent devant la même œuvre pour l'<b>épreuve finale</b> : observer, comprendre, puis créer. Sans malédictions.</li>
  <li>Au musée : on marche, on parle bas, on ne touche à rien. Zeus peut retirer de la gloire à ceux qui courent ou crient.</li>
 </ul>
</section>`;
}
function readyHtml() {
  const started = !!(B.meta && B.meta.started !== false), first = S.i === 0;
  return `${topBar()}
<section class="card">
 <div class="eyebrow">${esc(S.name)}</div>
 <h2>${first ? 'Prêts pour l\'aventure ?' : `Prêts pour l'énigme ${S.i + 1} ?`}</h2>
 ${started ? `<p>Le chronomètre de 5 minutes démarre dès que vous appuyez.${first ? '' : ' Passez au Temple avant, si vous voulez.'}</p>` : `<p><b>En attente du départ.</b> Votre enseignant·e va lancer la partie : le bouton s'activera tout seul.</p>`}
 <p class="who">${role(S.i)}</p>
 <button class="btn" id="begin" ${started ? '' : 'disabled'}>${first ? 'Démarrer l\'aventure' : 'Révéler l\'énigme'}</button>
</section>` }
function enigmeText(st, q) {
  if (st.fx.dedaleUntil > Date.now()) return `<p class="enigme maze">« ${esc(shuffle(q.enigme.split(' ')).join(' '))} »</p><p class="small" style="color:var(--curse)">Labyrinthe de Dédale : les mots sont mélangés encore <span id="dedcd"></span> s.</p>`;
  return `<p class="enigme">« ${esc(q.enigme)} »</p>`;
}
function qHtml() {
  const st = cur(), q = quiz(st.id), ph = PH[S.i], hasVid = q.video && VID[q.video];
  return `${topBar()}
<section class="card">
 <div class="timer">
  <div class="ring" aria-hidden="true"><svg viewBox="0 0 100 100"><circle class="track" cx="50" cy="50" r="42"/><circle class="prog" id="prog" cx="50" cy="50" r="42" stroke-dasharray="263.9" stroke-dashoffset="0"/>${[H1, H2, H3].map(t => { const a = t / DUR * 2 * Math.PI; return `<line class="tick" x1="${50 + 36 * Math.cos(a)}" y1="${50 + 36 * Math.sin(a)}" x2="${50 + 48 * Math.cos(a)}" y2="${50 + 48 * Math.sin(a)}"/>` }).join('')}</svg><div class="t" id="clock">5:00</div></div>
  <div class="steps" id="steps"></div>
 </div>
 <div id="enig">${hasVid ? (st.fx.dedaleUntil > Date.now() ? `<p class="hint cursed"><b>Labyrinthe de Dédale</b><br>La vidéo est perdue dans le labyrinthe pendant encore <span id="dedcd"></span> s.</p>` : `<video class="vid" id="qvid" src="${q.video}" autoplay muted playsinline></video><p class="enigme">Quelle œuvre du musée montre la suite de cette vidéo ?</p><button class="link" id="replay">Revoir la vidéo</button>`) : enigmeText(st, q)}</div>
 <div id="hints" style="display:grid;gap:8px"></div>
</section>
${hasProof() ? `
<section class="card">
 ${ph ? `<div class="thumbrow"><img src="${ph}" alt="Photo de l'objet"><button class="link" id="retake">Reprendre la photo</button></div>` : `<p class="tries">Sans photo : ce sera signalé à votre enseignant·e.</p>`}
 <h2><span class="stepno">2</span>${esc(q.question)}</h2>
 <div class="answer"><input type="text" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Votre réponse" placeholder="Votre réponse"><button class="btn" id="send">Valider</button></div>
 <p class="fmt">Réponse attendue : ${esc(q.format)}.</p>
 <p class="tries" id="tries"></p>
 <p class="lock" id="lock" hidden></p>
 <div class="joker" id="joker" hidden>
  <p><b style="color:var(--gold)">Joker</b> · choisissez parmi ces réponses (rapporte 2)</p>
  <div class="opts" id="opts">${st.opts.map((o, k) => `<button class="opt" data-k="${k}">${esc(o)}</button>`).join('')}</div>
 </div>
</section>` : `
<section class="card">
 <h2><span class="stepno">1</span>Trouvez l'œuvre et photographiez-la</h2>
 <p class="muted small">Sans flash, l'œuvre bien visible, personne sur la photo. La question s'affichera ensuite.</p>
 <button class="btn gold" id="shoot">Prendre la photo</button>
 <button class="link" id="nophoto">Photo impossible ?</button>
</section>`}`;
}
let lastLv = null, lastDed = null;
function updateQ(force) {
  if (S.screen !== 'q') return;
  const st = cur(), q = quiz(st.id), el = elapsed();
  if (el >= DUR) { fail(); return }
  const left = Math.ceil(DUR - el), clock = $('#clock'); if (!clock) return;
  clock.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  const p = $('#prog'); p.setAttribute('stroke-dashoffset', String(263.9 * el / DUR)); p.classList.toggle('late', el >= H3);
  const lv = el >= H3 ? 3 : el >= H2 ? 2 : el >= H1 ? 1 : 0;
  const ded = st.fx.dedaleUntil > Date.now();
  if (ded) { const d = $('#dedcd'); if (d) d.textContent = Math.ceil((st.fx.dedaleUntil - Date.now()) / 1000) }
  if (lastDed !== null && lastDed !== ded) { lastDed = ded; render(); return }
  lastDed = ded;
  if (lastLv !== lv || force) {
    if (lastLv !== null && lv > lastLv) buzz([80]); lastLv = lv;
    const hasVid = q.video && VID[q.video];
    const h = [];
    if (st.fx.apollon) h.push(`<p class="hint"><b>Faveur d'Apollon · Lieu</b><br>${esc(q.salle)}</p>`);
    else if (lv >= 1) h.push(st.fx.noSalle ? `<p class="hint cursed"><b>Brouillard des Enfers</b><br>L'indice de salle a disparu dans la brume.</p>` : `<p class="hint"><b>Indice 1 · Lieu</b><br>${esc(q.salle)}</p>`);
    if (lv >= 1 && hasVid && !ded) h.push(`<p class="hint"><b>Indice · L'énigme</b><br>« ${esc(q.enigme)} »</p>`);
    if (lv >= 2) h.push(`<p class="hint"><b>Indice 2 · L'œuvre</b><br>${esc(q.indice)}</p>`);
    if (lv >= 3 && st.fx.noJoker) h.push(`<p class="hint cursed"><b>Supplice de Tantale</b><br>Le joker est hors d'atteinte : tapez votre réponse.</p>`);
    $('#hints').innerHTML = h.join('');
    const j = $('#joker'); if (j) j.hidden = lv < 3 || st.fx.noJoker;
    document.querySelectorAll('.opt').forEach(b => { b.disabled = st.qwrong.includes(st.opts[+b.dataset.k]) });
    const tr = $('#tries'); if (tr) tr.textContent = st.wrong.length ? `Refusé : ${st.wrong.map(w => '« ' + w + ' »').join(', ')}` : '';
  }
  const pts = Math.max(1, cap(el) - 2 * nErr(st));
  $('#steps').innerHTML = [['0:00', 'Énigme', 0, ded], [st.fx.apollon ? 'Apollon' : '1:30', 'Lieu', st.fx.apollon ? 0 : H1, st.fx.noSalle && !st.fx.apollon], ['3:00', 'Œuvre', H2, false], ['4:30', 'Joker', H3, st.fx.noJoker]].map(([t, l, v, x]) => `<span class="${el >= v ? 'on' : ''} ${x ? 'x' : ''}"><i></i>${t} · ${l}</span>`).join('') + `<span class="stake">En jeu : ${pts} sesterces</span>`;
  const lk = $('#lock'), rem = Math.ceil((st.lockUntil - Date.now()) / 1000), locked = rem > 0;
  if (lk) { lk.hidden = !locked; if (locked) lk.textContent = `Mauvaise réponse ! Attendez ${rem} s avant de réessayer.` }
  const sd = $('#send'); if (sd) sd.disabled = locked;
  document.querySelectorAll('.opt').forEach(b => b.style.pointerEvents = locked ? 'none' : '');
}
function resHtml() {
  const st = cur(), q = quiz(st.id), ok = st.pts > 0, ph = PH[S.i];
  return `${topBar()}
<section class="verdict ${ok ? 'ok' : 'ko'}">
 <div class="big">${ok ? `Trésor trouvé · +${st.pts} gloire et +${st.pts} sesterces` : 'Temps écoulé'}</div>
 <p>${ok ? `En ${Math.floor(st.elapsed / 60)} min ${String(st.elapsed % 60).padStart(2, '0')} s${st.via === 'joker' ? ', grâce au joker' : ''}${nErr(st) ? `, après ${nErr(st)} erreur${nErr(st) > 1 ? 's' : ''}` : ''}.` : 'L\'œuvre vous a échappé cette fois.'}</p>
 <p><b>Réponse :</b> ${esc(q.bonne)}</p>
</section>
<section class="card">
 ${ph ? `<img class="photo" src="${ph}" alt="Votre photo de l'œuvre">` : ''}
 <div class="eyebrow">${esc(q.salle)} · inv. ${esc(q.inv)}</div>
 <h2>${esc(q.titre)}</h2>
 <p>${esc(q.expl)}</p>
 <a href="${esc(q.url)}" target="_blank" rel="noopener" class="link">Fiche du musée ↗</a>
</section>
<button class="btn" id="next">${S.i + 1 < N ? 'Énigme suivante' : 'Terminer la chasse'}</button>`;
}
function endHtml() {
  const gs = (B.groups || []).slice().sort((a, b) => (b.gloire || 0) - (a.gloire || 0) || b.found - a.found);
  const rank = gs.findIndex(g => g.gid === S.gid) + 1;
  const gave = S.log.filter(l => l.kind === 'gave').length;
  const sent = S.log.filter(l => l.kind === 'sent').length, recv = S.log.filter(l => ['recv', 'blocked', 'reflect'].includes(l.kind)).length;
  return `
<section class="card">
 <div class="eyebrow">${esc(S.name)}</div>
 <div class="big-n">${S.found}<span style="font-size:22px"> trésor${S.found > 1 ? 's' : ''} sur ${N + 1}</span></div>
 <p><b>${S.gloire || 0}</b> gloire · <b>${S.sesterces}</b> sesterces en poche · ${sent} malédiction${sent > 1 ? 's' : ''} lancée${sent > 1 ? 's' : ''} · ${recv} reçue${recv > 1 ? 's' : ''} · ${gave} bienfait${gave > 1 ? 's' : ''} offert${gave > 1 ? 's' : ''}</p>
 ${rank ? `<div class="titre">${rank === 1 ? 'Imperator' : rank === 2 ? 'Legatus' : rank === 3 ? 'Centurio' : 'Miles'}</div><p class="muted">${rank}${rank === 1 ? 'er' : 'e'} sur ${gs.length} groupes pour l'instant.</p>` : ''}
</section>
<section class="card"><h2>Classement</h2><div class="scroll"><table><thead><tr><th>#</th><th>Groupe</th><th class="n">Gloire</th><th class="n">Trésors</th></tr></thead><tbody>
 ${gs.map((g, i) => `<tr${g.gid === S.gid ? ' style="font-weight:700"' : ''}><td>${i + 1}</td><td>${esc(g.name)}${g.done ? '' : ' <span class="muted small">(en cours)</span>'}</td><td class="n"><b>${g.gloire || 0}</b></td><td class="n">${g.found}</td></tr>`).join('')}
 </tbody></table></div></section>
<section class="card"><h2>Votre butin</h2>
 <div class="loot">${S.qs.map((st, i) => { const q = quiz(st.id); return `<figure>${PH[i] ? `<img src="${PH[i]}" alt="${esc(q.titre)}">` : `<div class="nophoto">Pas de photo</div>`}<figcaption><span>${esc(q.titre)}</span><b>${st.pts ? '+' + st.pts : '—'}</b></figcaption></figure>` }).join('')}${S.fin && S.fin.sent ? `<figure>${PH[N] ? `<img src="${PH[N]}" alt="${esc(FINALE.titre)}">` : `<div class="nophoto">Pas de photo</div>`}<figcaption><span>Finale : ${esc(FINALE.titre)}</span><b>+${S.fin.score + FINALE.ptsTexte}</b></figcaption></figure>` : ''}</div>
</section>
<section class="card"><h2>Chronique des malédictions et bienfaits</h2>
 ${S.log.length ? `<div class="feed">${S.log.slice().reverse().map(l => `<div><span class="muted small">${new Date(l.t).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}</span> ${esc(l.text)}</div>`).join('')}</div>` : '<p class="muted">Aucune malédiction. Une chasse bien paisible !</p>'}
</section>
<button class="btn ghost" id="reset">Quitter cette partie</button>`;
}
function bind() {
  const go = $('#go');
  if (go) {
    const upd = () => { go.disabled = !($('#code').value.trim() && $('#g').value.trim() && $('#p1').value.trim() && $('#p2').value.trim()) };
    ['code', 'g', 'p1', 'p2', 'p3', 'p4'].forEach(i => $('#' + i).addEventListener('input', upd)); upd();
    go.onclick = async () => { go.disabled = true; go.textContent = 'Connexion…'; const e = $('#jerr');
      try { await join($('#code').value.trim().toUpperCase(), $('#g').value.trim(), [$('#p1').value.trim(), $('#p2').value.trim(), $('#p3').value.trim(), $('#p4').value.trim()].filter(Boolean)) }
      catch (err) { e.hidden = false; e.textContent = err.message; go.disabled = false; go.textContent = 'Entrer dans la partie' } };
  }
  const on = (id, f) => { const el = $('#' + id); if (el) el.onclick = f };
  on('tbtn', openTemple); on('begin', begin); on('shoot', takePhoto); on('retake', takePhoto); on('send', submitFree); on('next', next);
  on('replay', () => { const v = $('#qvid'); if (v) { v.currentTime = 0; v.play() } });
  const np = $('#nophoto'); if (np) np.onclick = () => noPhoto(np);
  const ans = $('#ans'); if (ans) ans.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submitFree() } });
  const opts = $('#opts'); if (opts) opts.addEventListener('click', e => { const b = e.target.closest('.opt'); if (b && !b.disabled) pickOpt(cur().opts[+b.dataset.k]) });
  const rs = $('#reset'); if (rs) rs.onclick = () => { if (!rs.dataset.c) { rs.dataset.c = '1'; rs.textContent = 'Confirmer : quitter et effacer cette partie'; return } for (let i = 0; i < N; i++) ls(KEY + '-ph-' + i, null); S = { screen: 'join' }; B = { groups: [], ok: true }; save(); render() };
  const v = $('#qvid'); if (v) v.addEventListener('ended', () => v.classList.add('mini'));
}

setInterval(() => { if (S.screen === 'q') updateQ(false); tickOverlay() }, 500);
setInterval(() => { const it = S.queue && S.queue[0]; if (it && it.kind === 'scene' && it.phase === 'play' && !$('#ov').hidden) tickScene(it, scene(it.scene) || SCENES[0]) }, 100);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { sync(); if (S.screen === 'q') updateQ(true) } });
render(); showOverlay(); sync();
})();
