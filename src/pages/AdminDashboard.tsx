import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, Calendar, ClipboardList, TrendingUp, FlaskConical, WandSparkles, ShieldAlert, Database } from 'lucide-react';
import TeacherManagement from '@/components/admin/TeacherManagement';
import ExamScheduleManagement from '@/components/admin/ExamScheduleManagement';
import DutyAllocation from '@/components/admin/DutyAllocation';
import AdminOverview from '@/components/admin/AdminOverview';
import FairnessAnalytics from '@/components/admin/FairnessAnalytics';
import AllocationSimulation from '@/components/admin/AllocationSimulation';
import RuleManagement from '@/components/admin/RuleManagement';
import ConflictDetection from '@/components/admin/ConflictDetection';
import DataManagementHub from '@/components/admin/DataManagementHub';

const navItems = [
  { label: 'Overview', href: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Teachers', href: '/admin/teachers', icon: <Users className="h-4 w-4" /> },
  { label: 'Exam Schedule', href: '/admin/exams', icon: <Calendar className="h-4 w-4" /> },
  { label: 'Duty Allocation', href: '/admin/allocation', icon: <ClipboardList className="h-4 w-4" /> },
  { label: 'Fairness Analytics', href: '/admin/fairness', icon: <TrendingUp className="h-4 w-4" /> },
  { label: 'Simulation', href: '/admin/simulation', icon: <FlaskConical className="h-4 w-4" /> },
  { label: 'Rule Management', href: '/admin/rules', icon: <WandSparkles className="h-4 w-4" /> },
  { label: 'Conflict Detection', href: '/admin/conflicts', icon: <ShieldAlert className="h-4 w-4" /> },
  { label: 'Data Hub', href: '/admin/data-hub', icon: <Database className="h-4 w-4" /> },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout navItems={navItems} title="Admin Dashboard">
      <AdminOverview />
    </DashboardLayout>
  );
}

export function AdminTeachersPage() {
  return (
    <DashboardLayout navItems={navItems} title="Teacher Management">
      <TeacherManagement />
    </DashboardLayout>
  );
}

export function AdminExamsPage() {
  return (
    <DashboardLayout navItems={navItems} title="Exam Schedule">
      <ExamScheduleManagement />
    </DashboardLayout>
  );
}

export function AdminAllocationPage() {
  return (
    <DashboardLayout navItems={navItems} title="Duty Allocation">
      <DutyAllocation />
    </DashboardLayout>
  );
}

export function AdminFairnessPage() {
  return (
    <DashboardLayout navItems={navItems} title="Fairness Analytics">
      <FairnessAnalytics />
    </DashboardLayout>
  );
}

export function AdminSimulationPage() {
  return (
    <DashboardLayout navItems={navItems} title="Allocation Simulation">
      <AllocationSimulation />
    </DashboardLayout>
  );
}

export function AdminRuleManagementPage() {
  return (
    <DashboardLayout navItems={navItems} title="Dynamic Rule Management">
      <RuleManagement />
    </DashboardLayout>
  );
}

export function AdminConflictDetectionPage() {
  return (
    <DashboardLayout navItems={navItems} title="Real-Time Conflict Detection">
      <ConflictDetection />
    </DashboardLayout>
  );
}

export function AdminDataHubPage() {
  return (
    <DashboardLayout navItems={navItems} title="Centralized Data Hub">
      <DataManagementHub />
    </DashboardLayout>
  );
}
