import type { ReactNode } from "react";
import Image from "next/image";
import Nav from "@/components/Nav";
import Reveal from "@/components/Reveal";
import PricingCalculator from "@/components/PricingCalculator";
import ContactForm, { CONTACT_EMAIL } from "@/components/ContactForm";

/* ---------- Icônes ---------- */
type IconProps = { className?: string };
const I = {
  headset: ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-4l-2-2.5h-2L9 17H5a2 2 0 0 1-2-2z" />
      <circle cx="8" cy="12" r="1.2" /><circle cx="16" cy="12" r="1.2" />
    </svg>
  ),
  cube: ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l9 5v10l-9 5-9-5V7z" /><path d="M12 22V12M21 7l-9 5-9-5" />
    </svg>
  ),
  spark: ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5" />
      <circle cx="12" cy="12" r="2.2" />
    </svg>
  ),
  shield: ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" />
    </svg>
  ),
  check: ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
  ),
  x: ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
  ),
  arrow: ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  ),
};

/* ---------- Données ---------- */
const stats = [
  { value: "3 901", label: "établissements d'enseignement secondaire général en Côte d'Ivoire" },
  { value: "3,2 M+", label: "élèves du secondaire en 2024–2025" },
  { value: "0", label: "produit chimique réel manipulé : zéro risque d'accident" },
];

const barriers = ["Construction du laboratoire", "Équipement et verrerie", "Produits chimiques", "Maintenance", "Infrastructures de sécurité"];

const pillars = [
  {
    icon: I.headset,
    title: "Réalité mixte",
    text: "Avec un casque compatible, l'élève voit sa paillasse virtuelle s'intégrer à la salle de classe et travaille les mains libres.",
  },
  {
    icon: I.cube,
    title: "Laboratoires 3D interactifs",
    text: "Verrerie, réactifs et instruments sont modélisés en 3D. Chaque objet se saisit, se soulève et se manipule comme dans la réalité.",
  },
  {
    icon: I.spark,
    title: "Résultats pilotés par l'IA",
    text: "L'IA calcule l'issue de chaque expérience à partir des gestes de l'élève : quantités, ordre, mélanges. Erreurs comprises.",
  },
];

const gestures = ["Saisir", "Soulever", "Toucher", "Verser", "Mélanger", "Chauffer", "Mesurer", "Observer"];

const steps = [
  { n: "01", title: "L'élève enfile le casque", text: "Le laboratoire apparaît devant lui : paillasse, verrerie, réactifs et consignes du TP." },
  { n: "02", title: "Il manipule avec ses mains", text: "Il saisit un bécher, mesure un volume, verse une solution, comme il le ferait en vrai." },
  { n: "03", title: "L'IA fait réagir la matière", text: "Changement de couleur, dégagement gazeux, précipité : le résultat dépend de ce qu'il a réellement fait." },
  { n: "04", title: "Il recommence, sans gaspiller", text: "Les expériences sont réutilisables à l'infini. Aucun réactif consommé, aucune verrerie cassée." },
];

const comparison = [
  { label: "Investissement initial", trad: "Construction et équipement d'une salle dédiée", mx: "Aucun : abonnement annuel par casque" },
  { label: "Consommables", trad: "Achat continu de produits chimiques", mx: "Expériences numériques réutilisables" },
  { label: "Sécurité", trad: "Risques de brûlure, d'inhalation, de casse", mx: "Aucune substance réelle manipulée" },
  { label: "Maintenance", trad: "Entretien, stockage, mise aux normes", mx: "Incluse dans l'abonnement" },
  { label: "Montée en charge", trad: "Limitée par la taille de la salle", mx: "Ajoutez des casques au fil des besoins" },
  { label: "Programme", trad: "Limité par le matériel disponible", mx: "Contenus adaptables au programme scolaire" },
];

const included = [
  "Un casque de réalité mixte compatible",
  "Accès complet à la plateforme Mx Chimie",
  "Bibliothèque d'expériences réutilisables",
  "Contenus adaptés au programme",
  "Mises à jour et nouvelles expériences",
];

