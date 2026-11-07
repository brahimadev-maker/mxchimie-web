"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useReducer, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { rpc, RpcError } from "@/lib/supabase";
import { BarList, nf, VisitorsChart, type Jour } from "./charts";

// ---------- Types renvoyés par Supabase ----------
type Session = { jeton: string; identifiant: string; expire_le: string; defaut: boolean };
type Demande = { id: string; created_at: string; nom: string; email: string; structure: string; demandes: string[]; message: string | null };
type Vue = { created_at: string; page: string | null; source: string | null; appareil: string | null; visiteur: string };
type Tableau = {
  debut: string;
  en_ligne: number;
  totaux: {
    visiteurs: number; sessions: number; pages_vues: number; clics_cta: number; visiteurs_cta: number;
    contacts: number; formulaire_ouvert: number; formulaire_commence: number; demandes: number;
  };
  par_jour: Jour[];
  entonnoir: { etape: number; visiteurs: number }[];
  sources: { nom: string; visiteurs: number }[];
  pages: { nom: string; vues: number; visiteurs: number }[];
  appareils: { nom: string; visiteurs: number }[];
  cta: { nom: string; clics: number }[];
  structures: { nom: string; demandes: number }[];
  types_demande: { nom: string; demandes: number }[];
  dernieres_vues: Vue[];
  liste_demandes: Demande[];
};
type Compte = { id: string; identifiant: string; created_at: string; derniere_connexion: string | null; moi: boolean };

const STORE = "mx_admin_session";
const dateTime = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const fmtDate = (s: string | null) => (s ? dateTime.format(new Date(s)) : "Jamais");
const pctFmt = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1 });
const pct = (a: number, b: number) => pctFmt.format(b ? a / b : 0);
const plural = (n: number, mot: string) => `${nf.format(n)} ${mot}${n > 1 ? "s" : ""}`;

const input =
  "h-11 w-full rounded-[10px] border border-line bg-tint/[0.04] px-3.5 text-[15px] text-fg placeholder:text-mist/60 outline-none transition-[border-color,box-shadow] duration-200 focus:border-blue focus:shadow-[0_0_0_3px_rgba(37,99,235,0.25)]";

function isExpired(e: unknown) {
  return e instanceof RpcError && (e.code === "28000" || e.status === 401 || e.status === 403);
}
const message = (e: unknown) => (e instanceof Error ? e.message : "Une erreur est survenue.");

// ---------- Racine : connexion ou tableau de bord ----------
// La session vit dans sessionStorage : elle disparaît à la fermeture de l'onglet.
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
function readStored() {
  try {
    return sessionStorage.getItem(STORE);
  } catch {
    return null;
  }
}
function parseSession(raw: string | null): Session | null {
  try {
    const s: Session | null = raw ? JSON.parse(raw) : null;
    return s && new Date(s.expire_le) > new Date() ? s : null;
  } catch {
    return null;
  }
}

export default function Admin() {
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const raw = useSyncExternalStore(subscribe, readStored, () => undefined);
  const session = useMemo(() => (raw === undefined ? undefined : parseSession(raw)), [raw]);
  const [notice, setNotice] = useState("");

  const save = useCallback((s: Session | null) => {
    try {
      if (s) sessionStorage.setItem(STORE, JSON.stringify(s));
      else sessionStorage.removeItem(STORE);
    } catch {}
    rerender();
  }, []);

  const logout = useCallback(
    (reason = "") => {
      const jeton = session?.jeton;
      save(null);
      setNotice(reason);
      if (jeton) rpc("admin_deconnexion", { p_jeton: jeton }).catch(() => {});
    },
    [session, save],
  );
  const expire = useCallback(() => logout("Votre session a expiré. Reconnectez-vous."), [logout]);

  if (session === undefined) return <div className="min-h-screen" />;
  if (!session)
    return (
      <Login
        notice={notice}
        onLogin={(s) => {
          setNotice("");
          save(s);
        }}
      />
    );
  return (
    <Dashboard
      session={session}
      onLogout={() => logout()}
      onExpired={expire}
      onPasswordChanged={() => save({ ...session, defaut: false })}
    />
  );
}

