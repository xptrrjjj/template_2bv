"use client";

import React from "react";
import { Button } from "antd";
import { useAuth } from "@/contexts/AuthContext";

export const LoginButton: React.FC = () => {
  const { login, loading } = useAuth();

  const MicrosoftIcon = () => (
    <svg width="18" height="18" viewBox="0 0 23 23" fill="currentColor">
      <path d="M1 1h10v10H1z" fill="#F25022" />
      <path d="M12 1h10v10H12z" fill="#7FBA00" />
      <path d="M1 12h10v10H1z" fill="#00A4EF" />
      <path d="M12 12h10v10H12z" fill="#FFB900" />
    </svg>
  );

  return (
    <Button
      size="large"
      icon={<MicrosoftIcon />}
      loading={loading}
      onClick={login}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "56px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        border: "none",
        borderRadius: "8px",
        color: "white",
        fontSize: "16px",
        fontWeight: "600",
        boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.6)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
      }}
    >
      {loading ? "Signing in..." : "Sign in with Microsoft"}
    </Button>
  );
};
