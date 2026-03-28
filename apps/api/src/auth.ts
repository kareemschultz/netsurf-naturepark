import type { Context, Next } from "hono";
import { sign, verify } from "hono/jwt";

const JWT_ALG = "HS256";
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function getSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET env var not set");
  return s;
}

export async function createAdminToken(): Promise<string> {
  const payload = {
    admin: true,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    iat: Math.floor(Date.now() / 1000),
  };
  return sign(payload, getSecret(), JWT_ALG);
}

export async function adminMiddleware(c: Context, next: Next) {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const token = header.slice(7);
  try {
    await verify(token, getSecret(), JWT_ALG);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}
