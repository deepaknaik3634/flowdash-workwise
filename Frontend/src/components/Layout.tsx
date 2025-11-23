import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  BarChart3,
  LogOut,
  Clock,
  PersonStanding,
  PersonStandingIcon,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  role?: "manager" | "operator";
}

export const Layout = ({ children, role }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    navigate("/");
  };

  const getNavItems = () => {
    if (!role) return [];

    const common = [
      { icon: LayoutDashboard, label: "Dashboard", path: `/${role}` },
    ];

    if (role === "manager") {
      return [
        ...common,
        // The path names need to be updated to match the components created earlier
        { icon: Users, label: "Employees", path: "/manager/tasks" }, // Uses EmployeeManagerDashboard
        { icon: BarChart3, label: "Performance", path: "/manager/performance" }, // Uses EmployeePerformanceDashboard
        { icon: FileText, label: "Reports", path: "/manager/reports" }, // Uses TeamReportsDashboard
        { icon: PersonStandingIcon, label: "My HRM", path: "/manager/hrm" }, // Uses TeamReportsDashboard
      ];
    }

    if (role === "operator") {
      return [
        ...common,
        { icon: Clock, label: "My Task", path: "/operator/timesheet" },
        { icon: PersonStanding, label: "My HRM", path: "/operator/hrm" },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-60 bg-[#2a00b7] text-white flex flex-col shadow-lg">
        {/* Logo */}
        <div className="flex items-center justify-center h-20 border-b border-white/20">
          <img
            src="https://i0.wp.com/dotspeaks.com/wp-content/uploads/2025/07/Dotspeaks-logo_bg.png?fit=2560%2C591&ssl=1"
            alt="Logo"
            className="w-40"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link key={item.path} to={item.path}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "bg-white text-[#2a00b7]" // active: white background, blue text
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 transition-colors duration-200 ${
                      isActive ? "text-red-500" : "text-white"
                    }`}
                  />
                  <span
                    className={`transition-colors duration-200 ${
                      isActive ? "text-[#2a00b7]" : "text-white"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer Section */}
        <div className="border-t border-white/20 p-4">
          <div className="bg-white/10 rounded-lg p-3 text-sm mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-white/80" />
              <span className="capitalize">{role}</span>
            </div>
            <p className="text-xs text-white/70 truncate">
              {localStorage.getItem("userEmail")}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-white hover:bg-red-600/80 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className={location.pathname.includes("/hrm") ? "pt-6 pl-2 pr-6" : "p-8"}>
          {children}
        </div>
      </main>
    </div>
  );
};
