"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";

const spring     = { type: "spring", stiffness: 350, damping: 28 };
const springFast = { type: "spring", stiffness: 420, damping: 26 };
const springSnap = { type: "spring", stiffness: 500, damping: 30 };

const CATS = [
  { id: "bug",         label: "Bug",         color: "#e5484d", bg: "rgba(229,72,77,0.12)",   border: "rgba(229,72,77,0.3)" },
  { id: "feature",     label: "Feature",     color: "#9e8cfc", bg: "rgba(110,86,207,0.12)", border: "rgba(110,86,207,0.3)" },
  { id: "improvement", label: "Improvement", color: "#5eb0ef", bg: "rgba(59,158,221,0.12)",  border: "rgba(59,158,221,0.3)" },
  { id: "question",    label: "Question",    color: "#f5d90a", bg: "rgba(245,217,10,0.1)",   border: "rgba(245,217,10,0.25)" },
];

const PRIS = [
  { id: "critical", label: "Critical", color: "#e5484d" },
  { id: "high",     label: "High",     color: "#f76b15" },
  { id: "medium",   label: "Medium",   color: "#f5d90a" },
  { id: "low",      label: "Low",      color: "#3e9b4f" },
];

const STATS = [
  { id: "todo",        label: "Todo",        color: "#62666d", activeBg: "rgba(98,102,109,0.15)"  },
  { id: "in_progress", label: "In Progress", color: "#3b9edd", activeBg: "rgba(59,158,221,0.12)"  },
  { id: "done",        label: "Done",        color: "#27a644", activeBg: "rgba(39,166,68,0.12)"   },
];

const TEAM      = ["Shri", "Roshit", "Jhilik", "Amit", "Ritesh", "Harsha"];
const ASSIGNEES = ["Harsha", "Roshit", "Amit", "Jhilik", "Ritesh"];

const getCat  = (id) => CATS.find(c => c.id === id)  || CATS[0];
const getPri  = (id) => PRIS.find(p => p.id === id)  || PRIS[2];

const todayTitle = () => {
  const now  = new Date();
  const date = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `QA Session – ${date}, ${time}`;
};

const firstName = (u) =>
  (u?.user_metadata?.full_name || u?.user_metadata?.name || "").split(" ")[0] ||
  u?.email?.split("@")[0] || "You";

const fmtTime = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
};

const fmtStamp = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    + " · " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
};

// ── Hold-to-delete ────────────────────────────────────────────────────────────
function HoldToDelete({ onDelete }) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const startRef    = useRef(null);
  const HOLD_MS     = 650;

  const start = useCallback((e) => {
    e.stopPropagation();
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const pct = Math.min((Date.now() - startRef.current) / HOLD_MS, 1);
      setProgress(pct);
      if (pct >= 1) { clearInterval(intervalRef.current); setProgress(0); onDelete(); }
    }, 16);
  }, [onDelete]);

  const cancel = useCallback(() => { clearInterval(intervalRef.current); setProgress(0); }, []);

  return (
    <motion.button
      onMouseDown={start} onMouseUp={cancel} onMouseLeave={cancel}
      onTouchStart={start} onTouchEnd={cancel}
      whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} transition={springSnap}
      title="Hold to delete"
      style={{
        position: "relative", width: 24, height: 24, borderRadius: 6,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: progress > 0 ? `rgba(229,72,77,${0.1 + progress * 0.2})` : "transparent",
        border: "none", cursor: "pointer", overflow: "hidden", flexShrink: 0,
      }}
    >
      <motion.div style={{
        position: "absolute", inset: 0, background: "rgba(229,72,77,0.2)",
        scaleX: progress, transformOrigin: "left", borderRadius: 6,
      }} />
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
        stroke={progress > 0.3 ? "#e5484d" : "#4a4f5a"} strokeWidth="2.5"
        style={{ position: "relative" }}>
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </motion.button>
  );
}

