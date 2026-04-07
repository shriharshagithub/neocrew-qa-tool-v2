"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";

const categories = [
  { id: "bug", label: "Bug", color: "#ef4444", bg: "#fef2f2" },
  { id: "feature", label: "Feature", color: "#8b5cf6", bg: "#f5f3ff" },
  { id: "improvement", label: "Improvement", color: "#3b82f6", bg: "#eff6ff" },
  { id: "question", label: "Question", color: "#f59e0b", bg: "#fffbeb" },
];

const priorities = [
  { id: "critical", label: "Critical", color: "#dc2626" },
  { id: "high", label: "High", color: "#ea580c" },
  { id: "medium", label: "Medium", color: "#ca8a04" },
  { id: "low", label: "Low", color: "#65a30d" },
];

function generateId() {
  return Math.random().toString(36).substring(2, 12);
}

export default function Home() {
  const [reportId, setReportId] = useState(null);
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("bug");
  const [priority, setPriority] = useState("medium");
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [view, setView] = useState("capture");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(function() {
    var storedId = null;
    if (typeof window !== "undefined") {
      storedId = localStorage.getItem("currentReportId");
    }
    if (storedId) {
      setReportId(storedId);
      loadReport(storedId);
    } else {
      createNewReport();
    }
  }, []);

  async function createNewReport() {
    var newId = generateId();
    try {
      await supabase.from("reports").insert({ id: newId, title: "Test Report" });
      setReportId(newId);
      setItems([]);
      if (typeof window !== "undefined") {
        localStorage.setItem("currentReportId", newId);
      }
    } catch (err) {
      console.log("Error creating report:", err);
    }
  }

  async function loadReport(id) {
    try {
      var result = await supabase
        .from("items")
        .select("*")
        .eq("report_id", id)
        .order("created_at", { ascending: true });
      if (result.data) {
        setItems(result.data);
      }
    } catch (err) {
      console.log("Error loading report:", err);
    }
  }

  function handleImageUpload(file) {
    if (file && file.type.startsWith("image/")) {
      var reader = new FileReader();
      reader.onload = function(e) {
        setScreenshot(e.target.result);
        setScreenshotFile(file);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    var file = e.dataTransfer.files[0];
    handleImageUpload(file);
  }

  function handlePaste(e) {
    var clipItems = e.clipboardData.items;
    for (var i = 0; i < clipItems.length; i++) {
      if (clipItems[i].type.startsWith("image/")) {
        var file = clipItems[i].getAsFile();
        handleImageUpload(file);
        break;
      }
    }
  }

  async function uploadScreenshot(file) {
    var fileName = generateId() + "-screenshot.png";
    try {
      await supabase.storage.from("screenshots").upload(fileName, file);
      var urlResult = supabase.storage.from("screenshots").getPublicUrl(fileName);
      return urlResult.data.publicUrl;
    } catch (err) {
      console.log("Upload error:", err);
      return null;
    }
  }

  async function addItem() {
    if (!title.trim() || !reportId) return;
    setSaving(true);

    var screenshotUrl = null;
    if (screenshotFile) {
      screenshotUrl = await uploadScreenshot(screenshotFile);
    }

    var newItem = {
      id: generateId(),
      report_id: reportId,
      title: title,
      description: description,
      category: category,
      priority: priority,
      screenshot_url: screenshotUrl,
    };

    try {
      await supabase.from("items").insert(newItem);
      newItem.created_at = new Date().toISOString();
      setItems(function(prev) { return prev.concat([newItem]); });
      setTitle("");
      setDescription("");
      setCategory("bug");
      setPriority("medium");
      setScreenshot(null);
      setScreenshotFile(null);
    } catch (err) {
      console.log("Error adding item:", err);
    }
    setSaving(false);
  }

  async function removeItem(id) {
    try {
      await supabase.from("items").delete().eq("id", id);
      setItems(function(prev) { return prev.filter(function(item) { return item.id !== id; }); });
    } catch (err) {
      console.log("Error removing item:", err);
    }
  }

  async function startNewReport() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentReportId");
    }
    await createNewReport();
  }

  function getShareUrl() {
    if (typeof window !== "undefined") {
      return window.location.origin + "/report/" + reportId;
    }
    return "";
  }

  function copyShareUrl() {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(function() { setCopied(false); }, 2000);
    }
  }

  function getCategoryInfo(id) {
    for (var i = 0; i < categories.length; i++) {
      if (categories[i].id === id) return categories[i];
    }
    return categories[0];
  }

  function getPriorityInfo(id) {
    for (var i = 0; i < priorities.length; i++) {
      if (priorities[i].id === id) return priorities[i];
    }
    return priorities[2];
  }

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: "24px",
      }}
      onPaste={handlePaste}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: 0 }}>🧪 NeoCrew QA Tool</h1>
            <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>Capture → Annotate → Share</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={function() { setView("capture"); }} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: view === "capture" ? "#3b82f6" : "#e2e8f0", color: view === "capture" ? "white" : "#475569", fontWeight: "600", cursor: "pointer" }}>📸 Capture</button>
            <button onClick={function() { setView("report"); }} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: view === "report" ? "#3b82f6" : "#e2e8f0", color: view === "report" ? "white" : "#475569", fontWeight: "600", cursor: "pointer" }}>📋 Report ({items.length})</button>
            <button onClick={startNewReport} style={{ padding: "10px 20px", borderRadius: "8px", border: "2px solid #e2e8f0", background: "white", color: "#475569", fontWeight: "600", cursor: "pointer" }}>✨ New</button>
          </div>
        </div>

        {view === "capture" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", marginTop: 0 }}>Add New Item</h2>
              
              <div
                onDrop={handleDrop}
                onDragOver={function(e) { e.preventDefault(); }}
                onClick={function() { fileInputRef.current && fileInputRef.current.click(); }}
                style={{ border: "2px dashed #cbd5e1", borderRadius: "12px", padding: "24px", textAlign: "center", cursor: "pointer", background: "#f8fafc", marginBottom: "16px" }}
              >
                {screenshot ? (
                  <img src={screenshot} alt="Screenshot" style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px" }} />
                ) : (
                  <div>
                    <div style={{ fontSize: "36px", marginBottom: "8px" }}>📷</div>
                    <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}><strong>Drop, paste (Ctrl+V), or click</strong></p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={function(e) { handleImageUpload(e.target.files[0]); }} style={{ display: "none" }} />
              </div>

              <input type="text" placeholder="Issue title..." value={title} onChange={function(e) { setTitle(e.target.value); }} style={{ width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "15px", marginBottom: "12px", boxSizing: "border-box" }} />
              
              <textarea placeholder="Steps to reproduce / details..." value={description} onChange={function(e) { setDescription(e.target.value); }} rows={3} style={{ width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px", marginBottom: "12px", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />

              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>Category</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {categories.map(function(cat) {
                    return (
                      <button key={cat.id} onClick={function() { setCategory(cat.id); }} style={{ padding: "8px 16px", borderRadius: "20px", border: category === cat.id ? "2px solid " + cat.color : "2px solid transparent", background: cat.bg, color: cat.color, fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>{cat.label}</button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>Priority</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {priorities.map(function(pri) {
                    return (
                      <button key={pri.id} onClick={function() { setPriority(pri.id); }} style={{ padding: "8px 16px", borderRadius: "6px", border: priority === pri.id ? "2px solid " + pri.color : "2px solid #e2e8f0", background: priority === pri.id ? pri.color : "white", color: priority === pri.id ? "white" : "#475569", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>{pri.label}</button>
                    );
                  })}
                </div>
              </div>

              <button onClick={addItem} disabled={!title.trim() || saving} style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: title.trim() && !saving ? "#3b82f6" : "#e2e8f0", color: title.trim() && !saving ? "white" : "#94a3b8", fontWeight: "700", fontSize: "15px", cursor: title.trim() && !saving ? "pointer" : "not-allowed" }}>{saving ? "⏳ Saving..." : "➕ Add to Report"}</button>
            </div>

            <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", maxHeight: "600px", overflowY: "auto" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", marginTop: 0 }}>Captured ({items.length})</h2>
              {items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>📝</div>
                  <p>No items yet</p>
                </div>
              ) : (
                items.map(function(item) {
                  var cat = getCategoryInfo(item.category);
                  var pri = getPriorityInfo(item.priority);
                  return (
                    <div key={item.id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px", marginBottom: "12px", borderLeft: "4px solid " + cat.color }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div>
                          <span style={{ background: cat.bg, color: cat.color, padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>{cat.label}</span>
                          <span style={{ color: pri.color, fontSize: "11px", fontWeight: "600", marginLeft: "8px" }}>● {pri.label}</span>
                        </div>
                        <button onClick={function() { removeItem(item.id); }} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px" }}>✕</button>
                      </div>
                      <h4 style={{ margin: "8px 0 4px", fontSize: "14px", color: "#1e293b" }}>{item.title}</h4>
                      {item.screenshot_url && <img src={item.screenshot_url} alt="" style={{ maxWidth: "100%", maxHeight: "80px", borderRadius: "6px", marginTop: "8px" }} />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "16px", padding: "32px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#1e293b", margin: 0 }}>📋 Test Report</h2>
              <button onClick={copyShareUrl} disabled={items.length === 0} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: items.length > 0 ? "#10b981" : "#e2e8f0", color: items.length > 0 ? "white" : "#94a3b8", fontWeight: "600", cursor: items.length > 0 ? "pointer" : "not-allowed" }}>{copied ? "✅ Copied!" : "🔗 Copy Share Link"}</button>
            </div>
            {items.length > 0 && (
              <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "12px", marginBottom: "24px" }}>
                <span style={{ color: "#64748b", fontSize: "14px" }}>Share link: </span>
                <code style={{ color: "#3b82f6", fontSize: "13px" }}>{getShareUrl()}</code>
              </div>
            )}
            {items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
                <p>No items yet. Go to Capture tab.</p>
              </div>
            ) : (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
                  {categories.map(function(cat) {
                    var count = items.filter(function(i) { return i.category === cat.id; }).length;
                    return (
                      <div key={cat.id} style={{ background: cat.bg, borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                        <div style={{ fontSize: "28px", fontWeight: "700", color: cat.color }}>{count}</div>
                        <div style={{ fontSize: "12px", color: cat.color }}>{cat.label}</div>
                      </div>
                    );
                  })}
                </div>
                {items.map(function(item, idx) {
                  var cat = getCategoryInfo(item.category);
                  var pri = getPriorityInfo(item.priority);
                  return (
                    <div key={item.id} style={{ background: "#f8fafc", borderRadius: "12px", padding: "20px", marginBottom: "12px", borderLeft: "4px solid " + pri.color }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <h4 style={{ margin: 0, fontSize: "16px", color: "#1e293b" }}>{idx + 1}. {item.title}</h4>
                        <span style={{ background: pri.color, color: "white", padding: "2px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>{pri.label}</span>
                      </div>
                      <span style={{ background: cat.bg, color: cat.color, padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>{cat.label}</span>
                      {item.description && <p style={{ margin: "12px 0", fontSize: "14px", color: "#475569", whiteSpace: "pre-wrap" }}>{item.description}</p>}
                      {item.screenshot_url && <img src={item.screenshot_url} alt="" style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px", marginTop: "12px" }} />}
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
