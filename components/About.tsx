"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import FlyText from "./FlyText";

gsap.registerPlugin(ScrollTrigger);

/** 05 · PORTRAIT — kısa, insan gibi hikâye. */
export default function About() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".portrait-frame",
        { clipPath: "inset(100% 0 0 0)" },
        {
          clipPath: "inset(0% 0 0 0)",
          duration: 1.2,
          ease: "power3.inOut",
          scrollTrigger: { trigger: rootRef.current, start: "top 70%" },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      data-scene="05 · PORTRAIT"
      className="bg-[#fafafa] px-7 py-28 md:px-10 md:py-40"
    >
      <span
        className="text-[10px] tracking-[0.3em] text-[#8a8a8a]"
        style={{ fontFamily: "var(--font-plex-mono)" }}
      >
        05 — ABOUT
      </span>

      <div className="mt-14 grid items-start gap-14 md:grid-cols-[2fr_3fr] md:gap-24">
        <div className="portrait-frame grain relative aspect-[4/5] overflow-hidden bg-[#111]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/zehra-portrait.jpg"
            alt="Zehra Koç — portrait"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
          <span
            className="absolute bottom-4 left-4 text-[9px] tracking-[0.3em] text-white/70 mix-blend-difference"
            style={{ fontFamily: "var(--font-plex-mono)" }}
          >
            ZEHRA KOÇ · PORTRAIT
          </span>
        </div>

        <div>
          <h2 className="text-[clamp(2rem,4vw,3.6rem)] font-semibold leading-[1.05] tracking-tight">
            <FlyText
              as="span"
              text="Fourteen years of making things "
              className="inline-block"
              reverse
              order="ltr"
              windAngle={20}
              windStrength={260}
              scatter={60}
              maxRotation={140}
              depth={80}
            />
            <FlyText
              as="span"
              text="move."
              className="inline-block font-normal"
              style={{ fontFamily: "var(--font-instrument)" }}
              reverse
              order="ltr"
              windAngle={20}
              windStrength={260}
              scatter={60}
              maxRotation={140}
              depth={80}
            />
          </h2>

          <div className="mt-8 max-w-xl space-y-5 text-[16px] leading-relaxed text-[#444]">
            <FlyText
              as="p"
              text="I started on a timeline with two tracks and a deadline. Since then I've made motion graphics, commercial films, corporate stories and social campaigns for brands that needed people to feel something in eight seconds or less."
              reverse
              order="ltr"
              windAngle={15}
              windStrength={90}
              scatter={24}
              maxRotation={40}
              depth={40}
              stagger={0.7}
            />
            <FlyText
              as="p"
              text="Today my studio has a second brain: generative AI. I write, storyboard, animate and grade alongside tools that never sleep — which mostly means I get to spend my hours on the part that matters: the idea."
              reverse
              order="ltr"
              windAngle={15}
              windStrength={90}
              scatter={24}
              maxRotation={40}
              depth={40}
              stagger={0.7}
            />
            <FlyText
              as="p"
              text="“Good motion isn't decoration. It's direction.”"
              className="text-[20px] italic text-[#111]"
              style={{ fontFamily: "var(--font-instrument)" }}
              reverse
              order="ltr"
              windAngle={20}
              windStrength={200}
              scatter={50}
              maxRotation={120}
              depth={70}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
