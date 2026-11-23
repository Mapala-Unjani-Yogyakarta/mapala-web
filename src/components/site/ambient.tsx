import type { CSSProperties } from "react";

/** Pseudo-acak deterministik (sama di server & klien, jadi tidak memicu galat hidrasi). */
function rnd(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const vars = (o: Record<string, string | number>) => o as CSSProperties;

export type AmbientKind = "clouds" | "birds" | "fireflies" | "motes" | "shooting" | "mist" | "rays";

function Clouds({ tint, n = 3 }: { tint: string; n?: number }) {
  const r = rnd(3);
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className={(i % 2 ? "drift-slow" : "drift") + " absolute rounded-full"}
          style={{
            left: `${8 + r() * 70}%`,
            top: `${8 + r() * 32}%`,
            width: `${180 + r() * 160}px`,
            height: `${50 + r() * 40}px`,
            background: `radial-gradient(closest-side, rgb(${tint} / 0.38), transparent)`,
            animationDelay: `${-r() * 20}s`,
          }}
        />
      ))}
    </>
  );
}

function BirdsFly({ color, n = 3 }: { color: string; n?: number }) {
  const r = rnd(11);
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const s = 0.6 + r() * 0.5;
        return (
          <span key={i} className="bird absolute left-0" style={vars({ top: `${10 + r() * 22}%`, "--t": `${46 + i * 9}s`, "--w": `${i * 13}s` })}>
            <svg width={26 * s} height={10 * s} viewBox="0 0 26 10" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round">
              <path d="M1 8 Q7 0 13 7 Q19 0 25 8" />
            </svg>
          </span>
        );
      })}
    </>
  );
}

function Fireflies({ color, n = 14 }: { color: string; n?: number }) {
  const r = rnd(5);
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className="firefly absolute rounded-full"
          style={vars({
            left: `${r() * 100}%`,
            top: `${38 + r() * 55}%`,
            width: 3 + r() * 3,
            height: 3 + r() * 3,
            background: color,
            boxShadow: `0 0 10px 3px ${color}`,
            "--dx": `${(r() - 0.5) * 70}px`,
            "--dy": `${-20 - r() * 50}px`,
            "--dur": `${6 + r() * 7}s`,
            animationDelay: `${-r() * 10}s`,
          })}
        />
      ))}
    </>
  );
}

function Motes({ color, n = 16 }: { color: string; n?: number }) {
  const r = rnd(9);
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className="mote absolute rounded-full"
          style={vars({
            left: `${r() * 100}%`,
            bottom: `${r() * 30}%`,
            width: 2 + r() * 3,
            height: 2 + r() * 3,
            background: color,
            "--dx": `${(r() - 0.3) * 80}px`,
            "--rise": `${180 + r() * 260}px`,
            "--dur": `${10 + r() * 10}s`,
            animationDelay: `${-r() * 16}s`,
          })}
        />
      ))}
    </>
  );
}

function Shooting() {
  return (
    <>
      {[0, 1].map((i) => (
        <span key={i} className="shoot absolute h-px w-24 bg-gradient-to-r from-transparent to-white" style={vars({ left: `${35 + i * 30}%`, top: `${8 + i * 9}%`, "--w": `${i * 9 + 3}s` })} />
      ))}
    </>
  );
}

function Mist({ tint }: { tint: string }) {
  return (
    <>
      <span className="drift-slow absolute inset-x-[-10%] bottom-[18%] h-24 rounded-full blur-2xl" style={{ background: `rgb(${tint} / 0.35)` }} />
      <span className="drift absolute inset-x-[-10%] bottom-[30%] h-16 rounded-full blur-2xl" style={{ background: `rgb(${tint} / 0.22)`, animationDelay: "-9s" }} />
    </>
  );
}

function Rays({ tint }: { tint: string }) {
  return (
    <span
      className="rays absolute left-1/2 top-[8%] h-[70%] w-[120%] -translate-x-1/2"
      style={{ background: `conic-gradient(from 200deg at 50% 0%, transparent 0deg, rgb(${tint} / 0.22) 14deg, transparent 28deg, rgb(${tint} / 0.16) 44deg, transparent 60deg, rgb(${tint} / 0.2) 76deg, transparent 92deg, rgb(${tint} / 0.14) 110deg, transparent 130deg)` }}
    />
  );
}

/**
 * Lapisan suasana di atas gambar adegan: awan, burung, kunang-kunang, debu emas, bintang jatuh, kabut, dan sinar.
 * Murni CSS, tidak memengaruhi klik, dan mati sendiri bila pengguna memilih "kurangi gerakan".
 */
export function Ambient({ kinds, tint = "255 255 255", accent = "#ffd98a", bird = "rgb(255 255 255 / 0.7)" }: { kinds: AmbientKind[]; tint?: string; accent?: string; bird?: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {kinds.includes("rays") && <Rays tint={tint} />}
      {kinds.includes("clouds") && <Clouds tint={tint} />}
      {kinds.includes("mist") && <Mist tint={tint} />}
      {kinds.includes("birds") && <BirdsFly color={bird} />}
      {kinds.includes("motes") && <Motes color={accent} />}
      {kinds.includes("fireflies") && <Fireflies color={accent} />}
      {kinds.includes("shooting") && <Shooting />}
    </div>
  );
}
