"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DocStatus = "UPLOADED" | "EXTRACTING" | "REVIEW" | "CONFIRMED";

type Doc = {
  id: string;
  fileName: string;
  filePath: string;
  contentType: string | null;
  size: number | null;
  createdAt: string;
  status: DocStatus;
  case?: { id: string; caseType: string; customer: { id: string; fullName: string } } | null;
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
    fetch("/api/uploads")
      .then((r) => r.json())
      .then((data) => setDocs(data.uploads ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch("/api/uploads", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { alert(data?.error || "Upload failed"); return; }
      setDocs((prev) => [{ ...data.upload, status: "UPLOADED" }, ...prev]);
    } catch (err: any) {
      alert(err?.message || "Upload error");
    } finally {
      e.target.value = "";
    }
  }

  // ✅ FIX: Remove now calls DELETE API so it persists after refresh
  async function removeDoc(id: string) {
    const confirmed = window.confirm("Remove this document? This cannot be undone.");
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/uploads/${id}`, { method: "DELETE" });
      if (!res.ok) { alert("Failed to remove document"); return; }
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(err?.message || "Remove failed");
    }
  }

  function onDrop(status: DocStatus) {
    if (!dragging) return;
    setDocs((prev) => prev.map((d) => (d.id === dragging ? { ...d, status } : d)));
    fetch(`/api/uploads/${dragging}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(console.error);
    setDragging(null);
    setDragOver(null);
  }

  const byStatus = (s: DocStatus) => docs.filter((d) => d.status === s);

  return (
    <div style={st.page}>
      {/* Header */}
      <header style={st.header}>
        <div>
          <div style={st.logo}>📋 DocFlow</div>
          <p style={st.tagline}>Upload · Extract · Review · Confirm</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button style={st.navBtn} onClick={() => router.push("/login")}>
          ⬅ Menu
          </button>
          {/* ✅ FIX: Use router.push instead of <a> for reliable navigation */}
          <button style={st.navBtn} onClick={() => router.push("/customers")}>
            👥 Customers
          </button>
          <label style={st.uploadBtn}>
            <input type="file" accept=".pdf,image/*" onChange={onPickFile} style={{ display: "none" }} />
            + Upload
          </label>
          <a href="/login" style={st.ghostNavBtn}>Sign out</a>
        </div>
      </header>

      {/* Stats bar */}
      <div style={st.statsBar}>
        {COLUMNS.map((col) => (
          <div key={col.key} style={st.stat}>
            <div style={{ ...st.statIcon, background: col.bg, color: col.color }}>{col.icon}</div>
            <div>
              <div style={st.statNum}>{byStatus(col.key).length}</div>
              <div style={st.statLabel}>{col.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      {loading ? (
        <div style={st.loading}>Loading…</div>
      ) : (
        <div style={st.board}>
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              style={{
                ...st.column,
                outline: dragOver === col.key ? `2px dashed ${col.color}` : "2px solid transparent",
                background: dragOver === col.key ? col.bg : "#f8fafc",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.key); }}
              onDrop={() => onDrop(col.key)}
            >
              <div style={st.colHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ ...st.colIcon, background: col.bg, color: col.color }}>{col.icon}</span>
                  <div>
                    <div style={st.colTitle}>{col.label}</div>
                    <div style={st.colDesc}>{col.desc}</div>
                  </div>
                </div>
                <span style={{ ...st.colCount, background: col.bg, color: col.color }}>
                  {byStatus(col.key).length}
                </span>
              </div>

              <div style={st.cards}>
                {byStatus(col.key).length === 0 ? (
                  <div style={st.emptyCol}>Drop cards here</div>
                ) : (
                  byStatus(col.key).map((doc) => (
                    <DocCard
                      key={doc.id}
                      doc={doc}
                      colColor={col.color}
                      colBg={col.bg}
                      onDragStart={() => setDragging(doc.id)}
                      onDragEnd={() => { setDragging(null); setDragOver(null); }}
                      onRemove={() => removeDoc(doc.id)}
                      onReview={() => router.push(`/review?fileId=${doc.id}&filePath=${encodeURIComponent(doc.filePath)}&fileName=${encodeURIComponent(doc.fileName)}`)}
                      onViewCustomer={(custId) => router.push(`/customers/${custId}`)}
                      onViewCase={(caseId) => router.push(`/cases/${caseId}`)}
                      showReview={col.key === "UPLOADED" || col.key === "REVIEW"}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && docs.length === 0 && (
        <div style={st.emptyState}>
          <div style={{ fontSize: 56 }}>📂</div>
          <div style={st.emptyTitle}>No documents yet</div>
          <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 6 }}>Upload a PDF or image to get started</div>
          <label style={{ ...st.uploadBtn, marginTop: 16, display: "inline-block", cursor: "pointer" }}>
            <input type="file" accept=".pdf,image/*" onChange={onPickFile} style={{ display: "none" }} />
            + Upload your first document
          </label>
        </div>
      )}
    </div>
  );
}

// ── Doc Card ─────────────────────────────────────────────────────────────────
function DocCard({ doc, colColor, colBg, onDragStart, onDragEnd, onRemove, onReview, onViewCustomer, onViewCase, showReview }: {
  doc: Doc; colColor: string; colBg: string;
  onDragStart: () => void; onDragEnd: () => void;
  onRemove: () => void; onReview: () => void;
  onViewCustomer: (id: string) => void;
  onViewCase: (id: string) => void;
  showReview: boolean;
}) {
  const ext     = doc.fileName.split(".").pop()?.toUpperCase() ?? "FILE";
  const isImage = doc.contentType?.startsWith("image/");

  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} style={st.card}>
      {/* File name + type */}
      <div style={st.cardTop}>
        <span style={{ ...st.extBadge, background: colBg, color: colColor }}>
          {isImage ? "IMG" : ext}
        </span>
        <span style={st.cardName} title={doc.fileName}>{doc.fileName}</span>
      </div>

      {/* CRM labels — show if linked to a customer/case */}
      {doc.case && (
        <div style={st.crmRow}>
          <button style={st.crmCustomer} onClick={() => onViewCustomer(doc.case!.customer.id)}>
            👤 {doc.case.customer.fullName}
          </button>
          <button style={st.crmCase} onClick={() => onViewCase(doc.case!.id)}>
            📁 {doc.case.caseType}
          </button>
        </div>
      )}

      {/* Meta */}
      <div style={st.cardMeta}>
        {doc.size != null && <span>{formatSize(doc.size)}</span>}
        <span>•</span>
        <span>{timeAgo(new Date(doc.createdAt).getTime())}</span>
      </div>

      {/* Actions */}
      <div style={st.cardActions}>
        {showReview && (
          <button
            style={{ ...st.actionBtn, background: colColor, color: "white", border: "none" }}
            onClick={onReview}
          >
            {doc.status === "REVIEW" ? "Review" : "Extract & Review"}
          </button>
        )}
        <a href={doc.filePath} target="_blank" rel="noreferrer" style={st.viewLink}>View</a>
        <button style={st.removeBtn} onClick={onRemove}>Remove</button>
      </div>

      <div style={st.dragHint}>⠿ drag to move</div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function timeAgo(ts: number) {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const st: Record<string, React.CSSProperties> = {
  page:        { minHeight: "100vh", background: "#f1f5f9", fontFamily: '"DM Sans", system-ui, sans-serif', display: "flex", flexDirection: "column" },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 28px", background: "white", borderBottom: "1px solid rgba(15,23,42,0.08)" },
  logo:        { fontSize: 20, fontWeight: 800, color: "#0f172a" },
  tagline:     { margin: "2px 0 0", fontSize: 12, color: "#94a3b8" },
  navBtn:      { padding: "10px 14px", borderRadius: 10, background: "#f1f5f9", color: "#0f172a", border: "1px solid rgba(15,23,42,0.10)", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  uploadBtn:   { padding: "10px 18px", borderRadius: 10, background: "#0f172a", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", border: "none", textDecoration: "none", display: "inline-block" },
  ghostNavBtn: { padding: "10px 14px", borderRadius: 10, background: "white", color: "#475569", border: "1px solid rgba(15,23,42,0.12)", fontWeight: 600, fontSize: 13, textDecoration: "none" },
  statsBar:    { display: "flex", gap: 12, padding: "14px 28px", background: "white", borderBottom: "1px solid rgba(15,23,42,0.06)" },
  stat:        { display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderRadius: 12, border: "1px solid rgba(15,23,42,0.07)", background: "#fafafa", flex: 1 },
  statIcon:    { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, flexShrink: 0 },
  statNum:     { fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1 },
  statLabel:   { fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginTop: 2 },
  loading:     { textAlign: "center", padding: "60px", color: "#94a3b8" },
  board:       { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, padding: "20px 28px", flex: 1, alignItems: "start" },
  column:      { borderRadius: 14, border: "1px solid rgba(15,23,42,0.08)", padding: 12, minHeight: 400, transition: "outline 0.15s, background 0.15s" },
  colHeader:   { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  colIcon:     { width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, flexShrink: 0 },
  colTitle:    { fontSize: 13, fontWeight: 800, color: "#0f172a" },
  colDesc:     { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  colCount:    { fontSize: 12, fontWeight: 800, borderRadius: 20, padding: "2px 8px" },
  cards:       { display: "flex", flexDirection: "column", gap: 8 },
  emptyCol:    { textAlign: "center", padding: "28px 12px", color: "#cbd5e1", fontSize: 12, fontWeight: 600, border: "1.5px dashed #e2e8f0", borderRadius: 10 },
  card:        { background: "white", borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", padding: 12, cursor: "grab", display: "flex", flexDirection: "column", gap: 7, boxShadow: "0 1px 4px rgba(2,8,23,0.04)" },
  cardTop:     { display: "flex", alignItems: "center", gap: 8 },
  extBadge:    { fontSize: 10, fontWeight: 800, borderRadius: 6, padding: "2px 6px", flexShrink: 0 },
  cardName:    { fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  crmRow:      { display: "flex", gap: 4, flexWrap: "wrap" as const },
  crmCustomer: { fontSize: 11, fontWeight: 600, color: "#0369a1", background: "#e0f2fe", padding: "2px 7px", borderRadius: 6, cursor: "pointer", border: "none" },
  crmCase:     { fontSize: 11, fontWeight: 600, color: "#b45309", background: "#fef3c7", padding: "2px 7px", borderRadius: 6, cursor: "pointer", border: "none" },
  cardMeta:    { display: "flex", gap: 6, fontSize: 11, color: "#94a3b8" },
  cardActions: { display: "flex", gap: 6, flexWrap: "wrap" as const },
  actionBtn:   { padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer" },
  viewLink:    { padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#475569", border: "1px solid rgba(15,23,42,0.10)", textDecoration: "none" },
  removeBtn:   { padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700, background: "white", color: "#94a3b8", border: "1px solid rgba(15,23,42,0.10)", cursor: "pointer" },
  dragHint:    { fontSize: 10, color: "#cbd5e1", textAlign: "right", userSelect: "none" as const },
  emptyState:  { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center" },
  emptyTitle:  { fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 12 },
};