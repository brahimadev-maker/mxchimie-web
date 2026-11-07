// Mx Chimie : formulaire de contact -> Supabase (API REST, sans librairie).
(function () {
  "use strict";

  const cfg = window.MX_CONFIG || {};
  const form = document.getElementById("form");
  const success = document.getElementById("success");
  const submitBtn = document.getElementById("submit");
  const btnLabel = submitBtn.querySelector(".btn-label");
  const formError = document.getElementById("form-error");
  const messageHint = document.getElementById("message-hint");
  const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  const isConfigured = () =>
    cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes("VOTRE-PROJET") && !cfg.SUPABASE_ANON_KEY.includes("VOTRE_CLE");

  // ---------- Lecture et validation ----------
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
    if (!data.structure) errors.structure = "Choisissez le type de structure.";
    if (data.demandes.length === 0) errors.demandes = "Cochez au moins une demande.";
    if (data.demandes.includes("Autre") && !data.message) errors.message = "Précisez votre demande « Autre » dans le message.";
    return errors;
  }

  function setFieldError(name, msg) {
    const el = document.getElementById(name + "-error");
    if (el) el.textContent = msg || "";
    if (name === "structure") form.querySelector(".segmented").classList.toggle("invalid", !!msg);
    else if (name === "demandes") form.querySelector(".choices").classList.toggle("invalid", !!msg);
    else {
      const input = form.elements[name];
      if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
    }
  }

  function showErrors(errors) {
    ["nom", "email", "structure", "demandes", "message"].forEach((n) => setFieldError(n, errors[n]));
    const first = Object.keys(errors)[0];
    if (!first) return;
    const target =
      first === "structure" ? form.querySelector('input[name="structure"]') :
      first === "demandes" ? form.querySelector('input[name="demandes"]') :
      form.elements[first];
    if (target) target.focus();
  }

  // Les erreurs s'effacent dès que l'utilisateur corrige.
  form.addEventListener("input", (e) => {
    const name = e.target.name;
    if (!name || name === "website") return;
    const errors = validate(readData());
    setFieldError(name, errors[name]);
    if (name === "demandes") setFieldError("message", errors.message);
    formError.textContent = "";
  });

  // Le message devient obligatoire si « Autre » est coché.
  form.addEventListener("change", (e) => {
    if (e.target.name !== "demandes") return;
    const autre = form.querySelector('input[name="demandes"][value="Autre"]').checked;
    messageHint.textContent = autre ? "obligatoire si « Autre »" : "facultatif";
  });

  // ---------- Envoi ----------
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
          {
            apikey: cfg.SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          // Les anciennes clés "anon" (JWT, commençant par eyJ) passent aussi en Bearer ;
          // les clés modernes "sb_publishable_" s'envoient uniquement dans apikey.
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
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${detail}`);
      }
    } finally {
      clearTimeout(timer);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.textContent = "";
    const data = readData();

    const errors = validate(data);
    if (Object.keys(errors).length) {
      showErrors(errors);
      return;
    }

    // Robot détecté (champ piège rempli) : on simule un succès sans rien envoyer.
    if (data.website) {
      showSuccess();
      return;
    }

    if (!isConfigured()) {
      formError.textContent = "Le formulaire n'est pas encore relié à la base de données (config.js).";
      console.warn("Mx Chimie : renseignez SUPABASE_URL et SUPABASE_ANON_KEY dans config.js");
      return;
    }

    setLoading(true);
    try {
      await send(data);
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
    success.hidden = false;
    success.focus();
  }

  document.getElementById("again").addEventListener("click", () => {
    form.reset();
    messageHint.textContent = "facultatif";
    ["nom", "email", "structure", "demandes", "message"].forEach((n) => setFieldError(n, ""));
    success.hidden = true;
    form.hidden = false;
    form.elements.nom.focus();
  });
})();
