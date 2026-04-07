"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("bug");
  const [priority, setPriority] = useState("medium");
  const [screenshot, setScreenshot] = useState(null);
  const [view, setView] = useState("capture");
  const [copied, setCopied] = useState(false);
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

  const handleFile = (file) => {
    if (file && file.type.startsWith("image/")) {
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

  const addItem = () => {
    if (!title.trim()) return;
    const newItem = {
      id: Date.now(),
      title,
      description,
      category,
      priority,
      screenshot,
      status: "todo",
      assignee: "",
      time: new Date().toLocaleString()
    };
    setItems([...items, newItem]);
    setTitle("");
    setDescription("");
    setScreenshot(null);
  };

  const removeItem = (id) => setItems(items.filter((item) => item.id !== id));

  const copyReport = () => {
    let text = "TEST REPORT\n\n";
    items.forEach((item, idx) => {
      text += (idx + 1) + ". " + item.title + "\n";
      text += "Category: " + getCat(item.category).label + "\n";
      text += "Priority: " + getPri(item.priority).label + "\n";
      if (item.description) text += "Details: " + item.description + "\n";
      text += "\n";
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ fontFamily: "system-ui", minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", padding: "24px" }} onPaste={handlePaste}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "28px", color: "#1e293b", fontWeight: "800" }}>🧪 NeoCrew QA Tool</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>Capture bugs and features, share with developers</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setView("capture")} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: view === "capture" ? "#3b82f6" : "white", color: view === "capture" ? "white" : "#475569", fontWeight: "600", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>📸 Capture</button>
            <button onClick={() => setView("report")} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: view === "report" ? "#3b82f6" : "white", color: view === "report" ? "white" : "#475569", fontWeight: "600", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>📋 Report ({items.length})</button>
            <button onClick={() => setItems([])} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "white", color: "#475569", fontWeight: "600", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>✨ New</button>
          </div>
        </div>

        {view === "capture" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div style={{ background: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
              <h2 style={{ marginTop: 0, fontSize: "20px", color: "#1e293b", fontWeight: "700" }}>📝 Add New Item</h2>
              
              <div onClick={() => fileRef.current.click()} onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }} onDragOver={(e) => e.preventDefault()} style={{ border: "2px dashed #cbd5e1", borderRadius: "16px", padding: "28px", textAlign: "center", cursor: "pointer", marginBottom: "20px", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" }}>
                {screenshot ? (
                  <img src={screenshot} style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} alt="screenshot" />
                ) : (
                  <div>
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>📷</div>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "15px", fontWeight: "500" }}>Drop, paste (Ctrl+V), or click</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files[0])} style={{ display: "none" }} />
              </div>

              <input type="text" placeholder="Issue title..." value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "2px solid #e2e8f0", fontSize: "15px", marginBottom: "14px", boxSizing: "border-box" }} />
              
              <textarea placeholder="Steps to reproduce or details..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "2px solid #e2e8f0", fontSize: "14px", marginBottom: "14px", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }} />

              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#475569", marginBottom: "8px" }}>CATEGORY</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {categories.map((cat) => (
                    <button key={cat.id} onClick={() => setCategory(cat.id)} style={{ padding: "10px 16px", borderRadius: "25px", border: category === cat.id ? "2px solid " + cat.color : "2px solid transparent", background: cat.bg, color: cat.color, fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>{cat.emoji} {cat.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#475569", marginBottom: "8px" }}>PRIORITY</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {priorities.map((pri) => (
                    <button key={pri.id} onClick={() => setPriority(pri.id)} style={{ padding: "10px 16px", borderRadius: "10px", border: priority === pri.id ? "2px solid " + pri.color : "2px solid #e2e8f0", background: priority === pri.id ? pri.color : "white", color: priority === pri.id ? "white" : "#475569", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>{pri.label}</button>
                  ))}
                </div>
              </div>

              <button onClick={addItem} disabled={!title.trim()} style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "none", background: title.trim() ? "#3b82f6" : "#e2e8f0", color: title.trim() ? "white" : "#94a3b8", fontWeight: "700", fontSize: "16px", cursor: title.trim() ? "pointer" : "not-allowed" }}>➕ Add to Report</button>
            </div>

            <div style={{ background: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", maxHeight: "600px", overflowY: "auto" }}>
              <h2 style={{ marginTop: 0, fontSize: "20px", color: "#1e293b", fontWeight: "700" }}>📋 Captured ({items.length})</h2>
              {items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "50px 20px", color: "#94a3b8" }}>
                  <div style={{ fontSize: "56px", marginBottom: "12px" }}>📝</div>
                  <p style={{ fontSize: "16px", fontWeight: "500" }}>No items yet</p>
                </div>
              ) : (
                items.map((item) => {
                  const cat = getCat(item.category);
                  const pri = getPri(item.priority);
                  return (
                    <div key={item.id} style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", marginBottom: "12px", borderLeft: "5px solid " + cat.color, background: "#fafafa" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ background: cat.bg, color: cat.color, padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>{cat.emoji} {cat.label}</span>
                        <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" }}>✕</button>
                      </div>
                      <h4 style={{ margin: "10px 0 6px", fontSize: "15px", color: "#1e293b", fontWeight: "600" }}>{item.title}</h4>
                      <span style={{ color: pri.color, fontSize: "12px", fontWeight: "600" }}>● {pri.label}</span>
                      {item.screenshot && <img src={item.screenshot} style={{ display: "block", maxWidth: "100%", maxHeight: "80px", borderRadius: "8px", marginTop: "10px" }} alt="" />}
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
              <button onClick={copyReport} disabled={items.length === 0} style={{ padding: "12px 20px", borderRadius: "10px", border: "none", background: items.length > 0 ? "#10b981" : "#e2e8f0", color: items.length > 0 ? "white" : "#94a3b8", fontWeight: "600", cursor: items.length > 0 ? "pointer" : "not-allowed" }}>{copied ? "✅ Copied!" : "📋 Copy Report"}</button>
            </div>

            {items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
                <div style={{ fontSize: "56px", marginBottom: "16px" }}>📭</div>
                <p style={{ fontSize: "18px", fontWeight: "500" }}>No items in report</p>
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
                    <div key={item.id} style={{ background: "#f8fafc", borderRadius: "16px", padding: "24px", marginBottom: "16px", borderLeft: "5px solid " + pri.color }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "flex-start" }}>
                        <h4 style={{ margin: 0, fontSize: "18px", color: "#1e293b", fontWeight: "600" }}>{idx + 1}. {item.title}</h4>
                        <span style={{ background: pri.color, color: "white", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>{pri.label}</span>
                      </div>
                      <span style={{ background: cat.bg, color: cat.color, padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>{cat.emoji} {cat.label}</span>
                      {item.description && <p style={{ margin: "14px 0", fontSize: "14px", color: "#475569", lineHeight: "1.6" }}>{item.description}</p>}
                      {item.screenshot && <img src={item.screenshot} style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "12px", marginTop: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} alt="" />}
                      <div style={{ marginTop: "14px", fontSize: "12px", color: "#94a3b8" }}>🕐 {item.time}</div>
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
