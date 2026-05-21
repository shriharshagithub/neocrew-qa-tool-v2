"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

// ── Design tokens (Linear product tag palette) ────────────────────────────────
const CATS = [
  { id: "bug",         label: "Bug",         dot: "#e5484d", text: "#e5484d", bg: "rgba(229,72,77,0.1)",   border: "rgba(229,72,77,0.25)" },
  { id: "feature",     label: "Feature",     dot: "#6e56cf", text: "#9e8cfc", bg: "rgba(110,86,207,0.1)", border: "rgba(110,86,207,0.25)" },
  { id: "improvement", label: "Improvement", dot: "#3b9edd", text: "#5eb0ef", bg: "rgba(59,158,221,0.1)",  border: "rgba(59,158,221,0.25)" },
  { id: "question",    label: "Question",    dot: "#f5d90a", text: "#c9a227", bg: "rgba(245,217,10,0.08)", border: "rgba(245,217,10,0.2)" },
];

const PRIS = [
  { id: "critical", label: "Critical", color: "#e5484d" },
  { id: "high",     label: "High",     color: "#f76b15" },
  { id: "medium",   label: "Medium",   color: "#f5d90a" },
  { id: "low",      label: "Low",      color: "#3e9b4f" },
];

const STATS = [
  { id: "todo",        label: "Todo",        color: "#62666d",  activeBg: "rgba(98,102,109,0.15)"  },
  { id: "in_progress", label: "In Progress", color: "#3b9edd",  activeBg: "rgba(59,158,221,0.12)"  },
  { id: "done",        label: "Done",        color: "#27a644",  activeBg: "rgba(39,166,68,0.12)"   },
];

const TEAM = ["Shri", "Roshit", "Jhilik", "Amit", "Ritesh", "Harsha"];
const ASSIGNEES = ["Harsha", "Roshit", "Amit", "Jhilik", "Ritesh"];

const getCat  = (id) => CATS.find(c => c.id === id)  || CATS[0];
const getPri  = (id) => PRIS.find(p => p.id === id)  || PRIS[2];
const getStat = (id) => STATS.find(s => s.id === id) || STATS[0];

const todayTitle = () => {
  const now = new Date();
  const date = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `QA Session – ${date}, ${time}`;
};
const firstName  = (u) => (u?.user_metadata?.full_name || u?.user_metadata?.name || "").split(" ")[0] || u?.email?.split("@")[0] || "You";

const fmtStamp = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    + " · "
    + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
};

// ── Priority dot ──────────────────────────────────────────────────────────────
function PriDot({ id }) {
  const p = getPri(id);
  return <span className="l-dot flex-shrink-0" style={{ background: p.color }} />;
}

// ── Category badge ────────────────────────────────────────────────────────────
function CatBadge({ id }) {
  const c = getCat(id);
  return (
    <span className="l-badge text-xs" style={{ color: c.text, background: c.bg, borderColor: c.border }}>
      {c.label}
    </span>
  );
}

