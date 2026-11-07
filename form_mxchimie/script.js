// Mx Chimie : formulaire question par question -> Supabase (API REST, sans librairie).
(function () {
  "use strict";

  const cfg = window.MX_CONFIG || {};
  const form = document.getElementById("form");
  const steps = Array.from(form.querySelectorAll(".step"));
  const LAST = steps.length - 1; // index de la dernière question
  const QUESTIONS = LAST; // l'étape 0 est l'accueil
  const success = document.getElementById("success");
  const submitBtn = document.getElementById("submit");
  const btnLabel = submitBtn.querySelector(".btn-label");
  const formError = document.getElementById("form-error");
  const messageHint = document.getElementById("message-hint");
  const progress = document.querySelector(".progress");
  const progressBar = document.getElementById("progress-bar");
  const counter = document.getElementById("counter");
  const announcer = document.getElementById("announcer");
  const arrows = document.getElementById("arrows");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Écran tactile (iPhone, Android) : pas de focus automatique, qui ouvrirait le clavier
  // et ferait défiler la page en plein milieu de l'animation.
  const isTouch = window.matchMedia("(pointer: coarse)").matches;

  let current = 0;
  let autoTimer = null;

  // Prépare l'entrée en cascade : chaque élément reçoit son rang d'apparition.
  steps.forEach((step) => {
    step.querySelectorAll(".qnum, .title, .lead, .sub, .line, .option, .actions").forEach((el, i) => {
      el.classList.add("anim");
      el.style.setProperty("--i", i);
    });
  });

  // ---------- Données et validation ----------
  function readData() {
    const d = new FormData(form);
    return {
      nom: String(d.get("nom") || "").trim().replace(/\s+/g, " "),
      email: String(d.get("email") || "").trim().toLowerCase(),
      structure: d.get("structure") || "",
      demandes: d.getAll("demandes"),
      message: String(d.get("message") || "").trim(),
      website: String(d.get("website") || ""),
    };
  }

  function validate(data) {
    const errors = {};
    if (data.nom.length < 2) errors.nom = "Indiquez votre nom et prénom.";
    if (!data.email) errors.email = "Indiquez votre adresse e-mail.";
    else if (!EMAIL_RE.test(data.email)) errors.email = "Cette adresse e-mail ne semble pas valide.";
    if (!data.structure) errors.structure = "Choisissez une option pour continuer.";
    if (data.demandes.length === 0) errors.demandes = "Cochez au moins une option pour continuer.";
    if (data.demandes.includes("Autre") && !data.message) errors.message = "Précisez votre demande « Autre » en quelques mots.";
    return errors;
  }

  function setFieldError(name, msg) {
    const el = document.getElementById(name + "-error");
    if (el) el.textContent = msg || "";
    if (name === "structure" || name === "demandes") {
      steps.find((s) => s.dataset.field === name).querySelector(".options").classList.toggle("invalid", !!msg);
    } else if (form.elements[name]) {
      form.elements[name].setAttribute("aria-invalid", msg ? "true" : "false");
    }
  }

  // ---------- Mesure d'audience (anonyme, visible dans le tableau de bord) ----------
  const tracked = new Set();
  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
    return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
  }
  function storedId(getStorage, key) {
    try {
      const s = getStorage();
      let v = s.getItem(key);
      if (!v) s.setItem(key, (v = uid()));
      return v;
    } catch (e) {
      return uid();
    }
  }
  function track(type, etape) {
    const key = type + (etape == null ? "" : etape);
    if (tracked.has(key) || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;
    tracked.add(key);
    const w = Math.min(screen.width, innerWidth);
    try {
      fetch(cfg.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/evenements", {
        method: "POST",
        headers: { apikey: cfg.SUPABASE_ANON_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          visiteur: storedId(() => localStorage, "mx_v"),
          session: storedId(() => sessionStorage, "mx_s"),
          type: type,
          page: location.pathname.slice(0, 300),
          appareil: w < 600 ? "mobile" : w < 1024 && isTouch ? "tablette" : "ordinateur",
          etape: etape == null ? null : etape,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch (e) {}
  }

  // ---------- Navigation ----------
  function focusStep(step) {
    const target =
      step.querySelector(".line") ||
      step.querySelector("input:checked") ||
      step.querySelector(".option input") ||
      step.querySelector("[data-next], button[type=submit]");
    if (target) target.focus({ preventScroll: true });
  }

  function go(index) {
    clearTimeout(autoTimer);
    const target = Math.max(0, Math.min(LAST, index));
    if (isTouch) {
      // Referme le clavier et remet la page en place AVANT de lancer le glissement.
      if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
      window.scrollTo(0, 0);
    }
    form.classList.toggle("going-back", target < current);
    current = target;
    steps.forEach((s, i) => {
      s.classList.toggle("is-active", i === current);
      s.classList.toggle("is-past", i < current);
      s.inert = i !== current;
      s.setAttribute("aria-hidden", i === current ? "false" : "true");
    });
    const answered = Math.max(0, current - 1);
    progressBar.style.width = `${(answered / QUESTIONS) * 100}%`;
    progress.setAttribute("aria-valuenow", String(answered));
    counter.textContent = current > 0 ? `${current} / ${QUESTIONS}` : "";
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === LAST;
    if (current > 0) {
      announcer.textContent = `Question ${current} sur ${QUESTIONS}`;
      track("formulaire_commence");
      track("formulaire_etape", current);
    }
    // On attend la fin du glissement avant de donner le focus, pour éviter un saut de page.
    if (!isTouch) setTimeout(() => focusStep(steps[current]), reduceMotion ? 0 : 320);
  }

  function next() {
    const field = steps[current].dataset.field;
    if (field) {
      const err = validate(readData())[field];
      setFieldError(field, err);
      if (err) {
        focusStep(steps[current]);
        return;
      }
    }
    if (current < LAST) go(current + 1);
  }

  function prev() {
    if (current > 0) go(current - 1);
  }

  form.querySelectorAll("[data-next]").forEach((b) => b.addEventListener("click", next));
  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  // ---------- Clavier ----------
  document.addEventListener("keydown", (e) => {
    if (!success.hidden) return;
    const t = e.target;
    const inText = t.matches && t.matches("input[type=text], input[type=email], textarea");

    if (e.key === "Enter") {
      if (t.tagName === "TEXTAREA") {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          form.requestSubmit();
        }
        return; // Entrée seule = retour à la ligne
      }
      if (t.tagName === "BUTTON" || t.tagName === "A") return; // le bouton gère son propre clic
      e.preventDefault(); // empêche l'envoi implicite du formulaire
      next();
      return;
    }

    // Raccourcis A, B, C, D pour les choix
    if (!inText && !e.ctrlKey && !e.metaKey && !e.altKey && /^[a-d]$/i.test(e.key)) {
      const opts = steps[current].querySelectorAll(".option input");
      const input = opts["abcd".indexOf(e.key.toLowerCase())];
      if (!input) return;
      e.preventDefault();
      input.type === "radio" ? (input.checked = true) : (input.checked = !input.checked);
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.focus({ preventScroll: true });
    }
  });

  // ---------- Choix ----------
  form.addEventListener("change", (e) => {
    const t = e.target;
    if (t.name === "structure" || t.name === "demandes") {
      setFieldError(t.name, "");
      t.closest(".option").classList.remove("flash");
      void t.offsetWidth;
      t.closest(".option").classList.add("flash");
    }
    // Un choix unique passe automatiquement à la question suivante.
    if (t.type === "radio" && t.closest("[data-auto-next]")) {
      clearTimeout(autoTimer);
      autoTimer = setTimeout(next, 420);
    }
    if (t.name === "demandes") {
      const autre = form.querySelector('input[name="demandes"][value="Autre"]').checked;
      messageHint.textContent = autre ? "Obligatoire : précisez votre demande « Autre »." : "Facultatif : précisions ou questions.";
    }
  });

  // Les erreurs des champs texte s'effacent dès qu'on corrige.
  form.addEventListener("input", (e) => {
    const name = e.target.name;
    if (name === "nom" || name === "email" || name === "message") {
      const el = document.getElementById(name + "-error");
      if (el && el.textContent) setFieldError(name, validate(readData())[name]);
    }
    formError.textContent = "";
  });

  // ---------- Envoi ----------
  const isConfigured = () =>
    cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes("VOTRE-PROJET") && !cfg.SUPABASE_ANON_KEY.includes("VOTRE_CLE");

  function setLoading(on) {
    submitBtn.disabled = on;
    submitBtn.classList.toggle("loading", on);
    submitBtn.setAttribute("aria-busy", on ? "true" : "false");
    btnLabel.textContent = on ? "Envoi en cours…" : "Envoyer ma demande";
  }

  async function send(data) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(`${cfg.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${cfg.TABLE || "demandes"}`, {
        method: "POST",
        headers: Object.assign(
          { apikey: cfg.SUPABASE_ANON_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
          // Anciennes clés "anon" (JWT) : aussi en Bearer. Clés "sb_publishable_" : apikey uniquement.
          cfg.SUPABASE_ANON_KEY.startsWith("eyJ") ? { Authorization: `Bearer ${cfg.SUPABASE_ANON_KEY}` } : {}
        ),
        body: JSON.stringify({
          nom: data.nom,
          email: data.email,
          structure: data.structure,
          demandes: data.demandes,
          message: data.message || null,
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text().catch(() => "")}`);
    } finally {
      clearTimeout(timer);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;
    formError.textContent = "";
    const data = readData();

    // Vérification finale : on ramène l'utilisateur sur la première question à corriger.
    const errors = validate(data);
    const firstBad = steps.findIndex((s) => s.dataset.field && errors[s.dataset.field]);
    if (firstBad !== -1) {
      Object.keys(errors).forEach((k) => setFieldError(k, errors[k]));
      if (firstBad !== current) go(firstBad);
      else focusStep(steps[current]);
      return;
    }

    if (data.website) return showSuccess(); // robot : succès simulé, rien n'est envoyé

    if (!isConfigured()) {
      formError.textContent = "Le formulaire n'est pas encore relié à la base de données (config.js).";
      return;
    }

    setLoading(true);
    try {
      await send(data);
      track("formulaire_envoye");
      showSuccess();
    } catch (err) {
      console.error("Mx Chimie : échec de l'envoi", err);
      formError.textContent =
        err.name === "AbortError"
          ? "La connexion est trop lente. Vérifiez votre réseau puis réessayez."
          : "L'envoi n'a pas abouti. Réessayez, ou écrivez-nous à mxchimie@gmail.com.";
    } finally {
      setLoading(false);
    }
  });

  // ---------- Confirmation ----------
  function showSuccess() {
    form.hidden = true;
    arrows.hidden = true;
    success.hidden = false;
    progressBar.style.width = "100%";
    progress.setAttribute("aria-valuenow", String(QUESTIONS));
    counter.textContent = "";
    success.focus();
  }

  document.getElementById("again").addEventListener("click", () => {
    form.reset();
    messageHint.textContent = "Facultatif : précisions ou questions.";
    ["nom", "email", "structure", "demandes", "message"].forEach((n) => setFieldError(n, ""));
    success.hidden = true;
    form.hidden = false;
    arrows.hidden = false;
    go(1);
  });

  go(0);
  track("formulaire_ouvert");
})();
