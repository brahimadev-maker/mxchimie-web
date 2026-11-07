// Mesure d'audience anonyme : un identifiant aléatoire par navigateur, aucune donnée personnelle.
import { insertEvent } from "./supabase";

export type EventType = "page_vue" | "clic_cta" | "contact_envoye";

function uuid() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function stored(storage: () => Storage, key: string) {
  try {
    const s = storage();
    let v = s.getItem(key);
    if (!v) {
      v = uuid();
      s.setItem(key, v);
    }
    return v;
  } catch {
    return uuid();
  }
}

function device() {
  const w = Math.min(window.screen.width, window.innerWidth);
  if (/iPad|Tablet/i.test(navigator.userAgent) || (w >= 600 && w < 1024 && matchMedia("(pointer: coarse)").matches)) return "tablette";
  return w < 600 ? "mobile" : "ordinateur";
}

function source() {
  const utm = new URLSearchParams(location.search).get("utm_source");
  if (utm) return utm.slice(0, 200);
  try {
    const ref = document.referrer && new URL(document.referrer);
    if (ref && ref.host !== location.host) return ref.host.replace(/^www\./, "");
  } catch {}
  return null;
}

export function track(type: EventType, detail?: string) {
  if (typeof window === "undefined" || location.pathname.startsWith("/administrateur")) return;
  insertEvent({
    visiteur: stored(() => localStorage, "mx_v"),
    session: stored(() => sessionStorage, "mx_s"),
    type,
    page: location.pathname.slice(0, 300),
    source: type === "page_vue" ? source() : null,
    appareil: device(),
    detail: detail ? detail.slice(0, 120) : null,
  });
}
