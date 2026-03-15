"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ApprovedData = {
  amount?: number | null;
  currency?: string | null;
  date?: string | null;
  referenceNo?: string | null;
};
type Job = {
  id: string;
  fileName: string;
  filePath: string;
  status: string;
  createdAt: string;
  approved?: ApprovedData | null;
};
type CaseDetail = {
  id: string;
  caseType: string;
  caseStatus: string;
  createdAt: string;
  customer: { id: string; fullName: string; phone?: string };
  jobs: Job[];
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  UPLOADED:   { bg: "#e0f2fe", color: "#0369a1" },
  EXTRACTING: { bg: "#ede9fe", color: "#7c3aed" },
  REVIEW:     { bg: "#fef3c7", color: "#b45309" },
  CONFIRMED:  { bg: "#dcfce7", color: "#15803d" },
};

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [c, setCase]               = useState<CaseDetail | null>(null);
  const [loading, setLoading]      = useState(true);
  const [toggling, setToggling]    = useState(false);

  useEffect(() => {
    fetch(`/api/cases/${id}`)
      .then((r) => r.json())
      .then((d) => setCase(d.case))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleStatus() {
    if (!c) return;
    setToggling(true);
    const newStatus = c.caseStatus === "OPEN" ? "CLOSED" : "OPEN";
    const res  = await fetch(`/api/cases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseStatus: newStatus }),
    });
    const data = await res.json();
    setCase((prev) => prev ? { ...prev, caseStatus: data.case.caseStatus } : prev);
    setToggling(false);
  }

  if (loading) return <div style={s.loading}>Loading…</div>;
  if (!c)      return <div style={s.loading}>Case not found.</div>;

  const confirmedJobs  = c.jobs.filter((j) => j.status === "CONFIRMED");
  const totalAmount    = confirmedJobs.reduce((sum, j) => sum + (j.approved?.amount ?? 0), 0);

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <div style={s.title}>{c.caseType}</div>
          <div style={s.sub}>
            <span style={{
              ...s.badge,
              background: c.caseStatus === "OPEN" ? "#dcfce7" : "#f1f5f9",
              color: c.caseStatus === "OPEN" ? "#15803d" : "#64748b",
            }}>
              {c.caseStatus}
            </span>
            <span style={s.subText}>Customer:</span>
            <button style={s.custLink} onClick={() => router.push(`/customers/${c.customer.id}`)}>
              {c.customer.fullName}
            </button>
            {c.customer.phone && <span style={s.subText}>· {c.customer.phone}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={s.backBtn} onClick={() => router.push("/dashboard")}>← Dashboard</button>
          <button
            style={{
              ...s.toggleBtn,
              background: c.caseStatus === "OPEN" ? "#fef2f2" : "#dcfce7",
              color: c.caseStatus === "OPEN" ? "#dc2626" : "#15803d",
            }}
            onClick={toggleStatus}
            disabled={toggling}
          >
            {c.caseStatus === "OPEN" ? "Close Case" : "Reopen Case"}
          </button>
        </div>
      </header>

      {/* Stats */}
      <div style={s.statsBar}>
        {[
          { label: "Total Jobs",     value: c.jobs.length },
          { label: "Confirmed Jobs", value: confirmedJobs.length },
          { label: "Total Amount",   value: totalAmount.toFixed(2) },
        ].map((stat) => (
          <div key={stat.label} style={s.stat}>
            <div style={s.statNum}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Jobs */}
      <div style={s.body}>
        <div style={s.sectionTitle}>Linked Documents</div>
        {c.jobs.length === 0 ? (
          <div style={s.empty}>No documents linked to this case yet.</div>
        ) : (
          c.jobs.map((job) => {
            const sc = STATUS_COLORS[job.status] ?? { bg: "#f1f5f9", color: "#64748b" };
            return (
              <div key={job.id} style={s.jobCard}>
                <div style={s.jobTop}>
                  <span style={{ ...s.statusBadge, background: sc.bg, color: sc.color }}>
                    {job.status}
                  </span>
                  <span style={s.jobName}>{job.fileName}</span>
                  <a href={job.filePath} target="_blank" rel="noreferrer" style={s.viewLink}>
                    View ↗
                  </a>
                </div>

                {job.approved && (
                  <div style={s.approvedGrid}>
                    {[
                      { label: "Amount",       value: job.approved.amount },
                      { label: "Currency",     value: job.approved.currency },
                      { label: "Date",         value: job.approved.date },
                      { label: "Reference No", value: job.approved.referenceNo },
                    ].filter(({ value }) => value != null).map(({ label, value }) => (
                      <div key={label}>
                        <div style={s.approvedLabel}>{label}</div>
                        <div style={s.approvedValue}>{String(value)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:          { minHeight: "100vh", background: "#f1f5f9", fontFamily: '"DM Sans", system-ui, sans-serif' },
  loading:       { padding: 40, textAlign: "center", color: "#94a3b8" },
  header:        { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 28px", background: "white", borderBottom: "1px solid rgba(15,23,42,0.08)" },
  title:         { fontSize: 20, fontWeight: 800, color: "#0f172a" },
  sub:           { display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" as const },
  badge:         { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },
  subText:       { fontSize: 13, color: "#64748b" },
  custLink:      { fontSize: 13, fontWeight: 700, color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: 0 },
  backBtn:       { padding: "10px 14px", borderRadius: 10, background: "white", color: "#475569", border: "1px solid rgba(15,23,42,0.12)", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  toggleBtn:     { padding: "10px 16px", borderRadius: 10, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" },
  statsBar:      { display: "flex", background: "white", borderBottom: "1px solid rgba(15,23,42,0.06)" },
  stat:          { flex: 1, padding: "14px 24px", borderRight: "1px solid rgba(15,23,42,0.06)" },
  statNum:       { fontSize: 22, fontWeight: 800, color: "#0f172a" },
  statLabel:     { fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginTop: 2 },
  body:          { padding: "24px 28px", maxWidth: 900, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 12 },
  sectionTitle:  { fontWeight: 800, fontSize: 16, color: "#0f172a" },
  empty:         { color: "#94a3b8", fontSize: 14 },
  jobCard:       { background: "white", borderRadius: 14, border: "1px solid rgba(15,23,42,0.08)", padding: 16, boxShadow: "0 1px 4px rgba(2,8,23,0.04)" },
  jobTop:        { display: "flex", alignItems: "center", gap: 10 },
  statusBadge:   { fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6 },
  jobName:       { flex: 1, fontWeight: 700, color: "#0f172a", fontSize: 14 },
  viewLink:      { fontSize: 12, color: "#2563eb", textDecoration: "none", fontWeight: 600 },
  approvedGrid:  { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(15,23,42,0.06)" },
  approvedLabel: { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  approvedValue: { fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2 },
};