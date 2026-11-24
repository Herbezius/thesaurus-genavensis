// Efface chaque jour les parties de plus de 48 heures.
import { store } from "../lib/store.mjs";

export default async () => {
  const s = store(), limit = Date.now() - 48 * 3600 * 1000;
  const { blobs } = await s.list({ prefix: "g/" });
  const metas = blobs.filter(b => b.key.endsWith("/meta"));
  let deleted = 0;
  for (const m of metas) {
    const meta = await s.get(m.key);
    if (meta && meta.created > limit) continue;
    const code = m.key.split("/")[1];
    const toDel = blobs.filter(b => b.key.startsWith(`g/${code}/`));
    await Promise.all(toDel.map(b => s.delete(b.key)));
    deleted += toDel.length;
  }
  console.log(`Nettoyage : ${deleted} entrées supprimées.`);
};

export const config = { schedule: "@daily" };
