"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/processing", label: "Processing" },
  { href: "/customers",  label: "Customers"  },
  { href: "/cases",      label: "Cases"      },
];

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href + "?");
  }

  return (
    <div style={s.bar}>
      {/* Logo / Home button */}
      <button style={s.logo} onClick={() => router.push("/home")}>
        <span style={s.logoIcon}>📋</span>
        <div>
          <div style={s.logoText}>DocFlow</div>
          <div style={s.logoSub}>Business System</div>
        </div>
      </button>

      <div style={s.divider} />

      {/* Nav links */}
      <nav style={s.nav}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.href}
            style={{ ...s.navItem, ...(isActive(item.href) ? s.navItemActive : {}) }}
            onClick={() => router.push(item.href)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Right side */}
      <div style={s.right}>
        <button style={s.homeBtn} onClick={() => router.push("/home")}>
          🏠 Home
        </button>
        <button style={s.signOutBtn} onClick={() => router.push("/login")}>
          Sign out
        </button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  bar:          { display: "flex", alignItems: "center", gap: 8, padding: "0 24px", height: 56, background: "#0f172a", position: "sticky" as const, top: 0, zIndex: 100, flexShrink: 0 },
  logo:         { display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: 8, flexShrink: 0 },
  logoIcon:     { fontSize: 20 },
  logoText:     { fontSize: 15, fontWeight: 800, color: "white", lineHeight: 1, textAlign: "left" as const },
  logoSub:      { fontSize: 10, color: "#475569", marginTop: 1, textAlign: "left" as const },
  divider:      { width: 1, height: 28, background: "rgba(255,255,255,0.10)", margin: "0 8px", flexShrink: 0 },
  nav:          { display: "flex", alignItems: "center", gap: 2, flex: 1 },
  navItem:      { padding: "7px 14px", borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 13, fontWeight: 600 },
  navItemActive:{ background: "rgba(255,255,255,0.10)", color: "white" },
  right:        { display: "flex", alignItems: "center", gap: 8 },
  homeBtn:      { padding: "7px 14px", borderRadius: 8, background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.12)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  signOutBtn:   { padding: "7px 14px", borderRadius: 8, background: "none", color: "#64748b", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" },
};