// ---------- Connexion ----------
function Login({ onLogin, notice }: { onLogin: (s: Session) => void; notice: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const r = await rpc<{ ok: boolean; erreur?: string; jeton: string; identifiant: string; expire_le: string; mot_de_passe_defaut: boolean }>(
        "admin_connexion",
        { p_identifiant: String(d.get("identifiant") || ""), p_mot_de_passe: String(d.get("mot_de_passe") || "") },
      );
      if (!r.ok) setError(r.erreur || "Connexion refusée.");
      else onLogin({ jeton: r.jeton, identifiant: r.identifiant, expire_le: r.expire_le, defaut: r.mot_de_passe_defaut });
    } catch (err) {
      setError(err instanceof TypeError ? "Connexion impossible. Vérifiez votre réseau." : message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/mark.png" alt="" width={44} height={44} />
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
            Mx <span className="text-gradient">Chimie</span>
          </h1>
          <p className="mt-1 text-[15px] text-mist">Espace administrateur</p>
        </div>
        <form onSubmit={submit} className="surface space-y-4 p-6">
          {notice && <p className="rounded-lg bg-tint/[0.05] px-3 py-2 text-[14px] text-mist">{notice}</p>}
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-fg/80">Identifiant</span>
            <input name="identifiant" required autoComplete="username" autoCapitalize="none" spellCheck={false} className={input} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-fg/80">Mot de passe</span>
            <input name="mot_de_passe" type="password" required autoComplete="current-password" className={input} />
          </label>
          <p className="min-h-5 text-[14px] text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy ? "Connexion…" : "Se connecter"}
          </button>
        </form>
        <p className="mt-6 text-center text-[13px] text-mist">
          <Link href="/" className="hover:text-fg">
            Retour au site
          </Link>
        </p>
      </div>
    </main>
  );
}

// ---------- Tableau de bord ----------
const TABS = ["apercu", "demandes", "audience", "comptes"] as const;
type Tab = (typeof TABS)[number];
const PERIODES: { label: string; jours: number | null }[] = [
  { label: "7 jours", jours: 7 },
  { label: "30 jours", jours: 30 },
  { label: "90 jours", jours: 90 },
  { label: "Tout", jours: null },
];

function Dashboard({ session, onLogout, onExpired, onPasswordChanged }: { session: Session; onLogout: () => void; onExpired: () => void; onPasswordChanged: () => void }) {
  const [tab, setTab] = useState<Tab>("apercu");
  const [jours, setJours] = useState<number | null>(30);
  const [data, setData] = useState<Tableau | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    rpc<Tableau>("admin_tableau", { p_jeton: session.jeton, p_jours: jours })
      .then((d) => {
        if (!active) return;
        setData(d);
        setError("");
      })
      .catch((e) => {
        if (!active) return;
        if (isExpired(e)) onExpired();
        else setError(message(e));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [session.jeton, jours, reload, onExpired]);

  const load = () => {
    setLoading(true);
    setReload((r) => r + 1);
  };
  const choosePeriod = (j: number | null) => {
    if (j === jours) return;
    setLoading(true);
    setJours(j);
  };

  const labels: Record<Tab, string> = {
    apercu: "Vue d'ensemble",
    demandes: `Demandes${data ? ` (${data.liste_demandes.length})` : ""}`,
    audience: "Audience",
    comptes: "Comptes",
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-2" title="Voir le site">
            <Image src="/mark.png" alt="" width={24} height={24} />
            <span className="truncate font-display text-[15px] font-bold tracking-tight">
              Mx <span className="text-gradient">Chimie</span>
              <span className="ml-2 hidden font-sans text-[13px] font-normal text-mist sm:inline">Administration</span>
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="hidden text-[13px] text-mist sm:inline">{session.identifiant}</span>
            <ThemeToggle />
            <button type="button" onClick={onLogout} className="btn btn-secondary btn-sm">
              Déconnexion
            </button>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl overflow-x-auto px-4 sm:px-8" aria-label="Sections">
          <div className="flex gap-1" role="tablist">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`relative whitespace-nowrap px-3 py-2.5 text-[14px] transition-colors ${tab === t ? "font-medium text-fg" : "text-mist hover:text-fg"}`}
              >
                {labels[t]}
                {tab === t && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-fg" />}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-8">
        {session.defaut && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-[14px] sm:flex-row sm:items-center sm:justify-between">
            <p>
              <strong className="font-semibold">Mot de passe par défaut.</strong> Créez votre propre compte, connectez-vous avec, puis supprimez le compte « admin ».
            </p>
            <button type="button" onClick={() => setTab("comptes")} className="btn btn-secondary btn-sm shrink-0">
              Gérer les comptes
            </button>
          </div>
        )}

        {tab !== "comptes" && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <div className="flex rounded-full bg-tint/[0.06] p-1" role="group" aria-label="Période">
              {PERIODES.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  aria-pressed={jours === p.jours}
                  onClick={() => choosePeriod(p.jours)}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${jours === p.jours ? "bg-fg font-medium text-ink" : "text-mist hover:text-fg"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button type="button" onClick={load} className="btn btn-secondary btn-sm" disabled={loading}>
              {loading ? "Chargement…" : "Actualiser"}
            </button>
            {data && (
              <span className="ml-auto inline-flex items-center gap-2 text-[13px] text-mist">
                <span className={`h-2 w-2 rounded-full ${data.en_ligne ? "bg-emerald-500" : "bg-tint/25"}`} aria-hidden="true" />
                {nf.format(data.en_ligne)} en ligne (5 min)
              </span>
            )}
          </div>
        )}

        {error && (
          <p className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[14px]" role="alert">
            {error}
          </p>
        )}

        <div className={`transition-opacity duration-200 ${loading && data ? "opacity-60" : ""}`}>
          {tab === "comptes" ? (
            <Comptes session={session} onExpired={onExpired} onPasswordChanged={onPasswordChanged} />
          ) : !data ? (
            loading && <p className="py-20 text-center text-mist">Chargement des statistiques…</p>
          ) : tab === "apercu" ? (
            <Apercu data={data} openDemandes={() => setTab("demandes")} />
          ) : tab === "demandes" ? (
            <Demandes
              data={data}
              session={session}
              onExpired={onExpired}
              onDeleted={(id) => setData({ ...data, liste_demandes: data.liste_demandes.filter((d) => d.id !== id) })}
            />
          ) : (
            <Audience data={data} />
          )}
        </div>
      </main>
    </div>
  );
}

function Card({ title, note, children, className = "" }: { title: string; note?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`surface p-5 sm:p-6 ${className}`}>
      <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
      {note && <p className="mt-0.5 text-[13px] text-mist">{note}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="surface p-4 sm:p-5">
      <p className="text-[13px] text-mist">{label}</p>
      <p className="mt-1.5 font-display text-[28px] font-semibold leading-none tracking-tight">{value}</p>
      {note && <p className="mt-2 text-[12px] text-mist">{note}</p>}
    </div>
  );
}

// ---------- Vue d'ensemble ----------
const ETAPES = ["Formulaire ouvert", "1. Nom et prénom", "2. Adresse e-mail", "3. Structure", "4. Votre demande", "5. Message", "Demande envoyée"];

function Apercu({ data, openDemandes }: { data: Tableau; openDemandes: () => void }) {
  const t = data.totaux;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Visiteurs uniques" value={nf.format(t.visiteurs)} note={plural(t.sessions, "visite")} />
        <Stat label="Pages vues" value={nf.format(t.pages_vues)} note={t.sessions ? `${(t.pages_vues / t.sessions).toFixed(1).replace(".", ",")} par visite` : undefined} />
        <Stat label="Clics « Demander une démo »" value={nf.format(t.clics_cta)} note={plural(t.visiteurs_cta, "visiteur")} />
        <Stat label="Formulaire ouvert" value={nf.format(t.formulaire_ouvert)} note={`${nf.format(t.formulaire_commence)} ${t.formulaire_commence > 1 ? "ont" : "a"} commencé`} />
        <Stat label="Demandes reçues" value={nf.format(t.demandes)} note={t.contacts ? `+ ${nf.format(t.contacts)} par e-mail` : "via le formulaire"} />
        <Stat label="Taux de conversion" value={pct(t.demandes, t.visiteurs)} note="demandes / visiteurs" />
      </div>

      <Card title="Visiteurs par jour" note="Survolez la courbe pour le détail du jour.">
        <VisitorsChart data={data.par_jour} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Parcours du formulaire" note="Visiteurs arrivés à chaque étape.">
          <BarList
            unit="visiteurs"
            empty="Personne n'a encore ouvert le formulaire sur cette période."
            rows={data.entonnoir.map((e) => ({
              nom: ETAPES[e.etape],
              valeur: e.visiteurs,
              note: e.etape > 0 && data.entonnoir[0].visiteurs ? pct(e.visiteurs, data.entonnoir[0].visiteurs) : undefined,
            }))}
          />
        </Card>
        <Card title="Dernières demandes">
          {data.liste_demandes.length === 0 ? (
            <p className="py-6 text-[14px] text-mist">Aucune demande pour l&apos;instant.</p>
          ) : (
            <ul className="-my-2 divide-y divide-line">
              {data.liste_demandes.slice(0, 5).map((d) => (
                <li key={d.id} className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate font-medium">{d.nom}</p>
                    <p className="shrink-0 text-[12px] text-mist">{fmtDate(d.created_at)}</p>
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-mist">
                    {d.structure} · {d.demandes.join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {data.liste_demandes.length > 0 && (
            <button type="button" onClick={openDemandes} className="link-arrow mt-4 text-[14px]">
              Voir toutes les demandes <span aria-hidden="true">›</span>
            </button>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Structures" note="Demandes reçues sur la période.">
          <BarList unit="demandes" rows={data.structures.map((s) => ({ nom: s.nom, valeur: s.demandes }))} />
        </Card>
        <Card title="Types de demande" note="Une demande peut cocher plusieurs cases.">
          <BarList unit="demandes" rows={data.types_demande.map((s) => ({ nom: s.nom, valeur: s.demandes }))} />
        </Card>
      </div>
    </div>
  );
}

// ---------- Demandes ----------
function csvCell(v: string) {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v; // évite l'exécution de formules dans Excel
  return `"${safe.replace(/"/g, '""')}"`;
}

function Demandes({ data, session, onExpired, onDeleted }: { data: Tableau; session: Session; onExpired: () => void; onDeleted: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [structure, setStructure] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState("");

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return data.liste_demandes.filter(
      (d) =>
        (!structure || d.structure === structure) &&
        (!s || [d.nom, d.email, d.message || "", d.demandes.join(" ")].some((v) => v.toLowerCase().includes(s))),
    );
  }, [data.liste_demandes, q, structure]);

  function exportCsv() {
    const head = ["Date", "Nom et prénom", "E-mail", "Structure", "Demande", "Message"];
    const lines = rows.map((d) =>
      [new Date(d.created_at).toLocaleString("fr-FR"), d.nom, d.email, d.structure, d.demandes.join(", "), d.message || ""].map(csvCell).join(";"),
    );
    const blob = new Blob(["﻿" + [head.map(csvCell).join(";"), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mx-chimie-demandes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function remove(d: Demande) {
    if (!confirm(`Supprimer définitivement la demande de ${d.nom} ?`)) return;
    setError("");
    try {
      await rpc("admin_supprimer_demande", { p_jeton: session.jeton, p_id: d.id });
      onDeleted(d.id);
    } catch (e) {
      if (isExpired(e)) return onExpired();
      setError(message(e));
    }
  }

  return (
    <section className="surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:p-5">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un nom, un e-mail, un mot…"
          aria-label="Rechercher dans les demandes"
          className={`${input} sm:max-w-xs`}
        />
        <select value={structure} onChange={(e) => setStructure(e.target.value)} aria-label="Filtrer par structure" className={`${input} sm:w-56`}>
          <option value="">Toutes les structures</option>
          {["École", "Entreprise", "Institution", "Autre"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <p className="text-[13px] text-mist sm:ml-auto">
          {nf.format(rows.length)} demande{rows.length > 1 ? "s" : ""}
        </p>
        <button type="button" onClick={exportCsv} className="btn btn-secondary btn-sm" disabled={!rows.length}>
          Exporter en CSV
        </button>
      </div>
      {error && (
        <p className="border-b border-line bg-red-500/10 px-5 py-3 text-[14px]" role="alert">
          {error}
        </p>
      )}
      {rows.length === 0 ? (
        <p className="px-5 py-12 text-center text-[14px] text-mist">Aucune demande ne correspond.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[14px]">
            <thead className="text-[12px] uppercase tracking-wide text-mist">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Nom et prénom</th>
                <th className="px-3 py-3 font-medium">E-mail</th>
                <th className="px-3 py-3 font-medium">Structure</th>
                <th className="px-3 py-3 font-medium">Demande</th>
                <th className="px-3 py-3 font-medium">Message</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const expanded = open === d.id;
                return (
                  <tr key={d.id} className="border-t border-line align-top">
                    <td className="whitespace-nowrap px-5 py-3 text-mist">{fmtDate(d.created_at)}</td>
                    <td className="px-3 py-3 font-medium">{d.nom}</td>
                    <td className="px-3 py-3">
                      <a href={`mailto:${d.email}`} className="text-[var(--link)] hover:underline">
                        {d.email}
                      </a>
                    </td>
                    <td className="px-3 py-3">{d.structure}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {d.demandes.map((x) => (
                          <span key={x} className="rounded-full bg-tint/[0.07] px-2 py-0.5 text-[12px]">
                            {x}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="max-w-xs px-3 py-3">
                      {d.message ? (
                        <button type="button" onClick={() => setOpen(expanded ? null : d.id)} className="text-left" aria-expanded={expanded}>
                          <span className={`whitespace-pre-wrap break-words ${expanded ? "" : "line-clamp-2"}`}>{d.message}</span>
                          {d.message.length > 80 && <span className="mt-1 block text-[12px] text-[var(--link)]">{expanded ? "Réduire" : "Lire tout"}</span>}
                        </button>
                      ) : (
                        <span className="text-mist">Aucun</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <a href={`mailto:${d.email}?subject=${encodeURIComponent("Votre demande Mx Chimie")}`} className="mr-3 text-[13px] text-[var(--link)] hover:underline">
                        Répondre
                      </a>
                      <button type="button" onClick={() => remove(d)} className="text-[13px] text-red-600 hover:underline dark:text-red-400">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ---------- Audience ----------
function Audience({ data }: { data: Tableau }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="D'où viennent les visiteurs" note="Site d'origine ou paramètre utm_source.">
          <BarList unit="visiteurs" rows={data.sources.map((s) => ({ nom: s.nom, valeur: s.visiteurs }))} />
        </Card>
        <Card title="Appareils" note="Visiteurs uniques par type d'écran.">
          <BarList
            unit="visiteurs"
            rows={data.appareils.map((s) => ({ nom: s.nom.charAt(0).toUpperCase() + s.nom.slice(1), valeur: s.visiteurs, note: pct(s.visiteurs, data.totaux.visiteurs) }))}
          />
        </Card>
        <Card title="Pages les plus vues">
          <BarList unit="vues" rows={data.pages.map((s) => ({ nom: s.nom, valeur: s.vues, note: plural(s.visiteurs, "visiteur") }))} />
        </Card>
        <Card title="Clics sur les boutons" note="Boutons « Demander une démo » et « Obtenir un devis ».">
          <BarList unit="clics" rows={data.cta.map((s) => ({ nom: s.nom, valeur: s.clics }))} />
        </Card>
      </div>

      <section className="surface overflow-hidden">
        <div className="p-5 sm:p-6">
          <h2 className="text-[15px] font-semibold tracking-tight">Dernières visites</h2>
          <p className="mt-0.5 text-[13px] text-mist">Les 50 dernières pages vues. Le visiteur est un identifiant anonyme.</p>
        </div>
        {data.dernieres_vues.length === 0 ? (
          <p className="px-6 pb-10 text-[14px] text-mist">Aucune visite sur cette période.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[14px]">
              <thead className="text-[12px] uppercase tracking-wide text-mist">
                <tr>
                  <th className="px-6 py-2.5 font-medium">Date</th>
                  <th className="px-3 py-2.5 font-medium">Page</th>
                  <th className="px-3 py-2.5 font-medium">Source</th>
                  <th className="px-3 py-2.5 font-medium">Appareil</th>
                  <th className="px-6 py-2.5 font-medium">Visiteur</th>
                </tr>
              </thead>
              <tbody>
                {data.dernieres_vues.map((v, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="whitespace-nowrap px-6 py-2.5 text-mist">{fmtDate(v.created_at)}</td>
                    <td className="px-3 py-2.5">{v.page || "/"}</td>
                    <td className="px-3 py-2.5">{v.source || <span className="text-mist">Accès direct</span>}</td>
                    <td className="px-3 py-2.5 capitalize">{v.appareil || "inconnu"}</td>
                    <td className="px-6 py-2.5 font-mono text-[12px] text-mist">{v.visiteur}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ---------- Comptes ----------
function Comptes({ session, onExpired, onPasswordChanged }: { session: Session; onExpired: () => void; onPasswordChanged: () => void }) {
  const [comptes, setComptes] = useState<Compte[] | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const fail = useCallback(
    (e: unknown) => {
      if (isExpired(e)) onExpired();
      else setError(message(e));
    },
    [onExpired],
  );

  const [reload, setReload] = useState(0);
  const load = () => setReload((r) => r + 1);

  useEffect(() => {
    let active = true;
    rpc<Compte[]>("admin_comptes", { p_jeton: session.jeton })
      .then((c) => active && setComptes(c))
      .catch((e) => active && fail(e));
    return () => {
      active = false;
    };
  }, [session.jeton, fail, reload]);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    setError("");
    setInfo("");
    if (d.get("mdp") !== d.get("mdp2")) return setError("Les deux mots de passe ne correspondent pas.");
    try {
      await rpc("admin_creer_compte", { p_jeton: session.jeton, p_identifiant: String(d.get("identifiant")), p_mot_de_passe: String(d.get("mdp")) });
      form.reset();
      setInfo("Compte créé. Le mot de passe est enregistré haché (bcrypt).");
      load();
    } catch (err) {
      fail(err);
    }
  }

  async function remove(c: Compte) {
    if (!confirm(`Supprimer le compte « ${c.identifiant} » ?`)) return;
    setError("");
    setInfo("");
    try {
      await rpc("admin_supprimer_compte", { p_jeton: session.jeton, p_id: c.id });
      setInfo(`Compte « ${c.identifiant} » supprimé.`);
      load();
    } catch (err) {
      fail(err);
    }
  }

  async function changePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    setError("");
    setInfo("");
    if (d.get("nouveau") !== d.get("nouveau2")) return setError("Les deux nouveaux mots de passe ne correspondent pas.");
    try {
      await rpc("admin_changer_mot_de_passe", { p_jeton: session.jeton, p_ancien: String(d.get("ancien")), p_nouveau: String(d.get("nouveau")) });
      form.reset();
      onPasswordChanged();
      setInfo("Mot de passe modifié.");
    } catch (err) {
      fail(err);
    }
  }

  return (
    <div className="space-y-5">
      {(error || info) && (
        <p className={`rounded-xl border px-4 py-3 text-[14px] ${error ? "border-red-500/30 bg-red-500/10" : "border-emerald-500/30 bg-emerald-500/10"}`} role={error ? "alert" : "status"}>
          {error || info}
        </p>
      )}

      <section className="surface overflow-hidden">
        <div className="p-5 sm:p-6">
          <h2 className="text-[15px] font-semibold tracking-tight">Administrateurs</h2>
          <p className="mt-0.5 text-[13px] text-mist">Vous ne pouvez pas supprimer le compte avec lequel vous êtes connecté.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-[14px]">
            <thead className="text-[12px] uppercase tracking-wide text-mist">
              <tr>
                <th className="px-6 py-2.5 font-medium">Identifiant</th>
                <th className="px-3 py-2.5 font-medium">Créé le</th>
                <th className="px-3 py-2.5 font-medium">Dernière connexion</th>
                <th className="px-6 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {(comptes || []).map((c) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="px-6 py-3 font-medium">
                    {c.identifiant}
                    {c.moi && <span className="ml-2 rounded-full bg-tint/[0.07] px-2 py-0.5 text-[12px] font-normal text-mist">vous</span>}
                  </td>
                  <td className="px-3 py-3 text-mist">{fmtDate(c.created_at)}</td>
                  <td className="px-3 py-3 text-mist">{fmtDate(c.derniere_connexion)}</td>
                  <td className="px-6 py-3 text-right">
                    {!c.moi && (
                      <button type="button" onClick={() => remove(c)} className="text-[13px] text-red-600 hover:underline dark:text-red-400">
                        Supprimer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!comptes && <p className="px-6 pb-6 text-[14px] text-mist">Chargement…</p>}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Créer un administrateur">
          <form onSubmit={create} className="space-y-3">
            <input name="identifiant" required placeholder="Identifiant (ex. awa.kone)" autoComplete="off" autoCapitalize="none" spellCheck={false} pattern="[A-Za-z0-9._\-]{3,40}" className={input} />
            <input name="mdp" type="password" required minLength={8} placeholder="Mot de passe (8 caractères minimum)" autoComplete="new-password" className={input} />
            <input name="mdp2" type="password" required minLength={8} placeholder="Confirmer le mot de passe" autoComplete="new-password" className={input} />
            <button type="submit" className="btn btn-primary">
              Créer le compte
            </button>
          </form>
        </Card>
        <Card title="Changer mon mot de passe" note={`Compte : ${session.identifiant}`}>
          <form onSubmit={changePassword} className="space-y-3">
            <input name="ancien" type="password" required placeholder="Mot de passe actuel" autoComplete="current-password" className={input} />
            <input name="nouveau" type="password" required minLength={8} placeholder="Nouveau mot de passe" autoComplete="new-password" className={input} />
            <input name="nouveau2" type="password" required minLength={8} placeholder="Confirmer le nouveau mot de passe" autoComplete="new-password" className={input} />
            <button type="submit" className="btn btn-secondary">
              Mettre à jour
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
