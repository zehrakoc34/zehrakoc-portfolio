import type { Metadata } from "next";
import Work from "@/components/Work";

export const metadata: Metadata = {
  title: "Work — Zehra Koç",
  description: "Selected motion design and AI-assisted production work by Zehra Koç.",
};

export default function WorkPage() {
  return <Work />;
}
