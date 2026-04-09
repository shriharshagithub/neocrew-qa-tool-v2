"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams } from "next/navigation";

export default function SharedReport() {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: "bug", label: "Bug", color: "#ef4444", bg: "#fef2f2", emoji: "\u{1F41B}" },
    { id: "feature", label: "Feature", color: "#8b5cf6", bg: "#f5f3ff", emoji: "\u2728" },
    { id: "improvement", label: "Improvement", color: "#3b82f6", bg: "#eff6ff", emoji: "\u{1F4A1}" },
    { id: "question", label: "Question", color: "#f59e0b", bg: "#fffbeb", emoji: "\u2753" }
  ];

  const priorities = [
    { id: "critical", label: "Critical", color: "#dc2626" },
    { id: "high", label: "High", color: "#ea580c" },
    { id: "medium", label: "Medium", color: "#ca8a04" },
    { id: "low", label: "Low", color: "#65a30d" }
  ];

  const statuses = [
    { id: "todo", label: "Todo", color: "#64748b", bg: "#f1f5f9" },
    { id: "in_progress", label: "In Progress", color: "#f59e0b", bg: "#fffbeb" },
    { id: "done", label: "Done", color: "#10b981", bg: "#f0fdf4" }
  ];

  const getCat = (cid) => categories.find((c) => c.id === cid) || categories[0];
  const getPri = (pid) => priorities.find((p) => p.id === pid) || priorities[2];
  const getStatus = (sid) => statuses.find((s) => s.id === sid) || statuses[0];

  useEffect(() => {
    if (id) loadReport();
  }, [id]);

  const loadReport = async () => {
    if (!supabase) { setLoading(false); return; }
    const { data: reportData } = await supabase.from("reports").select("*").eq("id", id).single();
    if (reportData) setReport(reportData);
    const { data } = await supabase.from("items").select("*").eq("report_id", id).order("created_at", { ascending: true });
    if (data) setItems(data);
    setLoading(false);
  };

  const updateStatus = async (itemId, newStatus) => {
    if (supabase) {
      await supabase.from("items").update({ status: newStatus }).eq("id", itemId);
    }
    setItems(items.map((item) => item.id === itemId ? { ...item, status: newStatus } : item));
  };

  if (loading) {
    return (
      <div style={{ fontFamily: "system-ui", minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: "18px", color: "#64748b" }}>Loading report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ fontFamily: "system-ui", minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>{"\u{1F50D}"}</div>
        <p style={{ fontSize: "18px", color: "#64748b" }}>Report not found</p>
      </div>
    );
  }

  const todoCount = items.filter((i) => (i.status || "todo") === "todo").length;
  const inProgressCount = items.filter((i) => i.status === "in_progress").length;
  const doneCount = items.filter((i) => i.status === "done").length;

  return (
    <div style={{ fontFamily: "system-ui", minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", padding: "24px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "28px", color: "#1e293b", fontWeight: "800" }}>{"\u{1F9EA}"} {report.title || "Test Report"}</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>Report ID: {id} {"\u00B7"} {items.length} item{items.length !== 1 ? "s" : ""} {"\u00B7"} Created {new Date(report.created_at).toLocaleDateString()}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "28px" }}>
          <div style={{ background: "#f1f5f9", borderRadius: "14px", padding: "18px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: "800", color: "#64748b" }}>{todoCount}</div>
            <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>Todo</div>
          </div>
          <div style={{ background: "#fffbeb", borderRadius: "14px", padding: "18px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: "800", color: "#f59e0b" }}>{inProgressCount}</div>
            <div style={{ fontSize: "13px", color: "#f59e0b", fontWeight: "600" }}>In Progress</div>
          </div>
          <div style={{ background: "#f0fdf4", borderRadius: "14px", padding: "18px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: "800", color: "#10b981" }}>{doneCount}</div>
            <div style={{ fontSize: "13px", color: "#10b981", fontWeight: "600" }}>Done</div>
          </div>
        </div>

        {items.length === 0 ? (
          <div style={{ background: "white", borderRadius: "20px", padding: "60px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>{"\u{1F4ED}"}</div>
            <p style={{ fontSize: "18px", fontWeight: "500" }}>No items in this report</p>
          </div>
        ) : (
          items.map((item, idx) => {
            const cat = getCat(item.category);
            const pri = getPri(item.priority);
            return (
              <div key={item.id} style={{ background: "white", borderRadius: "16px", padding: "24px", marginBottom: "16px", borderLeft: "5px solid " + pri.color, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "flex-start" }}>
                  <h4 style={{ margin: 0, fontSize: "18px", color: "#1e293b", fontWeight: "600" }}>{idx + 1}. {item.title}</h4>
                  <span style={{ background: pri.color, color: "white", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>{pri.label}</span>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
                  <span style={{ background: cat.bg, color: cat.color, padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>{cat.emoji} {cat.label}</span>
                  {statuses.map((st) => {
                    const active = (item.status || "todo") === st.id;
                    return <button key={st.id} onClick={() => updateStatus(item.id, st.id)} style={{ padding: "4px 12px", borderRadius: "6px", border: active ? "2px solid " + st.color : "1px solid #e2e8f0", background: active ? st.bg : "white", color: active ? st.color : "#94a3b8", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>{st.label}</button>;
                  })}
                </div>

                {(item.raised_by || item.assignee) && (
                  <div style={{ display: "flex", gap: "16px", marginBottom: "12px", fontSize: "13px" }}>
                    {item.raised_by && <span style={{ color: "#64748b" }}>Raised by: <strong style={{ color: "#1e293b" }}>{item.raised_by}</strong></span>}
                    {item.assignee && <span style={{ color: "#64748b" }}>Assigned to: <strong style={{ color: "#1e293b" }}>{item.assignee}</strong></span>}
                  </div>
                )}

                {item.description && <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#475569", lineHeight: "1.6" }}>{item.description}</p>}
                {item.screenshot_url && (item.media_type === "video" ? <video src={item.screenshot_url} controls style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} /> : <img src={item.screenshot_url} style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} alt="" />)}
                {item.created_at && <div style={{ marginTop: "14px", fontSize: "12px", color: "#94a3b8" }}>{"\u{1F550}"} {new Date(item.created_at).toLocaleString()}</div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
