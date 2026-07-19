"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const N = 14;

/**
 * Mürekkep lekesi: çok oktavlı gürültü + hareket yönünde uzama.
 * vx/vy = hız vektörü; leke akış yönünde saçaklanıp uzar, durunca toparlanır.
 */
function blobPath(
  cx: number,
  cy: number,
  r: number,
  t: number,
  phase: number,
  vx: number,
  vy: number
): string {
  const speed = Math.min(1, Math.hypot(vx, vy) / 28);
  const va = Math.atan2(vy, vx);
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const wob =
      Math.sin(t * 0.0013 + i * 1.7 + phase) * 0.45 +
      Math.sin(t * 0.0021 + i * 3.1 + phase * 2.3) * 0.3 +
      Math.sin(t * 0.0034 + i * 5.3 + phase * 0.7) * 0.25;
    // Akış yönünde uzama + saçak: hız yönüne bakan noktalar dışarı taşar
    const along = Math.cos(a - va);
    const smear = speed * (0.55 * Math.max(0, along) ** 2 + 0.18 * Math.sin(i * 2.7 + t * 0.004));
    const rr = r * (1 + 0.3 * wob + smear);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  let d = `M ${(pts[0][0] + pts[N - 1][0]) / 2} ${(pts[0][1] + pts[N - 1][1]) / 2}`;
  for (let i = 0; i < N; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % N];
    d += ` Q ${p[0]} ${p[1]} ${(p[0] + q[0]) / 2} ${(p[1] + q[1]) / 2}`;
  }
  return d + " Z";
}

