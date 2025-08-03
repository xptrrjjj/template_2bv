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
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined,
  ReloadOutlined,
  GlobalOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { PermissionGuard } from "@/components/guards";
import { useAuth } from "@/contexts/AuthContext";
import { RoleRecord, PermissionRecord, CreateRoleRequest } from "@/types/rbac";
import { roleService, permissionService } from "@/services/rbac";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface RoleWithDetails extends RoleRecord {
  permissionNames: string[];
  userCount: number;
}

export default function RolesPage() {
  const { message } = App.useApp();
  const { rbacUser } = useAuth();
  const [roles, setRoles] = useState<RoleWithDetails[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithDetails | null>(null);
  const [form] = Form.useForm();

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData] = await Promise.all([
        roleService.getAllRoles(),
        permissionService.getAllPermissions(),
      ]);

      // Enhance roles with permission names and user counts
      const rolesWithDetails: RoleWithDetails[] = rolesData.map((role) => {
        const rolePermissions = role.permission_ids
          .map((permId) => permissionsData.find((p) => p.permission_id === permId))
          .filter(Boolean) as PermissionRecord[];

        return {
          ...role,
          permissionNames: rolePermissions.map((p) => p.name),
          userCount: 0, // TODO: Implement actual user count
        };
      });

      setRoles(rolesWithDetails);
      setPermissions(permissionsData);
    } catch (error) {
      console.error("Failed to load roles:", error);
      message.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleCreateRole = async (values: {
    role_id: string;
    name: string;
    description: string;
    scope: "global" | "app";
    app_id?: string;
    permission_ids: string[];
  }) => {
    try {
      const roleRequest: CreateRoleRequest = {
        role_id: values.role_id,
        name: values.name,
        description: values.description,
        scope: values.scope,
        app_id: values.scope === "app" ? values.app_id : undefined,
        permission_ids: values.permission_ids || [],
      };

      await roleService.createRole(roleRequest, rbacUser?.microsoft_oid || "");
      message.success("Role created successfully");
      setCreateModalVisible(false);
      form.resetFields();
      loadRoles();
    } catch (error) {
      console.error("Failed to create role:", error);
      message.error("Failed to create role");
    }
  };

  const handleEditRole = (role: RoleWithDetails) => {
    setSelectedRole(role);
    form.setFieldsValue({
      name: role.name,
      description: role.description,
      permission_ids: role.permission_ids,
    });
    setEditModalVisible(true);
  };

  const handleUpdateRole = async (values: {
    name: string;
    description: string;
    permission_ids: string[];
  }) => {
    if (!selectedRole) return;

    try {
      await roleService.updateRole(
        selectedRole.role_id,
        {
          name: values.name,
          description: values.description,
          permission_ids: values.permission_ids,
        },
        rbacUser?.microsoft_oid || ""
      );

      message.success("Role updated successfully");
      setEditModalVisible(false);
      loadRoles();
    } catch (error) {
      console.error("Failed to update role:", error);
      message.error("Failed to update role");
    }
  };

  const handleDeleteRole = async (role: RoleWithDetails) => {
    try {
      await roleService.deleteRole(role.role_id, rbacUser?.microsoft_oid || "");
      message.success("Role deleted successfully");
      loadRoles();
    } catch (error) {
      console.error("Failed to delete role:", error);
      message.error("Failed to delete role");
    }
  };

  const handleViewRole = (role: RoleWithDetails) => {
    setSelectedRole(role);
    setViewModalVisible(true);
  };

  const columns = [
    {
      title: "Role",
      key: "role",
      render: (_: unknown, record: RoleWithDetails) => (
        <Space direction="vertical" size="small">
          <div>
            <Text strong>{record.name}</Text>
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              <Tag
                icon={record.scope === "global" ? <GlobalOutlined /> : <AppstoreOutlined />}
                color={record.scope === "global" ? "blue" : "green"}
              >
                {record.scope === "global" ? "Global" : `App: ${record.app_id}`}
              </Tag>
              {record.is_system_role && <Tag color="orange">System</Tag>}
            </div>
          </div>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.description}
          </Text>
        </Space>
      ),
    },
    {
      title: "Permissions",
      key: "permissions",
      render: (_: unknown, record: RoleWithDetails) => (
        <Space direction="vertical" size="small">
          <Text>{record.permission_ids.length} permissions</Text>
          <div>
            {record.permissionNames.slice(0, 3).map((name) => (
              <Tag key={name}>{name}</Tag>
            ))}
            {record.permissionNames.length > 3 && (
              <Tag>+{record.permissionNames.length - 3} more</Tag>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Users",
      dataIndex: "userCount",
      key: "userCount",
      render: (count: number) => <Text>{count} users</Text>,
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: RoleWithDetails) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => handleViewRole(record)} />
          <PermissionGuard resource="roles" action="write" showFallback={false}>
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEditRole(record)}
              disabled={record.is_system_role}
            />
          </PermissionGuard>
          <PermissionGuard resource="roles" action="delete" showFallback={false}>
            <Popconfirm
              title="Delete Role"
              description="Are you sure you want to delete this role?"
              onConfirm={() => handleDeleteRole(record)}
              okText="Yes"
              cancelText="No"
              disabled={record.is_system_role}
            >
              <Button icon={<DeleteOutlined />} danger disabled={record.is_system_role} />
            </Popconfirm>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  return (
    <PermissionGuard resource="roles" action="read">
      <div style={{ padding: "32px", background: "#f8fafc", minHeight: "100vh" }}>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <Title level={2} style={{ margin: 0, color: "#1a202c" }}>
                  Role Management
                </Title>
                <Text style={{ fontSize: "16px", color: "#64748b" }}>
                  Create and manage system roles and permissions
                </Text>
              </div>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={loadRoles} loading={loading}>
                  Refresh
                </Button>
                <PermissionGuard resource="roles" action="write" showFallback={false}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalVisible(true)}
                    style={{
                      background: "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
                      border: "none",
                    }}
                  >
                    Create Role
                  </Button>
                </PermissionGuard>
              </Space>
            </div>
          </Card>

          {/* Roles Table */}
          <Card
            style={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Table
              columns={columns}
              dataSource={roles}
              rowKey="role_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} roles`,
              }}
            />
          </Card>

          {/* Create Role Modal */}
          <Modal
            title="Create New Role"
            open={createModalVisible}
            onCancel={() => {
              setCreateModalVisible(false);
              form.resetFields();
            }}
            onOk={() => form.submit()}
            width={700}
          >
            <Form form={form} layout="vertical" onFinish={handleCreateRole}>
              <Form.Item
                label="Role ID"
                name="role_id"
                rules={[
                  { required: true, message: "Please enter role ID" },
                  {
                    pattern: /^[a-z0-9_]+$/,
                    message: "Only lowercase letters, numbers, and underscores allowed",
                  },
                ]}
              >
                <Input placeholder="e.g., custom_admin" />
              </Form.Item>

              <Form.Item
                label="Role Name"
                name="name"
                rules={[{ required: true, message: "Please enter role name" }]}
              >
                <Input placeholder="e.g., Custom Administrator" />
              </Form.Item>

              <Form.Item
                label="Description"
                name="description"
                rules={[{ required: true, message: "Please enter description" }]}
              >
                <TextArea rows={3} placeholder="Describe the role's purpose and responsibilities" />
              </Form.Item>

              <Form.Item
                label="Scope"
                name="scope"
                rules={[{ required: true, message: "Please select scope" }]}
              >
                <Select placeholder="Select role scope">
                  <Select.Option value="global">Global (System-wide)</Select.Option>
                  <Select.Option value="app">Application-specific</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Application ID"
                name="app_id"
                dependencies={["scope"]}
                rules={[
                  ({ getFieldValue }) => ({
                    required: getFieldValue("scope") === "app",
                    message: "Please enter application ID for app-scoped roles",
                  }),
                ]}
              >
                <Input placeholder="e.g., recruitment_tool" />
              </Form.Item>

              <Form.Item label="Permissions" name="permission_ids">
                <Select
                  mode="multiple"
                  placeholder="Select permissions"
                  options={permissions.map((permission) => ({
                    label: `${permission.name} (${permission.permission_id})`,
                    value: permission.permission_id,
                  }))}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Form>
          </Modal>

          {/* Edit Role Modal */}
          <Modal
            title="Edit Role"
            open={editModalVisible}
            onCancel={() => setEditModalVisible(false)}
            onOk={() => form.submit()}
            width={700}
          >
            <Form form={form} layout="vertical" onFinish={handleUpdateRole}>
              <Form.Item
                label="Role Name"
                name="name"
                rules={[{ required: true, message: "Please enter role name" }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Description"
                name="description"
                rules={[{ required: true, message: "Please enter description" }]}
              >
                <TextArea rows={3} />
              </Form.Item>

              <Form.Item label="Permissions" name="permission_ids">
                <Select
                  mode="multiple"
                  placeholder="Select permissions"
                  options={permissions.map((permission) => ({
                    label: `${permission.name} (${permission.permission_id})`,
                    value: permission.permission_id,
                  }))}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Form>
          </Modal>

          {/* View Role Modal */}
          <Modal
            title="Role Details"
            open={viewModalVisible}
            onCancel={() => setViewModalVisible(false)}
            footer={[
              <Button key="close" onClick={() => setViewModalVisible(false)}>
                Close
              </Button>,
            ]}
            width={700}
          >
            {selectedRole && (
              <div>
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Role ID">{selectedRole.role_id}</Descriptions.Item>
                  <Descriptions.Item label="Name">{selectedRole.name}</Descriptions.Item>
                  <Descriptions.Item label="Description">
                    {selectedRole.description}
                  </Descriptions.Item>
                  <Descriptions.Item label="Scope">
                    <Tag
                      icon={
                        selectedRole.scope === "global" ? <GlobalOutlined /> : <AppstoreOutlined />
                      }
                      color={selectedRole.scope === "global" ? "blue" : "green"}
                    >
                      {selectedRole.scope === "global" ? "Global" : `App: ${selectedRole.app_id}`}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="System Role">
                    {selectedRole.is_system_role ? "Yes" : "No"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created">
                    {new Date(selectedRole.created_at).toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created By">
                    {selectedRole.created_by}
                  </Descriptions.Item>
                </Descriptions>

                <Divider>Permissions ({selectedRole.permission_ids.length})</Divider>
                <Space wrap>
                  {selectedRole.permissionNames.map((name) => (
                    <Tag key={name}>{name}</Tag>
                  ))}
                </Space>
              </div>
            )}
          </Modal>
        </div>
      </div>
    </PermissionGuard>
  );
}
