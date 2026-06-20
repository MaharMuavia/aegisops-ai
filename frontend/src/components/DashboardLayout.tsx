"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import {
  Shield,
  LayoutDashboard,
  AlertTriangle,
  CheckSquare,
  FileText,
  BarChart3,
  LogOut,
  MessageSquare,
  User as UserIcon,
  X,
  Send,
  Loader2,
  Database,
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Welcome to AegisOps AI SOC Assistant. How can I help you investigate or remediate incidents today?" },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="theme-light font-body min-h-screen bg-paper text-[var(--ink)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userText = chatMessage;
    setChatMessage("");
    setChatHistory((prev) => [...prev, { sender: "user", text: userText }]);
    setChatLoading(true);

    try {
      const response = await fetch("http://localhost:8001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ message: userText }),
      });

      const data = await response.json();
      setChatHistory((prev) => [...prev, { sender: "ai", text: data.response }]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { sender: "ai", text: "Connection error: failed to reach the AegisOps AI backend." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Active Incidents", href: "/incidents", icon: AlertTriangle },
    { name: "Approvals Center", href: "/approvals", icon: CheckSquare },
    { name: "Audit Center", href: "/audit", icon: FileText },
    { name: "SOC Analytics", href: "/analytics", icon: BarChart3 },
  ];

  return (
    <div className="theme-light font-body min-h-screen bg-[var(--paper)] text-[var(--ink)] flex overflow-hidden">
      {/* ===== Sidebar ===== */}
      <aside className="w-64 bg-[var(--paper-2)] border-r border-[var(--line)] flex flex-col shrink-0">
        {/* Brand */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-[var(--line)]">
          <span className="grid place-items-center w-9 h-9 rounded-md bg-[var(--ink)] text-[var(--paper)]">
            <Shield className="w-4.5 h-4.5" strokeWidth={2.2} />
          </span>
          <div className="leading-tight">
            <div className="font-display text-[16px] font-extrabold tracking-tight">
              AegisOps<span className="text-[var(--accent)]">.</span>
            </div>
            <div className="font-data text-[9px] uppercase tracking-[0.18em] text-[var(--muted)]">Command Center</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md text-[13.5px] font-medium transition-all border ${
                  isActive
                    ? "bg-[var(--accent-soft)] border-[var(--accent)]/40 text-[var(--accent-deep)] font-semibold"
                    : "text-[var(--ink-soft)] border-transparent hover:bg-[var(--card)] hover:border-[var(--line)] hover:text-[var(--ink)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div className="p-4 border-t border-[var(--line)] bg-[var(--card)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--paper-2)] border border-[var(--line-strong)] grid place-items-center">
              <UserIcon className="w-4 h-4 text-[var(--ink-soft)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold text-[var(--ink)] truncate">{user.username}</p>
              <span className="inline-block font-data text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink-soft)]">
                {user.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md border border-[var(--line-strong)] bg-[var(--paper)] hover:border-[var(--accent)] hover:text-[var(--accent-deep)] text-xs font-semibold text-[var(--ink-soft)] transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ===== Main ===== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-[var(--line)] bg-[var(--paper)]/85 backdrop-blur flex items-center justify-between px-8 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-data text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
              SOC_AGENT_STATUS: <span className="text-[var(--signal)] font-bold">ACTIVE</span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-[var(--signal-soft)] border border-[var(--signal)]/30 px-2 py-0.5 rounded font-data text-[10px] text-[var(--signal)] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)] blink" />
              MAESTRO ONLINE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md border border-[var(--line-strong)] bg-[var(--card)] hover:border-[var(--accent)] hover:text-[var(--accent-deep)] text-xs font-semibold text-[var(--ink)] transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[var(--accent)]" />
              AI Chat Assistant
            </button>
            <div className="font-data text-[10.5px] text-[var(--muted)] border border-[var(--line)] px-3 py-2 rounded-md bg-[var(--card)]">
              UiPath Maestro v2.6.4
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 overflow-y-auto p-8 bg-[var(--paper)]">{children}</main>
      </div>

      {/* ===== AI chat panel ===== */}
      <div
        className={`fixed inset-y-0 right-0 w-[420px] bg-[var(--card)] border-l border-[var(--line-strong)] shadow-[0_20px_60px_-20px_rgba(27,24,19,0.25)] flex flex-col transition-transform duration-300 ease-in-out z-50 ${
          chatOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--line)] bg-[var(--paper-2)]">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="font-semibold text-[var(--ink)] text-sm">SOC RAG Knowledge Search</h3>
          </div>
          <button
            onClick={() => setChatOpen(false)}
            className="p-1 rounded hover:bg-[var(--paper)] text-[var(--ink-soft)] hover:text-[var(--ink)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-data text-xs">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col gap-1 max-w-[85%] ${msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
            >
              <span className="text-[10px] text-[var(--muted)]">
                {msg.sender === "user" ? "analyst" : "aegisops_ai"}
              </span>
              <div
                className={`p-3 rounded-lg border leading-relaxed whitespace-pre-line ${
                  msg.sender === "user"
                    ? "bg-[var(--paper-2)] border-[var(--line)] text-[var(--ink)]"
                    : "bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent-deep)]"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex items-center gap-2 text-[var(--muted)] text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Querying database vectors…</span>
            </div>
          )}
        </div>

        <form onSubmit={sendChatMessage} className="p-4 border-t border-[var(--line)] bg-[var(--paper-2)] flex gap-2">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Ask SOP questions (e.g. 'how to fix pool exhaustion')…"
            className="flex-1 bg-[var(--card)] border border-[var(--line-strong)] rounded-md px-3 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
            disabled={chatLoading}
          />
          <button
            type="submit"
            className="p-2 bg-[var(--accent)] hover:bg-[var(--accent-deep)] text-white rounded-md transition shrink-0 disabled:opacity-50"
            disabled={chatLoading}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
