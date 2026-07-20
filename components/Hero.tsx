"use client";

import { useEffect, useRef } from "react";

const N = 14;
const CHAIN_COUNT = 2; // imlece sıkı bağlı, gerilip esneyen manyetik kuyruk
const FLING_COUNT = 7; // hızlı hareket edince koparıp fırlattığı bağımsız damlalar
const TOTAL_PATHS = 1 + CHAIN_COUNT + FLING_COUNT;

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
  const speed = Math.min(1, Math.hypot(vx, vy) / 20);
  const va = Math.atan2(vy, vx);
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const wob =
      Math.sin(t * 0.0018 + i * 1.7 + phase) * 0.5 +
      Math.sin(t * 0.0029 + i * 3.1 + phase * 2.3) * 0.36 +
      Math.sin(t * 0.0047 + i * 5.3 + phase * 0.7) * 0.3;
    // Akış yönünde uzama + saçak: hız yönüne bakan noktalar dışarı taşar
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

/** 01 · COLD OPEN — liquid mask ZEHRA + headline. */
export default function Hero() {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const backRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Manyetik mürekkep imleci: ana leke + imlece sıkı bağlı esnek kuyruk
    // (chain) + hızlı harekette koparıp fırlattığı, küçülüp kaybolan
    // bağımsız damlalar (fling pool).
    let W = innerWidth, H = innerHeight;
    let tx = W / 2, ty = H / 2, x = tx, y = ty;
    let px = x, py = y;

    // Sıkı manyetik kuyruk: imleci hızla izler, gerilip esner (koparmaz).
    const chain = [
      { x, y, px: x, py: y, tau: 0.1, scale: 0.66, phase: 2.1 },
      { x, y, px: x, py: y, tau: 0.2, scale: 0.4, phase: 4.4 },
    ];

    // Fırlatılan damla havuzu: sabit sayıda slot, ihtiyaç oldukça yeniden kullanılır.
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
    const MAIN_TAU = 0.4; // "hafıza": imleç durursa leke bu sürede yakalar/durur

    const onResize = () => { W = innerWidth; H = innerHeight; };
    const onMouse = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY; };
    const onTouch = (e: TouchEvent) => {
      tx = e.touches[0].clientX; ty = e.touches[0].clientY;
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - lastFrameT) / 1000);
      lastFrameT = now;
      const t = now - start;

      // Frame-rate bağımsız exponential smoothing: yalnızca imleci takip eder,
      // kendi kendine gezinme yok.
      const mainFollow = 1 - Math.exp(-dt / MAIN_TAU);
      px = x; py = y;
      x += (tx - x) * mainFollow;
      y += (ty - y) * mainFollow;
      const mvx = dt > 0 ? (x - px) / dt : 0;
      const mvy = dt > 0 ? (y - py) / dt : 0;
      const mainSpeed = Math.hypot(mvx, mvy);

      const base = Math.min(W, H) * 0.144; // %40 küçültüldü (0.24 → 0.144)
      const grow = Math.min(1, t / 1600);
      const r = base * grow * (1 + 0.07 * Math.sin(t * 0.0019));

      pathRefs.current[0]?.setAttribute("d", blobPath(x, y, r, t, 0, x - px, y - py));

      // Sıkı kuyruk: manyetik gibi imleci gerile gerile takip eder
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

      // Hızlı harekette mürekkep damlası koparıp fırlat
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
        const decay = Math.pow(0.05, dt); // sürtünme: hız hızla söner
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
      {/* Ön katman: beyaz zemin, tanıtım görseli (tam ekranın %80'i) */}
      <div className="absolute inset-[10%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-intro.jpg"
          alt="Hi, I'm Zehra Koç — Motion Designer, AI Creative Producer"
          className="h-full w-full select-none object-cover object-[68%_center] md:object-center"
          draggable={false}
        />
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
