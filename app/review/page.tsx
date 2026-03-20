"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ExtractedData = {
  amount: number | null; currency: string | null;
  date: string | null; reference_no: string | null;
};
type Customer = {
  id: string; fullName: string; phone?: string;
  companyName?: string; companyRegistration?: string;
};
type CaseItem  = { id: string; caseType: string; caseStatus: string };
type Status    = "idle" | "loading" | "done" | "error";

const CASE_TYPES = ["Bond Application", "Insurance", "Invoice", "Loan", "Other"];

export default function ReviewPage() {
  const router = useRouter();
  const params = useSearchParams();
  const fileId   = params.get("fileId");
  const filePath = params.get("filePath");
  const fileName = params.get("fileName");

  const [file, setFile]             = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(filePath ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extraction state
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError]   = useState<string | null>(null);
  const [fields, setFields] = useState<ExtractedData>({
    amount: null, currency: null, date: null, reference_no: null,
  });

  // CRM linking state
  const [custSearch,    setCustSearch]    = useState("");
  const [custResults,   setCustResults]   = useState<Customer[]>([]);
  const [selectedCust,  setSelectedCust]  = useState<Customer | null>(null);
  const [cases,         setCases]         = useState<CaseItem[]>([]);
  const [selectedCase,  setSelectedCase]  = useState<CaseItem | null>(null);
  const [showNewCust,   setShowNewCust]   = useState(false);
  const [showNewCase,   setShowNewCase]   = useState(false);
  const [newCustName,   setNewCustName]   = useState("");
  const [newCustPhone,  setNewCustPhone]  = useState("");
  const [newCustCompany,setNewCustCompany]= useState("");
  const [newCaseType,   setNewCaseType]   = useState(CASE_TYPES[0]);
  const [confirming,    setConfirming]    = useState(false);

  // Debounced customer search
  useEffect(() => {
    if (!custSearch.trim()) { setCustResults([]); return; }
    const t = setTimeout(async () => {
      const res  = await fetch(`/api/customers?search=${encodeURIComponent(custSearch)}`);
      const data = await res.json();
      setCustResults(data.customers ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [custSearch]);

  // Load open cases when customer is selected
  useEffect(() => {
    if (!selectedCust) { setCases([]); setSelectedCase(null); return; }
    fetch(`/api/cases?customerId=${selectedCust.id}`)
      .then((r) => r.json())
      .then((d) => setCases((d.cases ?? []).filter((c: CaseItem) => c.caseStatus === "OPEN")));
  }, [selectedCust]);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (previewUrl && !filePath) URL.revokeObjectURL(previewUrl);
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
    setStatus("idle");
    setFields({ amount: null, currency: null, date: null, reference_no: null });
  }

  async function onExtract() {
    if (!file && !filePath) return;
    setStatus("loading"); setError(null);
    try {
      const body = new FormData();
      if (file) {
        body.append("file", file);
      } else {
        const blob = await fetch(filePath!).then((r) => r.blob());
        body.append("file", new File([blob], fileName ?? "document", { type: blob.type }));
      }
      const res  = await fetch("/api/extract", { method: "POST", body });
      const json = await res.json();
      if (!json.ok) { setError(json.error || "Extraction failed"); setStatus("error"); return; }
      setFields(json.data);
      setStatus("done");
    } catch (err: any) {
      setError(err?.message || "Network error");
      setStatus("error");
    }
  }

  async function createCustomer() {
    if (!newCustName.trim()) { alert("Name is required"); return; }
    const res  = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName:    newCustName,
        phone:       newCustPhone,
        companyName: newCustCompany,
      }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    setSelectedCust(data.customer);
    setShowNewCust(false);
    setNewCustName(""); setNewCustPhone(""); setNewCustCompany("");
  }

  async function createCase() {
    if (!selectedCust) return;
    const res  = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: selectedCust.id, caseType: newCaseType }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    setSelectedCase(data.case);
    setShowNewCase(false);
  }

  // ✅ CONFIRM: saves extracted data + links customerId + caseId to the job
  async function onConfirm() {
    if (!selectedCust) {
      if (!window.confirm("No customer selected. Confirm without linking to a customer?")) return;
    }
    setConfirming(true);
    try {
      if (fileId) {
        const res = await fetch(`/api/uploads/${fileId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status:     "CONFIRMED",
            customerId: selectedCust?.id  ?? null,
            caseId:     selectedCase?.id  ?? null,
            approved: {
              amount:      fields.amount,
              currency:    fields.currency,
              date:        fields.date,
              referenceNo: fields.reference_no,
            },
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || "Failed to confirm");
          return;
        }
      }
      alert(selectedCust
        ? `✅ Confirmed and linked to ${selectedCust.fullName}!`
        : "✅ Confirmed without customer link."
      );
      router.push("/dashboard");
    } catch (err: any) {
      alert(err?.message || "Confirm failed");
    } finally {
      setConfirming(false);
    }
  }

  const isPdf  = file?.type === "application/pdf" || (filePath ?? "").endsWith(".pdf");
  const hasDoc = file || filePath;

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div>
          <div style={s.logo}>🔍 Review Document</div>
          <p style={s.tagline}>Extract fields · Link to customer · Confirm</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={s.menuBtn} onClick={() => router.push("/login")}>🏠</button>
          <a href="/dashboard" style={s.backBtn}>← Dashboard</a>
        </div>
      </header>

      {/* File picker bar (only when no fileId from dashboard) */}
      {!fileId && (
        <div style={s.uploadBar}>
          <input ref={inputRef} type="file" accept=".pdf,image/*" onChange={onPickFile} style={{ display: "none" }} />
          <button style={s.chooseBtn} onClick={() => inputRef.current?.click()}>
            {file ? "Change file" : "Choose file"}
          </button>
          {file && <span style={s.fileSpan}>{file.name}</span>}
          {hasDoc && (
            <button
              style={{ ...s.blueBtn, opacity: status === "loading" ? 0.6 : 1 }}
              onClick={onExtract}
              disabled={status === "loading"}
            >
              {status === "loading" ? "Extracting…" : "Extract with AI"}
            </button>
          )}
        </div>
      )}

      {hasDoc ? (
        <div style={s.columns}>

          {/* ── LEFT: Document Preview ── */}
          <div style={s.card}>
            <div style={s.cardTitle}>Document Preview</div>
            {isPdf
              ? <iframe src={previewUrl!} style={s.preview} title="PDF" />
              : <img src={previewUrl!} alt="preview" style={{ ...s.preview, objectFit: "contain" }} />
            }
            {fileId && (
              <button
                style={{ ...s.blueBtn, opacity: status === "loading" ? 0.6 : 1 }}
                onClick={onExtract}
                disabled={status === "loading"}
              >
                {status === "loading" ? "Extracting…" : "Extract with AI"}
              </button>
            )}
          </div>

          {/* ── RIGHT: Fields + CRM ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Extracted Fields */}
            <div style={s.card}>
              <div style={s.cardTitle}>Extracted Fields</div>
              {status === "loading" && (
                <div style={s.row}><div style={s.spinner} /><span style={{ marginLeft: 10, color: "#64748b" }}>Analysing…</span></div>
              )}
              {status === "error" && <div style={s.errorBox}>⚠️ {error}</div>}
              {status === "idle"  && <div style={s.hintBox}>Click <strong>Extract with AI</strong> to analyse.</div>}
              {(status === "done" || status === "idle") && (
                <div style={s.form}>
                  {(["amount", "currency", "date", "reference_no"] as const).map((key) => (
                    <div key={key} style={{ display: "grid", gap: 4 }}>
                      <label style={s.fLabel}>{key.replace("_", " ").toUpperCase()}</label>
                      <input
                        type={key === "amount" ? "number" : "text"}
                        value={fields[key] !== null ? String(fields[key]) : ""}
                        onChange={(e) => setFields((p) => ({
                          ...p,
                          [key]: e.target.value === "" ? null
                            : key === "amount" ? Number(e.target.value)
                            : e.target.value,
                        }))}
                        style={{ ...s.fInput, background: fields[key] ? "#f0fdf4" : "white" }}
                        placeholder={
                          key === "amount"       ? "e.g. 1250.00"  :
                          key === "currency"     ? "e.g. MYR"      :
                          key === "date"         ? "YYYY-MM-DD"    :
                          "e.g. INV-001"
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ✅ Link Customer — core business step */}
            <div style={s.card}>
              <div style={s.cardTitle}>🔗 Link to Customer</div>
              <p style={s.hintSmall}>
                Link this document to a customer so it appears in their profile.
              </p>

              {selectedCust ? (
                <div style={s.selBox}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedCust.fullName}</div>
                    {selectedCust.companyName && <div style={{ fontSize: 12, color: "#64748b" }}>🏢 {selectedCust.companyName}</div>}
                    {selectedCust.phone       && <div style={{ fontSize: 12, color: "#64748b" }}>📞 {selectedCust.phone}</div>}
                  </div>
                  <button style={s.clearBtn} onClick={() => { setSelectedCust(null); setSelectedCase(null); }}>
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <input
                    style={s.searchInput}
                    placeholder="Search by name, company, phone…"
                    value={custSearch}
                    onChange={(e) => setCustSearch(e.target.value)}
                  />
                  {custResults.length > 0 && (
                    <div style={s.dropList}>
                      {custResults.map((c) => (
                        <div
                          key={c.id}
                          style={s.dropItem}
                          onClick={() => { setSelectedCust(c); setCustSearch(""); setCustResults([]); }}
                        >
                          <strong>{c.fullName}</strong>
                          {c.companyName && <span style={{ color: "#64748b", marginLeft: 8 }}>{c.companyName}</span>}
                          {c.phone       && <span style={{ color: "#94a3b8", marginLeft: 8, fontSize: 12 }}>{c.phone}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <button style={s.ghostBtn} onClick={() => setShowNewCust((p) => !p)}>
                    + Create new customer
                  </button>
                  {showNewCust && (
                    <div style={s.inlineForm}>
                      <input style={s.fInput} placeholder="Full Name *"    value={newCustName}    onChange={(e) => setNewCustName(e.target.value)} />
                      <input style={s.fInput} placeholder="Company Name"   value={newCustCompany} onChange={(e) => setNewCustCompany(e.target.value)} />
                      <input style={s.fInput} placeholder="Phone"          value={newCustPhone}   onChange={(e) => setNewCustPhone(e.target.value)} />
                      <button style={s.darkBtn} onClick={createCustomer}>Save Customer</button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ✅ Link Case — optional grouping under customer */}
            {selectedCust && (
              <div style={s.card}>
                <div style={s.cardTitle}>📁 Link to Case <span style={{ fontSize: 12, fontWeight: 400, color: "#94a3b8" }}>(optional)</span></div>
                <p style={s.hintSmall}>Group this document under a case/transaction.</p>

                {selectedCase ? (
                  <div style={s.selBox}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedCase.caseType}</div>
                      <div style={{ fontSize: 12, color: "#15803d" }}>● OPEN</div>
                    </div>
                    <button style={s.clearBtn} onClick={() => setSelectedCase(null)}>Change</button>
                  </div>
                ) : (
                  <>
                    {cases.length > 0 ? (
                      <div style={s.dropList}>
                        {cases.map((c) => (
                          <div key={c.id} style={s.dropItem} onClick={() => setSelectedCase(c)}>
                            <strong>{c.caseType}</strong>
                            <span style={{ color: "#15803d", marginLeft: 8, fontSize: 11 }}>OPEN</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={s.hintBox}>No open cases for this customer.</div>
                    )}
                    <button style={s.ghostBtn} onClick={() => setShowNewCase((p) => !p)}>
                      + Create new case
                    </button>
                    {showNewCase && (
                      <div style={s.inlineForm}>
                        <select style={s.fInput} value={newCaseType} onChange={(e) => setNewCaseType(e.target.value)}>
                          {CASE_TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                        <button style={s.darkBtn} onClick={createCase}>Save Case</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ✅ Confirm button — only show after extraction */}
            {status === "done" && (
              <button
                style={{ ...s.confirmBtn, opacity: confirming ? 0.6 : 1 }}
                onClick={onConfirm}
                disabled={confirming}
              >
                {confirming ? "Saving…" : selectedCust ? `✓ Confirm & Link to ${selectedCust.fullName}` : "✓ Confirm & Save"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={s.empty}>
          <div style={{ fontSize: 48 }}>📄</div>
          <div style={{ color: "#475569", marginTop: 8 }}>Choose a PDF or image to get started.</div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:       { minHeight: "100vh", background: "#f8fafc", fontFamily: '"DM Sans", system-ui, sans-serif', display: "flex", flexDirection: "column" },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 28px", background: "white", borderBottom: "1px solid rgba(15,23,42,0.08)" },
  logo:       { fontSize: 20, fontWeight: 800, color: "#0f172a" },
  tagline:    { margin: "2px 0 0", fontSize: 12, color: "#94a3b8" },
  menuBtn:    { padding: "10px 14px", borderRadius: 10, background: "#f8fafc", color: "#0f172a", border: "1px solid rgba(15,23,42,0.15)", fontWeight: 700, fontSize: 16, cursor: "pointer" },
  backBtn:    { padding: "10px 14px", borderRadius: 10, background: "white", color: "#475569", border: "1px solid rgba(15,23,42,0.12)", fontWeight: 600, fontSize: 13, textDecoration: "none" },
  uploadBar:  { display: "flex", alignItems: "center", gap: 12, padding: "14px 28px", background: "white", borderBottom: "1px solid rgba(15,23,42,0.06)" },
  chooseBtn:  { padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.15)", background: "white", cursor: "pointer", fontWeight: 700, fontSize: 14, color: "#0f172a" },
  fileSpan:   { flex: 1, fontSize: 14, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  blueBtn:    { padding: "10px 20px", borderRadius: 10, border: "none", background: "#2563eb", color: "white", cursor: "pointer", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" as const },
  darkBtn:    { padding: "10px 18px", borderRadius: 10, background: "#0f172a", color: "white", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" },
  ghostBtn:   { padding: "8px 14px", borderRadius: 9, background: "white", color: "#475569", border: "1px solid rgba(15,23,42,0.12)", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  columns:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, padding: "20px 28px", alignItems: "start" },
  card:       { background: "white", border: "1px solid rgba(15,23,42,0.10)", borderRadius: 16, padding: 20, boxShadow: "0 4px 12px rgba(2,8,23,0.05)", display: "flex", flexDirection: "column", gap: 12 },
  cardTitle:  { fontWeight: 800, fontSize: 16, color: "#0f172a" },
  hintSmall:  { fontSize: 12, color: "#94a3b8", margin: "-8px 0 0" },
  preview:    { width: "100%", height: 460, borderRadius: 10, border: "1px solid rgba(15,23,42,0.08)" },
  form:       { display: "grid", gap: 12 },
  row:        { display: "flex", alignItems: "center" },
  spinner:    { width: 20, height: 20, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#2563eb", animation: "spin 0.7s linear infinite" },
  errorBox:   { padding: 12, borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 14 },
  hintBox:    { padding: 12, borderRadius: 10, background: "#f1f5f9", color: "#475569", fontSize: 14 },
  fLabel:     { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  fInput:     { padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(15,23,42,0.15)", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" as const },
  searchInput:{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.15)", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" as const },
  dropList:   { border: "1px solid rgba(15,23,42,0.10)", borderRadius: 10, overflow: "hidden" },
  dropItem:   { padding: "10px 14px", fontSize: 14, cursor: "pointer", borderBottom: "1px solid rgba(15,23,42,0.05)", background: "white" },
  selBox:     { background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 14, display: "flex", alignItems: "center", gap: 10 },
  clearBtn:   { fontSize: 12, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontWeight: 600 },
  inlineForm: { display: "flex", flexDirection: "column", gap: 8, padding: 12, background: "#f8fafc", borderRadius: 10 },
  confirmBtn: { padding: "14px 20px", borderRadius: 12, border: "none", background: "#16a34a", color: "white", cursor: "pointer", fontWeight: 800, fontSize: 15, width: "100%" },
  empty:      { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center" as const },
};