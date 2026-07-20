"use client";

import { useEffect, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface FlySegment {
  text: string;
  className?: string;
  style?: CSSProperties;
}

interface FlyTextProps {
  segments: FlySegment[];
  as?: "h1" | "h2" | "h3" | "p" | "blockquote" | "span";
  className?: string;
  /** char: harf harf uçarak belirir (kısa başlık/alıntı). word: kelime kelime (uzun paragraf). */
  mode?: "char" | "word";
  start?: string;
}

type Run = { className?: string; style?: CSSProperties; chars: string };

/**
 * Scroll ile görünür alana girince harf/kelime bazlı "uçarak belirme" reveal'ı.
 * Ekran okuyucular tam metni tek parça olarak alır (.visually-hidden);
 * görsel karakter/kelime span'ları aria-hidden'dır.
 */
export default function FlyText({
  segments,
  as = "span",
  className = "",
  mode = "char",
  start = "top 82%",
}: FlyTextProps) {
  const [el, setEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const unitSelector = mode === "char" ? ".fly-char" : ".fly-word";
    const units = el.querySelectorAll<HTMLElement>(unitSelector);
    if (units.length === 0) return;

    const ctx = gsap.context(() => {
      if (mode === "char") {
        gsap.fromTo(
          units,
          { autoAlpha: 0, y: 22, rotateZ: () => gsap.utils.random(-6, 6), filter: "blur(5px)" },
          {
            autoAlpha: 1,
            y: 0,
            rotateZ: 0,
            filter: "blur(0px)",
            duration: 0.65,
            stagger: 0.016,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start },
          }
        );
      } else {
        gsap.fromTo(
          units,
          { autoAlpha: 0, y: 14 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.028,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start },
          }
        );
      }
    }, el);
    return () => ctx.revert();
  }, [el, mode, start]);

  const fullText = segments.map((s) => s.text).join("");

  // Karakterleri kelimelere grupla: kelime bütünlüğü satır kırılmasında bozulmasın.
  const words: Run[][] = [[]];
  segments.forEach((seg) => {
    Array.from(seg.text).forEach((ch) => {
      if (ch === " ") {
        words.push([]);
        return;
      }
      const currentWord = words[words.length - 1];
      const last = currentWord[currentWord.length - 1];
      if (last && last.className === seg.className && last.style === seg.style) {
        last.chars += ch;
      } else {
        currentWord.push({ className: seg.className, style: seg.style, chars: ch });
      }
    });
  });

  const visual = (
    <span aria-hidden="true">
      {words.map((word, wi) => (
        <span key={wi}>
          <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {mode === "char"
              ? word.map((run, ri) =>
                  Array.from(run.chars).map((ch, ci) => (
                    <span
                      key={ri + "-" + ci}
                      className={"fly-char inline-block " + (run.className ?? "")}
                      style={run.style}
                    >
                      {ch}
                    </span>
                  ))
                )
              : (
                  <span
                    className={"fly-word inline-block " + (word[0]?.className ?? "")}
                    style={word[0]?.style}
                  >
                    {word.map((r) => r.chars).join("")}
                  </span>
                )}
          </span>
          {wi < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );

  const inner = (
    <>
      <span className="visually-hidden">{fullText}</span>
      {visual}
    </>
  );

  if (as === "h1") {
    return (
      <h1 ref={setEl} className={className}>
        {inner}
      </h1>
    );
  }
  if (as === "h2") {
    return (
      <h2 ref={setEl} className={className}>
        {inner}
      </h2>
    );
  }
  if (as === "h3") {
    return (
      <h3 ref={setEl} className={className}>
        {inner}
      </h3>
    );
  }
  if (as === "p") {
    return (
      <p ref={setEl} className={className}>
        {inner}
      </p>
    );
  }
  if (as === "blockquote") {
    return (
      <blockquote ref={setEl} className={className}>
        {inner}
      </blockquote>
    );
  }
  return (
    <span ref={setEl} className={className}>
      {inner}
    </span>
  );
}
