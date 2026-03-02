// src/pages/ProjectManagementPage.tsx
import React from 'react';
import PageShell from '../components/Layout/PageShell';
import SideNav from '../components/Layout/SideNav';

export default function ProjectManagementPage() {
  return (
    <div className="h-screen flex bg-[var(--ws-page-bg)]">
      <SideNav />
      <PageShell>
        <div className="p-6">
          <div className="ws-card ws-card-elevated">
            <div className="ws-card-header">
              <h3 className="text-sm font-semibold">Project Management</h3>
            </div>
            <div className="ws-card-body">
              <p className="text-sm ws-muted">
                This page is reserved for execution/operations (work queues, status, assignments,
                timelines, etc.). You can add widgets later—kept separate from{' '}
                <strong>Project Structure</strong> by design.
              </p>
            </div>
          </div>
        </div>
      </PageShell>
    </div>
  );
}
