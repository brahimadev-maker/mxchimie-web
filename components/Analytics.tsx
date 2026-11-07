"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

let counted = false; // évite un double comptage en développement (Strict Mode)

// Compte la visite et les clics sur les éléments marqués data-track.
export default function Analytics() {
  useEffect(() => {
    if (!counted) {
      counted = true;
      track("page_vue");
    }
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-track]");
      if (el) track("clic_cta", el.getAttribute("data-track") || undefined);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
