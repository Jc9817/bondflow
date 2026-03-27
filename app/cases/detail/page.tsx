"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

type ApprovedData = { amount?: number | null; currency?: string | null; date?: string | null; referenceNo?: string | null };
type Job = { id: string; fileName: string; filePath: string; status: string; createdAt: string; approved?: ApprovedData | null };
type Comment = { id: string; content: string; createdAt: string; author?: string | null };
type CaseDetail = {
  id: string; caseType: string; caseStatus: string; createdAt: string; updatedAt: string;
  customer: { id: string; fullName: string; phone?: string; companyName?: string };
  jobs: Job[];
  comments?: Comment[];
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  UPLOADED:   { bg: "#e0f2fe", color: "#0369a1" },
  EXTRACTING: { bg: "#ede9fe", color: "#7c3aed" },
  REVIEW:     { bg: "#fef3c7", color: "#b45309" },
  CONFIRMED:  { bg: "#dcfce7", color: "#15803d" },
};

export default function CaseDetailPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const id           = searchParams.get("id");

  const [c, setCase]            = useState<CaseDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState(false);

  // Comments state
  const [comments,       setComments]       = useState<Comment[]>([]);
  const [commentText,    setCommentText]     = useState("");
  const [savingComment,  setSavingComment]   = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const commentEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/cases/${id}`)
      .then((r) => r.json())
      .then((d) => { setCase(d.case); })
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch comments separately — always runs once id is known
  useEffect(() => {
    if (!id) return;
    fetchComments(id);
  }, [id]);

  async function fetchComments(caseId: string) {
    setLoadingComments(true);
    try {
      const res  = await fetch(`/api/cases/${caseId}/comments`);
      const data = await res.json();
      if (res.ok) setComments(data.comments ?? []);
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally { setLoadingComments(false); }
  }

  async function addComment() {
    if (!commentText.trim() || !id) return;
    setSavingComment(true);
    try {
      const res  = await fetch(`/api/cases/${id}/comments`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ content: commentText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to save comment. Did you run the Prisma migration?");
        return;
      }
      setComments((prev) => [...prev, data.comment]);
      setCommentText("");
      setTimeout(() => commentEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err: any) {
      alert(err?.message || "Network error saving comment");
    } finally { setSavingComment(false); }
  }

  async function toggleStatus() {
    if (!c) return;
    setToggling(true);
    const newStatus = c.caseStatus === "OPEN" ? "CLOSED" : "OPEN";
    const res  = await fetch(`/api/cases/${c.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ caseStatus: newStatus }),
    });
    const data = await res.json();
    setCase((prev) => prev ? { ...prev, caseStatus: data.case.caseStatus } : prev);
    setToggling(false);
  }

  if (!id)     return <div style={s.loading}>No case ID.</div>;
  if (loading) return <div style={s.loading}>Loading…</div>;
  if (!c)      return <div style={s.loading}>Case not found.</div>;

  const confirmedJobs = c.jobs.filter((j) => j.status === "CONFIRMED");
  const totalAmount   = confirmedJobs.reduce((sum, j) => sum + (j.approved?.amount ?? 0), 0);

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.main}>

        {/* Top bar — buttons: Customer → Cases → Close/Reopen */}
        <div style={s.topbar}>
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

          {/* ✅ Reordered: Customer → Cases → Close Case */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              style={s.ghostBtn}
              onClick={() => router.push(`/customers/${c.customer.id}`)}
            >
              👤 {c.customer.fullName}
            </button>
            <button style={s.ghostBtn} onClick={() => router.push("/cases")}>
              ← Cases
            </button>
            <button
              style={{
                ...s.toggleBtn,
                background: c.caseStatus === "OPEN" ? "#fef2f2" : "#dcfce7",
                color:      c.caseStatus === "OPEN" ? "#dc2626"  : "#15803d",
                border:     c.caseStatus === "OPEN" ? "1px solid #fecaca" : "1px solid #bbf7d0",
              }}
              onClick={toggleStatus}
              disabled={toggling}
            >
              {c.caseStatus === "OPEN" ? "Close Case" : "Reopen Case"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={s.statsBar}>
          {[
            { label: "Total Documents", value: c.jobs.length },
            { label: "Confirmed",       value: confirmedJobs.length },
            { label: "Total Amount",    value: totalAmount > 0 ? totalAmount.toFixed(2) : "—" },
            { label: "Comments",        value: comments.length },
            { label: "Created",         value: new Date(c.createdAt).toLocaleDateString() },
          ].map((stat) => (
            <div key={stat.label} style={s.stat}>
              <div style={s.statNum}>{stat.value}</div>
              <div style={s.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={s.body}>
          <div style={s.twoCol}>

            {/* LEFT: Linked Documents */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={s.card}>
                <div style={s.cardTitleRow}>
                  <div style={s.cardTitle}>Linked Documents</div>
                  <button style={s.uploadBtn} onClick={() => router.push("/processing")}>
                    + Upload Document
                  </button>
                </div>

                {c.jobs.length === 0 ? (
                  <div style={s.empty}>
                    No documents linked yet.<br />
                    Upload from Processing → Extract & Review → link to this case.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {c.jobs.map((job) => {
                      const sc = STATUS_COLORS[job.status] ?? { bg: "#f1f5f9", color: "#64748b" };
                      return (
                        <div key={job.id} style={s.jobCard}>
                          <div style={s.jobTop}>
                            <span style={{ ...s.statusBadge, background: sc.bg, color: sc.color }}>
                              {job.status}
                            </span>
                            <span style={s.jobName} title={job.fileName}>{job.fileName}</span>
                            <span style={s.jobDate}>{new Date(job.createdAt).toLocaleDateString()}</span>
                            <div style={{ display: "flex", gap: 8 }}>
                              <a href={job.filePath} target="_blank" rel="noreferrer" style={s.viewLink}>View ↗</a>
                              {job.status === "REVIEW" && (
                                <button
                                  style={s.reviewLink}
                                  onClick={() => router.push(
                                    `/review?fileId=${job.id}&filePath=${encodeURIComponent(job.filePath)}&fileName=${encodeURIComponent(job.fileName)}`
                                  )}
                                >
                                  Review
                                </button>
                              )}
                            </div>
                          </div>
                          {job.approved && (
                            <div style={s.approvedRow}>
                              {[
                                { label: "Amount",   value: job.approved.amount },
                                { label: "Currency", value: job.approved.currency },
                                { label: "Date",     value: job.approved.date },
                                { label: "Ref No",   value: job.approved.referenceNo },
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
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Comments */}
            <div style={s.card}>
              <div style={s.cardTitle}>💬 Case Comments</div>
              <div style={s.commentHint}>
                Add notes, updates, or internal messages about this case.
              </div>

              {/* Comments list */}
              <div style={s.commentList}>
                {loadingComments ? (
                  <div style={s.commentEmpty}>Loading comments…</div>
                ) : comments.length === 0 ? (
                  <div style={s.commentEmpty}>No comments yet. Add the first one below.</div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} style={s.commentBubble}>
                      <div style={s.commentMeta}>
                        <span style={s.commentAuthor}>
                          {comment.author ?? "Team"}
                        </span>
                        <span style={s.commentDate}>
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div style={s.commentContent}>{comment.content}</div>
                    </div>
                  ))
                )}
                <div ref={commentEndRef} />
              </div>

              {/* Add comment input */}
              <div style={s.commentInputRow}>
                <textarea
                  style={s.commentTextarea}
                  placeholder="Write a comment or note about this case…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addComment();
                  }}
                  rows={3}
                />
                <button
                  style={{
                    ...s.commentSendBtn,
                    opacity: !commentText.trim() || savingComment ? 0.5 : 1,
                  }}
                  onClick={addComment}
                  disabled={!commentText.trim() || savingComment}
                >
                  {savingComment ? "Saving…" : "Add Comment"}
                </button>
                <div style={s.commentShortcut}>Tip: ⌘+Enter to submit</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:           { minHeight: "100vh", fontFamily: '"DM Sans", system-ui, sans-serif', background: "#f1f5f9", display: "flex", flexDirection: "column" },
  main:           { flex: 1, display: "flex", flexDirection: "column", overflow: "auto" },
  loading:        { padding: 40, textAlign: "center", color: "#94a3b8" },
  topbar:         { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 28px", background: "white", borderBottom: "1px solid rgba(15,23,42,0.08)", flexWrap: "wrap" as const, gap: 12 },
  title:          { fontSize: 20, fontWeight: 800, color: "#0f172a" },
  sub:            { display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" as const },
  badge:          { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },
  subText:        { fontSize: 13, color: "#64748b" },
  custLink:       { fontSize: 13, fontWeight: 700, color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: 0 },
  ghostBtn:       { padding: "10px 14px", borderRadius: 10, background: "white", color: "#475569", border: "1px solid rgba(15,23,42,0.12)", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  toggleBtn:      { padding: "10px 16px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" },
  statsBar:       { display: "flex", background: "white", borderBottom: "1px solid rgba(15,23,42,0.06)" },
  stat:           { flex: 1, padding: "14px 24px", borderRight: "1px solid rgba(15,23,42,0.06)" },
  statNum:        { fontSize: 22, fontWeight: 800, color: "#0f172a" },
  statLabel:      { fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginTop: 2 },
  body:           { padding: "24px 28px" },
  twoCol:         { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" },
  card:           { background: "white", borderRadius: 14, border: "1px solid rgba(15,23,42,0.08)", padding: 20, boxShadow: "0 1px 4px rgba(2,8,23,0.04)", display: "flex", flexDirection: "column", gap: 14 },
  cardTitleRow:   { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardTitle:      { fontWeight: 800, fontSize: 15, color: "#0f172a" },
  uploadBtn:      { padding: "7px 14px", borderRadius: 9, background: "#0f172a", color: "white", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer" },
  empty:          { textAlign: "center", padding: "32px 16px", color: "#94a3b8", fontSize: 13, background: "#f8fafc", borderRadius: 10, border: "1px dashed rgba(15,23,42,0.12)", lineHeight: 1.8 },
  jobCard:        { background: "#f8fafc", borderRadius: 10, border: "1px solid rgba(15,23,42,0.07)", padding: 14 },
  jobTop:         { display: "flex", alignItems: "center", gap: 10 },
  statusBadge:    { fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6, whiteSpace: "nowrap" as const },
  jobName:        { flex: 1, fontWeight: 700, color: "#0f172a", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  jobDate:        { fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" as const },
  viewLink:       { padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: "white", color: "#475569", border: "1px solid rgba(15,23,42,0.10)", textDecoration: "none" },
  reviewLink:     { padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: "#fef3c7", color: "#b45309", border: "none", cursor: "pointer" },
  approvedRow:    { display: "flex", gap: 20, marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(15,23,42,0.06)", flexWrap: "wrap" as const },
  approvedLabel:  { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  approvedValue:  { fontSize: 13, fontWeight: 700, color: "#0f172a", marginTop: 2 },

  // Comments
  commentHint:    { fontSize: 12, color: "#94a3b8", marginTop: -8 },
  commentList:    { display: "flex", flexDirection: "column", gap: 10, maxHeight: 360, overflowY: "auto" as const, paddingRight: 4 },
  commentEmpty:   { fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "24px 0" },
  commentBubble:  { background: "#f8fafc", borderRadius: 10, border: "1px solid rgba(15,23,42,0.07)", padding: "12px 14px" },
  commentMeta:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  commentAuthor:  { fontSize: 12, fontWeight: 700, color: "#0369a1" },
  commentDate:    { fontSize: 11, color: "#94a3b8" },
  commentContent: { fontSize: 13, color: "#0f172a", lineHeight: 1.6, whiteSpace: "pre-wrap" as const },
  commentInputRow:{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid rgba(15,23,42,0.07)", paddingTop: 14 },
  commentTextarea:{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.15)", fontSize: 13, outline: "none", resize: "vertical" as const, fontFamily: "inherit", width: "100%", boxSizing: "border-box" as const },
  commentSendBtn: { padding: "10px 18px", borderRadius: 10, background: "#0f172a", color: "white", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" },
  commentShortcut:{ fontSize: 11, color: "#cbd5e1", textAlign: "right" as const },
};