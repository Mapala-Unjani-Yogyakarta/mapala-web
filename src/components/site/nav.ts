/** Menu utama situs publik. `header: false` = hanya di menu HP dan footer (logo sudah menuju beranda). */
export const NAV: { href: string; label: string; header?: boolean }[] = [
  { href: "/", label: "Beranda", header: false },
  { href: "/pengurus", label: "Pengurus" },
  { href: "/periode", label: "Periode" },
  { href: "/anggota", label: "Anggota" },
  { href: "/alumni", label: "Alumni" },
  { href: "/blog", label: "Blog" },
  { href: "/gallery", label: "Gallery" },
];
