"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const VALID_USERS = [
  { username: "admin", password: "admin123" },
  { username: "user",  password: "user123"  },
];

type Screen = "login" | "home";

export default function LoginPage() {
  const router = useRouter();
  const [screen, setScreen]     = useState<Screen>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [loggedInUser, setLoggedInUser] = useState("");

  function handleLogin() {
    if (!username.trim() || !password.trim()) { setError("Please enter username and password."); return; }
    setLoading(true); setError("");
    setTimeout(() => {
      const match = VALID_USERS.find((u) => u.username === username.trim() && u.password === password);
      if (match) { setLoggedInUser(username.trim()); setScreen("home"); }
      else { setError("Invalid username or password."); }
      setLoading(false);
    }, 600);
  }

  if (screen === "login") {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.logoRow}>
            <span style={{ fontSize: 36 }}>📋</span>
            <div>
              <div style={s.logoText}>DocFlow</div>
              <div style={s.logoSub}>Document Processing & CRM</div>
            </div>
          </div>
          <div style={s.divider} />
          <div style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Username</label>
              <input style={s.input} placeholder="Enter username" value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()} autoFocus />
            </div>
            <div style={s.field}>
              <label style={s.label}>Password</label>
              <input style={s.input} type="password" placeholder="Enter password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
            </div>
            {error && <div style={s.errorBox}>⚠️ {error}</div>}
            <button style={{ ...s.loginBtn, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </div>
          <div style={s.hint}>Default: <strong>admin</strong> / <strong>admin123</strong></div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.homeCard}>
        <div style={s.homeHeader}>
          <div>
            <div style={s.logoText}>📋 DocFlow</div>
            <div style={s.logoSub}>Welcome back, <strong>{loggedInUser}</strong></div>
          </div>
          {/* ✅ Sign out button */}
          <button style={s.signOutBtn} onClick={() => { setScreen("login"); setUsername(""); setPassword(""); }}>
            Sign out
          </button>
        </div>
        <div style={s.divider} />
        <div style={s.homeTitle}>What would you like to do?</div>
        <div style={s.optionRow}>
          <div style={s.optionCard} onClick={() => router.push("/dashboard")}>
            <div style={{ fontSize: 36 }}>📄</div>
            <div style={s.optionTitle}>Process Documents</div>
            <div style={s.optionDesc}>Upload PDFs and images, extract fields with AI, review and confirm data.</div>
            <div style={s.featureRow}>
              {["Upload", "Extract", "Review", "Confirm"].map((t) => <span key={t} style={s.featureTag}>{t}</span>)}
            </div>
            <div style={s.optionArrow}>Go to Dashboard →</div>
          </div>
          <div style={s.optionCard} onClick={() => router.push("/customers")}>
            <div style={{ fontSize: 36 }}>👥</div>
            <div style={s.optionTitle}>Customer CRM</div>
            <div style={s.optionDesc}>Manage customers, create cases, and track linked documents.</div>
            <div style={s.featureRow}>
              {["Customers", "Cases", "History"].map((t) => <span key={t} style={s.featureTag}>{t}</span>)}
            </div>
            <div style={s.optionArrow}>Go to Customers →</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:       { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", fontFamily: '"DM Sans", system-ui, sans-serif', padding: 24 },
  card:       { background: "white", borderRadius: 20, padding: "40px 44px", boxShadow: "0 8px 32px rgba(2,8,23,0.10)", width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 20 },
  logoRow:    { display: "flex", alignItems: "center", gap: 12 },
  logoText:   { fontSize: 22, fontWeight: 800, color: "#0f172a" },
  logoSub:    { fontSize: 13, color: "#94a3b8", marginTop: 2 },
  divider:    { height: 1, background: "rgba(15,23,42,0.07)" },
  form:       { display: "flex", flexDirection: "column", gap: 14 },
  field:      { display: "flex", flexDirection: "column", gap: 6 },
  label:      { fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  input:      { padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.15)", fontSize: 15, outline: "none", color: "#0f172a" },
  errorBox:   { padding: "10px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 14 },
  loginBtn:   { padding: "13px 20px", borderRadius: 11, background: "#0f172a", color: "white", fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer" },
  hint:       { fontSize: 12, color: "#94a3b8", textAlign: "center" as const },
  homeCard:   { background: "white", borderRadius: 20, padding: "36px 40px", boxShadow: "0 8px 32px rgba(2,8,23,0.10)", width: "100%", maxWidth: 720, display: "flex", flexDirection: "column", gap: 20 },
  homeHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  homeTitle:  { fontSize: 18, fontWeight: 800, color: "#0f172a" },
  signOutBtn: { padding: "8px 14px", borderRadius: 9, background: "white", color: "#475569", border: "1px solid rgba(15,23,42,0.12)", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  optionRow:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  optionCard: { border: "1.5px solid rgba(15,23,42,0.10)", borderRadius: 16, padding: "24px 22px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 2px 8px rgba(2,8,23,0.04)" },
  optionTitle:{ fontSize: 17, fontWeight: 800, color: "#0f172a" },
  optionDesc: { fontSize: 13, color: "#64748b", lineHeight: 1.5 },
  featureRow: { display: "flex", gap: 6, flexWrap: "wrap" as const },
  featureTag: { fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 6 },
  optionArrow:{ fontSize: 13, fontWeight: 700, color: "#2563eb", marginTop: 6 },
};