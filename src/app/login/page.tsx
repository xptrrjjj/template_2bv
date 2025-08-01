'use client';

import React, { useEffect } from 'react';
import { Card, Typography, Space, Row, Col } from 'antd';
import { UserOutlined, SafetyCertificateOutlined, TeamOutlined } from '@ant-design/icons';
import { LoginButton } from '@/components/auth/LoginButton';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const { Title, Paragraph, Text } = Typography;

export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  // Don't render login page if already authenticated
  if (!loading && isAuthenticated) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      padding: '20px',
    }}>
      <Row style={{ width: '100%', minHeight: '100vh' }} align="middle">
        <Col xs={24} lg={12} style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          padding: '40px',
          color: 'white'
        }}>
          <div style={{ maxWidth: '500px' }}>
            <Title level={1} style={{ 
              color: 'white', 
              fontSize: '3.5rem',
              fontWeight: '700',
              marginBottom: '24px',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              Recruitment
            </Title>
            <Title level={2} style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: '2.2rem',
              fontWeight: '300',
              marginBottom: '32px'
            }}>
              Management System
            </Title>
            <Paragraph style={{ 
              color: 'rgba(255,255,255,0.8)', 
              fontSize: '1.2rem',
              marginBottom: '40px',
              lineHeight: '1.6'
            }}>
              Streamline your hiring process with our comprehensive recruitment platform. 
              Manage candidates, track applications, and make better hiring decisions.
            </Paragraph>
            
            <Space direction="vertical" size="large">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <UserOutlined style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)' }} />
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
                  Candidate Management
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <SafetyCertificateOutlined style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)' }} />
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
                  Secure Microsoft Authentication
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <TeamOutlined style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)' }} />
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
                  Team Collaboration
                </Text>
              </div>
            </Space>
          </div>
        </Col>
        
        <Col xs={24} lg={12} style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: '40px'
        }}>
          <Card 
            style={{ 
              maxWidth: '450px', 
              width: '100%',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              padding: '20px'
            }}
            styles={{ body: { padding: '40px' } }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
              <div>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
                }}>
                  <UserOutlined style={{ fontSize: '32px', color: 'white' }} />
                </div>
                
                <Title level={2} style={{ 
                  color: '#2c3e50',
                  marginBottom: '8px',
                  fontWeight: '600'
                }}>
                  Welcome Back
                </Title>
                <Paragraph style={{ 
                  color: '#7f8c8d',
                  fontSize: '16px',
                  marginBottom: '32px'
                }}>
                  Sign in with your Microsoft account to access your recruitment dashboard
                </Paragraph>
              </div>
              
              <LoginButton />
              
              <div style={{ marginTop: '24px' }}>
                <Text style={{ 
                  color: '#95a5a6',
                  fontSize: '14px'
                }}>
                  Secured by Microsoft Azure Active Directory
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}