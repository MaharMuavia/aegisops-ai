"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import {
  Shield,
  Inbox,
  ScrollText,
  Database,
  Crosshair,
  Wrench,
  ClipboardCheck,
  ArrowUpRight,
  ArrowRight,
  Check,
  GitBranch,
  Gauge,
  Lock,
} from "lucide-react";

const AGENTS = [
  { icon: Inbox, code: "01", name: "Intake", role: "Classification", desc: "Parses the ticket, extracts metadata, and assigns a severity vector." },
  { icon: ScrollText, code: "02", name: "Log Forensics", role: "Anomaly Detection", desc: "Scans uploaded logs for fatal traces and builds a degradation timeline." },
  { icon: Database, code: "03", name: "Knowledge", role: "RAG Retrieval", desc: "Queries the SOP vector store for matching runbooks and prior fixes." },
  { icon: Crosshair, code: "04", name: "Root Cause", role: "Synthesis", desc: "Fuses log anomalies with SOPs to pinpoint the failure and score confidence." },
  { icon: Wrench, code: "05", name: "Resolution", role: "Remediation", desc: "Drafts a step-by-step fix with rollback safe-fails and a risk grade." },
  { icon: ClipboardCheck, code: "06", name: "Audit", role: "Governance", desc: "Seals an immutable record of every decision, retry, and override." },
];

const FLOW = [
  "Intake triage",
  "Log scan",
  "SOP retrieval",
  "Root cause",
  "Remediation draft",
  "Approval gate",
  "Execute & close",
];

