import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  BarChart3,
  Users as UsersIcon,
} from "lucide-react";

import TeacherManagement from "@/components/admin/TeacherManagement";
import ExamScheduleManagement from "@/components/admin/ExamScheduleManagement";
import DutyAllocation from "@/components/admin/DutyAllocation";
import AdminOverview from "@/components/admin/AdminOverview";

const navItems = [
  {
    label: "Overview",
    href: "/admin",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: "Teachers",
    href: "/admin/teachers",
    icon: <Users className="h-4 w-4" />,
  },
  {
    label: "Exam Schedule",
    href: "/admin/exams",
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    label: "Duty Allocation",
    href: "/admin/allocation",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    label: "Fairness Dashboard",
    href: "/fairness-dashboard",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    label: "Contributors",
    href: "/contributors",
    icon: <UsersIcon className="h-4 w-4" />,
  },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout navItems={navItems} title="Dashboard">
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