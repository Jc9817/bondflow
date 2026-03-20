"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

type DocStatus = "UPLOADED" | "EXTRACTING" | "REVIEW" | "CONFIRMED";
type Doc = {
  id: string; fileName: string; filePath: string; contentType: string | null;
  size: number | null; createdAt: string; status: DocStatus;
  customer?: { id: string; fullName: string } | null;
  case?: { id: string; caseType: string } | null;
};

const COLUMNS: { key: DocStatus; label: string; color: string; bg: string; icon: string; desc: string }[] = [
  { key: "UPLOADED",   label: "Uploaded",   icon: "↑", color: "#0369a1", bg: "#e0f2fe", desc: "Saved, not yet processed" },
  { key: "EXTRACTING", label: "Extracting", icon: "⟳", color: "#7c3aed", bg: "#ede9fe", desc: "AI is reading the document" },
  { key: "REVIEW",     label: "To Review",  icon: "✎", color: "#b45309", bg: "#fef3c7", desc: "Extracted, awaiting confirmation" },
  { key: "CONFIRMED",  label: "Confirmed",  icon: "✓", color: "#15803d", bg: "#dcfce7", desc: "Fields verified and saved" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [docs, setDocs]         = useState<Doc[]>([]);
  const [loading, setLoading]   = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<DocStatus | null>(null);

  useEffect(() => {
    fetch("/api/uploads").then((r) => r.json()).then((d) => setDocs(d.uploads ?? [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const form = new FormData(); form.append("file", file);
      const res  = await fetch("/api/uploads", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { alert(data?.error || "Upload failed"); return; }
      setDocs((prev) => [{ ...data.upload, status: "UPLOADED" }, ...prev]);
    } catch (err: any) { alert(err?.message); }
    finally { e.target.value = ""; }
  }

  async function removeDoc(id: string) {
    if (!window.confirm("Remove this document?")) return;
    const res = await fetch(`/api/uploads/${id}`, { method: "DELETE" });
    if (!res.ok) { alert("Failed to remove"); return; }
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  function onDrop(status: DocStatus) {
    if (!dragging) return;
    setDocs((prev) => prev.map((d) => d.id === dragging ? { ...d, status } : d));
    fetch(`/api/uploads/${dragging}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).catch(console.error);
    setDragging(null); setDragOver(null);
  }

  const byStatus = (s: DocStatus) => docs.filter((d) => d.status === s);

  return (
    <div style={st.shell}>
      <Sidebar />

      <div style={st.main}>
        {/* Top bar */}
        <div style={st.topbar}>
          <div>
            <div style={st.pageTitle}>Dashboard</div>
            <div style={st.pageSubtitle}>Upload · Extract · Review · Confirm</div>
          </div>
          <label style={st.uploadBtn}>
            <input type="file" accept=".pdf,image/*" onChange={onPickFile} style={{ display: "none" }} />
            + Upload Document
          </label>
        </div>

        {/* Stats */}
        <div style={st.statsBar}>
          {COLUMNS.map((col) => (
            <div key={col.key} style={st.stat}>
              <div style={{ ...st.statIcon, background: col.bg, color: col.color }}>{col.icon}</div>
              <div><div style={st.statNum}>{byStatus(col.key).length}</div><div style={st.statLabel}>{col.label}</div></div>
            </div>
          ))}
        </div>

        {/* Kanban board */}
        {loading ? <div style={st.loading}>Loading…</div> : (
          <div style={st.board}>
            {COLUMNS.map((col) => (
              <div key={col.key}
                style={{ ...st.column, outline: dragOver === col.key ? `2px dashed ${col.color}` : "2px solid transparent", background: dragOver === col.key ? col.bg : "#f8fafc" }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(col.key); }}
                onDrop={() => onDrop(col.key)}
              >
                <div style={st.colHeader}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ ...st.colIcon, background: col.bg, color: col.color }}>{col.icon}</span>
                    <div><div style={st.colTitle}>{col.label}</div><div style={st.colDesc}>{col.desc}</div></div>
                  </div>
                  <span style={{ ...st.colCount, background: col.bg, color: col.color }}>{byStatus(col.key).length}</span>
                </div>
                <div style={st.cards}>
                  {byStatus(col.key).length === 0 ? (
                    <div style={st.emptyCol}>Drop cards here</div>
                  ) : byStatus(col.key).map((doc) => (
                    <div key={doc.id} draggable onDragStart={() => setDragging(doc.id)} onDragEnd={() => { setDragging(null); setDragOver(null); }} style={st.card}>
                      <div style={st.cardTop}>
                        <span style={{ ...st.extBadge, background: col.bg, color: col.color }}>
                          {doc.contentType?.startsWith("image/") ? "IMG" : doc.fileName.split(".").pop()?.toUpperCase() ?? "FILE"}
                        </span>
                        <span style={st.cardName} title={doc.fileName}>{doc.fileName}</span>
                      </div>
                      {(doc.customer || doc.case) && (
                        <div style={st.crmRow}>
                          {doc.customer && <button style={st.crmCustomer} onClick={(e) => { e.stopPropagation(); router.push(`/customers/${doc.customer!.id}`); }}>👤 {doc.customer.fullName}</button>}
                          {doc.case     && <button style={st.crmCase}     onClick={(e) => { e.stopPropagation(); router.push(`/cases/detail?id=${doc.case!.id}`); }}>📁 {doc.case.caseType}</button>}
                        </div>
                      )}
                      {!doc.customer && doc.status !== "CONFIRMED" && <div style={st.linkHint}>⚠ Not linked to customer</div>}
                      <div style={st.cardMeta}>{doc.size != null && <span>{(doc.size / 1024).toFixed(1)} KB</span>}<span>•</span><span>{timeAgo(new Date(doc.createdAt).getTime())}</span></div>
                      <div style={st.cardActions}>
                        {(col.key === "UPLOADED" || col.key === "REVIEW") && (
                          <button style={{ ...st.actionBtn, background: col.color, color: "white", border: "none" }}
                            onClick={() => router.push(`/review?fileId=${doc.id}&filePath=${encodeURIComponent(doc.filePath)}&fileName=${encodeURIComponent(doc.fileName)}`)}>
                            {doc.status === "REVIEW" ? "Review" : "Extract & Review"}
                          </button>
                        )}
                        <a href={doc.filePath} target="_blank" rel="noreferrer" style={st.viewLink}>View</a>
                        <button style={st.removeBtn} onClick={() => removeDoc(doc.id)}>Remove</button>
                      </div>
                      <div style={st.dragHint}>⠿ drag to move</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function timeAgo(ts: number) {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

const st: Record<string, React.CSSProperties> = {
  shell:      { display: "flex", minHeight: "100vh", fontFamily: '"DM Sans", system-ui, sans-serif', background: "#f1f5f9" },
  main:       { flex: 1, display: "flex", flexDirection: "column", overflow: "auto" },
  topbar:     { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px", background: "white", borderBottom: "1px solid rgba(15,23,42,0.08)" },
  pageTitle:  { fontSize: 20, fontWeight: 800, color: "#0f172a" },
  pageSubtitle:{ fontSize: 12, color: "#94a3b8", marginTop: 2 },
  uploadBtn:  { padding: "10px 18px", borderRadius: 10, background: "#0f172a", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", border: "none", display: "inline-block" },
  statsBar:   { display: "flex", gap: 12, padding: "16px 28px", background: "white", borderBottom: "1px solid rgba(15,23,42,0.06)" },
  stat:       { display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderRadius: 12, border: "1px solid rgba(15,23,42,0.07)", background: "#fafafa", flex: 1 },
  statIcon:   { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, flexShrink: 0 },
  statNum:    { fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1 },
  statLabel:  { fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginTop: 2 },
  loading:    { textAlign: "center", padding: "60px", color: "#94a3b8" },
  board:      { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, padding: "20px 28px", flex: 1, alignItems: "start" },
  column:     { borderRadius: 14, border: "1px solid rgba(15,23,42,0.08)", padding: 12, minHeight: 400, transition: "outline 0.15s, background 0.15s" },
  colHeader:  { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  colIcon:    { width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, flexShrink: 0 },
  colTitle:   { fontSize: 13, fontWeight: 800, color: "#0f172a" },
  colDesc:    { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  colCount:   { fontSize: 12, fontWeight: 800, borderRadius: 20, padding: "2px 8px" },
  cards:      { display: "flex", flexDirection: "column", gap: 8 },
  emptyCol:   { textAlign: "center", padding: "28px 12px", color: "#cbd5e1", fontSize: 12, fontWeight: 600, border: "1.5px dashed #e2e8f0", borderRadius: 10 },
  card:       { background: "white", borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", padding: 12, cursor: "grab", display: "flex", flexDirection: "column", gap: 7, boxShadow: "0 1px 4px rgba(2,8,23,0.04)" },
  cardTop:    { display: "flex", alignItems: "center", gap: 8 },
  extBadge:   { fontSize: 10, fontWeight: 800, borderRadius: 6, padding: "2px 6px", flexShrink: 0 },
  cardName:   { fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  crmRow:     { display: "flex", gap: 4, flexWrap: "wrap" as const },
  crmCustomer:{ fontSize: 11, fontWeight: 600, color: "#0369a1", background: "#e0f2fe", padding: "2px 7px", borderRadius: 6, cursor: "pointer", border: "none" },
  crmCase:    { fontSize: 11, fontWeight: 600, color: "#b45309", background: "#fef3c7", padding: "2px 7px", borderRadius: 6, cursor: "pointer", border: "none" },
  linkHint:   { fontSize: 11, color: "#94a3b8", fontStyle: "italic" },
  cardMeta:   { display: "flex", gap: 6, fontSize: 11, color: "#94a3b8" },
  cardActions:{ display: "flex", gap: 6, flexWrap: "wrap" as const },
  actionBtn:  { padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer" },
  viewLink:   { padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#475569", border: "1px solid rgba(15,23,42,0.10)", textDecoration: "none" },
  removeBtn:  { padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700, background: "white", color: "#94a3b8", border: "1px solid rgba(15,23,42,0.10)", cursor: "pointer" },
  dragHint:   { fontSize: 10, color: "#cbd5e1", textAlign: "right", userSelect: "none" as const },
};