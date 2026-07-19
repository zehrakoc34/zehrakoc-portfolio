"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* Gerçek işler gelene kadar dürüst placeholder'lar: tür adları, uydurma marka yok. */
const PROJECTS = [
  {
    index: "01",
    title: "Brand Film",
    kind: "Corporate storytelling",
    year: "2025",
    layers: [
      "radial-gradient(120% 90% at 20% 110%, rgba(255,171,64,0.9) 0%, rgba(255,171,64,0) 55%)",
      "radial-gradient(130% 100% at 85% -10%, rgba(0,109,119,0.95) 0%, rgba(0,20,26,1) 70%)",
    ],
  },
  {
    index: "02",
    title: "AI Production",
    kind: "Generative campaign",
    year: "2026",
    layers: [
      "radial-gradient(110% 90% at 80% 100%, rgba(255,45,120,0.85) 0%, rgba(255,45,120,0) 60%)",
      "radial-gradient(140% 110% at 10% 0%, rgba(90,24,154,0.9) 0%, rgba(10,4,20,1) 75%)",
    ],
  },
  {
    index: "03",
    title: "Title Sequence",
    kind: "Broadcast identity",
    year: "2024",
    layers: [
      "radial-gradient(100% 80% at 50% 120%, rgba(255,59,48,0.85) 0%, rgba(255,59,48,0) 55%)",
      "radial-gradient(120% 100% at 50% -20%, rgba(40,40,40,1) 0%, rgba(8,8,8,1) 70%)",
    ],
  },
  {
    index: "04",
    title: "Social Motion",
    kind: "Vertical campaign system",
    year: "2025",
    layers: [
      "radial-gradient(120% 100% at 15% -10%, rgba(72,149,239,0.9) 0%, rgba(72,149,239,0) 60%)",
      "radial-gradient(130% 110% at 90% 110%, rgba(10,20,60,1) 0%, rgba(4,6,16,1) 75%)",
    ],
  },
];

/** 02 · SCENES — editorial iş vitrini. */
export default function Work() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".work-card").forEach((card) => {
        gsap.fromTo(
          card.querySelector(".work-poster"),
          { clipPath: "inset(0 0 100% 0)" },
          {
            clipPath: "inset(0 0 0% 0)",
            duration: 1.1,
            ease: "power3.inOut",
            scrollTrigger: { trigger: card, start: "top 78%" },
          }
        );
        gsap.fromTo(
          card.querySelectorAll(".work-meta"),
          { y: 24, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.8,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 70%" },
          }
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      data-scene="02 · SCENES"
      className="relative bg-[#0c0c0c] px-7 py-28 text-[#fafafa] md:px-10 md:py-40"
    >
      <div className="mb-20 flex items-end justify-between md:mb-28">
        <h2 className="text-[clamp(2.2rem,6vw,5rem)] font-semibold leading-none tracking-tight">
          Selected{" "}
          <em className="font-normal" style={{ fontFamily: "var(--font-instrument)" }}>
            Work
          </em>
        </h2>
        <span
          className="hidden text-[10px] tracking-[0.3em] text-white/40 md:block"
          style={{ fontFamily: "var(--font-plex-mono)" }}
        >
          02 — SELECTED WORK
        </span>
      </div>

      <div className="flex flex-col gap-24 md:gap-36">
        {PROJECTS.map((p, i) => (
          <article
            key={p.index}
            className={`work-card group w-full md:w-[72%] ${i % 2 === 1 ? "md:self-end" : ""}`}
            data-cursor="play"
          >
            <div className="work-poster grain relative aspect-video overflow-hidden bg-[#111]">
              <div
                className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                style={{ backgroundImage: p.layers.join(", ") }}
              />
              <span
                className="absolute -bottom-8 right-4 select-none text-[9rem] leading-none text-white/[0.07] md:text-[13rem]"
                style={{ fontFamily: "var(--font-archivo-black)" }}
              >
                {p.index}
              </span>
              <span
                className="absolute left-4 top-4 text-[9px] tracking-[0.3em] text-white/50"
                style={{ fontFamily: "var(--font-plex-mono)" }}
              >
                SCENE {p.index} · 16:9 · 24FPS
              </span>
              {/* Hover scrub bar */}
              <span className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-[#ff3b30] transition-transform duration-[1.4s] ease-out group-hover:scale-x-100" />
            </div>

            <div className="mt-5 flex items-baseline justify-between gap-6">
              <h3 className="work-meta text-2xl font-semibold tracking-tight md:text-3xl">
                {p.title}
              </h3>
              <div className="work-meta flex items-baseline gap-6 text-right">
                <span className="text-sm text-white/50">{p.kind}</span>
                <span
                  className="text-[10px] tracking-[0.25em] text-white/40"
                  style={{ fontFamily: "var(--font-plex-mono)" }}
                >
                  {p.year}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-24 text-sm text-white/40 md:mt-32">
        Full case studies are being prepared.{" "}
        <em style={{ fontFamily: "var(--font-instrument)" }}>The reel is on its way.</em>
      </p>
    </section>
  );
}
