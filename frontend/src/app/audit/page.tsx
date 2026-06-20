"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import DashboardLayout from "@/components/DashboardLayout";
import { auditSeverityBadge, CARD } from "@/lib/theme";
import {
  FileText,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
  ChevronRight,
  Database,
} from "lucide-react";

interface AuditLog {
  id: number;
  incident_id?: number;
  event_type: string;
  details: string;
  severity: string;
  timestamp: string;
  triggered_by?: string;
}

export default function AuditCenterPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterEventType, setFilterEventType] = useState("all");

  const { data: logs, isLoading, error } = useQuery<AuditLog[]>({
    queryKey: ["audit_logs"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8001/api/audit", {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json();
    },
    refetchInterval: 10000,
    enabled: !!user?.token,
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case "workflow_close":
      case "approval_granted":
        return <CheckCircle2 className="w-4 h-4 text-[var(--signal)]" />;
      case "system_alert":
        return <AlertCircle className="w-4 h-4 text-[var(--accent)]" />;
      case "retry_triggered":
        return <Info className="w-4 h-4 text-amber-600" />;
      default:
        return <Database className="w-4 h-4 text-[var(--ink-soft)]" />;
    }
  };

  const filteredLogs =
    logs?.filter((log) => {
      const matchesSearch =
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.event_type.toLowerCase().includes(search.toLowerCase()) ||
        (log.incident_id && `INC-${log.incident_id}`.toLowerCase().includes(search.toLowerCase())) ||
        (log.triggered_by && log.triggered_by.toLowerCase().includes(search.toLowerCase()));
      const matchesSeverity = filterSeverity === "all" || log.severity.toLowerCase() === filterSeverity.toLowerCase();
      const matchesEventType = filterEventType === "all" || log.event_type.toLowerCase() === filterEventType.toLowerCase();
      return matchesSearch && matchesSeverity && matchesEventType;
    }) || [];

  const selectClass =
    "bg-[var(--card)] border border-[var(--line-strong)] rounded-md px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 cursor-pointer";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--line)] pb-6">
          <div>
            <h1 className="font-display text-[24px] font-extrabold tracking-tight text-[var(--ink)]">Immutable SOC audit trail</h1>
            <p className="text-[12.5px] text-[var(--muted)] mt-1">
              Read-only regulatory governance and sequential multi-agent decision trace records
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-md border border-[var(--line-strong)] bg-[var(--card)] hover:border-[var(--accent)] hover:text-[var(--accent-deep)] text-[var(--ink)] font-semibold text-xs transition"
          >
            Export report
          </button>
        </div>

        <div className={`${CARD} flex flex-col md:flex-row gap-4 p-4`}>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-[var(--muted)]" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by event details, trigger, or incident ID…"
              className="w-full bg-[var(--paper-2)] border border-[var(--line-strong)] rounded-md pl-10 pr-4 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-data text-[10.5px] uppercase tracking-wider text-[var(--muted)]">SEVERITY:</span>
            <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className={selectClass}>
              <option value="all">ALL SEVERITIES</option>
              <option value="critical">CRITICAL</option>
              <option value="error">ERROR</option>
              <option value="warning">WARNING</option>
              <option value="info">INFO</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-data text-[10.5px] uppercase tracking-wider text-[var(--muted)]">EVENT_TYPE:</span>
            <select value={filterEventType} onChange={(e) => setFilterEventType(e.target.value)} className={selectClass}>
              <option value="all">ALL EVENT TYPES</option>
              <option value="system_alert">SYSTEM ALERTS</option>
              <option value="user_action">USER ACTIONS</option>
              <option value="agent_trigger">AGENT TRIGGERS</option>
              <option value="approval_granted">APPROVAL ACTIONS</option>
              <option value="retry_triggered">QUEUE RETRIES</option>
              <option value="workflow_close">WORKFLOW COMPLETIONS</option>
            </select>
          </div>
        </div>

        <div className={`${CARD} overflow-hidden`}>
          {isLoading ? (
            <div className="py-24 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
          ) : error ? (
            <div className="py-16 text-center font-data text-xs text-[var(--muted)]">
              Failed to retrieve audit trail. Verify FastAPI is online.
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-20 text-center">
              <FileText className="w-8 h-8 text-[var(--line-strong)] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[var(--ink)]">No audit records found</p>
              <p className="text-xs text-[var(--muted)] mt-1">Adjust search parameters or clear filters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--paper-2)]/60 text-[var(--muted)] font-data uppercase tracking-[0.14em] text-[9.5px]">
                  <th className="px-6 py-4 font-semibold">LOG_TIMESTAMP</th>
                  <th className="px-6 py-4 font-semibold">EVENT_TYPE</th>
                  <th className="px-6 py-4 font-semibold">INCIDENT_ID</th>
                  <th className="px-6 py-4 font-semibold">LOG_DETAILS</th>
                  <th className="px-6 py-4 font-semibold">LOG_SEVERITY</th>
                  <th className="px-6 py-4 font-semibold text-right">TRIGGERED_BY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] font-data">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--paper-2)]/60 transition group">
                    <td className="px-6 py-4 text-[var(--muted)] text-[10.5px]">
                      {new Date(log.timestamp).toLocaleString("en-US", { hour12: false })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[var(--ink)] font-semibold">
                        {getEventIcon(log.event_type)}
                        <span>{log.event_type.toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[var(--ink-soft)]">
                      {log.incident_id ? (
                        <Link href={`/incidents/${log.incident_id}`} className="text-[var(--accent-deep)] hover:underline flex items-center gap-0.5">
                          INC-{log.incident_id} <ChevronRight className="w-3 h-3 text-[var(--muted)] inline" />
                        </Link>
                      ) : (
                        "GLOBAL"
                      )}
                    </td>
                    <td className="px-6 py-4 text-[var(--ink)] font-body text-xs max-w-sm leading-relaxed whitespace-pre-wrap select-all">
                      {log.details}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded border font-data text-[9px] font-bold uppercase ${auditSeverityBadge(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-[var(--ink-soft)] text-[10.5px]">{log.triggered_by || "System"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
