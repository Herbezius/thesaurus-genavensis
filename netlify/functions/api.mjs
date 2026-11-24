// API du jeu Thesaurus Genavensis : parties, groupes, synchronisation, malédictions, actions enseignant.
import { store } from "../lib/store.mjs";

const CURSES = ["meduse", "sphinx", "dedale", "brouillard", "tantale", "pandore"];
const MAX_GROUPS = 8;
const ONLINE_MS = 20000;
const FIRST_MINUTE_MS = 60000;
const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const fail = (msg, status = 400) => json({ error: msg }, status);
const rand = (n, a = ALPHA) => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => a[b % a.length]).join("");
const tid = () => Date.now().toString(36).padStart(9, "0") + "-" + rand(4, "abcdefghijkmnpqrstuvwxyz23456789");
const clean = (s, n) => String(s ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, n);
const K = code => ({
  meta: `g/${code}/meta`,
  grp: gid => `g/${code}/grp/${gid}`,
  grpPrefix: `g/${code}/grp/`,
  lt: gid => `g/${code}/lt/${gid}`,
  imm: gid => `g/${code}/imm/${gid}`,
  curse: (target, id) => `g/${code}/c/${target}/${id}`,
  cursePrefix: target => `g/${code}/c/${target ? target + "/" : ""}`,
  adj: (gid, id) => `g/${code}/adj/${gid}/${id}`,
  adjPrefix: gid => `g/${code}/adj/${gid}/`,
  all: `g/${code}/`,
});

async function getAll(s, prefix, filter) {
  const { blobs } = await s.list({ prefix });
  const keys = blobs.map(b => b.key).filter(k => !filter || filter(k));
  const vals = await Promise.all(keys.map(k => s.get(k)));
  return vals.map((v, i) => v && { ...v, _key: keys[i] }).filter(Boolean);
}
function publicGroup(g, now) {
  return { gid: g.gid, name: g.name, players: g.players, idx: g.idx, total: g.total, found: g.found, sesterces: g.sesterces,
    status: g.status, done: !!g.done, online: now - (g.updated || 0) < ONLINE_MS, protections: g.protections || {} };
}
function publicMeta(m) { return { code: m.code, cursesOn: m.cursesOn, disabled: m.disabled || [], ended: !!m.ended, total: m.total }; }

async function loadGame(s, code) {
  code = clean(code, 8).toUpperCase();
  if (!code) return [null, code];
  return [await s.get(K(code).meta), code];
}
async function auth(s, body) {
  const [meta, code] = await loadGame(s, body.code);
  if (!meta) return [null, fail("Partie introuvable. Vérifiez le code.", 404)];
  const g = await s.get(K(code).grp(clean(body.gid, 20)));
  if (!g || g.token !== body.token) return [null, fail("Groupe inconnu dans cette partie.", 403)];
  return [{ meta, code, g }, null];
}
async function authProf(s, body) {
  const [meta, code] = await loadGame(s, body.code);
  if (!meta) return [null, fail("Partie introuvable.", 404)];
  if (meta.profToken !== body.profToken) return [null, fail("Accès enseignant refusé.", 403)];
  return [{ meta, code }, null];
}

