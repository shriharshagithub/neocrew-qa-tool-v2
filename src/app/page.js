"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { supabase } from "../lib/supabase";

// ── Spring configs ─────────────────────────────────────────────────────────────
const spring     = { type: "spring", stiffness: 350, damping: 28 };
const springFast = { type: "spring", stiffness: 420, damping: 26 };
const springSnap = { type: "spring", stiffness: 500, damping: 30 };

// ── Design tokens ──────────────────────────────────────────────────────────────
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

const TEAM     = ["Shri", "Roshit", "Jhilik", "Amit", "Ritesh", "Harsha"];
const ASSIGNEES = ["Harsha", "Roshit", "Amit", "Jhilik", "Ritesh"];

const getCat  = (id) => CATS.find(c => c.id === id)  || CATS[0];
const getPri  = (id) => PRIS.find(p => p.id === id)  || PRIS[2];
const getStat = (id) => STATS.find(s => s.id === id) || STATS[0];

const todayTitle = () => {
  const now  = new Date();
  const date = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `QA Session – ${date}, ${time}`;
};
const firstName = (u) =>
  (u?.user_metadata?.full_name || u?.user_metadata?.name || "").split(" ")[0] ||
  u?.email?.split("@")[0] || "You";

const fmtStamp = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
  );
};

// ── Priority dot ──────────────────────────────────────────────────────────────
function PriDot({ id }) {
  const p = getPri(id);
  return <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />;
}

// ── Category badge ────────────────────────────────────────────────────────────
function CatBadge({ id }) {
  const c = getCat(id);
  return (
    <span
      className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border"
      style={{ color: c.text, background: c.bg, borderColor: c.border, letterSpacing: "0.01em" }}
    >
      {c.label}
    </span>
  );
}

