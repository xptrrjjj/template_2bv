"use client";

import React from "react";
import { Card, Typography, Row, Col, Statistic, Space } from "antd";
import {
  UserOutlined,
  SafetyCertificateOutlined,
  AppstoreOutlined,
  KeyOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/services/api";

const { Title, Text } = Typography;

interface AdminStats {
  userCount: number;
  roleCount: number;
  permissionCount: number;
  applicationCount: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    userCount: 0,
    roleCount: 0,
    permissionCount: 0,
    applicationCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [users, roles, permissions, applications] = await Promise.all([
          apiClient.getAllUsers(),
          apiClient.getAllRoles(),
          apiClient.getAllPermissions(),
          apiClient.getAllApplications(),
        ]);

        setStats({
          userCount: users.length,
          roleCount: roles.length,
          permissionCount: permissions.length,
          applicationCount: applications.length,
        });
      } catch (error) {
        console.error("Failed to load admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div style={{ padding: "32px", background: "#f8fafc", height: "100%" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <Card
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            marginBottom: "32px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
          styles={{ body: { padding: "32px" } }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                background: "linear-gradient(135deg, #722ed1 0%, #1890ff 100%)",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(114, 46, 209, 0.3)",
              }}
            >
              <TrophyOutlined style={{ fontSize: "28px", color: "white" }} />
            </div>
            <div>
              <Title level={2} style={{ margin: 0, color: "#1a202c" }}>
                System Administration
              </Title>
              <Text style={{ fontSize: "16px", color: "#64748b" }}>
                Manage users, roles, permissions, and system settings
              </Text>
            </div>
          </div>
        </Card>

        {/* Statistics Cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                background: "white",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Statistic
                title="Total Users"
                value={stats.userCount}
                prefix={<UserOutlined style={{ color: "#1890ff" }} />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                background: "white",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Statistic
                title="System Roles"
                value={stats.roleCount}
                prefix={<SafetyCertificateOutlined style={{ color: "#52c41a" }} />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                background: "white",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Statistic
                title="Permissions"
                value={stats.permissionCount}
                prefix={<KeyOutlined style={{ color: "#faad14" }} />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                background: "white",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Statistic
                title="Applications"
                value={stats.applicationCount}
                prefix={<AppstoreOutlined style={{ color: "#722ed1" }} />}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12} xl={6}>
            <Card
              title={
                <Space>
                  <UserOutlined style={{ color: "#1890ff" }} />
                  <Text strong>User Management</Text>
                </Space>
              }
              style={{
                background: "white",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
              hoverable
              onClick={() => router.push("/admin/users")}
            >
              <Text type="secondary">
                Manage user accounts, assign roles, and control access permissions across
                applications.
              </Text>
            </Card>
          </Col>
          <Col xs={24} lg={12} xl={6}>
            <Card
              title={
                <Space>
                  <SafetyCertificateOutlined style={{ color: "#52c41a" }} />
                  <Text strong>Role Management</Text>
                </Space>
              }
              style={{
                background: "white",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
              hoverable
              onClick={() => router.push("/admin/roles")}
            >
              <Text type="secondary">
                Create and manage roles, assign permissions, and define access levels for different
                user types.
              </Text>
            </Card>
          </Col>
          <Col xs={24} lg={12} xl={6}>
            <Card
              title={
                <Space>
                  <KeyOutlined style={{ color: "#faad14" }} />
                  <Text strong>Permission Management</Text>
                </Space>
              }
              style={{
                background: "white",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
              hoverable
              onClick={() => router.push("/admin/permissions")}
            >
              <Text type="secondary">
                Create custom permissions, manage system permissions, and control granular access
                rights.
              </Text>
            </Card>
          </Col>
          <Col xs={24} lg={12} xl={6}>
            <Card
              title={
                <Space>
                  <AppstoreOutlined style={{ color: "#722ed1" }} />
                  <Text strong>System Settings</Text>
                </Space>
              }
              style={{
                background: "white",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
              hoverable
              onClick={() => router.push("/admin/system")}
            >
              <Text type="secondary">
                Configure system-wide settings, manage applications, and monitor system health.
              </Text>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
