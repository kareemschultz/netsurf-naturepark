import { useState } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { login, isAuthenticated } from "@/lib/api";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (isAuthenticated()) throw redirect({ to: "/" });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(password);
      navigate({ to: "/" });
    } catch {
      setError("Incorrect password. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#1E3A0E" }}
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-7">
          <p className="font-black text-xl" style={{ color: "#2D5016" }}>
            Netsurf Admin
          </p>
          <p className="text-sm text-muted-foreground mt-1">Sign in to manage bookings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              className="w-full rounded-xl border-2 border-border px-4 py-2.5 text-sm outline-none focus:border-[#2D5016] transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "#2D5016" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
