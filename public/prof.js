/* Thesaurus Genavensis — tableau de bord enseignant */
(() => {
const { QUIZ, CURSES, BOONS, PROTECTIONS, SCENES } = window.TG;
const ZSEL = {}, ZMOT = {};
const MOTIFS_MAL = ['On ne court pas au musée', 'On ne crie pas', 'On ne dérange pas les autres visiteurs', 'On ne touche pas les œuvres', 'On reste groupés', 'Téléphone utilisé hors du jeu'];
const MOTIFS_BIEN = ['Bravo pour votre calme', 'Belle entraide', 'Excellente observation', 'Groupe exemplaire'];
const mmss = ms => { const t = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}` };
const ZONES = ['cour', '113', '114', '115', '0203', '408'];
const ZLAB = { cour: 'Cour lapidaire (107-109)', '113': 'Salle 113', '114': 'Salle 114', '115': 'Salle 115', '0203': 'Salle 0203 (niveau inférieur)', '408': 'Salle 408 (beaux-arts)' };
const PKEY = 'thesaurus-prof-v1', RKEY = 'thesaurus-reperage-v2';
const STOP = new Set(['le','la','les','l','un','une','des','de','du','d','au','aux','sa','son','ses','par','en','avec','et','c','est','il','elle','tient','a','sur','dans']);
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); return true } catch (e) { return v === undefined ? null : false } }
async function api(route, body) {
  const r = await fetch('/api/' + route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  let d = {}; try { d = await r.json() } catch (e) {}
  if (!r.ok) { const e = new Error(d.error || 'Erreur réseau'); e.status = r.status; throw e } return d;
}
let toastT; function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 4000) }
const hm = t => new Date(t).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

let P = ls(PKEY), BD = null, TAB = 'live', err = '';
const auth = () => ({ code: P.code, profToken: P.profToken });
const joinUrl = () => `${location.origin}/?code=${P.code}`;

/* ---- correction (même logique que le jeu) ---- */
function toks(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’'`-]/g, ' ').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(t => t && !STOP.has(t)).map(t => t.length > 3 && /[sx]$/.test(t) && !/^[ivxlc]+$/.test(t) ? t.slice(0, -1) : t) }
function lev(a, b) { const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n] }
function near(a, b) { if (a === b) return true; if (/^\d+$/.test(a) || /^\d+$/.test(b) || /^[ivxlc]+$/.test(b)) return false; const L = Math.max(a.length, b.length); return L >= 7 ? lev(a, b) <= 2 : L >= 4 ? lev(a, b) <= 1 : false }
function check(input, q) { const t = toks(input); if (!t.length) return false; const accT = q.acc.map(toks), accWords = new Set(accT.flat()); const bad = new Set(q.fausses.flatMap(toks).filter(w => !accWords.has(w))); if (t.some(w => [...bad].some(b => near(w, b)))) return false; if (t.length > 3) return false; if (accT.some(a => a.join(' ') === t.join(' '))) return true; return accT.filter(a => a.length === 1).some(a => t.some(w => near(w, a[0]))) }

/* ---- écrans ---- */
function render() {
  const a = $('#app');
  if (!P) { a.innerHTML = loginHtml(); bindLogin(); return }
  a.innerHTML = `
<header class="top"><div><div class="eyebrow">Espace enseignant</div><h1>Thesaurus Genavensis</h1></div>
 <div class="tabs" role="group" aria-label="Rubriques">${[['live', 'Olympe'], ['rep', 'Repérage'], ['sol', 'Solutions']].map(([k, l]) => `<button data-t="${k}" aria-pressed="${TAB === k}">${l}</button>`).join('')}<a class="btn ghost" href="apercu.html" target="_blank" rel="noopener" style="text-decoration:none">Scènes de la Colère ↗</a></div></header>
<div id="tab"></div>`;
  a.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { TAB = b.dataset.t; render() });
  if (TAB === 'live') drawLive(); else if (TAB === 'rep') drawRep(); else drawSol();
}
function loginHtml() { return `
<header><div class="eyebrow">Espace enseignant</div><h1>Thesaurus Genavensis</h1></header>
<section class="card" style="max-width:520px">
 <h2>Nouvelle partie</h2>
 <label for="pw">Mot de passe enseignant<input type="password" id="pw" autocomplete="current-password"></label>
 <button class="btn" id="create">Créer la partie</button>
 <p class="err" id="lerr" hidden></p>
 <p class="small muted">Un code de partie est créé. Les groupes (2 à 4 joueurs) le tapent sur leur téléphone (ou scannent le QR code) pour rejoindre la chasse.</p>
</section>
<section class="card" style="max-width:520px">
 <h2>Reprendre une partie</h2>
 <p class="small muted">Sur un autre appareil : saisissez le code de la partie et la clé enseignant affichée sous le QR code.</p>
 <label for="rc">Code de la partie<input type="text" id="rc" style="font-family:var(--mono);text-transform:uppercase"></label>
 <label for="rk">Clé enseignant<input type="text" id="rk" style="font-family:var(--mono)"></label>
 <button class="btn ghost" id="resume">Reprendre</button>
</section>` }
function bindLogin() {
  const go = async () => { const e = $('#lerr'); try { const r = await api('game/create', { password: $('#pw').value }); P = { code: r.code, profToken: r.profToken }; ls(PKEY, P); render(); poll() } catch (x) { e.hidden = false; e.textContent = x.message } };
  $('#create').onclick = go; $('#pw').addEventListener('keydown', e => { if (e.key === 'Enter') go() });
  $('#resume').onclick = async () => { P = { code: $('#rc').value.trim().toUpperCase(), profToken: $('#rk').value.trim() }; try { BD = await api('prof/board', auth()); ls(PKEY, P); render() } catch (x) { P = null; toast(x.message) } };
}

