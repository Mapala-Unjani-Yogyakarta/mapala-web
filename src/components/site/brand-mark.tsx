/**
 * Lambang organisasi (public/logo.png): logo bundar di atas cakram putih,
 * jadi tetap terbaca di latar apa pun (kaca navbar, footer gelap, login).
 * Untuk mengganti logo, timpa public/logo.png (persegi, ≥256px) dan src/app/icon.png.
 */
export function BrandMark({ size = 36, className = "", priority = false }: { size?: number; className?: string; priority?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Lambang organisasi"
      width={size}
      height={size}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={`shrink-0 rounded-full ring-1 ring-black/10 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
