import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  children: ReactNode;
  navItems?: NavItem[];
  title?: string;
}

export default function DashboardLayout({
  children,
  navItems = [],
  title,
}: DashboardLayoutProps) {
  const { signOut, user } = useAuth();

  return (
    <div className="flex min-h-screen bg-muted/40">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between">

        {/* Top section */}
        <div>
          {/* Logo */}
          <div className="px-6 py-5 text-lg font-semibold border-b border-slate-700">
            Exam Duty AI
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2 px-3 py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-2 text-sm transition-all
                  ${isActive
                    ? "bg-indigo-500 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom section (User + Logout) */}
        <div className="border-t border-slate-700 p-4">

          <div className="text-sm text-slate-300 mb-3">
            Logged in as
            <div className="font-medium text-white">
              {user?.name || "Administrator"}
            </div>
          </div>

          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300"
          >
            <LogOut size={16} />
            Sign Out
          </button>

        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-6 py-6">

        {/* Page title */}
        {title && (
          <div className="text-2xl font-semibold mb-6">
            {title}
          </div>
        )}

        {children}

      </main>

    </div>
  );
}