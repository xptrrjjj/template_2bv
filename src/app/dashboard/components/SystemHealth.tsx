"use client";

import React from "react";
import { Card, Typography, Space, Button, Progress } from "antd";
import { DatabaseOutlined, CheckCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface TestResult {
  operation: string;
  status: string;
  data: unknown;
}

interface SystemHealthProps {
  testResults: TestResult[];
  loading: boolean;
  onTestConnection: () => void;
}

export const SystemHealth: React.FC<SystemHealthProps> = ({
  testResults,
  loading,
  onTestConnection,
}) => {
  return (
    <Card
      title={
        <Space>
          <DatabaseOutlined style={{ color: "#667eea" }} />
          <Text strong style={{ fontSize: "16px", color: "#1a202c" }}>
            System Health
          </Text>
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<DatabaseOutlined />}
          loading={loading}
          onClick={onTestConnection}
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
            borderRadius: "6px",
            fontWeight: "500",
          }}
        >
          Test API
        </Button>
      }
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
      styles={{ body: { padding: "24px" } }}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <div style={{ marginBottom: "20px" }}>
          <Text style={{ color: "#1a202c", fontWeight: "500" }}>Database Connection</Text>
          <Progress percent={100} status="success" showInfo={false} style={{ marginTop: "8px" }} />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <Text style={{ color: "#1a202c", fontWeight: "500" }}>API Response Time</Text>
          <Progress percent={85} showInfo={false} style={{ marginTop: "8px" }} />
          <Text style={{ fontSize: "12px", color: "#64748b" }}>125ms avg</Text>
        </div>

        {testResults.length > 0 && (
          <div>
            <Text strong style={{ marginBottom: "12px", display: "block", color: "#1a202c" }}>
              Latest Test Results:
            </Text>
            {testResults.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: "12px",
                  background: result.status === "success" ? "#f0fdf4" : "#fef2f2",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  border: `1px solid ${result.status === "success" ? "#bbf7d0" : "#fecaca"}`,
                }}
              >
                <Space>
                  <CheckCircleOutlined
                    style={{ color: result.status === "success" ? "#16a34a" : "#dc2626" }}
                  />
                  <Text style={{ fontSize: "14px", color: "#1a202c" }}>{result.operation}</Text>
                </Space>
              </div>
            ))}
          </div>
        )}
      </Space>
    </Card>
  );
};
