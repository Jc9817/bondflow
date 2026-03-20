"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ApprovedData = { amount?: number | null; currency?: string | null; date?: string | null; referenceNo?: string | null };
type Job = { id: string; fileName: string; filePath: string; status: string; createdAt: string; approved?: ApprovedData | null };
type CaseDetail = {
  id: string; caseType: string; caseStatus: string; createdAt: string; updatedAt: string;
  customer: { id: string; fullName: string; phone?: string; companyName?: string };
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

  const [c, setCase]           = useState<CaseDetail | null>(null);
  const [loading, setLoading]  = useState(true);
  const [toggling, setToggling]= useState(false);

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

  const confirmedJobs = c.jobs.filter((j) => j.status === "CONFIRMED");
  const totalAmount   = confirmedJobs.reduce((sum, j) => sum + (j.approved?.amount ?? 0), 0);

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <div style={s.title}>{c.caseType}</div>
          <div style={s.sub}>
            <span style={{
              ...s.badge,
              background: c.caseStatus === "OPEN" ? "#dcfce7" : "#f1f5f9",
              color:      c.caseStatus === "OPEN" ? "#15803d" : "#64748b",
            }}>
              {c.caseStatus}
            </span>
            <span style={s.subText}>Customer:</span>
            <button style={s.custLink} onClick={() => router.push(`/customers/${c.customer.id}`)}>
              {c.customer.fullName}
              {c.customer.companyName && ` · ${c.customer.companyName}`}
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={s.menuBtn}  onClick={() => router.push("/login")}>🏠</button>
          <button style={s.backBtn}  onClick={() => router.push("/cases")}>← Cases</button>
          <button style={s.backBtn}  onClick={() => router.push(`/customers/${c.customer.id}`)}>
            👤 {c.customer.fullName}
          </button>
          <button style={s.backBtn}  onClick={() => router.push("/dashboard")}>📋 Dashboard</button>
          <button
            style={{
              ...s.toggleBtn,
              background: c.caseStatus === "OPEN" ? "#fef2f2" : "#dcfce7",
              color:      c.caseStatus === "OPEN" ? "#dc2626"  : "#15803d",
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
          { label: "Total Documents",  value: c.jobs.length },
          { label: "Confirmed",        value: confirmedJobs.length },
          { label: "Total Amount",     value: `${totalAmount.toFixed(2)}` },
          { label: "Created",          value: new Date(c.createdAt).toLocaleDateString() },
        ].map((stat) => (
          <div key={stat.label} style={s.stat}>
            <div style={s.statNum}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Documents */}
      <div style={s.body}>
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>Linked Documents</div>
          <button style={s.uploadBtn} onClick={() => router.push("/dashboard")}>
            + Upload Document
          </button>
        </div>

        {c.jobs.length === 0 ? (
          <div style={s.empty}>
            No documents linked yet. Upload a document from the Dashboard, then link it to this case during Review.
          </div>
        ) : (
          <div style={s.jobList}>
            {c.jobs.map((job) => {
              const sc = STATUS_COLORS[job.status] ?? { bg: "#f1f5f9", color: "#64748b" };
              return (
                <div key={job.id} style={s.jobCard}>
                  <div style={s.jobTop}>
                    <span style={{ ...s.statusBadge, background: sc.bg, color: sc.color }}>
                      {job.status}
                    </span>
                    <span style={s.jobName}>{job.fileName}</span>
                    <span style={s.jobDate}>{new Date(job.createdAt).toLocaleDateString()}</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <a href={job.filePath} target="_blank" rel="noreferrer" style={s.viewLink}>View ↗</a>
                      {job.status === "REVIEW" && (
                        <button style={s.reviewLink}
                          onClick={() => router.push(`/review?fileId=${job.id}&filePath=${encodeURIComponent(job.filePath)}&fileName=${encodeURIComponent(job.fileName)}`)}>
                          Review
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Approved data */}
                  {job.approved && (
                    <div style={s.approvedRow}>
                      {[
                        { label: "Amount",    value: job.approved.amount },
                        { label: "Currency",  value: job.approved.currency },
                        { label: "Date",      value: job.approved.date },
                        { label: "Ref No",    value: job.approved.referenceNo },
                      ].filter(({ value }) => value != null).map(({ label, value }) => (
                        <div key={label} style={s.approvedField}>
                          <div style={s.approvedLabel}>{label}</div>
                          <div style={s.approvedValue}>{String(value)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
  menuBtn:       { padding: "10px 14px", borderRadius: 10, background: "#f8fafc", color: "#0f172a", border: "1px solid rgba(15,23,42,0.15)", fontWeight: 700, fontSize: 16, cursor: "pointer" },
  backBtn:       { padding: "10px 14px", borderRadius: 10, background: "white", color: "#475569", border: "1px solid rgba(15,23,42,0.12)", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  toggleBtn:     { padding: "10px 16px", borderRadius: 10, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" },
  statsBar:      { display: "flex", background: "white", borderBottom: "1px solid rgba(15,23,42,0.06)" },
  stat:          { flex: 1, padding: "14px 24px", borderRight: "1px solid rgba(15,23,42,0.06)" },
  statNum:       { fontSize: 22, fontWeight: 800, color: "#0f172a" },
  statLabel:     { fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginTop: 2 },
  body:          { padding: "24px 28px", maxWidth: 900, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 16 },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  sectionTitle:  { fontWeight: 800, fontSize: 16, color: "#0f172a" },
  uploadBtn:     { padding: "8px 16px", borderRadius: 9, background: "#0f172a", color: "white", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" },
  empty:         { textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: 14, background: "white", borderRadius: 14, border: "1px solid rgba(15,23,42,0.08)", lineHeight: 1.7 },
  jobList:       { display: "flex", flexDirection: "column", gap: 10 },
  jobCard:       { background: "white", borderRadius: 14, border: "1px solid rgba(15,23,42,0.08)", padding: 16, boxShadow: "0 1px 4px rgba(2,8,23,0.04)" },
  jobTop:        { display: "flex", alignItems: "center", gap: 10 },
  statusBadge:   { fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6, whiteSpace: "nowrap" as const },
  jobName:       { flex: 1, fontWeight: 700, color: "#0f172a", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  jobDate:       { fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" as const },
  viewLink:      { padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: "#f1f5f9", color: "#475569", border: "1px solid rgba(15,23,42,0.10)", textDecoration: "none" },
  reviewLink:    { padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: "#fef3c7", color: "#b45309", border: "none", cursor: "pointer" },
  approvedRow:   { display: "flex", gap: 24, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(15,23,42,0.06)" },
  approvedField: {},
  approvedLabel: { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  approvedValue: { fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2 },
};