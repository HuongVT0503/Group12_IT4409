import { useEffect, useState } from "react";
import { Users, FileText } from "lucide-react";
import { getAdminStats } from "../../services/adminService";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await getAdminStats();
      setStats(res.data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, iconColor, iconBgColor }) => (
    <div
      className="p-6 rounded-2xl border shadow-sm"
      style={{
        backgroundColor: "var(--admin-card-bg)",
        borderColor: "var(--admin-card-border)",
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--admin-text-secondary)" }}
          >
            {title}
          </p>
          <h3
            className="text-3xl font-bold mt-2"
            style={{ color: "var(--admin-text-primary)" }}
          >
            {loading ? "..." : value}
          </h3>
        </div>
        <div
          className={`p-3 rounded-xl`}
          style={{ backgroundColor: iconBgColor, color: iconColor }}
        >
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h1
        className="text-2xl font-bold"
        style={{ color: "var(--admin-text-primary)" }}
      >
        Dashboard Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          iconColor="#2563eb"
          iconBgColor="rgba(59, 130, 246, 0.1)"
        />
        <StatCard
          title="Total Posts"
          value={stats.totalPosts}
          icon={FileText}
          iconColor="#9333ea"
          iconBgColor="rgba(147, 51, 234, 0.1)"
        />
      </div>
    </div>
  );
}
