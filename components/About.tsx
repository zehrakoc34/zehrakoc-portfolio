"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
      gsap.fromTo(
        ".about-line",
        { y: 28, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 62%" },
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
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(120% 90% at 50% 100%, rgba(120,120,120,0.55) 0%, rgba(20,20,20,0) 60%), linear-gradient(160deg, #1c1c1c 0%, #0a0a0a 100%)",
            }}
          />
          <span
            className="absolute bottom-4 left-4 text-[9px] tracking-[0.3em] text-white/50"
            style={{ fontFamily: "var(--font-plex-mono)" }}
          >
            PORTRAIT — SOON
          </span>
        </div>

        <div>
          <h2 className="about-line text-[clamp(2rem,4vw,3.6rem)] font-semibold leading-[1.05] tracking-tight">
            Fourteen years of making things{" "}
            <em className="font-normal" style={{ fontFamily: "var(--font-instrument)" }}>
              move.
            </em>
          </h2>
          <div className="mt-8 max-w-xl space-y-5 text-[16px] leading-relaxed text-[#444]">
            <p className="about-line">
              I started on a timeline with two tracks and a deadline. Since then I&rsquo;ve made
              motion graphics, commercial films, corporate stories and social campaigns for
              brands that needed people to feel something in eight seconds or less.
            </p>
            <p className="about-line">
              Today my studio has a second brain: generative AI. I write, storyboard, animate
              and grade alongside tools that never sleep — which mostly means I get to spend my
              hours on the part that matters: the idea.
            </p>
            <p
              className="about-line text-[20px] italic text-[#111]"
              style={{ fontFamily: "var(--font-instrument)" }}
            >
              &ldquo;Good motion isn&rsquo;t decoration. It&rsquo;s direction.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
