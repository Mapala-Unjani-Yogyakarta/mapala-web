import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Gambar hanya boleh dari penyimpanan Supabase milik sendiri (mencegah pelacak/gambar sembarang).
const IMAGE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host;
  } catch {
    return "";
  }
})();

function imageAllowed(src: string) {
  if (src.startsWith("/")) return true;
  try {
    return !!IMAGE_HOST && new URL(src).host === IMAGE_HOST;
  } catch {
    return false;
  }
}

/**
 * Render Markdown dengan aman: HTML mentah TIDAK dirender, tautan berbahaya (javascript:) dibuang,
 * tautan luar dibuka di tab baru dengan rel aman, dan gambar dibatasi ke penyimpanan sendiri.
 * Judul "#" diturunkan menjadi h2 agar satu halaman hanya punya satu h1.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="post-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
          a: ({ href, children }) => {
            const external = !!href && /^https?:\/\//i.test(href);
            return (
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow ugc" } : {})}>
                {children}
              </a>
            );
          },
          img: ({ src, alt }) =>
            typeof src === "string" && imageAllowed(src) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={alt ?? ""} loading="lazy" />
            ) : (
              <span className="text-sm italic text-muted">[gambar tidak diizinkan: unggah lewat tombol “Sisipkan foto”]</span>
            ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
