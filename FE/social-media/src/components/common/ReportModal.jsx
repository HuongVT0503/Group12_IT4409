import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import Button from "./ButtonComponent";
import TextAreaField from "./TextAreaField";
import { submitReport } from "../../services/userService";
import {createPortal} from "react-dom";

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

  return createPortal (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-red-600 flex items-center gap-2">
            <AlertTriangle size={20} /> Report {targetType}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Please describe why you are reporting this {targetType.toLowerCase()}. 
            This helps us keep the community safe.
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
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading} className="bg-red-600 hover:bg-red-700 border-red-600">
              Submit Report
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}