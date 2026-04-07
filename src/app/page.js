"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [items, setItems] = useState([]);
  const [reportId, setReportId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("bug");
  const [priority, setPriority] = useState("medium");
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [view, setView] = useState("capture");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef(null);

  const categories = [
    { id: "bug", label: "Bug", color: "#ef4444", bg: "#fef2f2", emoji: "🐛" },
    { id: "feature", label: "Feature", color: "#8b5cf6", bg: "#f5f3ff", emoji: "✨" },
    { id: "improvement", label: "Improvement", color: "#3b82f6", bg: "#eff6ff", emoji: "💡" },
    { id: "question", label: "Question", color: "#f59e0b", bg: "#fffbeb", emoji: "❓" }
  ];

  const priorities = [
    { id: "critical", label: "Critical", color: "#dc2626" },
    { id: "high", label: "High", color: "#ea580c" },
    { id: "medium", label: "Medium", color: "#ca8a04" },
    { id: "low", label: "Low", color: "#65a30d" }
  ];

  const getCat = (id) => categories.find((c) => c.id === id) || categories[0];
  const getPri = (id) => priorities.find((p) => p.id === id) || priorities[2];

  useEffect(() => {
    initReport();
  }, []);

  const initReport = async () => {
    setLoading(true);
    let storedId = null;
    if (typeof window !== "undefined") {
      storedId = localStorage.getItem("qa_report_id");
    }

    if (storedId) {
      setReportId(storedId);
      await loadItems(storedId);
    } else {
      await createReport();
    }
    setLoading(false);
  };

  const createReport = async () => {
    const newId = Math.random().toString(36).substring(2, 12);
    try {
      await supabase.from("reports").insert({ id: newId, title: "Test Report" });
      setReportId(newId);
      if (typeof window !== "undefined") {
        localStorage.setItem("qa_report_id", newId);
      }
    } catch (err) {
      console.log("Error creating report");
    }
  };

  const loadItems = async (id) => {
    try {
      const { data } = await supabase
        .from("items")
        .select("*")
        .eq("report_id", id)
        .order("created_at", { ascending: true });
      if (data) setItems(data);
    } catch (err) {
      console.log("Error loading items");
    }
  };

  const handleFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setScreenshot(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e) => {
    const clipItems = e.clipboardData.items;
    for (let i = 0; i < clipItems.length; i++) {
      if (clipItems[i].type.startsWith("image/")) {
        handleFile(clipItems[i].getAsFile());
        break;
      }
    }
  };

  const uploadScreenshot = async (file) => {
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.png`;
    try {
      await supabase.storage.from("screenshots").upload(fileName, file);
      const { data } = supabase.storage.from("screenshots").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      console.log("Upload error");
      return null;
    }
  };

  const addItem = async () => {
    if (!title.trim() || !reportId) return;
    setSaving(true);

    let screenshotUrl = null;
    if (screenshotFile) {
      screenshotUrl = await uploadScreenshot(screenshotFile);
    }

    const newItem = {
      id: Math.random().toString(36).substring(2, 12),
      report_id: reportId,
      title,
      description,
      category,
      priority,
      screenshot_url: screenshotUrl,
      status: "todo",
      assignee: null
    };

    try {
      await supabase.from("items").insert(newItem);
      setItems([...items, { ...newItem, created_at: new Date().toISOString() }]);
      setTitle("");
      setDescription("");
      setScreenshot(null);
      setScreenshotFile(null);
    } catch (err) {
      console.log("Error adding item");
    }
    setSaving(false);
  };

  const removeItem = async (id) => {
    try {
      await supabase.from("items").delete().eq("id", id);
      setItems(items.filter((item) => item.id !== id));
    } catch (err) {
      console.log("Error removing item");
    }
  };

  const startNewReport = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("qa_report_id");
    }
    setItems([]);
    await createReport();
  };

  const getShareUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/report/${reportId}`;
    }
    return "";
  };

  const copyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ fontFamily: "system-ui", minHeight: "100vh", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>⏳</div>
          <p style={{ color: "#64748b" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui", minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", padding: "24px" }} onPaste={handlePaste}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "28px", color: "#1e293b", fontWeight: "800" }}>🧪 NeoCrew QA Tool</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>Capture bugs & features → Share with developers</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setView("capture")} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: view === "capture" ? "#3b82f6" : "white", color: view === "capture" ? "white" : "#475569", fontWeight: "600", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>📸 Capture</button>
            <button onClick={() => setView("report")} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: view === "report" ? "#3b82f6" : "white", color: view === "report" ? "white" : "#475569", fontWeight: "600", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>📋 Report ({items.length})</button>
            <button onClick={startNewReport} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "white", color: "#475569", fontWeight: "600", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>✨ New</button>
          </div>
        </div>

        {view === "capture" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div style={{ background: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
              <h2 style={{ marginTop: 0, fontSize: "20px", color: "#1e293b", fontWeight: "700" }}>📝 Add New Item</h2>
              
              <div onClick={() => fileRef.current.click()} onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }} onDragOver={(e) => e.preventDefault()} style={{ border: "2px dashed #cbd5e1", borderRadius: "16px", padding: "28px", textAlign: "center", cursor: "pointer", marginBottom: "20px", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", transition: "all 0.2s" }}>
                {screenshot ? (
                  <img src={screenshot} style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} alt="screenshot" />
                ) : (
                  <div>
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>📷</div>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "15px", fontWeight: "500" }}>Drop, paste (Ctrl+V), or click to add screenshot</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files[0])} style={{ display: "none" }} />
              </div>

              <input type="text" placeholder="Issue title..." value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "2px solid #e2e8f0", fontSize: "15px", marginBottom: "14px", boxSizing: "border-box", outline: "none", transition: "border 0.2s" }} />
              
              <textarea placeholder="Steps to reproduce or details for developers..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "2px solid #e2e8f0", fontSize: "14px", marginBottom: "14px", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical", outline: "none" }} />

              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#475569", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Category</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {categories.map((cat) => (
                    <button key={cat.id} onClick={() => setCategory(cat.id)} style={{ padding: "10px 16px", borderRadius: "25px", border: category === cat.id ? `2px solid ${cat.color}` : "2px solid transparent", background: cat.bg, color: cat.color, fontWeight: "600", fontSize: "13px", cursor: "pointer", transition: "all 0.2s" }}>{cat.emoji} {cat.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#475569", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Priority</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {priorities.map((pri) => (
                    <button key={pri.id} onClick={() => setPriority(pri.id)} style={{ padding: "10px 16px", borderRadius: "10px", border: priority === pri.id ? `2px solid ${pri.color}` : "2px solid #e2e8f0", background: priority === pri.id ? pri.color : "white", color: priority === pri.id ? "white" : "#475569", fontWeight: "600", fontSize: "13px", cursor: "pointer", transition: "all 0.2s" }}>{pri.label}</button>
                  ))}
                </div>
              </div>

              <button onClick={addItem} disabled={!title.trim() || saving} style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "none", background: title.trim() && !saving ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" : "#e2e8f0", color: title.trim() && !saving ? "white" : "#94a3b8", fontWeight: "700", fontSize: "16px", cursor: title.trim() && !saving ? "pointer" : "not-allowed", transition: "all 0.2s" }}>{saving ? "⏳ Saving..." : "➕ Add to Report"}</button>
            </div>

            <div style={{ background: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", maxHeight: "600px", overflowY: "auto" }}>
              <h2 style={{ marginTop: 0, fontSize: "20px", color: "#1e293b", fontWeight: "700" }}>📋 Captured ({items.length})</h2>
              {items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "50px 20px", color: "#94a3b8" }}>
                  <div style={{ fontSize: "56px", marginBottom: "12px" }}>📝</div>
                  <p style={{ fontSize: "16px", fontWeight: "500" }}>No items yet</p>
                  <p style={{ fontSize: "14px" }}>Add your first bug or feature!</p>
                </div>
              ) : (
                items.map((item) => {
                  const cat = getCat(item.category);
                  const pri = getPri(item.priority);
                  return (
                    <div key={item.id} style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", marginBottom: "12px", borderLeft: `5px solid ${cat.color}`, background: "#fafafa" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ background: cat.bg, color: cat.color, padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>{cat.emoji} {cat.label}</span>
                        <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" }}>✕</button>
                      </div>
                      <h4 style={{ margin: "10px 0 6px", fontSize: "15px", color: "#1e293b", fontWeight: "600" }}>{item.title}</h4>
                      <span style={{ color: pri.color, fontSize: "12px", fontWeight: "600" }}>● {pri.label}</span>
                      {item.screenshot_url && <img src={item.screenshot_url} style={{ display: "block", maxWidth: "100%", maxHeight: "80px", borderRadius: "8px", marginTop: "10px" }} alt="" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "20px", padding: "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "24px", color: "#1e293b", fontWeight: "700" }}>📋 Test Report</h2>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={copyLink} disabled={items.length === 0} style={{ padding: "12px 20px", borderRadius: "10px", border: "none", background: items.length > 0 ? "#10b981" : "#e2e8f0", color: items.length > 0 ? "white" : "#94a3b8", fontWeight: "600", cursor: items.length > 0 ? "pointer" : "not-allowed" }}>{copied ? "✅ Link Copied!" : "🔗 Copy Share Link"}</button>
              </div>
            </div>

            {items.length > 0 && (
              <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", borderRadius: "12px", padding: "16px", marginBottom: "24px", border: "1px solid #bbf7d0" }}>
                <div style={{ fontSize: "13px", color: "#166534", fontWeight: "600", marginBottom: "6px" }}>📤 Share this link with developers:</div>
                <code style={{ fontSize: "14px", color: "#15803d", wordBreak: "break-all" }}>{getShareUrl()}</code>
              </div>
            )}

            {items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
                <div style={{ fontSize: "56px", marginBottom: "16px" }}>📭</div>
                <p style={{ fontSize: "18px", fontWeight: "500" }}>No items in report</p>
                <p>Go to Capture tab to add bugs or features</p>
              </div>
            ) : (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "28px" }}>
                  {categories.map((cat) => {
                    const count = items.filter((i) => i.category === cat.id).length;
                    return <div key={cat.id} style={{ background: cat.bg, borderRadius: "14px", padding: "18px", textAlign: "center" }}><div style={{ fontSize: "32px", fontWeight: "800", color: cat.color }}>{count}</div><div style={{ fontSize: "13px", color: cat.color, fontWeight: "600" }}>{cat.emoji} {cat.label}</div></div>;
                  })}
                </div>
                {items.map((item, idx) => {
                  const cat = getCat(item.category);
                  const pri = getPri(item.priority);
                  return (
                    <div key={item.id} style={{ background: "#f8fafc", borderRadius: "16px", padding: "24px", marginBottom: "16px", borderLeft: `5px solid ${pri.color}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "flex-start" }}>
                        <h4 style={{ margin: 0, fontSize: "18px", color: "#1e293b", fontWeight: "600" }}>{idx + 1}. {item.title}</h4>
                        <span style={{ background: pri.color, color: "white", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>{pri.label}</span>
                      </div>
                      <span style={{ background: cat.bg, color: cat.color, padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>{cat.emoji} {cat.label}</span>
                      {item.description && <p style={{ margin: "14px 0", fontSize: "14px", color: "#475569", lineHeight: "1.6" }}>{item.description}</p>}
                      {item.screenshot_url && <img src={item.screenshot_url} style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "12px", marginTop: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} alt="" />}
                      <div style={{ marginTop: "14px", fontSize: "12px", color: "#94a3b8" }}>🕐 {new Date(item.created_at).toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
