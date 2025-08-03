"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Typography,
  Table,
  Button,
  Space,
  Tag,
  Avatar,
  Modal,
  Form,
  Select,
  Tooltip,
  Popconfirm,
  Input,
  App,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { PermissionGuard } from "@/components/guards";
import { UserRecord, RoleRecord, UserStatus } from "@/types/rbac";
import { userService, roleService } from "@/services/rbac";

const { Title, Text } = Typography;
const { Search } = Input;

interface UserWithRoles extends UserRecord {
  roleNames: string[];
}

export default function UsersPage() {
  const { message } = App.useApp();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [form] = Form.useForm();

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        userService.getAllUsers(),
        roleService.getAllRoles(),
      ]);

      // Enhance users with role names
      const usersWithRoles: UserWithRoles[] = usersData.map((user) => {
        const userRoleNames: string[] = [];

        // Add global role names
        user.global_roles.forEach((roleId) => {
          const role = rolesData.find((r) => r.role_id === roleId);
          if (role) userRoleNames.push(role.name);
        });

        // Add app role names
        Object.values(user.app_roles)
          .flat()
          .forEach((roleId) => {
            const role = rolesData.find((r) => r.role_id === roleId);
            if (role && !userRoleNames.includes(role.name)) {
              userRoleNames.push(role.name);
            }
          });

        return {
          ...user,
          roleNames: userRoleNames,
        };
      });

      setUsers(usersWithRoles);
      setRoles(rolesData);
    } catch (error) {
      console.error("Failed to load users:", error);
      message.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleEditUser = (user: UserWithRoles) => {
    setSelectedUser(user);
    form.setFieldsValue({
      status: user.status,
      global_roles: user.global_roles,
      is_super_admin: user.is_super_admin,
    });
    setEditModalVisible(true);
  };

  const handleUpdateUser = async (values: {
    status: string;
    global_roles: string[];
    is_super_admin: boolean;
  }) => {
    if (!selectedUser) return;

    try {
      await userService.updateUser(selectedUser.microsoft_oid, {
        status: values.status as UserStatus,
        is_super_admin: values.is_super_admin,
      });

      // Update roles if changed
      const currentGlobalRoles = selectedUser.global_roles;
      const newGlobalRoles = values.global_roles || [];

      // Remove roles that are no longer selected
      for (const roleId of currentGlobalRoles) {
        if (!newGlobalRoles.includes(roleId)) {
          await userService.removeRole({
            user_id: selectedUser.microsoft_oid,
            role_id: roleId,
          });
        }
      }

      // Add new roles
      for (const roleId of newGlobalRoles) {
        if (!currentGlobalRoles.includes(roleId)) {
          await userService.assignRole({
            user_id: selectedUser.microsoft_oid,
            role_id: roleId,
          });
        }
      }

      message.success("User updated successfully");
      setEditModalVisible(false);
      loadUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
      message.error("Failed to update user");
    }
  };

  const handleDeleteUser = async (user: UserWithRoles) => {
    try {
      await userService.deleteUser(user.microsoft_oid);
      message.success("User deleted successfully");
      loadUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      message.error("Failed to delete user");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "User",
      key: "user",
      render: (_: unknown, record: UserWithRoles) => (
        <Space>
          <Avatar src={record.profile_picture} icon={<UserOutlined />} size="large" />
          <div>
            <div>
              <Text strong>{record.name}</Text>
              {record.is_super_admin && (
                <Tooltip title="Super Administrator">
                  <CrownOutlined style={{ color: "#faad14", marginLeft: 8 }} />
                </Tooltip>
              )}
            </div>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colors = {
          active: "green",
          inactive: "orange",
          suspended: "red",
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Roles",
      key: "roles",
      render: (_: unknown, record: UserWithRoles) => (
        <Space wrap>
          {record.roleNames.map((roleName) => (
            <Tag key={roleName} color="blue">
              {roleName}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Last Login",
      dataIndex: "last_login",
      key: "last_login",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: UserWithRoles) => (
        <Space>
          <PermissionGuard resource="users" action="write" showFallback={false}>
            <Button icon={<EditOutlined />} onClick={() => handleEditUser(record)} size="small" />
          </PermissionGuard>
          <PermissionGuard resource="users" action="delete" showFallback={false}>
            <Popconfirm
              title="Delete User"
              description="Are you sure you want to delete this user?"
              onConfirm={() => handleDeleteUser(record)}
              okText="Yes"
              cancelText="No"
              disabled={record.is_super_admin}
            >
              <Button
                icon={<DeleteOutlined />}
                danger
                size="small"
                disabled={record.is_super_admin}
              />
            </Popconfirm>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  return (
    <PermissionGuard resource="users" action="read">
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
                  User Management
                </Title>
                <Text style={{ fontSize: "16px", color: "#64748b" }}>
                  Manage user accounts and permissions
                </Text>
              </div>
              <Space>
                <Search
                  placeholder="Search users..."
                  allowClear
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 300 }}
                />
                <Button icon={<ReloadOutlined />} onClick={loadUsers} loading={loading}>
                  Refresh
                </Button>
              </Space>
            </div>
          </Card>

          {/* Users Table */}
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
              dataSource={filteredUsers}
              rowKey="microsoft_oid"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
              }}
            />
          </Card>

          {/* Edit User Modal */}
          <Modal
            title="Edit User"
            open={editModalVisible}
            onCancel={() => setEditModalVisible(false)}
            onOk={() => form.submit()}
            width={600}
          >
            <Form form={form} layout="vertical" onFinish={handleUpdateUser}>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: "Please select a status" }]}
              >
                <Select>
                  <Select.Option value="active">Active</Select.Option>
                  <Select.Option value="inactive">Inactive</Select.Option>
                  <Select.Option value="suspended">Suspended</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="Global Roles" name="global_roles">
                <Select
                  mode="multiple"
                  placeholder="Select global roles"
                  options={roles
                    .filter((role) => role.scope === "global")
                    .map((role) => ({
                      label: role.name,
                      value: role.role_id,
                    }))}
                />
              </Form.Item>

              <PermissionGuard resource="system" action="admin" showFallback={false}>
                <Form.Item
                  label="Super Administrator"
                  name="is_super_admin"
                  valuePropName="checked"
                >
                  <Select>
                    <Select.Option value={false}>No</Select.Option>
                    <Select.Option value={true}>Yes</Select.Option>
                  </Select>
                </Form.Item>
              </PermissionGuard>
            </Form>
          </Modal>
        </div>
      </div>
    </PermissionGuard>
  );
}
