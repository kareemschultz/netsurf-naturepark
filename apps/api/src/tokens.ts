// HMAC-SHA256 signed tokens for one-click confirm/decline links.
// The token is: hex(HMAC_SHA256(secret, "<bookingId>"))

const encoder = new TextEncoder();

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.ACTION_TOKEN_SECRET;
  if (!secret) throw new Error("ACTION_TOKEN_SECRET env var not set");
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function generateActionToken(bookingId: number): Promise<string> {
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(String(bookingId)));
  return Buffer.from(sig).toString("hex");
}

export async function verifyActionToken(bookingId: number, token: string): Promise<boolean> {
  try {
    const expected = await generateActionToken(bookingId);
    // Constant-time comparison
    if (expected.length !== token.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}
