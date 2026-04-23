import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { bookingsRoute } from "./routes/bookings.js";
import { actionRoute } from "./routes/action.js";
import { adminRoute } from "./routes/admin.js";
import { contentRoute } from "./routes/content.js";
import { auth, ensureAuthBootstrap } from "./auth.js";

const app = new Hono();

app.use("*", logger());

// CORS — allow the web app and admin panel origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean);

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return origin;
      if (allowedOrigins.length === 0) return origin; // dev: allow all
      return allowedOrigins.includes(origin) ? origin : null;
    },
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.get("/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));

app.on(["GET", "POST"], "/auth/*", (c) => auth.handler(c.req.raw));
app.on(["GET", "POST"], "/auth", (c) => auth.handler(c.req.raw));

app.route("/bookings", bookingsRoute);
app.route("/bookings", actionRoute);   // /bookings/:id/action
app.route("/content", contentRoute);
app.route("/admin", adminRoute);

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

const port = parseInt(process.env.PORT || "3001", 10);
console.log(`[api] Listening on :${port}`);

ensureAuthBootstrap().catch((error) => {
  console.error("[auth] Failed to bootstrap owner account", error);
});

export default { port, fetch: app.fetch };
