import type { Metadata, Viewport } from "next";
import { Inter, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], weight: ["600", "700", "800"] });
const mono = JetBrains_Mono({ variable: "--font-mono-jb", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Mx Chimie | Le laboratoire de chimie en réalité mixte",
  description:
    "Mx Chimie immerge les élèves dans des laboratoires de chimie virtuels pilotés par l'IA. Casque de réalité mixte + plateforme, 400 000 FCFA par casque et par an. Pensé pour les écoles d'Afrique.",
  openGraph: {
    title: "Mx Chimie | Le laboratoire de chimie en réalité mixte",
    description:
      "Le laboratoire devient virtuel, l'expérience devient réelle, et la science devient accessible à tous.",
    images: ["/logo.png"],
    locale: "fr_CI",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f8fc",
};

// Thème clair par défaut ; le choix du visiteur est mémorisé. Appliqué avant l'affichage pour éviter un flash.
const themeScript = `(function(){var d=document.documentElement;d.classList.add('js');var t='light';try{var s=localStorage.getItem('theme');if(s==='dark'||s==='light')t=s}catch(e){}d.dataset.theme=t})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} ${sora.variable} ${mono.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