/** 01 · COLD OPEN — liquid mask ZEHRA + headline. */
export default function Hero() {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const backRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Headline satır reveal (loader bittikten hemen sonra)
    const spans = headlineRef.current?.querySelectorAll(".line-mask > span");
    if (spans) {
      gsap.to(spans, {
        y: 0,
        duration: 1,
        stagger: 0.12,
        delay: 1.7,
        ease: "power3.out",
      });
    }

    // Liquid blob + mürekkep kuyruğu: ana leke ile onu vizkoz gecikmeyle
    // izleyen, giderek küçülen damlacıklar (her biri bir öncekini takip eder)
    let W = innerWidth, H = innerHeight;
    let tx = W / 2, ty = H / 2, x = tx, y = ty;
    let px = x, py = y;
    const drops = [
      { x, y, px: x, py: y, lerp: 0.055, scale: 0.5, phase: 2.1 },
      { x, y, px: x, py: y, lerp: 0.038, scale: 0.3, phase: 4.4 },
      { x, y, px: x, py: y, lerp: 0.026, scale: 0.16, phase: 6.2 },
    ];
    let hasPointer = false, lastMove = 0, raf = 0;
    const start = performance.now();

    const onResize = () => { W = innerWidth; H = innerHeight; };
    const onMouse = (e: MouseEvent) => {
      tx = e.clientX; ty = e.clientY; hasPointer = true; lastMove = performance.now();
    };
    const onTouch = (e: TouchEvent) => {
      tx = e.touches[0].clientX; ty = e.touches[0].clientY;
      hasPointer = true; lastMove = performance.now();
    };

    const frame = (now: number) => {
      const t = now - start;
      if (!hasPointer || now - lastMove > 4000) {
        tx = W / 2 + Math.sin(t * 0.00033) * W * 0.3;
        ty = H / 2 + Math.sin(t * 0.00047 + 1.7) * H * 0.28;
      }
      px = x; py = y;
      x += (tx - x) * 0.075;
      y += (ty - y) * 0.075;
      const base = Math.min(W, H) * 0.24;
      const grow = Math.min(1, t / 1600);
      const r = base * grow * (1 + 0.06 * Math.sin(t * 0.0016));

      pathRefs.current[0]?.setAttribute("d", blobPath(x, y, r, t, 0, x - px, y - py));

      // Damlacık zinciri: her damla bir öncekini izler → mürekkep kuyruğu
      let lx = x, ly = y;
      drops.forEach((d, i) => {
        d.px = d.x; d.py = d.y;
        d.x += (lx - d.x) * d.lerp;
        d.y += (ly - d.y) * d.lerp;
        pathRefs.current[i + 1]?.setAttribute(
          "d",
          blobPath(d.x, d.y, r * d.scale, t, d.phase, d.x - d.px, d.y - d.py)
        );
        lx = d.x; ly = d.y;
      });
      raf = requestAnimationFrame(frame);
    };

    addEventListener("resize", onResize);
    addEventListener("mousemove", onMouse);
    addEventListener("touchmove", onTouch, { passive: true });
    raf = requestAnimationFrame(frame);

    // Malzeme döngüsü
    const mats = backRef.current?.querySelectorAll(".hero-back-word");
    let mi = 0;
    const cycle = setInterval(() => {
      if (!mats || mats.length === 0) return;
      mats[mi].classList.remove("active");
      mi = (mi + 1) % mats.length;
      mats[mi].classList.add("active");
    }, 3500);

    return () => {
      removeEventListener("resize", onResize);
      removeEventListener("mousemove", onMouse);
      removeEventListener("touchmove", onTouch);
      cancelAnimationFrame(raf);
      clearInterval(cycle);
    };
  }, []);

  return (
    <section data-scene="01 · COLD OPEN" className="relative h-svh overflow-hidden bg-[#fafafa]">
      {/* Ön katman: beyaz zemin, siyah yazı */}
      <div className="absolute inset-0 flex items-center justify-center">
        <h1 className="hero-word text-[#111]">ZEHRA</h1>
      </div>

      {/* Arka katman: liquid clip-path ile görünür.
          md+: Zehra'nın materyal dönüşüm videosu (beyaz stüdyo fonlu).
          Mobil: 16:9 video dikey ekranda kırpıldığı için CSS gradyan malzemeler. */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] md:bg-[#e8e8e8]"
        style={{ clipPath: "url(#blobClip)" }}
        aria-hidden
      >
        <video
          className="absolute inset-0 hidden h-full w-full object-cover md:block"
          src="/hero-materials.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <div ref={backRef} className="relative md:hidden">
          <span className="hero-word invisible relative block">ZEHRA</span>
          <span className="hero-word hero-back-word mat-foil active">ZEHRA</span>
          <span className="hero-word hero-back-word mat-chrome">ZEHRA</span>
          <span className="hero-word hero-back-word mat-gold">ZEHRA</span>
        </div>
      </div>

      {/* Üst bant */}
      <header className="absolute left-7 top-6 z-10 md:left-10">
        <p className="text-[13px] font-medium leading-snug tracking-wide">
          Zehra Koç
          <span className="block text-[11px] text-[#8a8a8a]">
            Senior Motion Designer · AI Creative Producer
          </span>
        </p>
      </header>

      {/* Headline */}
      <h2
        ref={headlineRef}
        className="absolute bottom-20 left-7 z-10 text-[clamp(1.6rem,3.4vw,3rem)] leading-[1.15] md:bottom-24 md:left-10"
        style={{ fontFamily: "var(--font-instrument)" }}
      >
        <span className="line-mask">
          <span>I don&rsquo;t edit video.</span>
        </span>
        <span className="line-mask">
          <span className="italic text-[#8a8a8a]">I direct attention.</span>
        </span>
      </h2>

      {/* Scroll göstergesi */}
      <div className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex">
        <span
          className="text-[9px] tracking-[0.35em] text-[#8a8a8a]"
          style={{ fontFamily: "var(--font-plex-mono)" }}
        >
          SCROLL
        </span>
        <span className="relative block h-10 w-px overflow-hidden bg-[#111]/15">
          <span className="absolute left-0 top-0 h-4 w-px animate-[scrollhint_1.8s_ease-in-out_infinite] bg-[#111]" />
        </span>
      </div>

      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <clipPath id="blobClip" clipPathUnits="userSpaceOnUse">
            <path ref={(el) => { pathRefs.current[0] = el; }} d="" />
            <path ref={(el) => { pathRefs.current[1] = el; }} d="" />
            <path ref={(el) => { pathRefs.current[2] = el; }} d="" />
            <path ref={(el) => { pathRefs.current[3] = el; }} d="" />
          </clipPath>
        </defs>
      </svg>

      <style>{`@keyframes scrollhint { 0% { transform: translateY(-100%);} 100% { transform: translateY(300%);} }`}</style>
    </section>
  );
}
