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
        <h1 className="text-2xl font-bold text-gray-800">Post Management</h1>
        <p className="text-gray-500 text-sm">
          Review reported content and remove violations.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 bg-red-50/50">
          <h3 className="font-bold text-red-800 flex items-center gap-2">
            <AlertTriangle size={20} /> Reported Posts
          </h3>
        </div>

        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
            <tr>
              <th className="px-6 py-4">Report Details</th>
              
              <th className="px-6 py-4">Reporter</th>
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
            ) : reports.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="px-6 py-12 text-center text-gray-400"
                >
                  No reported posts. Clean feed!
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.reportId} className="hover:bg-gray-50/80">
                  {/*Report Details */}
                  <td className="px-6 py-4 align-top w-1/4">
                    <div className="flex items-center gap-2 text-red-600 font-bold mb-1">
                      <AlertTriangle size={16} /> {report.reason}
                    </div>
                    <div className="text-xs text-gray-400">
                      Reported:{" "}
                      {report.createdAt
                        ? formatDistanceToNow(new Date(report.createdAt)) +
                          " ago"
                        : "Unknown"}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 font-mono">
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
                        <div className="font-medium text-gray-900">
                          {report.fromUser}
                        </div>
                        <div className="text-xs text-gray-400">Reporter</div>
                      </div>
                    </div>
                  </td>

                  {/*Actions */}
                  <td className="px-6 py-4 text-right align-top">
                    <div className="flex justify-end gap-2 flex-col lg:flex-row">
                      {/* View Button */}
                      <button
                        onClick={() => setPreviewPostId(report.targetId)}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-xs font-bold border border-blue-200"
                        title="View Full Post"
                      >
                        <Eye size={16} /> View
                      </button>

                      <button
                        onClick={() => handleDismiss(report.reportId)}
                        className="flex items-center justify-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-xs font-bold border border-gray-200"
                        title="Keep Post & Close Report"
                      >
                        <CheckCircle size={16} /> Ignore
                      </button>

                      <button
                        onClick={() => handleDeletePost(report)}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs font-bold shadow-sm"
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
