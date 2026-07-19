import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import Loader from "@/components/Loader";
import Hud from "@/components/Hud";
import Hero from "@/components/Hero";
import Work from "@/components/Work";
import Process from "@/components/Process";
import AiSection from "@/components/AiSection";
import About from "@/components/About";
import Toolkit from "@/components/Toolkit";
import Credits from "@/components/Credits";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <SmoothScroll>
      <Loader />
      <Cursor />
      <Hud />
      <main>
        <Hero />
        <Work />
        <Process />
        <AiSection />
        <About />
        <Toolkit />
        <Credits />
        <Contact />
      </main>
    </SmoothScroll>
  );
}
