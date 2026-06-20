"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import DashboardLayout from "@/components/DashboardLayout";
import { severityBadge, statusBadge, CARD } from "@/lib/theme";
import { Search, ChevronRight, Clock, FileWarning, Loader2 } from "lucide-react";

interface Incident {
  id: number;
  title: string;
  description: string;
  severity: string;
  status: string;
  created_at: string;
}

export default function IncidentsListPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: incidents, isLoading, error } = useQuery<Incident[]>({
    queryKey: ["incidents"],
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

  const filteredIncidents =
    incidents?.filter((inc) => {
      const matchesSearch =
        inc.title.toLowerCase().includes(search.toLowerCase()) ||
        inc.description.toLowerCase().includes(search.toLowerCase()) ||
        `INC-${inc.id}`.toLowerCase().includes(search.toLowerCase());
      const matchesSeverity = filterSeverity === "all" || inc.severity.toLowerCase() === filterSeverity.toLowerCase();
      const matchesStatus = filterStatus === "all" || inc.status.toLowerCase() === filterStatus.toLowerCase();
      return matchesSearch && matchesSeverity && matchesStatus;
    }) || [];

  const selectClass =
    "bg-[var(--card)] border border-[var(--line-strong)] rounded-md px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 cursor-pointer";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--line)] pb-6">
          <div>
            <h1 className="font-display text-[24px] font-extrabold tracking-tight text-[var(--ink)]">Security incidents queue</h1>
            <p className="text-[12.5px] text-[var(--muted)] mt-1">Browse, filter, and track multi-agent response flows</p>
          </div>
          <Link
            href="/incidents/new"
            className="px-4 py-2 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-deep)] text-white font-semibold text-xs transition text-center"
          >
            File new incident
          </Link>
        </div>

        {/* Filters */}
        <div className={`${CARD} p-4 flex flex-col md:flex-row gap-4`}>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-[var(--muted)]" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, title, or description…"
              className="w-full bg-[var(--paper-2)] border border-[var(--line-strong)] rounded-md pl-10 pr-4 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-data text-[10.5px] uppercase tracking-wider text-[var(--muted)]">SEVERITY:</span>
            <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className={selectClass}>
              <option value="all">ALL SEVERITIES</option>
              <option value="critical">CRITICAL</option>
              <option value="high">HIGH</option>
              <option value="medium">MEDIUM</option>
              <option value="low">LOW</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-data text-[10.5px] uppercase tracking-wider text-[var(--muted)]">STATUS:</span>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectClass}>
              <option value="all">ALL STATUSES</option>
              <option value="open">OPEN</option>
              <option value="investigating">INVESTIGATING</option>
              <option value="waiting_approval">WAITING APPROVAL</option>
              <option value="remediating">REMEDIATING</option>
              <option value="resolved">RESOLVED</option>
              <option value="closed">CLOSED</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className={`${CARD} overflow-hidden`}>
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
              <span className="font-data text-xs text-[var(--muted)]">Connecting to SOC database…</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <FileWarning className="w-8 h-8 text-[var(--accent)] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[var(--ink)]">Failed to connect to backend API</p>
              <p className="text-xs text-[var(--muted)] mt-1">Please make sure the FastAPI backend is running.</p>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-[var(--line)] m-4 rounded-xl">
              <Clock className="w-8 h-8 text-[var(--line-strong)] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[var(--ink)]">No matching incidents found</p>
              <p className="text-xs text-[var(--muted)] mt-1">Adjust your search terms or filters above.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--paper-2)]/60 text-[var(--muted)] font-data uppercase tracking-[0.14em] text-[9.5px]">
                  <th className="px-6 py-4 font-semibold">INCIDENT_ID</th>
                  <th className="px-6 py-4 font-semibold">DATE_CREATED</th>
                  <th className="px-6 py-4 font-semibold">INCIDENT_TITLE</th>
                  <th className="px-6 py-4 font-semibold">SEVERITY</th>
                  <th className="px-6 py-4 font-semibold">WORKFLOW_STATUS</th>
                  <th className="px-6 py-4 font-semibold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filteredIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-[var(--paper-2)]/60 transition group">
                    <td className="px-6 py-4 font-data text-[var(--ink-soft)] font-medium">INC-{inc.id}</td>
                    <td className="px-6 py-4 text-[var(--muted)] font-data">
                      {new Date(inc.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[var(--ink)]">{inc.title}</div>
                      <div className="text-[11px] text-[var(--muted)] truncate max-w-[320px] mt-0.5">{inc.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded border font-data text-[9.5px] font-bold uppercase ${severityBadge(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded border font-data text-[9.5px] font-bold uppercase ${statusBadge(inc.status)}`}>
                        {inc.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/incidents/${inc.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-[var(--line-strong)] bg-[var(--paper-2)] hover:border-[var(--accent)] hover:text-[var(--accent-deep)] text-[var(--ink)] text-xs font-semibold transition"
                      >
                        Investigate <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                      </Link>
                    </td>
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
