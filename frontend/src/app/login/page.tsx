"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { Shield, Loader2, ArrowRight, ArrowUpRight } from "lucide-react";

const QUICK = [
  { role: "manager", label: "Manager", desc: "Approves critical fixes" },
  { role: "engineer", label: "Engineer", desc: "Files & triages incidents" },
  { role: "admin", label: "Admin", desc: "Full platform access" },
  { role: "auditor", label: "Auditor", desc: "Reads the audit trail" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setError("");
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const response = await fetch("http://localhost:8001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Authentication failed");
      }

      const data = await response.json();
      login(data.username, data.role, data.access_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection refused: ensure the FastAPI backend is running.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: string) => {
    setUsername(role);
    setPassword("password");
  };

  const handleGuestLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", "admin");
      formData.append("password", "password");

      const response = await fetch("http://localhost:8001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Authentication failed");
      }

      const data = await response.json();
      login("Guest", data.role, data.access_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection refused: ensure the FastAPI backend is running.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-light font-body min-h-screen bg-paper text-[var(--ink)] grid lg:grid-cols-[1.05fr_1fr]">
      {/* ===== Brand panel ===== */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 bg-[var(--paper-2)] paper-grid grain border-r border-[var(--line)] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_70%_at_20%_-10%,rgba(217,56,30,0.10),transparent_55%)]" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="grid place-items-center w-9 h-9 rounded-md bg-[var(--ink)] text-[var(--paper)]">
            <Shield className="w-4.5 h-4.5" strokeWidth={2.2} />
          </span>
          <span className="font-display text-[17px] font-extrabold tracking-tight">AegisOps<span className="text-[var(--accent)]">.</span></span>
        </Link>

        <div className="relative">
          <span className="font-data text-[11px] uppercase tracking-[0.18em] text-[var(--accent-deep)]">Welcome back, operator</span>
          <h1 className="font-display text-[clamp(2rem,3.6vw,3rem)] font-extrabold tracking-[-0.03em] leading-[1.02] mt-3">
            The bridge is<br />already staffed.
          </h1>
          <p className="mt-5 max-w-sm text-[15px] text-[var(--ink-soft)] leading-relaxed">
            Sign in to your command center to file incidents, watch the agent crew work,
            and clear approvals — all in one place.
          </p>

          <div className="mt-8 space-y-2.5 font-data text-[12px] text-[var(--ink-soft)]">
            <div className="flex items-center gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)] blink" /> Maestro orchestrator · online</div>
            <div className="flex items-center gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" /> 6 agents · standby</div>
          </div>
        </div>

        <p className="relative font-data text-[11px] text-[var(--muted)]">UiPath AgentHack 2026 · multi-agent incident response</p>
      </aside>

      {/* ===== Form panel ===== */}
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <span className="grid place-items-center w-9 h-9 rounded-md bg-[var(--ink)] text-[var(--paper)]"><Shield className="w-4.5 h-4.5" /></span>
            <span className="font-display text-[17px] font-extrabold tracking-tight">AegisOps<span className="text-[var(--accent)]">.</span></span>
          </div>

          <h2 className="font-display text-[28px] font-extrabold tracking-tight">Sign in</h2>
          <p className="text-[14px] text-[var(--muted)] mt-1">Access the incident response command center.</p>

          {error && (
            <div className="mt-5 rounded-md border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3.5 py-2.5 font-data text-[12px] text-[var(--accent-deep)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="font-data text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. engineer"
                className="w-full rounded-md border border-[var(--line-strong)] bg-[var(--card)] px-3.5 py-2.5 text-[15px] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-data text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-[var(--line-strong)] bg-[var(--card)] px-3.5 py-2.5 text-[15px] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full inline-flex items-center justify-center gap-2 rounded-md bg-[var(--accent)] text-white py-3 text-[15px] font-semibold hover:bg-[var(--accent-deep)] transition disabled:opacity-60"
            >
              {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Authenticating…</>) : (<>Enter command center <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>)}
            </button>
          </form>

          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={loading}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-md border border-[var(--line-strong)] bg-[var(--card)] py-3 text-[15px] font-semibold text-[var(--ink)] hover:border-[var(--accent)] hover:bg-[var(--paper-2)] transition disabled:opacity-60"
          >
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Entering…</>) : "Continue as Guest"}
          </button>
          <p className="font-data text-[10.5px] text-[var(--muted)] mt-2 text-center">No credentials needed · explore the full platform</p>

          {/* Quick login */}
          <div className="mt-8">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-[var(--line)]" />
              <span className="font-data text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Demo quick login</span>
              <span className="h-px flex-1 bg-[var(--line)]" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {QUICK.map((q) => (
                <button
                  key={q.role}
                  type="button"
                  onClick={() => handleQuickLogin(q.role)}
                  className="group rounded-md border border-[var(--line-strong)] bg-[var(--card)] px-3 py-2.5 text-left hover:border-[var(--accent)] hover:bg-[var(--paper-2)] transition"
                >
                  <span className="block text-[13px] font-semibold text-[var(--ink)]">{q.label}</span>
                  <span className="block font-data text-[10px] text-[var(--muted)] mt-0.5">{q.desc}</span>
                </button>
              ))}
            </div>
            <p className="font-data text-[10.5px] text-[var(--muted)] mt-3 text-center">Fills the form · password is <span className="text-[var(--ink-soft)]">password</span> for all</p>
          </div>

          <p className="mt-8 text-center text-[13.5px] text-[var(--muted)]">
            New to AegisOps?{" "}
            <Link href="/signup" className="font-semibold text-[var(--accent-deep)] hover:underline inline-flex items-center gap-0.5">
              Create an account <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
