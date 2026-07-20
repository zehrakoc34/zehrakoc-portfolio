import type { Metadata } from "next";
import Process from "@/components/Process";
import AiSection from "@/components/AiSection";
import About from "@/components/About";
import Toolkit from "@/components/Toolkit";
import Credits from "@/components/Credits";

export const metadata: Metadata = {
  title: "About — Zehra Koç",
  description: "Fourteen years of motion design, creative process, AI workflow, and career timeline.",
};

export default function AboutPage() {
  return (
    <>
      <About />
      <Process />
      <AiSection />
      <Toolkit />
      <Credits />
    </>
  );
}
