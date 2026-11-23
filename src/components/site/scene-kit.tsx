/**
 * Perangkat menggambar adegan (SVG buatan sendiri, tanpa gambar eksternal).
 * Semua adegan memakai kanvas 1600×900 yang rata ke dasar ("xMidYMax slice"),
 * jadi gambar penting sebaiknya berada di separuh bawah (y ≥ 440).
 */
import { ridgePath, rng, type Peak } from "./mountains";

export const W = 1600;
export const H = 900;

/* ── Pembungkus lapisan ───────────────────────────────────────────── */

/** Satu lapisan paralaks. `depth` > 0 = bergerak lebih lambat dari halaman; 0 = diam. */
export function Layer({
  depth = 0,
  pos = "bottom",
  h = "60%",
  offset = "0%",
  children,
  className = "",
}: {
  depth?: number;
  pos?: "top" | "bottom";
  h?: string;
  /** Jarak dari tepi (naikkan lapisan dari dasar bagian). */
  offset?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      data-depth={depth || undefined}
      className={`pointer-events-none absolute inset-x-0 ${className}`}
      style={{ height: h, maxHeight: "720px", [pos]: offset }}
    >
      {children}
    </div>
  );
}

export function Art({ children, align = "xMidYMax" }: { children: React.ReactNode; align?: "xMidYMax" | "xMidYMin" }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio={`${align} slice`} style={{ width: "100%", height: "100%" }}>
      {children}
    </svg>
  );
}

/** Kabut: pita gradasi dari warna `color` ke transparan, menumpuk di antara lapisan. */
export function Mist({ color, depth = 0, h = "30%", bottom = "0%" }: { color: string; depth?: number; h?: string; bottom?: string }) {
  return (
    <div
      aria-hidden
      data-depth={depth || undefined}
      className="pointer-events-none absolute inset-x-0"
      style={{ height: h, bottom, background: `linear-gradient(to top, ${color}, transparent)` }}
    />
  );
}

/** Cahaya bulat lembut (matahari/bulan) berupa gradasi radial. */
export function Glow({ className, color = "255 255 255", opacity = 0.6 }: { className: string; color?: string; opacity?: number }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{ background: `radial-gradient(closest-side, rgb(${color} / ${opacity}), transparent)` }}
    />
  );
}

/* ── Bentuk ───────────────────────────────────────────────────────── */

/** Perbukitan landai: jumlah gelombang sinus, isi ke dasar kanvas. */
export function rolling(seed: number, base: number, amp: number, wave: number, jitter = 0) {
  const r = rng(seed);
  const ph = [r() * 6.28, r() * 6.28, r() * 6.28];
  const pts: string[] = [];
  for (let x = -40; x <= W + 40; x += 20) {
    const y = base - amp * (0.55 * Math.sin(x / wave + ph[0]) + 0.3 * Math.sin(x / (wave * 0.45) + ph[1]) + 0.15 * Math.sin(x / (wave * 0.2) + ph[2])) + (r() - 0.5) * jitter;
    pts.push(`${x} ${y.toFixed(0)}`);
  }
  return `M-40 ${H} L${pts.join(" L")} L${W + 40} ${H}Z`;
}

/** Tinggi (y) permukaan `rolling()` pada posisi x, tanpa jitter. Untuk menaruh figur di atas bukit. */
export function rollingAt(seed: number, base: number, amp: number, wave: number) {
  const r = rng(seed);
  const ph = [r() * 6.28, r() * 6.28, r() * 6.28];
  return (x: number) => base - amp * (0.55 * Math.sin(x / wave + ph[0]) + 0.3 * Math.sin(x / (wave * 0.45) + ph[1]) + 0.15 * Math.sin(x / (wave * 0.2) + ph[2]));
}

/** Siluet pendaki: kepala, badan, ransel, kaki, dan tongkat. (x,y) = titik pijakan. */
export function Hiker({ x, y, s = 1, color = "#0c1f1f", flip = false }: { x: number; y: number; s?: number; color?: string; flip?: boolean }) {
  return (
    <g transform={`translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${flip ? -s : s} ${s})`} fill={color} stroke={color}>
      <circle cx="0" cy="-37" r="5.5" stroke="none" />
      <rect x="-5.5" y="-31" width="11" height="18" rx="4.5" stroke="none" />
      <rect x="-12" y="-30" width="8" height="15" rx="3.5" stroke="none" />
      <path d="M-3.5 -14 L-8 0 M3.5 -14 L6.5 0" strokeWidth="4.2" strokeLinecap="round" fill="none" />
      <path d="M8 -27 L15 0" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </g>
  );
}

