"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import DashboardLayout from "@/components/DashboardLayout";
import { severityBadge, statusBadge, CARD } from "@/lib/theme";
import {
  AlertTriangle,
  CheckSquare,
  Activity,
  Clock,
  TrendingUp,
  ChevronRight,
  Shield,
  Loader2,
  FileCode,
} from "lucide-react";

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

interface Incident {
  id: number;
  title: string;
  severity: string;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data: metrics, isLoading: metricsLoading } = useQuery<Metrics>({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8001/api/metrics", {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return res.json();
    },
    refetchInterval: 10000,
    enabled: !!user?.token,
  });

  const { data: incidents, isLoading: incidentsLoading } = useQuery<Incident[]>({
    queryKey: ["incidents", "active"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8001/api/incidents", {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch incidents");
      return res.json();
    },
    refetchInterval: 10000,
    enabled: !!user?.token,
  });

  const activeIncidentsList = incidents?.filter((i) => i.status !== "closed" && i.status !== "resolved") || [];

  const stats = [
    {
      key: "active",
      label: "ACTIVE INCIDENTS",
      value: metrics?.active_incidents,
      hint: "Needs investigation or response",
      icon: AlertTriangle,
      tone: "text-[var(--accent)] bg-[var(--accent-soft)] border-[var(--accent)]/30",
    },
    {
      key: "resolved",
      label: "RESOLVED INCIDENTS",
      value: metrics?.resolved_incidents,
      hint: "Resolved by automated remediation",
      icon: CheckSquare,
      tone: "text-[var(--signal)] bg-[var(--signal-soft)] border-[var(--signal)]/30",
    },
    {
      key: "pending",
      label: "PENDING APPROVALS",
      value: metrics?.pending_approvals,
      hint: "Awaiting manual manager check",
      icon: Clock,
      tone: "text-amber-700 bg-amber-100 border-amber-300",
    },
    {
      key: "health",
      label: "AGENT RUN SUCCESS",
      value: metrics ? `${metrics.agent_health_score}%` : undefined,
      hint: "CrewAI sequential flow health",
      icon: Activity,
      tone: "text-[var(--ink-blue)] bg-blue-50 border-blue-200",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--line)] pb-6">
          <div>
            <h1 className="font-display text-[28px] font-extrabold tracking-tight text-[var(--ink)]">SOC Command Dashboard</h1>
            <p className="text-[13.5px] text-[var(--muted)] mt-1">
              Real-time monitoring and multi-agent mitigation overview
            </p>
          </div>
          <Link
            href="/incidents/new"
            className="px-4 py-2.5 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-deep)] text-white font-semibold text-[13.5px] transition shrink-0 text-center"
          >
            File new incident
          </Link>
        </div>

        {/* Stats grid */}
        {metricsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className={`${CARD} h-28 animate-pulse`} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.key} className={`${CARD} p-5 hover:border-[var(--ink-soft)] transition`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-data text-[10.5px] uppercase tracking-[0.16em] text-[var(--muted)]">{s.label}</span>
                      <h3 className="font-display text-[32px] font-extrabold text-[var(--ink)] mt-2 leading-none">{s.value ?? "—"}</h3>
                    </div>
                    <div className={`p-2.5 rounded-md border ${s.tone}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="font-data text-[10.5px] text-[var(--muted)] mt-3">{s.hint}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily trends */}
          <div className={`${CARD} lg:col-span-2 p-6 flex flex-col justify-between`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
                <h2 className="text-sm font-semibold text-[var(--ink)]">Daily incident activity</h2>
              </div>
              <p className="text-[12.5px] text-[var(--muted)]">Total ticket submissions and mitigations over the last 7 days</p>
            </div>

            <div className="h-44 w-full flex items-end justify-between gap-4 mt-6 font-data text-[10px] text-[var(--muted)]">
              {metricsLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--line-strong)]" />
                </div>
              ) : (
                metrics?.daily_trends.map((t, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full flex justify-center gap-1">
                      <div
                        style={{ height: `${Math.max(t.created * 15, 6)}px` }}
                        className="w-3 rounded-sm bg-[var(--accent)] hover:opacity-80 transition"
                        title={`Created: ${t.created}`}
                      />
                      <div
                        style={{ height: `${Math.max(t.resolved * 15, 6)}px` }}
                        className="w-3 rounded-sm bg-[var(--signal)] hover:opacity-80 transition"
                        title={`Resolved: ${t.resolved}`}
                      />
                    </div>
                    <span>{t.date}</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-center gap-6 mt-4 border-t border-[var(--line)] pt-4 font-data text-[11.5px]">
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

          {/* Severity bars */}
          <div className={`${CARD} p-6 flex flex-col justify-between`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-[var(--accent)]" />
                <h2 className="text-sm font-semibold text-[var(--ink)]">Severity vector allocation</h2>
              </div>
              <p className="text-[12.5px] text-[var(--muted)]">Categorization of active threats</p>
            </div>

            {metricsLoading ? (
              <div className="h-44 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--line-strong)]" />
              </div>
            ) : (
              <div className="space-y-4 my-6">
                {[
                  { key: "critical", label: "Critical priority", bar: "bg-red-500" },
                  { key: "high",     label: "High priority",     bar: "bg-orange-500" },
                  { key: "medium",   label: "Medium priority",   bar: "bg-amber-500" },
                  { key: "low",      label: "Low priority",      bar: "bg-emerald-500" },
                ].map((s) => {
                  const count = metrics?.severity_distribution[s.key] || 0;
                  const total = Object.values(metrics?.severity_distribution || {}).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={s.key} className="space-y-1">
                      <div className="flex justify-between font-data text-[11px]">
                        <span className="text-[var(--ink-soft)]">{s.label}</span>
                        <span className="text-[var(--ink)] font-semibold">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--paper-2)] rounded-full overflow-hidden border border-[var(--line)]">
                        <div style={{ width: `${pct}%` }} className={`h-full ${s.bar}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="font-data text-[10.5px] text-[var(--muted)] border-t border-[var(--line)] pt-4">
              Real-time update interval: 10s polling active.
            </div>
          </div>
        </div>

        {/* Queue + agent cluster */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active queue */}
          <div className={`${CARD} lg:col-span-2 p-6 space-y-4 flex flex-col`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-semibold text-[var(--ink)]">Active operational queue</h2>
                <p className="text-[12.5px] text-[var(--muted)] mt-0.5">Tickets undergoing investigation or manual review</p>
              </div>
              <Link href="/incidents" className="text-xs text-[var(--accent-deep)] hover:underline font-semibold flex items-center gap-1">
                View all queue items <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              {incidentsLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
                </div>
              ) : activeIncidentsList.length === 0 ? (
                <div className="py-12 text-center font-data text-xs text-[var(--muted)] border border-dashed border-[var(--line-strong)] rounded-lg bg-[var(--paper-2)]/50">
                  SECURE STATE · no active incidents registered in queue.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-[var(--muted)] font-data uppercase tracking-[0.14em] text-[9.5px]">
                      <th className="pb-3 font-semibold">INCIDENT_ID</th>
                      <th className="pb-3 font-semibold">TITLE</th>
                      <th className="pb-3 font-semibold">SEVERITY</th>
                      <th className="pb-3 font-semibold">STATUS</th>
                      <th className="pb-3 font-semibold text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {activeIncidentsList.map((inc) => (
                      <tr key={inc.id} className="hover:bg-[var(--paper-2)]/60 transition group">
                        <td className="py-3.5 font-data text-[var(--ink-soft)] font-medium">INC-{inc.id}</td>
                        <td className="py-3.5 font-medium text-[var(--ink)] truncate max-w-[200px]">{inc.title}</td>
                        <td className="py-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded border font-data text-[9.5px] font-bold uppercase ${severityBadge(inc.severity)}`}>
                            {inc.severity}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded border font-data text-[9.5px] font-bold uppercase ${statusBadge(inc.status)}`}>
                            {inc.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <Link
                            href={`/incidents/${inc.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--line-strong)] bg-[var(--paper-2)] hover:border-[var(--accent)] hover:text-[var(--accent-deep)] text-[var(--ink)] text-xs font-semibold transition"
                          >
                            Investigate <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Agent cluster */}
          <div className={`${CARD} p-6 space-y-4 flex flex-col justify-between`}>
            <div>
              <h2 className="text-sm font-semibold text-[var(--ink)]">CrewAI SOC agent cluster</h2>
              <p className="text-[12.5px] text-[var(--muted)] mt-0.5">Live status and activity monitor of specialized agents</p>
            </div>

            <div className="space-y-3 my-4">
              {[
                { name: "Intake Agent",     role: "Classification",    desc: "Severity & metadata extraction" },
                { name: "Log Agent",        role: "Anomaly Detection", desc: "Stack trace pattern scanning" },
                { name: "Knowledge Agent",  role: "RAG Search",        desc: "Polls ChromaDB vector index" },
                { name: "RCA Agent",        role: "Synthesis",         desc: "Determines root causes" },
                { name: "Resolution Agent", role: "Remediation",       desc: "Drafts code scripts" },
                { name: "Audit Agent",      role: "Governance",        desc: "Records logs to database" },
              ].map((agent, i) => {
                const isWorking = activeIncidentsList.length > 0;
                let displayStatus = "STANDBY";
                if (isWorking) {
                  if (i === 1) displayStatus = "SCANNING_LOGS";
                  else if (i === 3) displayStatus = "SYNTHESIZING";
                  else displayStatus = "ACTIVE";
                }
                const isStandby = displayStatus === "STANDBY";
                const isAnalyzing = displayStatus.includes("SCANNING") || displayStatus.includes("SYNTHESIZING");

                return (
                  <div key={agent.name} className="flex justify-between items-center p-2.5 rounded-md bg-[var(--paper-2)]/60 border border-[var(--line)]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12.5px] font-semibold text-[var(--ink)]">{agent.name}</span>
                        <span className="font-data text-[9px] text-[var(--muted)] uppercase tracking-wider">{agent.role}</span>
                      </div>
                      <p className="text-[10.5px] text-[var(--muted)] mt-0.5">{agent.desc}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 font-data text-[9.5px] font-bold ${
                      isStandby ? "text-[var(--muted)]" : isAnalyzing ? "text-[var(--ink-blue)]" : "text-[var(--signal)]"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isStandby ? "bg-[var(--line-strong)]" : isAnalyzing ? "bg-[var(--ink-blue)] animate-ping" : "bg-[var(--signal)] animate-ping"
                      }`} />
                      {displayStatus}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 font-data text-[10.5px] text-[var(--muted)] bg-[var(--paper-2)] p-2.5 rounded-md border border-[var(--line)]">
              <FileCode className="w-4 h-4 text-[var(--accent)]" />
              <span>Orchestrated by sequential CrewAI workflow.</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
