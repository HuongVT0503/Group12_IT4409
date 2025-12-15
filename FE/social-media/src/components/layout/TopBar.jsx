//mobile header //llogo, search, notification, profile

import logo from "../../assets/img/logo/logo.png";
import { Search, Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {useState} from "react";

//mock noti
const MOCK_NOTIFICATIONS = [
  { id: 1, text: "Sarah liked your post.", time: "2m ago", read: false },
  { id: 2, text: "John commented: 'Great shot!'", time: "1h ago", read: false },
  { id: 3, text: "Welcome to SocioICT!", time: "1d ago", read: true },
];

//

export default function TopBar() {
  const {user,logout}=useAuth();
  
  const [showNoti, setShowNoti] = useState(false);
  const [notis] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notis.filter(n => !n.read).length;

  return (
    <header className="fixed top-0 left-0 w-full bg-white h-16 lg:h-20 border-b border-gray-100 z-50 px-4 lg:px-10 flex items-center justify-between shadow-sm">
      
      {/* Logo Area */}
      <div className="flex items-center gap-3">
        <img src={logo} alt="SocioICT Logo" className="h-8 w-8 lg:h-10 lg:w-10 object-contain" />
        <span className="text-2xl lg:text-3xl font-extrabold text-primary hidden sm:block">
          Social Media
        </span>
      </div>

      {/* Center Search - hidden on small mobile */}
      <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
            type="text" 
            placeholder="Search for friends..." 
            className="w-full bg-gray-100 rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <div className="w-full h-10"></div>
        
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-3 lg:gap-6">
        {/* Notification Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowNoti(!showNoti)}
            className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          {showNoti && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-gray-100 font-bold text-gray-900">Notifications</div>
              <div className="max-h-[300px] overflow-y-auto">
                {notis.map(n => (
                  <div key={n.id} className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 ${!n.read ? 'bg-blue-50/50' : ''}`}>
                    <p className="text-sm text-gray-800">{n.text}</p>
                    <span className="text-xs text-gray-400 mt-1 block">{n.time}</span>
                  </div>
                ))}
              </div>
              <div className="p-2 text-center border-t border-gray-100">
                <button className="text-xs text-primary font-semibold hover:underline">Mark all as read</button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-full pr-4 transition-colors border border-transparent hover:border-gray-200" onClick={logout}>
          <img 
            src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.display_name || 'User'}`}
            alt="User" 
            className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover"
          />
          <span className="font-bold text-gray-700 hidden lg:block">{user?.display_name}</span>
        </div>
      </div>
    </header>
  );
}