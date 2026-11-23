/**
 * Adegan ilustrasi untuk tiap bagian beranda dan hero halaman.
 * Urutan beranda mengikuti waktu: pagi berkabut → siang → senja → malam → fajar.
 * Ubah warna di sini (kode hex di atribut fill). Lapisan bergerak lewat atribut `depth`.
 */
import { Art, Birds, Glow, Layer, Mist, Stars, Tent, W, H, pines, ridgePath, rolling } from "./scene-kit";
import type { Peak } from "./scene-kit";

const sunLayer = (children: React.ReactNode, depth = 0.3) => (
  <div aria-hidden data-depth={depth} className="pointer-events-none absolute inset-0 will-change-transform">
    {children}
  </div>
);

/* ═══ BERANDA ═════════════════════════════════════════════════════════ */

/** 1 · Pagi berkabut: hutan pinus berlapis. */
export function ScenePines() {
  return (
    <>
      {sunLayer(<Glow className="right-[8%] top-[6%] h-80 w-80" color="255 250 225" opacity={0.7} />)}
      <Layer depth={0.3} h="62%">
        <Art><path d={pines(1, 730, 70, 115, 30)} fill="#c4d6bd" /></Art>
      </Layer>
      <Mist color="rgb(231 238 221 / 0.9)" depth={0.24} h="26%" bottom="22%" />
      <Layer depth={0.2} h="62%">
        <Art><path d={pines(2, 790, 120, 185, 42)} fill="#9bb792" /></Art>
      </Layer>
      <Mist color="rgb(213 226 202 / 0.85)" depth={0.16} h="24%" bottom="10%" />
      <Layer depth={0.1} h="46%">
        <Art><path d={pines(3, 872, 170, 250, 80)} fill="#648a63" /></Art>
      </Layer>
    </>
  );
}

/** 2 · Siang keemasan: bukit, matahari rendah, dan sungai berkelok. */
export function SceneGolden() {
  return (
    <>
      {sunLayer(<Glow className="left-[6%] bottom-[30%] h-[26rem] w-[26rem]" color="255 232 170" opacity={0.85} />, 0.34)}
      <Layer depth={0.3} h="60%">
        <Art>
          <circle cx="330" cy="640" r="64" fill="#fff4cd" />
          <path d={rolling(4, 720, 60, 260)} fill="#ecd199" />
        </Art>
      </Layer>
      <Layer depth={0.2} h="56%">
        <Art><path d={rolling(5, 780, 64, 220)} fill="#cdb872" /></Art>
      </Layer>
      <Layer depth={0.13} h="50%">
        <Art>
          <defs>
            <linearGradient id="gl-river" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff6d8" stopOpacity="0.55" />
              <stop offset="1" stopColor="#fffaf0" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          <path d={rolling(6, 830, 44, 300)} fill="#a9a35c" />
          <path d="M770 736 C 800 762 730 790 776 818 S 650 868 610 905 L 940 905 C 920 862 960 828 916 800 C 876 774 906 750 852 736Z" fill="url(#gl-river)" />
        </Art>
      </Layer>
      <Layer depth={0.07} h="40%">
        <Art>
          <path d={rolling(7, 884, 34, 240)} fill="#7d8d4f" />
          <path d={pines(8, 896, 56, 104, 110, false)} fill="#56703f" />
        </Art>
      </Layer>
    </>
  );
}

/** Pohon pinus pembatas bawah adegan senja (warnanya = warna awal bagian berikutnya). */
export function PineSeam({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox={`0 0 ${W} 340`} preserveAspectRatio="none" className={className}>
      <path d={pines(77, 330, 120, 300, 64)} fill="currentColor" />
    </svg>
  );
}

const DUSK_PEAKS: Peak[] = [
  { x: 240, h: 300, l: 300, r: 300 },
  { x: 790, h: 360, l: 330, r: 330 },
  { x: 1340, h: 320, l: 300, r: 300 },
];

function Campfire({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <defs>
        <radialGradient id="cf-glow">
          <stop offset="0" stopColor="#ffb866" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ff8a3d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y - 10} r={86} fill="url(#cf-glow)" className="flicker" />
      <path d={`M${x - 14} ${y} q${14} ${-46} ${28} 0 q${-14} ${12} ${-28} 0Z`} fill="#ffcf7a" className="flicker" />
      <path d={`M${x - 8} ${y} q${8} ${-28} ${16} 0 q${-8} ${8} ${-16} 0Z`} fill="#fff1c2" />
    </g>
  );
}

