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
    sub: process.env.ADMIN_EMAIL || "admin",
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
    const payload = (await verify(token, getSecret(), JWT_ALG)) as {
      admin?: boolean;
      sub?: string;
    };
    if (!payload.admin) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    c.set(
      "adminSubject",
      typeof payload.sub === "string" && payload.sub.length > 0
        ? payload.sub
        : "admin"
    );
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}

export function getAdminSubject(c: Context): string {
  const subject = c.get("adminSubject");
  return typeof subject === "string" && subject.length > 0 ? subject : "admin";
}
