const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Validates a Cloudflare Turnstile token server-side. Returns true when the
// captcha challenge was solved successfully.
export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<boolean> {
  if (!token) return false;

  const body = new FormData();
  body.append("secret", process.env.TURNSTILE_SECRET_KEY!);
  body.append("response", token);
  if (remoteIp) body.append("remoteip", remoteIp);

  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    if (!res.ok) return false;
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
