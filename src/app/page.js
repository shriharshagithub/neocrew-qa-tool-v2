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
  const fileInputRef = useRef(null);

  var categories = [
    { id: "bug", label: "Bug", color: "#ef4444", bg: "#fef2f2" },
    { id: "feature", label: "Feature", color: "#8b5cf6", bg: "#f5f3ff" },
    { id: "improvement", label: "Improvement", color: "#3b82f6", bg: "#eff6ff" },
    { id: "question", label: "Question", color: "#f59e0b", bg: "#fffbeb" }
  ];

  var priorities = [
    { id: "critical", label: "Critical", color: "#dc2626" },
    { id: "high", label: "High", color: "#ea580c" },
    { id: "medium", label: "Medium", color: "#ca8a04" },
    { id: "low", label: "Low", color: "#65a30d" }
  ];

  function handleFile(file) {
    if (file && file.type.startsWith("image/")) {
      var reader = new FileReader();
      reader.onload = function(e) {
        setScreenshot(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  function handlePaste(e) {
    var clipItems = e.clipboardData.items;
    for (var i = 0; i < clipItems.length; i++) {
      if (clipItems[i].type.startsWith("image/")) {
        handleFile(clipItems[i].getAsFile());
        break;
      }
    }
  }

  function addItem() {
    if (!title.trim()) return;
    var newItem = {
      id: Date.now(),
      title: title,
      description: description,
      category: category,
      priority: priority,
      screenshot: screenshot,
      time: new Date().toLocaleString()
    };
    setItems(items.concat([newItem]));
    setTitle("");
    setDescription("");
    setScreenshot(null);
  }

  function removeItem(id) {
    setItems(items.filter(function(item) { return item.id !== id; }));
  }

  function getCat(id) {
    for (var i = 0; i < categories.length; i++) {
      if (categories[i].id === id) return categories[i];
    }
    return categories[0];
  }

  function getPri(id) {
    for (var i = 0; i < priorities.length; i++) {
      if (priorities[i].id === id) return priorities[i];
    }
    return priorities[2];
  }

  function copyReport() {
    var text = "TEST REPORT\n\n";
    items.forEach(function(item, idx) {
      text += (idx + 1) + ". " + item.title + "\n";
      text += "Category: " + getCat(item.category).label + "\n";
      text += "Priority: " + getPri(item.priority).label + "\n";
      if (item.description) text += "Details: " + item.description + "\n";
      text += "\n";
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(function() { setCopied(false); }, 2000);
  }

  return (
    <div style={{ fontFamily: "system-ui", minHeight: "100vh", background: "#f1f5f9", padding: "24px" }} onPaste={handlePaste}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "26px", color: "#1e293b" }}>🧪 NeoCrew QA Tool</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>Capture → Annotate → Share</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={function() { setView("capture"); }} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: view === "capture" ? "#3b82f6" : "#e2e8f0", color: view === "capture" ? "white" : "#475569", fontWeight: "600", cursor: "pointer" }}>📸 Capture</button>
            <button onClick={function() { setView("report"); }} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: view === "report" ? "#3b82f6" : "#e2e8f0", color: view === "report" ? "white" : "#475569", fontWeight: "600", cursor: "pointer" }}>📋 Report ({items.length})</button>
          </div>
        </div>

        {view === "capture" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <h2 style={{ marginTop: 0, fontSize: "18px", color: "#1e293b" }}>Add Item</h2>
              
              <div onClick={function() { fileInputRef.current.click(); }} onDrop={function(e) { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }} onDragOver={function(e) { e.preventDefault(); }} style={{ border: "2px dashed #cbd5e1", borderRadius: "12px", padding: "24px", textAlign: "center", cursor: "pointer", marginBottom: "16px", background: "#f8fafc" }}>
                {screenshot ? (
                  <img src={screenshot} style={{ maxWidth: "100%", maxHeight: "180px", borderRadius: "8px" }} />
                ) : (
