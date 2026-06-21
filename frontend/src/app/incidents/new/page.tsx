"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import DashboardLayout from "@/components/DashboardLayout";
import { CARD } from "@/lib/theme";
import { ShieldAlert, Upload, FileText, X, ArrowLeft, Loader2 } from "lucide-react";

export default function SubmitIncidentPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("severity", severity);
      if (file) formData.append("file", file);

      const response = await fetch("http://localhost:8001/api/incidents", {
        method: "POST",
        headers: { Authorization: `Bearer ${user?.token}` },
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to submit incident");
      }
      const data = await response.json();
      router.push(`/incidents/${data.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full bg-[var(--paper-2)] border border-[var(--line-strong)] rounded-md px-3.5 py-2.5 text-[13px] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--ink)] transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to incident queue
        </button>

        <div className="border-b border-[var(--line)] pb-4">
          <h1 className="font-display text-[24px] font-extrabold tracking-tight text-[var(--ink)]">File operations incident ticket</h1>
          <p className="text-[12.5px] text-[var(--muted)] mt-1">
            Initiate multi-agent automated assessment, triage, and resolution protocols.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[var(--accent-soft)] border border-[var(--accent)]/30 text-[var(--accent-deep)] rounded-md font-data text-xs text-center">
            {error}
          </div>
        )}

        <div className={`${CARD} p-6`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="font-data text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">INCIDENT TITLE</label>
              <input
                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Database connection pool starved on auth worker node"
                className={inputCls} required disabled={loading}
              />
            </div>

            {/* Severity + protocol notice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="font-data text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">INITIAL SEVERITY VECTOR</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={inputCls + " cursor-pointer"} disabled={loading}>
                  <option value="low">LOW — minimal impact</option>
                  <option value="medium">MEDIUM — moderate degradation</option>
                  <option value="high">HIGH — direct customer transactions impacted</option>
                  <option value="critical">CRITICAL — core application outage / escalation trigger</option>
                </select>
                <span className="text-[10.5px] text-[var(--muted)] block leading-snug mt-1">
                  * Critical severity automatically flags the incident for human manager approval before applying resolution plans.
                </span>
              </div>

              <div className="bg-[var(--paper-2)] border border-[var(--line)] rounded-lg p-3.5 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
                <div className="text-[11px] text-[var(--ink-soft)] leading-relaxed">
                  <span className="font-bold text-[var(--ink)] block mb-1">Maestro automated protocol</span>
                  Submission initiates sequential intake parsing, anomaly scanning in logs, ChromaDB vector matching, and root cause evaluation.
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="font-data text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">DESCRIPTION & STEPS</label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail the failure signs, transaction errors, or trace details here…"
                rows={5} className={inputCls + " resize-none"} required disabled={loading}
              />
            </div>

            {/* Upload */}
            <div className="space-y-1.5">
              <label className="font-data text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">LOG FILE UPLOAD (OPTIONAL)</label>
              {!file ? (
                <div
                  onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                    dragActive
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--line-strong)] hover:border-[var(--ink-soft)] bg-[var(--paper-2)]"
                  }`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".log,.txt,.json" disabled={loading} />
                  <div className="p-3 bg-[var(--card)] rounded-full border border-[var(--line-strong)]">
                    <Upload className="w-5 h-5 text-[var(--ink-soft)]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--ink)]">Click or drag log file to upload</p>
                    <p className="text-[10.5px] text-[var(--muted)] mt-1">Supports .log, .txt, .json files up to 10MB</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 bg-[var(--paper-2)] border border-[var(--line-strong)] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--accent-soft)] rounded-md border border-[var(--accent)]/30">
                      <FileText className="w-5 h-5 text-[var(--accent-deep)]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--ink)]">{file.name}</p>
                      <p className="text-[10px] text-[var(--muted)] font-data mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button" onClick={removeFile}
                    className="p-1 rounded border border-[var(--line-strong)] bg-[var(--card)] text-[var(--ink-soft)] hover:text-[var(--accent)] transition"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--line)]">
              <button
                type="button" onClick={() => router.back()}
                className="px-4 py-2.5 rounded-md border border-[var(--line-strong)] bg-[var(--paper-2)] hover:border-[var(--ink-soft)] text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] transition"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-deep)] text-white font-semibold text-xs transition flex items-center gap-2 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Spinning up Maestro agents…
                  </>
                ) : (
                  <span>Initialize orchestration</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