const TICKER = [
  { t: "11:28:04", tag: "INTAKE", msg: "INC-4 classified · severity CRITICAL", tone: "accent" },
  { t: "11:28:09", tag: "LOG", msg: "QueuePool limit exceeded · 3 patterns", tone: "ink" },
  { t: "11:28:14", tag: "RCA", msg: "Root cause located · confidence 94%", tone: "ink" },
  { t: "11:28:17", tag: "GATE", msg: "Halted · awaiting manager approval", tone: "accent" },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const primaryHref = mounted && isAuthenticated ? "/dashboard" : "/signup";
  const primaryLabel = mounted && isAuthenticated ? "Open command center" : "Get started";

  return (
    <div className="theme-light font-body bg-paper text-[var(--ink)] min-h-screen relative overflow-x-hidden">
      {/* ===== NAV ===== */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)]/85 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="relative grid place-items-center w-9 h-9 rounded-md bg-[var(--ink)] text-[var(--paper)]">
              <Shield className="w-4.5 h-4.5" strokeWidth={2.2} />
            </span>
            <span className="font-display text-[17px] font-extrabold tracking-tight leading-none">
              AegisOps<span className="text-[var(--accent)]">.</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 font-data text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
            <a href="#crew" className="hover:text-[var(--ink)] transition-colors">Agent crew</a>
            <a href="#flow" className="hover:text-[var(--ink)] transition-colors">Orchestration</a>
            <a href="#control" className="hover:text-[var(--ink)] transition-colors">Human gate</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:inline text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors">
              Sign in
            </Link>
            <Link
              href={primaryHref}
              className="group inline-flex items-center gap-1.5 rounded-md bg-[var(--ink)] text-[var(--paper)] px-4 py-2 text-sm font-semibold hover:bg-[var(--accent)] transition-colors"
            >
              {primaryLabel}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative paper-grid grain">
        {/* warm vignette wash */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_85%_-10%,rgba(217,56,30,0.10),transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-16 grid lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
          {/* Left: editorial copy */}
          <div>
            <div className="rise inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--card)] px-3 py-1 font-data text-[10.5px] uppercase tracking-[0.18em] text-[var(--muted)]" style={{ animationDelay: "0ms" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)] blink" />
              Autonomous incident response · UiPath Maestro
            </div>

            <h1 className="rise font-display font-extrabold tracking-[-0.03em] leading-[0.98] text-[clamp(2.6rem,6vw,4.4rem)] mt-6" style={{ animationDelay: "80ms" }}>
              Resolve outages
              <br />
              before the war room
              <br />
              <span className="text-[var(--accent)]">fills up.</span>
            </h1>

            <p className="rise mt-6 max-w-xl text-[17px] leading-[1.65] text-[var(--ink-soft)]" style={{ animationDelay: "160ms" }}>
              AegisOps dispatches a crew of six AI agents — intake to audit — that triage,
              diagnose and remediate production incidents in minutes. Every critical fix
              stops at a human approval gate. Every decision is sealed in an immutable log.
            </p>

            <div className="rise mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "240ms" }}>
              <Link
                href={primaryHref}
                className="group inline-flex items-center gap-2 rounded-md bg-[var(--accent)] text-white px-5 py-3 text-[15px] font-semibold hover:bg-[var(--accent-deep)] transition-colors pulse-ring"
              >
                {primaryLabel}
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-md border border-[var(--line-strong)] bg-[var(--card)] px-5 py-3 text-[15px] font-semibold text-[var(--ink)] hover:border-[var(--ink)] transition-colors"
              >
                Try the live demo
              </Link>
            </div>

            <p className="rise mt-4 font-data text-[11px] text-[var(--muted)]" style={{ animationDelay: "300ms" }}>
              No setup · 4 role-based demo logins · runs fully in simulation
            </p>
          </div>

          {/* Right: live dispatch console */}
          <div className="rise" style={{ animationDelay: "220ms" }}>
            <div className="relative rounded-xl border border-[var(--line-strong)] bg-[var(--card)] shadow-[0_30px_60px_-30px_rgba(27,24,19,0.35)] overflow-hidden">
              {/* console chrome */}
              <div className="flex items-center justify-between px-4 h-10 border-b border-[var(--line)] bg-[var(--paper-2)]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e0b23c]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--signal)]/70" />
                </div>
                <span className="font-data text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                  maestro://live-dispatch
                </span>
                <span className="font-data text-[10px] text-[var(--signal)] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)] blink" /> online
                </span>
              </div>

              {/* rolling ticker */}
              <div className="px-4 py-3 h-[92px] overflow-hidden">
                <div className="ticker-track space-y-3">
                  {[...TICKER, TICKER[0]].map((row, i) => (
                    <div key={i} className="flex items-start gap-3 font-data text-[12px] leading-snug">
                      <span className="text-[var(--muted)] shrink-0">{row.t}</span>
                      <span className={`shrink-0 px-1.5 rounded-sm text-[10px] font-semibold ${row.tone === "accent" ? "bg-[var(--accent-soft)] text-[var(--accent-deep)]" : "bg-[var(--paper-2)] text-[var(--ink-soft)]"}`}>
                        {row.tag}
                      </span>
                      <span className="text-[var(--ink-soft)]">{row.msg}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* orchestration pipeline */}
              <div className="px-4 pb-5 pt-4 border-t border-[var(--line)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-data text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Agent pipeline</span>
                  <span className="font-data text-[10px] text-[var(--muted)]">sequential · CrewAI</span>
                </div>

                <div className="relative">
                  {/* track line + traveling signal */}
                  <div className="absolute left-0 right-0 top-[18px] h-px bg-[var(--line-strong)]" />
                  <div className="absolute top-[18px] h-px w-full overflow-hidden">
                    <span className="signal-dot absolute -top-[2px] w-10 h-[5px] rounded-full bg-[var(--accent)] blur-[1px]" />
                  </div>

                  <div className="relative flex justify-between">
                    {AGENTS.map((a, i) => {
                      const Icon = a.icon;
                      const isGate = i === 3;
                      return (
                        <div key={a.name} className="flex flex-col items-center gap-2 w-[14%]">
                          <span
                            className={`grid place-items-center w-9 h-9 rounded-lg border bg-[var(--card)] ${isGate ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--line-strong)] text-[var(--ink-soft)]"}`}
                            style={{ animation: "pulse-ring 2.8s ease-out infinite", animationDelay: `${i * 350}ms` }}
                          >
                            <Icon className="w-4 h-4" strokeWidth={2} />
                          </span>
                          <span className="font-data text-[8.5px] text-[var(--muted)] text-center leading-tight">{a.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== STATS BAND ===== */}
        <div className="relative border-y border-[var(--line)] bg-[var(--card)]/60">
          <div className="mx-auto max-w-6xl px-6 grid grid-cols-2 lg:grid-cols-4 divide-x divide-[var(--line)]">
            {[
              { k: "Hours → Minutes", v: "MTTM", note: "Mean time to mitigation, compressed" },
              { k: "6", v: "Specialized agents", note: "From intake through governance" },
              { k: "100%", v: "Audited decisions", note: "Immutable, regulator-ready trail" },
              { k: "< 70%", v: "Auto-escalates", note: "Low-confidence calls go to humans" },
            ].map((s, i) => (
              <div key={i} className="px-5 py-7 first:pl-0">
                <div className="font-display text-[26px] font-extrabold tracking-tight text-[var(--ink)]">{s.k}</div>
                <div className="font-data text-[10.5px] uppercase tracking-[0.14em] text-[var(--accent-deep)] mt-1">{s.v}</div>
                <div className="text-[12.5px] text-[var(--muted)] mt-1.5 leading-snug">{s.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== AGENT CREW ===== */}
      <section id="crew" className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div>
            <span className="font-data text-[11px] uppercase tracking-[0.18em] text-[var(--accent-deep)]">The crew</span>
            <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold tracking-[-0.02em] mt-2 leading-tight">
              Six agents. One chain of custody.
            </h2>
          </div>
          <p className="hidden md:block max-w-xs text-[14px] text-[var(--muted)] leading-relaxed">
            Each agent owns one job and hands a structured verdict to the next — the way a
            real incident bridge runs, minus the 2 a.m. scramble.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden">
          {AGENTS.map((a) => {
            const Icon = a.icon;
            return (
              <div key={a.name} className="group bg-[var(--card)] p-6 hover:bg-[var(--paper-2)] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="grid place-items-center w-11 h-11 rounded-lg bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink)] group-hover:bg-[var(--ink)] group-hover:text-[var(--paper)] transition-colors">
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </span>
                  <span className="font-data text-[12px] text-[var(--line-strong)] group-hover:text-[var(--accent)] transition-colors">{a.code}</span>
                </div>
                <h3 className="font-display text-[19px] font-bold mt-5">{a.name} Agent</h3>
                <span className="font-data text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">{a.role}</span>
                <p className="text-[14px] text-[var(--ink-soft)] leading-relaxed mt-3">{a.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== ORCHESTRATION FLOW ===== */}
      <section id="flow" className="relative bg-[var(--ink)] text-[var(--paper)] py-20 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:46px_46px]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-3 mb-3">
            <GitBranch className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-data text-[11px] uppercase tracking-[0.18em] text-[#b8afa0]">Maestro orchestration</span>
          </div>
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold tracking-[-0.02em] max-w-2xl leading-tight">
            A sequential master workflow, with retries baked in.
          </h2>

          <div className="mt-12 grid lg:grid-cols-7 gap-3">
            {FLOW.map((step, i) => {
              const isGate = i === 5;
              return (
                <div
                  key={step}
                  className={`relative rounded-lg border p-4 ${isGate ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-[#3a352c] bg-white/[0.03]"}`}
                >
                  <span className={`font-data text-[11px] ${isGate ? "text-[var(--accent)]" : "text-[#8a8175]"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[13px] font-semibold mt-2 leading-snug">{step}</p>
                  {isGate && (
                    <span className="mt-2 inline-flex items-center gap-1 font-data text-[9px] uppercase tracking-wider text-[var(--accent)]">
                      <Lock className="w-3 h-3" /> human
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 font-data text-[12px] text-[#b8afa0]">
            <span className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[var(--signal)]" /> Up to 3 automatic retries per agent</span>
            <span className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[var(--signal)]" /> Critical severity pauses for sign-off</span>
            <span className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[var(--signal)]" /> Auto-execute when confidence is high</span>
          </div>
        </div>
      </section>

      {/* ===== HUMAN-IN-THE-LOOP ===== */}
      <section id="control" className="mx-auto max-w-6xl px-6 py-20 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <span className="font-data text-[11px] uppercase tracking-[0.18em] text-[var(--accent-deep)]">Human in the loop</span>
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold tracking-[-0.02em] mt-2 leading-tight">
            Automation that knows when to ask.
          </h2>
          <p className="mt-5 text-[16px] text-[var(--ink-soft)] leading-[1.65] max-w-lg">
            The agents move fast, but they never push a critical change alone. When severity
            is critical — or root-cause confidence drops below 70% — the workflow halts and
            routes to a manager. Approve, and remediation resumes. Reject, and it's logged.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: Gauge, h: "Confidence-gated", d: "Sub-70% certainty escalates automatically." },
              { icon: Lock, h: "Role-based approval", d: "Only managers and admins can authorize fixes." },
              { icon: ClipboardCheck, h: "Nothing off the record", d: "Approvals, overrides and retries are all sealed." },
            ].map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.h} className="flex items-start gap-3.5">
                  <span className="grid place-items-center w-9 h-9 rounded-lg bg-[var(--card)] border border-[var(--line-strong)] text-[var(--accent)] shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-[15px]">{r.h}</p>
                    <p className="text-[13.5px] text-[var(--muted)]">{r.d}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* approval card mock */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-2xl bg-[radial-gradient(60%_60%_at_50%_0%,rgba(217,56,30,0.12),transparent)]" />
          <div className="relative rounded-xl border border-[var(--line-strong)] bg-[var(--card)] p-6 shadow-[0_30px_60px_-30px_rgba(27,24,19,0.35)]">
            <div className="flex items-center justify-between">
              <span className="font-data text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">INC-4 · Approval required</span>
              <span className="px-2 py-0.5 rounded-sm font-data text-[10px] font-bold bg-[var(--accent-soft)] text-[var(--accent-deep)]">CRITICAL</span>
            </div>
            <h3 className="font-display text-[20px] font-bold mt-3 leading-snug">Auth service login failures spiking</h3>
            <div className="mt-4 space-y-2.5 font-data text-[12px]">
              <div className="flex justify-between border-b border-[var(--line)] pb-2">
                <span className="text-[var(--muted)]">Root cause</span>
                <span className="text-[var(--ink)] text-right max-w-[60%]">Expired Redis signing keys</span>
              </div>
              <div className="flex justify-between border-b border-[var(--line)] pb-2">
                <span className="text-[var(--muted)]">RCA confidence</span>
                <span className="text-[var(--signal)] font-bold">94%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Risk level</span>
                <span className="text-[var(--accent-deep)] font-bold">HIGH</span>
              </div>
            </div>
            <div className="mt-5 flex gap-2.5">
              <button className="flex-1 rounded-md bg-[var(--signal)] text-white py-2.5 text-[13px] font-semibold hover:opacity-90 transition">Approve & remediate</button>
              <button className="rounded-md border border-[var(--line-strong)] px-4 py-2.5 text-[13px] font-semibold text-[var(--ink-soft)] hover:border-[var(--ink)] transition">Reject</button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative paper-grid grain border-t border-[var(--line)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_80%_at_50%_120%,rgba(217,56,30,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="font-display text-[clamp(2.2rem,5vw,3.4rem)] font-extrabold tracking-[-0.03em] leading-[1.02]">
            Stand up your<br /><span className="text-[var(--accent)]">command center.</span>
          </h2>
          <p className="mt-5 text-[17px] text-[var(--ink-soft)] max-w-xl mx-auto leading-relaxed">
            Spin up an account and file your first incident in under a minute — or sign in
            with a demo role and watch the crew work.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href={primaryHref} className="group inline-flex items-center gap-2 rounded-md bg-[var(--ink)] text-[var(--paper)] px-6 py-3.5 text-[15px] font-semibold hover:bg-[var(--accent)] transition-colors">
              {primaryLabel}
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-md border border-[var(--line-strong)] bg-[var(--card)] px-6 py-3.5 text-[15px] font-semibold hover:border-[var(--ink)] transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-[var(--line)] bg-[var(--paper-2)]">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center w-7 h-7 rounded bg-[var(--ink)] text-[var(--paper)]">
              <Shield className="w-3.5 h-3.5" />
            </span>
            <span className="font-display font-extrabold tracking-tight">AegisOps<span className="text-[var(--accent)]">.</span></span>
          </div>
          <p className="font-data text-[11px] text-[var(--muted)] text-center">
            Multi-agent incident response · orchestrated by UiPath Maestro · UiPath AgentHack 2026
          </p>
          <div className="flex items-center gap-5 font-data text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
            <Link href="/login" className="hover:text-[var(--ink)] transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-[var(--ink)] transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
