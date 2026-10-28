// App.tsx — nav shell
import React, { useState } from "react";
import Page2D from "./pages/Page2D";
import Page3D from "./pages/Page3D";

type PageId = "2d" | "3d";

const PAGES: { id: PageId; label: string }[] = [
  { id: "2d", label: "2D" },
  { id: "3d", label: "3D" },
];

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<PageId>("2d");

  return (
    <div
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        padding: "16px",
        backgroundColor: "#222",
        color: "#f0f0f0",
      }}
    >
      {/* ── Nav bar ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px",}}>
        <h1 style={{ margin: 0, fontSize: "20px", letterSpacing: "0.5px" }}>🪐 Orbit Arms</h1>
        <nav style={{ display: "flex", gap: "4px" }}>
          {PAGES.map((page) => {
            const isActive = activePage === page.id;
            return (
              <button
                key={page.id}
                onClick={() => setActivePage(page.id)}
                style={{
                  fontSize: "13px",
                  padding: "4px 16px",
                  borderRadius: "4px",
                  border: isActive ? "1px solid #f0f0f0" : "1px solid #555",
                  background: isActive ? "#f0f0f0" : "transparent",
                  color: isActive ? "#111" : "#aaa",
                  cursor: "pointer",
                  fontWeight: isActive ? "bold" : "normal",
                  transition: "all 0.15s",
                }}
              >
                {page.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Page content ──────────────────────────────────────────── */}
      {activePage === "2d" && <Page2D />}
      {activePage === "3d" && <Page3D />}
    </div>
  );
};

export default App;


