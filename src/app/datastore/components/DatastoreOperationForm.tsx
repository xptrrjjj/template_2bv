"use client";

import React, { useState } from "react";
import { Card, Form, Input, Select, Button, Space, Typography, App } from "antd";
import { SendOutlined, ClearOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { apiClient } from "@/services/api";
import { DatastoreAction } from "@/types/datastore";

const { TextArea } = Input;
const { Text } = Typography;

interface TestResult {
  operation: string;
  timestamp: string;
  request: unknown;
  response: unknown;
  status: "success" | "error";
  error?: string;
}

interface DatastoreOperationFormProps {
  onResult: (result: TestResult) => void;
}

const testTemplates = {
  create: {
    identifier: "recruitment_tool",
    action: "create" as DatastoreAction,
    data: {
      app_id: "recruitment_tool",
      record_id: "candidate_001",
      name: "John Doe",
      email: "john.doe@example.com",
      position: "Senior Developer",
      status: "active",
      skills: ["JavaScript", "React", "Node.js"],
      experience_years: 5,
    },
  },
  update: {
    identifier: "recruitment_tool",
    action: "update" as DatastoreAction,
    data: {
      record_id: "candidate_001",
      status: "interviewed",
      interview_date: "2024-01-15",
      notes: "Strong technical skills",
    },
  },
  append: {
    identifier: "recruitment_tool",
    action: "append" as DatastoreAction,
    data: {
      record_id: "candidate_001",
      certifications: ["AWS Certified", "React Certified"],
      last_updated: new Date().toISOString(),
    },
  },
  delete: {
    identifier: "recruitment_tool",
    action: "delete" as DatastoreAction,
    data: {
      record_id: "candidate_001",
    },
  },
  delete_all: {
    identifier: "recruitment_tool",
    action: "delete_all" as DatastoreAction,
    data: {},
  },
};

export const DatastoreOperationForm: React.FC<DatastoreOperationFormProps> = ({ onResult }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { notification } = App.useApp();

  const handleSubmit = async (values: { identifier: string; action: string; data: string }) => {
    setLoading(true);
    try {
      const requestData = {
        identifier: values.identifier,
        action: values.action as DatastoreAction,
        data: JSON.parse(values.data),
      };

      const response = await apiClient.datastoreCreate(requestData);

      onResult({
        operation: `${values.action.toUpperCase()} Operation`,
        timestamp: new Date().toISOString(),
        request: requestData,
        response,
        status: "success",
      });

      notification.success({
        message: "Operation Successful",
        description: `${values.action} operation completed successfully`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      onResult({
        operation: `${values.action.toUpperCase()} Operation`,
        timestamp: new Date().toISOString(),
        request: {
          identifier: values.identifier,
          action: values.action,
          data: values.data,
        },
        response: null,
        status: "error",
        error: errorMessage,
      });

      notification.error({
        message: "Operation Failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (action: DatastoreAction) => {
    const template = testTemplates[action];
    form.setFieldsValue({
      identifier: template.identifier,
      action: template.action,
      data: JSON.stringify(template.data, null, 2),
    });
  };

  const clearForm = () => {
    form.resetFields();
  };

  return (
    <Card
      title={
        <Space>
          <SendOutlined style={{ color: "#667eea" }} />
          <Text strong style={{ fontSize: "16px", color: "#1a202c" }}>
            Datastore Operations
          </Text>
        </Space>
      }
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
      styles={{ body: { padding: "24px" } }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          identifier: "recruitment_tool",
          action: "create",
        }}
        onFinish={handleSubmit}
      >
        <Form.Item
          label={
            <Text strong style={{ color: "#1a202c" }}>
              Identifier
            </Text>
          }
          name="identifier"
          rules={[{ required: true, message: "Please enter identifier" }]}
        >
          <Input placeholder="e.g., recruitment_tool" />
        </Form.Item>

        <Form.Item
          label={
            <Text strong style={{ color: "#1a202c" }}>
              Action
            </Text>
          }
          name="action"
          rules={[{ required: true, message: "Please select action" }]}
        >
          <Select
            placeholder="Select action"
            options={[
              { value: "create", label: "Create" },
              { value: "update", label: "Update" },
              { value: "append", label: "Append" },
              { value: "delete", label: "Delete" },
              { value: "delete_all", label: "Delete All" },
            ]}
          />
        </Form.Item>

        <Form.Item
          label={
            <Text strong style={{ color: "#1a202c" }}>
              Data (JSON)
            </Text>
          }
          name="data"
          rules={[
            { required: true, message: "Please enter data" },
            {
              validator: (_, value) => {
                try {
                  JSON.parse(value);
                  return Promise.resolve();
                } catch {
                  return Promise.reject(new Error("Invalid JSON format"));
                }
              },
            },
          ]}
        >
          <TextArea
            rows={12}
            placeholder="Enter JSON data..."
            style={{ fontFamily: "monospace", fontSize: "13px" }}
          />
        </Form.Item>

        <Space direction="vertical" style={{ width: "100%" }}>
          <div style={{ marginBottom: "16px" }}>
            <Text strong style={{ color: "#1a202c", marginBottom: "8px", display: "block" }}>
              Quick Templates:
            </Text>
            <Space wrap>
              {Object.keys(testTemplates).map((action) => (
                <Button
                  key={action}
                  size="small"
                  icon={<ThunderboltOutlined />}
                  onClick={() => loadTemplate(action as DatastoreAction)}
                  style={{ textTransform: "capitalize" }}
                >
                  {action.replace("_", " ")}
                </Button>
              ))}
            </Space>
          </div>

          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button icon={<ClearOutlined />} onClick={clearForm}>
              Clear
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              htmlType="submit"
              loading={loading}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
              }}
            >
              Execute
            </Button>
          </Space>
        </Space>
      </Form>
    </Card>
  );
};
