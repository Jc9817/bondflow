"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  id: string;
  fullName: string;
  companyRegistration?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  idNumber?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  cases: { id: string; caseType: string; caseStatus: string }[];
  jobs:  { id: string; status: string }[];
};

type FormData = {
  fullName: string; companyRegistration: string; contactPerson: string;
  phone: string; email: string; idNumber: string; address: string; notes: string;
};

const EMPTY_FORM: FormData = {
  fullName: "", companyRegistration: "", contactPerson: "",
  phone: "", email: "", idNumber: "", address: "", notes: "",
};

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm]           = useState<FormData>(EMPTY_FORM);

  const fetchCustomers = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/customers?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setCustomers(data.customers ?? []);
    } catch { setCustomers([]); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => {
    const t = setTimeout(() => fetchCustomers(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchCustomers]);

  async function createCustomer() {
    setFormError("");
    if (!form.fullName.trim()) { setFormError("Full name is required."); return; }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFormError("Invalid email format."); return;
    }
    setSaving(true);
    try {
      const res  = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Failed to create customer."); return; }
      setCustomers((prev) => [{ ...data.customer, cases: [], jobs: [] }, ...prev]);
      setShowForm(false);
      setForm(EMPTY_FORM);
    } finally { setSaving(false); }
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <div style={s.logo}>👥 Customers</div>
          <p style={s.tagline}>Manage your customer records</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {/* ✅ Back to Menu */}
          <button style={s.menuBtn} onClick={() => router.push("/login")}>⬅ Menu</button>
          <button style={s.backBtn} onClick={() => router.push("/dashboard")}>📋 Dashboard</button>
          <button style={s.primaryBtn} onClick={() => { setShowForm(true); setFormError(""); }}>
            + Add Customer
          </button>
        </div>
      </header>

      <div style={s.body}>
        <input
          style={s.searchInput}
          placeholder="🔍  Search by name, company reg, phone, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Create form */}
        {showForm && (
          <div style={s.formCard}>
            <div style={s.formTitle}>New Customer</div>
            {formError && <div style={s.formError}>⚠️ {formError}</div>}
            <div style={s.formGrid}>
              {([
                { key: "fullName",            label: "Full Name *",      placeholder: "e.g. Ahmad bin Ali" },
                { key: "companyRegistration", label: "Company Reg No",   placeholder: "e.g. 202301012345" },
                { key: "contactPerson",       label: "Contact Person",   placeholder: "e.g. Siti Aminah" },
                { key: "phone",               label: "Phone",            placeholder: "e.g. 012-3456789" },
                { key: "email",               label: "Email",            placeholder: "e.g. ahmad@email.com" },
                { key: "idNumber",            label: "ID / Passport No", placeholder: "e.g. 901234-56-7890" },
              ] as { key: keyof FormData; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
                <div key={key} style={{ display: "grid", gap: 4 }}>
                  <label style={s.fieldLabel}>{label}</label>
                  <input style={s.fieldInput} placeholder={placeholder} value={form[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <div style={{ display: "grid", gap: 4 }}>
                <label style={s.fieldLabel}>Address</label>
                <input style={s.fieldInput} placeholder="Street, City, State" value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                <label style={s.fieldLabel}>Notes</label>
                <textarea style={{ ...s.fieldInput, height: 70, resize: "vertical" as const }}
                  placeholder="Any additional notes…" value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button style={s.primaryBtn} onClick={createCustomer} disabled={saving}>
                {saving ? "Saving…" : "Create Customer"}
              </button>
              <button style={s.ghostBtn} onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div style={s.empty}>Loading…</div>
        ) : customers.length === 0 ? (
          <div style={s.empty}>
            {search ? `No customers found for "${search}"` : "No customers yet. Click + Add Customer to get started."}
          </div>
        ) : (
          <div style={s.tableCard}>
            <div style={s.tableHeader}>
              <div style={{ flex: 2 }}>Customer</div>
              <div style={{ flex: 2 }}>Company / Contact</div>
              <div style={{ flex: 1.5 }}>Phone / Email</div>
              <div style={{ flex: 1, textAlign: "center" as const }}>Docs</div>
              <div style={{ flex: 1, textAlign: "center" as const }}>Cases</div>
              <div style={{ flex: 1, textAlign: "right" as const }}>Created</div>
              <div style={{ flex: 0.5 }}></div>
            </div>
            {customers.map((c) => (
              <div key={c.id} style={s.tableRow} onClick={() => router.push(`/customers/${c.id}`)}>
                <div style={{ flex: 2, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={s.avatar}>{c.fullName[0].toUpperCase()}</div>
                  <div>
                    <div style={s.custName}>{c.fullName}</div>
                    {c.idNumber && <div style={s.custSub}>🪪 {c.idNumber}</div>}
                  </div>
                </div>
                <div style={{ flex: 2 }}>
                  {c.companyRegistration && <div style={s.custSub}>🏢 {c.companyRegistration}</div>}
                  {c.contactPerson       && <div style={s.custSub}>👤 {c.contactPerson}</div>}
                  {!c.companyRegistration && !c.contactPerson && <span style={s.na}>—</span>}
                </div>
                <div style={{ flex: 1.5 }}>
                  {c.phone && <div style={s.custSub}>📞 {c.phone}</div>}
                  {c.email && <div style={s.custSub}>✉️ {c.email}</div>}
                  {!c.phone && !c.email && <span style={s.na}>—</span>}
                </div>
                <div style={{ flex: 1, textAlign: "center" as const }}>
                  <span style={s.countBadge}>{c.jobs.length}</span>
                </div>
                <div style={{ flex: 1, textAlign: "center" as const }}>
                  <span style={{ ...s.countBadge, background: "#dcfce7", color: "#15803d" }}>
                    {c.cases.filter((x) => x.caseStatus === "OPEN").length} open
                  </span>
                </div>
                <div style={{ flex: 1, textAlign: "right" as const, fontSize: 12, color: "#94a3b8" }}>
                  {new Date(c.createdAt).toLocaleDateString()}
                </div>
                <div style={{ flex: 0.5, textAlign: "right" as const, color: "#94a3b8" }}>→</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:        { minHeight: "100vh", background: "#f1f5f9", fontFamily: '"DM Sans", system-ui, sans-serif', display: "flex", flexDirection: "column" },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 28px", background: "white", borderBottom: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 1px 4px rgba(2,8,23,0.04)" },
  logo:        { fontSize: 20, fontWeight: 800, color: "#0f172a" },
  tagline:     { margin: "2px 0 0", fontSize: 12, color: "#94a3b8" },
  menuBtn:     { padding: "10px 14px", borderRadius: 10, background: "#f8fafc", color: "#0f172a", border: "1px solid rgba(15,23,42,0.15)", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  backBtn:     { padding: "10px 14px", borderRadius: 10, background: "white", color: "#475569", border: "1px solid rgba(15,23,42,0.12)", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  primaryBtn:  { padding: "10px 18px", borderRadius: 10, background: "#0f172a", color: "white", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" },
  ghostBtn:    { padding: "10px 14px", borderRadius: 10, background: "white", color: "#475569", border: "1px solid rgba(15,23,42,0.12)", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  body:        { padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 1100, width: "100%", margin: "0 auto" },
  searchInput: { padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(15,23,42,0.15)", fontSize: 14, background: "white", outline: "none", width: "100%", boxSizing: "border-box" as const },
  formCard:    { background: "white", borderRadius: 16, border: "1px solid rgba(15,23,42,0.10)", padding: 24, boxShadow: "0 4px 12px rgba(2,8,23,0.05)" },
  formTitle:   { fontWeight: 800, fontSize: 16, color: "#0f172a", marginBottom: 16 },
  formError:   { padding: "10px 14px", borderRadius: 9, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 13, marginBottom: 12 },
  formGrid:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  fieldLabel:  { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  fieldInput:  { padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(15,23,42,0.15)", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" as const, fontFamily: "inherit" },
  empty:       { textAlign: "center", padding: "48px", color: "#94a3b8", fontSize: 14, background: "white", borderRadius: 14, border: "1px solid rgba(15,23,42,0.08)" },
  tableCard:   { background: "white", borderRadius: 14, border: "1px solid rgba(15,23,42,0.08)", overflow: "hidden", boxShadow: "0 1px 4px rgba(2,8,23,0.04)" },
  tableHeader: { display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", background: "#f8fafc", borderBottom: "1px solid rgba(15,23,42,0.08)", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  tableRow:    { display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid rgba(15,23,42,0.05)", cursor: "pointer", fontSize: 13 },
  avatar:      { width: 36, height: 36, borderRadius: 10, background: "#e0f2fe", color: "#0369a1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, flexShrink: 0 },
  custName:    { fontWeight: 700, fontSize: 14, color: "#0f172a" },
  custSub:     { fontSize: 12, color: "#64748b", marginTop: 2 },
  na:          { color: "#cbd5e1", fontSize: 13 },
  countBadge:  { fontSize: 12, fontWeight: 700, background: "#f1f5f9", color: "#475569", padding: "2px 10px", borderRadius: 20 },
};