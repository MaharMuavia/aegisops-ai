"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import DashboardLayout from "@/components/DashboardLayout";
import { severityBadge, statusBadge, CARD } from "@/lib/theme";
import {
  ArrowLeft,
  Clock,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Info,
  Download,
} from "lucide-react";

interface AgentResult {
  agent_name: string;
  output_raw: string;
  output_structured?: string;
  confidence_score: number;
}

interface AgentExecution {
  agent_name: string;
  status: string;
  retry_count: number;
  results: AgentResult[];
}

interface IncidentHistory {
  status_from: string;
  status_to: string;
  comment: string;
  changed_by: string;
  timestamp: string;
}

interface Approval {
  id: number;
  status: string;
  comments: string;
}

interface IncidentDetail {
  id: number;
  title: string;
  description: string;
  log_file_path?: string;
  severity: string;
  status: string;
  intake_summary?: string;
  root_cause?: string;
  confidence_score: number;
  resolution_plan?: string;
  risk_level?: string;
  created_at: string;
  history: IncidentHistory[];
  agent_executions: AgentExecution[];
  agent_results?: AgentResult[];
  approvals: Approval[];
}

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const incidentId = params?.id;

  const [activeTab, setActiveTab] = useState<"maestro" | "findings" | "plan" | "history">("maestro");
  const [approvalComment, setApprovalComment] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`http://localhost:8001/api/incidents/${incidentId}/report`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error("Failed to generate report");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `INC-${incidentId}-report.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  const { data: incident, isLoading, error } = useQuery<IncidentDetail>({
    queryKey: ["incident", incidentId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:8001/api/incidents/${incidentId}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch incident details");
      return res.json();
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "open" || status === "investigating" || status === "remediating" ? 1500 : 5000;
    },
    enabled: !!incidentId && !!user?.token,
  });

  // Generate terminal logs based on currently-running agent
  useEffect(() => {
    if (!incident) return;
    const execs = incident.agent_executions || [];
    const activeExec = execs.find((e) => e.status === "running");
    const timeStr = () => new Date().toLocaleTimeString("en-US", { hour12: false });

    if (activeExec) {
      const name = activeExec.agent_name;
      let logs: string[] = [];
      if (name === "intake") {
        logs = [
          `[${timeStr()}] [IntakeAgent] Parsing incident payload ticket INC-${incident.id}…`,
          `[${timeStr()}] [IntakeAgent] Extracting title tokens: "${incident.title.slice(0, 30)}…"`,
          `[${timeStr()}] [IntakeAgent] Evaluating business impact category and security footprint…`,
          `[${timeStr()}] [IntakeAgent] Threat severity classified as: ${incident.severity.toUpperCase()}`,
        ];
      } else if (name === "log_analyst") {
        logs = [
          `[${timeStr()}] [LogAgent] Accessing system diagnostic logs at: ${incident.log_file_path || "uploads/default.log"}`,
          `[${timeStr()}] [LogAgent] Parsing lines… scanning for fatal exception tags…`,
          `[${timeStr()}] [LogAgent] Found matching error stacktrace signatures. Correlating with CPU/Memory peaks…`,
          `[${timeStr()}] [LogAgent] Anomaly report generated. Timeline compiled.`,
        ];
      } else if (name === "kb_search") {
        logs = [
          `[${timeStr()}] [KBAgent] Connecting to ChromaDB vector database index 'aegisops_kb'…`,
          `[${timeStr()}] [KBAgent] Embedded query representation. Executing vector cosine similarity search…`,
          `[${timeStr()}] [KBAgent] Vector match found: 2 historical incidents, 1 standard operating procedure record.`,
          `[${timeStr()}] [KBAgent] Retrieving remediation plan template instructions…`,
        ];
      } else if (name === "rca") {
        logs = [
          `[${timeStr()}] [RCAAgent] Synthesizing multi-agent outputs (intake + log traces + KB matches)…`,
          `[${timeStr()}] [RCAAgent] Performing joint semantic inference over system logs and SOP documentation.`,
          `[${timeStr()}] [RCAAgent] Formulating probable root cause. Calculating error factor weights…`,
          `[${timeStr()}] [RCAAgent] Root cause determined with confidence score: ${incident.confidence_score}%`,
        ];
      } else if (name === "resolution") {
        logs = [
          `[${timeStr()}] [ResolutionAgent] Formulating step-by-step remediation action plan…`,
          `[${timeStr()}] [ResolutionAgent] Running safety evaluation to check risk constraints.`,
          `[${timeStr()}] [ResolutionAgent] Action script compiled: Maestro scripts queued.`,
        ];
      }
      setTerminalLogs((prev) => (prev.length === 0 || !prev[0].includes(name) ? logs : prev));
    } else {
      if (incident.status === "open") {
        setTerminalLogs([`[${timeStr()}] [Maestro] Queueing incident for multi-agent response workflow…`]);
      } else if (incident.status === "waiting_approval") {
        setTerminalLogs([
          `[${timeStr()}] [Maestro] Pipeline HALTED. Human approval required.`,
          `[${timeStr()}] [Escalation] Review recommended resolution plan and select Approve or Reject to resume.`,
        ]);
      } else if (incident.status === "remediating") {
        setTerminalLogs([
          `[${timeStr()}] [Maestro] Approval received. Executing automated remediation scripts…`,
          `[${timeStr()}] [Maestro] Isolating replica containers, executing script 'db_reap_sessions.sql'…`,
          `[${timeStr()}] [Kubernetes] Pod horizontal autoscaler triggered: scaling deployment.`,
        ]);
      } else if (incident.status === "resolved" || incident.status === "closed") {
        setTerminalLogs([
          `[${timeStr()}] [Audit] Incident response audit report compiled.`,
          `[${timeStr()}] [Maestro] Automated remediation completed successfully. INC-${incident.id} is SECURE.`,
        ]);
      }
    }
  }, [incident]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  const approvalMutation = useMutation({
    mutationFn: async ({ approvalId, approve, comment }: { approvalId: number; approve: boolean; comment: string }) => {
      const res = await fetch(`http://localhost:8001/api/approvals/${approvalId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ status: approve ? "approved" : "rejected", comments: comment }),
      });
      if (!res.ok) throw new Error("Failed to process approval");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident", incidentId] });
      setApprovalComment("");
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          <span className="font-data text-xs text-[var(--muted)]">Decoding incident telemetry data…</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !incident) {
    return (
      <DashboardLayout>
        <div className={`${CARD} text-center py-20 m-4`}>
          <AlertCircle className="w-8 h-8 text-[var(--accent)] mx-auto mb-2" />
          <h2 className="text-sm font-semibold text-[var(--ink)]">Telemetry decoder error</h2>
          <p className="text-xs text-[var(--muted)] mt-1">Failed to retrieve details for ticket INC-{incidentId}.</p>
        </div>
      </DashboardLayout>
    );
  }

  const activeApproval = incident.approvals?.find((a) => a.status === "pending");
  const isManagerOrAdmin = user?.role === "manager" || user?.role === "admin";

  const workflowSteps = [
    { key: "intake",      label: "Intake Agent",     desc: "Triage & parse" },
    { key: "log_analyst", label: "Log Agent",        desc: "Forensic scanning" },
    { key: "kb_search",   label: "Knowledge Agent",  desc: "RAG cos search" },
    { key: "rca",         label: "RCA Agent",        desc: "Cause triage" },
    { key: "resolution",  label: "Resolution Agent", desc: "Remediation script" },
    { key: "audit",       label: "Audit Agent",      desc: "Governance compliance" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-[var(--line)] pb-6">
          <div className="space-y-2">
            <button
              onClick={() => router.push("/incidents")}
              className="flex items-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--ink)] transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to incident list
            </button>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-data text-sm text-[var(--muted)]">INC-{incident.id}</span>
              <h1 className="font-display text-[22px] font-extrabold text-[var(--ink)] tracking-tight">{incident.title}</h1>
              <span className={`inline-block px-2.5 py-0.5 rounded border font-data text-[9.5px] font-bold uppercase ${severityBadge(incident.severity)}`}>
                {incident.severity}
              </span>
              <span className={`inline-block px-2.5 py-0.5 rounded border font-data text-[9.5px] font-bold uppercase ${statusBadge(incident.status)}`}>
                {incident.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-[12.5px] text-[var(--ink-soft)] mt-1 max-w-2xl leading-relaxed">{incident.description}</p>
          </div>

          <button
            onClick={handleDownloadReport}
            disabled={isDownloading || incident.status === "open"}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-[var(--line-strong)] bg-white hover:border-[var(--ink)] text-xs font-semibold text-[var(--ink-soft)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Download report
          </button>
        </div>

        {/* Approval gate */}
        {incident.status === "waiting_approval" && activeApproval && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-6 flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-700 animate-pulse" />
                <h3 className="font-semibold text-sm text-amber-900">Manual authorization required</h3>
              </div>
              <p className="text-[12.5px] text-amber-900/80 leading-relaxed max-w-xl">
                The master orchestrator halted task runs due to:{" "}
                <span className="text-amber-900 font-data font-semibold">{activeApproval.comments}</span>. Please inspect the recommended
                resolution actions below. If you verify the plan is safe, grant execution.
              </p>
            </div>

            {isManagerOrAdmin ? (
              <div className="flex flex-col gap-3 w-full md:w-auto min-w-[280px]">
                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Provide audit notes or reasoning (required)…"
                  className="bg-white border border-amber-300 rounded-md p-2.5 text-xs text-[var(--ink)] placeholder-amber-700/60 focus:outline-none focus:border-amber-500 resize-none h-16 w-full"
                  disabled={approvalMutation.isPending}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => approvalMutation.mutate({ approvalId: activeApproval.id, approve: false, comment: approvalComment })}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-[var(--line-strong)] bg-white hover:border-[var(--accent)] hover:text-[var(--accent-deep)] text-xs font-semibold text-[var(--ink-soft)] cursor-pointer disabled:opacity-50"
                    disabled={approvalMutation.isPending || !approvalComment.trim()}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button
                    onClick={() => approvalMutation.mutate({ approvalId: activeApproval.id, approve: true, comment: approvalComment })}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-[var(--signal)] hover:opacity-90 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                    disabled={approvalMutation.isPending || !approvalComment.trim()}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" /> Approve
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white border border-amber-300 rounded-md text-xs font-data text-amber-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Unauthorized: manager role required to action approvals.</span>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[var(--line)] text-xs font-semibold">
          {[
            { key: "maestro",  label: "Maestro orchestrator" },
            { key: "findings", label: "Agent triage findings" },
            { key: "plan",     label: "Resolution & root cause" },
            { key: "history",  label: "SOC system logs" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "maestro" | "findings" | "plan" | "history")}
              className={`px-5 py-3 border-b-2 transition ${
                activeTab === tab.key
                  ? "border-[var(--accent)] text-[var(--ink)] font-bold"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Maestro */}
        {activeTab === "maestro" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Workflow steps */}
            <div className={`${CARD} lg:col-span-2 p-6 space-y-6`}>
              <div>
                <h3 className="font-semibold text-sm text-[var(--ink)]">Maestro sequential pipeline</h3>
                <p className="text-[12.5px] text-[var(--muted)] mt-0.5">Automated multi-agent execution pipeline graph</p>
              </div>

              <div className="relative flex flex-col gap-6 py-4">
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-[var(--line)] z-0" />
                {workflowSteps.map((step, idx) => {
                  const dbExec = incident.agent_executions?.find((e) => e.agent_name === step.key);
                  const isCurrent = dbExec?.status === "running";
                  const isDone = dbExec?.status === "completed";
                  const isFailed = dbExec?.status === "failed";

                  return (
                    <div key={step.key} className="relative flex gap-4 items-start z-10">
                      <div
                        className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent-deep)] animate-pulse"
                            : isDone
                              ? "bg-[var(--signal-soft)] border-[var(--signal)] text-[var(--signal)]"
                              : isFailed
                                ? "bg-red-100 border-red-500 text-red-700"
                                : "bg-[var(--paper-2)] border-[var(--line-strong)] text-[var(--muted)]"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isCurrent ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isFailed ? (
                          <AlertCircle className="w-5 h-5" />
                        ) : (
                          <span className="font-data text-xs font-bold">{idx + 1}</span>
                        )}
                      </div>

                      <div className="flex-1 pt-1.5">
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-[13px] font-semibold ${
                              isCurrent ? "text-[var(--ink)] font-bold" : isDone ? "text-[var(--ink-soft)]" : "text-[var(--muted)]"
                            }`}
                          >
                            {step.label}
                          </span>
                          <span
                            className={`font-data text-[9.5px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                              isCurrent
                                ? "text-[var(--accent-deep)] bg-[var(--accent-soft)] border-[var(--accent)]/40 animate-pulse"
                                : isDone
                                  ? "text-[var(--signal)] bg-[var(--signal-soft)] border-[var(--signal)]/40"
                                  : isFailed
                                    ? "text-red-700 bg-red-100 border-red-300"
                                    : "text-[var(--muted)] bg-[var(--paper-2)] border-[var(--line)]"
                            }`}
                          >
                            {isCurrent ? "RUNNING" : isDone ? "COMPLETED" : isFailed ? "FAILED_RETRIES" : "STANDBY"}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-[var(--muted)] mt-0.5">{step.desc}</p>

                        {dbExec && dbExec.retry_count > 0 && (
                          <div className="inline-flex items-center gap-1 mt-1 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded font-data text-[9px] text-amber-800">
                            <Clock className="w-2.5 h-2.5" />
                            RETRY ATTEMPT #{dbExec.retry_count} (QUEUED RETRY)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Terminal */}
            <div className={`${CARD} overflow-hidden flex flex-col h-[400px]`}>
              <div className="px-4 py-3 bg-[var(--paper-2)] border-b border-[var(--line)] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-[var(--ink-soft)]" />
                  <span className="font-data text-[10px] text-[var(--ink-soft)] font-semibold uppercase tracking-wider">
                    Maestro agent stdout
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="w-2 h-2 rounded-full bg-[var(--signal)]" />
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto font-data text-[10.5px] text-[var(--ink-soft)] space-y-2.5 bg-[var(--ink)] leading-relaxed">
                {terminalLogs.map((log, i) => (
                  <div key={i} className="whitespace-pre-wrap select-all text-[#cfc7b9]">
                    {log}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Findings */}
        {activeTab === "findings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workflowSteps.map((step) => {
              const exec = incident.agent_executions?.find((e) => e.agent_name === step.key);
              const result = incident.agent_results?.find((r) => r.agent_name === step.key);

              return (
                <div key={step.key} className={`${CARD} p-5 space-y-4`}>
                  <div className="flex justify-between items-center border-b border-[var(--line)] pb-3">
                    <div>
                      <h3 className="font-semibold text-xs text-[var(--ink)]">{step.label} output</h3>
                      <span className="font-data text-[9px] text-[var(--muted)] uppercase">{step.desc}</span>
                    </div>
                    <span
                      className={`font-data text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                        exec?.status === "completed"
                          ? "text-[var(--signal)] bg-[var(--signal-soft)] border-[var(--signal)]/40"
                          : "text-[var(--muted)] bg-[var(--paper-2)] border-[var(--line)]"
                      }`}
                    >
                      {exec?.status || "STANDBY"}
                    </span>
                  </div>

                  {result ? (
                    <div className="space-y-4">
                      <p className="text-[12.5px] text-[var(--ink-soft)] leading-relaxed bg-[var(--paper-2)] border border-[var(--line)] p-3 rounded-md">
                        {result.output_raw}
                      </p>
                      {result.output_structured && (
                        <div className="space-y-2.5">
                          <span className="font-data text-[9.5px] font-bold text-[var(--muted)] tracking-wider uppercase block">
                            STRUCTURED DATA
                          </span>
                          <pre className="bg-[var(--ink)] border border-[var(--line-strong)] p-3 rounded-md font-data text-[10.5px] text-[#cfc7b9] overflow-x-auto max-h-40 whitespace-pre">
                            {JSON.stringify(JSON.parse(result.output_structured), null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center font-data text-xs text-[var(--muted)]">
                      Awaiting task completion to decode agent reports.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Resolution & Root Cause */}
        {activeTab === "plan" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`${CARD} p-6 space-y-6`}>
              <div>
                <h3 className="font-semibold text-sm text-[var(--ink)]">Root cause diagnostics</h3>
                <span className="font-data text-[9.5px] text-[var(--muted)] uppercase">Compiled by RCA Agent</span>
              </div>

              {incident.root_cause ? (
                <div className="space-y-6">
                  <div className="bg-[var(--paper-2)] border border-[var(--line)] p-4 rounded-lg flex items-center justify-between gap-4">
                    <div>
                      <span className="font-data text-[9.5px] text-[var(--muted)] block uppercase">RCA confidence score</span>
                      <h4 className="font-display text-[32px] font-extrabold text-[var(--ink)] mt-1 leading-none">
                        {incident.confidence_score}%
                      </h4>
                    </div>
                    <div
                      className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-data text-xs font-bold ${
                        incident.confidence_score >= 80
                          ? "border-[var(--signal)] text-[var(--signal)]"
                          : incident.confidence_score >= 70
                            ? "border-amber-500 text-amber-700"
                            : "border-red-500 text-red-700"
                      }`}
                    >
                      {incident.confidence_score >= 70 ? "SAFE" : "FAIL"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="font-data text-[9.5px] font-bold text-[var(--muted)] tracking-wider uppercase block">
                      Identified root cause
                    </span>
                    <p className="text-[12.5px] text-[var(--ink)] leading-relaxed bg-[var(--paper-2)] border border-[var(--line)] p-4 rounded-md">
                      {incident.root_cause}
                    </p>
                  </div>

                  {incident.risk_level && (
                    <div className="space-y-2">
                      <span className="font-data text-[9.5px] font-bold text-[var(--muted)] tracking-wider uppercase block">
                        Remediation risk vector
                      </span>
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border font-data text-xs uppercase ${
                          incident.risk_level === "high"
                            ? "text-red-700 bg-red-100 border-red-300"
                            : incident.risk_level === "medium"
                              ? "text-amber-700 bg-amber-100 border-amber-300"
                              : "text-emerald-700 bg-emerald-100 border-emerald-300"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            incident.risk_level === "high" ? "bg-red-500" : incident.risk_level === "medium" ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                        />
                        {incident.risk_level} risk remediation plan
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-20 text-center font-data text-xs text-[var(--muted)]">RCA diagnostics waiting on agent execution.</div>
              )}
            </div>

            <div className={`${CARD} lg:col-span-2 p-6 space-y-4`}>
              <div>
                <h3 className="font-semibold text-sm text-[var(--ink)]">Recommended remediation action</h3>
                <span className="font-data text-[9.5px] text-[var(--muted)] uppercase">Compiled by Resolution Agent</span>
              </div>
              {incident.resolution_plan ? (
                <div className="bg-[var(--paper-2)]/60 border border-[var(--line)] p-5 rounded-md text-[12.5px] leading-relaxed text-[var(--ink)] font-data overflow-y-auto max-h-[500px]">
                  <div className="whitespace-pre-line">{incident.resolution_plan}</div>
                </div>
              ) : (
                <div className="py-24 text-center font-data text-xs text-[var(--muted)] border border-dashed border-[var(--line)] rounded-xl">
                  Resolution plan draft waiting on agent execution.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: History */}
        {activeTab === "history" && (
          <div className={`${CARD} p-6 space-y-6`}>
            <div>
              <h3 className="font-semibold text-sm text-[var(--ink)]">Orchestrator workflow history</h3>
              <p className="text-[12.5px] text-[var(--muted)] mt-0.5">Chronological record of status changes and user/agent audits</p>
            </div>

            <div className="relative border-l border-[var(--line-strong)] ml-4 pl-6 space-y-6 text-xs">
              {incident.history?.map((hist, idx) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full border bg-[var(--card)] border-[var(--accent)]" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-[var(--ink)]">
                        Status transition: {hist.status_from.replace("_", " ")} →{" "}
                        <span className="text-[var(--accent-deep)]">{hist.status_to.replace("_", " ")}</span>
                      </span>
                      <span className="font-data text-[10px] text-[var(--muted)]">
                        {new Date(hist.timestamp).toLocaleString("en-US", { hour12: false })}
                      </span>
                    </div>
                    <p className="text-[var(--ink-soft)] leading-normal">{hist.comment}</p>
                    <span className="inline-block font-data text-[9.5px] text-[var(--muted)] uppercase mt-0.5">
                      Triggered by: {hist.changed_by}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
