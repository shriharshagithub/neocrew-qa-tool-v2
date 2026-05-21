"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

// ── constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "bug",         emoji: "🐛", label: "Bug",         border: "#ef4444", badge: "bg-red-500/10 text-red-400 border border-red-500/20",     catCls: "cat-bug" },
  { id: "feature",     emoji: "✨", label: "Feature",     border: "#8b5cf6", badge: "bg-violet-500/10 text-violet-400 border border-violet-500/20", catCls: "cat-feature" },
  { id: "improvement", emoji: "💡", label: "Improvement", border: "#38bdf8", badge: "bg-sky-500/10 text-sky-400 border border-sky-500/20",       catCls: "cat-improvement" },
  { id: "question",    emoji: "❓", label: "Question",    border: "#f59e0b", badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",  catCls: "cat-question" },
];

const PRIORITIES = [
  { id: "critical", label: "Critical", active: "bg-red-500 text-white",    inactive: "bg-red-500/10 text-red-400" },
  { id: "high",     label: "High",     active: "bg-orange-500 text-white",  inactive: "bg-orange-500/10 text-orange-400" },
  { id: "medium",   label: "Medium",   active: "bg-amber-500 text-zinc-950",inactive: "bg-amber-500/10 text-amber-400" },
  { id: "low",      label: "Low",      active: "bg-emerald-500 text-white", inactive: "bg-emerald-500/10 text-emerald-400" },
];

const STATUSES = [
  { id: "todo",        label: "To Do",       active: "bg-zinc-700 text-zinc-200 border-zinc-600",           inactive: "bg-transparent text-qa-faint border-qa-border hover:border-qa-bright" },
  { id: "in_progress", label: "In Progress", active: "bg-amber-500/15 text-amber-400 border-amber-500/30",  inactive: "bg-transparent text-qa-faint border-qa-border hover:border-qa-bright" },
  { id: "done",        label: "Done",        active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", inactive: "bg-transparent text-qa-faint border-qa-border hover:border-qa-bright" },
];

const TEAM = ["Shri", "Roshit", "Jhilik", "Ananya", "Ritesh", "Harsha"];

const getCat    = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];
const getPri    = (id) => PRIORITIES.find(p => p.id === id) || PRIORITIES[2];
const getStatus = (id) => STATUSES.find(s => s.id === id)   || STATUSES[0];