function drawLive() {
  const t = $('#tab');
  t.innerHTML = `
<div class="grid2">
 <section class="card">
  <div class="eyebrow">Code de la partie</div>
  <div class="code">${esc(P.code)}</div>
  <div class="row"><div class="qr" id="qr"></div><div style="display:grid;gap:6px;min-width:0"><p class="small">Les élèves ouvrent :</p><p style="font-family:var(--mono);font-size:14px;overflow-wrap:anywhere">${esc(joinUrl())}</p><button class="btn ghost sm" id="copy">Copier le lien</button></div></div>
  <p class="small muted">Clé enseignant (pour reprendre sur un autre appareil) : <span style="font-family:var(--mono)">${esc(P.profToken)}</span></p>
 </section>
 <section class="card" id="settings"></section>
</div>
<section class="card" id="startbox"></section>
<section style="display:grid;gap:10px"><div class="top"><h2>L'Olympe · vue de Zeus</h2><span class="small muted" id="upd"></span></div>
 <p class="small muted">Chaque carte montre où en est le groupe. Le menu de Zeus envoie une malédiction (elle ignore les protections et les règles), un bienfait ou des sesterces.</p>
 <div class="olympe" id="groups"><p class="muted">Chargement…</p></div></section>
<section class="card"><h2>Malédictions et bienfaits en direct</h2><div class="feed" id="feed"></div></section>
<section class="card"><h2>Fin de partie</h2>
 <p class="small muted">Efface toutes les données de la partie (groupes, scores, malédictions). Les téléphones des élèves affichent alors « partie fermée ». Sans action de votre part, tout est effacé automatiquement après 48 heures.</p>
 <button class="btn ghost" id="end">Terminer et effacer la partie</button></section>`;
  try { new QRCode($('#qr'), { text: joinUrl(), width: 132, height: 132 }) } catch (e) { $('#qr').hidden = true }
  $('#copy').onclick = () => { navigator.clipboard.writeText(joinUrl()).then(() => toast('Lien copié.'), () => toast('Copie impossible : recopiez le lien.')) };
  $('#end').onclick = async e => { const b = e.currentTarget; if (!b.dataset.c) { b.dataset.c = '1'; b.textContent = 'Confirmer : tout effacer maintenant'; return } try { await api('prof/end', auth()) } catch (x) {} ls(PKEY, null); P = null; BD = null; render() };
  fillLive();
}
function fillLive() {
  if (TAB !== 'live' || !P || !$('#groups')) return;
  if (!BD) return;
  $('#upd').textContent = 'Mis à jour à ' + hm(BD.now);
  const m = BD.meta;
  const sb = $('#startbox');
  sb.innerHTML = m.started ? `<div class="top"><h2>Partie lancée</h2><span class="pill v">depuis ${mmss(BD.now - (m.startedAt || BD.now))}</span></div>`
    : `<h2>Départ</h2><p>${BD.groups.length} groupe${BD.groups.length > 1 ? 's' : ''} connecté${BD.groups.length > 1 ? 's' : ''}. Les élèves voient « Démarrer l'aventure » grisé tant que vous n'avez pas donné le départ.</p><button class="btn gold" id="start" ${BD.groups.length ? '' : 'disabled'}>Donner le départ</button>`;
  const stb = $('#start'); if (stb) stb.onclick = async () => { stb.disabled = true; try { const r = await api('prof/start', auth()); BD.meta = r.meta; toast('Départ donné !'); fillLive() } catch (x) { toast(x.message); stb.disabled = false } };
  const st = $('#settings');
  if (!st.contains(document.activeElement)) {
    st.innerHTML = `<h2>Réglages</h2>
   <label class="switch"><input type="checkbox" id="con" ${m.cursesOn ? 'checked' : ''}> Malédictions entre groupes</label>
   <label class="switch"><input type="checkbox" id="bon" ${m.boonsOn ? 'checked' : ''}> Bienfaits entre groupes</label>
   <p class="small muted">Désactiver certaines malédictions ou le Miroir :</p>
   <div style="display:grid;gap:6px">${[...Object.entries(CURSES).map(([k, c]) => [k, c.nom]), ['miroir', 'Miroir de Persée (protection)']].map(([k, n]) => `<label class="switch"><input type="checkbox" data-d="${k}" ${m.disabled.includes(k) ? '' : 'checked'}> ${esc(n)}</label>`).join('')}</div>`;
    $('#con').onchange = e => setSettings({ cursesOn: e.target.checked });
    $('#bon').onchange = e => setSettings({ boonsOn: e.target.checked });
    st.querySelectorAll('[data-d]').forEach(c => c.onchange = () => setSettings({ disabled: [...st.querySelectorAll('[data-d]')].filter(x => !x.checked).map(x => x.dataset.d) }));
  }
  const gs = BD.groups.slice().sort((a, b) => b.found - a.found || b.sesterces - a.sesterces);
  const box = $('#groups');
  if (!box.contains(document.activeElement)) {
    const zeusOpts = `<option value="">Action de Zeus…</option>
      <optgroup label="Foudre (malédiction)">${Object.entries(CURSES).map(([k, c]) => `<option value="curse:${k}">${esc(c.nom)}${k === 'colere' ? ' (au hasard)' : ''}</option>`).join('')}</optgroup>
      <optgroup label="Colère des dieux : scène précise">${SCENES.filter(x => x.id !== 'meduse').map(x => `<option value="scene:${x.id}">${esc(x.nom)}</option>`).join('')}</optgroup>
      <optgroup label="Bienfait">${['don5', 'don10', 'egide', 'apollon'].map(k => `<option value="boon:${k}">${esc(BOONS[k].nom)}</option>`).join('')}<option value="boon:miroir">${esc(PROTECTIONS.miroir.nom)}</option></optgroup>
      <optgroup label="Sesterces">${[5, 10, -5, -10].map(n => `<option value="adj:${n}">${n > 0 ? '+' : '−'}${Math.abs(n)} sesterces</option>`).join('')}</optgroup>`;
    const motifOpts = `<option value="">Sans motif</option><optgroup label="Rappel à l'ordre">${MOTIFS_MAL.map(m => `<option>${esc(m)}</option>`).join('')}</optgroup><optgroup label="Félicitations">${MOTIFS_BIEN.map(m => `<option>${esc(m)}</option>`).join('')}</optgroup>`;
    const label = { ready: 'Entre deux énigmes', q: 'En recherche', res: 'Vient de répondre', end: 'Terminé' };
    box.innerHTML = gs.length ? gs.map((g, i) => { const q = QUIZ.find(x => x.id === g.qid);
      const prot = [g.protections.egide ? 'Égide' : '', g.protections.miroir ? 'Miroir' : ''].filter(Boolean).join(' · ');
      const pend = (g.pending || []).map(k => CURSES[k] ? CURSES[k].nom : k === 'apollon' ? 'Faveur d\'Apollon' : k).join(', ');
      return `<article class="gcard ${g.online || g.done ? '' : 'off'} ${g.done ? 'done' : ''}">
       <div class="hd"><b>${i + 1}. ${esc(g.name)}</b><span class="dot ${g.online || g.done ? '' : 'off'}" title="${g.online ? 'en ligne' : 'hors ligne'}"></span></div>
       <div class="small muted">${g.players.map(esc).join(', ')}${g.online || g.done ? '' : ' · <span class="err">hors ligne</span>'}</div>
       <div class="stats"><span><b>${g.found}</b> trésors</span><span><b>${g.sesterces}</b> S</span><span>${g.done ? 'Fini' : `Énigme <b>${Math.min(g.idx + 1, g.total)}</b>/${g.total}`}</span></div>
       ${g.done ? '' : `<div class="now">${label[g.status] || ''}${q ? ` · <b>${esc(q.titre)}</b> <span class="muted small">(${esc(q.salle)})</span>` : ''}${g.status === 'q' && g.qStart ? ` · depuis <span class="w">${mmss(BD.now - g.qStart)}</span>` : ''}</div>`}
       ${prot ? `<div class="small">Protégé : ${prot}</div>` : ''}${pend ? `<div class="small" style="color:var(--curse)">En attente : ${esc(pend)}</div>` : ''}
       <div class="zeus"><select data-z="${g.gid}" aria-label="Action de Zeus pour ${esc(g.name)}">${zeusOpts}</select></div>
       <div class="zeus"><select data-m="${g.gid}" aria-label="Motif pour ${esc(g.name)}">${motifOpts}</select><button class="btn sm" data-zgo="${g.gid}">Envoyer</button></div>
       ${g.log && g.log.length ? `<details><summary class="small">Journal du groupe</summary><div class="small">${g.log.slice().reverse().map(l => `<div>${hm(l.t)} · ${esc(l.text)}</div>`).join('')}</div></details>` : ''}
      </article>` }).join('') : '<p class="muted">Aucun groupe pour l\'instant. Donnez le code aux élèves.</p>';
    box.querySelectorAll('[data-z]').forEach(sel => { if (ZSEL[sel.dataset.z]) sel.value = ZSEL[sel.dataset.z]; sel.onchange = () => { ZSEL[sel.dataset.z] = sel.value } });
    box.querySelectorAll('[data-m]').forEach(sel => { if (ZMOT[sel.dataset.m]) sel.value = ZMOT[sel.dataset.m]; sel.onchange = () => { ZMOT[sel.dataset.m] = sel.value } });
    box.querySelectorAll('[data-zgo]').forEach(btn => btn.onclick = () => zeus(btn.dataset.zgo, box.querySelector(`[data-z="${btn.dataset.zgo}"]`).value, box.querySelector(`[data-m="${btn.dataset.zgo}"]`).value));
  }
  const nomOf = c => c.type === 'note' ? esc(c.text) : c.kind === 'boon' ? '<span style="color:var(--verd)">' + esc((BOONS[c.type] || PROTECTIONS[c.type] || {}).nom || c.type) + '</span>' : esc(CURSES[c.type]?.nom || c.type) + (c.scene ? ' : ' + esc((SCENES.find(x => x.id === c.scene) || {}).nom || c.scene) : '') + (c.reflected ? ' <span class="small" style="color:var(--curse)">(renvoyée par le Miroir)</span>' : '');
  $('#feed').innerHTML = BD.curses.length ? BD.curses.map(c => `<div><span class="muted small">${hm(c.ts)}</span> <b>${c.zeus ? 'Zeus' : esc(c.fromName)}</b> → <b>${esc(c.toName)}</b> : ${nomOf(c)}${c.reason ? ` <span class="small muted">(${esc(c.reason)})</span>` : ''}</div>`).join('') : '<p class="muted">Rien pour l\'instant.</p>';
}
async function zeus(gid, v, motif) {
  if (!v) { toast('Choisissez d\'abord une action.'); return }
  const [kind, type] = v.split(':'); const g = BD.groups.find(x => x.gid === gid);
  try {
    if (kind === 'adj') await api('prof/adjust', { ...auth(), gid, amount: +type, reason: (+type < 0 ? 'Colère de Zeus' : 'Générosité de Zeus') + (motif ? ' : ' + motif : '') });
    else if (kind === 'scene') await api('prof/zeus', { ...auth(), gid, kind: 'curse', type: 'colere', scene: type, reason: motif });
    else await api('prof/zeus', { ...auth(), gid, kind, type, reason: motif });
    toast(`Zeus a frappé : ${g ? g.name : ''}.`); ZSEL[gid] = ''; ZMOT[gid] = ''; poll();
  } catch (x) { toast(x.message) }
}
async function setSettings(b) { try { const r = await api('prof/settings', { ...auth(), ...b }); BD.meta = r.meta; toast('Réglages enregistrés.') } catch (x) { toast(x.message) } }
async function poll() {
  if (!P || TAB !== 'live') return;
  try { BD = await api('prof/board', auth()); fillLive() }
  catch (x) { if (x.status === 404 || x.status === 403) { toast('Partie introuvable : elle a peut-être été effacée.'); ls(PKEY, null); P = null; render() } }
}
setInterval(poll, 3000);

