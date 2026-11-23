/**
 * Ilustrasi gunung berlapis buatan sendiri (SVG, tanpa gambar eksternal).
 * Bentuk dibuat dari daftar puncak; efek "lukisan" berasal dari filter
 * SVG (distorsi + bintik warna). Ubah warna di objek LAYERS di bawah.
 */

const W = 1600;
const H = 900;

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export type Peak = { x: number; h: number; l: number; r: number };

export function profile(peaks: Peak[], x: number) {
  let top = 0;
  for (const p of peaks) {
    const d = x - p.x;
    const t = 1 - Math.abs(d) / (d < 0 ? p.l : p.r);
    if (t > 0) top = Math.max(top, p.h * Math.pow(t, 0.92));
  }
  return top;
}

export function ridgePath(peaks: Peak[], base: number, jag: number, seed: number) {
  const r = rng(seed);
  const xs = new Set<number>();
  for (let x = -40; x <= W + 40; x += 14) xs.add(x);
  for (const p of peaks) xs.add(p.x);
  const pts = [...xs].sort((a, b) => a - b).map((x) => {
    const h = profile(peaks, x);
    const isApex = peaks.some((p) => p.x === x);
    const n = isApex ? 0 : (r() - 0.5) * jag * (h > 4 ? 1 : 0.25);
    return `${x} ${(base - h + n).toFixed(0)}`;
  });
  return `M-40 ${H} L${pts.join(" L")} L${W + 40} ${H}Z`;
}

/** Sisi bayangan (kanan) dan sisi terang (kiri) tiap puncak: kesan bidang berfaset. */
export function facets(peaks: Peak[], base: number) {
  const dark: string[] = [];
  const light: string[] = [];
  for (const p of peaks) {
    const ay = base - p.h;
    dark.push(
      `${p.x} ${ay} L${p.x + p.r * 0.14} ${ay + p.h * 0.32} L${p.x + p.r * 0.06} ${ay + p.h * 0.5} L${p.x + p.r * 0.34} ${ay + p.h * 0.74} L${p.x + p.r} ${base + 10} L${p.x + p.r * 0.18} ${base + 10} L${p.x - p.l * 0.04} ${ay + p.h * 0.6} L${p.x + p.r * 0.02} ${ay + p.h * 0.28}Z`,
    );
    light.push(
      `${p.x} ${ay} L${p.x - p.l * 0.16} ${ay + p.h * 0.3} L${p.x - p.l * 0.08} ${ay + p.h * 0.46} L${p.x - p.l * 0.38} ${ay + p.h * 0.7} L${p.x - p.l * 0.62} ${base + 10} L${p.x - p.l * 0.1} ${base + 10} L${p.x - p.l * 0.02} ${ay + p.h * 0.55}Z`,
    );
  }
  return { dark: "M" + dark.join(" M"), light: "M" + light.join(" M") };
}

type LayerKey = "far" | "mid" | "main" | "front";

const LAYERS: Record<
  LayerKey,
  {
    base: number;
    jag: number;
    seed: number;
    peaks: Peak[];
    stops: [string, string, string]; // atas, tengah, bawah
    dark: string;
    light: string;
    paint: boolean;
  }