// ── Hold-to-delete button ─────────────────────────────────────────────────────
function HoldToDelete({ onDelete }) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const startRef    = useRef(null);
  const HOLD_MS     = 650;

  const start = useCallback((e) => {
    e.stopPropagation();
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(elapsed / HOLD_MS, 1);
      setProgress(pct);
      if (pct >= 1) {
        clearInterval(intervalRef.current);
        setProgress(0);
        onDelete();
      }
    }, 16);
  }, [onDelete]);

  const cancel = useCallback(() => {
    clearInterval(intervalRef.current);
    setProgress(0);
  }, []);

  return (
    <motion.button
      onMouseDown={start}
      onMouseUp={cancel}
      onMouseLeave={cancel}
      onTouchStart={start}
      onTouchEnd={cancel}
      className="relative w-6 h-6 flex items-center justify-center rounded-md overflow-hidden"
      style={{
        background: progress > 0 ? `rgba(229,72,77,${0.08 + progress * 0.18})` : "transparent",
        border: "none",
        cursor: "pointer",
        flexShrink: 0,
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title="Hold to delete"
    >
      {/* Progress fill */}
      <motion.div
        className="absolute inset-0 rounded-md"
        style={{
          background: "rgba(229,72,77,0.25)",
          scaleX: progress,
          transformOrigin: "left",
        }}
      />
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke={progress > 0.3 ? "#e5484d" : "#62666d"}
        strokeWidth="2.5"
        style={{ position: "relative", transition: "stroke 0.1s" }}
      >
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </motion.button>
  );
}

// ── Issue row ─────────────────────────────────────────────────────────────────
const priMap = { critical: "pri-critical", high: "pri-high", medium: "pri-medium", low: "pri-low" };

function IssueRow({ item, onRemove, onStatus, showStatus }) {
  const isDone = item.status === "done";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: isDone ? 0.45 : 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.18 } }}
      transition={spring}
      className={`group border-b border-hairline last:border-b-0 pl-3 pr-4 py-3 hover:bg-white/[0.025] transition-colors duration-75 ${priMap[item.priority] || ""}`}
    >
      {/* ── Main row ── */}
      <div className="flex items-start gap-2.5 min-w-0">
        <PriDot id={item.priority} />

        <span
          className={`row-title flex-1 text-sm leading-snug min-w-0 ${
            isDone ? "line-through text-ink-subtle" : "text-ink"
          }`}
        >
          {item.title}
        </span>

        {/* Right cluster */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {item.created_at && (
            <span className="hidden sm:block text-xs text-ink-tertiary tabular whitespace-nowrap">
              {fmtStamp(item.created_at)}
            </span>
          )}
          <CatBadge id={item.category} />
          {!showStatus && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-100">
              <HoldToDelete onDelete={() => onRemove(item.id)} />
            </div>
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
          {item.media_type === "video" ? (
            <a
              href={item.screenshot_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-lavender hover:text-lavender-hover border border-hairline hover:border-hairline-strong rounded-lg px-3 py-1.5 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch on Loom
            </a>
          ) : (
            <img
              src={item.screenshot_url}
              className="rounded-lg max-h-48 border border-hairline object-contain cursor-pointer"
              alt=""
              onClick={() => window.open(item.screenshot_url, "_blank")}
            />
          )}
        </div>
      )}

      {/* ── Footer ── */}
      {(item.raised_by || item.assignee || showStatus) && (
        <div className="flex items-center gap-3 mt-2 ml-[18px] flex-wrap">
          {item.raised_by && (
            <span className="text-xs text-ink-tertiary">↑ {item.raised_by}</span>
          )}
          {item.assignee && (
            <span className="text-xs text-ink-tertiary">→ {item.assignee}</span>
          )}
          {showStatus && (
            <div className="flex items-center gap-1 ml-auto">
              {STATS.map((s) => (
                <motion.button
                  key={s.id}
                  onClick={() => onStatus(item.id, s.id)}
                  whileTap={{ scale: 0.93 }}
                  transition={springSnap}
                  className="text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer"
                  style={
                    (item.status || "todo") === s.id
                      ? { color: s.color, background: s.activeBg, borderColor: `${s.color}40` }
                      : { color: "#62666d", background: "transparent", borderColor: "#23252a" }
                  }
                >
                  {s.label}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── View wrapper ──────────────────────────────────────────────────────────────
function ViewPane({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={spring}
    >
      {children}
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
  const fileRef   = useRef(null);
  const titleRef  = useRef(null);
  const descRef   = useRef(null);

  // ── Auth ──
  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUser(user);
      setRaisedBy(firstName(user));
      setAuthLoading(false);
      loadOrCreateReport();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((ev) => {
      if (ev === "SIGNED_OUT") router.push("/login");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // ── Auto-resize textarea ──
  const autoResize = (ref) => {
    if (!ref?.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = ref.current.scrollHeight + "px";
  };

  // ── Report ──
  const loadOrCreateReport = async () => {
    if (!supabase) return;
    const stored = localStorage.getItem("qa_report_id");
    if (stored) {
      const { data } = await supabase
        .from("reports")
        .select("id,title")
        .eq("id", stored)
        .single();
      if (data) {
        setReportId(stored);
        if (data.title) setReportTitle(data.title);
        const { data: its } = await supabase
          .from("items")
          .select("*")
          .eq("report_id", stored)
          .order("created_at");
        if (its) setItems(its);
        return;
      }
    }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const t  = todayTitle();
    await supabase.from("reports").upsert({ id, title: t }, { onConflict: "id" });
    localStorage.setItem("qa_report_id", id);
    setReportId(id);
    setReportTitle(t);
  };

  // ── Media ──
  const FILE_LIMIT = 10 * 1024 * 1024;

  const compressImage = (file) =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 1600;
        let { width: w, height: h } = img;
        if (w > MAX || h > MAX) {
          const r = Math.min(MAX / w, MAX / h);
          w = Math.round(w * r);
          h = Math.round(h * r);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob || file), "image/jpeg", 0.82);
        URL.revokeObjectURL(url);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > FILE_LIMIT) {
      alert(`Image too large — max 10 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).`);
      return;
    }
    setMediaFile(file);
    setMediaType("image");
    const r = new FileReader();
    r.onload = (e) => setMediaPreview(e.target.result);
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
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error } = await supabase.storage
      .from("screenshots")
      .upload(name, toUpload, { contentType: "image/jpeg" });
    if (error) { console.error("Storage upload failed:", error.message); return null; }
    return supabase.storage.from("screenshots").getPublicUrl(name).data.publicUrl;
  };

  // ── Add ──
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
        if (!confirm("Image upload failed — add the issue without it?")) {
          setSaving(false);
          return;
        }
      } else {
        finalMediaType = "image";
      }
    }
    const item = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      report_id:      reportId,
      title:          title.trim(),
      description:    desc.trim(),
      category:       cat,
      priority:       pri,
      screenshot_url: mediaUrl,
      media_type:     finalMediaType,
      status:         "todo",
      raised_by:      raisedBy || null,
      assignee:       assignedTo || null,
      created_at:     new Date().toISOString(),
    };
    if (supabase && reportId) {
      await supabase
        .from("reports")
        .upsert({ id: reportId, title: reportTitle }, { onConflict: "id" });
      await supabase.from("items").insert(item);
    }
    setItems((p) => [...p, item]);
    setTitle("");
    setDesc("");
    setMediaPreview(null);
    setMediaFile(null);
    setMediaType(null);
    setVideoLink("");
    setAssignedTo("");
    // keep raisedBy as current user
    setSaving(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
    // reset textarea heights
    if (titleRef.current) titleRef.current.style.height = "auto";
    if (descRef.current)  descRef.current.style.height  = "auto";
  };

  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  };

  const removeItem = async (id) => {
    if (supabase) await supabase.from("items").delete().eq("id", id);
    setItems((p) => p.filter((i) => i.id !== id));
  };

  const updateStatus = async (id, st) => {
    if (supabase) await supabase.from("items").update({ status: st }).eq("id", id);
    setItems((p) => p.map((i) => (i.id === id ? { ...i, status: st } : i)));
  };

  const startNew = () => {
    if (!confirm("Start a new session? Your current report is saved.")) return;
    localStorage.removeItem("qa_report_id");
    setItems([]);
    setView("capture");
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const t  = todayTitle();
    setReportId(id);
    setReportTitle(t);
    localStorage.setItem("qa_report_id", id);
    if (supabase) supabase.from("reports").upsert({ id, title: t }, { onConflict: "id" });
  };

  const loadReports = async () => {
    if (!supabase) return;
    setLoadingReports(true);
    const { data } = await supabase
      .from("reports")
      .select("id,title,created_at,items(count)")
      .order("created_at", { ascending: false });
    if (data) setReports(data);
    setLoadingReports(false);
  };

  const loadReport = async (id) => {
    if (!supabase) return;
    localStorage.setItem("qa_report_id", id);
    setReportId(id);
    const { data: r } = await supabase
      .from("reports")
      .select("id,title")
      .eq("id", id)
      .single();
    if (r?.title) setReportTitle(r.title);
    const { data } = await supabase
      .from("items")
      .select("*")
      .eq("report_id", id)
      .order("created_at");
    if (data) setItems(data);
    setView("report");
  };

  const getShareUrl = () =>
    typeof window !== "undefined" && reportId
      ? `${window.location.origin}/report/${reportId}`
      : "";
  const copyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Stats ──
  const done  = items.filter((i) => i.status === "done").length;
  const pct   = items.length ? Math.round((done / items.length) * 100) : 0;
  const crits = items.filter((i) => i.priority === "critical").length;

  // ─────────────────────────────────────────────────────────────────────────────
  if (authLoading) return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <motion.div
        className="w-8 h-8 border-2 border-hairline border-t-lavender rounded-full"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas" onPaste={handlePaste} onKeyDown={onKeyDown}>

      {/* ── Floating nav ────────────────────────────────────────────────────── */}
      <div className="floating-nav-wrap">
        <nav className="floating-nav">
          {/* Logo → home */}
          <motion.button
            onClick={() => setView("capture")}
            whileTap={{ scale: 0.95 }}
            transition={springSnap}
            className="flex items-center flex-shrink-0 bg-transparent border-none cursor-pointer p-0"
          >
            <img src="/neocrew-logo.png" alt="NeoCrew QA" className="h-6 w-auto" />
          </motion.button>

          {/* Session title */}
          <span className="text-sm text-ink-subtle truncate max-w-[220px] hidden sm:block">
            {reportTitle}
          </span>

          <div className="flex-1" />

          {/* Critical badge */}
          <AnimatePresence>
            {crits > 0 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={springFast}
                className="hidden sm:flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                style={{
                  color: "#e5484d",
                  background: "rgba(229,72,77,0.1)",
                  border: "1px solid rgba(229,72,77,0.2)",
                }}
              >
                {crits} critical
              </motion.span>
            )}
          </AnimatePresence>

          {items.length > 0 && (
            <span className="hidden sm:block text-xs text-ink-tertiary tabular">
              {done}/{items.length} done
            </span>
          )}

          {/* Avatar */}
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              className="w-6 h-6 rounded-full border border-hairline flex-shrink-0"
              alt=""
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-s2 border border-hairline text-ink-subtle text-xs flex items-center justify-center flex-shrink-0 font-medium">
              {firstName(user).charAt(0).toUpperCase()}
            </div>
          )}

          {/* Overflow menu */}
          <div className="relative group">
            <motion.button
              whileTap={{ scale: 0.9 }}
              transition={springSnap}
              className="text-ink-tertiary hover:text-ink bg-transparent border-none cursor-pointer p-1 rounded transition-colors text-base leading-none"
              title="More options"
            >
              ···
            </motion.button>
            <div className="absolute right-0 top-full mt-1 w-44 bg-s2 border border-hairline rounded-xl shadow-lg overflow-hidden opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-100 z-50">
              <button
                onClick={startNew}
                className="w-full text-left text-sm text-ink-subtle hover:text-ink hover:bg-s3 px-4 py-2.5 border-none bg-transparent cursor-pointer transition-colors"
              >
                Start new session
              </button>
              <div className="border-t border-hairline" />
              <button
                onClick={() => supabase.auth.signOut()}
                className="w-full text-left text-sm text-tag-red hover:bg-tag-red/10 px-4 py-2.5 border-none bg-transparent cursor-pointer transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="border-b border-hairline px-5 mt-1">
        <div className="flex items-center gap-1 h-11 max-w-6xl mx-auto">
          {[
            { id: "capture",  label: "Capture" },
            { id: "report",   label: `Report${items.length > 0 ? ` ${items.length}` : ""}` },
            { id: "sessions", label: "Sessions" },
          ].map((t) => (
            <motion.button
              key={t.id}
              onClick={() => {
                setView(t.id);
                if (t.id === "sessions") loadReports();
              }}
              whileTap={{ scale: 0.96 }}
              transition={springSnap}
              className={`l-tab ${view === t.id ? "l-tab-active" : "l-tab-inactive"}`}
            >
              {t.label}
            </motion.button>
          ))}

          {/* Progress bar */}
          <AnimatePresence>
            {items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={spring}
                className="ml-auto flex items-center gap-2.5"
              >
                <div className="w-20 h-0.5 bg-hairline rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ background: "#27a644" }}
                  />
                </div>
                <span className="text-xs text-ink-tertiary tabular">{pct}%</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-5 py-6">
        <AnimatePresence mode="wait" initial={false}>

          {/* ══ CAPTURE ══ */}
          {view === "capture" && (
            <ViewPane key="capture">
              <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5">

                {/* ── Form card ── */}
                <div
                  className="self-start rounded-2xl p-px"
                  style={{
                    background:
                      "linear-gradient(145deg, rgba(94,106,210,0.28) 0%, rgba(255,255,255,0.06) 45%, rgba(0,0,0,0) 100%)",
                  }}
                >
                  <div className="l-card p-0 overflow-hidden">

                    {/* Media drop zone */}
                    <div
                      onClick={() => fileRef.current.click()}
                      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      className={`relative border-b border-hairline p-4 text-center cursor-pointer transition-colors ${
                        isDragging ? "bg-lavender/5" : "hover:bg-white/[0.015]"
                      }`}
                    >
                      <AnimatePresence mode="wait">
                        {mediaPreview ? (
                          <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={springFast}
                            className="relative inline-block"
                          >
                            <img
                              src={mediaPreview}
                              className="max-h-40 rounded-lg border border-hairline object-contain"
                              alt=""
                            />
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMediaPreview(null);
                                setMediaFile(null);
                                setMediaType(null);
                              }}
                              whileTap={{ scale: 0.85 }}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-s3 text-ink-subtle rounded-full text-xs border border-hairline cursor-pointer flex items-center justify-center"
                              style={{ border: "none" }}
                            >
                              ✕
                            </motion.button>
                          </motion.div>
                        ) : (
                          <motion.p
                            key="placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-ink-tertiary py-2"
                          >
                            Attach screenshot · paste{" "}
                            <kbd style={{
                              fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                              fontSize: "0.7rem", fontWeight: 500, lineHeight: 1,
                              padding: "2px 5px", borderRadius: 4, background: "#141516",
                              border: "1px solid #34343a", color: "#8a8f98",
                            }}>
                              ⌘V
                            </kbd>
                          </motion.p>
                        )}
                      </AnimatePresence>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFile(e.target.files[0])}
                        className="hidden"
                      />
                    </div>

                    {/* Title — dominant field */}
                    <div className="px-5 pt-4 pb-0">
                      <textarea
                        ref={titleRef}
                        placeholder="Issue title *"
                        value={title}
                        rows={1}
                        onChange={(e) => { setTitle(e.target.value); autoResize(titleRef); }}
                        className="w-full bg-transparent border-none outline-none resize-none text-[17px] font-semibold text-ink placeholder:text-ink-tertiary leading-snug tracking-tight"
                        style={{ minHeight: 28, fontFamily: "inherit" }}
                      />
                    </div>

                    {/* Hairline separator */}
                    <div className="mx-5 mt-3 border-t border-hairline" />

                    {/* Description */}
                    <div className="px-5 pt-3 pb-4">
                      <textarea
                        ref={descRef}
                        placeholder="Description, steps, or context *"
                        value={desc}
                        rows={2}
                        onChange={(e) => { setDesc(e.target.value); autoResize(descRef); }}
                        className="w-full bg-transparent border-none outline-none resize-none text-sm text-ink-subtle placeholder:text-ink-tertiary leading-relaxed"
                        style={{ minHeight: 44, fontFamily: "inherit" }}
                      />
                    </div>

                    {/* Loom video link */}
                    <div className="px-5 pb-4">
                      <input
                        type="url"
                        placeholder="Loom video link (optional)"
                        value={videoLink}
                        onChange={(e) => setVideoLink(e.target.value)}
                        className="l-input text-sm"
                      />
                    </div>

                    {/* Hairline separator */}
                    <div className="mx-5 border-t border-hairline" />

                    {/* Category — 2×2 grid */}
                    <div className="px-5 pt-4 pb-3">
                      <p className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-widest mb-2.5">
                        Type
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {CATS.map((c) => (
                          <motion.button
                            key={c.id}
                            onClick={() => setCat(c.id)}
                            whileTap={{ scale: 0.95 }}
                            transition={springSnap}
                            className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border cursor-pointer transition-colors text-left"
                            style={
                              cat === c.id
                                ? { color: c.text, background: c.bg, borderColor: c.border }
                                : { color: "#62666d", background: "transparent", borderColor: "#23252a" }
                            }
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: cat === c.id ? c.dot : "#3e3e44" }}
                            />
                            {c.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Priority */}
                    <div className="px-5 pb-4">
                      <p className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-widest mb-2.5">
                        Priority
                      </p>
                      <div className="flex gap-1.5">
                        {PRIS.map((p) => (
                          <motion.button
                            key={p.id}
                            onClick={() => setPri(p.id)}
                            whileTap={{ scale: 0.93 }}
                            transition={springSnap}
                            className="flex-1 flex items-center justify-center gap-1 text-xs font-medium py-2 rounded-lg border cursor-pointer"
                            style={
                              pri === p.id
                                ? { color: p.color, background: `${p.color}14`, borderColor: `${p.color}40` }
                                : { color: "#62666d", background: "transparent", borderColor: "#23252a" }
                            }
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: pri === p.id ? p.color : "#3e3e44" }}
                            />
                            {p.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Hairline */}
                    <div className="mx-5 border-t border-hairline" />

                    {/* People */}
                    <div className="grid grid-cols-2 gap-3 px-5 pt-4 pb-4">
                      <div>
                        <p className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-widest mb-2">
                          Raised by <span className="text-tag-red">*</span>
                        </p>
                        <input
                          list="tl-r"
                          type="text"
                          placeholder="Name"
                          value={raisedBy}
                          onChange={(e) => setRaisedBy(e.target.value)}
                          className="l-input text-sm"
                        />
                        <datalist id="tl-r">
                          {TEAM.map((m) => <option key={m} value={m} />)}
                        </datalist>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-widest mb-2">
                          Assigned to <span className="text-tag-red">*</span>
                        </p>
                        <input
                          list="tl-a"
                          type="text"
                          placeholder="Name"
                          value={assignedTo}
                          onChange={(e) => setAssignedTo(e.target.value)}
                          className="l-input text-sm"
                        />
                        <datalist id="tl-a">
                          {ASSIGNEES.map((m) => <option key={m} value={m} />)}
                        </datalist>
                      </div>
                    </div>

                    {/* Submit button */}
                    <div className="px-5 pb-5">
                      <motion.button
                        onClick={addItem}
                        disabled={!canSubmit || saving}
                        whileTap={canSubmit && !saving ? { scale: 0.97 } : {}}
                        transition={springSnap}
                        className="w-full py-2.5 rounded-full text-sm font-medium flex items-center justify-center gap-2 border-none overflow-hidden relative"
                        style={
                          added
                            ? { background: "rgba(39,166,68,0.15)", color: "#27a644", cursor: "default" }
                            : canSubmit && !saving
                            ? {
                                background: "#5e6ad2",
                                color: "#fff",
                                cursor: "pointer",
                                boxShadow:
                                  "0 1px 8px rgba(94,106,210,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                              }
                            : {
                                background: "rgba(255,255,255,0.04)",
                                color: "#62666d",
                                cursor: "not-allowed",
                              }
                        }
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {added ? (
                            <motion.span
                              key="added"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={springFast}
                              className="flex items-center gap-2"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                              Saved to report
                            </motion.span>
                          ) : saving ? (
                            <motion.span
                              key="saving"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={springFast}
                              className="flex items-center gap-2"
                            >
                              <motion.span
                                className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                              />
                              Saving…
                            </motion.span>
                          ) : (
                            <motion.span
                              key="idle"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={springFast}
                              className="flex items-center gap-2"
                            >
                              Add to report
                              {canSubmit && (
                                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                  </svg>
                                </span>
                              )}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                      {canSubmit && (
                        <p className="text-center text-[11px] text-ink-tertiary mt-2">
                          <kbd style={{
                            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                            fontSize: "0.65rem", fontWeight: 500,
                            padding: "1px 4px", borderRadius: 3, background: "#141516",
                            border: "1px solid #34343a", color: "#8a8f98",
                          }}>⌘↵</kbd>{" "}
                          to submit
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Issue list panel ── */}
                <div className="l-card overflow-hidden" style={{ maxHeight: "82vh" }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
                    <span className="text-sm font-semibold text-ink tracking-tight">
                      Issues
                      {items.length > 0 && (
                        <span className="ml-2 text-xs font-normal text-ink-tertiary">{items.length}</span>
                      )}
                    </span>
                    {items.length > 0 && (
                      <motion.button
                        onClick={() => setView("report")}
                        whileTap={{ scale: 0.95 }}
                        className="text-xs text-lavender hover:text-lavender-hover bg-transparent border-none cursor-pointer transition-colors"
                      >
                        View report →
                      </motion.button>
                    )}
                  </div>

                  <div className="overflow-y-auto" style={{ maxHeight: "calc(82vh - 50px)" }}>
                    {items.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, ...spring }}
                        className="flex flex-col items-center justify-center py-16 text-center px-6"
                      >
                        <div className="w-10 h-10 rounded-xl bg-s2 border border-hairline flex items-center justify-center mb-3">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#62666d" strokeWidth="1.5">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </div>
                        <p className="text-ink-subtle text-sm font-medium mb-1">No issues captured yet</p>
                        <p className="text-ink-tertiary text-xs leading-relaxed">
                          Fill in the form and hit{" "}
                          <span className="text-ink-subtle font-medium">Add to report</span>. Each
                          issue is saved instantly and timestamped.
                        </p>
                      </motion.div>
                    ) : (
                      <AnimatePresence initial={false} mode="popLayout">
                        {[...items].reverse().map((item) => (
                          <IssueRow
                            key={item.id}
                            item={item}
                            onRemove={removeItem}
                            onStatus={updateStatus}
                            showStatus={false}
                          />
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              </div>
            </ViewPane>
          )}

          {/* ══ REPORT ══ */}
          {view === "report" && (
            <ViewPane key="report">
              {/* Header */}
              <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
                <div>
                  <h1 className="text-xl font-semibold text-ink tracking-tight">{reportTitle}</h1>
                  <p className="text-xs text-ink-tertiary mt-1">
                    {items.length} issue{items.length !== 1 ? "s" : ""}
                    {items.length > 0 && (
                      <>
                        {" "}·{" "}
                        <span style={{ color: "#27a644" }}>{done} resolved</span>
                      </>
                    )}
                  </p>
                </div>
                <motion.button
                  onClick={copyLink}
                  disabled={items.length === 0}
                  whileTap={items.length > 0 ? { scale: 0.97 } : {}}
                  transition={springSnap}
                  className="l-btn-primary"
                  style={copied ? { background: "#27a644" } : {}}
                >
                  {copied ? "✓ Link copied" : "Copy share link"}
                </motion.button>
              </div>

              {/* Progress bar */}
              {items.length > 0 && (
                <div className="mb-5">
                  <div className="h-0.5 bg-hairline rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      style={{ background: "#27a644" }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-ink-tertiary tabular">
                      {done} of {items.length} resolved
                    </span>
                    <span
                      className="text-xs tabular"
                      style={{ color: pct === 100 ? "#27a644" : "#62666d" }}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>
              )}

              {/* Share URL */}
              {items.length > 0 && (
                <div className="l-card px-4 py-3 mb-5 flex items-center gap-3">
                  <span className="text-xs text-ink-tertiary flex-shrink-0">Share URL</span>
                  <code className="text-xs text-ink-subtle flex-1 truncate font-mono">
                    {getShareUrl()}
                  </code>
                </div>
              )}

              {/* Stats grid */}
              {items.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {CATS.map((c, i) => {
                    const n = items.filter((it) => it.category === c.id).length;
                    return (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...spring, delay: i * 0.05 }}
                        className="l-card px-4 py-3"
                      >
                        <div className="text-2xl font-semibold text-ink tracking-tight tabular mb-1.5">
                          {n}
                        </div>
                        <CatBadge id={c.id} />
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Issue list */}
              {items.length === 0 ? (
                <div className="l-card px-4 py-16 text-center">
                  <p className="text-ink-tertiary text-sm">No issues captured</p>
                  <button
                    onClick={() => setView("capture")}
                    className="mt-2 text-xs text-lavender bg-transparent border-none cursor-pointer hover:text-lavender-hover"
                  >
                    Start capturing →
                  </button>
                </div>
              ) : (
                <div className="l-card overflow-hidden">
                  <AnimatePresence initial={false} mode="popLayout">
                    {items.map((item) => (
                      <IssueRow
                        key={item.id}
                        item={item}
                        onRemove={removeItem}
                        onStatus={updateStatus}
                        showStatus={true}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ViewPane>
          )}

          {/* ══ SESSIONS ══ */}
          {view === "sessions" && (
            <ViewPane key="sessions">
              <div className="l-card overflow-hidden">
                <div className="px-4 py-3 border-b border-hairline">
                  <span className="text-sm font-semibold text-ink tracking-tight">Sessions</span>
                </div>
                {loadingReports ? (
                  <div className="flex items-center justify-center py-12">
                    <motion.div
                      className="w-6 h-6 border-2 border-hairline border-t-lavender rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                    />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-ink-tertiary text-sm">No sessions yet</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {reports.map((r, i) => {
                      const n      = r.items?.[0]?.count || 0;
                      const active = r.id === reportId;
                      return (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ ...spring, delay: i * 0.04 }}
                          onClick={() => loadReport(r.id)}
                          className="flex items-center justify-between px-4 py-3 border-b border-hairline last:border-b-0 hover:bg-white/[0.025] cursor-pointer transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-ink font-medium">{r.title || "Session"}</span>
                              {active && (
                                <span
                                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                                  style={{
                                    color: "#5e6ad2",
                                    background: "rgba(94,106,210,0.1)",
                                    border: "1px solid rgba(94,106,210,0.2)",
                                  }}
                                >
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-ink-tertiary mt-0.5">
                              {new Date(r.created_at).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric",
                              })}
                            </p>
                          </div>
                          <span className="text-xs text-ink-tertiary">
                            {n} issue{n !== 1 ? "s" : ""}
                          </span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </ViewPane>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
