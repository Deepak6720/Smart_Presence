import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarDays,
  CalendarX,
  FileText,
  AlertTriangle,
  BarChart2,
  Camera,
  ClipboardList,
  History,
  CheckSquare,
  Calendar,
  Brain,
  Scan,
  LogOut,
  GraduationCap,
} from "lucide-react";

import toast from "react-hot-toast";

const navConfig = {
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { label: "User Management", icon: Users, path: "/admin/users" },
    { label: "Subjects", icon: BookOpen, path: "/admin/subjects" },
    { label: "Timetable", icon: CalendarDays, path: "/admin/timetable" },
    { label: "Holidays", icon: CalendarX, path: "/admin/holidays" },
    { label: "Reports", icon: FileText, path: "/admin/reports" },
    { label: "Anomaly Flags", icon: AlertTriangle, path: "/admin/anomalies" },
    { label: "Analytics", icon: BarChart2, path: "/admin/analytics" },
  ],
  teacher: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/teacher" },
    {
      label: "Face Attendance",
      icon: Camera,
      path: "/teacher/face-attendance",
    },
    {
      label: "Manual Attendance",
      icon: ClipboardList,
      path: "/teacher/manual-attendance",
    },
    { label: "Attendance History", icon: History, path: "/teacher/history" },
    { label: "Reports", icon: FileText, path: "/teacher/reports" },
    { label: "Anomaly Flags", icon: AlertTriangle, path: "/teacher/anomalies" },
  ],
  student: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/student" },
    { label: "My Attendance", icon: CheckSquare, path: "/student/attendance" },
    { label: "Timetable", icon: Calendar, path: "/student/timetable" },
    { label: "Calendar View", icon: CalendarDays, path: "/student/calendar" },
    { label: "AI Risk Prediction", icon: Brain, path: "/student/risk" },
    { label: "Face Registration", icon: Scan, path: "/student/face-register" },
  ],
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = navConfig[user?.role] || [];

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 flex-shrink-0">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-none">
              SmartPresence
            </p>
            <p className="text-xs text-gray-400 capitalize mt-0.5">
              {user?.role} Portal
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === `/${user?.role}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />

            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 overflow-hidden">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{user?.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
