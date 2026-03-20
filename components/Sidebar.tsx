"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "📋", label: "Dashboard" },
  { href: "/customers", icon: "👥", label: "Customers" },
  { href: "/cases",     icon: "📁", label: "Cases"     },
];

export default function Sidebar() {
  const router   = useRouter();
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href + "?");
  }

  return (
    <div style={s.sidebar}>
      {/* Logo */}
      <div style={s.logoSection}>
        <div style={s.logoIcon}>📋</div>
        <div>
          <div style={s.logoText}>DocFlow</div>
          <div style={s.logoSub}>Business System</div>
        </div>
      </div>

      <div style={s.divider} />

      {/* Nav items */}
      <nav style={s.nav}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.href}
            style={{ ...s.navItem, ...(isActive(item.href) ? s.navItemActive : {}) }}
            onClick={() => router.push(item.href)}
          >
            <span style={s.navIcon}>{item.icon}</span>
            <span style={s.navLabel}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom: sign out */}
      <div style={s.bottom}>
        <button style={s.signOutBtn} onClick={() => router.push("/login")}>
          <span>🚪</span>
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  sidebar:       { width: 220, minHeight: "100vh", background: "#0f172a", display: "flex", flexDirection: "column", padding: "20px 0", flexShrink: 0, position: "sticky" as const, top: 0, height: "100vh" },
  logoSection:   { display: "flex", alignItems: "center", gap: 10, padding: "0 18px 0 18px", marginBottom: 8 },
  logoIcon:      { fontSize: 24 },
  logoText:      { fontSize: 16, fontWeight: 800, color: "white" },
  logoSub:       { fontSize: 11, color: "#475569", marginTop: 1 },
  divider:       { height: 1, background: "rgba(255,255,255,0.08)", margin: "12px 0" },
  nav:           { display: "flex", flexDirection: "column", gap: 2, padding: "0 10px", flex: 1 },
  navItem:       { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 14, fontWeight: 600, textAlign: "left" as const, width: "100%", transition: "background 0.15s" },
  navItemActive: { background: "rgba(255,255,255,0.10)", color: "white" },
  navIcon:       { fontSize: 16, flexShrink: 0 },
  navLabel:      { flex: 1 },
  bottom:        { padding: "0 10px", marginTop: "auto" },
  signOutBtn:    { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 14, fontWeight: 600, width: "100%" },
};