/** 3 · Senja: perkemahan di bawah langit ungu-jingga dan bintang. */
export function SceneDusk() {
  return (
    <>
      <Layer pos="top" depth={0.38} h="52%"><Stars seed={5} count={90} maxY={380} /></Layer>
      {sunLayer(<Glow className="bottom-[6%] left-1/2 h-80 w-[80%] -translate-x-1/2" color="255 170 110" opacity={0.6} />, 0.2)}
      <Layer depth={0.28} h="56%">
        <Art>
          <defs>
            <linearGradient id="dk-far" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#6d5aa0" />
              <stop offset="1" stopColor="#3b2f68" />
            </linearGradient>
          </defs>
          <path d={ridgePath(DUSK_PEAKS, 790, 14, 31)} fill="url(#dk-far)" />
        </Art>
      </Layer>
      <Layer depth={0.2} h="46%" offset="8%">
        <Art><path d={pines(10, 830, 120, 190, 44)} fill="#27384a" /></Art>
      </Layer>
      <Layer depth={0.12} h="40%" offset="11%">
        <Art>
          <path d={rolling(11, 862, 22, 300)} fill="#1b2c33" />
          <Tent x={500} base={862} w={170} h={118} light="#f7c48f" dark="#b46a58" />
          <Tent x={890} base={866} w={200} h={140} light="#f4b98a" dark="#a85f55" />
          <Tent x={1150} base={860} w={130} h={92} light="#f7c48f" dark="#b46a58" />
          <Campfire x={760} y={868} />
        </Art>
      </Layer>
    </>
  );
}

const NIGHT_PEAKS: Peak[] = [
  { x: 260, h: 250, l: 300, r: 300 },
  { x: 820, h: 300, l: 360, r: 340 },
  { x: 1380, h: 260, l: 320, r: 320 },
];

/** 4 · Malam: bulan, bintang, dan danau yang memantulkan gunung. */
export function SceneNight() {
  const water = 700;
  const mountains = ridgePath(NIGHT_PEAKS, water, 10, 21);
  return (
    <>
      <Layer pos="top" depth={0.36} h="58%">
        <Stars seed={9} count={120} maxY={420} />
      </Layer>
      {sunLayer(<Glow className="right-[18%] top-[4%] h-80 w-80" color="215 232 255" opacity={0.4} />, 0.34)}
      <Layer depth={0.2} h="58%">
        <Art>
          <defs>
            <linearGradient id="nl-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#285a66" />
              <stop offset="1" stopColor="#0e2631" />
            </linearGradient>
            <linearGradient id="nl-streak" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f4f1de" stopOpacity="0.8" />
              <stop offset="1" stopColor="#f4f1de" stopOpacity="0" />
            </linearGradient>
            <clipPath id="nl-clip"><rect x="0" y={water} width={W} height={H - water} /></clipPath>
          </defs>
          <circle cx="1180" cy="520" r="54" fill="#f4f1de" opacity="0.95" />
          <path d={mountains} fill="#13303f" />
          <path d={pines(20, water + 2, 50, 96, 28, false)} fill="#0d2430" />
          <rect x="0" y={water} width={W} height={H - water} fill="url(#nl-water)" />
          <g clipPath="url(#nl-clip)">
            <g opacity="0.4" transform={`translate(0 ${water * 2}) scale(1 -1)`}>
              <path d={mountains} fill="#13303f" />
            </g>
          </g>
          <rect x="1156" y={water + 4} width="46" height="190" fill="url(#nl-streak)" />
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={140 + ((i * 131) % 1300)} y={water + 24 + i * 15} width={90 + ((i * 53) % 140)} height="2" rx="1" fill="#bfe0e6" opacity={0.16} />
          ))}
        </Art>
      </Layer>
    </>
  );
}

/** 5 · Fajar: matahari terbit di balik puncak berwarna merah muda. */
export function SceneDawn() {
  return (
    <>
      {sunLayer(<Glow className="bottom-[16%] left-1/2 h-[26rem] w-[70%] -translate-x-1/2" color="255 214 160" opacity={0.85} />, 0.3)}
      <Layer depth={0.28} h="52%">
        <Art>
          <circle cx="800" cy="700" r="86" fill="#fff1d2" />
          <path d={ridgePath([{ x: 260, h: 260, l: 300, r: 300 }, { x: 800, h: 220, l: 340, r: 340 }, { x: 1340, h: 280, l: 300, r: 300 }], 800, 12, 41)} fill="#efc3ad" />
        </Art>
      </Layer>
      <Layer depth={0.18} h="46%">
        <Art><path d={ridgePath([{ x: 90, h: 240, l: 280, r: 280 }, { x: 560, h: 200, l: 300, r: 300 }, { x: 1080, h: 250, l: 320, r: 320 }, { x: 1520, h: 220, l: 280, r: 280 }], 850, 12, 43)} fill="#dba7a0" /></Art>
      </Layer>
      <Layer depth={0.1} h="36%">
        <Art><path d={rolling(44, 886, 30, 280)} fill="#c9b6ad" /></Art>
      </Layer>
      <Mist color="rgb(245 243 234 / 1)" h="34%" />
    </>
  );
}

/* ═══ HERO HALAMAN ═══════════════════════════════════════════════════ */

