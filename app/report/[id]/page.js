"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

const categories = [
  { id: "bug", label: "Bug", color: "#ef4444", bg: "#fef2f2", emoji: "🐛" },
  { id: "feature", label: "Feature", color: "#8b5cf6", bg: "#f5f3ff", emoji: "✨" },
  { id: "improvement", label: "Improvement", color: "#3b82f6", bg: "#eff6ff", emoji: "💡" },
  { id: "question", label: "Question", color: "#f59e0b", bg: "#fffbeb", emoji: "❓" },
];

const priorities = [
  { id: "critical", label: "Critical", color: "#dc2626" },
  { id: "high", label: "High", color: "#ea580c" },
  { id: "medium", label: "Medium", color: "#ca8a04" },
  { id: "low", label: "Low", color: "#65a30d" },
];

export default function ReportPage({ params }) {
  const [report, setReport] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(function() {
    loadReport();
  }, []);

  async function loadReport() {
    try {
      var reportResult = await supabase
        .from("reports")
        .select("*")
        .eq("id", params.id)
        .single();

      if (reportResult.error) {
        setError("Report not found");
        setLoading(false);
        return;
      }

      setReport(reportResult.data);

      var itemsResult = await supabase
        .from("items")
        .select("*")
        .eq("report_id", params.id)
        .order("created_at", { ascending: true });

      if (itemsResult.data) {
        setItems(itemsResult.data);
      }
    } catch (err) {
      setError("Report not found");
    }
    setLoading(false);
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

  if (loading) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <p style={{ color: "#64748b", fontSize: "18px" }}>Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>😕</div>
          <h1 style={{ color: "#1e293b", margin: "0 0 8px 0" }}>Report Not Found</h1>
          <p style={{ color: "#64748b" }}>This report may have been deleted.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#f1f5f9", padding: "24px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ background: "white", borderRadius: "16px", padding: "24px 32px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>📋 {report.title}</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>Generated: {new Date(report.created_at).toLocaleString()}</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginTop: "24px" }}>
            {categories.map(function(cat) {
              var count = items.filter(function(i) { return i.category === cat.id; }).length;
              return (
                <div key={cat.id} style={{ background: cat.bg, borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", marginBottom: "4px" }}>{cat.emoji}</div>
                  <div style={{ fontSize: "28px", fontWeight: "700", color: cat.color }}>{count}</div>
                  <div style={{ fontSize: "12px", color: cat.color, fontWeight: "500" }}>{cat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {items.length === 0 ? (
          <div style={{ background: "white", borderRadius: "16px", padding: "60px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
            <p style={{ color: "#64748b", fontSize: "18px" }}>No items in this report</p>
          </div>
        ) : (
          categories.map(function(cat) {
            var catItems = items.filter(function(i) { return i.category === cat.id; });
            if (catItems.length === 0) return null;

            return (
              <div key={cat.id} style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "24px" }}>{cat.emoji}</span>
                  <h2 style={{ fontSize: "20px", fontWeight: "700", color: cat.color, margin: 0 }}>{cat.label}</h2>
                  <span style={{ background: cat.bg, color: cat.color, padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "600" }}>{catItems.length}</span>
                </div>

                {catItems.map(function(item, idx) {
                  var pri = getPriorityInfo(item.priority);
                  return (
                    <div key={item.id} style={{ background: "white", borderRadius: "16px", padding: "24px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderLeft: "5px solid " + pri.color }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#1e293b" }}>{idx + 1}. {item.title}</h3>
                        <span style={{ background: pri.color, color: "white", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>{pri.label}</span>
                      </div>
                      {item.description && (
                        <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                          <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{item.description}</p>
                        </div>
                      )}
                      {item.screenshot_url && (
                        <div>
                          <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 8px 0", fontWeight: "500" }}>📸 Screenshot</p>
                          <a href={item.screenshot_url} target="_blank" rel="noopener noreferrer">
                            <img src={item.screenshot_url} alt="Screenshot" style={{ maxWidth: "100%", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", cursor: "pointer" }} />
                          </a>
                        </div>
                      )}
                      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f1f5f9", fontSize: "12px", color: "#94a3b8" }}>🕐 {new Date(item.created_at).toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}

        <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: "13px" }}>Generated with NeoCrew QA Tool</div>
      </div>
    </div>
  );
}
