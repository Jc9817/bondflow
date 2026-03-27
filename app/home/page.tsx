"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

type SummaryStats = {
  totalCustomers: number;
  openCases: number;
  closedCases: number;
  docsReview: number;
  docsConfirmed: number;
  docsUploaded: number;
  totalDocs: number;
  recentCases: {
    id: string; caseType: string; caseStatus: string; createdAt: string;
    customer: { id: string; fullName: string; companyName?: string };
    jobs: { id: string; status: string }[];
  }[];
  recentCustomers: {
    id: string; fullName: string; companyName?: string; createdAt: string;
    cases: { id: string; caseStatus: string }[];
  }[];
};

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats]     = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [cusRes, casRes, docRes] = await Promise.all([
          fetch("/api/customers"), fetch("/api/cases"), fetch("/api/uploads"),
        ]);
        const [cusData, casData, docData] = await Promise.all([
          cusRes.json(), casRes.json(), docRes.json(),
        ]);
        const customers = cusData.customers ?? [];
        const cases     = casData.cases     ?? [];
        const docs      = docData.uploads   ?? [];
        setStats({
          totalCustomers: customers.length,
          openCases:      cases.filter((c: any) => c.caseStatus === "OPEN").length,
          closedCases:    cases.filter((c: any) => c.caseStatus === "CLOSED").length,
          docsUploaded:   docs.filter((d: any) => d.status === "UPLOADED").length,
          docsReview:     docs.filter((d: any) => d.status === "REVIEW").length,
          docsConfirmed:  docs.filter((d: any) => d.status === "CONFIRMED").length,
          totalDocs:      docs.length,
          recentCases:    cases.slice(0, 5),
          recentCustomers: customers.slice(0, 5),
        });
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.body}>
        {/* Page header */}
        <div style={s.pageHeader}>
          <div>
            <div style={s.greeting}>{greeting} 👋</div>
            <div style={s.greetingSub}>Here's what's happening in BondFlow today</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={s.primaryBtn} onClick={() => router.push("/processing")}>+ Upload Document</button>
            <button style={s.ghostBtn}   onClick={() => router.push("/cases")}>+ New Case</button>
          </div>
        </div>

        {loading ? <div style={s.loading}>Loading…</div> : stats ? (
          <>
            {/* KPIs */}
            <div style={s.kpiRow}>
              {[
                { label: "Total Customers", value: stats.totalCustomers, icon: "👥", color: "#0369a1", bg: "#e0f2fe", href: "/customers"  },
                { label: "Open Cases",      value: stats.openCases,      icon: "📂", color: "#15803d", bg: "#dcfce7", href: "/cases"       },
                { label: "Closed Cases",    value: stats.closedCases,    icon: "✅", color: "#64748b", bg: "#f1f5f9", href: "/cases"       },
                { label: "Pending Review",  value: stats.docsReview,     icon: "⚠️", color: "#b45309", bg: "#fef3c7", href: "/processing"  },
                { label: "Docs Confirmed",  value: stats.docsConfirmed,  icon: "📄", color: "#7c3aed", bg: "#ede9fe", href: "/processing"  },
              ].map((kpi) => (
                <div key={kpi.label} style={{ ...s.kpiCard, cursor: "pointer" }} onClick={() => router.push(kpi.href)}>
                  <div style={{ ...s.kpiIcon, background: kpi.bg, color: kpi.color }}>{kpi.icon}</div>
                  <div style={{ ...s.kpiNum, color: kpi.color }}>{kpi.value}</div>
                  <div style={s.kpiLabel}>{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div style={s.sectionTitle}>Quick Actions</div>
            <div style={s.quickRow}>
              {[
                { icon: "📤", title: "Upload & Process Document", desc: "Upload a PDF or image, extract with AI, review and confirm", href: "/processing", color: "#0f172a", bg: "#f8fafc" },
                { icon: "👤", title: "Add New Customer",          desc: "Create a customer record for a new client or company",      href: "/customers",  color: "#0369a1", bg: "#e0f2fe" },
                { icon: "📁", title: "Open a New Case",           desc: "Create a bond, insurance, or other case for a customer",    href: "/cases",      color: "#15803d", bg: "#dcfce7" },
              ].map((q) => (
                <div key={q.title} style={{ ...s.quickCard, background: q.bg, cursor: "pointer" }} onClick={() => router.push(q.href)}>
                  <div style={{ fontSize: 28 }}>{q.icon}</div>
                  <div style={{ ...s.quickTitle, color: q.color }}>{q.title}</div>
                  <div style={s.quickDesc}>{q.desc}</div>
                  <div style={{ ...s.quickArrow, color: q.color }}>Go →</div>
                </div>
              ))}
            </div>

            {/* Two column: Recent */}
            <div style={s.twoCol}>
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <div style={s.cardTitle}>Recent Cases</div>
                  <button style={s.cardLink} onClick={() => router.push("/cases")}>View all →</button>
                </div>
                {stats.recentCases.length === 0 ? <div style={s.empty}>No cases yet.</div>
                  : stats.recentCases.map((c) => (
                    <div key={c.id} style={s.listRow} onClick={() => router.push(`/cases/detail?id=${c.id}`)}>
                      <span style={{ ...s.dot, background: c.caseStatus === "OPEN" ? "#22c55e" : "#94a3b8" }} />
                      <div style={{ flex: 1 }}>
                        <div style={s.rowTitle}>{c.caseType}</div>
                        <div style={s.rowSub}>{c.customer.fullName}{c.customer.companyName && ` · ${c.customer.companyName}`}</div>
                      </div>
                      <div style={s.rowMeta}>
                        <span style={s.docCount}>{c.jobs.length} doc{c.jobs.length !== 1 ? "s" : ""}</span>
                        <span style={s.rowDate}>{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
              </div>

              <div style={s.card}>
                <div style={s.cardHeader}>
                  <div style={s.cardTitle}>Recent Customers</div>
                  <button style={s.cardLink} onClick={() => router.push("/customers")}>View all →</button>
                </div>
                {stats.recentCustomers.length === 0 ? <div style={s.empty}>No customers yet.</div>
                  : stats.recentCustomers.map((c) => {
                    const open = c.cases.filter((x) => x.caseStatus === "OPEN").length;
                    return (
                      <div key={c.id} style={s.listRow} onClick={() => router.push(`/customers/${c.id}`)}>
                        <div style={s.avatar}>{c.fullName[0].toUpperCase()}</div>
                        <div style={{ flex: 1 }}>
                          <div style={s.rowTitle}>{c.fullName}</div>
                          {c.companyName && <div style={s.rowSub}>🏢 {c.companyName}</div>}
                        </div>
                        <div style={s.rowMeta}>
                          {open > 0 && <span style={s.openBadge}>{open} open</span>}
                          <span style={s.rowDate}>{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Pipeline */}
            {stats.totalDocs > 0 && (
              <>
                <div style={s.sectionTitle}>Document Pipeline</div>
                <div style={s.pipeCard}>
                  {[
                    { label: "Uploaded",  value: stats.docsUploaded,  color: "#0369a1", bg: "#e0f2fe" },
                    { label: "To Review", value: stats.docsReview,    color: "#b45309", bg: "#fef3c7" },
                    { label: "Confirmed", value: stats.docsConfirmed, color: "#15803d", bg: "#dcfce7" },
                  ].map((p) => (
                    <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => router.push("/processing")}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: p.color, minWidth: 36 }}>{p.value}</div>
                      <div style={{ background: p.bg, borderLeft: `3px solid ${p.color}`, padding: "6px 14px", borderRadius: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.label}</div>
                      </div>
                    </div>
                  ))}
                  <button style={{ ...s.primaryBtn, marginLeft: "auto" }} onClick={() => router.push("/processing")}>
                    Go to Processing →
                  </button>
                </div>
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:        { minHeight: "100vh", background: "#f1f5f9", fontFamily: '"DM Sans", system-ui, sans-serif', display: "flex", flexDirection: "column" },
  body:        { padding: "28px 40px", display: "flex", flexDirection: "column", gap: 24, maxWidth: 1400, width: "100%", margin: "0 auto", boxSizing: "border-box" as const },
  loading:     { padding: 60, textAlign: "center", color: "#94a3b8" },
  pageHeader:  { display: "flex", justifyContent: "space-between", alignItems: "center" },
  greeting:    { fontSize: 24, fontWeight: 800, color: "#0f172a" },
  greetingSub: { fontSize: 13, color: "#94a3b8", marginTop: 4 },
  primaryBtn:  { padding: "10px 18px", borderRadius: 10, background: "#0f172a", color: "white", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" },
  ghostBtn:    { padding: "10px 16px", borderRadius: 10, background: "white", color: "#475569", border: "1px solid rgba(15,23,42,0.15)", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  kpiRow:      { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 },
  kpiCard:     { background: "white", borderRadius: 14, border: "1px solid rgba(15,23,42,0.08)", padding: "18px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  kpiIcon:     { width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  kpiNum:      { fontSize: 28, fontWeight: 800, lineHeight: 1 },
  kpiLabel:    { fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", textAlign: "center" as const },
  sectionTitle:{ fontSize: 15, fontWeight: 800, color: "#0f172a" },
  quickRow:    { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 },
  quickCard:   { borderRadius: 14, border: "1px solid rgba(15,23,42,0.08)", padding: 20, display: "flex", flexDirection: "column", gap: 8 },
  quickTitle:  { fontSize: 15, fontWeight: 800 },
  quickDesc:   { fontSize: 13, color: "#64748b", lineHeight: 1.5 },
  quickArrow:  { fontSize: 13, fontWeight: 700, marginTop: 4 },
  twoCol:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  card:        { background: "white", borderRadius: 14, border: "1px solid rgba(15,23,42,0.08)", padding: 20, display: "flex", flexDirection: "column", gap: 8 },
  cardHeader:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardTitle:   { fontSize: 15, fontWeight: 800, color: "#0f172a" },
  cardLink:    { fontSize: 12, fontWeight: 700, color: "#2563eb", background: "none", border: "none", cursor: "pointer" },
  empty:       { fontSize: 13, color: "#94a3b8", textAlign: "center" as const, padding: "20px 0" },
  listRow:     { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, cursor: "pointer", border: "1px solid rgba(15,23,42,0.06)", background: "#fafafa" },
  dot:         { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  avatar:      { width: 30, height: 30, borderRadius: 8, background: "#e0f2fe", color: "#0369a1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 },
  rowTitle:    { fontSize: 13, fontWeight: 700, color: "#0f172a" },
  rowSub:      { fontSize: 12, color: "#64748b", marginTop: 2 },
  rowMeta:     { display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 4 },
  docCount:    { fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 10 },
  openBadge:   { fontSize: 11, fontWeight: 700, background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 10 },
  rowDate:     { fontSize: 11, color: "#94a3b8" },
  pipeCard:    { background: "white", borderRadius: 14, border: "1px solid rgba(15,23,42,0.08)", padding: "18px 24px", display: "flex", alignItems: "center", gap: 24 },
};