const todayTitle = () => {
  const d = new Date();
  return `QA Session – ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
};

const firstName = (user) => {
  const full = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
  return full.split(" ")[0] || user?.email?.split("@")[0] || "You";
};

// ── Compact item card (capture panel) ───────────────────────────────────────
function ItemCard({ item, onRemove }) {
  const cat = getCat(item.category);
  const pri = getPri(item.priority);
  return (
    <div className={`slide-in bg-qa-bg border border-qa-border rounded-xl p-3.5 border-l-4 ${cat.catCls} group`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`badge ${cat.badge}`}>{cat.emoji} {cat.label}</span>
            <span className={`badge ${pri.inactive}`}>{pri.label}</span>
          </div>
          <p className="text-sm font-medium text-qa-text truncate">{item.title}</p>
          {(item.raised_by || item.assignee) && (
            <p className="text-xs text-qa-faint mt-1">
              {item.raised_by && <span>↑ {item.raised_by}</span>}
              {item.raised_by && item.assignee && <span className="mx-1">·</span>}
              {item.assignee && <span>→ {item.assignee}</span>}
            </p>
          )}
        </div>
        <div className="flex items-start gap-2 flex-shrink-0">
          {item.screenshot_url && (
            item.media_type === "video"
              ? <video src={item.screenshot_url} className="w-12 h-9 object-cover rounded-lg border border-qa-border" />
              : <img src={item.screenshot_url} className="w-12 h-9 object-cover rounded-lg border border-qa-border" alt="" />
          )}
          <button
            onClick={() => onRemove(item.id)}
            className="text-qa-faint hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-sm bg-transparent border-none cursor-pointer mt-0.5"
          >✕</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();

  const [user, setUser]             = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [items, setItems]           = useState([]);
  const [reportId, setReportId]     = useState(null);
  const [reportTitle, setReportTitle] = useState(todayTitle());
  const [editingTitle, setEditingTitle] = useState(false);

  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory]     = useState("bug");
  const [priority, setPriority]     = useState("medium");
  const [raisedBy, setRaisedBy]     = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaFile, setMediaFile]   = useState(null);
  const [mediaType, setMediaType]   = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [view, setView]             = useState("capture");
  const [copied, setCopied]         = useState(false);
  const [saving, setSaving]         = useState(false);
  const [justAdded, setJustAdded]   = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);

  const [reports, setReports]       = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const fileRef = useRef(null);

  // ── auth ──
  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUser(user);
      setRaisedBy(firstName(user));
      setAuthLoading(false);
      loadOrCreateReport();
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") router.push("/login");
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        setRaisedBy(firstName(session.user));
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push("/login"); };

  // ── report ──
  const loadOrCreateReport = async () => {
    if (!supabase) return;
    try {
      const stored = localStorage.getItem("qa_report_id");
      if (stored) {
        const { data: rData } = await supabase.from("reports").select("id, title").eq("id", stored).single();
        if (rData) {
          setReportId(stored);
          if (rData.title) setReportTitle(rData.title);
          const { data } = await supabase.from("items").select("*").eq("report_id", stored).order("created_at", { ascending: true });
          if (data) setItems(data);
        } else await createNewReport(stored);
      } else await createNewReport();
    } catch (e) { console.error(e); }
  };

  const createNewReport = async (existingId) => {
    const newId = existingId || (Date.now().toString(36) + Math.random().toString(36).substring(2, 8));
    const newTitle = todayTitle();
    await supabase.from("reports").upsert({ id: newId, title: newTitle }, { onConflict: "id" });
    localStorage.setItem("qa_report_id", newId);
    setReportId(newId);
    setReportTitle(newTitle);
  };

  const saveTitle = async () => {
    if (!reportTitle.trim() || !supabase || !reportId) { setEditingTitle(false); return; }
    setSavingTitle(true);
    await supabase.from("reports").update({ title: reportTitle.trim() }).eq("id", reportId);
    setSavingTitle(false);
    setEditingTitle(false);
  };

  // ── media ──
  const handleFile = (file) => {
    if (!file || (!file.type.startsWith("image/") && !file.type.startsWith("video/"))) return;
    setMediaFile(file);
    setMediaType(file.type.startsWith("video/") ? "video" : "image");
    const reader = new FileReader();
    reader.onload = (e) => setMediaPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handlePaste = (e) => {
    for (const it of e.clipboardData.items) {
      if (it.type.startsWith("image/") || it.type.startsWith("video/")) { handleFile(it.getAsFile()); break; }
    }
  };

  const uploadMedia = async (file) => {
    if (!supabase) return null;
    try {
      const ext = file.name?.split(".").pop() || (file.type.startsWith("video/") ? "mp4" : "png");
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      await supabase.storage.from("screenshots").upload(fileName, file);
      return supabase.storage.from("screenshots").getPublicUrl(fileName).data.publicUrl;
    } catch (e) { console.error(e); return null; }
  };

  // ── add item ──
  const addItem = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    let mediaUrl = mediaPreview;
    if (mediaFile && supabase) { const url = await uploadMedia(mediaFile); if (url) mediaUrl = url; }
    const newItem = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
      report_id: reportId, title: title.trim(), description: description.trim(),
      category, priority, screenshot_url: mediaUrl, media_type: mediaType || "image",
      status: "todo", raised_by: raisedBy || null, assignee: assignedTo || null,
      created_at: new Date().toISOString(),
    };
    if (supabase && reportId) {
      await supabase.from("reports").upsert({ id: reportId, title: reportTitle }, { onConflict: "id" });
      await supabase.from("items").insert(newItem);
    }
    setItems(prev => [...prev, newItem]);
    setTitle(""); setDescription(""); setMediaPreview(null); setMediaFile(null); setMediaType(null);
    setRaisedBy(user ? firstName(user) : ""); setAssignedTo("");
    setSaving(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleKeyDown = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); addItem(); } };

  const removeItem = async (id) => {
    if (supabase) await supabase.from("items").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItemStatus = async (id, newStatus) => {
    if (supabase) await supabase.from("items").update({ status: newStatus }).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
  };

  const startNew = () => {
    if (!confirm("Start a new session? Your current report is saved.")) return;
    localStorage.removeItem("qa_report_id");
    setItems([]);
    const newTitle = todayTitle();
    const newId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    setReportId(newId); setReportTitle(newTitle);
    localStorage.setItem("qa_report_id", newId);
    setView("capture");
    if (supabase) supabase.from("reports").upsert({ id: newId, title: newTitle }, { onConflict: "id" });
  };

  const loadReports = async () => {
    if (!supabase) return;
    setLoadingReports(true);
    const { data } = await supabase.from("reports").select("id, title, created_at, items(count)").order("created_at", { ascending: false });
    if (data) setReports(data);
    setLoadingReports(false);
  };

  const loadReport = async (id) => {
    if (!supabase) return;
    localStorage.setItem("qa_report_id", id);
    setReportId(id);
    const { data: rData } = await supabase.from("reports").select("id, title").eq("id", id).single();
    if (rData?.title) setReportTitle(rData.title);
    const { data } = await supabase.from("items").select("*").eq("report_id", id).order("created_at", { ascending: true });
    if (data) setItems(data);
    setView("report");
  };

  const getShareUrl = () => typeof window !== "undefined" && reportId ? `${window.location.origin}/report/${reportId}` : "";
  const copyLink = () => { navigator.clipboard.writeText(getShareUrl()); setCopied(true); setTimeout(() => setCopied(false), 2500); };

  // ── stats ──
  const bugCount  = items.filter(i => i.category === "bug").length;
  const doneCount = items.filter(i => i.status === "done").length;
  const critCount = items.filter(i => i.priority === "critical").length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  // ─────────────────────────────────────────────────────────────────────────────
  if (authLoading) return (
    <div className="min-h-screen bg-qa-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-qa-border border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-qa-muted text-sm">Loading…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-qa-bg text-qa-text" onPaste={handlePaste} onKeyDown={handleKeyDown}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-qa-border bg-qa-surface sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-4">

          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-lg flex-shrink-0">🧪</span>
            <span className="font-display font-bold text-qa-text text-sm flex-shrink-0">NeoCrew QA</span>
            <span className="text-qa-faint flex-shrink-0">·</span>
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={e => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                  className="text-sm font-medium bg-transparent border-b border-amber-500 outline-none text-qa-text px-1 w-48"
                />
                <button onClick={saveTitle} className="text-xs text-amber-500 bg-transparent border-none cursor-pointer font-semibold">
                  {savingTitle ? "…" : "Save"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className="text-sm text-qa-muted hover:text-qa-text bg-transparent border-none cursor-pointer truncate max-w-xs flex items-center gap-1.5 group transition-colors"
              >
                <span className="truncate">{reportTitle}</span>
                <span className="text-qa-faint group-hover:text-qa-muted transition-colors text-xs">✏</span>
              </button>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {critCount > 0 && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                🔴 {critCount} critical
              </span>
            )}
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} className="w-7 h-7 rounded-full border border-qa-border" alt="" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/20">
                {firstName(user).charAt(0).toUpperCase()}
              </div>
            )}
            <button onClick={startNew} className="hidden sm:block text-xs font-semibold text-qa-muted hover:text-qa-text border border-qa-border hover:border-qa-bright bg-transparent px-3 py-1.5 rounded-lg transition-all cursor-pointer">
              + New
            </button>
            <button onClick={handleSignOut} className="text-xs text-qa-faint hover:text-red-400 bg-transparent border-none cursor-pointer transition-colors">
              Out
            </button>
          </div>
        </div>
      </header>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="border-b border-qa-border bg-qa-surface">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex gap-1 py-2.5">
            <button onClick={() => setView("capture")} className={`tab-btn ${view === "capture" ? "tab-active" : "tab-inactive"}`}>
              📸 Capture
            </button>
            <button onClick={() => setView("report")} className={`tab-btn ${view === "report" ? "tab-active" : "tab-inactive"}`}>
              📋 Report
              {items.length > 0 && (
                <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full ${view === "report" ? "bg-zinc-900/40 text-zinc-900" : "bg-qa-border text-qa-muted"}`}>
                  {items.length}
                </span>
              )}
            </button>
            <button onClick={() => { setView("sessions"); loadReports(); }} className={`tab-btn ${view === "sessions" ? "tab-active" : "tab-inactive"}`}>
              📂 Sessions
            </button>
            {items.length > 0 && (
              <div className="ml-auto flex items-center gap-2 self-center">
                <div className="w-24 h-1.5 bg-qa-border rounded-full overflow-hidden">
                  <div className="progress-bar h-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-qa-muted font-medium">{pct}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-5 py-6">

        {/* ══ CAPTURE ══ */}
        {view === "capture" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Form panel */}
            <div className="qa-card p-6">
              <h2 className="font-display font-bold text-base text-qa-text mb-5">Add Item</h2>

              {/* Drop zone */}
              <div
                onClick={() => fileRef.current.click()}
                onDrop={e => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all mb-5 ${
                  isDragging ? "border-amber-500/60 bg-amber-500/5" : "border-qa-border hover:border-qa-bright hover:bg-qa-surface"
                }`}
              >
                {mediaPreview && mediaType === "video" ? (
                  <video src={mediaPreview} controls className="max-h-40 rounded-lg mx-auto" />
                ) : mediaPreview ? (
                  <div className="relative inline-block">
                    <img src={mediaPreview} className="max-h-40 rounded-lg mx-auto border border-qa-border" alt="" />
                    <button
                      onClick={e => { e.stopPropagation(); setMediaPreview(null); setMediaFile(null); setMediaType(null); }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold border-none cursor-pointer flex items-center justify-center"
                    >✕</button>
                  </div>
                ) : (
                  <div className="py-2">
                    <div className="text-3xl mb-2">📷</div>
                    <p className="text-xs font-medium text-qa-muted">
                      Drop, <span className="text-qa-text font-bold">⌘V</span> paste, or click
                    </p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*,video/*" onChange={e => handleFile(e.target.files[0])} className="hidden" />
              </div>

              {/* Title */}
              <input type="text" placeholder="Issue title…" value={title} onChange={e => setTitle(e.target.value)} className="qa-input mb-3" />

              {/* Description */}
              <textarea placeholder="Steps to reproduce…" value={description} onChange={e => setDescription(e.target.value)} rows={2} className="qa-input mb-4 resize-none" />

              {/* Category */}
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-qa-faint mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        category === cat.id ? cat.badge + " scale-105" : "bg-transparent text-qa-faint border-qa-border hover:border-qa-bright"
                      }`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-qa-faint mb-2">Priority</p>
                <div className="flex gap-2">
                  {PRIORITIES.map(pri => (
                    <button
                      key={pri.id}
                      onClick={() => setPriority(pri.id)}
                      className={`pri-btn ${priority === pri.id ? pri.active : pri.inactive}`}
                    >{pri.label}</button>
                  ))}
                </div>
              </div>

              {/* People */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-qa-faint mb-1.5">Raised by</p>
                  <input list="tl-raised" type="text" placeholder="Your name…" value={raisedBy} onChange={e => setRaisedBy(e.target.value)} className="qa-input text-sm" />
                  <datalist id="tl-raised">{TEAM.map(m => <option key={m} value={m} />)}</datalist>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-qa-faint mb-1.5">Assigned to</p>
                  <input list="tl-assigned" type="text" placeholder="Team member…" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="qa-input text-sm" />
                  <datalist id="tl-assigned">{TEAM.map(m => <option key={m} value={m} />)}</datalist>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={addItem}
                disabled={!title.trim() || saving}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 border-none relative overflow-hidden ${
                  justAdded
                    ? "bg-emerald-500 text-white cursor-pointer"
                    : title.trim() && !saving
                    ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 cursor-pointer animate-pulse-amber active:scale-[0.99]"
                    : "bg-qa-card text-qa-faint cursor-not-allowed"
                }`}
              >
                {justAdded ? "✓ Added!" : saving ? "Saving…" : (
                  <span>Add to Report <span className="opacity-50 font-normal text-xs ml-1">⌘↵</span></span>
                )}
              </button>
            </div>

            {/* Live log */}
            <div className="qa-card p-6 flex flex-col" style={{ maxHeight: "78vh" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-bold text-base text-qa-text">Captured</h2>
                  {items.length > 0 && (
                    <p className="text-xs text-qa-muted mt-0.5">
                      {bugCount} bug{bugCount !== 1 ? "s" : ""}
                      {" · "}{items.filter(i => i.category === "feature").length} feature{items.filter(i => i.category === "feature").length !== 1 ? "s" : ""}
                      {doneCount > 0 && <span className="text-emerald-400"> · {doneCount} done</span>}
                    </p>
                  )}
                </div>
                {items.length > 0 && (
                  <button onClick={() => setView("report")} className="text-xs font-semibold text-amber-500 hover:text-amber-400 bg-transparent border-none cursor-pointer transition-colors">
                    View report →
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="text-5xl mb-4 opacity-30">📝</div>
                    <p className="text-qa-muted font-medium text-sm">Nothing yet</p>
                    <p className="text-qa-faint text-xs mt-1">Add your first item on the left</p>
                  </div>
                ) : (
                  [...items].reverse().map(item => (
                    <ItemCard key={item.id} item={item} onRemove={removeItem} />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ REPORT ══ */}
        {view === "report" && (
          <div>
            {/* Report header */}
            <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
              <div>
                <h1 className="font-display font-bold text-2xl text-qa-text">{reportTitle}</h1>
                <p className="text-sm text-qa-muted mt-1">
                  {items.length} item{items.length !== 1 ? "s" : ""}
                  {items.length > 0 && <> · <span className="text-emerald-400">{doneCount} done ({pct}%)</span></>}
                </p>
              </div>
              <button
                onClick={copyLink}
                disabled={items.length === 0}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border-none ${
                  copied
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-pointer"
                    : items.length > 0
                    ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 cursor-pointer"
                    : "bg-qa-card text-qa-faint cursor-not-allowed"
                }`}
              >
                {copied ? "✅ Copied!" : "🔗 Copy share link"}
              </button>
            </div>

            {/* Progress bar */}
            {items.length > 0 && (
              <div className="mb-6">
                <div className="h-1.5 bg-qa-border rounded-full overflow-hidden">
                  <div className="progress-bar h-full" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-qa-faint mt-1.5">{doneCount} of {items.length} resolved</p>
              </div>
            )}

            {/* Share URL */}
            {items.length > 0 && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
                <span className="text-emerald-400 text-xs font-semibold flex-shrink-0">Share:</span>
                <code className="text-emerald-400 text-xs break-all">{getShareUrl()}</code>
              </div>
            )}

            {/* Category stats */}
            {items.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {CATEGORIES.map(cat => {
                  const count = items.filter(i => i.category === cat.id).length;
                  return (
                    <div key={cat.id} className={`qa-card p-4 text-center border-l-4 ${cat.catCls}`}>
                      <div className="font-display font-bold text-2xl text-qa-text">{count}</div>
                      <div className={`text-xs font-semibold mt-0.5 ${cat.badge.includes("text-") ? cat.badge.split(" ").find(c => c.startsWith("text-")) : "text-qa-muted"}`}>
                        {cat.emoji} {cat.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Items */}
            {items.length === 0 ? (
              <div className="qa-card p-16 text-center">
                <div className="text-5xl mb-4 opacity-30">📭</div>
                <p className="text-qa-muted font-medium">Nothing captured yet</p>
                <button onClick={() => setView("capture")} className="mt-3 text-amber-500 text-sm bg-transparent border-none cursor-pointer hover:text-amber-400">
                  Start capturing →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, idx) => {
                  const cat  = getCat(item.category);
                  const pri  = getPri(item.priority);
                  const done = item.status === "done";
                  return (
                    <div key={item.id} className={`qa-card p-5 border-l-4 ${cat.catCls} slide-in transition-opacity ${done ? "done-item" : ""}`}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="font-semibold text-qa-text text-base leading-snug">
                          <span className="text-qa-faint font-normal mr-1 text-sm">{idx + 1}.</span>
                          {item.title}
                        </h3>
                        <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg ${pri.inactive}`}>
                          {pri.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`badge ${cat.badge}`}>{cat.emoji} {cat.label}</span>
                        <div className="flex gap-1.5">
                          {STATUSES.map(st => (
                            <button
                              key={st.id}
                              onClick={() => updateItemStatus(item.id, st.id)}
                              className={`status-chip ${(item.status || "todo") === st.id ? st.active : st.inactive}`}
                            >{st.label}</button>
                          ))}
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
                          ? <video src={item.screenshot_url} controls className="rounded-xl max-h-64 border border-qa-border mt-2" />
                          : <img src={item.screenshot_url} className="rounded-xl max-h-64 border border-qa-border mt-2" alt="" />
                      )}

                      <p className="text-xs text-qa-faint mt-3">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ SESSIONS ══ */}
        {view === "sessions" && (
          <div className="qa-card p-6">
            <h2 className="font-display font-bold text-lg text-qa-text mb-5">All Sessions</h2>
            {loadingReports ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-qa-border border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-qa-muted text-sm">Loading…</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 opacity-40">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-qa-muted text-sm font-medium">No sessions yet</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {reports.map(report => {
                  const count    = report.items?.[0]?.count || 0;
                  const isActive = report.id === reportId;
                  return (
                    <div
                      key={report.id}
                      onClick={() => loadReport(report.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all hover:border-qa-bright ${
                        isActive ? "border-amber-500/30 bg-amber-500/5" : "border-qa-border bg-qa-surface hover:bg-qa-card"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-qa-text text-sm">{report.title || "QA Session"}</p>
                          {isActive && <span className="text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Current</span>}
                        </div>
                        <p className="text-xs text-qa-faint mt-0.5">
                          {new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-qa-muted bg-qa-border px-3 py-1.5 rounded-lg">
                        {count} item{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
