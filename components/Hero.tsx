"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { createFluidReveal } from "./fluidSim";

const N = 14;
const CHAIN_COUNT = 2; // imlece sıkı bağlı, gerilip esneyen manyetik kuyruk
const FLING_COUNT = 7; // hızlı hareket edince koparıp fırlattığı bağımsız damlalar
const TOTAL_PATHS = 1 + CHAIN_COUNT + FLING_COUNT;

/**
 * Mürekkep lekesi: çok oktavlı gürültü + hareket yönünde uzama.
 * vx/vy = hız vektörü; leke akış yönünde saçaklanıp uzar, durunca toparlanır.
 * WebGL sıvı simülasyonu desteklenmeyen tarayıcılar/mobil için yedek mekanizma.
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
  const speed = Math.min(1, Math.hypot(vx, vy) / 20);
  const va = Math.atan2(vy, vx);
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const wob =
      Math.sin(t * 0.0018 + i * 1.7 + phase) * 0.5 +
      Math.sin(t * 0.0029 + i * 3.1 + phase * 2.3) * 0.36 +
      Math.sin(t * 0.0047 + i * 5.3 + phase * 0.7) * 0.3;
    const along = Math.cos(a - va);
    const smear = speed * (0.7 * Math.max(0, along) ** 2 + 0.26 * Math.sin(i * 2.7 + t * 0.006));
    const rr = r * (1 + 0.34 * wob + smear);
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

/** 01 · COLD OPEN — WebGL sıvı simülasyonuyla açığa çıkan materyal + ZEHRA. */
export default function Hero() {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const backRef = useRef<HTMLDivElement>(null);
  const clipLayerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Headline satır reveal (loader bittikten hemen sonra)
    const spans = headlineRef.current?.querySelectorAll(".line-mask > span");
    if (spans && !reduced) {
      gsap.to(spans, {
        y: 0,
        duration: 1,
        stagger: 0.12,
        delay: 1.7,
        ease: "power3.out",
      });
    }
    if (reduced) return;

    // Malzeme döngüsü (mobil CSS gradyan sürümü için)
    const mats = backRef.current?.querySelectorAll(".hero-back-word");
    let mi = 0;
    const cycle = setInterval(() => {
      if (!mats || mats.length === 0) return;
      mats[mi].classList.remove("active");
      mi = (mi + 1) % mats.length;
      mats[mi].classList.add("active");
    }, 3500);

    // Masaüstünde gerçek WebGL sıvı simülasyonunu dene; başarılı olursa
    // SVG-blob mekanizmasını tamamen devre dışı bırakır.
    let fluidCleanup: (() => void) | undefined;
    if (window.matchMedia("(min-width: 768px)").matches) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (canvas && video) {
        video.src = "/hero-materials.mp4";
        const fluid = createFluidReveal(canvas, video, {
          simResolution: 128,
          dyeResolution: 1024,
          densityDissipation: 0.995,
          velocityDissipation: 0.9,
          pressureIterations: 5,
          splatRadius: 1 / window.innerHeight,
          distortion: 6,
        });
        if (fluid) {
          canvas.style.display = "block";
          if (clipLayerRef.current) clipLayerRef.current.style.display = "none";
          fluidCleanup = fluid.destroy;
        }
      }
    }

    if (fluidCleanup) {
      clearInterval(cycle);
      return () => fluidCleanup!();
    }

    // ── Yedek: manyetik mürekkep imleci (WebGL yoksa / mobilde) ──
    let W = innerWidth, H = innerHeight;
    let tx = W / 2, ty = H / 2, x = tx, y = ty;
    let px = x, py = y;

    const chain = [
      { x, y, px: x, py: y, tau: 0.1, scale: 0.66, phase: 2.1 },
      { x, y, px: x, py: y, tau: 0.2, scale: 0.4, phase: 4.4 },
    ];
    const flings: {
      active: boolean; x: number; y: number; vx: number; vy: number;
      born: number; life: number; scale0: number; phase: number;
    }[] = Array.from({ length: FLING_COUNT }, () => ({
      active: false, x: 0, y: 0, vx: 0, vy: 0, born: 0, life: 0, scale0: 0, phase: 0,
    }));
    let flingCooldown = 0;

    let raf = 0;
    let lastFrameT = performance.now();
    const start = performance.now();
    const MAIN_TAU = 0.4;

    const onResize = () => { W = innerWidth; H = innerHeight; };
    const onMouse = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY; };
    const onTouch = (e: TouchEvent) => {
      tx = e.touches[0].clientX; ty = e.touches[0].clientY;
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - lastFrameT) / 1000);
      lastFrameT = now;
      const t = now - start;

      const mainFollow = 1 - Math.exp(-dt / MAIN_TAU);
      px = x; py = y;
      x += (tx - x) * mainFollow;
      y += (ty - y) * mainFollow;
      const mvx = dt > 0 ? (x - px) / dt : 0;
      const mvy = dt > 0 ? (y - py) / dt : 0;
      const mainSpeed = Math.hypot(mvx, mvy);

      const base = Math.min(W, H) * 0.144;
      const grow = Math.min(1, t / 1600);
      const r = base * grow * (1 + 0.07 * Math.sin(t * 0.0019));

      pathRefs.current[0]?.setAttribute("d", blobPath(x, y, r, t, 0, x - px, y - py));

      let lx = x, ly = y;
      chain.forEach((d, i) => {
        const follow = 1 - Math.exp(-dt / d.tau);
        d.px = d.x; d.py = d.y;
        d.x += (lx - d.x) * follow;
        d.y += (ly - d.y) * follow;
        pathRefs.current[1 + i]?.setAttribute(
          "d",
          blobPath(d.x, d.y, r * d.scale, t, d.phase, d.x - d.px, d.y - d.py)
        );
        lx = d.x; ly = d.y;
      });

      flingCooldown -= dt;
      if (mainSpeed > 900 && flingCooldown <= 0) {
        const slot = flings.find((f) => !f.active);
        if (slot) {
          const jitter = (Math.random() - 0.5) * 0.9;
          slot.active = true;
          slot.x = x; slot.y = y;
          slot.vx = -mvx * (0.25 + Math.random() * 0.25) + (Math.random() - 0.5) * 60;
          slot.vy = -mvy * (0.25 + Math.random() * 0.25) + (Math.random() - 0.5) * 60 + jitter * 30;
          slot.born = now;
          slot.life = 0.5 + Math.random() * 0.45;
          slot.scale0 = 0.05 + Math.random() * 0.13;
          slot.phase = Math.random() * 10;
        }
        flingCooldown = 0.045 + Math.random() * 0.05;
      }

      flings.forEach((f, i) => {
        const ref = pathRefs.current[1 + CHAIN_COUNT + i];
        if (!f.active) {
          ref?.setAttribute("d", "");
          return;
        }
        const age = (now - f.born) / 1000;
        if (age >= f.life) {
          f.active = false;
          ref?.setAttribute("d", "");
          return;
        }
        const decay = Math.pow(0.05, dt);
        f.vx *= decay; f.vy *= decay;
        f.x += f.vx * dt; f.y += f.vy * dt;
        const p = age / f.life;
        const scale = f.scale0 * (1 - p * p);
        ref?.setAttribute("d", blobPath(f.x, f.y, r * scale, t, f.phase, f.vx, f.vy));
      });

      raf = requestAnimationFrame(frame);
    };

    addEventListener("resize", onResize);
    addEventListener("mousemove", onMouse);
    addEventListener("touchmove", onTouch, { passive: true });
    raf = requestAnimationFrame(frame);

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

      {/* WebGL sıvı simülasyonu: kendi alfa kanalıyla açığa çıkarır, clip-path
          gerekmez. Yalnızca masaüstünde ve destekleniyorsa devreye girer. */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ display: "none" }}
        aria-hidden
      />
      <video
        ref={videoRef}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />

      {/* Yedek katman: SVG-blob clip-path (WebGL yoksa / mobilde).
          md+: materyal videosu. Mobil: CSS gradyan malzemeler. */}
      <div
        ref={clipLayerRef}
        className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] md:bg-[#e8e8e8]"
        style={{ clipPath: "url(#blobClip)" }}
        aria-hidden
      >
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
            {Array.from({ length: TOTAL_PATHS }, (_, i) => (
              <path key={i} ref={(el) => { pathRefs.current[i] = el; }} d="" />
            ))}
          </clipPath>
        </defs>
      </svg>

      <style>{`@keyframes scrollhint { 0% { transform: translateY(-100%);} 100% { transform: translateY(300%);} }`}</style>
    </section>
  );
}
