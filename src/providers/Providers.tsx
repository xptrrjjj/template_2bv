'use client';

import '@ant-design/v5-patch-for-react-19';
import React, { ReactNode } from 'react';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { ConfigProvider, App } from 'antd';
import { AuthProvider } from '@/contexts/AuthContext';
import { msalConfig } from '@/config/msalConfig';

const msalInstance = new PublicClientApplication(msalConfig);

interface ProvidersProps {
  children: ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <MsalProvider instance={msalInstance}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1890ff',
          },
        }}
      >
        <App>
          <AuthProvider>
            {children}
          </AuthProvider>
        </App>
      </ConfigProvider>
    </MsalProvider>
  );
};