"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";

type Case = {
  id: string; caseType: string; caseStatus: string; createdAt: string;
  customer: { id: string; fullName: string; companyName?: string };
  jobs: { id: string; fileName: string; status: string }[];
};
const CASE_TYPES = ["Bond Application", "Insurance", "Invoice", "Loan", "Other"];

export default function CasesPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const prefilledCustomerId = searchParams.get("customerId");

  const [cases, setCases]       = useState<Case[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(!!prefilledCustomerId);
  const [saving, setSaving]     = useState(false);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");
  const [custSearch,   setCustSearch]   = useState("");
  const [custResults,  setCustResults]  = useState<{ id: string; fullName: string; companyName?: string }[]>([]);
  const [selectedCust, setSelectedCust] = useState<{ id: string; fullName: string } | null>(null);
  const [caseType,     setCaseType]     = useState(CASE_TYPES[0]);

  useEffect(() => {
    if (prefilledCustomerId) {
      fetch(`/api/customers/${prefilledCustomerId}`).then((r) => r.json()).then((d) => { if (d.customer) setSelectedCust({ id: d.customer.id, fullName: d.customer.fullName }); });
    }
  }, [prefilledCustomerId]);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const url  = prefilledCustomerId ? `/api/cases?customerId=${prefilledCustomerId}` : `/api/cases`;
      const res  = await fetch(url); const data = await res.json(); setCases(data.cases ?? []);
    } finally { setLoading(false); }
  }, [prefilledCustomerId]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  useEffect(() => {
    if (!custSearch.trim()) { setCustResults([]); return; }
    const t = setTimeout(async () => { const res = await fetch(`/api/customers?search=${encodeURIComponent(custSearch)}`); const data = await res.json(); setCustResults(data.customers ?? []); }, 300);
    return () => clearTimeout(t);
  }, [custSearch]);

  async function createCase() {
    if (!selectedCust) { alert("Please select a customer"); return; }
    setSaving(true);
    try {
      const res  = await fetch("/api/cases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId: selectedCust.id, caseType }) });
      const data = await res.json();
      if (!res.ok) { alert(data.error); return; }
      setShowForm(false); setCustSearch(""); setSelectedCust(null); setCaseType(CASE_TYPES[0]);
      fetchCases();
    } finally { setSaving(false); }
  }

  const filtered = cases.filter((c) => filterStatus === "ALL" || c.caseStatus === filterStatus);

  return (
    <div style={s.shell}>
      <Sidebar />
      <div style={s.main}>
        <div style={s.topbar}>
          <div><div style={s.pageTitle}>Cases</div><div style={s.pageSub}>Manage and track all cases</div></div>
          <button style={s.primaryBtn} onClick={() => setShowForm(true)}>+ New Case</button>
        </div>

        <div style={s.body}>
          {showForm && (
            <div style={s.formCard}>
              <div style={s.formTitle}>New Case</div>
              <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
                <label style={s.fieldLabel}>Customer *</label>
                {selectedCust ? (
                  <div style={s.selBox}><span style={{ flex: 1, fontWeight: 700 }}>{selectedCust.fullName}</span><button style={s.clearBtn} onClick={() => setSelectedCust(null)}>Change</button></div>
                ) : (
                  <>
                    <input style={s.fieldInput} placeholder="Search customer…" value={custSearch} onChange={(e) => setCustSearch(e.target.value)} />
                    {custResults.length > 0 && (
                      <div style={s.dropList}>
                        {custResults.map((c) => (
                          <div key={c.id} style={s.dropItem} onClick={() => { setSelectedCust(c); setCustSearch(""); setCustResults([]); }}>
                            <strong>{c.fullName}</strong>{c.companyName && <span style={{ color: "#64748b", marginLeft: 8 }}>{c.companyName}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
                <label style={s.fieldLabel}>Case Type *</label>
                <select style={s.fieldInput} value={caseType} onChange={(e) => setCaseType(e.target.value)}>
                  {CASE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={s.primaryBtn} onClick={createCase} disabled={saving}>{saving ? "Saving…" : "Create Case"}</button>
                <button style={s.ghostBtn}   onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div style={s.filterRow}>
            {(["ALL", "OPEN", "CLOSED"] as const).map((f) => (
              <button key={f} style={{ ...s.filterBtn, ...(filterStatus === f ? s.filterBtnActive : {}) }} onClick={() => setFilterStatus(f)}>
                {f}{f !== "ALL" && <span style={s.filterCount}>{cases.filter((c) => c.caseStatus === f).length}</span>}
              </button>
            ))}
            <span style={s.totalCount}>{filtered.length} case{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          {loading ? <div style={s.empty}>Loading…</div> : filtered.length === 0 ? (
            <div style={s.empty}>No cases found.</div>
          ) : (
            <div style={s.list}>
              {filtered.map((c) => (
                <div key={c.id} style={s.caseCard}>
                  <div style={s.caseLeft}>
                    <span style={{ ...s.statusBadge, background: c.caseStatus === "OPEN" ? "#dcfce7" : "#f1f5f9", color: c.caseStatus === "OPEN" ? "#15803d" : "#64748b" }}>{c.caseStatus}</span>
                    <div>
                      <div style={s.caseType}>{c.caseType}</div>
                      <button style={s.custLink} onClick={() => router.push(`/customers/${c.customer.id}`)}>👤 {c.customer.fullName}{c.customer.companyName && ` · ${c.customer.companyName}`}</button>
                    </div>
                  </div>
                  <div style={s.caseRight}>
                    <div style={s.docCount}><span style={s.docNum}>{c.jobs.length}</span><span style={s.docLabel}>doc{c.jobs.length !== 1 ? "s" : ""}</span></div>
                    <div style={s.dateText}>{new Date(c.createdAt).toLocaleDateString()}</div>
                    <button style={s.viewBtn} onClick={() => router.push(`/cases/detail?id=${c.id}`)}>View →</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  shell:          { display: "flex", minHeight: "100vh", fontFamily: '"DM Sans", system-ui, sans-serif', background: "#f1f5f9" },
  main:           { flex: 1, display: "flex", flexDirection: "column", overflow: "auto" },
  topbar:         { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px", background: "white", borderBottom: "1px solid rgba(15,23,42,0.08)" },
  pageTitle:      { fontSize: 20, fontWeight: 800, color: "#0f172a" },
  pageSub:        { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  primaryBtn:     { padding: "10px 18px", borderRadius: 10, background: "#0f172a", color: "white", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" },
  ghostBtn:       { padding: "10px 14px", borderRadius: 10, background: "white", color: "#475569", border: "1px solid rgba(15,23,42,0.12)", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  body:           { padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 },
  formCard:       { background: "white", borderRadius: 16, border: "1px solid rgba(15,23,42,0.10)", padding: 24, boxShadow: "0 4px 12px rgba(2,8,23,0.05)" },
  formTitle:      { fontWeight: 800, fontSize: 16, color: "#0f172a", marginBottom: 16 },
  fieldLabel:     { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  fieldInput:     { padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(15,23,42,0.15)", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" as const, fontFamily: "inherit" },
  selBox:         { background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 9, padding: "10px 14px", display: "flex", alignItems: "center" },
  clearBtn:       { fontSize: 12, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontWeight: 600 },
  dropList:       { border: "1px solid rgba(15,23,42,0.10)", borderRadius: 10, overflow: "hidden" },
  dropItem:       { padding: "10px 14px", fontSize: 14, cursor: "pointer", borderBottom: "1px solid rgba(15,23,42,0.05)", background: "white" },
  filterRow:      { display: "flex", alignItems: "center", gap: 8 },
  filterBtn:      { padding: "8px 16px", borderRadius: 20, background: "white", color: "#64748b", border: "1px solid rgba(15,23,42,0.12)", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  filterBtnActive:{ background: "#0f172a", color: "white", border: "1px solid #0f172a" },
  filterCount:    { marginLeft: 6, fontSize: 11 },
  totalCount:     { marginLeft: "auto", fontSize: 13, color: "#94a3b8" },
  empty:          { textAlign: "center", padding: "48px", color: "#94a3b8", fontSize: 14, background: "white", borderRadius: 14, border: "1px solid rgba(15,23,42,0.08)" },
  list:           { display: "flex", flexDirection: "column", gap: 8 },
  caseCard:       { background: "white", borderRadius: 14, border: "1px solid rgba(15,23,42,0.08)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  caseLeft:       { display: "flex", alignItems: "center", gap: 12 },
  statusBadge:    { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" as const },
  caseType:       { fontWeight: 700, fontSize: 15, color: "#0f172a" },
  custLink:       { fontSize: 12, color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 3, display: "block", textAlign: "left" as const },
  caseRight:      { display: "flex", alignItems: "center", gap: 16 },
  docCount:       { textAlign: "center" as const },
  docNum:         { display: "block", fontWeight: 800, fontSize: 18, color: "#0f172a", lineHeight: 1 },
  docLabel:       { display: "block", fontSize: 11, color: "#94a3b8", marginTop: 2 },
  dateText:       { fontSize: 12, color: "#94a3b8" },
  viewBtn:        { padding: "8px 16px", borderRadius: 9, background: "#0f172a", color: "white", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" },
};