// ── Issue row ─────────────────────────────────────────────────────────────────
function IssueRow({ item, onRemove, onStatus, showStatus }) {
  const isDone = item.status === "done";
  const stat   = getStat(item.status || "todo");
  return (
    <div className={`group slide-in border-b border-hairline last:border-b-0 px-4 py-3 hover:bg-s1/60 transition-colors duration-75 ${isDone ? "done-row" : ""}`}>

      {/* ── Main row: dot · title · [right metadata] ── */}
      <div className="flex items-start gap-2.5 min-w-0">
        <PriDot id={item.priority} />

        {/* Title */}
        <span className={`row-title flex-1 text-sm leading-snug min-w-0 ${isDone ? "line-through text-ink-subtle" : "text-ink"}`}>
          {item.title}
        </span>

        {/* Right metadata cluster */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {item.created_at && (
            <span className="hidden sm:block text-xs text-ink-tertiary tabular whitespace-nowrap">
              {fmtStamp(item.created_at)}
            </span>
          )}
          <CatBadge id={item.category} />
          {!showStatus && (
            <button
              onClick={() => onRemove(item.id)}
              className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-ink-tertiary hover:text-tag-red text-xs bg-transparent border-none cursor-pointer transition-all rounded"
            >✕</button>
          )}
        </div>
      </div>

      {/* ── Description ── */}
      {item.description && (
        <p className="text-xs text-ink-subtle mt-1.5 ml-[18px] leading-relaxed">
          {item.description}
        </p>
      )}

      {/* ── Attachment ── */}
      {item.screenshot_url && (
        <div className="mt-2 ml-[18px]">
          {item.media_type === "video"
            ? <a href={item.screenshot_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-lavender hover:text-lavender-hover border border-hairline hover:border-hairline-strong rounded-lg px-3 py-1.5 transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Watch on Loom
              </a>
            : <img src={item.screenshot_url} className="rounded-lg max-h-48 border border-hairline object-contain cursor-pointer" alt=""
                onClick={() => window.open(item.screenshot_url, "_blank")} />
          }
        </div>
      )}

      {/* ── Footer: raised by · assignee · status chips ── */}
      {(item.raised_by || item.assignee || showStatus) && (
        <div className="flex items-center gap-3 mt-2 ml-[18px] flex-wrap">
          {item.raised_by && (
            <span className="text-xs text-ink-tertiary">
              ↑ {item.raised_by}
            </span>
          )}
          {item.assignee && (
            <span className="text-xs text-ink-tertiary">
              → {item.assignee}
            </span>
          )}
          {showStatus && (
            <div className="flex items-center gap-1 ml-auto">
              {STATS.map(s => (
                <button key={s.id} onClick={() => onStatus(item.id, s.id)}
                  className="l-chip text-xs"
                  style={(item.status || "todo") === s.id
                    ? { color: s.color, background: s.activeBg, borderColor: `${s.color}40` }
                    : { color: "#62666d", background: "transparent", borderColor: "#23252a" }
                  }>{s.label}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [user, setUser]             = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [items, setItems]           = useState([]);
  const [reportId, setReportId]     = useState(null);
  const [reportTitle, setReportTitle] = useState(todayTitle());
  const [title, setTitle]           = useState("");
  const [desc, setDesc]             = useState("");
  const [cat, setCat]               = useState("bug");
  const [pri, setPri]               = useState("medium");
  const [raisedBy, setRaisedBy]     = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaFile, setMediaFile]   = useState(null);
  const [mediaType, setMediaType]   = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [videoLink, setVideoLink]   = useState("");
  const [view, setView]             = useState("capture");
  const [copied, setCopied]         = useState(false);
  const [saving, setSaving]         = useState(false);
  const [added, setAdded]           = useState(false);
  const [reports, setReports]       = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const fileRef = useRef(null);

  // ── auth ──
  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUser(user); setRaisedBy(firstName(user));
      setAuthLoading(false); loadOrCreateReport();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((ev, session) => {
      if (ev === "SIGNED_OUT") router.push("/login");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // ── report ──
  const loadOrCreateReport = async () => {
    if (!supabase) return;
    const stored = localStorage.getItem("qa_report_id");
    if (stored) {
      const { data } = await supabase.from("reports").select("id,title").eq("id", stored).single();
      if (data) {
        setReportId(stored);
        if (data.title) setReportTitle(data.title);
        const { data: its } = await supabase.from("items").select("*").eq("report_id", stored).order("created_at");
        if (its) setItems(its);
        return;
      }
    }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const t  = todayTitle();
    await supabase.from("reports").upsert({ id, title: t }, { onConflict: "id" });
    localStorage.setItem("qa_report_id", id);
    setReportId(id); setReportTitle(t);
  };

  // ── media ──
  // ── media ──
  const FILE_LIMIT = 10 * 1024 * 1024; // 10 MB for images

  const compressImage = (file) => new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1600;
      let { width: w, height: h } = img;
      if (w > MAX || h > MAX) { const r = Math.min(MAX / w, MAX / h); w = Math.round(w * r); h = Math.round(h * r); }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => resolve(blob || file), "image/jpeg", 0.82);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > FILE_LIMIT) {
      alert(`Image too large — max 10 MB (this file is ${(file.size / 1024 / 1024).toFixed(1)} MB).`);
      return;
    }
    setMediaFile(file);
    setMediaType("image");
    const r = new FileReader();
    r.onload = e => setMediaPreview(e.target.result);
    r.readAsDataURL(file);
  };
  const handlePaste = (e) => {
    for (const it of e.clipboardData.items) {
      if (it.type.startsWith("image/")) { handleFile(it.getAsFile()); break; }
    }
  };
  const uploadMedia = async (file) => {
    if (!supabase) return null;
    const toUpload = await compressImage(file);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.jpg`;
    const { error } = await supabase.storage.from("screenshots").upload(name, toUpload, { contentType: "image/jpeg" });
    if (error) { console.error("Storage upload failed:", error.message); return null; }
    return supabase.storage.from("screenshots").getPublicUrl(name).data.publicUrl;
  };

  // ── add ──
  const canSubmit = title.trim() && desc.trim() && raisedBy.trim() && assignedTo.trim();

  const addItem = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    let mediaUrl = null;
    let finalMediaType = null;
    if (videoLink.trim()) {
      mediaUrl = videoLink.trim();
      finalMediaType = "video";
    } else if (mediaFile) {
      mediaUrl = await uploadMedia(mediaFile);
      if (!mediaUrl) {
        if (!confirm("Image upload failed — add the issue without it?")) { setSaving(false); return; }
      } else {
        finalMediaType = "image";
      }
    }
    const item = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,8),
      report_id: reportId, title: title.trim(), description: desc.trim(),
      category: cat, priority: pri, screenshot_url: mediaUrl,
      media_type: finalMediaType, status: "todo",
      raised_by: raisedBy || null, assignee: assignedTo || null,
      created_at: new Date().toISOString(),
    };
    if (supabase && reportId) {
      await supabase.from("reports").upsert({ id: reportId, title: reportTitle }, { onConflict: "id" });
      await supabase.from("items").insert(item);
    }
    setItems(p => [...p, item]);
    setTitle(""); setDesc(""); setMediaPreview(null); setMediaFile(null); setMediaType(null); setVideoLink("");
    setRaisedBy(user ? firstName(user) : ""); setAssignedTo("");
    setSaving(false); setAdded(true); setTimeout(() => setAdded(false), 1200);
  };

  const onKeyDown = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); addItem(); } };

  const removeItem = async (id) => {
    if (supabase) await supabase.from("items").delete().eq("id", id);
    setItems(p => p.filter(i => i.id !== id));
  };

  const updateStatus = async (id, st) => {
    if (supabase) await supabase.from("items").update({ status: st }).eq("id", id);
    setItems(p => p.map(i => i.id === id ? { ...i, status: st } : i));
  };

  const startNew = () => {
    if (!confirm("Start a new session? Your current report is saved.")) return;
    localStorage.removeItem("qa_report_id");
    setItems([]); setView("capture");
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2,8);
    const t  = todayTitle();
    setReportId(id); setReportTitle(t);
    localStorage.setItem("qa_report_id", id);
    if (supabase) supabase.from("reports").upsert({ id, title: t }, { onConflict: "id" });
  };

  const loadReports = async () => {
    if (!supabase) return;
    setLoadingReports(true);
    const { data } = await supabase.from("reports").select("id,title,created_at,items(count)").order("created_at", { ascending: false });
    if (data) setReports(data);
    setLoadingReports(false);
  };

  const loadReport = async (id) => {
    if (!supabase) return;
    localStorage.setItem("qa_report_id", id);
    setReportId(id);
    const { data: r } = await supabase.from("reports").select("id,title").eq("id", id).single();
    if (r?.title) setReportTitle(r.title);
    const { data } = await supabase.from("items").select("*").eq("report_id", id).order("created_at");
    if (data) setItems(data);
    setView("report");
  };

  const getShareUrl = () => typeof window !== "undefined" && reportId ? `${window.location.origin}/report/${reportId}` : "";
  const copyLink    = () => { navigator.clipboard.writeText(getShareUrl()); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  // stats
  const done    = items.filter(i => i.status === "done").length;
  const pct     = items.length ? Math.round((done / items.length) * 100) : 0;
  const crits   = items.filter(i => i.priority === "critical").length;

  // ─────────────────────────────────────────────────────────────────────────────
  if (authLoading) return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-hairline border-t-lavender rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas" onPaste={handlePaste} onKeyDown={onKeyDown}>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="nav-blur border-b border-hairline h-14 flex items-center px-5 gap-4 sticky top-0 z-40">
        {/* Logo → home */}
        <button onClick={() => setView("capture")} className="flex items-center flex-shrink-0 bg-transparent border-none cursor-pointer p-0">
          <img src="/neocrew-logo.png" alt="NeoCrew QA" className="h-6 w-auto" />
        </button>

        <span className="text-hairline-strong flex-shrink-0">/</span>

        {/* Session title — read-only timestamp */}
        <span className="text-sm text-ink-subtle truncate max-w-xs">{reportTitle}</span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right */}
        {crits > 0 && (
          <span className="hidden sm:flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
            style={{ color: "#e5484d", background: "rgba(229,72,77,0.1)", border: "1px solid rgba(229,72,77,0.2)" }}>
            {crits} critical
          </span>
        )}

        {items.length > 0 && (
          <span className="hidden sm:block text-xs text-ink-tertiary tabular">{done}/{items.length} done</span>
        )}

        {user?.user_metadata?.avatar_url
          ? <img src={user.user_metadata.avatar_url} className="w-6 h-6 rounded-full border border-hairline flex-shrink-0" alt="" referrerPolicy="no-referrer" />
          : <div className="w-6 h-6 rounded-full bg-s2 border border-hairline text-ink-subtle text-xs flex items-center justify-center flex-shrink-0 font-medium">
              {firstName(user).charAt(0).toUpperCase()}
            </div>
        }

        {/* Overflow menu */}
        <div className="relative group">
          <button className="text-ink-tertiary hover:text-ink bg-transparent border-none cursor-pointer p-1 rounded transition-colors text-base leading-none" title="More options">···</button>
          <div className="absolute right-0 top-full mt-1 w-44 bg-s2 border border-hairline rounded-xl shadow-lg overflow-hidden opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-100 z-50">
            <button onClick={startNew}
              className="w-full text-left text-sm text-ink-subtle hover:text-ink hover:bg-s3 px-4 py-2.5 border-none bg-transparent cursor-pointer transition-colors">
              Start new session
            </button>
            <div className="border-t border-hairline" />
            <button onClick={() => supabase.auth.signOut()}
              className="w-full text-left text-sm text-tag-red hover:bg-tag-red/10 px-4 py-2.5 border-none bg-transparent cursor-pointer transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="border-b border-hairline px-5">
        <div className="flex items-center gap-1 h-11 max-w-6xl mx-auto">
          <button onClick={() => setView("capture")} className={`l-tab ${view === "capture" ? "l-tab-active" : "l-tab-inactive"}`}>
            Capture
          </button>
          <button onClick={() => setView("report")} className={`l-tab ${view === "report" ? "l-tab-active" : "l-tab-inactive"}`}>
            Report {items.length > 0 && <span className="ml-1.5 text-xs text-ink-tertiary">{items.length}</span>}
          </button>
          <button onClick={() => { setView("sessions"); loadReports(); }} className={`l-tab ${view === "sessions" ? "l-tab-active" : "l-tab-inactive"}`}>
            Sessions
          </button>

          {/* Progress */}
          {items.length > 0 && (
            <div className="ml-auto flex items-center gap-2.5">
              <div className="w-20 h-0.5 bg-hairline rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "#27a644" }} />
              </div>
              <span className="text-xs text-ink-tertiary tabular">{pct}%</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-5 py-6">

        {/* ══ CAPTURE ══ */}
        {view === "capture" && (
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5">

            {/* ── Form ── */}
            <div className="l-card p-5 self-start">
              <h2 className="text-sm font-semibold text-ink mb-4 tracking-tight">Log an issue</h2>

              {/* Media zone */}
              <div
                onClick={() => fileRef.current.click()}
                onDrop={e => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                className={`border border-dashed rounded-lg p-4 text-center cursor-pointer mb-4 transition-colors ${
                  isDragging ? "border-lavender/50 bg-lavender/5" : "border-hairline hover:border-hairline-strong"
                }`}
              >
                {mediaPreview && mediaType === "video"
                  ? <video src={mediaPreview} controls className="max-h-36 rounded mx-auto" />
                  : mediaPreview
                  ? <div className="relative inline-block">
                      <img src={mediaPreview} className="max-h-36 rounded border border-hairline" alt="" />
                      <button onClick={e => { e.stopPropagation(); setMediaPreview(null); setMediaFile(null); setMediaType(null); }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-s3 text-ink-subtle rounded-full text-xs border border-hairline cursor-pointer flex items-center justify-center">✕</button>
                    </div>
                  : <p className="text-xs text-ink-tertiary">Attach screenshot · paste <kbd>⌘V</kbd></p>
                }
                <input ref={fileRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])} className="hidden" />
              </div>

              {/* Loom link */}
              <input
                type="url"
                placeholder="Loom video link (optional)"
                value={videoLink}
                onChange={e => setVideoLink(e.target.value)}
                className="l-input mb-4"
              />

              {/* Title */}
              <input type="text" placeholder="Issue title *" value={title} onChange={e => setTitle(e.target.value)} className="l-input mb-2.5" />

              {/* Description */}
              <textarea placeholder="Description, steps, or context *" value={desc} onChange={e => setDesc(e.target.value)} rows={3} className="l-input mb-4 resize-none" />

              {/* Category */}
              <div className="mb-3">
                <p className="text-xs text-ink-tertiary font-medium mb-2">Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {CATS.map(c => (
                    <button key={c.id} onClick={() => setCat(c.id)}
                      className="l-badge cursor-pointer transition-all text-xs"
                      style={cat === c.id
                        ? { color: c.text, background: c.bg, borderColor: c.border }
                        : { color: "#62666d", background: "transparent", borderColor: "#23252a" }
                      }>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div className="mb-4">
                <p className="text-xs text-ink-tertiary font-medium mb-2">Priority</p>
                <div className="flex gap-1.5">
                  {PRIS.map(p => (
                    <button key={p.id} onClick={() => setPri(p.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md border transition-all cursor-pointer"
                      style={pri === p.id
                        ? { color: p.color, background: `${p.color}14`, borderColor: `${p.color}40` }
                        : { color: "#62666d", background: "transparent", borderColor: "#23252a" }
                      }>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: pri === p.id ? p.color : "#3e3e44" }} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* People */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <div>
                  <p className="text-xs text-ink-tertiary font-medium mb-1.5">Raised by <span className="text-tag-red">*</span></p>
                  <input list="tl-r" type="text" placeholder="Name" value={raisedBy} onChange={e => setRaisedBy(e.target.value)} className="l-input text-sm" />
                  <datalist id="tl-r">{TEAM.map(m => <option key={m} value={m}/>)}</datalist>
                </div>
                <div>
                  <p className="text-xs text-ink-tertiary font-medium mb-1.5">Assigned to <span className="text-tag-red">*</span></p>
                  <input list="tl-a" type="text" placeholder="Name" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="l-input text-sm" />
                  <datalist id="tl-a">{ASSIGNEES.map(m => <option key={m} value={m}/>)}</datalist>
                </div>
              </div>

              {/* Submit */}
              <button onClick={addItem} disabled={!canSubmit || saving}
                className="w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-100 border-none"
                style={added
                  ? { background: "rgba(39,166,68,0.15)", color: "#27a644", cursor: "default" }
                  : canSubmit && !saving
                  ? { background: "#5e6ad2", color: "#fff", cursor: "pointer" }
                  : { background: "#0f1011", color: "#62666d", cursor: "not-allowed" }
                }>
                {added ? "Added" : saving ? "Saving…" : "Add to report"}
              </button>
            </div>

            {/* ── Issue list ── */}
            <div className="l-card overflow-hidden" style={{ maxHeight: "80vh" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
                <span className="text-sm font-medium text-ink">
                  Issues
                  {items.length > 0 && <span className="ml-2 text-ink-tertiary text-xs">{items.length}</span>}
                </span>
                {items.length > 0 && (
                  <button onClick={() => setView("report")} className="text-xs text-lavender hover:text-lavender-hover bg-transparent border-none cursor-pointer transition-colors">
                    View report →
                  </button>
                )}
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: "calc(80vh - 50px)" }}>
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                    <div className="w-10 h-10 rounded-xl bg-s2 border border-hairline flex items-center justify-center mb-3">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#62666d" strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg>
                    </div>
                    <p className="text-ink-subtle text-sm font-medium mb-1">No issues captured yet</p>
                    <p className="text-ink-tertiary text-xs leading-relaxed">Fill in the form and hit <span className="text-ink-subtle font-medium">Add to report</span>. Each issue is saved instantly and timestamped.</p>
                  </div>
                ) : (
                  [...items].reverse().map((item, i) => (
                    <IssueRow key={item.id} item={item} idx={i} onRemove={removeItem} onStatus={updateStatus} showStatus={false} />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ REPORT ══ */}
        {view === "report" && (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
              <div>
                <h1 className="text-lg font-semibold text-ink tracking-tight">{reportTitle}</h1>
                <p className="text-xs text-ink-tertiary mt-0.5">
                  {items.length} issue{items.length !== 1 ? "s" : ""}
                  {items.length > 0 && <> · <span style={{ color: "#27a644" }}>{done} resolved</span></>}
                </p>
              </div>
              <button onClick={copyLink} disabled={items.length === 0}
                className={`l-btn-primary text-sm ${copied ? "opacity-80" : ""} ${items.length === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                style={copied ? { background: "#27a644" } : {}}>
                {copied ? "Link copied" : "Copy share link"}
              </button>
            </div>

            {/* Progress */}
            {items.length > 0 && (
              <div className="mb-5">
                <div className="h-0.5 bg-hairline rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "#27a644" }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs text-ink-tertiary tabular">{done} of {items.length} resolved</span>
                  <span className="text-xs tabular" style={{ color: pct === 100 ? "#27a644" : "#62666d" }}>{pct}%</span>
                </div>
              </div>
            )}

            {/* Share URL */}
            {items.length > 0 && (
              <div className="l-card px-4 py-3 mb-5 flex items-center gap-3">
                <span className="text-xs text-ink-tertiary flex-shrink-0">Share URL</span>
                <code className="text-xs text-ink-subtle flex-1 truncate font-mono">{getShareUrl()}</code>
              </div>
            )}

            {/* Stats row */}
            {items.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mb-5">
                {CATS.map(c => {
                  const n = items.filter(i => i.category === c.id).length;
                  return (
                    <div key={c.id} className="l-card px-4 py-3">
                      <div className="text-xl font-semibold text-ink tracking-tight tabular">{n}</div>
                      <CatBadge id={c.id} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Issue list */}
            {items.length === 0 ? (
              <div className="l-card px-4 py-16 text-center">
                <p className="text-ink-tertiary text-sm">No issues captured</p>
                <button onClick={() => setView("capture")} className="mt-2 text-xs text-lavender bg-transparent border-none cursor-pointer hover:text-lavender-hover">
                  Start capturing →
                </button>
              </div>
            ) : (
              <div className="l-card overflow-hidden">
                {items.map((item, i) => (
                  <IssueRow key={item.id} item={item} idx={i} onRemove={removeItem} onStatus={updateStatus} showStatus={true} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ SESSIONS ══ */}
        {view === "sessions" && (
          <div className="l-card overflow-hidden">
            <div className="px-4 py-3 border-b border-hairline">
              <span className="text-sm font-medium text-ink">Sessions</span>
            </div>
            {loadingReports ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-hairline border-t-lavender rounded-full animate-spin" />
              </div>
            ) : reports.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-ink-tertiary text-sm">No sessions yet</p>
              </div>
            ) : reports.map(r => {
              const n = r.items?.[0]?.count || 0;
              const active = r.id === reportId;
              return (
                <div key={r.id} onClick={() => loadReport(r.id)}
                  className="flex items-center justify-between px-4 py-3 border-b border-hairline last:border-b-0 hover:bg-s1 cursor-pointer transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-ink font-medium">{r.title || "Session"}</span>
                      {active && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ color: "#5e6ad2", background: "rgba(94,106,210,0.1)", border: "1px solid rgba(94,106,210,0.2)" }}>
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-tertiary mt-0.5">
                      {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <span className="text-xs text-ink-tertiary">{n} issue{n !== 1 ? "s" : ""}</span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
