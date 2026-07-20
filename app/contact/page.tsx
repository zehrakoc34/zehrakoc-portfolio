import type { Metadata } from "next";
import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata: Metadata = {
  title: "Contact — Zehra Koç",
  description: "Get in touch with Zehra Koç for motion design and AI creative production work.",
};

export default function ContactPage() {
  return <PlaceholderPage label="CONTACT" title="Contact" />;
}
