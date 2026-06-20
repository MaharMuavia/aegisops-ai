"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import DashboardLayout from "@/components/DashboardLayout";
import { CARD } from "@/lib/theme";
import { ThumbsUp, ThumbsDown, ChevronRight, Loader2, Info } from "lucide-react";

interface Approval {
  id: number;
  incident_id: number;
  requested_by: string;
  approved_by?: number;
  status: string;
  comments?: string;
  timestamp: string;
}

export default function ApprovalsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [activeApprovalId, setActiveApprovalId] = useState<number | null>(null);

  const { data: approvals, isLoading, error } = useQuery<Approval[]>({
    queryKey: ["approvals"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8001/api/approvals", {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch approvals");
      return res.json();
    },
    refetchInterval: 10000,
    enabled: !!user?.token,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ approvalId, approve, comment }: { approvalId: number; approve: boolean; comment: string }) => {
      const res = await fetch(`http://localhost:8001/api/approvals/${approvalId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ status: approve ? "approved" : "rejected", comments: comment }),
      });
      if (!res.ok) throw new Error("Failed to action approval");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      setCommentText("");
      setActiveApprovalId(null);
    },
  });

  const isManagerOrAdmin = user?.role === "manager" || user?.role === "admin";
  const pendingApprovals = approvals?.filter((a) => a.status === "pending") || [];
  const processedApprovals = approvals?.filter((a) => a.status !== "pending") || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--line)] pb-6">
          <div>
            <h1 className="font-display text-[24px] font-extrabold tracking-tight text-[var(--ink)]">Approvals queue</h1>
            <p className="text-[12.5px] text-[var(--muted)] mt-1">Authorizations queue for critical remediation plans</p>
          </div>
          <div className="font-data text-xs text-[var(--muted)] border border-[var(--line-strong)] px-3 py-2 rounded-md bg-[var(--card)]">
            Security role: <span className="text-[var(--ink)] font-bold uppercase">{user?.role}</span>
          </div>
        </div>

        {!isManagerOrAdmin && (
          <div className="p-3 bg-[var(--card)] border border-[var(--line-strong)] rounded-md font-data text-xs text-[var(--ink-soft)] flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Operational notice: you can review pending authorizations, but actioning approvals requires a manager or admin role.</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-24 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          </div>
        ) : error ? (
          <div className={`${CARD} py-16 text-center font-data text-xs text-[var(--muted)]`}>
            Failed to connect to SOC database. Please make sure FastAPI backend is running.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pending list */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-[var(--ink)]">Pending requests ({pendingApprovals.length})</h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">Authorization triggers waiting on review</p>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="py-16 text-center font-data text-xs text-[var(--muted)] border border-dashed border-[var(--line-strong)] bg-[var(--paper-2)]/50 rounded-xl">
                  CLEARED · no pending approvals in queue.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((appr) => {
                    const isActive = activeApprovalId === appr.id;
                    return (
                      <div
                        key={appr.id}
                        className={`bg-[var(--card)] border rounded-xl p-5 space-y-4 transition ${
                          isActive ? "border-amber-400 shadow-[0_8px_24px_-12px_rgba(180,120,0,0.25)]" : "border-[var(--line-strong)] hover:border-[var(--ink-soft)]"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-data text-[10px] text-[var(--muted)] uppercase tracking-wider">REQUEST_ID · APPR-{appr.id}</span>
                            <h3 className="font-semibold text-sm text-[var(--ink)] mt-1">Remediation for INC-{appr.incident_id}</h3>
                            <p className="text-xs text-[var(--ink-soft)] mt-2 font-data bg-[var(--paper-2)] p-2.5 rounded border border-[var(--line)]">
                              Trigger: {appr.comments}
                            </p>
                          </div>
                          <Link
                            href={`/incidents/${appr.incident_id}`}
                            className="inline-flex items-center gap-1 text-xs text-[var(--accent-deep)] hover:underline font-semibold transition"
                          >
                            Inspect incident <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>

                        {isManagerOrAdmin && (
                          <div className="pt-3 border-t border-[var(--line)] space-y-3">
                            {isActive ? (
                              <div className="space-y-3">
                                <textarea
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  placeholder="Provide audit remarks or approval comments (required)…"
                                  className="w-full bg-[var(--paper-2)] border border-[var(--line-strong)] rounded-md p-2.5 text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] resize-none h-16"
                                  disabled={approveMutation.isPending}
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => setActiveApprovalId(null)}
                                    className="px-3.5 py-1.5 rounded-md bg-[var(--paper-2)] border border-[var(--line-strong)] hover:border-[var(--ink-soft)] text-xs font-semibold text-[var(--ink-soft)]"
                                    disabled={approveMutation.isPending}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => approveMutation.mutate({ approvalId: appr.id, approve: false, comment: commentText })}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold disabled:opacity-50"
                                    disabled={approveMutation.isPending || !commentText.trim()}
                                  >
                                    <ThumbsDown className="w-3.5 h-3.5" /> Reject execution
                                  </button>
                                  <button
                                    onClick={() => approveMutation.mutate({ approvalId: appr.id, approve: true, comment: commentText })}
                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[var(--signal)] hover:opacity-90 text-white text-xs font-semibold disabled:opacity-50"
                                    disabled={approveMutation.isPending || !commentText.trim()}
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5" /> Authorize execution
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setActiveApprovalId(appr.id);
                                  setCommentText("");
                                }}
                                className="w-full py-2 bg-[var(--paper-2)] border border-[var(--line-strong)] hover:border-[var(--accent)] hover:text-[var(--accent-deep)] text-[var(--ink)] rounded-md text-xs font-semibold transition"
                              >
                                Review & action request
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* History */}
            <div className={`${CARD} p-5 space-y-4 h-fit`}>
              <div>
                <h2 className="text-sm font-semibold text-[var(--ink)]">Audit history</h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">Completed authorizations and audit trail</p>
              </div>

              {processedApprovals.length === 0 ? (
                <div className="py-12 text-center font-data text-xs text-[var(--muted)]">No historical approvals registered.</div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {processedApprovals.map((appr) => (
                    <div key={appr.id} className="p-3 bg-[var(--paper-2)]/60 border border-[var(--line)] rounded-md space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-[var(--ink)]">INC-{appr.incident_id}</span>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded font-data text-[9px] font-bold uppercase border ${
                            appr.status === "approved"
                              ? "text-emerald-700 bg-emerald-100 border-emerald-300"
                              : "text-red-700 bg-red-100 border-red-300"
                          }`}
                        >
                          {appr.status}
                        </span>
                      </div>
                      <p className="text-[var(--ink-soft)] italic">&ldquo;{appr.comments}&rdquo;</p>
                      <div className="flex justify-between items-center font-data text-[9px] text-[var(--muted)] mt-2 pt-1 border-t border-[var(--line)]">
                        <span>Approver_ID: #{appr.approved_by || "System"}</span>
                        <span>{new Date(appr.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
