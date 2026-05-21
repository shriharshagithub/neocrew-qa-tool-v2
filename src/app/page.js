"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

// ─── constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "bug",         label: "Bug",         color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200",   dot: "bg-red-500",    emoji: "🐛" },
  { id: "feature",     label: "Feature",     color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200",dot: "bg-violet-500", emoji: "✨" },
  { id: "improvement", label: "Improvement", color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200",  dot: "bg-blue-500",   emoji: "💡" },
  { id: "question",    label: "Question",    color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200", dot: "bg-amber-500",  emoji: "❓" },
];

const PRIORITIES = [
  { id: "critical", label: "Critical", color: "text-red-700",    bg: "bg-red-100",    activeBg: "bg-red-600",    activeText: "text-white" },
  { id: "high",     label: "High",     color: "text-orange-700", bg: "bg-orange-100", activeBg: "bg-orange-500", activeText: "text-white" },
  { id: "medium",   label: "Medium",   color: "text-yellow-700", bg: "bg-yellow-100", activeBg: "bg-yellow-500", activeText: "text-white" },
  { id: "low",      label: "Low",      color: "text-green-700",  bg: "bg-green-100",  activeBg: "bg-green-600",  activeText: "text-white" },
];

const STATUSES = [
  { id: "todo",        label: "To Do",       color: "text-slate-600",  bg: "bg-slate-100",  ring: "ring-slate-400" },
  { id: "in_progress", label: "In Progress", color: "text-amber-700",  bg: "bg-amber-100",  ring: "ring-amber-400" },
  { id: "done",        label: "Done",        color: "text-emerald-700",bg: "bg-emerald-100",ring: "ring-emerald-400" },
];

const TEAM = ["Shri", "Roshit", "Jhilik", "Ananya", "Ritesh", "Harsha"];

const getCat    = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
const getPri    = (id) => PRIORITIES.find((p) => p.id === id) || PRIORITIES[2];
const getStatus = (id) => STATUSES.find((s) => s.id === id)   || STATUSES[0];

const todayTitle = () => {
  const d = new Date();
  return `QA Session – ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
};

// ─── Name Modal ───────────────────────────────────────────────────────────────
function NameModal({ onSave }) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 fade-in">
        <div className="text-3xl mb-3">👋</div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">Welcome to NeoCrew QA</h2>
        <p className="text-slate-500 text-sm mb-6">What's your name? We'll use it to tag items you raise.</p>
        <input
          autoFocus
          type="text"
          className="input mb-4"
          placeholder="e.g. Shri, Roshit, Ananya…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave(name.trim())}
          list="team-names-modal"
        />
        <datalist id="team-names-modal">{TEAM.map((m) => <option key={m} value={m} />)}</datalist>
        <button
          onClick={() => name.trim() && onSave(name.trim())}
          disabled={!name.trim()}
          className={`w-full py-3 rounded-xl font-bold text-base transition-colors ${name.trim() ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer" : "bg-slate-100 text-slate-400 cursor-not-allowed"} border-none`}
        >
          Let's go →
        </button>
      </div>
    </div>
  );
}

// ─── Item Card (compact) ──────────────────────────────────────────────────────
function ItemCard({ item, onRemove }) {
  const cat = getCat(item.category);
  const pri = getPri(item.priority);
  return (
    <div className="fade-in border border-slate-100 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow" style={{ borderLeft: "4px solid" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cat.bg} ${cat.color} ${cat.border} border`}>
              {cat.emoji} {cat.label}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pri.bg} ${pri.color}`}>
              {pri.label}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-700 truncate">{item.title}</p>
          {(item.raised_by || item.assignee) && (
            <p className="text-xs text-slate-400 mt-1">
              {item.raised_by && <>↑ {item.raised_by}</>}
              {item.raised_by && item.assignee && " · "}
              {item.assignee && <>→ {item.assignee}</>}
            </p>
          )}
        </div>
        <div className="flex items-start gap-2 flex-shrink-0">
          {item.screenshot_url && (
            item.media_type === "video"
              ? <video src={item.screenshot_url} className="w-14 h-10 object-cover rounded-lg" />
              : <img src={item.screenshot_url} className="w-14 h-10 object-cover rounded-lg" alt="" />
          )}
          <button onClick={() => onRemove(item.id)} className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none mt-0.5 bg-transparent border-none cursor-pointer">✕</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [userName, setUserName]       = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);

  const [items, setItems]             = useState([]);
  const [reportId, setReportId]       = useState(null);
  const [reportTitle, setReportTitle] = useState(todayTitle());
  const [editingTitle, setEditingTitle] = useState(false);

  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory]       = useState("bug");
  const [priority, setPriority]       = useState("medium");
  const [raisedBy, setRaisedBy]       = useState("");
  const [assignedTo, setAssignedTo]   = useState("");
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaFile, setMediaFile]     = useState(null);
  const [mediaType, setMediaType]     = useState(null);
  const [isDragging, setIsDragging]   = useState(false);

  const [view, setView]               = useState("capture");
  const [copied, setCopied]           = useState(false);
  const [saving, setSaving]           = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);

  const [reports, setReports]         = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const fileRef       = useRef(null);
  const titleInputRef = useRef(null);

  // ── boot ──
  useEffect(() => {
    const saved = localStorage.getItem("qa_user_name");
    if (saved) {
      setUserName(saved);
      setRaisedBy(saved);
    } else {
      setShowNameModal(true);
    }
    loadOrCreateReport();
  }, []);

  const handleNameSave = (name) => {
    localStorage.setItem("qa_user_name", name);
    setUserName(name);
    setRaisedBy(name);
    setShowNameModal(false);
  };

  // ── report persistence ──
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
        } else {
          await createNewReport(stored);
        }
      } else {
        await createNewReport();
      }
    } catch (e) {
      console.error("Supabase error:", e);
    }
  };

  const createNewReport = async (existingId) => {
    const newId = existingId || (Date.now().toString(36) + Math.random().toString(36).substring(2, 8));
    const newTitle = todayTitle();
    await supabase.from("reports").upsert({ id: newId, title: newTitle }, { onConflict: "id" });
    localStorage.setItem("qa_report_id", newId);
    setReportId(newId);
    setReportTitle(newTitle);
  };

  // ── title editing ──
  const saveTitle = async () => {
    if (!reportTitle.trim() || !supabase || !reportId) { setEditingTitle(false); return; }
    setSavingTitle(true);
    await supabase.from("reports").update({ title: reportTitle.trim() }).eq("id", reportId);
    setSavingTitle(false);
    setEditingTitle(false);
  };

  // ── media ──
  const handleFile = (file) => {
    if (!file) return;
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      setMediaFile(file);
      setMediaType(file.type.startsWith("video/") ? "video" : "image");
      const reader = new FileReader();
      reader.onload = (e) => setMediaPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e) => {
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith("image/") || item.type.startsWith("video/")) {
        handleFile(item.getAsFile());
        break;
      }
    }
  };

  const uploadMedia = async (file) => {
    if (!supabase) return null;
    try {
      const ext = file.name?.split(".").pop() || (file.type.startsWith("video/") ? "mp4" : "png");
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      await supabase.storage.from("screenshots").upload(fileName, file);
      const { data } = supabase.storage.from("screenshots").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e) {
      console.error("Upload error:", e);
      return null;
    }
  };

  // ── add item ──
  const addItem = async () => {
    if (!title.trim()) return;
    setSaving(true);

    let mediaUrl = mediaPreview;
    if (mediaFile && supabase) {
      const url = await uploadMedia(mediaFile);
      if (url) mediaUrl = url;
    }

    const newItem = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
      report_id: reportId,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      screenshot_url: mediaUrl,
      media_type: mediaType || "image",
      status: "todo",
      raised_by: raisedBy || null,
      assignee: assignedTo || null,
      created_at: new Date().toISOString(),
    };

    if (supabase && reportId) {
      await supabase.from("reports").upsert({ id: reportId, title: reportTitle }, { onConflict: "id" });
      await supabase.from("items").insert(newItem);
    }

    setItems((prev) => [...prev, newItem]);
    setTitle("");
    setDescription("");
    setMediaPreview(null);
    setMediaFile(null);
    setMediaType(null);
    const saved = localStorage.getItem("qa_user_name");
    setRaisedBy(saved || "");
    setAssignedTo("");
    setSaving(false);
  };

  // ── keyboard shortcut ──
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  };

  const removeItem = async (id) => {
    if (supabase) await supabase.from("items").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItemStatus = async (id, newStatus) => {
    if (supabase) await supabase.from("items").update({ status: newStatus }).eq("id", id);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: newStatus } : i));
  };

  // ── sessions ──
  const startNew = () => {
    if (!confirm("Start a new session? Your current report is saved and accessible anytime.")) return;
    localStorage.removeItem("qa_report_id");
    setItems([]);
    const newTitle = todayTitle();
    const newId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    setReportId(newId);
    setReportTitle(newTitle);
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

  const getShareUrl = () =>
    typeof window !== "undefined" && reportId ? `${window.location.origin}/report/${reportId}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── stats ──
  const bugCount  = items.filter((i) => i.category === "bug").length;
  const featCount = items.filter((i) => i.category === "feature").length;
  const doneCount = items.filter((i) => i.status === "done").length;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50" onPaste={handlePaste} onKeyDown={handleKeyDown}>
      {showNameModal && <NameModal onSave={handleNameSave} />}

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          {/* Logo + Title */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xl">🧪</span>
              <span className="font-bold text-slate-800 text-base">NeoCrew QA</span>
            </div>
            <div className="h-5 w-px bg-slate-200 flex-shrink-0" />
            {/* Editable session title */}
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  ref={titleInputRef}
                  autoFocus
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                  className="text-sm font-semibold text-slate-800 border-b-2 border-blue-500 outline-none bg-transparent px-1 min-w-0 w-48"
                />
                <button onClick={saveTitle} className="text-xs text-blue-600 font-semibold bg-transparent border-none cursor-pointer">{savingTitle ? "Saving…" : "Save"}</button>
              </div>
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className="text-sm font-semibold text-slate-600 hover:text-slate-800 bg-transparent border-none cursor-pointer truncate max-w-xs flex items-center gap-1.5 group"
                title="Click to rename"
              >
                <span className="truncate">{reportTitle}</span>
                <span className="text-slate-300 group-hover:text-slate-500 text-xs flex-shrink-0">✏️</span>
              </button>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {userName && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block font-medium">{userName}</span>
              </div>
            )}
            <button
              onClick={startNew}
              className="text-sm font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 bg-white px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              + New Session
            </button>
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1 py-3">
            <button onClick={() => setView("capture")} className={`tab ${view === "capture" ? "tab-active" : "tab-inactive"}`}>
              📸 Capture
            </button>
            <button onClick={() => setView("report")} className={`tab ${view === "report" ? "tab-active" : "tab-inactive"}`}>
              📋 Report
              {items.length > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${view === "report" ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {items.length}
                </span>
              )}
            </button>
            <button onClick={() => { setView("sessions"); loadReports(); }} className={`tab ${view === "sessions" ? "tab-active" : "tab-inactive"}`}>
              📂 Sessions
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* ══ CAPTURE VIEW ══ */}
        {view === "capture" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Form */}
            <div className="card p-6">
              <h2 className="text-base font-bold text-slate-800 mb-5">Add New Item</h2>

              {/* Drop zone */}
              <div
                onClick={() => fileRef.current.click()}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors mb-5 ${isDragging ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"}`}
              >
                {mediaPreview && mediaType === "video" ? (
                  <video src={mediaPreview} controls className="max-w-full max-h-48 rounded-lg mx-auto" />
                ) : mediaPreview ? (
                  <div className="relative inline-block">
                    <img src={mediaPreview} className="max-w-full max-h-48 rounded-lg mx-auto" alt="screenshot" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setMediaPreview(null); setMediaFile(null); setMediaType(null); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 text-white rounded-full text-xs font-bold border-none cursor-pointer flex items-center justify-center"
                    >✕</button>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-sm font-medium text-slate-500">
                      Drop, paste <span className="font-bold text-slate-600">⌘V</span>, or click to attach
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Images & videos supported</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*,video/*" onChange={(e) => handleFile(e.target.files[0])} className="hidden" />
              </div>

              {/* Title */}
              <input
                type="text"
                placeholder="Issue title…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input mb-3"
              />

              {/* Description */}
              <textarea
                placeholder="Steps to reproduce or additional details…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="input mb-4 resize-none"
              />

              {/* Category */}
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        category === cat.id
                          ? `${cat.bg} ${cat.color} ${cat.border} border-2`
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Priority</p>
                <div className="flex gap-2">
                  {PRIORITIES.map((pri) => (
                    <button
                      key={pri.id}
                      onClick={() => setPriority(pri.id)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border-none transition-all cursor-pointer ${
                        priority === pri.id
                          ? `${pri.activeBg} ${pri.activeText}`
                          : `${pri.bg} ${pri.color} hover:opacity-80`
                      }`}
                    >
                      {pri.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Raised by / Assigned to */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1.5">Raised By</p>
                  <input list="team-raised" type="text" placeholder="Your name…" value={raisedBy} onChange={(e) => setRaisedBy(e.target.value)} className="input text-sm" />
                  <datalist id="team-raised">{TEAM.map((m) => <option key={m} value={m} />)}</datalist>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1.5">Assigned To</p>
                  <input list="team-assigned" type="text" placeholder="Team member…" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="input text-sm" />
                  <datalist id="team-assigned">{TEAM.map((m) => <option key={m} value={m} />)}</datalist>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={addItem}
                disabled={!title.trim() || saving}
                className={`w-full py-3.5 rounded-xl font-bold text-base transition-all border-none ${
                  title.trim() && !saving
                    ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-sm hover:shadow"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                {saving ? "⏳ Saving…" : "Add to Report"}
                {!saving && <span className="ml-2 text-blue-300 text-sm font-normal hidden sm:inline">⌘↵</span>}
              </button>
            </div>

            {/* Live log */}
            <div className="card p-6 flex flex-col" style={{ maxHeight: "75vh" }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-slate-800">Captured Items</h2>
                {items.length > 0 && (
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="text-red-500 font-semibold">{bugCount} bug{bugCount !== 1 ? "s" : ""}</span>
                    <span className="text-violet-500 font-semibold">{featCount} feature{featCount !== 1 ? "s" : ""}</span>
                    <button
                      onClick={() => setView("report")}
                      className="text-blue-600 font-semibold bg-transparent border-none cursor-pointer hover:underline"
                    >
                      View report →
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <div className="text-5xl mb-4">📝</div>
                    <p className="text-slate-400 font-medium">Nothing captured yet</p>
                    <p className="text-slate-300 text-sm mt-1">Add your first bug or feature above</p>
                  </div>
                ) : (
                  [...items].reverse().map((item) => (
                    <ItemCard key={item.id} item={item} onRemove={removeItem} />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ REPORT VIEW ══ */}
        {view === "report" && (
          <div>
            {/* Report header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{reportTitle}</h1>
                <p className="text-sm text-slate-400 mt-1">{items.length} item{items.length !== 1 ? "s" : ""} · {doneCount} done</p>
              </div>
              <button
                onClick={copyLink}
                disabled={items.length === 0}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border-none ${
                  items.length > 0
                    ? copied
                      ? "bg-emerald-500 text-white cursor-pointer"
                      : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-sm"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                {copied ? "✅ Link copied!" : "🔗 Copy share link"}
              </button>
            </div>

            {/* Share URL bar */}
            {items.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                <span className="text-emerald-700 text-sm font-semibold flex-shrink-0">Share with devs:</span>
                <code className="text-emerald-600 text-sm break-all flex-1">{getShareUrl()}</code>
              </div>
            )}

            {/* Stats strip */}
            {items.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {CATEGORIES.map((cat) => {
                  const count = items.filter((i) => i.category === cat.id).length;
                  return (
                    <div key={cat.id} className={`${cat.bg} rounded-xl p-4 text-center border ${cat.border}`}>
                      <div className={`text-2xl font-extrabold ${cat.color}`}>{count}</div>
                      <div className={`text-xs font-semibold mt-0.5 ${cat.color}`}>{cat.emoji} {cat.label}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Items */}
            {items.length === 0 ? (
              <div className="card p-16 text-center">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-slate-400 text-lg font-medium">No items yet</p>
                <button onClick={() => setView("capture")} className="mt-4 text-blue-600 font-semibold bg-transparent border-none cursor-pointer hover:underline text-sm">
                  Go capture something →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, idx) => {
                  const cat = getCat(item.category);
                  const pri = getPri(item.priority);
                  return (
                    <div key={item.id} className="card p-6 fade-in" style={{ borderLeft: "5px solid" }}>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="text-base font-bold text-slate-800 leading-snug">
                          <span className="text-slate-400 font-normal mr-1">{idx + 1}.</span> {item.title}
                        </h3>
                        <span className={`flex-shrink-0 text-xs font-bold px-3 py-1 rounded-lg text-white`} style={{ background: pri.id === "critical" ? "#dc2626" : pri.id === "high" ? "#ea580c" : pri.id === "medium" ? "#ca8a04" : "#65a30d" }}>
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
                                onClick={() => updateItemStatus(item.id, st.id)}
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
                          ? <video src={item.screenshot_url} controls className="rounded-xl max-h-72 w-auto shadow-sm" />
                          : <img src={item.screenshot_url} className="rounded-xl max-h-72 w-auto shadow-sm border border-slate-100" alt="" />
                      )}

                      <p className="text-xs text-slate-300 mt-3">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ SESSIONS VIEW ══ */}
        {view === "sessions" && (
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-5">All Sessions</h2>
            {loadingReports ? (
              <div className="text-center py-16 text-slate-400">
                <div className="animate-spin text-3xl mb-3">⏳</div>
                <p>Loading…</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <div className="text-5xl mb-3">📭</div>
                <p className="font-medium">No sessions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => {
                  const itemCount = report.items?.[0]?.count || 0;
                  const isActive = report.id === reportId;
                  return (
                    <div
                      key={report.id}
                      onClick={() => loadReport(report.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
                        isActive ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800 text-sm">{report.title || "QA Session"}</p>
                          {isActive && <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Current</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                        {itemCount} item{itemCount !== 1 ? "s" : ""}
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
