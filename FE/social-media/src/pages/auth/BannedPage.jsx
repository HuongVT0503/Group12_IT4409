import { ShieldAlert, LogOut } from "lucide-react";
import Button from "../../components/common/ButtonComponent";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function BannedPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={40} />
        </div>
        
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Account Suspended</h1>
        <p className="text-gray-600 mb-6">
          Your account has been locked due to a violation of our Community Guidelines. 
          You can no longer access the feed or interact with other users.
        </p>

        <div className="bg-gray-100 rounded-lg p-4 mb-6 text-sm text-gray-500 text-left">
          <p className="font-semibold mb-1">Common reasons:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Posting spam or harmful content</li>
            <li>Harassment or bullying</li>
            <li>Impersonating others</li>
          </ul>
        </div>

        <Button onClick={handleLogout} variant="outline" className="w-full gap-2 justify-center border-red-200 text-red-600 hover:bg-red-50">
          <LogOut size={18} />
          Sign Out
        </Button>
      </div>
    </div>
  );
}