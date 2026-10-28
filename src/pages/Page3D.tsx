// Page3D.tsx
import React from "react";

const Page3D: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: "#111",
        color: "#eee",
        borderRadius: "4px",
        padding: "16px",
        boxSizing: "border-box",
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>🪐</div>
        <h2 style={{ margin: "0 0 8px 0", fontSize: "24px", color: "#f0f0f0" }}>
          3D Mode
        </h2>
        <p style={{ margin: 0, fontSize: "14px", color: "#888" }}>
          Coming soon...
        </p>
      </div>
    </div>
  );
};

export default Page3D;
