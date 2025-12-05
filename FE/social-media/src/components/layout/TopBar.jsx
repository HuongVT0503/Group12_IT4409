//mobile header //llogo, search, notification, profile

import logo from "../../assets/img/logo/logo.png";
import { Search, Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function TopBar() {
  const {user,logout}=useAuth;
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
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-3 lg:gap-6">
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <Bell size={24} />
            <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
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