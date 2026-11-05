"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "#plateforme", label: "Plateforme" },
  { href: "#fonctionnement", label: "Fonctionnement" },
  { href: "#offre", label: "Offre" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-300 ${
        scrolled || open ? "border-line bg-ink/75 backdrop-blur-xl backdrop-saturate-150" : "border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8" aria-label="Navigation principale">
        <a href="#top" className="flex items-center gap-2" aria-label="Mx Chimie, retour en haut de page">
          <Image src="/mark.png" alt="" width={26} height={26} />
          <span className="font-display text-[15px] font-bold tracking-tight">
            Mx <span className="text-gradient">Chimie</span>
          </span>
        </a>

        <ul className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="text-[13px] text-mist transition-colors duration-200 hover:text-fg">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a href="#contact" className="btn btn-primary btn-sm hidden sm:inline-flex">
            Demander une démo
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-fg transition-colors hover:bg-tint/10 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 9h16M4 15h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="reveal is-visible border-t border-line px-5 pb-8 pt-2 md:hidden">
          <ul>
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-line py-4 font-display text-xl font-semibold tracking-tight text-fg/90 transition-colors hover:text-fg"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a href="#contact" onClick={() => setOpen(false)} className="btn btn-primary mt-6 w-full">
            Demander une démo
          </a>
        </div>
      )}
    </header>
  );
}