/* ---- repérage ---- */
let REP = ls(RKEY) || {};
function drawRep() {
  const v = Object.values(REP), ok = v.filter(x => x.s === 'ok').length, ko = v.filter(x => x.s === 'ko').length, gone = v.filter(x => x.s === 'gone').length;
  $('#tab').innerHTML = `<section class="card"><h2>Mode repérage</h2>
   <p class="small muted">Passez devant chaque œuvre, testez une réponse comme un élève, puis marquez la question. Les notes restent sur cet appareil. À la fin, copiez le rapport et collez-le dans la conversation avec Claude.</p>
   <p class="small"><b>${ok}</b> validées · <b>${ko}</b> à corriger · <b>${gone}</b> introuvables · <b>${QUIZ.length - ok - ko - gone}</b> à voir</p>
   <button class="btn gold" id="copyrep">Copier le rapport</button><textarea id="reptxt" hidden readonly></textarea></section>
  ${ZONES.map(z => `<section class="card"><div class="zone">${esc(ZLAB[z])}</div>${QUIZ.filter(q => q.zone === z).map(q => { const r = REP[q.id] || {}; return `
   <div class="rep" data-id="${q.id}"><div><b>${esc(q.titre)}</b> <span class="muted small">inv. ${esc(q.inv)}${q.video ? ' · énigme vidéo n° ' + q.video.match(/\d+/)[0] : ''}</span></div>
    <div class="small">${esc(q.question)}</div><div class="acc">Accepté : ${q.acc.map(esc).join(' · ')} — joker : ${esc(q.bonne)}</div>
    <input type="text" class="tst" placeholder="Tester une réponse" autocomplete="off"><span class="test small"></span>
    <div class="status">${[['ok', 'Validée'], ['ko', 'À corriger'], ['gone', 'Introuvable']].map(([s, l]) => `<button data-s="${s}" aria-pressed="${r.s === s}">${l}</button>`).join('')}</div>
    <textarea class="note" placeholder="Note : vraie réponse, détail, emplacement…">${esc(r.n || '')}</textarea></div>` }).join('')}</section>`).join('')}`;
  document.querySelectorAll('.rep').forEach(box => { const id = box.dataset.id, q = QUIZ.find(x => x.id === +id);
    box.querySelector('.tst').oninput = e => { const o = box.querySelector('.test'); if (!e.target.value.trim()) { o.textContent = ''; return } const y = check(e.target.value, q); o.textContent = y ? ' acceptée' : ' refusée'; o.className = 'test small ' + (y ? 'y' : 'n') };
    box.querySelectorAll('.status button').forEach(b => b.onclick = () => { REP[id] = REP[id] || {}; REP[id].s = REP[id].s === b.dataset.s ? null : b.dataset.s; ls(RKEY, REP); box.querySelectorAll('.status button').forEach(x => x.setAttribute('aria-pressed', x.dataset.s === REP[id].s)) });
    box.querySelector('.note').onchange = e => { REP[id] = REP[id] || {}; REP[id].n = e.target.value.trim(); ls(RKEY, REP) }; });
  $('#copyrep').onclick = () => { const L = ['Repérage Thesaurus Genavensis — ' + new Date().toLocaleDateString('fr-CH')];
    ZONES.forEach(z => QUIZ.filter(q => q.zone === z).forEach(q => { const r = REP[q.id]; if (!r || (!r.s && !r.n)) return; L.push(`[${{ ok: 'OK', ko: 'À CORRIGER', gone: 'INTROUVABLE' }[r.s] || 'NOTE'}] #${q.id} ${q.titre} (inv. ${q.inv}, ${q.salle})${r.n ? ' — ' + r.n : ''}`) }));
    const vus = new Set(Object.keys(REP).filter(k => REP[k].s)), rest = QUIZ.filter(q => !vus.has(String(q.id))); if (rest.length) L.push('Non vérifiées : ' + rest.map(q => '#' + q.id).join(', '));
    const txt = L.join('\n'), ta = $('#reptxt');
    navigator.clipboard.writeText(txt).then(() => toast('Rapport copié.'), () => { ta.hidden = false; ta.value = txt; ta.style.minHeight = '160px'; ta.select(); toast('Copiez le texte sélectionné.') }) };
}
function drawSol() {
  $('#tab').innerHTML = ZONES.map(z => `<section class="card"><div class="zone">${esc(ZLAB[z])}</div>${QUIZ.filter(q => q.zone === z).map(q => `<div class="rep"><div><b>${esc(q.titre)}</b> <span class="muted small">inv. ${esc(q.inv)}</span></div><div class="small">${esc(q.question)} → <b>${esc(q.bonne)}</b></div></div>`).join('')}</section>`).join('');
}
render(); if (P) poll();
})();
