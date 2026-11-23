// Template (bukan layout) dibuat ulang tiap pindah halaman, sehingga isi halaman memudar masuk dengan lembut.
export default function PublicTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
