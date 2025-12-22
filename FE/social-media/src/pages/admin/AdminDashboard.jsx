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

  const StatCard = ({ title, value, icon: Icon, color, bg }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? "..." : value}
          </h3>
        </div>
        <div className={`p-3 ${bg} ${color} rounded-xl`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          title="Total Posts"
          value={stats.totalPosts}
          icon={FileText}
          color="text-purple-600"
          bg="bg-purple-50"
        />
      </div>
    </div>
  );
}
