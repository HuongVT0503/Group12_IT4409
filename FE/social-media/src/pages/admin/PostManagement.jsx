import { useEffect, useState } from "react";
import {
  getReports,
  deletePost,
  dismissReport,
} from "../../services/adminService";
import { Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function PostManagement() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await getReports();
      setReports(res.data);
    } catch (error) {
      console.error("Failed to fetch reports", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (report) => {
    if (!confirm("Are you sure you want to force delete this content?")) return;
    try {
      await deletePost(report.targetId);
      //remove all reports related to this target
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reported Content</h1>
          <p className="text-gray-500 text-sm">
            Review user reports and take action.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
            <tr>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4">Reporter</th>
              <th className="px-6 py-4">Target Type</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-400">
                  No pending reports.
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.reportId} className="hover:bg-gray-50/80">
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2 text-red-600 font-medium">
                      <AlertTriangle size={16} /> {report.reason}
                    </span>
                    <div className="text-xs text-gray-400 mt-1">
                      ID: {report.targetId}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {report.fromUser}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        report.targetType === "Post"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {report.targetType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {report.createdAt
                      ? formatDistanceToNow(new Date(report.createdAt)) + " ago"
                      : "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleDismiss(report.reportId)}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Dismiss Report"
                      >
                        <CheckCircle size={18} />
                      </button>
                      {report.targetType === "Post" && (
                        <button
                          onClick={() => handleDeletePost(report)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Content"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
