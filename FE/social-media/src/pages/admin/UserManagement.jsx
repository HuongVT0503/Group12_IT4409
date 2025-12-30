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
  // User,
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
    if (
      !confirm(
        `Ban user ${
          report.targetUsername || report.targetId
        } and close this report?`
      )
    )
      return;

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
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--admin-text-primary)" }}
          >
            User Management
          </h1>
          <p
            className="text-sm"
            style={{ color: "var(--admin-text-secondary)" }}
          >
            Manage accounts and review reported users.
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          className="p-1 rounded-lg flex gap-1"
          style={{ backgroundColor: "var(--admin-table-header-bg)" }}
        >
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all`}
            style={{
              backgroundColor:
                activeTab === "reports"
                  ? "var(--admin-card-bg)"
                  : "transparent",
              color:
                activeTab === "reports"
                  ? "#ef4444"
                  : "var(--admin-text-secondary)",
              boxShadow:
                activeTab === "reports"
                  ? "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  : "none",
            }}
          >
            Reported Users ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all`}
            style={{
              backgroundColor:
                activeTab === "users" ? "var(--admin-card-bg)" : "transparent",
              color:
                activeTab === "users"
                  ? "#3b82f6"
                  : "var(--admin-text-secondary)",
              boxShadow:
                activeTab === "users"
                  ? "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  : "none",
            }}
          >
            All Users
          </button>
        </div>
      </div>

      {/*repoted users*/}
      {activeTab === "reports" && (
        <div
          className="rounded-xl border overflow-hidden shadow-sm animate-in fade-in"
          style={{
            backgroundColor: "var(--admin-card-bg)",
            borderColor: "var(--admin-card-border)",
          }}
        >
          <div
            className="p-4 border-b"
            style={{
              borderColor: "var(--admin-table-border)",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
            }}
          >
            <h3
              className="font-bold flex items-center gap-2"
              style={{ color: "#ef4444" }}
            >
              <ShieldAlert size={20} /> Pending Actions
            </h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead
              className="text-xs uppercase font-semibold"
              style={{
                backgroundColor: "var(--admin-table-header-bg)",
                color: "var(--admin-text-secondary)",
              }}
            >
              <tr>
                <th className="px-6 py-4">Report Details</th>
                <th className="px-6 py-4">Reporter</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Decision</th>
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: "var(--admin-table-border)" }}
            >
              {loading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center"
                    style={{ color: "var(--admin-text-secondary)" }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center"
                    style={{ color: "var(--admin-text-secondary)" }}
                  >
                    No pending user reports. Good job!
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr
                    key={report.reportId}
                    className="transition-colors"
                    style={{ borderBottomColor: "var(--admin-table-border)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--admin-table-row-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={
                            report.targetAvatar ||
                            `https://ui-avatars.com/api/?name=${report.targetName}`
                          }
                          size={10}
                        />
                        <div>
                          {/* SHOW DISPLAY NAME HERE */}
                          <div
                            className="font-bold text-base"
                            style={{ color: "var(--admin-text-primary)" }}
                          >
                            {report.targetName || "Unknown User"}
                          </div>
                          <div
                            className="text-xs mb-1"
                            style={{ color: "var(--admin-text-secondary)" }}
                          >
                            @{report.targetUsername || "username"}
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <span className="p-1 bg-red-100 text-red-600 rounded">
                              <AlertTriangle size={14} />
                            </span>
                            <span className="font-medium text-red-600 text-sm">
                              Reason: {report.reason}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={`https://ui-avatars.com/api/?name=${report.fromUser}`}
                          size={6}
                        />
                        <span
                          className="font-medium"
                          style={{ color: "var(--admin-text-primary)" }}
                        >
                          {report.fromUser}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ color: "var(--admin-text-secondary)" }}
                    >
                      {report.createdAt
                        ? formatDistanceToNow(new Date(report.createdAt)) +
                          " ago"
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleRejectReport(report.reportId)}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg transition-colors text-xs font-bold border"
                          style={{
                            borderColor: "var(--admin-card-border)",
                            color: "var(--admin-text-secondary)",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "var(--admin-table-header-bg)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                        >
                          <CheckCircle size={16} /> Ignore
                        </button>
                        <button
                          onClick={() => handleBanAndDismiss(report)}
                          className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs font-bold shadow-sm"
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
              className="absolute left-3 top-1/2 -translate-y-1/2"
              size={18}
              style={{ color: "var(--admin-text-secondary)" }}
            />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
              style={{
                backgroundColor: "var(--admin-card-bg)",
                borderColor: "var(--admin-card-border)",
                color: "var(--admin-text-primary)",
              }}
            />
          </div>

          <div
            className="rounded-xl border overflow-hidden shadow-sm animate-in fade-in"
            style={{
              backgroundColor: "var(--admin-card-bg)",
              borderColor: "var(--admin-card-border)",
            }}
          >
            <table className="w-full text-left text-sm">
              <thead
                className="text-xs uppercase font-semibold"
                style={{
                  backgroundColor: "var(--admin-table-header-bg)",
                  color: "var(--admin-text-secondary)",
                }}
              >
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody
                className="divide-y"
                style={{ borderColor: "var(--admin-table-border)" }}
              >
                {filteredUsers.map((user) => (
                  <tr
                    key={user.userId}
                    className="transition-colors"
                    style={{ borderBottomColor: "var(--admin-table-border)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--admin-table-row-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td className="px-6 py-4 flex items-center gap-3">
                      <Avatar
                        src={`https://ui-avatars.com/api/?name=${user.username}`}
                        size={9}
                      />
                      <div>
                        <div
                          className="font-semibold"
                          style={{ color: "var(--admin-text-primary)" }}
                        >
                          {user.username}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "var(--admin-text-secondary)" }}
                        >
                          {user.email || "No email"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold`}
                        style={{
                          backgroundColor:
                            user.role === "admin"
                              ? "rgba(147, 51, 234, 0.1)"
                              : "rgba(75, 85, 99, 0.1)",
                          color:
                            user.role === "admin"
                              ? "#9333ea"
                              : "var(--admin-text-secondary)",
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isBanned ? (
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold flex items-center w-fit gap-1"
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            color: "#b91c1c",
                          }}
                        >
                          <XCircle size={12} /> Banned
                        </span>
                      ) : (
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold flex items-center w-fit gap-1"
                          style={{
                            backgroundColor: "rgba(34, 197, 94, 0.1)",
                            color: "#15803d",
                          }}
                        >
                          <UserCheck size={12} /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role !== "admin" && (
                        <button
                          onClick={() => handleBanToggle(user)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border`}
                          style={{
                            backgroundColor: "transparent",
                            borderColor: user.isBanned
                              ? "rgba(34, 197, 94, 0.3)"
                              : "rgba(239, 68, 68, 0.3)",
                            color: user.isBanned ? "#16a34a" : "#dc2626",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              user.isBanned
                                ? "rgba(34, 197, 94, 0.1)"
                                : "rgba(239, 68, 68, 0.1)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                        >
                          {user.isBanned ? "Unban User" : "Ban User"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
