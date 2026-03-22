import DashboardLayout from '@/components/layout/DashboardLayout';
import { LayoutDashboard, ClipboardList, CalendarDays, Bell, History } from 'lucide-react';
import TeacherDuties from '@/components/teacher/TeacherDuties';
import TeacherAvailability from '@/components/teacher/TeacherAvailability';
import TeacherOverview from '@/components/teacher/TeacherOverview';

const navItems = [
  { label: 'Overview', href: '/teacher', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'My Duties', href: '/teacher/duties', icon: <ClipboardList className="h-4 w-4" /> },
  { label: 'Availability', href: '/teacher/availability', icon: <CalendarDays className="h-4 w-4" /> },
];

export default function TeacherDashboard() {
  return (
    <DashboardLayout navItems={navItems} title="Teacher Dashboard">
      <TeacherOverview />
    </DashboardLayout>
  );
}

export function TeacherDutiesPage() {
  return (
    <DashboardLayout navItems={navItems} title="My Duties">
      <TeacherDuties />
    </DashboardLayout>
  );
}

export function TeacherAvailabilityPage() {
  return (
    <DashboardLayout navItems={navItems} title="Availability & Leave">
      <TeacherAvailability />
    </DashboardLayout>
  );
}
