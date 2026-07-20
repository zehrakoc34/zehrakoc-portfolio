import type { Metadata } from "next";
import Contact from "@/components/Contact";

export const metadata: Metadata = {
  title: "Contact — Zehra Koç",
  description: "Get in touch with Zehra Koç for motion design and AI creative production work.",
};

export default function ContactPage() {
  return <Contact />;
}
