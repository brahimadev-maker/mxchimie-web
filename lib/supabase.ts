// Projet Supabase "mx-chimie". La clé publishable est publique par conception :
// la sécurité repose sur les règles RLS et sur les fonctions qui exigent un jeton.
export const SUPABASE_URL = "https://iofrhivqpdvktielmnzf.supabase.co";
export const SUPABASE_KEY = "sb_publishable_6-z_O9vMNC-HnK8Tz2ZE8A_J9HGnrao";

const headers = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };

export class RpcError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

/** Appelle une fonction SQL exposée par l'API (POST /rest/v1/rpc/nom). */
export async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers,
    body: JSON.stringify(args),
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const missing = body?.code === "PGRST202";
    throw new RpcError(
      missing ? "Cette fonction n'est pas encore installée dans Supabase (voir supabase/administrateur-suppression.sql)." : body?.message || `Erreur ${res.status}`,
      res.status,
      body?.code,
    );
  }
  return body as T;
}

/** Enregistre un événement de visite (fire-and-forget, n'échoue jamais). */
export function insertEvent(event: Record<string, unknown>) {
  try {
    fetch(`${SUPABASE_URL}/rest/v1/evenements`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify(event),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}
