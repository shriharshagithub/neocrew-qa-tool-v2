"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams } from "next/navigation";

const CATEGORIES = [
  { id: "bug",         label: "Bug",         color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200",   emoji: "🐛" },
  { id: "feature",     label: "Feature",     color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200",emoji: "✨" },
  { id: "improvement", label: "Improvement", color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200",  emoji: "💡" },
  { id: "question",    label: "Question",    color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200", emoji: "❓" },
];

const PRIORITIES = [
  { id: "critical", label: "Critical", hex: "#dc2626" },
  { id: "high",     label: "High",     hex: "#ea580c" },
  { id: "medium",   label: "Medium",   hex: "#ca8a04" },
  { id: "low",      label: "Low",      hex: "#65a30d" },
];

const STATUSES = [
  { id: "todo",        label: "To Do",       color: "text-slate-600",  bg: "bg-slate-100",  ring: "ring-slate-400" },
  { id: "in_progress", label: "In Progress", color: "text-amber-700",  bg: "bg-amber-100",  ring: "ring-amber-400" },
  { id: "done",        label: "Done",        color: "text-emerald-700",bg: "bg-emerald-100",ring: "ring-emerald-400" },
];

const getCat    = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
const getPri    = (id) => PRIORITIES.find((p) => p.id === id) || PRIORITIES[2];
const getStatus = (id) => STATUSES.find((s) => s.id === id)   || STATUSES[0];

export default function SharedReport() {
  const { id }    = useParams();
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
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, status: newStatus } : i));
  };

  // ── stats ──
  const todoCount       = items.filter((i) => (i.status || "todo") === "todo").length;
  const inProgressCount = items.filter((i) => i.status === "in_progress").length;
  const doneCount       = items.filter((i) => i.status === "done").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-spin">⏳</div>
          <p className="text-slate-400 font-medium">Loading report…</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-slate-700 mb-2">Report not found</h1>
        <p className="text-slate-400 text-sm">The link may have expired or the report was deleted.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                <span>🧪</span>
                <span className="font-semibold">NeoCrew QA</span>
                <span>·</span>
                <span>Shared Report</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800">{report.title || "QA Report"}</h1>
              <p className="text-sm text-slate-400 mt-1">
                {items.length} item{items.length !== 1 ? "s" : ""} · Created {new Date(report.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            {/* Progress pill */}
            {items.length > 0 && (
              <div className="flex-shrink-0 text-right">
                <div className="text-2xl font-extrabold text-emerald-600">{Math.round((doneCount / items.length) * 100)}%</div>
                <div className="text-xs text-slate-400 font-medium">resolved</div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Status summary */}
        {items.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-100 rounded-xl p-4 text-center">
                <div className="text-2xl font-extrabold text-slate-600">{todoCount}</div>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">To Do</div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                <div className="text-2xl font-extrabold text-amber-600">{inProgressCount}</div>
                <div className="text-xs font-semibold text-amber-600 mt-0.5">In Progress</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                <div className="text-2xl font-extrabold text-emerald-600">{doneCount}</div>
                <div className="text-xs font-semibold text-emerald-600 mt-0.5">Done</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-slate-200 rounded-full mb-8 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(doneCount / items.length) * 100}%` }}
              />
            </div>
          </>
        )}

        {/* Note for devs */}
        {items.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 mb-6 text-sm text-blue-700">
            <span className="font-semibold">👋 Hey dev —</span> click the status buttons on each item to update progress. Changes are saved instantly.
          </div>
        )}

        {/* Items */}
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-slate-400 text-lg font-medium">No items in this report</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => {
              const cat = getCat(item.category);
              const pri = getPri(item.priority);
              const isDone = item.status === "done";
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 transition-opacity fade-in ${isDone ? "opacity-60" : ""}`}
                  style={{ borderLeft: `5px solid ${pri.hex}` }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className={`text-base font-bold text-slate-800 leading-snug ${isDone ? "line-through text-slate-400" : ""}`}>
                      <span className="text-slate-300 font-normal mr-1">{idx + 1}.</span> {item.title}
                    </h3>
                    <span className="flex-shrink-0 text-xs font-bold px-3 py-1 rounded-lg text-white" style={{ background: pri.hex }}>
                      {pri.label}
                    </span>
                  </div>

                  {/* Tags + status */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cat.bg} ${cat.color} ${cat.border}`}>
                      {cat.emoji} {cat.label}
                    </span>
                    <div className="flex gap-1.5">
                      {STATUSES.map((st) => {
                        const active = (item.status || "todo") === st.id;
                        return (
                          <button
                            key={st.id}
                            onClick={() => updateStatus(item.id, st.id)}
                            className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                              active
                                ? `${st.bg} ${st.color} border-transparent ring-1 ${st.ring}`
                                : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* People */}
                  {(item.raised_by || item.assignee) && (
                    <div className="flex gap-4 text-xs text-slate-500 mb-3">
                      {item.raised_by && <span>Raised by <strong className="text-slate-700">{item.raised_by}</strong></span>}
                      {item.assignee && <span>Assigned to <strong className="text-slate-700">{item.assignee}</strong></span>}
                    </div>
                  )}

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-slate-600 leading-relaxed mb-3 bg-slate-50 rounded-lg px-4 py-3">{item.description}</p>
                  )}

                  {/* Media */}
                  {item.screenshot_url && (
                    item.media_type === "video"
                      ? <video src={item.screenshot_url} controls className="rounded-xl max-h-80 w-auto shadow-sm mt-2" />
                      : <img src={item.screenshot_url} className="rounded-xl max-h-80 w-auto shadow-sm border border-slate-100 mt-2" alt="" />
                  )}

                  <p className="text-xs text-slate-300 mt-3">{new Date(item.created_at).toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-xs text-slate-300">
          Powered by <span className="font-semibold text-slate-400">NeoCrew QA Tool</span>
        </div>
      </div>
    </div>
  );
}