function tree(x: number, by: number, h: number, w: number, tiers = 4) {
  const right: [number, number][] = [];
  for (let i = 1; i <= tiers; i++) {
    const t = i / tiers;
    const y = by - h + h * 0.88 * t;
    const hw = (w / 2) * (0.3 + 0.7 * t);
    right.push([x + hw, y]);
    if (i < tiers) right.push([x + hw * 0.42, y]);
  }
  const left = right.map(([px, py]) => [2 * x - px, py] as [number, number]).reverse();
  const f = (p: [number, number]) => `${p[0].toFixed(0)} ${p[1].toFixed(0)}`;
  return `M${x.toFixed(0)} ${(by - h).toFixed(0)} L${right.map(f).join(" L")} L${(x + w * 0.06).toFixed(0)} ${(by - h * 0.12).toFixed(0)} L${(x + w * 0.06).toFixed(0)} ${by.toFixed(0)} L${(x - w * 0.06).toFixed(0)} ${by.toFixed(0)} L${(x - w * 0.06).toFixed(0)} ${(by - h * 0.12).toFixed(0)} L${left.map(f).join(" L")}Z`;
}

/** Barisan pohon pinus di atas tanah datar pada garis `base`. */
export function pines(seed: number, base: number, minH: number, maxH: number, gap: number, ground = true) {
  const r = rng(seed);
  let d = "";
  for (let x = -30; x < W + 40; x += gap * (0.6 + r() * 0.8)) {
    const h = minH + r() * (maxH - minH);
    d += tree(x, base + (r() - 0.5) * 8, h, h * 0.36, 4 + (r() > 0.6 ? 1 : 0));
  }
  return ground ? d + ` M-40 ${base} H${W + 40} V${H} H-40Z` : d;
}

/** Bintang acak sebagai lingkaran kecil (lapisan atas, rata ke atas kanvas). */
export function Stars({ seed, count, maxY = 420, className = "" }: { seed: number; count: number; maxY?: number; className?: string }) {
  const r = rng(seed);
  const dots = Array.from({ length: count }, (_, i) => ({
    x: r() * W,
    y: r() * maxY,
    s: 0.8 + r() * 1.8,
    o: 0.35 + r() * 0.65,
    tw: i % 4 === 0,
    d: (r() * 3).toFixed(1),
  }));
  return (
    <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMin slice" className={className} style={{ width: "100%", height: "100%" }}>
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x.toFixed(0)}
          cy={d.y.toFixed(0)}
          r={d.s.toFixed(1)}
          fill="#fff"
          opacity={d.o}
          className={d.tw ? "twinkle" : undefined}
          style={d.tw ? ({ "--o": d.o, animationDelay: `${d.d}s` } as React.CSSProperties) : undefined}
        />
      ))}
    </svg>
  );
}

/** Tenda segitiga dengan sisi terang/gelap dan pintu. */
export function Tent({ x, base, w, h, light, dark, door = "#1b1a2e" }: { x: number; base: number; w: number; h: number; light: string; dark: string; door?: string }) {
  const apex = x + w * 0.5;
  return (
    <g>
      <path d={`M${x} ${base} L${apex} ${base - h} L${apex + w * 0.02} ${base}Z`} fill={light} />
      <path d={`M${apex} ${base - h} L${x + w} ${base} L${apex + w * 0.02} ${base}Z`} fill={dark} />
      <path d={`M${apex - w * 0.09} ${base} L${apex + w * 0.02} ${base - h * 0.5} L${apex + w * 0.13} ${base}Z`} fill={door} opacity={0.85} />
    </g>
  );
}

/** Kawanan burung kecil (huruf "v" melengkung). */
export function Birds({ seed, count = 5, x0 = 300, x1 = 1300, y0 = 520, y1 = 640, color = "#1d2a3a" }: { seed: number; count?: number; x0?: number; x1?: number; y0?: number; y1?: number; color?: string }) {
  const r = rng(seed);
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const x = x0 + r() * (x1 - x0);
        const y = y0 + r() * (y1 - y0);
        const s = 10 + r() * 12;
        return <path key={i} d={`M${x} ${y} q${s * 0.5} ${-s * 0.55} ${s} 0 q${s * 0.5} ${-s * 0.55} ${s} 0`} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.7} />;
      })}
    </>
  );
}

export { ridgePath, rng };
export type { Peak };