> = {
  far: {
    base: 640,
    jag: 6,
    seed: 3,
    peaks: [
      { x: 110, h: 210, l: 280, r: 300 },
      { x: 520, h: 300, l: 300, r: 280 },
      { x: 940, h: 250, l: 280, r: 320 },
      { x: 1330, h: 340, l: 300, r: 300 },
      { x: 1600, h: 230, l: 260, r: 260 },
    ],
    stops: ["#b7cbe8", "#aac4dc", "#c9dbe6"],
    dark: "#7f9dc4",
    light: "#dfeaf6",
    paint: false,
  },
  mid: {
    base: 720,
    jag: 10,
    seed: 7,
    peaks: [
      { x: -10, h: 300, l: 260, r: 300 },
      { x: 340, h: 390, l: 250, r: 270 },
      { x: 1140, h: 370, l: 260, r: 250 },
      { x: 1500, h: 430, l: 260, r: 300 },
    ],
    stops: ["#a8c58f", "#6f9a73", "#456f55"],
    dark: "#2d5440",
    light: "#d6e4a4",
    paint: true,
  },
  main: {
    base: 780,
    jag: 16,
    seed: 11,
    peaks: [
      { x: 800, h: 580, l: 340, r: 380 },
      { x: 505, h: 330, l: 210, r: 240 },
      { x: 1100, h: 360, l: 220, r: 250 },
      { x: 215, h: 400, l: 250, r: 240 },
      { x: 1390, h: 420, l: 240, r: 270 },
    ],
    stops: ["#9dbd68", "#5d8d51", "#2a5239"],
    dark: "#193524",
    light: "#e3ecaa",
    paint: true,
  },
  front: {
    base: 890,
    jag: 8,
    seed: 19,
    peaks: [
      { x: 180, h: 150, l: 480, r: 460 },
      { x: 760, h: 110, l: 420, r: 420 },
      { x: 1290, h: 175, l: 460, r: 480 },
    ],
    stops: ["#4f7b50", "#2f5a3f", "#1d3a2a"],
    dark: "#14291d",
    light: "#8bb06b",
    paint: true,
  },
};

/** Satu lapis gunung. Letakkan beberapa lapis bertumpuk di dalam wadah `relative`. */
export function MountainLayer({ kind, className }: { kind: LayerKey; className?: string }) {
  const L = LAYERS[kind];
  const id = `mp-${kind}`;
  const f = facets(L.peaks, L.base);
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      className={className}
      style={{ width: "100%", height: "100%" }}
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={L.stops[0]} />
          <stop offset="0.5" stopColor={L.stops[1]} />
          <stop offset="1" stopColor={L.stops[2]} />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={ridgePath(L.peaks, L.base, L.jag, L.seed)} />
        </clipPath>
      </defs>
      <g className={L.paint ? "paint-filter" : undefined}>
        <path d={ridgePath(L.peaks, L.base, L.jag, L.seed)} fill={`url(#${id}-fill)`} />
        <g clipPath={`url(#${id}-clip)`}>
          <path d={f.light} fill={L.light} opacity={0.38} />
          <path d={f.dark} fill={L.dark} opacity={0.5} />
        </g>
      </g>
    </svg>
  );
}

/** Filter efek lukisan. Render sekali di dekat lapisan gunung. */
export function PaintFilter() {
  return (
    <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
      <filter id="mp-paint" x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.011 0.02" numOctaves="2" seed="4" result="warp" />
        <feDisplacementMap in="SourceGraphic" in2="warp" scale="22" xChannelSelector="R" yChannelSelector="G" result="shape" />
        <feTurbulence type="fractalNoise" baseFrequency="0.035 0.06" numOctaves="2" seed="11" result="grain" />
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0.86  0 0 0 0 0.9  0 0 0 0 0.5  0 0 0 3 -1.5" result="patches" />
        <feComposite in="patches" in2="shape" operator="in" result="patchesIn" />
        <feComponentTransfer in="patchesIn" result="patchesSoft">
          <feFuncA type="linear" slope="0.5" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="shape" />
          <feMergeNode in="patchesSoft" />
        </feMerge>
      </filter>
    </svg>
  );
}

/** Siluet punggungan sederhana satu warna (mengikuti `currentColor`) untuk pembatas bagian. */
export function Ridge({ seed = 5, className }: { seed?: number; className?: string }) {
  const r = rng(seed);
  const peaks: Peak[] = Array.from({ length: 7 }, (_, i) => ({
    x: 120 + i * 220 + r() * 80,
    h: 40 + r() * 90,
    l: 160 + r() * 120,
    r: 160 + r() * 120,
  }));
  const pts: string[] = [];
  for (let x = -20; x <= W + 20; x += 20) pts.push(`${x} ${(200 - profile(peaks, x) - 6 - r() * 6).toFixed(0)}`);
  return (
    <svg aria-hidden viewBox={`0 0 ${W} 200`} preserveAspectRatio="none" className={className}>
      <path d={`M-20 200 L${pts.join(" L")} L${W + 20} 200Z`} fill="currentColor" />
    </svg>
  );
}
