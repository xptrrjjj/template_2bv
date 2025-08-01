'use client';

import React from 'react';
import { Card, Skeleton, Row, Col, Space } from 'antd';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
    }}>
      {/* Header Skeleton */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '20px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <Skeleton.Input style={{ width: 200, height: 24 }} active />
          <div style={{ marginTop: '8px' }}>
            <Skeleton.Input style={{ width: 300, height: 14 }} active />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Skeleton.Avatar size={40} active />
          <Skeleton.Button style={{ width: 80, height: 40 }} active />
        </div>
      </div>

      {/* Content Skeleton */}
      <div style={{ padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Welcome Card Skeleton */}
          <Card
            style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              marginBottom: '32px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
            styles={{ body: { padding: '40px' } }}
          >
            <Row align="middle">
              <Col flex="1">
                <Skeleton.Input style={{ width: 400, height: 32 }} active />
                <div style={{ marginTop: '16px' }}>
                  <Skeleton.Input style={{ width: 500, height: 16 }} active />
                </div>
              </Col>
              <Col>
                <Skeleton.Avatar size={100} shape="square" active />
              </Col>
            </Row>
          </Card>

          {/* Stats Cards Skeleton */}
          <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
            {[1, 2, 3, 4].map((i) => (
              <Col xs={24} sm={12} lg={6} key={i}>
                <Card
                  style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                  styles={{ body: { padding: '24px' } }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Skeleton.Avatar size={48} shape="square" active />
                    <Skeleton.Input style={{ width: 120, height: 14 }} active />
                    <Skeleton.Input style={{ width: 80, height: 28 }} active />
                    <Skeleton.Input style={{ width: 100, height: 13 }} active />
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Main Content Skeleton */}
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card
                style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
                styles={{ body: { padding: '24px' } }}
              >
                <Skeleton.Input style={{ width: 200, height: 16 }} active />
                <div style={{ marginTop: '24px' }}>
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} style={{
                        padding: '16px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', gap: '16px' }}>
                            <Skeleton.Avatar size={8} active />
                            <div>
                              <Skeleton.Input style={{ width: 200, height: 16 }} active />
                              <div style={{ marginTop: '8px' }}>
                                <Skeleton.Input style={{ width: 150, height: 14 }} active />
                              </div>
                            </div>
                          </div>
                          <Skeleton.Input style={{ width: 60, height: 12 }} active />
                        </div>
                      </div>
                    ))}
                  </Space>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
                styles={{ body: { padding: '24px' } }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <Skeleton.Input style={{ width: 120, height: 16 }} active />
                  <Skeleton.Button style={{ width: 80, height: 32 }} active />
                </div>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <Skeleton.Input style={{ width: 150, height: 14 }} active />
                    <div style={{ marginTop: '8px' }}>
                      <Skeleton.Input style={{ width: '100%', height: 8 }} active />
                    </div>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <Skeleton.Input style={{ width: 130, height: 14 }} active />
                    <div style={{ marginTop: '8px' }}>
                      <Skeleton.Input style={{ width: '100%', height: 8 }} active />
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};