const deployment = [
  { title: "Démonstration en direct", text: "Nous venons dans votre établissement présenter Mx Chimie à la direction et aux enseignants de chimie." },
  { title: "Déploiement pilote", text: "Quelques casques pour une classe. Nous mesurons l'engagement des élèves et recueillons l'avis des enseignants." },
  { title: "Équipement progressif", text: "Sur la base des résultats, vous équipez des classes entières à votre rythme." },
  { title: "Déploiement à grande échelle", text: "Avec les ministères et les réseaux d'écoles, via des programmes d'achat centralisés." },
];

/* ---------- Page ---------- */
function SectionHeading({ id, eyebrow, title, text, center = false }: { id?: string; eyebrow: string; title: ReactNode; text?: string; center?: boolean }) {
  return (
    <Reveal className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {/* Ancre posée sur le titre : le lien de navigation l'amène juste sous la barre fixe. */}
      {id && <span id={id} className="block scroll-mt-24" />}
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="h-section mt-3">{title}</h2>
      {text && <p className={`lead mt-4 ${center ? "mx-auto" : ""}`}>{text}</p>}
    </Reveal>
  );
}

const container = "mx-auto max-w-6xl px-5 sm:px-8";
const section = "py-24 sm:py-28 lg:py-32";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="top" className="overflow-x-clip">
        {/* HERO */}
        <section className="relative pt-28 sm:pt-36">
          <div className={`${container} grid items-center gap-14 pb-24 lg:grid-cols-[1.2fr_1fr] lg:gap-16 lg:pb-32`}>
            <div>
              <Reveal>
                <h1 className="font-display text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] sm:text-[2.5rem] xl:text-[2.75rem]">
                  Le laboratoire devient virtuel, l&apos;expérience devient réelle,
                  <br />
                  <span className="text-gradient">et la science devient accessible à tous.</span>
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="lead mt-6 text-[1.125rem]">
                  Mx Chimie plonge les élèves dans des laboratoires virtuels réalistes. Ils saisissent, versent et mélangent, et
                  l&apos;IA fait réagir la matière selon leurs gestes. La chimie pratique devient accessible à toutes les écoles
                  d&apos;Afrique, en toute sécurité.
                </p>
              </Reveal>
              <Reveal delay={180} className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
                <a href="#contact" data-track="Hero : demander une démo" className="btn btn-primary">
                  Demander une démo dans mon école
                </a>
                <a href="#fonctionnement" className="link-arrow text-[15px]">
                  Voir comment ça marche <span aria-hidden="true">›</span>
                </a>
              </Reveal>
              <Reveal delay={240}>
                <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-mist">
                  {["Aucun labo à construire", "Zéro produit dangereux", "Expériences réutilisables"].map((t) => (
                    <li key={t} className="inline-flex items-center gap-2">
                      <I.check className="h-3.5 w-3.5 text-cyan" /> {t}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <Reveal delay={150}>
              <div className="overflow-hidden rounded-[1.25rem] border border-line bg-ink-2 shadow-[var(--shadow)]">
                <video
                  className="block aspect-video w-full object-cover"
                  src="/demo-web.mp4"
                  poster="/demo-poster.jpg"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  preload="metadata"
                  aria-label="Vidéo de démonstration de Mx Chimie"
                />
              </div>
            </Reveal>
          </div>
        </section>

        {/* STATS / PROBLÈME */}
        <section className="border-t border-line bg-ink-2">
          <div className={`${container} ${section}`}>
            <SectionHeading
              eyebrow="Le constat"
              title={
                <>
                  Des millions d&apos;élèves apprennent la chimie <span className="text-mist">sans jamais la pratiquer.</span>
                </>
              }
              text="Dans de nombreux établissements, les travaux pratiques restent théoriques. Le coût d'un laboratoire classique est hors de portée."
            />
            <dl className="mt-16 grid gap-10 sm:grid-cols-3 sm:gap-8">
              {stats.map((s, i) => (
                <Reveal key={s.value} delay={i * 60} className="border-t border-line pt-6">
                  <dt className="sr-only">{s.label}</dt>
                  <dd>
                    <p className="font-display text-[2.75rem] font-semibold leading-none tracking-[-0.03em] tabular-nums sm:text-[3.25rem]">
                      {s.value}
                    </p>
                    <p className="mt-3 max-w-[16rem] text-[15px] leading-relaxed text-mist">{s.label}</p>
                  </dd>
                </Reveal>
              ))}
            </dl>
            <Reveal className="mt-16 border-t border-line pt-6">
              <p className="text-[15px] text-mist">
                <span className="text-fg/85">Ce qu&apos;exige un laboratoire traditionnel :</span>{" "}
                {barriers.join(", ").toLowerCase()}.
              </p>
            </Reveal>
          </div>
        </section>

        {/* PLATEFORME */}
        <section className="border-t border-line">
          <div className={`${container} ${section}`}>
            <SectionHeading
              id="plateforme"
              eyebrow="La plateforme"
              title={
                <>
                  Trois technologies. <span className="text-mist">Un vrai laboratoire.</span>
                </>
              }
              text="Mx Chimie réunit casques de réalité mixte, environnements 3D interactifs et intelligence artificielle pour recréer l'expérience d'un TP de chimie."
            />
            <ul className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
              {pillars.map((p, i) => (
                <Reveal as="li" key={p.title} delay={i * 60}>
                  <p.icon className="h-7 w-7 text-fg/85" />
                  <h3 className="h-item mt-5">{p.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-mist">{p.text}</p>
                </Reveal>
              ))}
            </ul>

            <Reveal className="surface mt-16 flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-sm">
                <h3 className="h-item">Des gestes naturels</h3>
                <p className="mt-1.5 text-[15px] text-mist">Pas de manette compliquée : l&apos;élève utilise ses mains.</p>
              </div>
              <ul className="flex flex-wrap gap-2 md:max-w-md md:justify-end">
                {gestures.map((g) => (
                  <li key={g} className="rounded-full bg-tint/[0.06] px-3.5 py-1.5 text-[13px] text-fg/85">
                    {g}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* FONCTIONNEMENT */}
        <section className="border-t border-line bg-ink-2">
          <div className={`${container} ${section}`}>
            <SectionHeading
              id="fonctionnement"
              eyebrow="En classe"
              title={
                <>
                  Un TP de chimie, <span className="text-mist">geste après geste.</span>
                </>
              }
            />
            <ol className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {steps.map((s, i) => (
                <Reveal as="li" key={s.n} delay={i * 60} className="border-t border-line pt-6">
                  <span className="font-mono text-[13px] text-cyan">{s.n}</span>
                  <h3 className="h-item mt-3">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-mist">{s.text}</p>
                </Reveal>
              ))}
            </ol>

            {/* Comparatif */}
            <Reveal className="mt-28">
              <h3 className="font-display text-[1.5rem] font-semibold tracking-[-0.02em] sm:text-[1.75rem]">
                Laboratoire traditionnel ou Mx Chimie ?
              </h3>
            </Reveal>
            <Reveal className="surface mt-8 overflow-hidden">
              <table className="w-full text-left text-[15px]">
                <caption className="sr-only">Comparatif entre un laboratoire traditionnel et Mx Chimie</caption>
                <thead className="hidden md:table-header-group">
                  <tr className="border-b border-line text-[13px] text-mist">
                    <th scope="col" className="w-[22%] px-6 py-4 font-medium">
                      <span className="sr-only">Critère</span>
                    </th>
                    <th scope="col" className="px-6 py-4 font-medium">Laboratoire traditionnel</th>
                    <th scope="col" className="px-6 py-4 font-medium text-fg">Mx Chimie</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((c) => (
                    <tr key={c.label} className="grid gap-1.5 border-b border-line px-6 py-5 last:border-b-0 md:table-row md:p-0">
                      <th scope="row" className="font-display font-semibold md:px-6 md:py-5">
                        {c.label}
                      </th>
                      <td className="text-mist md:px-6 md:py-5">
                        <span className="md:hidden">Traditionnel : </span>
                        {c.trad}
                      </td>
                      <td className="text-fg md:px-6 md:py-5">
                        <span className="flex items-start gap-2.5">
                          <I.check className="mt-1 h-3.5 w-3.5 shrink-0 text-cyan" /> {c.mx}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          </div>
        </section>

        {/* OFFRE */}
        <section className="border-t border-line">
          <div className={`${container} ${section}`}>
            <SectionHeading
              id="offre"
              eyebrow="L'offre"
              title={
                <>
                  Un abonnement simple. <span className="text-mist">Tout compris.</span>
                </>
              }
              text="Matériel et logiciel réunis dans un seul abonnement annuel. Démarrez avec quelques casques et faites grandir votre parc au rythme de votre établissement."
            />
            <div className="mt-16 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
              <Reveal className="surface flex flex-col p-6 sm:p-8">
                <p className="eyebrow">Pack casque</p>
                <p className="mt-5 font-display text-[3rem] font-semibold leading-none tracking-[-0.035em] sm:text-[3.5rem]">
                  400 000
                  <span className="ml-2 text-lg font-medium tracking-normal text-mist">FCFA</span>
                </p>
                <p className="mt-3 text-[15px] text-mist">par casque et par an · environ 650 $</p>
                <ul className="mt-8 divide-y divide-line border-y border-line">
                  {included.map((t) => (
                    <li key={t} className="flex items-center gap-3 py-3 text-[15px]">
                      <I.check className="h-3.5 w-3.5 shrink-0 text-cyan" />
                      <span className="text-fg/90">{t}</span>
                    </li>
                  ))}
                </ul>
                <a href="#contact" data-track="Offre : obtenir un devis" className="btn btn-primary mt-8 w-full">
                  Obtenir un devis
                </a>
              </Reveal>
              <Reveal delay={80}>
                <PricingCalculator />
              </Reveal>
            </div>

            {/* Déploiement */}
            <div className="mt-28">
              <Reveal className="max-w-2xl">
                <h3 className="font-display text-[1.5rem] font-semibold tracking-[-0.02em] sm:text-[1.75rem]">
                  De la démo au déploiement
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-mist">
                  Nous construisons la confiance sur des preuves : résultats des pilotes, retours des enseignants et engagement des
                  élèves.
                </p>
              </Reveal>
              <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                {deployment.map((d, i) => (
                  <Reveal as="li" key={d.title} delay={i * 60} className="border-t border-line pt-6">
                    <span className="font-mono text-[13px] text-mist">Étape {i + 1}</span>
                    <h4 className="h-item mt-3">{d.title}</h4>
                    <p className="mt-2 text-[15px] leading-relaxed text-mist">{d.text}</p>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="border-t border-line bg-ink-2">
          <div className={`${container} ${section} grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16`}>
            <div>
              <SectionHeading
                id="contact"
              eyebrow="Contact"
                title={
                  <>
                    Voyez Mx Chimie <span className="text-mist">dans votre école.</span>
                  </>
                }
                text="Direction d'établissement, enseignant de chimie, ministère ou réseau d'écoles : organisons une démonstration en direct ou un déploiement pilote."
              />
              <Reveal className="mt-10 space-y-1 text-[15px]">
                <a href={`mailto:${CONTACT_EMAIL}`} className="block text-fg underline-offset-4 hover:underline">
                  {CONTACT_EMAIL}
                </a>
                <p className="text-mist">Côte d&apos;Ivoire</p>
              </Reveal>
            </div>
            <Reveal delay={80}>
              <ContactForm />
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className={`${container} grid gap-8 py-12 md:grid-cols-[1.4fr_1fr] md:items-start`}>
          <div>
            <div className="flex items-center gap-2">
              <Image src="/mark.png" alt="" width={24} height={24} />
              <span className="font-display text-[15px] font-bold tracking-tight">
                Mx <span className="text-gradient">Chimie</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-[14px] text-mist">
              Le laboratoire devient virtuel, l&apos;expérience devient réelle, et la science devient accessible à tous.
            </p>
          </div>
          <nav aria-label="Pied de page">
            <ul className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-[14px]">
              {[
                ["#plateforme", "Plateforme"],
                ["#fonctionnement", "Fonctionnement"],
                ["#offre", "Offre"],
                ["#contact", "Contact"],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="text-mist transition-colors hover:text-fg">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className={`${container} border-t border-line py-6`}>
          <p className="text-[13px] text-mist/80">© 2026 Mx Chimie. Tous droits réservés.</p>
        </div>
      </footer>
    </>
  );
}
