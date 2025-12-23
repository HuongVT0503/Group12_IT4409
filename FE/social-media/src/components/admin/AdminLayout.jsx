import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, FileText, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold tracking-tight text-center border-b border-slate-700">
          Admin Panel
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavItem
            to="/admin/dashboard"
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
          />
          <NavItem to="/admin/users" icon={<Users size={20} />} label="Users" />
          <NavItem
            to="/admin/posts"
            icon={<FileText size={20} />}
            label="Posts"
          />
        </nav>
        <button
          onClick={handleLogout}
          className="p-4 flex items-center gap-3 text-red-400 hover:bg-slate-700 transition-colors"
        >
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}


const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? "bg-primary text-white"
          : "text-slate-400 hover:bg-slate-700 hover:text-white"
      }`
    }
  >
    {icon} <span>{label}</span>
  </NavLink>
);