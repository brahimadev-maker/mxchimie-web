"use client";

export default function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Basculer entre le thème clair et le thème sombre"
      title="Thème clair / sombre"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-mist transition-colors duration-200 hover:bg-tint/[0.07] hover:text-fg active:scale-95"
    >
      {/* Lune : affichée en clair, pour passer en sombre */}
      <svg className="block h-[17px] w-[17px] dark:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.6 6.6 0 0 0 9.7 9.7z" />
      </svg>
      {/* Soleil : affiché en sombre, pour revenir au clair */}
      <svg className="hidden h-[17px] w-[17px] dark:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
      </svg>
    </button>
  );
}
