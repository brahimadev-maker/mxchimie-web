import type { Metadata } from "next";
import Admin from "./Admin";

export const metadata: Metadata = {
  title: "Administration | Mx Chimie",
  robots: { index: false, follow: false },
};

export default function AdministrateurPage() {
  return <Admin />;
}
