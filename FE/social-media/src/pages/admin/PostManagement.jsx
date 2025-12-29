import { useEffect, useState } from "react";
import {
  getReports,
  adminDeletePost,
  dismissReport,
} from "../../services/adminService";
import {
  Trash2,
  CheckCircle,
  AlertTriangle,
  //FileText,
  Eye,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Avatar from "../../components/common/Avatar";
import AdminPostPreviewModal from "../../components/admin/AdminPostPreviewModal";

export default function PostManagement() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewPostId, setPreviewPostId] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await getReports();
      setReports(res.data.filter((r) => r.targetType === "Post"));
    } catch (error) {
      console.error("Failed to fetch reports", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (report) => {
    if (
      !confirm(
        "Are you sure you want to hard delete this post? It cannot be undone."
      )
    )
      return;
    try {
      await adminDeletePost(report.targetId);
      //remove all reports
      setReports((prev) => prev.filter((r) => r.targetId !== report.targetId));
    } catch (error) {
      console.log(error);
      alert("Failed to delete post. It might already be deleted.");
    }
  };

  const handleDismiss = async (reportId) => {
    try {
      await dismissReport(reportId);
      setReports((prev) => prev.filter((r) => r.reportId !== reportId));
    } catch (error) {
      console.log(error);
      alert("Failed to dismiss report");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--admin-text-primary)" }}
        >
          Post Management
        </h1>
        <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
          Review reported content and remove violations.
        </p>
      </div>

      <div
        className="rounded-xl border overflow-hidden shadow-sm"
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
            <AlertTriangle size={20} /> Reported Posts
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
              <th className="px-6 py-4 text-right">Actions</th>
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
                  No reported posts. Clean feed!
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
                  {/*Report Details */}
                  <td className="px-6 py-4 align-top w-1/4">
                    <div
                      className="flex items-center gap-2 font-bold mb-1"
                      style={{ color: "#ef4444" }}
                    >
                      <AlertTriangle size={16} /> {report.reason}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--admin-text-secondary)" }}
                    >
                      Reported:{" "}
                      {report.createdAt
                        ? formatDistanceToNow(new Date(report.createdAt)) +
                          " ago"
                        : "Unknown"}
                    </div>
                    <div
                      className="text-xs mt-1 font-mono"
                      style={{ color: "var(--admin-text-secondary)" }}
                    >
                      ID: {report.targetId}
                    </div>
                  </td>

                  {/*Reporter */}
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={`https://ui-avatars.com/api/?name=${report.fromUser}`}
                        size={8}
                      />
                      <div>
                        <div
                          className="font-medium"
                          style={{ color: "var(--admin-text-primary)" }}
                        >
                          {report.fromUser}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "var(--admin-text-secondary)" }}
                        >
                          Reporter
                        </div>
                      </div>
                    </div>
                  </td>

                  {/*Actions */}
                  <td className="px-6 py-4 text-right align-top">
                    <div className="flex justify-end gap-2 flex-col lg:flex-row">
                      {/* View Button */}
                      <button
                        onClick={() => setPreviewPostId(report.targetId)}
                        className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors text-xs font-bold border cursor-pointer"
                        style={{
                          backgroundColor: "rgba(59, 130, 246, 0.1)",
                          color: "#2563eb",
                          borderColor: "rgba(59, 130, 246, 0.3)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "rgba(59, 130, 246, 0.2)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "rgba(59, 130, 246, 0.1)")
                        }
                        title="View Full Post"
                      >
                        <Eye size={16} /> View
                      </button>

                      <button
                        onClick={() => handleDismiss(report.reportId)}
                        className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors hover:bg-gray-700 text-xs font-bold border cursor-pointer"
                        style={{
                          color: "var(--admin-text-secondary)",
                          borderColor: "#404a5aff",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "var(--admin-table-header-bg)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "transparent")
                        }
                        title="Keep Post & Close Report"
                      >
                        <CheckCircle size={16} /> Ignore
                      </button>

                      <button
                        onClick={() => handleDeletePost(report)}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs font-bold shadow-sm cursor-pointer"
                        title="Hard Delete Post"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminPostPreviewModal
        isOpen={!!previewPostId}
        onClose={() => setPreviewPostId(null)}
        postId={previewPostId}
      />
    </div>
  );
}
