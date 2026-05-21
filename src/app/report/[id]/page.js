"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams } from "next/navigation";

const CATEGORIES = [
  { id: "bug",         emoji: "🐛", label: "Bug",         badge: "bg-red-500/10 text-red-400 border border-red-500/20",       catCls: "cat-bug" },
  { id: "feature",     emoji: "✨", label: "Feature",     badge: "bg-violet-500/10 text-violet-400 border border-violet-500/20", catCls: "cat-feature" },
  { id: "improvement", emoji: "💡", label: "Improvement", badge: "bg-sky-500/10 text-sky-400 border border-sky-500/20",         catCls: "cat-improvement" },
  { id: "question",    emoji: "❓", label: "Question",    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",   catCls: "cat-question" },
];

const PRIORITIES = [
  { id: "critical", label: "Critical", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  { id: "high",     label: "High",     cls: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  { id: "medium",   label: "Medium",   cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  { id: "low",      label: "Low",      cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
];

const STATUSES = [
  { id: "todo",        label: "To Do",       active: "bg-zinc-700 text-zinc-200 border-zinc-600",               inactive: "bg-transparent text-zinc-600 border-zinc-800 hover:border-zinc-600" },
  { id: "in_progress", label: "In Progress", active: "bg-amber-500/15 text-amber-400 border-amber-500/30",      inactive: "bg-transparent text-zinc-600 border-zinc-800 hover:border-zinc-600" },
  { id: "done",        label: "Done",        active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",inactive: "bg-transparent text-zinc-600 border-zinc-800 hover:border-zinc-600" },
];

const getCat = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];
const getPri = (id) => PRIORITIES.find(p => p.id === id) || PRIORITIES[2];

export default function SharedReport() {
  const { id } = useParams();
  const [items,   setItems]   = useState([]);
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) loadReport(); }, [id]);

  const loadReport = async () => {
    if (!supabase) { setLoading(false); return; }
    const { data: rData } = await supabase.from("reports").select("*").eq("id", id).single();
    if (rData) setReport(rData);
    const { data } = await supabase.from("items").select("*").eq("report_id", id).order("created_at", { ascending: true });
    if (data) setItems(data);
    setLoading(false);
  };

  const updateStatus = async (itemId, newStatus) => {
    if (supabase) await supabase.from("items").update({ status: newStatus }).eq("id", itemId);
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, status: newStatus } : i));
  };

  const todo       = items.filter(i => (i.status || "todo") === "todo").length;
  const inProgress = items.filter(i => i.status === "in_progress").length;
  const done       = items.filter(i => i.status === "done").length;
  const pct        = items.length ? Math.round((done / items.length) * 100) : 0;

  if (loading) return (
    <div className="min-h-screen bg-qa-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-zinc-800 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-500 text-sm">Loading report…</p>
      </div>
    </div>
  );

  if (!report) return (
    <div className="min-h-screen bg-qa-bg flex flex-col items-center justify-center">
      <div className="text-5xl mb-4 opacity-30">🔍</div>
      <h1 className="font-display font-bold text-xl text-zinc-200">Report not found</h1>
      <p className="text-zinc-500 text-sm mt-2">This link may have expired.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-qa-bg text-qa-text">

      {/* Header */}
      <header className="border-b border-qa-border bg-qa-surface">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-qa-faint mb-2">
                <span>🧪</span>
                <span className="font-semibold text-qa-muted">NeoCrew QA</span>
                <span>·</span>
                <span>Shared Report</span>
              </div>
              <h1 className="font-display font-bold text-2xl text-qa-text">{report.title || "QA Report"}</h1>
              <p className="text-sm text-qa-muted mt-1">
                {items.length} item{items.length !== 1 ? "s" : ""}
                {" · "}Created {new Date(report.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            {items.length > 0 && (
              <div className="text-right flex-shrink-0">
                <div className="font-display font-bold text-3xl text-emerald-400">{pct}%</div>
                <div className="text-xs text-qa-muted font-medium mt-0.5">resolved</div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Status summary */}
        {items.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="qa-card p-4 text-center">
                <div className="font-display font-bold text-2xl text-zinc-300">{todo}</div>
                <div className="text-xs font-semibold text-qa-muted mt-0.5">To Do</div>
              </div>
              <div className="qa-card p-4 text-center border-amber-500/20">
                <div className="font-display font-bold text-2xl text-amber-400">{inProgress}</div>
                <div className="text-xs font-semibold text-amber-600 mt-0.5">In Progress</div>
              </div>
              <div className="qa-card p-4 text-center border-emerald-500/20">
                <div className="font-display font-bold text-2xl text-emerald-400">{done}</div>
                <div className="text-xs font-semibold text-emerald-600 mt-0.5">Done</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="h-2 bg-qa-border rounded-full overflow-hidden">
                <div className="progress-bar h-full" style={{ width: `${pct}%` }} />
              </div>
            </div>

            {/* Dev hint */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-5 py-3 mb-6 text-sm text-amber-300">
              <span className="font-semibold">👋 Hey dev —</span>
              <span className="text-amber-400/70"> click the status buttons to update progress. Changes save instantly.</span>
            </div>
          </>
        )}

        {/* Items */}
        {items.length === 0 ? (
          <div className="qa-card p-16 text-center opacity-40">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-qa-muted font-medium">No items in this report</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => {
              const cat  = getCat(item.category);
              const pri  = getPri(item.priority);
              const isDone = item.status === "done";
              return (
                <div
                  key={item.id}
                  className={`qa-card p-5 border-l-4 ${cat.catCls} slide-in transition-opacity ${isDone ? "done-item" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-semibold text-qa-text text-base leading-snug">
                      <span className="text-qa-faint font-normal text-sm mr-1">{idx + 1}.</span>
                      {item.title}
                    </h3>
                    <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg border ${pri.cls}`}>
                      {pri.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`badge ${cat.badge}`}>{cat.emoji} {cat.label}</span>
                    <div className="flex gap-1.5">
                      {STATUSES.map(st => {
                        const active = (item.status || "todo") === st.id;
                        return (
                          <button
                            key={st.id}
                            onClick={() => updateStatus(item.id, st.id)}
                            className={`status-chip ${active ? st.active : st.inactive}`}
                          >{st.label}</button>
                        );
                      })}
                    </div>
                  </div>

                  {(item.raised_by || item.assignee) && (
                    <div className="flex gap-4 text-xs text-qa-muted mb-3">
                      {item.raised_by && <span>Raised by <strong className="text-qa-text">{item.raised_by}</strong></span>}
                      {item.assignee  && <span>Assigned to <strong className="text-qa-text">{item.assignee}</strong></span>}
                    </div>
                  )}

                  {item.description && (
                    <p className="text-sm text-qa-muted leading-relaxed mb-3 bg-qa-surface rounded-lg px-3 py-2.5 border border-qa-border">
                      {item.description}
                    </p>
                  )}

                  {item.screenshot_url && (
                    item.media_type === "video"
                      ? <video src={item.screenshot_url} controls className="rounded-xl max-h-72 border border-qa-border mt-2" />
                      : <img src={item.screenshot_url} className="rounded-xl max-h-72 border border-qa-border mt-2" alt="" />
                  )}

                  <p className="text-xs text-qa-faint mt-3">{new Date(item.created_at).toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-12 text-xs text-qa-faint">
          <span className="font-display font-semibold text-zinc-600">NeoCrew QA</span>
        </div>
      </div>
    </div>
  );
}