// ── Issue row ─────────────────────────────────────────────────────────────────
function IssueRow({ item, onRemove, onStatus, showStatus }) {
  const cat    = getCat(item.category);
  const pri    = getPri(item.priority);
  const isDone = item.status === "done";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: isDone ? 0.4 : 1, y: 0 }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.16 } }}
      transition={spring}
      className="group"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "14px 20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Priority stripe dot */}
        <div style={{
          width: 8, height: 8, borderRadius: "50%", background: pri.color,
          flexShrink: 0, marginTop: 5,
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <span style={{
              fontSize: 14, fontWeight: 500, color: isDone ? "#62666d" : "#f7f8f8",
              lineHeight: 1.4, textDecoration: isDone ? "line-through" : "none",
              flex: 1,
            }}>
              {item.title}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {/* Timestamp */}
              {item.created_at && (
                <span style={{ fontSize: 11, color: "#4a4f5a", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {fmtTime(item.created_at)}
                </span>
              )}
              {/* Category pill */}
              <span style={{
                fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20,
                color: cat.color, background: cat.bg, border: `1px solid ${cat.border}`,
                letterSpacing: "0.01em", whiteSpace: "nowrap",
              }}>
                {cat.label}
              </span>
              {/* Delete */}
              {!showStatus && (
                <div style={{ opacity: 0 }} className="group-hover:opacity-100" style={{ transition: "opacity 0.1s" }}>
                  <HoldToDelete onDelete={() => onRemove(item.id)} />
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <p style={{ fontSize: 12, color: "#62666d", marginTop: 4, lineHeight: 1.55 }}>
              {item.description}
            </p>
          )}

          {/* Attachment */}
          {item.screenshot_url && (
            <div style={{ marginTop: 10 }}>
              {item.media_type === "video" ? (
                <a href={item.screenshot_url} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontSize: 12, color: "#5e6ad2", textDecoration: "none",
                    border: "1px solid rgba(94,106,210,0.25)", borderRadius: 8,
                    padding: "5px 12px",
                  }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  Watch on Loom
                </a>
              ) : (
                <img src={item.screenshot_url} onClick={() => window.open(item.screenshot_url, "_blank")}
                  style={{ maxHeight: 160, borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", display: "block" }} alt="" />
              )}
            </div>
          )}

          {/* Footer */}
          {(item.raised_by || item.assignee || showStatus) && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
              {item.raised_by && (
                <span style={{ fontSize: 11, color: "#4a4f5a" }}>↑ {item.raised_by}</span>
              )}
              {item.assignee && (
                <span style={{ fontSize: 11, color: "#4a4f5a" }}>→ {item.assignee}</span>
              )}
              {showStatus && (
                <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                  {STATS.map(s => (
                    <motion.button key={s.id} onClick={() => onStatus(item.id, s.id)}
                      whileTap={{ scale: 0.93 }} transition={springSnap}
                      style={{
                        fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20, cursor: "pointer",
                        color: (item.status || "todo") === s.id ? s.color : "#4a4f5a",
                        background: (item.status || "todo") === s.id ? s.activeBg : "transparent",
                        border: `1px solid ${(item.status || "todo") === s.id ? s.color + "40" : "rgba(255,255,255,0.07)"}`,
                      }}>
                      {s.label}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [user, setUser]                     = useState(null);
  const [authLoading, setAuthLoading]       = useState(true);
  const [items, setItems]                   = useState([]);
  const [reportId, setReportId]             = useState(null);
  const [reportTitle, setReportTitle]       = useState(todayTitle());
  const [title, setTitle]                   = useState("");
  const [desc, setDesc]                     = useState("");
  const [cat, setCat]                       = useState("bug");
  const [pri, setPri]                       = useState("medium");
  const [raisedBy, setRaisedBy]             = useState("");
  const [assignedTo, setAssignedTo]         = useState("");
  const [mediaPreview, setMediaPreview]     = useState(null);
  const [mediaFile, setMediaFile]           = useState(null);
  const [mediaType, setMediaType]           = useState(null);
  const [isDragging, setIsDragging]         = useState(false);
  const [videoLink, setVideoLink]           = useState("");
  const [view, setView]                     = useState("capture");
  const [copied, setCopied]                 = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [added, setAdded]                   = useState(false);
  const [reports, setReports]               = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const fileRef  = useRef(null);
  const titleRef = useRef(null);
  const descRef  = useRef(null);

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUser(user); setRaisedBy(firstName(user));
      setAuthLoading(false); loadOrCreateReport();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((ev) => {
      if (ev === "SIGNED_OUT") router.push("/login");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const autoResize = (ref) => {
    if (!ref?.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = ref.current.scrollHeight + "px";
  };

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
    localStorage.setItem("qa_report_id", id); setReportId(id); setReportTitle(t);
  };

  const FILE_LIMIT = 10 * 1024 * 1024;
  const compressImage = (file) => new Promise((resolve) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1600; let { width: w, height: h } = img;
      if (w > MAX || h > MAX) { const r = Math.min(MAX/w, MAX/h); w = Math.round(w*r); h = Math.round(h*r); }
      const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => resolve(blob || file), "image/jpeg", 0.82);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); }; img.src = url;
  });

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > FILE_LIMIT) { alert(`Image too large — max 10 MB.`); return; }
    setMediaFile(file); setMediaType("image");
    const r = new FileReader(); r.onload = e => setMediaPreview(e.target.result); r.readAsDataURL(file);
  };
  const handlePaste = (e) => { for (const it of e.clipboardData.items) { if (it.type.startsWith("image/")) { handleFile(it.getAsFile()); break; } } };
  const uploadMedia = async (file) => {
    if (!supabase) return null;
    const toUpload = await compressImage(file);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.jpg`;
    const { error } = await supabase.storage.from("screenshots").upload(name, toUpload, { contentType: "image/jpeg" });
    if (error) { console.error(error.message); return null; }
    return supabase.storage.from("screenshots").getPublicUrl(name).data.publicUrl;
  };

  const canSubmit = title.trim() && desc.trim() && raisedBy.trim() && assignedTo.trim();

  const addItem = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    let mediaUrl = null, finalMediaType = null;
    if (videoLink.trim()) { mediaUrl = videoLink.trim(); finalMediaType = "video"; }
    else if (mediaFile) {
      mediaUrl = await uploadMedia(mediaFile);
      if (!mediaUrl && !confirm("Upload failed — add without image?")) { setSaving(false); return; }
      else if (mediaUrl) finalMediaType = "image";
    }
    const item = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,8),
      report_id: reportId, title: title.trim(), description: desc.trim(),
      category: cat, priority: pri, screenshot_url: mediaUrl, media_type: finalMediaType,
      status: "todo", raised_by: raisedBy || null, assignee: assignedTo || null,
      created_at: new Date().toISOString(),
    };
    if (supabase && reportId) {
      await supabase.from("reports").upsert({ id: reportId, title: reportTitle }, { onConflict: "id" });
      await supabase.from("items").insert(item);
    }
    setItems(p => [...p, item]);
    setTitle(""); setDesc(""); setMediaPreview(null); setMediaFile(null); setMediaType(null); setVideoLink(""); setAssignedTo("");
    setSaving(false); setAdded(true); setTimeout(() => setAdded(false), 1400);
    if (titleRef.current) titleRef.current.style.height = "auto";
    if (descRef.current)  descRef.current.style.height  = "auto";
  };

  const onKeyDown = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); addItem(); } };
  const removeItem   = async (id) => { if (supabase) await supabase.from("items").delete().eq("id", id); setItems(p => p.filter(i => i.id !== id)); };
  const updateStatus = async (id, st) => { if (supabase) await supabase.from("items").update({ status: st }).eq("id", id); setItems(p => p.map(i => i.id === id ? { ...i, status: st } : i)); };

  const startNew = () => {
    if (!confirm("Start a new session? Your current report is saved.")) return;
    localStorage.removeItem("qa_report_id"); setItems([]); setView("capture");
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2,8), t = todayTitle();
    setReportId(id); setReportTitle(t); localStorage.setItem("qa_report_id", id);
    if (supabase) supabase.from("reports").upsert({ id, title: t }, { onConflict: "id" });
  };
  const loadReports = async () => {
    if (!supabase) return; setLoadingReports(true);
    const { data } = await supabase.from("reports").select("id,title,created_at,items(count)").order("created_at", { ascending: false });
    if (data) setReports(data); setLoadingReports(false);
  };
  const loadReport = async (id) => {
    if (!supabase) return; localStorage.setItem("qa_report_id", id); setReportId(id);
    const { data: r } = await supabase.from("reports").select("id,title").eq("id", id).single();
    if (r?.title) setReportTitle(r.title);
    const { data } = await supabase.from("items").select("*").eq("report_id", id).order("created_at");
    if (data) setItems(data); setView("report");
  };
  const getShareUrl = () => typeof window !== "undefined" && reportId ? `${window.location.origin}/report/${reportId}` : "";
  const copyLink    = () => { navigator.clipboard.writeText(getShareUrl()); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const done  = items.filter(i => i.status === "done").length;
  const pct   = items.length ? Math.round((done / items.length) * 100) : 0;
  const crits = items.filter(i => i.priority === "critical").length;

  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: "#010102", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div style={{ width: 28, height: 28, border: "2px solid #23252a", borderTopColor: "#5e6ad2", borderRadius: "50%" }}
        animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }} />
    </div>
  );

  // ── Shared input style ──
  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, padding: "9px 12px", color: "#f7f8f8", fontSize: 13,
    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#010102" }} onPaste={handlePaste} onKeyDown={onKeyDown}>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <div style={{ position: "sticky", top: 0, zIndex: 40, padding: "10px 24px 4px" }}>
        <nav style={{
          maxWidth: 1200, margin: "0 auto", height: 46,
          display: "flex", alignItems: "center", gap: 14, padding: "0 16px",
          borderRadius: 14, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          background: "rgba(12,13,14,0.88)", border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}>
          <motion.button onClick={() => setView("capture")} whileTap={{ scale: 0.93 }} transition={springSnap}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
            <img src="/neocrew-logo.png" alt="NeoCrew QA" style={{ height: 22, width: "auto" }} />
          </motion.button>

          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />

          {[
            { id: "capture",  label: "Capture" },
            { id: "report",   label: "Report" },
            { id: "sessions", label: "Sessions" },
          ].map(t => (
            <motion.button key={t.id}
              onClick={() => { setView(t.id); if (t.id === "sessions") loadReports(); }}
              whileTap={{ scale: 0.95 }} transition={springSnap}
              style={{
                fontSize: 13, fontWeight: 500, padding: "4px 12px", borderRadius: 8,
                border: "none", cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em",
                background: view === t.id ? "rgba(255,255,255,0.08)" : "transparent",
                color: view === t.id ? "#f7f8f8" : "#62666d",
                transition: "color 0.1s, background 0.1s",
              }}>
              {t.label}
              {t.id === "report" && items.length > 0 && (
                <span style={{ marginLeft: 6, fontSize: 11, color: "#4a4f5a" }}>{items.length}</span>
              )}
            </motion.button>
          ))}

          <div style={{ flex: 1 }} />

          {/* Critical badge */}
          <AnimatePresence>
            {crits > 0 && (
              <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={springFast}
                style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, color: "#e5484d", background: "rgba(229,72,77,0.12)", border: "1px solid rgba(229,72,77,0.25)" }}>
                {crits} critical
              </motion.span>
            )}
          </AnimatePresence>

          {/* Progress */}
          {items.length > 0 && (
            <span style={{ fontSize: 12, color: "#4a4f5a", fontVariantNumeric: "tabular-nums" }}>
              <span style={{ color: pct === 100 ? "#27a644" : "#f7f8f8", fontWeight: 600 }}>{done}</span>/{items.length}
            </span>
          )}

          {/* Avatar */}
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} alt="" referrerPolicy="no-referrer" />
          ) : (
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#18191a", border: "1px solid rgba(255,255,255,0.1)", color: "#8a8f98", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, flexShrink: 0 }}>
              {firstName(user).charAt(0).toUpperCase()}
            </div>
          )}

          {/* Overflow */}
          <div style={{ position: "relative" }} className="group">
            <motion.button whileTap={{ scale: 0.9 }} transition={springSnap}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#4a4f5a", fontSize: 18, lineHeight: 1, padding: "0 4px", display: "flex", alignItems: "center" }}>
              ···
            </motion.button>
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", width: 180, background: "#141516", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden", zIndex: 50 }}
              className="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-100">
              <button onClick={startNew} style={{ width: "100%", textAlign: "left", fontSize: 13, color: "#8a8f98", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                className="hover:bg-white/5 hover:text-white transition-colors">
                Start new session
              </button>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />
              <button onClick={() => supabase.auth.signOut()} style={{ width: "100%", textAlign: "left", fontSize: 13, color: "#e5484d", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                className="hover:bg-red-500/10 transition-colors">
                Sign out
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 60px" }}>
        <AnimatePresence mode="wait" initial={false}>

          {/* ══ CAPTURE ══ */}
          {view === "capture" && (
            <motion.div key="capture" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={spring}>

              {/* Page heading */}
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f7f8f8", letterSpacing: "-0.03em", margin: 0 }}>
                  {reportTitle}
                </h1>
                <p style={{ fontSize: 13, color: "#4a4f5a", marginTop: 4 }}>
                  {items.length === 0
                    ? "No issues logged yet — start capturing below"
                    : `${items.length} issue${items.length !== 1 ? "s" : ""} · ${done} resolved`}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 20, alignItems: "start" }}>

                {/* ── FORM ── */}
                <div style={{
                  borderRadius: 16, overflow: "hidden",
                  background: "#0c0d0e",
                  border: "1px solid rgba(255,255,255,0.07)",
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.6), 0 20px 60px rgba(0,0,0,0.4)",
                }}>

                  {/* Screenshot zone */}
                  <div
                    onClick={() => fileRef.current.click()}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      cursor: "pointer", minHeight: 64,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: isDragging ? "rgba(94,106,210,0.06)" : "transparent",
                      transition: "background 0.15s",
                    }}>
                    <AnimatePresence mode="wait">
                      {mediaPreview ? (
                        <motion.div key="preview" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={springFast}
                          style={{ position: "relative", display: "inline-block" }}>
                          <img src={mediaPreview} style={{ maxHeight: 140, borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", display: "block" }} alt="" />
                          <motion.button onClick={e => { e.stopPropagation(); setMediaPreview(null); setMediaFile(null); setMediaType(null); }}
                            whileTap={{ scale: 0.85 }}
                            style={{ position: "absolute", top: -8, right: -8, width: 20, height: 20, borderRadius: "50%", background: "#23252a", border: "1px solid rgba(255,255,255,0.1)", color: "#8a8f98", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            ✕
                          </motion.button>
                        </motion.div>
                      ) : (
                        <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          style={{ fontSize: 12, color: "#4a4f5a", margin: 0 }}>
                          Drop screenshot or paste{" "}
                          <kbd style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "#1a1b1d", border: "1px solid #34343a", color: "#6a6f78" }}>⌘V</kbd>
                        </motion.p>
                      )}
                    </AnimatePresence>
                    <input ref={fileRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])} style={{ display: "none" }} />
                  </div>

                  {/* Title — dominant */}
                  <div style={{ padding: "20px 20px 0" }}>
                    <textarea ref={titleRef} placeholder="Issue title"
                      value={title} rows={1}
                      onChange={e => { setTitle(e.target.value); autoResize(titleRef); }}
                      style={{
                        width: "100%", background: "none", border: "none", outline: "none", resize: "none",
                        fontSize: 18, fontWeight: 700, color: "#f7f8f8", letterSpacing: "-0.02em",
                        fontFamily: "inherit", lineHeight: 1.35, minHeight: 27,
                        caretColor: "#5e6ad2",
                      }}
                      placeholder="What went wrong?" />
                  </div>

                  {/* Description */}
                  <div style={{ padding: "8px 20px 16px" }}>
                    <textarea ref={descRef} placeholder="Describe the issue — steps, context, expected behaviour"
                      value={desc} rows={2}
                      onChange={e => { setDesc(e.target.value); autoResize(descRef); }}
                      style={{
                        width: "100%", background: "none", border: "none", outline: "none", resize: "none",
                        fontSize: 13, color: "#8a8f98", fontFamily: "inherit", lineHeight: 1.6, minHeight: 40,
                        caretColor: "#5e6ad2",
                      }} />
                  </div>

                  {/* Loom */}
                  <div style={{ padding: "0 20px 16px" }}>
                    <input type="url" placeholder="Loom video link (optional)" value={videoLink}
                      onChange={e => setVideoLink(e.target.value)} style={inputStyle} />
                  </div>

                  <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 0 16px" }} />

                  {/* Category */}
                  <div style={{ padding: "0 20px 16px" }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#4a4f5a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Type</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {CATS.map(c => (
                        <motion.button key={c.id} onClick={() => setCat(c.id)}
                          whileTap={{ scale: 0.95 }} transition={springSnap}
                          style={{
                            display: "flex", alignItems: "center", gap: 7, padding: "8px 12px",
                            borderRadius: 10, border: `1px solid ${cat === c.id ? c.border : "rgba(255,255,255,0.06)"}`,
                            background: cat === c.id ? c.bg : "transparent", cursor: "pointer",
                            fontSize: 13, fontWeight: 500, fontFamily: "inherit",
                            color: cat === c.id ? c.color : "#62666d",
                            transition: "all 0.12s",
                          }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: cat === c.id ? c.color : "#2e3035" }} />
                          {c.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Priority */}
                  <div style={{ padding: "0 20px 16px" }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#4a4f5a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Priority</p>
                    <div style={{ display: "flex", gap: 6 }}>
                      {PRIS.map(p => (
                        <motion.button key={p.id} onClick={() => setPri(p.id)}
                          whileTap={{ scale: 0.93 }} transition={springSnap}
                          style={{
                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                            padding: "7px 0", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                            fontSize: 12, fontWeight: 500,
                            border: `1px solid ${pri === p.id ? p.color + "50" : "rgba(255,255,255,0.06)"}`,
                            background: pri === p.id ? p.color + "14" : "transparent",
                            color: pri === p.id ? p.color : "#62666d",
                            transition: "all 0.12s",
                          }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: pri === p.id ? p.color : "#2e3035" }} />
                          {p.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 16 }} />

                  {/* People */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 20px 16px" }}>
                    {[
                      { label: "Raised by", val: raisedBy, set: setRaisedBy, list: "tl-r", items: TEAM },
                      { label: "Assigned to", val: assignedTo, set: setAssignedTo, list: "tl-a", items: ASSIGNEES },
                    ].map(f => (
                      <div key={f.label}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "#4a4f5a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                          {f.label} <span style={{ color: "#e5484d" }}>*</span>
                        </p>
                        <input list={f.list} type="text" placeholder="Name" value={f.val}
                          onChange={e => f.set(e.target.value)} style={inputStyle} />
                        <datalist id={f.list}>{f.items.map(m => <option key={m} value={m} />)}</datalist>
                      </div>
                    ))}
                  </div>

                  {/* Submit */}
                  <div style={{ padding: "0 20px 20px" }}>
                    <motion.button onClick={addItem} disabled={!canSubmit || saving}
                      whileTap={canSubmit && !saving ? { scale: 0.98 } : {}} transition={springSnap}
                      style={{
                        width: "100%", padding: "11px 0", borderRadius: 12, border: "none",
                        fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: canSubmit && !saving ? "pointer" : "not-allowed",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        ...(added
                          ? { background: "rgba(39,166,68,0.15)", color: "#27a644" }
                          : canSubmit && !saving
                          ? { background: "#5e6ad2", color: "#fff", boxShadow: "0 2px 20px rgba(94,106,210,0.45), inset 0 1px 0 rgba(255,255,255,0.18)" }
                          : { background: "rgba(255,255,255,0.04)", color: "#3a3f47" }),
                        transition: "all 0.15s",
                      }}>
                      <AnimatePresence mode="wait" initial={false}>
                        {added ? (
                          <motion.span key="added" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={springFast}
                            style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                            Saved to report
                          </motion.span>
                        ) : saving ? (
                          <motion.span key="saving" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={springFast}
                            style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <motion.span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "block" }}
                              animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />
                            Saving…
                          </motion.span>
                        ) : (
                          <motion.span key="idle" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={springFast}>
                            Add to report
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                    {canSubmit && !saving && !added && (
                      <p style={{ textAlign: "center", fontSize: 11, color: "#3a3f47", marginTop: 8 }}>
                        or press{" "}
                        <kbd style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "#141516", border: "1px solid #34343a", color: "#5a5f68" }}>⌘↵</kbd>
                      </p>
                    )}
                  </div>
                </div>

                {/* ── ISSUE LIST ── */}
                <div style={{
                  borderRadius: 16, overflow: "hidden",
                  background: "#0a0b0c",
                  border: "1px solid rgba(255,255,255,0.07)",
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.6), 0 20px 60px rgba(0,0,0,0.4)",
                  maxHeight: "calc(100vh - 160px)",
                  display: "flex", flexDirection: "column",
                }}>
                  {/* List header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#f7f8f8", letterSpacing: "-0.01em" }}>
                      Issues
                      {items.length > 0 && <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: "#4a4f5a" }}>{items.length}</span>}
                    </span>
                    {items.length > 0 && (
                      <motion.button onClick={() => setView("report")} whileTap={{ scale: 0.95 }}
                        style={{ fontSize: 12, color: "#5e6ad2", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                        View report →
                      </motion.button>
                    )}
                  </div>

                  {/* Progress bar */}
                  {items.length > 0 && (
                    <div style={{ height: 2, background: "#0f1011", flexShrink: 0 }}>
                      <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}
                        style={{ height: "100%", background: "#27a644" }} />
                    </div>
                  )}

                  {/* Rows */}
                  <div style={{ overflowY: "auto", flex: 1 }}>
                    {items.length === 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", textAlign: "center" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#0f1011", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3a3f47" strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#3a3f47", margin: "0 0 6px" }}>No issues yet</p>
                        <p style={{ fontSize: 12, color: "#2a2f35", lineHeight: 1.6, maxWidth: 200, margin: 0 }}>
                          Log your first issue using the form. It'll appear here instantly.
                        </p>
                      </motion.div>
                    ) : (
                      <AnimatePresence initial={false} mode="popLayout">
                        {[...items].reverse().map(item => (
                          <IssueRow key={item.id} item={item} onRemove={removeItem} onStatus={updateStatus} showStatus={false} />
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ REPORT ══ */}
          {view === "report" && (
            <motion.div key="report" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={spring}>

              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f7f8f8", letterSpacing: "-0.03em", margin: "0 0 6px" }}>{reportTitle}</h1>
                  <p style={{ fontSize: 13, color: "#4a4f5a", margin: 0 }}>
                    {items.length} issue{items.length !== 1 ? "s" : ""}
                    {items.length > 0 && <> · <span style={{ color: "#27a644" }}>{done} resolved</span> · <span style={{ color: pct === 100 ? "#27a644" : "#f7f8f8", fontWeight: 600 }}>{pct}%</span></>}
                  </p>
                </div>
                <motion.button onClick={copyLink} disabled={items.length === 0}
                  whileTap={items.length > 0 ? { scale: 0.97 } : {}} transition={springSnap}
                  style={{
                    padding: "9px 20px", borderRadius: 10, border: "none", cursor: items.length > 0 ? "pointer" : "not-allowed",
                    fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                    background: copied ? "#27a644" : "#5e6ad2", color: "#fff",
                    boxShadow: copied ? "0 2px 16px rgba(39,166,68,0.35)" : "0 2px 20px rgba(94,106,210,0.4), inset 0 1px 0 rgba(255,255,255,0.18)",
                    opacity: items.length === 0 ? 0.35 : 1, transition: "all 0.15s",
                  }}>
                  {copied ? "✓ Copied" : "Share link"}
                </motion.button>
              </div>

              {/* Progress */}
              {items.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ height: 3, background: "#0f1011", borderRadius: 2, overflow: "hidden" }}>
                    <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}
                      style={{ height: "100%", background: pct === 100 ? "#27a644" : "#5e6ad2", borderRadius: 2 }} />
                  </div>
                </div>
              )}

              {/* Stats */}
              {items.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                  {CATS.map((c, i) => {
                    const n = items.filter(it => it.category === c.id).length;
                    return (
                      <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.04 }}
                        style={{ background: "#0c0d0e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: "#f7f8f8", letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", lineHeight: 1, marginBottom: 8 }}>{n}</div>
                        <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20, color: c.color, background: c.bg, border: `1px solid ${c.border}` }}>{c.label}</span>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Share URL */}
              {items.length > 0 && (
                <div style={{ background: "#0c0d0e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, color: "#4a4f5a", flexShrink: 0 }}>Share URL</span>
                  <code style={{ fontSize: 12, color: "#8a8f98", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-geist-mono)" }}>{getShareUrl()}</code>
                </div>
              )}

              {items.length === 0 ? (
                <div style={{ background: "#0c0d0e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "60px 24px", textAlign: "center" }}>
                  <p style={{ color: "#3a3f47", fontSize: 14, margin: "0 0 8px" }}>No issues yet</p>
                  <button onClick={() => setView("capture")} style={{ fontSize: 12, color: "#5e6ad2", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Start capturing →</button>
                </div>
              ) : (
                <div style={{ background: "#0a0b0c", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
                  <AnimatePresence initial={false} mode="popLayout">
                    {items.map(item => (
                      <IssueRow key={item.id} item={item} onRemove={removeItem} onStatus={updateStatus} showStatus={true} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* ══ SESSIONS ══ */}
          {view === "sessions" && (
            <motion.div key="sessions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={spring}>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f7f8f8", letterSpacing: "-0.03em", margin: "0 0 4px" }}>Sessions</h1>
                <p style={{ fontSize: 13, color: "#4a4f5a", margin: 0 }}>All past QA sessions</p>
              </div>
              <div style={{ background: "#0a0b0c", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
                {loadingReports ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
                    <motion.div style={{ width: 24, height: 24, border: "2px solid #1e2025", borderTopColor: "#5e6ad2", borderRadius: "50%" }}
                      animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }} />
                  </div>
                ) : reports.length === 0 ? (
                  <div style={{ padding: 48, textAlign: "center" }}>
                    <p style={{ color: "#3a3f47", fontSize: 14, margin: 0 }}>No sessions yet</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {reports.map((r, i) => {
                      const n = r.items?.[0]?.count || 0, active = r.id === reportId;
                      return (
                        <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.04 }}
                          onClick={() => loadReport(r.id)}
                          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}
                          className="hover:bg-white/[0.02] transition-colors">
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "#f7f8f8" }}>{r.title || "Session"}</span>
                              {active && <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20, color: "#5e6ad2", background: "rgba(94,106,210,0.1)", border: "1px solid rgba(94,106,210,0.2)" }}>Current</span>}
                            </div>
                            <p style={{ fontSize: 12, color: "#4a4f5a", margin: "3px 0 0" }}>
                              {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                          <span style={{ fontSize: 12, color: "#4a4f5a" }}>{n} issue{n !== 1 ? "s" : ""}</span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
