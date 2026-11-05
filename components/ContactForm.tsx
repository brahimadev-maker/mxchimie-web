"use client";

import { useState, type FormEvent, type ReactNode } from "react";

export const CONTACT_EMAIL = "mxchimie@gmail.com";

const ROLES = [
  "Direction d'établissement",
  "Enseignant·e de chimie",
  "Ministère / autorité éducative",
  "Réseau d'écoles privées",
  "Université / recherche",
  "Investisseur / partenaire",
  "Autre",
];

const field =
  "h-11 w-full rounded-[10px] border border-line bg-tint/[0.04] px-3.5 text-[15px] text-fg placeholder:text-mist/50 outline-none transition-[border-color,background-color,box-shadow] duration-200 hover:border-tint/20 focus:border-blue focus:bg-tint/[0.06] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.25)] focus-visible:outline-none";

function Field({ id, label, optional, className = "", children }: { id: string; label: string; optional?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-fg/80">
        {label}
        {optional && <span className="ml-1 font-normal text-mist">(facultatif)</span>}
      </label>
      {children}
    </div>
  );
}

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const get = (k: string) => String(d.get(k) ?? "").trim();
    const subject = `Demande de démo : ${get("organisation") || get("name")}`;
    const body = [
      `Nom : ${get("name")}`,
      `Établissement / organisation : ${get("organisation")}`,
      `Fonction : ${get("role")}`,
      `E-mail : ${get("email")}`,
      `Téléphone : ${get("phone")}`,
      "",
      get("message"),
    ].join("\n");
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  if (sent) {
    return (
      <div className="surface p-8 sm:p-10" role="status">
        <svg className="h-8 w-8 text-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" />
          <path d="M8 12.2l2.7 2.7L16.2 9.4" />
        </svg>
        <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight">Merci.</h3>
        <p className="mt-2 text-mist">
          Votre messagerie s&apos;est ouverte avec votre demande pré-remplie. Si rien ne s&apos;est passé, écrivez-nous directement à{" "}
          <a className="text-fg underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        <button type="button" onClick={() => setSent(false)} className="link-arrow mt-6 text-[15px]">
          Envoyer une autre demande <span aria-hidden="true">›</span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="surface grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
      <Field id="name" label="Nom complet">
        <input id="name" name="name" required autoComplete="name" className={field} placeholder="Awa Koné" />
      </Field>
      <Field id="organisation" label="Établissement / organisation">
        <input id="organisation" name="organisation" required autoComplete="organization" className={field} placeholder="Lycée moderne d'Abidjan" />
      </Field>
      <Field id="email" label="E-mail">
        <input id="email" name="email" type="email" required autoComplete="email" className={field} placeholder="vous@ecole.ci" />
      </Field>
      <Field id="phone" label="Téléphone" optional>
        <input id="phone" name="phone" type="tel" autoComplete="tel" className={field} placeholder="+225 07 00 00 00 00" />
      </Field>
      <Field id="role" label="Vous êtes" className="sm:col-span-2">
        <div className="relative">
          <select id="role" name="role" className={`${field} appearance-none pr-10`} defaultValue={ROLES[0]}>
            {ROLES.map((r) => (
              <option key={r} className="bg-ink">
                {r}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </Field>
      <Field id="message" label="Votre projet" optional className="sm:col-span-2">
        <textarea
          id="message"
          name="message"
          rows={4}
          className={`${field} h-auto resize-y py-3`}
          placeholder="Nombre de classes, d'élèves, période souhaitée pour une démonstration…"
        />
      </Field>
      <div className="flex flex-col-reverse gap-4 pt-1 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-mist">Démonstration en direct dans votre établissement.</p>
        <button type="submit" className="btn btn-primary">
          Demander une démo
        </button>
      </div>
    </form>
  );
}
