"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  { n: "01", name: "Research", line: "Listen first. Every brand has a rhythm." },
  { n: "02", name: "Concept", line: "One idea, sharpened until it cuts." },
  { n: "03", name: "Storyboard", line: "The film exists on paper before pixels." },
  { n: "04", name: "Design", line: "Frames built like posters." },
  { n: "05", name: "Animation", line: "Timing is the writing." },
  { n: "06", name: "Delivery", line: "Every format, every platform, on time." },
];

/**
 * 03 · THE EDIT — süreç bir kurgu programı zaman çizelgesi gibi:
 * masaüstünde bölüm pin'lenir, kırmızı playhead scroll ile kliplerin üzerinden geçer.
 * Mobilde sade dikey liste.
 */
export default function Process() {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(min-width: 768px)").matches) {
      // Mobil: sadece reveal
      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>(".clip").forEach((el) => {
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 30 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.7,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 85%" },
            }
          );
        });
      }, rootRef);
      return () => ctx.revert();
    }

    const ctx = gsap.context(() => {
      const track = trackRef.current!;
      // Playhead ekran ortasında sabit; track altından kayar. Son klibin sağ
      // kenarı playhead'i geçene kadar kaydır (pl-[50vw] + içerik − 50vw − pr).
      const getX = () => -(track.scrollWidth - innerWidth * 0.5 - 96);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: () => `+=${-getX() + 400}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
      tl.to(track, { x: getX, ease: "none" });

      // Playhead'in altından geçen klip aktifleşir
      gsap.utils.toArray<HTMLElement>(".clip").forEach((clip) => {
        ScrollTrigger.create({
          trigger: clip,
          containerAnimation: tl,
          start: "left 50%",
          end: "right 50%",
          onToggle: (self) => clip.classList.toggle("clip-active", self.isActive),
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      data-scene="03 · THE EDIT"
      className="relative overflow-hidden bg-[#fafafa] py-28 md:h-svh md:py-0"
    >
      <div className="px-7 pt-0 md:px-10 md:pt-24">
        <span
          className="text-[10px] tracking-[0.3em] text-[#8a8a8a]"
          style={{ fontFamily: "var(--font-plex-mono)" }}
        >
          03 — CREATIVE PROCESS
        </span>
        <h2 className="mt-4 max-w-3xl text-[clamp(2rem,4.5vw,3.8rem)] font-semibold leading-[1.05] tracking-tight">
          How ideas become{" "}
          <em className="font-normal" style={{ fontFamily: "var(--font-instrument)" }}>
            motion.
          </em>
        </h2>
      </div>

      {/* Playhead (yalnız masaüstü) */}
      <div
        ref={headRef}
        aria-hidden
        className="absolute top-[46%] z-10 hidden h-[38%] w-[2px] -translate-x-1/2 bg-[#ff3b30] md:block"
        style={{ left: "50%" }}
      >
        <span className="absolute -top-6 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-[#ff3b30]" />
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="mt-16 flex flex-col gap-6 px-7 md:mt-[14svh] md:flex-row md:gap-8 md:pl-[50vw] md:pr-24 md:will-change-transform"
      >
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="clip relative flex w-full shrink-0 flex-col justify-between border border-[#111]/12 bg-white p-6 transition-colors duration-500 md:h-[34svh] md:w-[340px] [&.clip-active]:border-[#ff3b30] [&.clip-active]:bg-[#0c0c0c] [&.clip-active]:text-[#fafafa]"
          >
            <span
              className="text-[10px] tracking-[0.3em] opacity-50"
              style={{ fontFamily: "var(--font-plex-mono)" }}
            >
              CLIP {s.n}
            </span>
            <div className="mt-10 md:mt-0">
              <h3 className="text-2xl font-semibold tracking-tight">{s.name}</h3>
              <p
                className="mt-2 text-[15px] italic opacity-60"
                style={{ fontFamily: "var(--font-instrument)" }}
              >
                {s.line}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
