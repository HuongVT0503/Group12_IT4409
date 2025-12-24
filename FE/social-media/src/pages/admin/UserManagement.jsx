import { useEffect, useState } from "react";
import {
  getAllUsers,
  banUser,
  getReports,
  dismissReport,
} from "../../services/adminService";
import {
  Search,
  ShieldAlert,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Avatar from "../../components/common/Avatar";
//import Button from "../../components/common/ButtonComponent";
import { formatDistanceToNow } from "date-fns";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [activeTab, setActiveTab] = useState("reports"); //or users
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]); //refresh when switch tab

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, reportsRes] = await Promise.all([
        getAllUsers(),
        getReports(),
      ]);
      setUsers(usersRes.data);
      //filter USER reports
      const userReports = reportsRes.data.filter(
        (r) => r.targetType === "User"
      );
      setReports(userReports);
    } catch (error) {
      console.error("Failed to fetch admin data", error);
    } finally {
      setLoading(false);
    }
  };

  // const fetchUsers = async () => {
  //   try {
  //     const res = await getAllUsers();
  //     setUsers(res.data);
  //   } catch (error) {
  //     console.error("Failed to fetch users", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleBanAndDismiss = async (report) => {
    if (!confirm(`Ban user ${report.targetId} and close this report?`)) return;

    try {
      await banUser(report.targetId, true);

      await dismissReport(report.reportId);

      setReports((prev) => prev.filter((r) => r.reportId !== report.reportId));
      alert("User banned and report closed.");
    } catch (error) {
      console.error(error);
      alert("Action failed.");
    }
  };

  const handleRejectReport = async (reportId) => {
    if (!confirm("Reject this report? The user will remain active.")) return;

    try {
      await dismissReport(reportId);
      setReports((prev) => prev.filter((r) => r.reportId !== reportId));
    } catch (error) {
      console.error(error);
      alert("Failed to dismiss report");
    }
  };

  const handleBanToggle = async (user) => {
    const action = user.isBanned ? "unban" : "ban";
    if (!confirm(`Are you sure you want to  ${action} ${user.username}?`))
      return;

    try {
      await banUser(user.userId, !user.isBanned);

      setUsers((prev) =>
        prev.map((u) =>
          u.userId === user.userId ? { ...u, isBanned: !u.isBanned } : u
        )
      );
    } catch (error) {
      console.log(error);
      alert("Failed to update user status");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-500 text-sm">
            Manage accounts and review reported users.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === "reports"
                ? "bg-white text-red-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Reported Users ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === "users"
                ? "bg-white text-primary text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All Users
          </button>
        </div>
      </div>

      {/*repoted users*/}
      {activeTab === "reports" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm animate-in fade-in">
          <div className="p-4 border-b border-gray-100 bg-red-50/50">
            <h3 className="font-bold text-red-800 flex items-center gap-2">
              <ShieldAlert size={20} /> Pending Actions
            </h3>
          </div>
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4">Report Details</th>
                <th className="px-6 py-4">Reporter</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center">
                    Loading...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No pending user reports. Good job!
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.reportId} className="hover:bg-gray-50/80">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">
                            Reported User ID: {report.targetId}
                          </div>
                          <div className="text-red-600 font-medium text-xs bg-red-50 px-2 py-0.5 rounded inline-block mt-1">
                            Reason: {report.reason}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {report.fromUser}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        if (!report.createdAt) return "-";
                        try {
                          return (
                            formatDistanceToNow(new Date(report.createdAt)) +
                            " ago"
                          );
                        } catch (e) {
                          console.error("Date error:", report.createdAt, e);
                          return "Unknown date";
                        }
                      })()}{" "}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        {/*REJECT*/}
                        <button
                          onClick={() => handleRejectReport(report.reportId)}
                          className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-xs font-bold"
                          title="Dismiss report (keep user active)"
                        >
                          <CheckCircle size={16} /> Ignore
                        </button>

                        {/* BAN*/}
                        <button
                          onClick={() => handleBanAndDismiss(report)}
                          className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs font-bold shadow-sm"
                          title="Ban User and Close Report"
                        >
                          <XCircle size={16} /> Ban User
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/*all users list*/}
      {activeTab === "users" && (
        <>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white shadow-sm"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm animate-in fade-in">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.userId}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="px-6 py-4 flex items-center gap-3">
                        <Avatar
                          src={`https://ui-avatars.com/api/?name=${user.username}`}
                          size={9}
                        />
                        <div>
                          <div className="font-semibold text-gray-900">
                            {user.username}
                          </div>
                          <div className="text-xs text-gray-400">
                            {user.email || "No email"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 capitalize">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.isBanned ? (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold flex items-center w-fit gap-1">
                            <XCircle size={12} /> Banned
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold flex items-center w-fit gap-1">
                            <UserCheck size={12} /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.role !== "admin" && (
                          <button
                            onClick={() => handleBanToggle(user)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border ${
                              user.isBanned
                                ? "bg-white border-green-200 text-green-600 hover:bg-green-50"
                                : "bg-white border-red-200 text-red-600 hover:bg-red-50"
                            }`}
                          >
                            {user.isBanned ? "Unban User" : "Ban User"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
