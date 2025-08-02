"use client";

import React from "react";
import { Card, Typography, Button, Space, Timeline, Tag, Collapse, Empty } from "antd";
import {
  HistoryOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DownOutlined,
  RightOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface TestResult {
  operation: string;
  timestamp: string;
  request: unknown;
  response: unknown;
  status: "success" | "error";
  error?: string;
}

interface ResponseDisplayProps {
  results: TestResult[];
  onClear: () => void;
}

export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ results, onClear }) => {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatJson = (obj: unknown) => {
    return JSON.stringify(obj, null, 2);
  };

  const getStatusIcon = (status: "success" | "error") => {
    return status === "success" ? (
      <CheckCircleOutlined style={{ color: "#52c41a" }} />
    ) : (
      <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
    );
  };

  const getStatusColor = (status: "success" | "error") => {
    return status === "success" ? "success" : "error";
  };

  if (results.length === 0) {
    return (
      <Card
        title={
          <Space>
            <HistoryOutlined style={{ color: "#667eea" }} />
            <Text strong style={{ fontSize: "16px", color: "#1a202c" }}>
              Test Results
            </Text>
          </Space>
        }
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
        styles={{ body: { padding: "40px" } }}
      >
        <Empty description="No test results yet" image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Text type="secondary">Execute datastore operations to see results here</Text>
        </Empty>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <HistoryOutlined style={{ color: "#667eea" }} />
          <Text strong style={{ fontSize: "16px", color: "#1a202c" }}>
            Test Results ({results.length})
          </Text>
        </Space>
      }
      extra={
        <Button icon={<ClearOutlined />} onClick={onClear} size="small">
          Clear All
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
      <div style={{ maxHeight: "600px", overflowY: "auto" }}>
        <Timeline
          items={results.map((result) => ({
            dot: getStatusIcon(result.status),
            children: (
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "8px",
                  }}
                >
                  <Text strong style={{ color: "#1a202c" }}>
                    {result.operation}
                  </Text>
                  <Tag color={getStatusColor(result.status)}>{result.status.toUpperCase()}</Tag>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    {formatTimestamp(result.timestamp)}
                  </Text>
                </div>

                {result.error && (
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "#fff2f0",
                      border: "1px solid #ffccc7",
                      borderRadius: "6px",
                      marginBottom: "12px",
                    }}
                  >
                    <Text type="danger" style={{ fontSize: "13px" }}>
                      {result.error}
                    </Text>
                  </div>
                )}

                <Collapse
                  size="small"
                  ghost
                  expandIcon={({ isActive }) => (isActive ? <DownOutlined /> : <RightOutlined />)}
                  items={[
                    {
                      key: "request",
                      label: (
                        <Text style={{ fontSize: "13px", color: "#666" }}>Request Details</Text>
                      ),
                      children: (
                        <div
                          style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                            padding: "12px",
                            maxHeight: "200px",
                            overflowY: "auto",
                          }}
                        >
                          <pre
                            style={{
                              margin: 0,
                              fontSize: "12px",
                              color: "#374151",
                              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                            }}
                          >
                            {formatJson(result.request)}
                          </pre>
                        </div>
                      ),
                    },
                    {
                      key: "response",
                      label: (
                        <Text style={{ fontSize: "13px", color: "#666" }}>Response Details</Text>
                      ),
                      children: (
                        <div
                          style={{
                            background: result.status === "success" ? "#f6ffed" : "#fff2f0",
                            border: `1px solid ${result.status === "success" ? "#b7eb8f" : "#ffccc7"}`,
                            borderRadius: "6px",
                            padding: "12px",
                            maxHeight: "300px",
                            overflowY: "auto",
                          }}
                        >
                          <pre
                            style={{
                              margin: 0,
                              fontSize: "12px",
                              color: "#374151",
                              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                            }}
                          >
                            {formatJson(result.response)}
                          </pre>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            ),
          }))}
        />
      </div>
    </Card>
  );
};