/** Hero "Pengurus": perkemahan senja dengan api unggun. */
export function HeroCamp() {
  return (
    <>
      <Layer pos="top" depth={0.4} h="55%"><Stars seed={14} count={80} maxY={380} /></Layer>
      {sunLayer(<Glow className="bottom-0 left-1/2 h-72 w-[80%] -translate-x-1/2" color="255 170 110" opacity={0.55} />, 0.2)}
      <Layer depth={0.3} h="66%">
        <Art>
          <defs>
            <linearGradient id="hc-far" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#6d5aa0" />
              <stop offset="1" stopColor="#3b2f68" />
            </linearGradient>
          </defs>
          <path d={ridgePath([{ x: 200, h: 280, l: 280, r: 300 }, { x: 760, h: 340, l: 330, r: 330 }, { x: 1300, h: 300, l: 300, r: 300 }], 800, 14, 51)} fill="url(#hc-far)" />
        </Art>
      </Layer>
      <Layer depth={0.2} h="55%">
        <Art><path d={pines(52, 840, 110, 180, 42)} fill="#28394a" /></Art>
      </Layer>
      <Layer depth={0.1} h="50%" offset="5%">
        <Art>
          <path d={rolling(53, 872, 20, 320)} fill="#1b2c33" />
          <Tent x={420} base={874} w={150} h={104} light="#f7c48f" dark="#b46a58" />
          <Tent x={980} base={872} w={190} h={134} light="#f4b98a" dark="#a85f55" />
          <Tent x={1210} base={876} w={120} h={86} light="#f7c48f" dark="#b46a58" />
          <Campfire x={760} y={878} />
          <path d={pines(54, 900, 330, 400, 1400, false)} fill="#12222a" transform="translate(-120 0)" />
        </Art>
      </Layer>
    </>
  );
}

/** Hero "Periode": perbukitan fajar dengan jalan setapak. */
export function HeroHills() {
  return (
    <>
      {sunLayer(<Glow className="bottom-[4%] left-1/2 h-56 w-[60%] -translate-x-1/2" color="255 200 150" opacity={0.7} />, 0.3)}
      <Layer depth={0.3} h="62%">
        <Art>
          <circle cx="800" cy="738" r="62" fill="#fff1d2" />
          <path d={rolling(60, 760, 54, 300)} fill="#d89a9f" />
        </Art>
      </Layer>
      <Layer depth={0.2} h="55%">
        <Art><path d={rolling(61, 812, 62, 260)} fill="#a2929f" /></Art>
      </Layer>
      <Layer depth={0.1} h="48%">
        <Art>
          <path d={rolling(62, 868, 40, 300)} fill="#4f6b58" />
          <path d="M800 774 C 830 798 762 820 802 846 S 700 884 690 905 L 900 905 C 896 884 940 862 892 842 C 856 822 884 800 842 774Z" fill="#f6dcc0" opacity="0.85" />
          <path d={pines(63, 892, 56, 100, 120, false)} fill="#365243" />
        </Art>
      </Layer>
    </>
  );
}

/** Hero "Gallery": danau pagi yang memantulkan gunung. */
export function HeroLake() {
  const water = 740;
  const peaks = ridgePath([{ x: 300, h: 260, l: 300, r: 300 }, { x: 860, h: 300, l: 340, r: 330 }, { x: 1380, h: 250, l: 300, r: 300 }], water, 12, 71);
  return (
    <>
      {sunLayer(<Glow className="right-[10%] top-[18%] h-80 w-80" color="255 244 214" opacity={0.5} />, 0.34)}
      <Layer pos="top" depth={0.36} h="50%">
        <Art align="xMidYMin"><Birds seed={4} count={6} x0={300} x1={1200} y0={160} y1={300} color="#fff" /></Art>
      </Layer>
      <Layer depth={0.22} h="56%">
        <Art>
          <defs>
            <linearGradient id="hl-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7fbdcc" />
              <stop offset="1" stopColor="#2d7184" />
            </linearGradient>
            <clipPath id="hl-clip"><rect x="0" y={water} width={W} height={H - water} /></clipPath>
          </defs>
          <path d={peaks} fill="#a9c4e6" />
          <path d={pines(72, water + 2, 46, 92, 26, false)} fill="#3a7a66" />
          <rect x="0" y={water} width={W} height={H - water} fill="url(#hl-water)" />
          <g clipPath="url(#hl-clip)">
            <g opacity="0.38" transform={`translate(0 ${water * 2}) scale(1 -1)`}>
              <path d={peaks} fill="#a9c4e6" />
            </g>
          </g>
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={100 + ((i * 157) % 1350)} y={water + 20 + i * 11} width={80 + ((i * 61) % 150)} height="2" rx="1" fill="#fff" opacity={0.28} />
          ))}
        </Art>
      </Layer>
    </>
  );
}
