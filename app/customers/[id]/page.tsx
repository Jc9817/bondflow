"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ApprovedData = { amount?: number | null; currency?: string | null; date?: string | null; referenceNo?: string | null };
type Job = { id: string; fileName: string; filePath: string; status: string; createdAt: string; approved?: ApprovedData | null };
type Case = { id: string; caseType: string; caseStatus: string; createdAt: string; jobs: Job[] };
type Customer = {
  id: string; fullName: string; companyRegistration?: string; contactPerson?: string;
  phone?: string; email?: string; idNumber?: string; address?: string; notes?: string;
  createdAt: string; updatedAt: string; cases: Case[]; jobs: Job[];
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  UPLOADED:   { bg: "#e0f2fe", color: "#0369a1" },
  EXTRACTING: { bg: "#ede9fe", color: "#7c3aed" },
  REVIEW:     { bg: "#fef3c7", color: "#b45309" },
  CONFIRMED:  { bg: "#dcfce7", color: "#15803d" },
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [customer, setCustomer]   = useState<Customer | null>(null);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [editForm, setEditForm]   = useState<Partial<Customer>>({});
  const [editError, setEditError] = useState("");

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((d) => { setCustomer(d.customer); setEditForm(d.customer ?? {}); })
      .finally(() => setLoading(false));
  }, [id]);

  async function saveEdit() {
    setEditError("");
    if (!editForm.fullName?.trim()) { setEditError("Full name is required."); return; }
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      setEditError("Invalid email format."); return;
    }
    setSaving(true);
    try {
      const res  = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || "Update failed."); return; }
      setCustomer((prev) => prev ? { ...prev, ...data.customer } : prev);
      setEditing(false);
    } finally { setSaving(false); }
  }

  if (loading) return <div style={s.loading}>Loading…</div>;
  if (!customer) return <div style={s.loading}>Customer not found.</div>;

  const allJobs       = [...customer.jobs, ...customer.cases.flatMap((c) => c.jobs)];
  const totalDocs     = allJobs.length;
  const confirmed     = allJobs.filter((j) => j.status === "CONFIRMED").length;
  const pendingReview = allJobs.filter((j) => j.status === "REVIEW").length;
  const openCases     = customer.cases.filter((c) => c.caseStatus === "OPEN").length;

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={s.avatar}>{customer.fullName[0].toUpperCase()}</div>
          <div>
            <div style={s.name}>{customer.fullName}</div>
            {customer.companyRegistration && <div style={s.subName}>🏢 {customer.companyRegistration}</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {/* ✅ Back to Menu */}
          <button style={s.menuBtn} onClick={() => router.push("/login")}>⬅ Menu</button>
          <button style={s.backBtn} onClick={() => router.push("/customers")}>← Customers</button>
          <button style={s.backBtn} onClick={() => router.push("/dashboard")}>📋 Dashboard</button>
          <button style={s.primaryBtn} onClick={() => { setEditing(true); setEditError(""); }}>
            ✏️ Edit
          </button>
        </div>
      </header>

      {/* Stats */}
      <div style={s.statsBar}>
        {[
          { label: "Total Docs",     value: totalDocs,     color: "#0369a1", bg: "#e0f2fe" },
          { label: "Confirmed",      value: confirmed,     color: "#15803d", bg: "#dcfce7" },
          { label: "Pending Review", value: pendingReview, color: "#b45309", bg: "#fef3c7" },
          { label: "Open Cases",     value: openCases,     color: "#7c3aed", bg: "#ede9fe" },
        ].map((stat) => (
          <div key={stat.label} style={s.stat}>
            <div style={{ fontSize: 26, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={s.body}>
        <div style={s.twoCol}>

          {/* LEFT: Profile */}
          <div style={s.card}>
            <div style={s.cardTitle}>Customer Profile</div>
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {editError && <div style={s.errorBox}>⚠️ {editError}</div>}
                {([
                  { key: "fullName",            label: "Full Name *" },
                  { key: "companyRegistration", label: "Company Reg No" },
                  { key: "contactPerson",       label: "Contact Person" },
                  { key: "phone",               label: "Phone" },
                  { key: "email",               label: "Email" },
                  { key: "idNumber",            label: "ID / Passport No" },
                  { key: "address",             label: "Address" },
                  { key: "notes",               label: "Notes" },
                ] as { key: keyof Customer; label: string }[]).map(({ key, label }) => (
                  <div key={key} style={{ display: "grid", gap: 4 }}>
                    <label style={s.fieldLabel}>{label}</label>
                    {key === "notes" ? (
                      <textarea style={{ ...s.fieldInput, height: 80, resize: "vertical" as const }}
                        value={(editForm[key] as string) ?? ""}
                        onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))} />
                    ) : (
                      <input style={s.fieldInput} value={(editForm[key] as string) ?? ""}
                        onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))} />
                    )}
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button style={s.primaryBtn} onClick={saveEdit} disabled={saving}>
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                  <button style={s.ghostBtn} onClick={() => { setEditing(false); setEditForm(customer); }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: "👤", label: "Full Name",      value: customer.fullName },
                  { icon: "🏢", label: "Company Reg",    value: customer.companyRegistration },
                  { icon: "👥", label: "Contact Person", value: customer.contactPerson },
                  { icon: "📞", label: "Phone",          value: customer.phone },
                  { icon: "✉️", label: "Email",          value: customer.email },
                  { icon: "🪪", label: "ID / Passport",  value: customer.idNumber },
                  { icon: "📍", label: "Address",        value: customer.address },
                  { icon: "📝", label: "Notes",          value: customer.notes },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={s.profileRow}>
                    <div style={s.profileLabel}>{icon} {label}</div>
                    <div style={s.profileValue}>{value || <span style={{ color: "#cbd5e1" }}>—</span>}</div>
                  </div>
                ))}
                <div style={s.divider} />
                <div style={s.profileRow}>
                  <div style={s.profileLabel}>📅 Created</div>
                  <div style={s.profileValue}>{new Date(customer.createdAt).toLocaleString()}</div>
                </div>
                <div style={s.profileRow}>
                  <div style={s.profileLabel}>🔄 Updated</div>
                  <div style={s.profileValue}>{new Date(customer.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Documents */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Direct jobs */}
            {customer.jobs.length > 0 && (
              <div style={s.card}>
                <div style={s.cardTitle}>Direct Documents</div>
                <JobList jobs={customer.jobs} router={router} />
              </div>
            )}

            {/* Cases */}
            <div style={s.card}>
              <div style={s.cardTitle}>Cases & Documents</div>
              {customer.cases.length === 0 ? (
                <div style={s.emptyText}>No cases yet. Link a document to this customer from the Review page.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {customer.cases.map((c) => (
                    <div key={c.id}>
                      <div style={s.caseHeader}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            ...s.caseBadge,
                            background: c.caseStatus === "OPEN" ? "#dcfce7" : "#f1f5f9",
                            color:      c.caseStatus === "OPEN" ? "#15803d" : "#64748b",
                          }}>{c.caseStatus}</span>
                          <span style={s.caseType}>{c.caseType}</span>
                        </div>
                        <button style={s.viewCaseBtn} onClick={() => router.push(`/cases/${c.id}`)}>
                          View Case →
                        </button>
                      </div>
                      {c.jobs.length > 0
                        ? <JobList jobs={c.jobs} router={router} />
                        : <div style={s.emptyText}>No documents in this case.</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JobList({ jobs, router }: { jobs: Job[]; router: ReturnType<typeof useRouter> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
      {jobs.map((j) => {
        const sc = STATUS_COLORS[j.status] ?? { bg: "#f1f5f9", color: "#64748b" };
        return (
          <div key={j.id} style={jl.row}>
            <span style={{ ...jl.badge, background: sc.bg, color: sc.color }}>{j.status}</span>
            <span style={jl.name} title={j.fileName}>{j.fileName}</span>
            {j.approved && (
              <span style={jl.amount}>{j.approved.currency} {j.approved.amount}</span>
            )}
            <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
              <a href={j.filePath} target="_blank" rel="noreferrer" style={jl.btn}>View</a>
              {j.status === "REVIEW" && (
                <button style={{ ...jl.btn, background: "#fef3c7", color: "#b45309", border: "none", cursor: "pointer" }}
                  onClick={() => router.push(`/review?fileId=${j.id}&filePath=${encodeURIComponent(j.filePath)}&fileName=${encodeURIComponent(j.fileName)}`)}>
                  Review
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:        { minHeight: "100vh", background: "#f1f5f9", fontFamily: '"DM Sans", system-ui, sans-serif' },
  loading:     { padding: 40, textAlign: "center", color: "#94a3b8" },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 28px", background: "white", borderBottom: "1px solid rgba(15,23,42,0.08)" },
  avatar:      { width: 48, height: 48, borderRadius: 14, background: "#e0f2fe", color: "#0369a1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20 },
  name:        { fontSize: 20, fontWeight: 800, color: "#0f172a" },
  subName:     { fontSize: 13, color: "#64748b", marginTop: 2 },
  menuBtn:     { padding: "10px 14px", borderRadius: 10, background: "#f8fafc", color: "#0f172a", border: "1px solid rgba(15,23,42,0.15)", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  backBtn:     { padding: "10px 14px", borderRadius: 10, background: "white", color: "#475569", border: "1px solid rgba(15,23,42,0.12)", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  primaryBtn:  { padding: "10px 18px", borderRadius: 10, background: "#0f172a", color: "white", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" },
  ghostBtn:    { padding: "10px 14px", borderRadius: 10, background: "white", color: "#475569", border: "1px solid rgba(15,23,42,0.12)", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  statsBar:    { display: "flex", background: "white", borderBottom: "1px solid rgba(15,23,42,0.06)" },
  stat:        { flex: 1, padding: "14px 24px", borderRight: "1px solid rgba(15,23,42,0.06)", textAlign: "center" as const },
  statLabel:   { fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginTop: 2 },
  body:        { padding: "24px 28px", maxWidth: 1100, margin: "0 auto", width: "100%" },
  twoCol:      { display: "grid", gridTemplateColumns: "360px 1fr", gap: 20, alignItems: "start" },
  card:        { background: "white", borderRadius: 14, border: "1px solid rgba(15,23,42,0.08)", padding: 20, boxShadow: "0 1px 4px rgba(2,8,23,0.04)" },
  cardTitle:   { fontWeight: 800, fontSize: 15, color: "#0f172a", marginBottom: 14 },
  profileRow:  { display: "flex", gap: 8 },
  profileLabel:{ fontSize: 12, fontWeight: 700, color: "#94a3b8", minWidth: 130 },
  profileValue:{ fontSize: 13, color: "#0f172a", fontWeight: 500 },
  divider:     { height: 1, background: "rgba(15,23,42,0.06)", margin: "4px 0" },
  fieldLabel:  { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  fieldInput:  { padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(15,23,42,0.15)", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" as const, fontFamily: "inherit" },
  errorBox:    { padding: "10px 14px", borderRadius: 9, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 13 },
  caseHeader:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid rgba(15,23,42,0.06)" },
  caseBadge:   { fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 },
  caseType:    { fontWeight: 700, fontSize: 14, color: "#0f172a" },
  viewCaseBtn: { fontSize: 12, fontWeight: 700, color: "#2563eb", background: "none", border: "none", cursor: "pointer" },
  emptyText:   { fontSize: 13, color: "#94a3b8", padding: "8px 0" },
};

const jl: Record<string, React.CSSProperties> = {
  row:    { display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid rgba(15,23,42,0.05)", fontSize: 13 },
  badge:  { fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 5, whiteSpace: "nowrap" as const },
  name:   { flex: 1, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  amount: { fontSize: 12, color: "#64748b", whiteSpace: "nowrap" as const },
  btn:    { padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#475569", border: "1px solid rgba(15,23,42,0.10)", textDecoration: "none", whiteSpace: "nowrap" as const },
};