const routes = {
  async "game/create"(s, b) {
    const pass = process.env.PROF_PASSWORD || "SPQR";
    if (clean(b.password, 60).toUpperCase() !== pass.toUpperCase()) return fail("Mot de passe incorrect.", 403);
    let code;
    for (let i = 0; i < 10; i++) { code = rand(4); if (!(await s.get(K(code).meta))) break; }
    const meta = { code, created: Date.now(), cursesOn: true, disabled: [], ended: false, total: 8, profToken: rand(24) };
    await s.setJSON(K(code).meta, meta);
    return json({ code, profToken: meta.profToken, meta: publicMeta(meta) });
  },

  async "game/join"(s, b) {
    const [meta, code] = await loadGame(s, b.code);
    if (!meta) return fail("Partie introuvable. Vérifiez le code donné par votre enseignant·e.", 404);
    if (meta.ended) return fail("Cette partie est terminée.");
    const name = clean(b.name, 30);
    const players = (Array.isArray(b.players) ? b.players : []).map(p => clean(p, 20)).filter(Boolean).slice(0, 3);
    if (!name) return fail("Donnez un nom à votre groupe.");
    if (players.length < 2) return fail("Indiquez au moins deux joueurs.");
    const groups = await getAll(s, K(code).grpPrefix);
    if (groups.some(g => g.name.toLowerCase() === name.toLowerCase())) return fail("Ce nom de groupe est déjà pris dans la partie.");
    if (groups.length >= MAX_GROUPS) return fail(`La partie est complète (${MAX_GROUPS} groupes au maximum).`);
    const g = { gid: rand(6), token: rand(24), name, players, idx: 0, total: meta.total, found: 0, sesterces: 10, status: "ready",
      qStart: null, done: false, protections: { egide: 0, miroir: 0 }, created: Date.now(), updated: Date.now() };
    await s.setJSON(K(code).grp(g.gid), g);
    return json({ gid: g.gid, token: g.token, code, meta: publicMeta(meta) });
  },

  async sync(s, b) {
    const [ctx, err] = await auth(s, b); if (err) return err;
    const { meta, code, g } = ctx, k = K(code), now = Date.now(), st = b.state || {};
    const num = (v, d, max) => Number.isFinite(+v) ? Math.max(0, Math.min(max, Math.round(+v))) : d;
    Object.assign(g, {
      idx: num(st.idx, g.idx, meta.total), found: num(st.found, g.found, meta.total), sesterces: num(st.sesterces, g.sesterces, 9999),
      status: ["ready", "q", "res", "end"].includes(st.status) ? st.status : g.status,
      qStart: st.status === "q" ? num(st.qStart, now, now + 60000) : null, done: !!st.done,
      protections: { egide: num(st.protections?.egide, 0, 1), miroir: num(st.protections?.miroir, 0, 1) },
      log: Array.isArray(st.log) ? st.log.slice(-40) : g.log, updated: now,
    });
    await s.setJSON(k.grp(g.gid), g);
    const since = clean(b.since, 40);
    const [groups, inbox, adj] = await Promise.all([
      getAll(s, k.grpPrefix),
      getAll(s, k.cursePrefix(g.gid), key => key.split("/").pop() > since),
      getAll(s, k.adjPrefix(g.gid)),
    ]);
    return json({ meta: publicMeta(meta), now, groups: groups.map(x => publicGroup(x, now)),
      inbox: inbox.map(({ _key, ...c }) => c).sort((a, b) => a.id < b.id ? -1 : 1),
      adj: adj.map(({ _key, ...a }) => a) });
  },

  async curse(s, b) {
    const [ctx, err] = await auth(s, b); if (err) return err;
    const { meta, code, g } = ctx, k = K(code), now = Date.now();
    if (meta.ended) return fail("La partie est terminée.");
    const type = clean(b.type, 20), targetId = clean(b.target, 20);
    const target = await s.get(k.grp(targetId));
    if (!target) return fail("Ce groupe n'existe pas.");
    const base = { id: tid(), from: g.gid, fromName: g.name, to: target.gid, toName: target.name, ts: now };

    if (type === "note") {
      const c = { ...base, type: "note", text: clean(b.text, 160) };
      await s.setJSON(k.curse(target.gid, c.id), c);
      return json({ ok: true, curse: c });
    }
    if (!CURSES.includes(type)) return fail("Malédiction inconnue.");
    if (b.reflect) {
      const c = { ...base, type, reflected: true };
      await s.setJSON(k.curse(target.gid, c.id), c);
      return json({ ok: true, curse: c });
    }
    if (!meta.cursesOn) return fail("Les malédictions sont suspendues par votre enseignant·e.");
    if ((meta.disabled || []).includes(type)) return fail("Cette malédiction est désactivée pour cette partie.");
    if (target.gid === g.gid) return fail("On ne se maudit pas soi-même !");
    if (target.done) return fail(`${target.name} a déjà terminé la chasse.`);
    const lt = await s.get(k.lt(g.gid));
    if (lt && lt.target === target.gid) return fail(`Vous avez maudit ${target.name} en dernier : choisissez une autre cible.`);
    const imm = await s.get(k.imm(target.gid));
    if (imm && target.idx <= imm.through) return fail(`${target.name} est protégé par les dieux jusqu'à la fin de son énigme n° ${imm.through + 1}.`);
    if (target.status === "q" && target.qStart && now - target.qStart < FIRST_MINUTE_MS) {
      const wait = Math.ceil((FIRST_MINUTE_MS - (now - target.qStart)) / 1000);
      return fail(`${target.name} vient de commencer son énigme : patientez encore ${wait} s.`);
    }
    const c = { ...base, type };
    await Promise.all([
      s.setJSON(k.curse(target.gid, c.id), c),
      s.setJSON(k.lt(g.gid), { target: target.gid, ts: now }),
      s.setJSON(k.imm(target.gid), { through: ["q", "res"].includes(target.status) ? target.idx + 1 : target.idx, ts: now }),
    ]);
    return json({ ok: true, curse: c });
  },

  async "prof/board"(s, b) {
    const [ctx, err] = await authProf(s, b); if (err) return err;
    const { meta, code } = ctx, k = K(code), now = Date.now();
    const [groups, curses, adj] = await Promise.all([getAll(s, k.grpPrefix), getAll(s, k.cursePrefix()), getAll(s, `g/${code}/adj/`)]);
    return json({ meta: publicMeta(meta), now,
      groups: groups.map(g => ({ ...publicGroup(g, now), log: g.log || [] })),
      curses: curses.map(({ _key, ...c }) => c).sort((a, b) => a.id < b.id ? 1 : -1).slice(0, 80),
      adj: adj.map(({ _key, ...a }) => a) });
  },

  async "prof/settings"(s, b) {
    const [ctx, err] = await authProf(s, b); if (err) return err;
    const { meta, code } = ctx;
    if (typeof b.cursesOn === "boolean") meta.cursesOn = b.cursesOn;
    if (Array.isArray(b.disabled)) meta.disabled = b.disabled.filter(t => CURSES.includes(t) || t === "miroir");
    await s.setJSON(K(code).meta, meta);
    return json({ ok: true, meta: publicMeta(meta) });
  },

  async "prof/adjust"(s, b) {
    const [ctx, err] = await authProf(s, b); if (err) return err;
    const { code } = ctx;
    const g = await s.get(K(code).grp(clean(b.gid, 20)));
    if (!g) return fail("Groupe introuvable.");
    const amount = Math.max(-100, Math.min(100, Math.round(+b.amount || 0)));
    if (!amount) return fail("Montant invalide.");
    const a = { id: tid(), gid: g.gid, amount, reason: clean(b.reason, 80) || (amount < 0 ? "Pénalité de l'enseignant·e" : "Bonus de l'enseignant·e"), ts: Date.now() };
    await s.setJSON(K(code).adj(g.gid, a.id), a);
    return json({ ok: true, adj: a });
  },

  async "prof/end"(s, b) {
    const [ctx, err] = await authProf(s, b); if (err) return err;
    const { code } = ctx;
    const { blobs } = await s.list({ prefix: K(code).all });
    await Promise.all(blobs.map(x => s.delete(x.key)));
    return json({ ok: true, deleted: blobs.length });
  },
};

export default async (req) => {
  if (req.method !== "POST") return fail("Méthode non autorisée.", 405);
  const route = new URL(req.url).pathname.replace(/^\/api\//, "").replace(/\/$/, "");
  const handler = routes[route];
  if (!handler) return fail("Route inconnue.", 404);
  let body;
  try { body = await req.json(); } catch { return fail("Requête illisible."); }
  try { return await handler(store(), body || {}); }
  catch (e) { console.error(route, e); return fail("Erreur du serveur, réessayez.", 500); }
};

export const config = { path: "/api/*" };
export { routes as _routes };
