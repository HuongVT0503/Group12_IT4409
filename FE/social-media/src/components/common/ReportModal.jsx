import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import Button from "./ButtonComponent";
import TextAreaField from "./TextAreaField";
import { submitReport } from "../../services/userService";
import { createPortal } from "react-dom";

export default function ReportModal({ isOpen, onClose, targetId, targetType }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setLoading(true);
    try {
      await submitReport({ targetId, targetType, reason });
      alert("Thank you. We have received your report.");
      onClose();
      setReason("");
    } catch (error) {
      console.error(error);
      alert("Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      style={{ backgroundColor: "var(--modal-overlay)" }}
      className="fixed inset-0 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in z-[9999]"
    >
      <div
        style={{ backgroundColor: "var(--modal-bg)" }}
        className="rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div
          style={{
            backgroundColor: "var(--modal-header-bg)",
            borderColor: "var(--modal-border)",
          }}
          className="p-4 border-b flex justify-between items-center"
        >
          <h3
            style={{ color: "var(--modal-report-icon)" }}
            className="font-bold flex items-center gap-2"
          >
            <AlertTriangle size={20} /> Report {targetType}
          </h3>
          <button
            onClick={onClose}
            style={{ color: "var(--modal-text-secondary)" }}
            className="p-1 hover:[background:var(--modal-hover-bg)] rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p
            style={{ color: "var(--modal-text-secondary)" }}
            className="text-sm mb-4"
          >
            Please describe why you are reporting this{" "}
            {targetType.toLowerCase()}. This helps us keep the community safe.
          </p>

          <TextAreaField
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Harassment, spam, inappropriate content..."
            rows={4}
            className="mb-6"
            required
          />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className=" rounded-sm px-2 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="rounded-sm px-2 py-2"
            >
              Submit Report
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
