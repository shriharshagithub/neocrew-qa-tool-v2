"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams } from "next/navigation";

const CATS = [
  { id: "bug",         label: "Bug",         cls: "text-tag-red   border-tag-red/30   bg-tag-red/8" },
  { id: "feature",     label: "Feature",     cls: "text-tag-purple border-tag-purple/30 bg-tag-purple/8" },
  { id: "improvement", label: "Improvement", cls: "text-tag-blue  border-tag-blue/30  bg-tag-blue/8" },
  { id: "question",    label: "Question",    cls: "text-tag-yellow border-tag-yellow/30 bg-tag-yellow/8" },
];

const PRIS = {
  critical: { color: "#e5484d", label: "Critical" },
  high:     { color: "#f76b15", label: "High" },
  medium:   { color: "#f5d90a", label: "Medium" },
  low:      { color: "#3e9b4f", label: "Low" },
};

const STATS = [
  { id: "todo",        label: "Todo",        color: "#62666d" },
  { id: "in_progress", label: "In Progress", color: "#3b9edd" },
  { id: "done",        label: "Done",        color: "#27a644" },
];

const getCat = (id) => CATS.find(c => c.id === id) || CATS[0];
const getPri = (id) => PRIS[id] || PRIS.medium;

function PriDot({ priority }) {
  const p = getPri(priority);
  return <span className="l-dot" style={{ background: p.color }} title={p.label} />;
}

function CatBadge({ category }) {
  const c = getCat(category);
  return (
    <span className={`l-badge ${c.cls}`}>{c.label}</span>
  );
}

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

  const done = items.filter(i => i.status === "done").length;
  const pct  = items.length ? Math.round((done / items.length) * 100) : 0;

  if (loading) return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <span className="w-5 h-5 border-2 border-hairline border-t-lavender rounded-full animate-spin" />
    </div>
  );

  if (!report) return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3">
      <p className="text-ink text-sm font-medium">Report not found</p>
      <p className="text-ink-tertiary text-xs">This link may have expired or been removed.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas text-ink">

      {/* Nav */}
      <header className="h-14 border-b border-hairline flex items-center px-6 gap-3">
        <img src="/neocrew-logo.png" alt="NeoCrew QA" className="h-5 w-auto" />
        <span className="text-hairline-strong">·</span>
        <span className="text-ink-tertiary text-sm">Shared report</span>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Title block */}
        <div className="mb-8">
          <h1 className="text-ink text-xl font-semibold tracking-tight mb-1">
            {report.title || "QA Report"}
          </h1>
          <p className="text-ink-tertiary text-sm">
            {items.length} item{items.length !== 1 ? "s" : ""}
            {" · "}
            {new Date(report.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        {/* Progress row */}
        {items.length > 0 && (
          <div className="mb-8">
            {/* Stats row */}
            <div className="flex items-center gap-6 mb-3">
              {STATS.map(s => {
                const count = items.filter(i => (i.status || "todo") === s.id).length;
                return (
                  <div key={s.id} className="flex items-center gap-1.5">
                    <span className="text-xs font-medium tabular" style={{ color: s.color }}>{count}</span>
                    <span className="text-xs text-ink-tertiary">{s.label}</span>
                  </div>
                );
              })}
              <div className="ml-auto text-xs text-ink-tertiary">
                <span className="text-ink font-medium tabular">{pct}%</span> resolved
              </div>
            </div>
            {/* Thin progress bar */}
            <div className="h-px bg-hairline rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, background: "#27a644" }}
              />
            </div>
            {/* Dev hint */}
            <p className="text-xs text-ink-tertiary mt-3">
              Click status buttons on each item to update progress — changes save instantly.
            </p>
          </div>
        )}

        {/* Items list */}
        {items.length === 0 ? (
          <div className="l-card flex items-center justify-center py-16">
            <p className="text-ink-tertiary text-sm">No items in this report</p>
          </div>
        ) : (
          <div className="l-card">
            {items.map((item, idx) => {
              const isDone = item.status === "done";
              return (
                <div
                  key={item.id}
                  className={`border-b border-hairline last:border-b-0 px-4 py-3.5 transition-opacity slide-in ${isDone ? "done-row" : ""}`}
                >
                  {/* Row top: dot + title + cat badge */}
                  <div className="flex items-start gap-2.5 mb-2.5">
                    <PriDot priority={item.priority} />
                    <span className={`text-sm font-medium leading-snug flex-1 row-title ${isDone ? "line-through text-ink-subtle" : "text-ink"}`}>
                      {item.title}
                    </span>
                    <CatBadge category={item.category} />
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-xs text-ink-subtle leading-relaxed mb-2.5 ml-[18px]">
                      {item.description}
                    </p>
                  )}

                  {/* Screenshot / video */}
                  {item.screenshot_url && (
                    <div className="ml-[18px] mb-2.5">
                      {item.media_type === "video"
                        ? <a href={item.screenshot_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-lavender hover:text-lavender-hover border border-hairline hover:border-hairline-strong rounded-lg px-3 py-1.5 transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            Watch on Loom
                          </a>
                        : <img src={item.screenshot_url} className="rounded-lg max-h-60 border border-hairline" alt="" />
                      }
                    </div>
                  )}

                  {/* Meta + status chips */}
                  <div className="flex items-center gap-3 ml-[18px] flex-wrap">
                    {item.raised_by && (
                      <span className="text-xs text-ink-tertiary">
                        {item.raised_by}
                      </span>
                    )}
                    <div className="flex items-center gap-1 ml-auto">
                      {STATS.map(s => {
                        const active = (item.status || "todo") === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => updateStatus(item.id, s.id)}
                            className={`l-chip text-xs ${
                              active
                                ? "border-hairline-strong text-ink bg-s2"
                                : "border-hairline text-ink-tertiary hover:text-ink hover:border-hairline-strong"
                            }`}
                            style={active ? { color: s.color } : {}}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-ink-tertiary mt-10">
          NeoCrew QA
        </p>
      </div>
    </div>
  );
}
