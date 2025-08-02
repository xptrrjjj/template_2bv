# Recruitment Tool with RBAC

A modern recruitment application built with Next.js 14, featuring comprehensive Role-Based Access Control (RBAC) system and Microsoft Authentication integration.

## 🚀 Features

- **Microsoft Authentication**: Seamless SSO integration with Microsoft Azure AD
- **Role-Based Access Control (RBAC)**: Comprehensive permission management system
- **User Management**: Create, update, and manage user accounts and roles
- **Role Management**: Define custom roles with granular permissions
- **System Administration**: Bootstrap and manage the RBAC system
- **Datastore Integration**: Built-in API for data operations
- **Modern UI**: Clean, responsive design with Ant Design components

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI Framework**: Ant Design
- **Authentication**: Microsoft Authentication Library (MSAL)
- **State Management**: React Context API
- **Styling**: CSS-in-JS with Ant Design theming

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Administration pages
│   ├── dashboard/         # Main dashboard
│   ├── datastore/         # Datastore testing interface
│   └── login/             # Authentication page
├── components/            # Reusable React components
│   ├── auth/              # Authentication components
│   ├── guards/            # RBAC permission guards
│   └── navigation/        # Navigation components
├── contexts/              # React contexts
├── hooks/                 # Custom React hooks
├── services/              # API and business logic
│   └── rbac/              # RBAC service layer
├── types/                 # TypeScript type definitions
└── config/                # Configuration files
```

## 🔧 Setup & Installation

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Microsoft Azure AD application (for authentication)

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Microsoft Authentication
NEXT_PUBLIC_MSAL_CLIENT_ID=your_client_id
NEXT_PUBLIC_MSAL_AUTHORITY=https://login.microsoftonline.com/your_tenant_id
NEXT_PUBLIC_MSAL_REDIRECT_URI=http://localhost:3000

# API Configuration
NEXT_PUBLIC_API_BASE_URL=your_api_base_url

# RBAC Configuration
NEXT_PUBLIC_APP_ID=recruitment_tool
NEXT_PUBLIC_APP_NAME=Recruitment Tool
NEXT_PUBLIC_DEFAULT_ROLE=app_viewer
NEXT_PUBLIC_AUTO_PROVISION_USERS=true
NEXT_PUBLIC_REQUIRE_EXPLICIT_ACCESS=false
```

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd antd-recruiter
```

2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔐 RBAC System

The application features a comprehensive Role-Based Access Control system with the following components:

### Core Concepts

- **Users**: Individual accounts with Microsoft authentication
- **Roles**: Collections of permissions that can be assigned to users
- **Permissions**: Granular access rights to specific resources and actions
- **Applications**: Logical groupings for multi-tenant scenarios

### Permission Structure

Permissions follow the pattern: `{scope}.{resource}.{action}`

- **Scope**: `system` (global) or `{app_id}` (application-specific)
- **Resource**: The entity being accessed (e.g., `users`, `roles`, `data`)
- **Action**: The operation being performed (e.g., `read`, `write`, `delete`)

### Default Roles

- **Super Admin**: Full system access (`system.*`)
- **Admin**: Application administration (`{app_id}.*`)
- **User Manager**: User management permissions
- **Viewer**: Read-only access

## 📊 Datastore API

The application includes a built-in datastore API for data operations. See [DATASTORE.md](./DATASTORE.md) for detailed usage instructions.

## 🛡️ Security Features

- Microsoft Azure AD authentication
- JWT token-based authorization
- Role-based permission checking
- Protected routes and components
- Secure API communication
- Session management

## 🎨 UI Components

### Navigation

- Responsive sidebar with role-based menu filtering
- Smooth transitions between pages
- User profile management

### Administration

- User management interface
- Role creation and assignment
- System health monitoring
- Bootstrap utilities

### Guards & Protection

- `ProtectedRoute`: Requires authentication
- `PermissionGuard`: Requires specific permissions
- `AdminOnly`: Restricts to admin users
- `SuperAdminOnly`: Restricts to super administrators

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment-Specific Configuration

Ensure all environment variables are properly configured for your target environment.

## 📚 Additional Documentation

- [Datastore Usage Guide](./.docs/DATASTORE.md) - Comprehensive guide for using the Datastore API
- [RBAC Implementation Details](./.docs/RBAC.md) - Complete RBAC system documentation
- [Authentication Setup](./.docs/AUTH.md) - Microsoft Azure AD authentication setup guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
