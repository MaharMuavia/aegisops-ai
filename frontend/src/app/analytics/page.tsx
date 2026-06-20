"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import DashboardLayout from "@/components/DashboardLayout";
import { CARD } from "@/lib/theme";
import { Loader2 } from "lucide-react";

interface Metrics {
  active_incidents: number;
  resolved_incidents: number;
  pending_approvals: number;
  average_resolution_time: number;
  agent_health_score: number;
  severity_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
  daily_trends: Array<{ date: string; created: number; resolved: number }>;
}

export default function AnalyticsPage() {
  const { user } = useAuthStore();

  const { data: metrics, isLoading } = useQuery<Metrics>({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8001/api/metrics", {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return res.json();
    },
    enabled: !!user?.token,
  });

  const agentBenchmarkRuntimes = [
    { name: "Intake Agent",     time: 1.2, desc: "Triage & parsing logic" },
    { name: "Log Agent",        time: 2.8, desc: "Pattern anomaly scanning" },
    { name: "Knowledge Agent",  time: 1.9, desc: "RAG index search" },
    { name: "RCA Agent",        time: 3.1, desc: "Inference synthesis" },
    { name: "Resolution Agent", time: 2.1, desc: "Remediation planning" },
    { name: "Audit Agent",      time: 0.9, desc: "Compliance compilation" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="border-b border-[var(--line)] pb-6">
          <h1 className="font-display text-[24px] font-extrabold tracking-tight text-[var(--ink)]">SOC operational analytics</h1>
          <p className="text-[12.5px] text-[var(--muted)] mt-1">
            Performance metrics, response efficiency benchmarks, and agent task runtime distributions
          </p>
        </div>

        {isLoading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            <span className="font-data text-xs text-[var(--muted)]">Gathering SOC metrics database…</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`${CARD} p-5`}>
                <span className="font-data text-[10.5px] uppercase tracking-[0.16em] text-[var(--muted)] block">MEAN TIME TO MITIGATE</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="font-display text-[32px] font-extrabold text-[var(--ink)]">{metrics?.average_resolution_time}</h3>
                  <span className="font-data text-xs text-[var(--ink-soft)]">minutes</span>
                </div>
                <p className="text-[10.5px] text-[var(--muted)] font-data mt-2 leading-relaxed">
                  Average duration from ticket creation to final resolution close.
                </p>
              </div>

              <div className={`${CARD} p-5`}>
                <span className="font-data text-[10.5px] uppercase tracking-[0.16em] text-[var(--muted)] block">AGENT PIPELINE HEALTH</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="font-display text-[32px] font-extrabold text-[var(--ink)]">{metrics?.agent_health_score}%</h3>
                  <span className="font-data text-xs text-[var(--ink-soft)]">success rate</span>
                </div>
                <p className="text-[10.5px] text-[var(--muted)] font-data mt-2 leading-relaxed">
                  Proportion of agent runs completed successfully without failing retries.
                </p>
              </div>

              <div className={`${CARD} p-5`}>
                <span className="font-data text-[10.5px] uppercase tracking-[0.16em] text-[var(--muted)] block">MITIGATION RATIO</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="font-display text-[32px] font-extrabold text-[var(--ink)]">
                    {metrics ? ((metrics.resolved_incidents / (metrics.active_incidents + metrics.resolved_incidents || 1)) * 100).toFixed(0) : 0}%
                  </h3>
                  <span className="font-data text-xs text-[var(--ink-soft)]">resolved / total</span>
                </div>
                <p className="text-[10.5px] text-[var(--muted)] font-data mt-2 leading-relaxed">
                  Ratio of closed/resolved tickets against total operational tickets.
                </p>
              </div>
            </div>

            {/* Trends + benchmarks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`${CARD} p-6 space-y-6`}>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--ink)]">Incident activity volume</h2>
                  <p className="text-[12.5px] text-[var(--muted)] mt-0.5">Tickets logged and resolved over the last 7 days</p>
                </div>

                <div className="h-48 w-full flex items-end justify-between gap-4 font-data text-[9px] text-[var(--muted)] pt-6">
                  {metrics?.daily_trends.map((t, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="w-full flex justify-center gap-1.5 items-end">
                        <div
                          style={{ height: `${Math.max(t.created * 20, 4)}px` }}
                          className="w-3.5 rounded-t-sm bg-[var(--accent)] hover:opacity-80 transition"
                          title={`Opened: ${t.created}`}
                        />
                        <div
                          style={{ height: `${Math.max(t.resolved * 20, 4)}px` }}
                          className="w-3.5 rounded-t-sm bg-[var(--signal)] hover:opacity-80 transition"
                          title={`Resolved: ${t.resolved}`}
                        />
                      </div>
                      <span className="text-[9px] whitespace-nowrap mt-1">{t.date}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 font-data text-xs border-t border-[var(--line)] pt-4 justify-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[var(--accent)]" />
                    <span className="text-[var(--muted)]">Tickets opened</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[var(--signal)]" />
                    <span className="text-[var(--muted)]">Tickets mitigated</span>
                  </div>
                </div>
              </div>

              <div className={`${CARD} p-6 space-y-6`}>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--ink)]">CrewAI agent benchmarks</h2>
                  <p className="text-[12.5px] text-[var(--muted)] mt-0.5">Average task execution runtime distribution (seconds)</p>
                </div>

                <div className="space-y-3.5 my-4">
                  {agentBenchmarkRuntimes.map((agent) => {
                    const maxTime = 4.0;
                    const pct = Math.min((agent.time / maxTime) * 100, 100);
                    return (
                      <div key={agent.name} className="space-y-1">
                        <div className="flex justify-between font-data text-xs">
                          <span className="text-[var(--ink-soft)]">{agent.name}</span>
                          <span className="text-[var(--ink)] font-semibold">{agent.time}s</span>
                        </div>
                        <div className="h-2 w-full bg-[var(--paper-2)] rounded-full overflow-hidden border border-[var(--line)] flex">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-gradient-to-r from-[var(--accent)] to-amber-500 rounded-full"
                          />
                        </div>
                        <span className="text-[9.5px] text-[var(--muted)] block">{agent.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Severity Allocation */}
            <div className={`${CARD} p-6 space-y-6`}>
              <div>
                <h2 className="text-sm font-semibold text-[var(--ink)]">Active threat distribution</h2>
                <p className="text-[12.5px] text-[var(--muted)] mt-0.5">Summary of severity levels in queue</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: "critical", label: "Critical", color: "text-red-800 border-red-300 bg-red-50" },
                  { key: "high",     label: "High",     color: "text-orange-800 border-orange-300 bg-orange-50" },
                  { key: "medium",   label: "Medium",   color: "text-amber-800 border-amber-300 bg-amber-50" },
                  { key: "low",      label: "Low",      color: "text-emerald-800 border-emerald-300 bg-emerald-50" },
                ].map((s) => {
                  const count = metrics?.severity_distribution[s.key] || 0;
                  return (
                    <div key={s.key} className={`border p-4 rounded-xl text-center ${s.color}`}>
                      <span className="font-data text-[10px] font-bold tracking-widest uppercase block mb-1">{s.label}</span>
                      <h4 className="font-display text-[32px] font-extrabold leading-none">{count}</h4>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
