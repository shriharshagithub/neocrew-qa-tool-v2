"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const fileRef = useRef(null);

  function addItem() {
    if (!title) return;
    setItems([...items, { id: Date.now(), title: title, screenshot: screenshot }]);
    setTitle("");
    setScreenshot(null);
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setScreenshot(ev.target.result);
      reader.readAsDataURL(file);
    }
  }

  return (
    <div style={{ padding: "30px", fontFamily: "system-ui", maxWidth: "600px", margin: "0 auto" }}>
      <h1>🧪 NeoCrew QA Tool</h1>
      
      <div style={{ background: "#f8f8f8", padding: "20px", borderRadius: "12px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Issue title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "10px", boxSizing: "border-box" }}
        />
        
        <div style={{ marginBottom: "10px" }}>
          <button onClick={() => fileRef.current.click()}>📷 Add Screenshot</button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          {screenshot && <img src={screenshot} style={{ display: "block", maxHeight: "100px", marginTop: "10px" }} />}
        </div>
        
        <button onClick={addItem} style={{ padding: "10px 20px", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          ➕ Add Item
        </button>
      </div>

      <h2>Items ({items.length})</h2>
      {items.map((item) => (
        <div key={item.id} style={{ background: "white", padding: "15px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #ddd" }}>
          <strong>{item.title}</strong>
          {item.screenshot && <img src={item.screenshot} style={{ display: "block", maxHeight: "150px", marginTop: "10px" }} />}
        </div>
      ))}
    </div>
  );
}
