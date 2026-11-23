import "server-only";

/** Verifikasi token Cloudflare Turnstile. Tanpa TURNSTILE_SECRET_KEY, pemeriksaan dilewati (captcha nonaktif). */
export async function verifyTurnstile(fd: FormData): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: String(fd.get("cf-turnstile-response") ?? "") }),
  }).catch(() => null);
  const json = res ? ((await res.json().catch(() => null)) as { success?: boolean } | null) : null;
  return !!json?.success;
}
