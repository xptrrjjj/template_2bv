"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Typography,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  Descriptions,
  Divider,
  App,
  Row,
  Col,
  Alert,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined,
  ReloadOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  SettingOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { PermissionGuard } from "@/components/guards";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionRecord, CreatePermissionRequest } from "@/types/rbac";
import { permissionService, roleService } from "@/services/rbac";
import { 
  setupApprovalWorkflow, 
  wipeApprovalWorkflow, 
  isApprovalWorkflowSetup,
  ApprovalWorkflowSetupResult 
} from "@/scripts/approvalWorkflowSetup";

const { Title, Text } = Typography;
const { TextArea, Search } = Input;

interface PermissionWithDetails extends PermissionRecord {
  roleCount: number;
  canDelete: boolean;
}

export default function PermissionsPage() {
  const { message } = App.useApp();
  const { rbacUser } = useAuth();
  const [permissions, setPermissions] = useState<PermissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<PermissionWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [approvalWorkflowSetup, setApprovalWorkflowSetup] = useState(false);
  const [approvalWorkflowLoading, setApprovalWorkflowLoading] = useState(false);
  const [form] = Form.useForm();

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const [permissionsData, rolesData] = await Promise.all([
        permissionService.getAllPermissions(),
        roleService.getAllRoles(),
      ]);

      // Count how many roles use each permission
      const rolePermissionCounts = permissionsData.map((permission) => {
        const roleCount = rolesData.filter((role) =>
          role.permission_ids.includes(permission.permission_id)
        ).length;

        return {
          ...permission,
          roleCount,
          canDelete: !permission.is_system_permission && roleCount === 0,
        };
      });

      setPermissions(rolePermissionCounts);
      
      // Check if approval workflow is set up
      const isSetup = await isApprovalWorkflowSetup();
      setApprovalWorkflowSetup(isSetup);
    } catch (error) {
      console.error("Failed to load permissions:", error);
      message.error("Failed to load permissions");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const handleCreate = async (values: any) => {
    try {
      const permissionRequest: CreatePermissionRequest = {
        permission_id: values.permission_id,
        name: values.name,
        description: values.description,
        resource: values.resource,
        action: values.action,
        scope: values.scope,
        app_id: values.scope === "app" ? values.app_id : undefined,
      };

      await permissionService.createPermission(permissionRequest, rbacUser?.microsoft_oid || "");
      message.success("Permission created successfully");
      setCreateModalOpen(false);
      form.resetFields();
      loadPermissions();
    } catch (error) {
      console.error("Failed to create permission:", error);
      message.error("Failed to create permission");
    }
  };

  const handleDelete = async (permissionId: string) => {
    try {
      await permissionService.deletePermission(permissionId, rbacUser?.microsoft_oid || "");
      message.success("Permission deleted successfully");
      loadPermissions();
    } catch (error) {
      console.error("Failed to delete permission:", error);
      message.error("Failed to delete permission");
    }
  };

  const handleView = (permission: PermissionWithDetails) => {
    setSelectedPermission(permission);
    setViewModalOpen(true);
  };

  const handleSetupApprovalWorkflow = async () => {
    try {
      setApprovalWorkflowLoading(true);
      const result: ApprovalWorkflowSetupResult = await setupApprovalWorkflow(rbacUser?.microsoft_oid || "admin");
      
      if (result.success) {
        message.success(
          `Approval workflow setup completed! Created ${result.permissionsCreated} permissions and ${result.rolesCreated} roles.`
        );
        setApprovalWorkflowSetup(true);
        loadPermissions(); // Refresh to show new permissions
      } else {
        message.warning(
          `Approval workflow setup completed with ${result.errors.length} errors. Check console for details.`
        );
        console.error("Setup errors:", result.errors);
      }
    } catch (error) {
      console.error("Failed to setup approval workflow:", error);
      message.error("Failed to setup approval workflow");
    } finally {
      setApprovalWorkflowLoading(false);
    }
  };

  const handleWipeApprovalWorkflow = async () => {
    try {
      setApprovalWorkflowLoading(true);
      const result: ApprovalWorkflowSetupResult = await wipeApprovalWorkflow(rbacUser?.microsoft_oid || "admin");
      
      if (result.success) {
        message.success(
          `Approval workflow wiped! Removed ${result.permissionsCreated} permissions and ${result.rolesCreated} roles.`
        );
        setApprovalWorkflowSetup(false);
        loadPermissions(); // Refresh to show removed permissions
      } else {
        message.warning(
          `Approval workflow wipe completed with ${result.errors.length} errors. Check console for details.`
        );
        console.error("Wipe errors:", result.errors);
      }
    } catch (error) {
      console.error("Failed to wipe approval workflow:", error);
      message.error("Failed to wipe approval workflow");
    } finally {
      setApprovalWorkflowLoading(false);
    }
  };

  const filteredPermissions = permissions.filter((permission) =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.permission_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const systemPermissions = filteredPermissions.filter(p => p.is_system_permission);
  const customPermissions = filteredPermissions.filter(p => !p.is_system_permission);

  const columns = [
    {
      title: "Permission ID",
      dataIndex: "permission_id",
      key: "permission_id",
      render: (text: string, record: PermissionWithDetails) => (
        <Space>
          <Text code>{text}</Text>
          {record.is_system_permission && (
            <Tag icon={<LockOutlined />} color="blue">
              System
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Resource",
      dataIndex: "resource",
      key: "resource",
      render: (text: string) => <Tag color="cyan">{text}</Tag>,
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (text: string) => <Tag color="orange">{text}</Tag>,
    },
    {
      title: "Scope",
      dataIndex: "scope",
      key: "scope",
      render: (scope: string, record: PermissionWithDetails) => (
        <Space>
          <Tag
            icon={scope === "global" ? <GlobalOutlined /> : <AppstoreOutlined />}
            color={scope === "global" ? "purple" : "green"}
          >
            {scope}
          </Tag>
          {scope === "app" && record.app_id && (
            <Text type="secondary">({record.app_id})</Text>
          )}
        </Space>
      ),
    },
    {
      title: "Used by Roles",
      dataIndex: "roleCount",
      key: "roleCount",
      render: (count: number) => (
        <Tag color={count > 0 ? "blue" : "default"}>
          {count} role{count !== 1 ? "s" : ""}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: PermissionWithDetails) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            View
          </Button>
          {record.canDelete && (
            <Popconfirm
              title="Delete Permission"
              description={`Are you sure you want to delete "${record.name}"?`}
              onConfirm={() => handleDelete(record.permission_id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
              <Col>
                <Title level={2} style={{ margin: 0 }}>
                  <SafetyCertificateOutlined /> Permissions Management
                </Title>
                <Text type="secondary">
                  Manage system and custom permissions
                </Text>
              </Col>
              <Col>
                <Space>
                  <Button
                    type="default"
                    icon={<ReloadOutlined />}
                    onClick={loadPermissions}
                    loading={loading}
                  >
                    Refresh
                  </Button>
                  <PermissionGuard
                    resource="rbac.permissions"
                    action="create"
                    fallback={null}
                  >
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setCreateModalOpen(true)}
                    >
                      Create Permission
                    </Button>
                  </PermissionGuard>
                </Space>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Search
                  placeholder="Search permissions by name, ID, resource, or action..."
                  allowClear
                  size="large"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ maxWidth: 500 }}
                />
              </Col>
            </Row>

            {/* Permission Statistics */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} md={6}>
                <Card size="small" style={{ textAlign: "center" }}>
                  <Text type="secondary">Total Permissions</Text>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1890ff" }}>
                    {permissions.length}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card size="small" style={{ textAlign: "center" }}>
                  <Text type="secondary">System Permissions</Text>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#722ed1" }}>
                    {systemPermissions.length}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card size="small" style={{ textAlign: "center" }}>
                  <Text type="secondary">Custom Permissions</Text>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#52c41a" }}>
                    {customPermissions.length}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card size="small" style={{ textAlign: "center" }}>
                  <Text type="secondary">Deletable</Text>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#fa541c" }}>
                    {permissions.filter(p => p.canDelete).length}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Approval Workflow Section */}
            <Card 
              size="small" 
              title={
                <Space>
                  <SettingOutlined />
                  <span>Job Role Approval Workflow</span>
                </Space>
              }
              style={{ marginBottom: 16 }}
              extra={
                <Space>
                  {approvalWorkflowSetup ? (
                    <Tag color="green">Setup Complete</Tag>
                  ) : (
                    <Tag color="orange">Not Setup</Tag>
                  )}
                </Space>
              }
            >
              <Row gutter={16} align="middle">
                <Col flex="auto">
                  <Text type="secondary">
                    {approvalWorkflowSetup 
                      ? "Job role approval workflow permissions and roles are configured." 
                      : "Setup custom roles and permissions for the job role approval workflow."
                    }
                  </Text>
                </Col>
                <Col>
                  <Space>
                    {!approvalWorkflowSetup ? (
                      <Button
                        type="primary"
                        icon={<SettingOutlined />}
                        loading={approvalWorkflowLoading}
                        onClick={handleSetupApprovalWorkflow}
                      >
                        Setup Approval Workflow
                      </Button>
                    ) : (
                      <Popconfirm
                        title="Wipe Approval Workflow"
                        description="This will remove all approval workflow roles and permissions. Users with these roles will lose their permissions. Are you sure?"
                        onConfirm={handleWipeApprovalWorkflow}
                        okText="Yes, Wipe"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          danger
                          icon={<WarningOutlined />}
                          loading={approvalWorkflowLoading}
                        >
                          Wipe Approval Workflow
                        </Button>
                      </Popconfirm>
                    )}
                  </Space>
                </Col>
              </Row>
            </Card>

            <Alert
              message="Permission Management Info"
              description="System permissions cannot be deleted and are created during bootstrap. Custom permissions can only be deleted if they are not used by any roles."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Table
              dataSource={filteredPermissions}
              columns={columns}
              rowKey="permission_id"
              loading={loading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} permissions`,
              }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Create Permission Modal */}
      <Modal
        title="Create New Permission"
        open={createModalOpen}
        onOk={form.submit}
        onCancel={() => {
          setCreateModalOpen(false);
          form.resetFields();
        }}
        width={600}
        okText="Create Permission"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          autoComplete="off"
        >
          <Form.Item
            name="permission_id"
            label="Permission ID"
            rules={[
              { required: true, message: "Permission ID is required" },
              { 
                pattern: /^[a-zA-Z0-9_.]+$/, 
                message: "Permission ID can only contain letters, numbers, dots, and underscores" 
              },
            ]}
          >
            <Input placeholder="e.g., recruitment.candidates.create" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Display Name"
            rules={[{ required: true, message: "Display name is required" }]}
          >
            <Input placeholder="e.g., Create Candidates" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Description is required" }]}
          >
            <TextArea
              rows={3}
              placeholder="Describe what this permission allows users to do..."
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="resource"
                label="Resource"
                rules={[{ required: true, message: "Resource is required" }]}
              >
                <Input placeholder="e.g., candidates" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="action"
                label="Action"
                rules={[{ required: true, message: "Action is required" }]}
              >
                <Select placeholder="Select action">
                  <Select.Option value="create">Create</Select.Option>
                  <Select.Option value="read">Read</Select.Option>
                  <Select.Option value="write">Write</Select.Option>
                  <Select.Option value="update">Update</Select.Option>
                  <Select.Option value="delete">Delete</Select.Option>
                  <Select.Option value="*">All (*)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="scope"
            label="Scope"
            rules={[{ required: true, message: "Scope is required" }]}
          >
            <Select placeholder="Select scope">
              <Select.Option value="global">Global</Select.Option>
              <Select.Option value="app">Application-specific</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.scope !== currentValues.scope
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("scope") === "app" ? (
                <Form.Item
                  name="app_id"
                  label="Application ID"
                  rules={[{ required: true, message: "Application ID is required for app-scoped permissions" }]}
                >
                  <Input placeholder="e.g., antd_recruiter" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>

      {/* View Permission Modal */}
      <Modal
        title="Permission Details"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalOpen(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedPermission && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Permission ID">
              <Text code>{selectedPermission.permission_id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Name">
              <Text strong>{selectedPermission.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {selectedPermission.description}
            </Descriptions.Item>
            <Descriptions.Item label="Resource">
              <Tag color="cyan">{selectedPermission.resource}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Action">
              <Tag color="orange">{selectedPermission.action}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Scope">
              <Space>
                <Tag
                  icon={selectedPermission.scope === "global" ? <GlobalOutlined /> : <AppstoreOutlined />}
                  color={selectedPermission.scope === "global" ? "purple" : "green"}
                >
                  {selectedPermission.scope}
                </Tag>
                {selectedPermission.scope === "app" && selectedPermission.app_id && (
                  <Text>({selectedPermission.app_id})</Text>
                )}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag
                icon={<LockOutlined />}
                color={selectedPermission.is_system_permission ? "blue" : "default"}
              >
                {selectedPermission.is_system_permission ? "System Permission" : "Custom Permission"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Used by Roles">
              <Tag color={selectedPermission.roleCount > 0 ? "blue" : "default"}>
                {selectedPermission.roleCount} role{selectedPermission.roleCount !== 1 ? "s" : ""}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Created By">
              {selectedPermission.created_by}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {new Date(selectedPermission.created_at).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}