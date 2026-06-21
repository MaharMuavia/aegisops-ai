"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { Shield, Loader2, ArrowRight, ArrowUpRight, Check } from "lucide-react";

const ROLES = [
  { value: "engineer", label: "Engineer", desc: "File & triage incidents" },
  { value: "manager", label: "Manager", desc: "Approve critical fixes" },
  { value: "admin", label: "Admin", desc: "Full platform access" },
  { value: "auditor", label: "Auditor", desc: "Read the audit trail" },
];

export default function SignupPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("engineer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) return;

    setError("");
    setLoading(true);
    try {
      // 1. Register
      const regRes = await fetch("http://localhost:8001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role }),
      });
      if (!regRes.ok) {
        const errData = await regRes.json();
        throw new Error(errData.detail || "Registration failed");
      }

      // 2. Auto sign-in
      const form = new URLSearchParams();
      form.append("username", username);
      form.append("password", password);
      const loginRes = await fetch("http://localhost:8001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      });
      if (!loginRes.ok) {
        // Account created but auto-login failed — send them to sign in
        router.push("/login");
        return;
      }
      const data = await loginRes.json();
      login(data.username, data.role, data.access_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection refused: ensure the FastAPI backend is running.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-light font-body min-h-screen bg-paper text-[var(--ink)] grid lg:grid-cols-[1fr_1.05fr]">
      {/* ===== Form panel ===== */}
      <main className="flex items-center justify-center p-6 sm:p-10 order-2 lg:order-1">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <span className="grid place-items-center w-9 h-9 rounded-md bg-[var(--ink)] text-[var(--paper)]"><Shield className="w-4.5 h-4.5" /></span>
            <span className="font-display text-[17px] font-extrabold tracking-tight">AegisOps<span className="text-[var(--accent)]">.</span></span>
          </div>

          <h2 className="font-display text-[28px] font-extrabold tracking-tight">Create your account</h2>
          <p className="text-[14px] text-[var(--muted)] mt-1">Stand up a command center in under a minute.</p>

          {error && (
            <div className="mt-5 rounded-md border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3.5 py-2.5 font-data text-[12px] text-[var(--accent-deep)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="font-data text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">Username</label>
              <input
                type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="jordan.ops"
                className="w-full rounded-md border border-[var(--line-strong)] bg-[var(--card)] px-3.5 py-2.5 text-[15px] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-data text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">Work email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="jordan@company.com"
                className="w-full rounded-md border border-[var(--line-strong)] bg-[var(--card)] px-3.5 py-2.5 text-[15px] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-data text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-[var(--line-strong)] bg-[var(--card)] px-3.5 py-2.5 text-[15px] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-data text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">Operator role</label>
              <div className="grid grid-cols-2 gap-2.5">
                {ROLES.map((r) => {
                  const active = role === r.value;
                  return (
                    <button
                      key={r.value} type="button" onClick={() => setRole(r.value)}
                      className={`relative rounded-md border px-3 py-2.5 text-left transition ${active ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line-strong)] bg-[var(--card)] hover:border-[var(--ink-soft)]"}`}
                    >
                      {active && <Check className="absolute top-2 right-2 w-3.5 h-3.5 text-[var(--accent-deep)]" />}
                      <span className="block text-[13px] font-semibold text-[var(--ink)]">{r.label}</span>
                      <span className="block font-data text-[10px] text-[var(--muted)] mt-0.5">{r.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="group w-full inline-flex items-center justify-center gap-2 rounded-md bg-[var(--accent)] text-white py-3 text-[15px] font-semibold hover:bg-[var(--accent-deep)] transition disabled:opacity-60"
            >
              {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>) : (<>Create account & enter <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>)}
            </button>
          </form>

          <p className="mt-7 text-center text-[13.5px] text-[var(--muted)]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[var(--accent-deep)] hover:underline inline-flex items-center gap-0.5">
              Sign in <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
      </main>

      {/* ===== Brand panel ===== */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 bg-[var(--ink)] text-[var(--paper)] overflow-hidden order-1 lg:order-2">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_60%_at_80%_-10%,rgba(217,56,30,0.30),transparent_55%)]" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="grid place-items-center w-9 h-9 rounded-md bg-[var(--paper)] text-[var(--ink)]">
            <Shield className="w-4.5 h-4.5" strokeWidth={2.2} />
          </span>
          <span className="font-display text-[17px] font-extrabold tracking-tight">AegisOps<span className="text-[var(--accent)]">.</span></span>
        </Link>

        <div className="relative">
          <span className="font-data text-[11px] uppercase tracking-[0.18em] text-[#d8a18f]">Join the bridge</span>
          <h1 className="font-display text-[clamp(2rem,3.4vw,2.9rem)] font-extrabold tracking-[-0.03em] leading-[1.04] mt-3">
            Six agents are<br />ready to deploy.
          </h1>
          <ul className="mt-7 space-y-3.5 text-[14.5px] text-[#cfc7b9]">
            {[
              "Triage, diagnose & remediate in minutes",
              "Human approval on every critical fix",
              "Immutable audit trail for compliance",
              "4 demo roles, zero configuration",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3">
                <span className="grid place-items-center w-5 h-5 rounded-full bg-[var(--accent)] text-white shrink-0 mt-0.5"><Check className="w-3 h-3" strokeWidth={3} /></span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative font-data text-[11px] text-[#8a8175]">Orchestrated by UiPath Maestro · AgentHack 2026</p>
      </aside>
    </div>
  );
}
