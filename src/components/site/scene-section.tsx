import Link from "next/link";
import { Ridge } from "./mountains";
import { Parallax } from "./parallax";
import { HeroCabin, HeroCamp, HeroHills, HeroLake, HeroSummit, HeroTrail, PineSeam, SceneDawn, SceneDusk, SceneGolden, SceneNight, ScenePines } from "./scenes";
import { cx } from "@/lib/utils";

export type SceneKey = "pines" | "golden" | "dusk" | "night" | "dawn";

/**
 * Tiap adegan: latar gradasi, gambar, dan jenis pembatas bawah.
 * Pembatas bawah berwarna SAMA dengan warna atas bagian berikutnya,
 * sehingga bagian berikutnya tampak "naik" sebagai tanah/bukit di depan adegan ini.
 */
const SCENES: Record<SceneKey, { bg: string; Scene: () => React.JSX.Element; top: string; seam: "ridge" | "pines" }> = {
  pines: { bg: "bg-gradient-to-b from-canvas via-mist-100 to-mist-200", Scene: ScenePines, top: "text-canvas", seam: "ridge" },
  golden: { bg: "bg-gradient-to-b from-sand-100 to-sand-200", Scene: SceneGolden, top: "text-sand-100", seam: "ridge" },
  dusk: { bg: "bg-gradient-to-b from-dusk-900 via-dusk-500 to-dusk-300", Scene: SceneDusk, top: "text-dusk-900", seam: "pines" },
  night: { bg: "bg-gradient-to-b from-night-900 via-night-700 to-night-500", Scene: SceneNight, top: "text-night-900", seam: "ridge" },
  dawn: { bg: "bg-gradient-to-b from-dawn-100 to-canvas", Scene: SceneDawn, top: "text-dawn-100", seam: "ridge" },
};

/** Bagian beranda dengan adegan sendiri. `next` = adegan bagian berikutnya (untuk warna pembatas). */
export function SceneSection({
  scene,
  next,
  className,
  children,
  label,
}: {
  scene: SceneKey;
  next?: SceneKey;
  className?: string;
  children: React.ReactNode;
  label?: string;
}) {
  const cfg = SCENES[scene];
  const seamColor = next ? SCENES[next].top : null;
  return (
    <Parallax
      label={label}
      className={cx(cfg.bg, className)}
      scene={
        <>
          <cfg.Scene />
          {seamColor &&
            (cfg.seam === "pines" ? (
              <PineSeam className={cx("absolute inset-x-0 -bottom-px block h-28 w-full sm:h-40", seamColor)} />
            ) : (
              <Ridge seed={scene.length * 7} className={cx("absolute inset-x-0 -bottom-px block h-20 w-full sm:h-32", seamColor)} />
            ))}
        </>
      }
    >
      {children}
    </Parallax>
  );
}

const HEROES = {
  camp: { bg: "bg-gradient-to-b from-dusk-900 via-dusk-500 to-dusk-300", Scene: HeroCamp },
  hills: { bg: "bg-gradient-to-b from-sky-800 via-dusk-700 to-dusk-500", Scene: HeroHills },
  lake: { bg: "bg-gradient-to-b from-sky-800 via-sky-700 to-sky-400", Scene: HeroLake },
  summit: { bg: "bg-gradient-to-b from-sky-800 via-dusk-500 to-dawn-300", Scene: HeroSummit },
  cabin: { bg: "bg-gradient-to-b from-night-900 via-night-700 to-night-500", Scene: HeroCabin },
  trail: { bg: "bg-gradient-to-b from-night-700 via-night-500 to-sand-200", Scene: HeroTrail },
};

/** Hero halaman dengan ilustrasi sendiri: judul putih besar di atas adegan paralaks. */
export function SceneHero({
  scene,
  eyebrow,
  title,
  desc,
  back,
  children,
}: {
  scene: keyof typeof HEROES;
  eyebrow?: string;
  title: string;
  desc?: string;
  back?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  const cfg = HEROES[scene];
  return (
    <Parallax
      mode="hero"
      label={title}
      className={cx("min-h-[480px] sm:min-h-[580px]", cfg.bg)}
      scene={
        <>
          <cfg.Scene />
          <Ridge seed={6} className="absolute inset-x-0 -bottom-px block h-12 w-full text-canvas sm:h-20" />
        </>
      }
    >
      <div className="container-page pb-40 pt-36 sm:pb-52 sm:pt-44">
        {back && (
          <Link href={back.href} className="mb-4 inline-block text-sm text-white/80 transition-colors hover:text-white">
            ← {back.label}
          </Link>
        )}
        {eyebrow && <p className="eyebrow mb-3 !text-white/75">{eyebrow}</p>}
        <h1 className="rise font-display text-6xl leading-[1] tracking-tight text-white drop-shadow-[0_2px_24px_rgba(16,24,50,0.35)] sm:text-8xl">{title}</h1>
        {desc && <p className="rise mt-5 max-w-xl text-lg text-white drop-shadow-[0_1px_12px_rgba(16,24,50,0.45)]" style={{ animationDelay: "0.15s" }}>{desc}</p>}
        {children}
      </div>
    </Parallax>
  );
}
